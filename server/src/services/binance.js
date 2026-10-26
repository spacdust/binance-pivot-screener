import WebSocket from 'ws';
import { calculateDailyPivots, classifyPivotCondition } from './pivot.js';

const BINANCE_REST_BASE = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';

export class BinanceService {
  constructor() {
    this.symbolsData = new Map(); // symbol -> coinData
    this.trackedSymbols = new Set();
    this.ws = null;
    this.isWsConnected = false;
    this.listeners = new Set();
    this.lastDailySync = 0;
    this.lastHourlySync = 0;
    this.isSyncing = false;
  }

  // Subscribe callback for price/screener updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error notifying listener:', err);
      }
    }
  }

  // Helper for fetch with timeout and retries
  async safeFetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  // Step 1: Discover top USDT pairs by 24h quote volume
  async fetchTopUsdtSymbols(limit = 150) {
    try {
      console.log(`[BinanceService] Fetching 24h ticker for symbol discovery...`);
      const tickers = await this.safeFetch(`${BINANCE_REST_BASE}/ticker/24hr`);
      
      const filtered = tickers.filter(t => 
        t.symbol.endsWith('USDT') &&
        !t.symbol.includes('UPUSDT') &&
        !t.symbol.includes('DOWNUSDT') &&
        !t.symbol.includes('BEARUSDT') &&
        !t.symbol.includes('BULLUSDT') &&
        parseFloat(t.quoteVolume) > 300000 // Min $300k volume
      );

      // Sort by quote volume descending
      filtered.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
      const topSymbols = filtered.slice(0, limit);

      console.log(`[BinanceService] Selected top ${topSymbols.length} USDT pairs.`);
      return topSymbols;
    } catch (err) {
      console.error('[BinanceService] Failed to fetch top USDT symbols:', err.message);
      return [];
    }
  }

  // Step 2: Fetch 1d kline (yesterday) for Daily Pivot & 1h klines for multi-TF
  async fetchSymbolKlines(symbol) {
    try {
      // 1. Fetch yesterday's daily candle (limit=2: index 0 is yesterday, index 1 is ongoing today)
      const dailyKlines = await this.safeFetch(
        `${BINANCE_REST_BASE}/klines?symbol=${symbol}&interval=1d&limit=2`
      );

      if (!dailyKlines || dailyKlines.length < 2) {
        return null;
      }

      const prevDay = dailyKlines[0];
      const prevHigh = parseFloat(prevDay[2]);
      const prevLow = parseFloat(prevDay[3]);
      const prevClose = parseFloat(prevDay[4]);
      const pivots = calculateDailyPivots(prevHigh, prevLow, prevClose);

      // 2. Fetch last 25 1-hour candles for baseline prices (1h, 3h, 6h, 12h, 24h)
      const hourlyKlines = await this.safeFetch(
        `${BINANCE_REST_BASE}/klines?symbol=${symbol}&interval=1h&limit=25`
      );

      let open1h = null;
      let open3h = null;
      let open6h = null;
      let open12h = null;
      let open24h = null;

      if (hourlyKlines && hourlyKlines.length >= 2) {
        const len = hourlyKlines.length;
        // Candle at len - 1 is current unfinished 1h candle, len - 2 is 1h ago
        open1h = parseFloat(hourlyKlines[Math.max(0, len - 2)][1]);
        open3h = parseFloat(hourlyKlines[Math.max(0, len - 4)][1]);
        open6h = parseFloat(hourlyKlines[Math.max(0, len - 7)][1]);
        open12h = parseFloat(hourlyKlines[Math.max(0, len - 13)][1]);
        open24h = parseFloat(hourlyKlines[0][1]);
      }

      return {
        pivots,
        baselines: {
          open1h,
          open3h,
          open6h,
          open12h,
          open24h
        }
      };
    } catch (err) {
      // Silent error for single symbol to avoid log spam
      return null;
    }
  }

  // Batch fetch klines for tracked symbols with controlled concurrency
  async syncAllKlines(symbolsList) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log(`[BinanceService] Syncing klines & daily pivots for ${symbolsList.length} symbols...`);

    const batchSize = 10;
    let completed = 0;

    for (let i = 0; i < symbolsList.length; i += batchSize) {
      const batch = symbolsList.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          const symbol = typeof item === 'string' ? item : item.symbol;
          const klineData = await this.fetchSymbolKlines(symbol);
          if (klineData) {
            const existing = this.symbolsData.get(symbol) || {};
            const initialPrice = typeof item === 'object' ? parseFloat(item.lastPrice) : (existing.price || 0);
            const quoteVolume = typeof item === 'object' ? parseFloat(item.quoteVolume) : (existing.volume24h || 0);

            const momentum1h = klineData.baselines.open1h && initialPrice
              ? ((initialPrice - klineData.baselines.open1h) / klineData.baselines.open1h) * 100
              : 0;

            const pivotClassification = classifyPivotCondition(
              initialPrice,
              klineData.pivots,
              momentum1h
            );

            this.symbolsData.set(symbol, {
              symbol,
              baseAsset: symbol.replace('USDT', ''),
              quoteAsset: 'USDT',
              price: initialPrice,
              volume24h: quoteVolume,
              pivots: klineData.pivots,
              baselines: klineData.baselines,
              pivotStatus: pivotClassification,
              changes: {
                h1: Number(momentum1h.toFixed(2)),
                h3: klineData.baselines.open3h ? Number((((initialPrice - klineData.baselines.open3h) / klineData.baselines.open3h) * 100).toFixed(2)) : 0,
                h6: klineData.baselines.open6h ? Number((((initialPrice - klineData.baselines.open6h) / klineData.baselines.open6h) * 100).toFixed(2)) : 0,
                h12: klineData.baselines.open12h ? Number((((initialPrice - klineData.baselines.open12h) / klineData.baselines.open12h) * 100).toFixed(2)) : 0,
                h24: klineData.baselines.open24h ? Number((((initialPrice - klineData.baselines.open24h) / klineData.baselines.open24h) * 100).toFixed(2)) : 0,
              },
              lastUpdated: Date.now()
            });

            this.trackedSymbols.add(symbol);
          }
        })
      );
      completed += batch.length;
      // Small pause to be gentle with Binance API
      await new Promise(r => setTimeout(r, 60));
    }

    this.lastDailySync = Date.now();
    this.lastHourlySync = Date.now();
    this.isSyncing = false;
    console.log(`[BinanceService] Successfully synced klines for ${this.symbolsData.size} symbols.`);
    
    // Notify clients of initial data ready
    this.notifyListeners({
      type: 'FULL_SNAPSHOT',
      data: Array.from(this.symbolsData.values())
    });
  }

  // Connect to Binance WebSocket for 1-second live ticker updates
  connectWebSocket() {
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch (e) {}
    }

    console.log(`[BinanceService] Connecting to Binance WebSocket ${BINANCE_WS_URL}...`);
    this.ws = new WebSocket(BINANCE_WS_URL);

    this.ws.on('open', () => {
      console.log('[BinanceService] Connected to Binance MiniTicker WebSocket!');
      this.isWsConnected = true;
    });

    this.ws.on('message', (rawData) => {
      try {
        const miniTickers = JSON.parse(rawData.toString());
        if (!Array.isArray(miniTickers)) return;

        const updates = [];

        for (const ticker of miniTickers) {
          const { s: symbol, c: closePrice, q: quoteVolume } = ticker;
          if (!this.trackedSymbols.has(symbol)) continue;

          const coin = this.symbolsData.get(symbol);
          if (!coin || !coin.pivots || !coin.baselines) continue;

          const currentPrice = parseFloat(closePrice);
          const vol = parseFloat(quoteVolume);
          const { open1h, open3h, open6h, open12h, open24h } = coin.baselines;

          const change1h = open1h ? ((currentPrice - open1h) / open1h) * 100 : coin.changes.h1;
          const change3h = open3h ? ((currentPrice - open3h) / open3h) * 100 : coin.changes.h3;
          const change6h = open6h ? ((currentPrice - open6h) / open6h) * 100 : coin.changes.h6;
          const change12h = open12h ? ((currentPrice - open12h) / open12h) * 100 : coin.changes.h12;
          const change24h = open24h ? ((currentPrice - open24h) / open24h) * 100 : coin.changes.h24;

          const pivotStatus = classifyPivotCondition(currentPrice, coin.pivots, change1h);

          // Update cache
          coin.price = currentPrice;
          coin.volume24h = vol;
          coin.changes = {
            h1: Number(change1h.toFixed(2)),
            h3: Number(change3h.toFixed(2)),
            h6: Number(change6h.toFixed(2)),
            h12: Number(change12h.toFixed(2)),
            h24: Number(change24h.toFixed(2)),
          };
          coin.pivotStatus = pivotStatus;
          coin.lastUpdated = Date.now();

          updates.push({
            symbol,
            price: currentPrice,
            volume24h: vol,
            changes: coin.changes,
            pivotStatus
          });
        }

        if (updates.length > 0) {
          this.notifyListeners({
            type: 'TICKER_UPDATE',
            data: updates
          });
        }
      } catch (err) {
        console.error('[BinanceService] WS message parse error:', err.message);
      }
    });

    this.ws.on('error', (err) => {
      console.error('[BinanceService] WS error:', err.message);
    });

    this.ws.on('close', () => {
      console.warn('[BinanceService] WS connection closed. Reconnecting in 5s...');
      this.isWsConnected = false;
      setTimeout(() => this.connectWebSocket(), 5000);
    });
  }

  // Periodic routines
  startPeriodicSync() {
    // 1. Refresh hourly baselines every 10 minutes
    setInterval(async () => {
      if (this.trackedSymbols.size > 0 && !this.isSyncing) {
        console.log('[BinanceService] Refreshing hourly baselines...');
        await this.syncAllKlines(Array.from(this.trackedSymbols));
      }
    }, 10 * 60 * 1000);

    // 2. Check for daily UTC 00:00 rollover to recalculate Daily Pivots
    setInterval(async () => {
      const now = new Date();
      // Check if past midnight UTC and last daily sync was before UTC midnight
      if (now.getUTCHours() === 0 && now.getUTCMinutes() < 5) {
        const timeSinceSync = Date.now() - this.lastDailySync;
        if (timeSinceSync > 15 * 60 * 1000) {
          console.log('[BinanceService] UTC 00:00 rollover detected! Recalculating Daily Pivots...');
          const topSymbols = await this.fetchTopUsdtSymbols(150);
          await this.syncAllKlines(topSymbols);
        }
      }
    }, 60 * 1000);
  }

  // Get full current screener dataset
  getAllCoins() {
    return Array.from(this.symbolsData.values());
  }

  // Get single coin
  getCoin(symbol) {
    return this.symbolsData.get(symbol.toUpperCase());
  }

  // Initialize service
  async init() {
    console.log('[BinanceService] Initializing Binance Screener service...');
    const topSymbols = await this.fetchTopUsdtSymbols(150);
    await this.syncAllKlines(topSymbols);
    this.connectWebSocket();
    this.startPeriodicSync();
    console.log('[BinanceService] Binance Screener ready!');
  }
}

export const binanceService = new BinanceService();
