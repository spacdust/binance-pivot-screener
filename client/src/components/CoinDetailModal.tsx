import React, { useState } from 'react';
import { CoinData, Pivots } from '../types';
import { X, ExternalLink, Target, TrendingUp, TrendingDown, Layers, Clock } from 'lucide-react';
import { classifyPriceZone, getConditionLabel } from '../utils/pivotConfluence';

interface CoinDetailModalProps {
  coin: CoinData | null;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({ coin, onClose }) => {
  if (!coin) return null;

  const [activePivotTf, setActivePivotTf] = useState<'daily' | '1h' | '5m'>('daily');
  const { symbol, price, pivots, pivots1h, pivots5m, changes, pivotStatus, pivotStatus1h, pivotStatus5m, baselines, volume24h } = coin;

  const currentPivots: Pivots = (
    activePivotTf === '5m' && pivots5m
      ? pivots5m
      : activePivotTf === '1h' && pivots1h
      ? pivots1h
      : pivots
  );

  const liveCond = classifyPriceZone(price, currentPivots);
  const liveDistP = Number((((price - currentPivots.P) / currentPivots.P) * 100).toFixed(2));
  const liveLabel = getConditionLabel(liveCond);

  const currentStatus = {
    distP: liveDistP,
    label: liveLabel,
    description: (
      activePivotTf === '5m' && pivotStatus5m
        ? pivotStatus5m.description
        : activePivotTf === '1h' && pivotStatus1h
        ? pivotStatus1h.description
        : pivotStatus.description
    )
  };

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const formatDist = (targetPrice: number) => {
    const dist = ((price - targetPrice) / targetPrice) * 100;
    const sign = dist > 0 ? '+' : '';
    return `${sign}${dist.toFixed(2)}%`;
  };

  const getDistColor = (targetPrice: number) => {
    const dist = price - targetPrice;
    return dist >= 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const r4Val = currentPivots.R4 ?? (currentPivots.R3 + (currentPivots.R3 - currentPivots.R2));
  const s4Val = currentPivots.S4 ?? (currentPivots.S3 - (currentPivots.S2 - currentPivots.S3));

  const pivotLevels = [
    { name: 'R4', label: 'Resistance 4 (Super Ceiling)', val: r4Val, color: 'text-[#0ecb81] font-bold', bg: 'bg-[#0ecb81]/15' },
    { name: 'R3', label: 'Resistance 3', val: currentPivots.R3, color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/10' },
    { name: 'R2', label: 'Resistance 2', val: currentPivots.R2, color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/08' },
    { name: 'R1', label: 'Resistance 1', val: currentPivots.R1, color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/05' },
    { name: 'P', label: 'Pivot Center', val: currentPivots.P, color: 'text-[#f0b90b] font-bold', bg: 'bg-[#f0b90b]/15' },
    { name: 'S1', label: 'Support 1', val: currentPivots.S1, color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/05' },
    { name: 'S2', label: 'Support 2', val: currentPivots.S2, color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/08' },
    { name: 'S3', label: 'Support 3', val: currentPivots.S3, color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/10' },
    { name: 'S4', label: 'Support 4 (Super Floor)', val: s4Val, color: 'text-[#f6465d] font-bold', bg: 'bg-[#f6465d]/15' },
  ];

  const tfList = [
    { label: '1 Menit', key: 'm1', change: changes.m1, open: baselines.open1m },
    { label: '5 Menit', key: 'm5', change: changes.m5, open: baselines.open5m },
    { label: '15 Menit', key: 'm15', change: changes.m15, open: baselines.open15m },
    { label: '30 Menit', key: 'm30', change: changes.m30, open: baselines.open30m },
    { label: '1 Jam', key: 'h1', change: changes.h1, open: baselines.open1h },
    { label: '3 Jam', key: 'h3', change: changes.h3, open: baselines.open3h },
    { label: '6 Jam', key: 'h6', change: changes.h6, open: baselines.open6h },
    { label: '12 Jam', key: 'h12', change: changes.h12, open: baselines.open12h },
    { label: '24 Jam', key: 'h24', change: changes.h24, open: baselines.open24h },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[#181a20] border border-[#2b313a] rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2b313a] flex items-center justify-between sticky top-0 bg-[#181a20] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#f0b90b]/10 border border-[#f0b90b]/30 flex items-center justify-center font-bold text-[#f0b90b] text-xs font-mono">
              {coin.baseAsset.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#eaecef]">{symbol}</h2>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-xs bg-[#12151a] border border-[#2b313a] text-[#848e9c]">
                  Spot USDT
                </span>
              </div>
              <p className="text-[11px] text-[#848e9c] font-mono">
                Vol 24j: ${(volume24h / 1e6).toFixed(2)}M USDT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.binance.com/id/trade/${coin.baseAsset}_USDT`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] transition-colors"
              title="Buka di Binance"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Price & Current Status Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#12151a] border border-[#2b313a] rounded-xs p-3">
            <div>
              <span className="text-[11px] text-[#848e9c]">Harga Terakhir:</span>
              <div className="text-xl font-bold font-mono tabular-nums text-[#eaecef] mt-0.5">
                ${formatPrice(price)}
              </div>
              <div className="text-[11px] text-[#848e9c] mt-1">
                Jarak ke Pivot P ({activePivotTf.toUpperCase()}):{' '}
                <span className={`font-mono tabular-nums font-semibold ${currentStatus.distP >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {currentStatus.distP > 0 ? '+' : ''}{currentStatus.distP}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#848e9c]">Status Pivot ({activePivotTf.toUpperCase()}):</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30">
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-[11px] text-[#848e9c] mt-1.5 leading-relaxed">
                {currentStatus.description}
              </p>
            </div>
          </div>

          {/* Multi-Timeframe Changes Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-[#848e9c] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#f0b90b]" />
              Perubahan Multi-Timeframe (1m s/d 24j)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
              {tfList.map((tf) => {
                const isPos = tf.change >= 0;
                return (
                  <div
                    key={tf.key}
                    className="p-2 bg-[#12151a] border border-[#2b313a] rounded-xs text-center"
                  >
                    <div className="text-[10px] text-[#848e9c] font-medium">{tf.label}</div>
                    <div
                      className={`text-xs sm:text-sm font-bold font-mono tabular-nums mt-0.5 ${
                        isPos ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                      }`}
                    >
                      {isPos ? '+' : ''}{tf.change}%
                    </div>
                    {tf.open && (
                      <div className="text-[9px] text-[#474d57] font-mono tabular-nums mt-0.5 truncate">
                        ${formatPrice(tf.open)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Timeframe Pivot Points Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#f0b90b]" />
                <h3 className="text-xs font-bold text-[#eaecef] uppercase tracking-wider">
                  Level Pivot Points (S4 ➔ R4)
                </h3>
                {/* Timeframe tabs: Daily, 1H, 5M */}
                <div className="flex items-center bg-[#12151a] border border-[#2b313a] rounded-xs p-0.5 ml-2">
                  <button
                    onClick={() => setActivePivotTf('daily')}
                    className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                      activePivotTf === 'daily'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setActivePivotTf('1h')}
                    className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                      activePivotTf === '1h'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                  >
                    1 Jam
                  </button>
                  <button
                    onClick={() => setActivePivotTf('5m')}
                    className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                      activePivotTf === '5m'
                        ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                  >
                    5 Menit
                  </button>
                </div>
              </div>

              <span className="text-[10px] text-[#848e9c] font-mono tabular-nums">
                Basis Candle: H: ${formatPrice(currentPivots.H)} | L: ${formatPrice(currentPivots.L)} | C: ${formatPrice(currentPivots.C)}
              </span>
            </div>

            <div className="border border-[#2b313a] rounded-xs overflow-hidden divide-y divide-[#22262e]">
              {pivotLevels.map((lvl) => {
                const isClosest = Math.abs(price - lvl.val) / lvl.val < 0.005;
                return (
                  <div
                    key={lvl.name}
                    className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${lvl.bg} ${
                      isClosest ? 'ring-1 ring-white/30 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 font-mono font-bold ${lvl.color}`}>
                        {lvl.name}
                      </span>
                      <span className="text-[#eaecef]">{lvl.label}</span>
                      {isClosest && (
                        <span className="px-1.5 py-0.2 rounded-xs text-[9px] bg-white text-[#181a20] font-bold">
                          DEKAT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-5">
                      <span className="font-mono tabular-nums text-[#eaecef] font-medium">
                        ${formatPrice(lvl.val)}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-[11px] w-16 text-right ${getDistColor(
                          lvl.val
                        )}`}
                      >
                        {formatDist(lvl.val)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2b313a] bg-[#181a20] flex items-center justify-between text-xs text-[#848e9c]">
          <span>Formula Classic Standard Pivot Point (H+L+C)/3</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] border border-[#2b313a] text-[#eaecef] font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
