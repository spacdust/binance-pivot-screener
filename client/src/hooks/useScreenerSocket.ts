import { useState, useEffect, useRef, useCallback } from 'react';
import { CoinData, ScreenerStats } from '../types';

export function useScreenerSocket() {
  const [coinsMap, setCoinsMap] = useState<Map<string, CoinData>>(new Map());
  const [stats, setStats] = useState<ScreenerStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<any[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  // Fetch initial REST snapshot as fallback / fast start
  const fetchInitialData = useCallback(async () => {
    const urls = [
      'http://127.0.0.1:5000/api/screener',
      '/api/screener',
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setCoinsMap((prev) => {
              const newMap = new Map(prev);
              json.data.forEach((coin: CoinData) => {
                newMap.set(coin.symbol, coin);
              });
              return newMap;
            });
            if (json.stats) setStats(json.stats);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        // Try next URL fallback
      }
    }
  }, []);

  // Poll until data arrives (helps during initial server startup sync)
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      setCoinsMap((current) => {
        if (current.size === 0) {
          fetchInitialData();
        }
        return current;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchInitialData]);

  // Connect WebSocket
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Connect directly to local backend port 5000 for zero-latency direct socket
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '127.0.0.1:5000'
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        console.log('[WS Hook] Connected to screener WebSocket');
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);
          setLastMessageTime(Date.now());

          if (message.type === 'FULL_SNAPSHOT') {
            if (message.data && Array.isArray(message.data) && message.data.length > 0) {
              setCoinsMap((prev) => {
                const newMap = new Map(prev);
                message.data.forEach((coin: CoinData) => {
                  newMap.set(coin.symbol, coin);
                });
                return newMap;
              });
              setIsLoading(false);
            }
          } else if (message.type === 'TICKER_UPDATE') {
            // Buffer updates to batch re-renders smoothly (every 150ms)
            pendingUpdatesRef.current.push(...message.data);

            if (!flushTimerRef.current) {
              flushTimerRef.current = window.setTimeout(() => {
                if (!isMounted) return;
                const batch = pendingUpdatesRef.current;
                pendingUpdatesRef.current = [];
                flushTimerRef.current = null;

                if (batch.length === 0) return;

                setCoinsMap((prev) => {
                  const updated = new Map(prev);
                  for (const item of batch) {
                    const existing = updated.get(item.symbol);
                    if (existing) {
                      updated.set(item.symbol, {
                        ...existing,
                        price: item.price,
                        volume24h: item.volume24h,
                        changes: item.changes,
                        pivotStatus: item.pivotStatus,
                        pivotStatus1h: item.pivotStatus1h ?? existing.pivotStatus1h,
                        pivotStatus5m: item.pivotStatus5m ?? existing.pivotStatus5m,
                        lastUpdated: Date.now()
                      });
                    }
                  }
                  return updated;
                });
              }, 150);
            }
          }
        } catch (err) {
          console.error('[WS Hook] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        console.warn('[WS Hook] Disconnected, scheduling reconnect in 3s...');
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS Hook] WebSocket error:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const coinsList = Array.from(coinsMap.values());

  return {
    coins: coinsList,
    coinsMap,
    stats,
    isConnected,
    isLoading,
    lastMessageTime,
    refreshData: fetchInitialData
  };
}
