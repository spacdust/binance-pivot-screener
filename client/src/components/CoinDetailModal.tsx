import React, { useState } from 'react';
import { CoinData, Pivots } from '../types';
import { X, ExternalLink, Target, Layers, BarChart2, TrendingUp, Info, Maximize2, Minimize2 } from 'lucide-react';
import { classifyPriceZone, getConditionLabel } from '../utils/pivotConfluence';
import { CoinIcon } from './CoinIcon';
import { TradingViewChart } from './TradingViewChart';

interface CoinDetailModalProps {
  coin: CoinData | null;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({ coin, onClose }) => {
  if (!coin) return null;

  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [activePivotTf, setActivePivotTf] = useState<'daily' | 'weekly' | 'monthly' | '1h' | '5m'>('daily');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const { symbol, price, pivots, pivotsWeekly, pivotsMonthly, pivots1h, pivots5m, changes, pivotStatus, pivotStatusWeekly, pivotStatusMonthly, pivotStatus1h, pivotStatus5m, baselines, volume24h } = coin;

  const currentPivots: Pivots = (
    activePivotTf === 'weekly' && pivotsWeekly
      ? pivotsWeekly
      : activePivotTf === 'monthly' && pivotsMonthly
      ? pivotsMonthly
      : activePivotTf === '1h' && pivots1h
      ? pivots1h
      : activePivotTf === '5m' && pivots5m
      ? pivots5m
      : pivots
  );

  const liveCond = classifyPriceZone(price, currentPivots);
  const liveDistP = Number((((price - currentPivots.P) / currentPivots.P) * 100).toFixed(2));
  const liveLabel = getConditionLabel(liveCond);

  const currentStatus = {
    distP: liveDistP,
    label: liveLabel,
    description: (
      activePivotTf === 'weekly' && pivotStatusWeekly
        ? pivotStatusWeekly.description
        : activePivotTf === 'monthly' && pivotStatusMonthly
        ? pivotStatusMonthly.description
        : activePivotTf === '1h' && pivotStatus1h
        ? pivotStatus1h.description
        : activePivotTf === '5m' && pivotStatus5m
        ? pivotStatus5m.description
        : pivotStatus.description
    )
  };

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const r4Val = currentPivots.R4 ?? (currentPivots.R3 + (currentPivots.R3 - currentPivots.R2));
  const s4Val = currentPivots.S4 ?? (currentPivots.S3 - (currentPivots.S2 - currentPivots.S3));

  // Ordered strictly from highest resistance to lowest support
  const pivotLevels = [
    { name: 'R4', label: 'Resistance 4 (Super Ceiling)', val: r4Val, type: 'resistance' as const },
    { name: 'R3', label: 'Resistance 3', val: currentPivots.R3, type: 'resistance' as const },
    { name: 'R2', label: 'Resistance 2', val: currentPivots.R2, type: 'resistance' as const },
    { name: 'R1', label: 'Resistance 1', val: currentPivots.R1, type: 'resistance' as const },
    { name: 'P', label: 'Pivot Center (Keseimbangan)', val: currentPivots.P, type: 'pivot' as const },
    { name: 'S1', label: 'Support 1', val: currentPivots.S1, type: 'support' as const },
    { name: 'S2', label: 'Support 2', val: currentPivots.S2, type: 'support' as const },
    { name: 'S3', label: 'Support 3', val: currentPivots.S3, type: 'support' as const },
    { name: 'S4', label: 'Support 4 (Super Floor)', val: s4Val, type: 'support' as const },
  ];

  const tfList = [
    { label: '1m', fullLabel: '1 Menit', key: 'm1', change: changes.m1, open: baselines.open1m },
    { label: '5m', fullLabel: '5 Menit', key: 'm5', change: changes.m5, open: baselines.open5m },
    { label: '15m', fullLabel: '15 Menit', key: 'm15', change: changes.m15, open: baselines.open15m },
    { label: '30m', fullLabel: '30 Menit', key: 'm30', change: changes.m30, open: baselines.open30m },
    { label: '1j', fullLabel: '1 Jam', key: 'h1', change: changes.h1, open: baselines.open1h },
    { label: '3j', fullLabel: '3 Jam', key: 'h3', change: changes.h3, open: baselines.open3h },
    { label: '6j', fullLabel: '6 Jam', key: 'h6', change: changes.h6, open: baselines.open6h },
    { label: '12j', fullLabel: '12 Jam', key: 'h12', change: changes.h12, open: baselines.open12h },
    { label: '24j', fullLabel: '24 Jam', key: 'h24', change: changes.h24, open: baselines.open24h },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs animate-in fade-in duration-150 ${
      isMaximized ? 'p-0' : 'p-1.5 sm:p-3'
    }`}>
      <div
        className={`bg-[#181a20] border border-[#2b313a] flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
          isMaximized
            ? 'w-screen h-screen max-w-none max-h-none rounded-none border-0'
            : 'w-[98.5vw] max-w-[1780px] h-[96vh] max-h-[96vh] rounded-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-3 sm:px-4 sm:py-3 border-b border-[#2b313a] flex items-center justify-between sticky top-0 bg-[#181a20] z-20 shrink-0">
          <div className="flex items-center gap-3">
            <CoinIcon symbol={coin.baseAsset || symbol.replace(/USDT$/, '')} logoUrl={coin.logoUrl} size="lg" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#eaecef]">{symbol}</h2>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded-xs bg-[#f0b90b]/10 border border-[#f0b90b]/30 text-[#f0b90b]">
                  Futures PERP
                </span>
              </div>
              <p className="text-[11px] text-[#848e9c] font-mono">
                Volume 24j: ${(volume24h / 1e6).toFixed(2)}M USDT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.binance.com/id/futures/${coin.symbol}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] text-[#848e9c] hover:text-[#f0b90b] border border-[#2b313a] transition-colors"
              title="Buka pasar live di Binance Futures"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsMaximized((m) => !m)}
              className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] text-[#848e9c] hover:text-[#f0b90b] border border-[#2b313a] transition-colors cursor-pointer"
              title={isMaximized ? "Perkecil Tampilan" : "Perbesar Widescreen Layar Penuh (Edge-to-Edge)"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs: Live Chart vs Pivot Table */}
        <div className="px-3 sm:px-4 pt-2 pb-0 border-b border-[#2b313a] bg-[#14171d] flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xs text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'chart'
                  ? 'border-[#f0b90b] text-[#f0b90b] bg-[#181a20]'
                  : 'border-transparent text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Chart TradingView Live</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xs text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'table'
                  ? 'border-[#f0b90b] text-[#f0b90b] bg-[#181a20]'
                  : 'border-transparent text-[#848e9c] hover:text-[#eaecef] hover:bg-[#181a20]/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Tangga Level Pivot & Detail</span>
            </button>
          </div>

          {/* Quick Price & Status Indicator */}
          <div className="flex items-center gap-2 pb-1.5 text-xs font-mono">
            <span className="text-[#848e9c] hidden sm:inline">Harga Live:</span>
            <span className="font-bold text-[#eaecef] text-sm">${formatPrice(price)}</span>
            <span className={`font-semibold ${changes.h24 >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              ({changes.h24 >= 0 ? '+' : ''}{changes.h24}%)
            </span>
            <span className="hidden md:inline-block px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30">
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Body Modal */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'chart' ? (
            /* TAB 1: LIVE TRADINGVIEW CHART WITH PIVOT POINTS */
            <div className="space-y-3">
              {/* TradingView Interactive Chart */}
              <TradingViewChart
                symbol={symbol}
                initialInterval="15"
                height={isMaximized ? "calc(100vh - 240px)" : "calc(96vh - 270px)"}
              />

              {/* Pivot Levels Quick Reference Strip */}
              <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-3">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#f0b90b]" />
                    <span className="text-xs font-bold text-[#eaecef] uppercase tracking-wider">
                      Level Pivot Kunci ({activePivotTf.toUpperCase()} Traditional)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('table')}
                    className="text-[11px] text-[#f0b90b] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Lihat Tangga Lengkap (S4 - R4) & Multi-Timeframe</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  {/* S2 */}
                  <div className="bg-[#181a20] border border-[#2b313a] rounded-xs p-2">
                    <div className="flex items-center justify-between text-[10px] text-[#f6465d] font-bold">
                      <span>Support 2 (S2)</span>
                    </div>
                    <div className="text-sm font-bold text-[#eaecef] mt-0.5">${formatPrice(currentPivots.S2)}</div>
                    <div className="text-[10px] text-[#848e9c]">
                      {((currentPivots.S2 - price) / price * 100).toFixed(2)}%
                    </div>
                  </div>

                  {/* S1 */}
                  <div className="bg-[#181a20] border border-[#f6465d]/20 rounded-xs p-2">
                    <div className="flex items-center justify-between text-[10px] text-[#f6465d] font-bold">
                      <span>Support 1 (S1)</span>
                      {Math.abs((currentPivots.S1 - price) / price * 100) < 0.8 && (
                        <span className="text-[9px] px-1 bg-[#f6465d]/20 rounded-xs">DEKAT</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#eaecef] mt-0.5">${formatPrice(currentPivots.S1)}</div>
                    <div className="text-[10px] text-[#848e9c]">
                      {((currentPivots.S1 - price) / price * 100).toFixed(2)}%
                    </div>
                  </div>

                  {/* Pivot Center P */}
                  <div className="bg-[#181a20] border border-[#f0b90b]/40 rounded-xs p-2 bg-[#f0b90b]/[0.03]">
                    <div className="flex items-center justify-between text-[10px] text-[#f0b90b] font-bold">
                      <span>Pivot Center (P)</span>
                      {Math.abs(liveDistP) < 0.8 && (
                        <span className="text-[9px] px-1 bg-[#f0b90b]/20 rounded-xs">DEKAT</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#f0b90b] mt-0.5">${formatPrice(currentPivots.P)}</div>
                    <div className="text-[10px] font-bold text-[#f0b90b]">
                      {liveDistP > 0 ? `+${liveDistP}%` : `${liveDistP}%`}
                    </div>
                  </div>

                  {/* R1 */}
                  <div className="bg-[#181a20] border border-[#0ecb81]/20 rounded-xs p-2">
                    <div className="flex items-center justify-between text-[10px] text-[#0ecb81] font-bold">
                      <span>Resistance 1 (R1)</span>
                      {Math.abs((currentPivots.R1 - price) / price * 100) < 0.8 && (
                        <span className="text-[9px] px-1 bg-[#0ecb81]/20 rounded-xs">DEKAT</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#eaecef] mt-0.5">${formatPrice(currentPivots.R1)}</div>
                    <div className="text-[10px] text-[#848e9c]">
                      +{((currentPivots.R1 - price) / price * 100).toFixed(2)}%
                    </div>
                  </div>

                  {/* R2 */}
                  <div className="bg-[#181a20] border border-[#2b313a] rounded-xs p-2 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-[10px] text-[#0ecb81] font-bold">
                      <span>Resistance 2 (R2)</span>
                    </div>
                    <div className="text-sm font-bold text-[#eaecef] mt-0.5">${formatPrice(currentPivots.R2)}</div>
                    <div className="text-[10px] text-[#848e9c]">
                      +{((currentPivots.R2 - price) / price * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#2b313a] flex items-center justify-between text-[11px] text-[#848e9c] flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>Sedang berada di area:</span>
                    <span className="font-bold text-[#f0b90b]">{currentStatus.label}</span>
                  </div>
                  <div className="text-[10px] text-[#474d57]">
                    Tipe Pivot: Traditional Classic (H+L+C)/3 • Sumber Data: Binance Live Futures
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DETAILED TABLE VIEW (CARDS 1, 2, 3) */
            <div className="space-y-4">
              {/* Card 1: Ringkasan Harga & Status Pivot Terkini */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#12151a] border border-[#2b313a] rounded-xs p-3">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
                <span>Harga Terakhir (Futures PERP)</span>
                <span className="font-mono text-[10px] text-[#0ecb81] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
                  Live WebSocket
                </span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#eaecef] mt-0.5 flex items-baseline gap-2">
                <span>${formatPrice(price)}</span>
                <span className={`text-xs font-bold ${changes.h24 >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  ({changes.h24 >= 0 ? '+' : ''}{changes.h24}% / 24j)
                </span>
              </div>
              <div className="text-[11px] text-[#848e9c] mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>Jarak ke Pivot Center P ({activePivotTf.toUpperCase()}):</span>
                <span className={`font-mono tabular-nums font-semibold ${liveDistP >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {liveDistP > 0 ? `▲ +${liveDistP}% (Di atas P)` : liveDistP < 0 ? `▼ ${liveDistP}% (Di bawah P)` : '0.00% (Tepat di P)'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
                <span>Kondisi Pivot ({activePivotTf.toUpperCase()})</span>
                {/* Timeframe Switcher Tabs */}
                <div className="flex items-center bg-[#181a20] border border-[#2b313a] rounded-xs p-0.5 gap-0.5">
                  <button
                    onClick={() => setActivePivotTf('daily')}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold transition-colors ${
                      activePivotTf === 'daily'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                    title="TradingView: Chart 5m & 15m (Auto) menggunakan Pivot Daily (1D)"
                  >
                    Daily (1D)
                  </button>
                  <button
                    onClick={() => setActivePivotTf('weekly')}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold transition-colors ${
                      activePivotTf === 'weekly'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                    title="TradingView: Chart 1H (Auto) menggunakan Pivot Weekly (1W)"
                  >
                    Weekly (1W)
                  </button>
                  <button
                    onClick={() => setActivePivotTf('monthly')}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold transition-colors ${
                      activePivotTf === 'monthly'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                    title="TradingView: Chart Daily (Auto) menggunakan Pivot Monthly (1M)"
                  >
                    Monthly (1M)
                  </button>
                  <button
                    onClick={() => setActivePivotTf('1h')}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold transition-colors ${
                      activePivotTf === '1h'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                    title="Pivot dari candle 1-jam sebelumnya"
                  >
                    1H Candle
                  </button>
                  <button
                    onClick={() => setActivePivotTf('5m')}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold transition-colors ${
                      activePivotTf === '5m'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                    title="Pivot dari candle 5-menit sebelumnya"
                  >
                    5M Candle
                  </button>
                </div>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30">
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-[11px] text-[#848e9c] mt-1 leading-relaxed">
                {currentStatus.description}
              </p>
            </div>
          </div>

          {/* Card 2: Perubahan Multi-Timeframe (Tabel Rapi Tanpa Angka Terpotong) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#848e9c] uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#f0b90b]" />
                <span>Perubahan Multi-Timeframe (1m - 24j)</span>
              </div>
              <span className="text-[10px] text-[#474d57] normal-case font-normal hidden sm:inline">
                Candlestick Open vs Harga Terkini
              </span>
            </div>

            <div className="border border-[#2b313a] rounded-xs bg-[#12151a] overflow-x-auto custom-scrollbar">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2b313a] text-[#848e9c] text-[11px] bg-[#181a20]">
                    <th className="py-1.5 px-3 text-left font-medium">Metrik</th>
                    {tfList.map((tf) => (
                      <th key={tf.key} className="py-1.5 px-2 font-medium font-mono text-[11px]">
                        {tf.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22262e] font-mono text-[11px] tabular-nums">
                  <tr>
                    <td className="py-2 px-3 text-left font-sans font-medium text-[#848e9c]">
                      Perubahan
                    </td>
                    {tfList.map((tf) => {
                      const isPos = tf.change > 0;
                      const isNeg = tf.change < 0;
                      return (
                        <td
                          key={tf.key}
                          className={`py-2 px-2 font-bold ${
                            isPos ? 'text-[#0ecb81]' : isNeg ? 'text-[#f6465d]' : 'text-[#848e9c]'
                          }`}
                        >
                          {isPos ? '+' : ''}{tf.change}%
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 text-left font-sans font-medium text-[#474d57]">
                      Harga Acuan
                    </td>
                    {tfList.map((tf) => (
                      <td key={tf.key} className="py-1.5 px-2 text-[#848e9c] text-[10px]">
                        {tf.open != null ? `$${formatPrice(tf.open)}` : '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Tangga Level Pivot Points (S4 -> R4) dengan Jarak Target yang Jelas */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#848e9c]">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#eaecef]">
                <Target className="w-3.5 h-3.5 text-[#f0b90b]" />
                <span>Tangga Level Pivot ({activePivotTf.toUpperCase()})</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-[#848e9c]">
                Basis Candle: H: ${formatPrice(currentPivots.H)} | L: ${formatPrice(currentPivots.L)} | C: ${formatPrice(currentPivots.C)}
              </span>
            </div>

            <div className="border border-[#2b313a] rounded-xs bg-[#181a20] overflow-hidden overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#12151a] border-b border-[#2b313a] text-[#848e9c] text-[11px] font-medium uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3 w-16">Level</th>
                    <th className="py-2 px-3">Keterangan Level</th>
                    <th className="py-2 px-3">Harga Target</th>
                    <th className="py-2 px-3 text-right">
                      <span>Jarak dari Harga Terkini</span>
                      <span className="block text-[9px] text-[#474d57] normal-case font-normal">
                        (% Gerak yang Dibutuhkan)
                      </span>
                    </th>
                    <th className="py-2 px-3 text-right w-28">Posisi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#22262e]">
                  {(() => {
                    const rows: React.ReactNode[] = [];
                    let hasInsertedCurrentPrice = false;

                    const renderCurrentPriceBanner = () => (
                      <tr key="current-price-row" className="bg-[#f0b90b]/10 border-y-2 border-[#f0b90b]">
                        <td colSpan={5} className="py-2 px-3">
                          <div className="flex items-center justify-between font-mono text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f0b90b] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f0b90b]"></span>
                              </span>
                              <span className="font-bold text-[#f0b90b] tracking-wider text-[11px] uppercase">
                                HARGA TERKINI:
                              </span>
                              <span className="font-bold text-sm text-[#eaecef]">
                                ${formatPrice(price)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-[#848e9c] font-sans">Sedang berada di area:</span>
                              <span className="px-2 py-0.5 rounded-xs bg-[#f0b90b]/20 text-[#f0b90b] font-bold border border-[#f0b90b]/30">
                                {currentStatus.label}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );

                    // Insert Current Price Row in its exact spatial place between levels
                    pivotLevels.forEach((lvl) => {
                      if (!hasInsertedCurrentPrice && price >= lvl.val) {
                        rows.push(renderCurrentPriceBanner());
                        hasInsertedCurrentPrice = true;
                      }

                      const diff = lvl.val - price;
                      const pct = (diff / price) * 100;
                      const isAbove = diff > 0;
                      const isBelow = diff < 0;
                      const isClosest = Math.abs(pct) < 0.35;

                      rows.push(
                        <tr
                          key={lvl.name}
                          className={`transition-colors hover:bg-[#1e2329] ${
                            isClosest ? 'bg-[#22262e]/40' : ''
                          }`}
                        >
                          {/* 1. Level Badge */}
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-xs font-mono font-bold text-xs border ${
                                lvl.type === 'resistance'
                                  ? 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/30'
                                  : lvl.type === 'pivot'
                                  ? 'text-[#f0b90b] bg-[#f0b90b]/10 border-[#f0b90b]/30'
                                  : 'text-[#f6465d] bg-[#f6465d]/10 border-[#f6465d]/30'
                              }`}
                            >
                              {lvl.name}
                            </span>
                          </td>

                          {/* 2. Label & Closeness Indicator */}
                          <td className="py-2 px-3 text-[#eaecef] text-xs">
                            <div className="flex items-center gap-2">
                              <span>{lvl.label}</span>
                              {isClosest && (
                                <span className="px-1.5 py-0.2 rounded-xs text-[9px] bg-[#f0b90b] text-[#181a20] font-bold font-mono">
                                  TERDEKAT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Level Price */}
                          <td className="py-2 px-3 font-mono tabular-nums text-xs font-semibold text-[#eaecef]">
                            ${formatPrice(lvl.val)}
                          </td>

                          {/* 4. Target Distance (% Move Needed to Reach) */}
                          <td className="py-2 px-3 font-mono tabular-nums text-xs text-right">
                            <span
                              className={`font-bold inline-flex items-center gap-1 ${
                                isAbove
                                  ? 'text-[#0ecb81]'
                                  : isBelow
                                  ? 'text-[#f6465d]'
                                  : 'text-[#f0b90b]'
                              }`}
                            >
                              {isAbove ? (
                                <>
                                  <span>▲ Naik</span>
                                  <span>+{Math.abs(pct).toFixed(2)}%</span>
                                </>
                              ) : isBelow ? (
                                <>
                                  <span>▼ Turun</span>
                                  <span>-{Math.abs(pct).toFixed(2)}%</span>
                                </>
                              ) : (
                                <span>0.00% (Di Level)</span>
                              )}
                            </span>
                          </td>

                          {/* 5. Relative Position */}
                          <td className="py-2 px-3 text-right text-[11px] font-mono text-[#848e9c]">
                            {isAbove ? 'Di atas harga' : isBelow ? 'Di bawah harga' : 'Tepat di harga'}
                          </td>
                        </tr>
                      );
                    });

                    // If price is below S4
                    if (!hasInsertedCurrentPrice) {
                      rows.push(renderCurrentPriceBanner());
                    }

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Footer Modal */}
        <div className="p-3.5 sm:p-4 border-t border-[#2b313a] bg-[#181a20] flex items-center justify-between text-xs text-[#848e9c]">
          <span className="text-[11px]">
            Formula Classic Standard: P = (H+L+C)/3 | S1-S4 & R1-R4
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] border border-[#2b313a] text-[#eaecef] font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
