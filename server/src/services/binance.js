import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateDailyPivots, classifyPivotCondition } from './pivot.js';
import { dohFetch, resolveHostViaDoH } from './dohFetch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REST_MIRRORS = [
  'https://fapi.binance.com/fapi/v1',
  'https://fapi1.binance.com/fapi/v1',
  'https://fapi2.binance.com/fapi/v1',
  'https://fapi3.binance.com/fapi/v1',
  'https://fapi4.binance.com/fapi/v1',
];

const WS_MIRRORS = [
  'wss://fstream.binance.com/market/ws/!miniTicker@arr',
  'wss://fstream.binance.com/ws/!miniTicker@arr',
  'wss://fstream-auth.binance.com/market/ws/!miniTicker@arr',
  'wss://fstream1.binance.com/market/ws/!miniTicker@arr',
  'wss://fstream2.binance.com/market/ws/!miniTicker@arr',
  'wss://fstream3.binance.com/market/ws/!miniTicker@arr',
];

export class BinanceService {
  constructor() {
    this.symbolsData = new Map(); // symbol -> coinData
    this.assetLogos = new Map(); // assetCode -> logoUrl from Binance official
    this.trackedSymbols = new Set();
    this.ws = null;
    this.isWsConnected = false;
    this.listeners = new Set();
    this.lastDailySync = 0;
    this.lastHourlySync = 0;
    this.isSyncing = false;
    this.activeRestMirrorIndex = 0;
    this.activeWsMirrorIndex = 0;

    // Load pre-bundled asset logos baseline for 100% offline & instant availability
    try {
      const logosPath = path.resolve(__dirname, '../data/binance-asset-logos.json');
      if (fs.existsSync(logosPath)) {
        const raw = fs.readFileSync(logosPath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.assetLogos.set(k.toUpperCase(), v);
        }
        console.log(`[BinanceService] Loaded ${this.assetLogos.size} pre-bundled asset logos.`);
      }
    } catch (e) {
      console.warn('[BinanceService] Could not load pre-bundled asset logos:', e.message);
    }
  }

