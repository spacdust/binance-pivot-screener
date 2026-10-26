import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { binanceService } from './services/binance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    trackedCoins: binanceService.symbolsData.size,
    isBinanceWsConnected: binanceService.isWsConnected,
    isSyncing: binanceService.isSyncing,
    timestamp: Date.now()
  });
});

// Screener full list & statistics
app.get('/api/screener', (req, res) => {
  const coins = binanceService.getAllCoins();

  // Summary statistics
  const stats = {
    total: coins.length,
    under5pct24h: coins.filter(c => Math.abs(c.changes.h24) < 5).length,
    under2pct24h: coins.filter(c => Math.abs(c.changes.h24) < 2).length,
    areaP: coins.filter(c => c.pivotStatus?.condition === 'AREA_P').length,
    r1ToR2: coins.filter(c => c.pivotStatus?.condition === 'R1_TO_R2').length,
    r2ToR3: coins.filter(c => c.pivotStatus?.condition === 'R2_TO_R3').length,
    r3ToR4: coins.filter(c => c.pivotStatus?.condition === 'R3_TO_R4').length,
    r1ToP: coins.filter(c => c.pivotStatus?.condition === 'R1_TO_P').length,
    s1ToS2: coins.filter(c => c.pivotStatus?.condition === 'S1_TO_S2').length,
    s2ToS3: coins.filter(c => c.pivotStatus?.condition === 'S2_TO_S3').length,
    s3ToS4: coins.filter(c => c.pivotStatus?.condition === 'S3_TO_S4').length,
    s1ToP: coins.filter(c => c.pivotStatus?.condition === 'S1_TO_P').length,
    aboveR2: coins.filter(c => c.pivotStatus?.condition === 'ABOVE_R2' || c.pivotStatus?.condition === 'R2_TO_R3' || c.pivotStatus?.condition === 'R3_TO_R4' || c.pivotStatus?.condition === 'ABOVE_R3' || c.pivotStatus?.condition === 'ABOVE_R4').length,
    aboveR3: coins.filter(c => c.pivotStatus?.condition === 'ABOVE_R3' || c.pivotStatus?.condition === 'R3_TO_R4' || c.pivotStatus?.condition === 'ABOVE_R4').length,
    aboveR4: coins.filter(c => c.pivotStatus?.condition === 'ABOVE_R4').length,
    belowS2: coins.filter(c => c.pivotStatus?.condition === 'BELOW_S2' || c.pivotStatus?.condition === 'S2_TO_S3' || c.pivotStatus?.condition === 'S3_TO_S4' || c.pivotStatus?.condition === 'BELOW_S3' || c.pivotStatus?.condition === 'BELOW_S4').length,
    belowS3: coins.filter(c => c.pivotStatus?.condition === 'BELOW_S3' || c.pivotStatus?.condition === 'S3_TO_S4' || c.pivotStatus?.condition === 'BELOW_S4').length,
    belowS4: coins.filter(c => c.pivotStatus?.condition === 'BELOW_S4').length,
    confluence3tf: coins.filter(c => c.pivotStatus && c.pivotStatus1h && c.pivotStatus5m && (c.pivotStatus.condition === c.pivotStatus1h.condition && c.pivotStatus.condition === c.pivotStatus5m.condition)).length,
  };

  res.json({
    stats,
    data: coins,
    timestamp: Date.now()
  });
});

// Single coin detail
app.get('/api/coins/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const coin = binanceService.getCoin(symbol);
  if (!coin) {
    return res.status(404).json({ error: `Symbol ${symbol} not found` });
  }
  res.json(coin);
});

// In-memory image buffer cache for official Binance asset logos
const logoBufferCache = new Map();

// Official Binance asset logos map
app.get('/api/asset-logos', (req, res) => {
  res.json(Object.fromEntries(binanceService.assetLogos));
});

// Official Binance asset logo proxy (zero CORS, zero hotlink referer issues, RAM-cached)
app.get('/api/logo/:symbol', async (req, res) => {
  const rawSymbol = req.params.symbol.toUpperCase().replace(/USDT$/, '');
  const cleanSymbol = rawSymbol.replace(/^1000+/, '');
  const targetKey = logoBufferCache.has(rawSymbol) ? rawSymbol : cleanSymbol;

  // 1. Return from RAM cache if already downloaded
  if (logoBufferCache.has(targetKey)) {
    const cached = logoBufferCache.get(targetKey);
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.send(cached.buffer);
  }

  // 2. Lookup logo URL (supports both 1000PEPE and PEPE)
  let logoUrl = binanceService.assetLogos.get(rawSymbol) || binanceService.assetLogos.get(cleanSymbol);
  if (!logoUrl && binanceService.assetLogos.size === 0) {
    await binanceService.fetchAssetLogos();
    logoUrl = binanceService.assetLogos.get(rawSymbol) || binanceService.assetLogos.get(cleanSymbol);
  }

  if (!logoUrl) {
    return res.status(404).send('Logo not found');
  }

  try {
    const upstreamRes = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Upstream CDN error');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());

    logoBufferCache.set(symbol, { buffer, contentType });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(buffer);
  } catch (err) {
    console.warn(`[LogoProxy] Failed to fetch upstream logo for ${symbol}:`, err.message);
    res.status(502).send('Error fetching upstream logo');
  }
});

// Create HTTP and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Active clients: ${clients.size}`);

  // Send initial snapshot on connect
  const coins = binanceService.getAllCoins();
  if (coins.length > 0) {
    try {
      ws.send(JSON.stringify({
        type: 'FULL_SNAPSHOT',
        data: coins,
        timestamp: Date.now()
      }));
    } catch (e) {
      clients.delete(ws);
    }
  }

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (msg.type === 'PING' && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Active clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    clients.delete(ws);
  });
});

// Broadcast Binance updates to all connected React clients
binanceService.subscribe((payload) => {
  if (clients.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  }
});

// Serve static frontend bundle if client/dist exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server and initialize Binance service
server.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Screener Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint at ws://localhost:${PORT}/ws`);
  console.log(`===============================================`);
  await binanceService.init();
});
