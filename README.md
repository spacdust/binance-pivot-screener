# ⚡ Binance Coin Screener (Multi-Timeframe & Daily Pivots)

Aplikasi **Crypto Coin Screener Binance** berbasis **React + Vite + Tailwind CSS (shadcn/ui style darkmode)** dan **Node.js Express + WebSocket backend**.

Dirancang khusus untuk memfilter pergerakan harga koin Binance secara realtime berdasarkan:
1. **Perubahan Persentase Multi-Timeframe** (1 Menit, 5 Menit, 15 Menit, 30 Menit, 1 Jam, 3 Jam, 6 Jam, 12 Jam, 24 Jam)
2. **Kondisi Daily Pivot Points (Classic)**:
   - 🎯 **Area P**: Harga berkonsolidasi di sekitar Pivot Point harian
   - 🔴 **Tembus S1 ➔ Menuju S2**: *Bearish Breakdown* menembus Support 1
   - 🟢 **Memantul dari S1 ➔ Menuju P**: *Bullish Reversal* pantulan dari Support 1
   - 🚀 **Tembus R1 ➔ Menuju R2**: *Bullish Breakout* menembus Resistance 1
   - 🔥 **Tembus R2 ➔ Menuju R3**: *Super Pump* menembus Resistance 2
   - 🔻 **Tertahan di R1 ➔ Menuju P**: *Pullback* ditolak dari Resistance 1
   - 🩸 **Tembus S2 ➔ Menuju S3**: *Diskon Ekstrem / Kapitulasi* menembus Support 2
3. **Kategori Top Movers**:
   - 🌐 **Semua Koin**: Seluruh koin USDT aktif
   - 🔥 **Top Gainers**: Kenaikan persentase tertinggi (bisa per 1m, 5m, 15m, 1j, hingga 24j)
   - 🔻 **Top Losers**: Penurunan terdalam (mencari diskon & pantulan di support S1/S2)
   - ⚡ **Flash Movers**: Lonjakan kilat aktif di timeframe pendek (1m & 5m spike)
   - 💎 **Top Volume**: Likuiditas & turnover USDT 24 jam terbesar

---

## 🚀 Cara Menjalankan Proyek

### 1. Menjalankan Mode Development (Server & Client Sekaligus)
Di root folder:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API & WS**: `http://localhost:5000` dan `ws://localhost:5000/ws`

### 2. Menjalankan Testing
Menjalankan unit test pivot, kalkulasi multi-timeframe, dan validasi build client:
```bash
npm test
```

---

## 🛠️ Arsitektur & Logika Teknis

### Formula Daily Pivot Points (Classic)
Dihitung dari candlestick harian kemarin (**00:00:00 - 23:59:59 UTC**):
* $P = \frac{High_{prev} + Low_{prev} + Close_{prev}}{3}$
* $R1 = (2 \times P) - Low_{prev}$
* $S1 = (2 \times P) - High_{prev}$
* $R2 = P + (High_{prev} - Low_{prev})$
* $S2 = P - (High_{prev} - Low_{prev})$
* $R3 = High_{prev} + 2 \times (P - Low_{prev})$
* $S3 = Low_{prev} - 2 \times (High_{prev} - P)$

### Multi-Timeframe Momentum
Harga awal (*baseline open price*) disimpan untuk 1 jam, 3 jam, 6 jam, 12 jam, dan 24 jam yang lalu. Setiap ada tick harga baru dari Binance WebSocket, persentase perubahan dihitung instan:
$$\% \Delta_{Nh} = \frac{Price_{live} - Open_{Nh}}{Open_{Nh}} \times 100$$

### Tampilan & Fitur UI
* **Dark Mode Theme (shadcn/ui style)**: Palet Zinc/Slate elegan dengan aksen Emerald (Bullish), Rose (Bearish), dan Sky Blue (Pivot).
* **Live Price Flash**: Tampilan harga berkedip hijau saat naik dan merah saat turun.
* **Mini Pivot Range Visualizer**: Indikator horizontal visual posisi harga relatif terhadap $S2 \rightarrow S1 \rightarrow P \rightarrow R1 \rightarrow R2$.
* **Detail Modal**: Klik baris koin untuk melihat tabel lengkap Pivot $R3 - S3$ dan jarak persentasenya.
* **Filter Bar Interaktif**: Slider persentase, preset cepat ($< 1\%, < 2\%, < 3\%, < 5\%$), mode sideways $| \pm \% |$, dan pemilih kondisi Pivot.