  // Fetch official Binance asset logos for 100% token logo coverage
  async fetchAssetLogos() {
    try {
      console.log('[BinanceService] Fetching official Binance asset logos...');
      const res = await dohFetch('https://www.binance.com/bapi/asset/v2/public/asset/asset/get-all-asset', { timeout: 5000 });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          for (const item of json.data) {
            if (item.assetCode && item.logoUrl) {
              this.assetLogos.set(item.assetCode.toUpperCase(), item.logoUrl);
            }
          }
          console.log(`[BinanceService] Successfully cached ${this.assetLogos.size} official Binance asset logos.`);
        }
      }
    } catch (err) {
      console.warn('[BinanceService] Failed to fetch Binance asset logos via DoH:', err.message);
    }
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

  // Resilient fetch with automatic multi-mirror failover and built-in DoH bypass
  async safeFetch(path) {
    const cleanPath = path.startsWith('http')
      ? path.replace(/^https?:\/\/[^/]+(\/api\/v3|\/fapi\/v1)?/, '')
      : (path.startsWith('/') ? path : `/${path}`);

    let lastError = null;
    const startIndex = this.activeRestMirrorIndex;

    for (let i = 0; i < REST_MIRRORS.length; i++) {
      const mirrorIndex = (startIndex + i) % REST_MIRRORS.length;
      const base = REST_MIRRORS[mirrorIndex];
      const url = `${base}${cleanPath}`;

      try {
        const res = await dohFetch(url, { timeout: 6000 });
        if (res.ok) {
          if (mirrorIndex !== this.activeRestMirrorIndex) {
            console.log(`[BinanceService] Switched active REST mirror to: ${base}`);
            this.activeRestMirrorIndex = mirrorIndex;
          }
          return await res.json();
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(`All Binance mirrors failed for ${cleanPath}: ${lastError?.message}`);
  }

  // Step 1: Discover top USDT Perpetual Futures pairs by 24h quote volume
  async fetchTopUsdtSymbols(limit = 150) {
    try {
      console.log(`[BinanceService] Discovering top USDT Perpetual Futures contracts...`);
      const validPerps = new Set();
      try {
        const exchangeInfo = await this.safeFetch('/exchangeInfo');
        if (exchangeInfo && Array.isArray(exchangeInfo.symbols)) {
          exchangeInfo.symbols
            .filter(s => s.contractType === 'PERPETUAL' && s.status === 'TRADING' && s.quoteAsset === 'USDT')
            .forEach(s => validPerps.add(s.symbol));
        }
      } catch (e) {
        console.warn('[BinanceService] Futures exchangeInfo fetch failed, using fallback filter:', e.message);
      }

      const tickers = await this.safeFetch('/ticker/24hr');
      
      const filtered = tickers.filter(t => {
        if (!t.symbol.endsWith('USDT')) return false;
        if (t.symbol.includes('_')) return false; // Exclude delivery quarterly contracts
        if (validPerps.size > 0 && !validPerps.has(t.symbol)) return false;
        return parseFloat(t.quoteVolume) > 300000;
      });

      // Sort by quote volume descending
      filtered.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
      const topSymbols = filtered.slice(0, limit);

      console.log(`[BinanceService] Selected top ${topSymbols.length} USDT Perpetual Futures contracts.`);
      return topSymbols;
    } catch (err) {
      console.error('[BinanceService] Failed to fetch top USDT Futures symbols:', err.message);
      return [];
    }
  }

  // Step 2: Fetch 1d kline for Pivot, 1w for Weekly Pivot, 1M for Monthly Pivot, 1h klines for 1h-24h, 5m, 1m
  async fetchSymbolKlines(symbol) {
    try {
      const [dailyKlines, weeklyKlines, monthlyKlines, hourlyKlines, fiveMinKlines, minuteKlines] = await Promise.all([
        this.safeFetch(`/klines?symbol=${symbol}&interval=1d&limit=2`),
        this.safeFetch(`/klines?symbol=${symbol}&interval=1w&limit=2`),
        this.safeFetch(`/klines?symbol=${symbol}&interval=1M&limit=2`),
        this.safeFetch(`/klines?symbol=${symbol}&interval=1h&limit=25`),
        this.safeFetch(`/klines?symbol=${symbol}&interval=5m&limit=2`),
        this.safeFetch(`/klines?symbol=${symbol}&interval=1m&limit=65`)
      ]);

      if (!dailyKlines || dailyKlines.length < 2) {
        return null;
      }

      // 1. Daily Pivots (based on completed yesterday 00:00 - 23:59 UTC candle)
      // Aligns with TradingView Auto resolution for 5m / 15m charts!
      const prevDay = dailyKlines[dailyKlines.length - 2];
      const prevHigh = parseFloat(prevDay[2]);
      const prevLow = parseFloat(prevDay[3]);
      const prevClose = parseFloat(prevDay[4]);
      const pivots = calculateDailyPivots(prevHigh, prevLow, prevClose);

      // 2. Weekly Pivots (based on completed last week's 1W candle)
      // Aligns with TradingView Auto resolution for 1H chart!
      let pivotsWeekly = pivots;
      if (weeklyKlines && weeklyKlines.length >= 2) {
        const prevWeek = weeklyKlines[weeklyKlines.length - 2];
        const wHigh = parseFloat(prevWeek[2]);
        const wLow = parseFloat(prevWeek[3]);
        const wClose = parseFloat(prevWeek[4]);
        if (!isNaN(wHigh) && !isNaN(wLow) && !isNaN(wClose)) {
          pivotsWeekly = calculateDailyPivots(wHigh, wLow, wClose);
        }
      }

      // 3. Monthly Pivots (based on completed last month's 1M candle)
      // Aligns with TradingView Auto resolution for 1D chart!
      let pivotsMonthly = pivotsWeekly;
      if (monthlyKlines && monthlyKlines.length >= 2) {
        const prevMonth = monthlyKlines[monthlyKlines.length - 2];
        const mHigh = parseFloat(prevMonth[2]);
        const mLow = parseFloat(prevMonth[3]);
        const mClose = parseFloat(prevMonth[4]);
        if (!isNaN(mHigh) && !isNaN(mLow) && !isNaN(mClose)) {
          pivotsMonthly = calculateDailyPivots(mHigh, mLow, mClose);
        }
      }

      // 4. 1H Pivots (based on completed previous 1-hour candle)
      let pivots1h = null;
      let open1h = null;
      let open3h = null;
      let open6h = null;
      let open12h = null;
      let open24h = null;

      if (hourlyKlines && hourlyKlines.length >= 2) {
        const len = hourlyKlines.length;
        const prev1h = hourlyKlines[len - 2];
        const h1High = parseFloat(prev1h[2]);
        const h1Low = parseFloat(prev1h[3]);
        const h1Close = parseFloat(prev1h[4]);
        if (!isNaN(h1High) && !isNaN(h1Low) && !isNaN(h1Close)) {
          pivots1h = calculateDailyPivots(h1High, h1Low, h1Close);
        }

        open1h = parseFloat(hourlyKlines[Math.max(0, len - 2)][1]);
        open3h = parseFloat(hourlyKlines[Math.max(0, len - 4)][1]);
        open6h = parseFloat(hourlyKlines[Math.max(0, len - 7)][1]);
        open12h = parseFloat(hourlyKlines[Math.max(0, len - 13)][1]);
        open24h = parseFloat(hourlyKlines[0][1]);
      }

      // 5. 5M Pivots (based on completed previous 5-minute candle)
      let pivots5m = null;
      if (fiveMinKlines && fiveMinKlines.length >= 2) {
        const prev5m = fiveMinKlines[fiveMinKlines.length - 2];
        const m5High = parseFloat(prev5m[2]);
        const m5Low = parseFloat(prev5m[3]);
        const m5Close = parseFloat(prev5m[4]);
        if (!isNaN(m5High) && !isNaN(m5Low) && !isNaN(m5Close)) {
          pivots5m = calculateDailyPivots(m5High, m5Low, m5Close);
        }
      }

      // Multi-timeframe minute baselines (1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55m)
      let open1m = null;
      let open5m = null;
      let open10m = null;
      let open15m = null;
      let open20m = null;
      let open25m = null;
      let open30m = null;
      let open35m = null;
      let open40m = null;
      let open45m = null;
      let open50m = null;
      let open55m = null;

      if (minuteKlines && minuteKlines.length >= 2) {
        const mLen = minuteKlines.length;
        const getOpen = (min) => {
          const idx = mLen - 1 - min;
          return idx >= 0 ? parseFloat(minuteKlines[idx][1]) : null;
        };

        open1m = getOpen(1);
        open5m = getOpen(5);
        open10m = getOpen(10);
        open15m = getOpen(15);
        open20m = getOpen(20);
        open25m = getOpen(25);
        open30m = getOpen(30);
        open35m = getOpen(35);
        open40m = getOpen(40);
        open45m = getOpen(45);
        open50m = getOpen(50);
        open55m = getOpen(55);
      }

      return {
        pivots,
        pivotsWeekly,
        pivotsMonthly,
        pivots1h,
        pivots5m,
        baselines: {
          open1m,
          open5m,
          open10m,
          open15m,
          open20m,
          open25m,
          open30m,
          open35m,
          open40m,
          open45m,
          open50m,
          open55m,
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
            const momentum5m = klineData.baselines.open5m && initialPrice
              ? ((initialPrice - klineData.baselines.open5m) / klineData.baselines.open5m) * 100
              : 0;

            const pivotClassification = classifyPivotCondition(
              initialPrice,
              klineData.pivots,
              momentum1h
            );

            const pivotClassificationWeekly = klineData.pivotsWeekly
              ? classifyPivotCondition(initialPrice, klineData.pivotsWeekly, momentum1h)
              : pivotClassification;

            const pivotClassificationMonthly = klineData.pivotsMonthly
              ? classifyPivotCondition(initialPrice, klineData.pivotsMonthly, momentum1h)
              : pivotClassificationWeekly;

            const pivotClassification1h = klineData.pivots1h
              ? classifyPivotCondition(initialPrice, klineData.pivots1h, momentum1h)
              : null;

            const pivotClassification5m = klineData.pivots5m
              ? classifyPivotCondition(initialPrice, klineData.pivots5m, momentum5m)
              : null;

            const calcPct = (openVal, def = 0) => {
              if (!openVal) return def;
              return Number((((initialPrice - openVal) / openVal) * 100).toFixed(2));
            };

            const baseAsset = symbol.replace(/USDT$/, '');
            const cleanBase = baseAsset.replace(/^1000+/, '');
            const logoUrl = this.assetLogos.get(baseAsset) || this.assetLogos.get(cleanBase) || null;
            this.symbolsData.set(symbol, {
              symbol,
              baseAsset,
              quoteAsset: 'USDT',
              marketType: 'PERP',
              contractType: 'PERPETUAL',
              logoUrl,
              price: initialPrice,
              volume24h: quoteVolume,
              pivots: klineData.pivots,
              pivotsWeekly: klineData.pivotsWeekly,
              pivotsMonthly: klineData.pivotsMonthly,
              pivots1h: klineData.pivots1h,
              pivots5m: klineData.pivots5m,
              baselines: klineData.baselines,
              pivotStatus: pivotClassification,
              pivotStatusWeekly: pivotClassificationWeekly,
              pivotStatusMonthly: pivotClassificationMonthly,
              pivotStatus1h: pivotClassification1h,
              pivotStatus5m: pivotClassification5m,
              changes: {
                m1: calcPct(klineData.baselines.open1m),
                m5: calcPct(klineData.baselines.open5m),
                m10: calcPct(klineData.baselines.open10m),
                m15: calcPct(klineData.baselines.open15m),
                m20: calcPct(klineData.baselines.open20m),
                m25: calcPct(klineData.baselines.open25m),
                m30: calcPct(klineData.baselines.open30m),
                m35: calcPct(klineData.baselines.open35m),
                m40: calcPct(klineData.baselines.open40m),
                m45: calcPct(klineData.baselines.open45m),
                m50: calcPct(klineData.baselines.open50m),
                m55: calcPct(klineData.baselines.open55m),
                h1: Number(momentum1h.toFixed(2)),
                h3: calcPct(klineData.baselines.open3h),
                h6: calcPct(klineData.baselines.open6h),
                h12: calcPct(klineData.baselines.open12h),
                h24: calcPct(klineData.baselines.open24h),
              },
              lastUpdated: Date.now()
            });

            this.trackedSymbols.add(symbol);
          }
        })
      );
      completed += batch.length;
      
      // Progressive broadcast: notify clients so coins appear immediately!
      if (this.symbolsData.size > 0 && (completed === 5 || completed % 15 === 0 || completed === symbolsList.length)) {
        this.notifyListeners({
          type: 'FULL_SNAPSHOT',
          data: Array.from(this.symbolsData.values()),
          isPartial: completed < symbolsList.length,
          completed: this.symbolsData.size,
          total: symbolsList.length
        });
      }

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
      data: Array.from(this.symbolsData.values()),
      isPartial: false,
      completed: this.symbolsData.size,
      total: symbolsList.length
    });
  }

  // Connect to Binance WebSocket for 1-second live ticker updates
  async connectWebSocket() {
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch (e) {}
    }

    const wsUrl = WS_MIRRORS[this.activeWsMirrorIndex];
    console.log(`[BinanceService] Connecting to Binance WebSocket (${wsUrl})...`);

    try {
      const urlObj = new URL(wsUrl);
      const hostname = urlObj.hostname;
      const dohIp = await resolveHostViaDoH(hostname);
      const connectHost = dohIp || hostname;
      const actualWsUrl = `wss://${connectHost}${urlObj.pathname}${urlObj.search}`;
      const agent = new https.Agent({ servername: hostname, keepAlive: true });

      this.ws = new WebSocket(actualWsUrl, {
        agent,
        servername: hostname,
        headers: {
          Host: hostname,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    } catch (err) {
      console.warn(`[BinanceService] Failed DoH WebSocket init, falling back to direct URL:`, err.message);
      this.ws = new WebSocket(wsUrl);
    }

    this.ws.on('open', () => {
      console.log(`[BinanceService] Connected to Binance MiniTicker WebSocket! (${wsUrl})`);
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
          const {
            open1m, open5m, open10m, open15m, open20m, open25m, open30m, open35m, open40m, open45m, open50m, open55m,
            open1h, open3h, open6h, open12h, open24h
          } = coin.baselines;

          const calcChange = (openVal, oldVal = 0) => {
            if (!openVal) return oldVal;
            return ((currentPrice - openVal) / openVal) * 100;
          };

          const change1m = calcChange(open1m, coin.changes?.m1 || 0);
          const change5m = calcChange(open5m, coin.changes?.m5 || 0);
          const change10m = calcChange(open10m, coin.changes?.m10 || 0);
          const change15m = calcChange(open15m, coin.changes?.m15 || 0);
          const change20m = calcChange(open20m, coin.changes?.m20 || 0);
          const change25m = calcChange(open25m, coin.changes?.m25 || 0);
          const change30m = calcChange(open30m, coin.changes?.m30 || 0);
          const change35m = calcChange(open35m, coin.changes?.m35 || 0);
          const change40m = calcChange(open40m, coin.changes?.m40 || 0);
          const change45m = calcChange(open45m, coin.changes?.m45 || 0);
          const change50m = calcChange(open50m, coin.changes?.m50 || 0);
          const change55m = calcChange(open55m, coin.changes?.m55 || 0);
          const change1h = calcChange(open1h, coin.changes?.h1 || 0);
          const change3h = calcChange(open3h, coin.changes?.h3 || 0);
          const change6h = calcChange(open6h, coin.changes?.h6 || 0);
          const change12h = calcChange(open12h, coin.changes?.h12 || 0);
          const change24h = calcChange(open24h, coin.changes?.h24 || 0);

          const pivotStatus = classifyPivotCondition(currentPrice, coin.pivots, change1h);
          const pivotStatusWeekly = coin.pivotsWeekly ? classifyPivotCondition(currentPrice, coin.pivotsWeekly, change1h) : pivotStatus;
          const pivotStatusMonthly = coin.pivotsMonthly ? classifyPivotCondition(currentPrice, coin.pivotsMonthly, change1h) : pivotStatusWeekly;
          const pivotStatus1h = coin.pivots1h ? classifyPivotCondition(currentPrice, coin.pivots1h, change1h) : null;
          const pivotStatus5m = coin.pivots5m ? classifyPivotCondition(currentPrice, coin.pivots5m, change5m) : null;

          // Update cache
          coin.price = currentPrice;
          coin.volume24h = vol;
          coin.changes = {
            m1: Number(change1m.toFixed(2)),
            m5: Number(change5m.toFixed(2)),
            m10: Number(change10m.toFixed(2)),
            m15: Number(change15m.toFixed(2)),
            m20: Number(change20m.toFixed(2)),
            m25: Number(change25m.toFixed(2)),
            m30: Number(change30m.toFixed(2)),
            m35: Number(change35m.toFixed(2)),
            m40: Number(change40m.toFixed(2)),
            m45: Number(change45m.toFixed(2)),
            m50: Number(change50m.toFixed(2)),
            m55: Number(change55m.toFixed(2)),
            h1: Number(change1h.toFixed(2)),
            h3: Number(change3h.toFixed(2)),
            h6: Number(change6h.toFixed(2)),
            h12: Number(change12h.toFixed(2)),
            h24: Number(change24h.toFixed(2)),
          };
          coin.pivotStatus = pivotStatus;
          if (pivotStatusWeekly) coin.pivotStatusWeekly = pivotStatusWeekly;
          if (pivotStatusMonthly) coin.pivotStatusMonthly = pivotStatusMonthly;
          if (pivotStatus1h) coin.pivotStatus1h = pivotStatus1h;
          if (pivotStatus5m) coin.pivotStatus5m = pivotStatus5m;
          coin.lastUpdated = Date.now();

          updates.push({
            symbol,
            price: currentPrice,
            volume24h: vol,
            changes: coin.changes,
            pivotStatus,
            pivotStatusWeekly,
            pivotStatusMonthly,
            pivotStatus1h,
            pivotStatus5m
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
      console.warn(`[BinanceService] WS error on ${wsUrl}:`, err.message);
      this.activeWsMirrorIndex = (this.activeWsMirrorIndex + 1) % WS_MIRRORS.length;
    });

    this.ws.on('close', () => {
      console.warn('[BinanceService] WS connection closed. Reconnecting in 3s...');
      this.isWsConnected = false;
      setTimeout(() => this.connectWebSocket(), 3000);
    });
  }

  // Periodic routines
  startPeriodicSync() {
    // 1. Refresh multi-timeframe baselines (1m to 24h) every 5 minutes
    setInterval(async () => {
      if (this.trackedSymbols.size > 0 && !this.isSyncing) {
        console.log('[BinanceService] Refreshing multi-timeframe baselines (1m to 24h)...');
        await this.syncAllKlines(Array.from(this.trackedSymbols));
      }
    }, 5 * 60 * 1000);

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
    try {
      console.log('[BinanceService] Initializing Binance Screener service...');
      await this.fetchAssetLogos();

      let topSymbols = [];
      let attempts = 0;
      while (topSymbols.length === 0 && attempts < 5) {
        attempts++;
        topSymbols = await this.fetchTopUsdtSymbols(150);
        if (topSymbols.length === 0 && attempts < 5) {
          console.warn(`[BinanceService] Retrying symbol discovery in 2s (attempt ${attempts}/5)...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (topSymbols.length === 0) {
        const DEFAULT_TOP_PERPS = [
          'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT',
          'AVAXUSDT', 'LINKUSDT', 'SUIUSDT', 'NEARUSDT', 'APTUSDT', 'PEPEUSDT', 'SHIBUSDT',
          'LTCUSDT', 'BCHUSDT', 'DOTUSDT', 'UNIUSDT', 'TRXUSDT', 'ATOMUSDT', 'ETCUSDT',
          'FILUSDT', 'XLMUSDT', 'INJUSDT', 'ARBUSDT', 'OPUSDT', 'TIAUSDT', 'FETUSDT',
          'RENDERUSDT', 'KASUSDT', 'STXUSDT', 'ICPUSDT', 'SEIUSDT', 'WIFUSDT', 'BONKUSDT',
          'FLOKIUSDT', 'ORDIUSDT', 'RUNEUSDT', 'AAVEUSDT', 'MKRUSDT', 'CRVUSDT', 'SANDUSDT'
        ];
        console.warn(`[BinanceService] Using fallback list of ${DEFAULT_TOP_PERPS.length} top USDT Perps.`);
        topSymbols = DEFAULT_TOP_PERPS;
      }

      await this.syncAllKlines(topSymbols);
      this.connectWebSocket();
      this.startPeriodicSync();
      console.log('[BinanceService] Binance Screener ready!');
    } catch (err) {
      console.error('[BinanceService] Init error:', err);
    }
  }
}

export const binanceService = new BinanceService();
