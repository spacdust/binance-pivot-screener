import React from 'react';
import { CoinData } from '../types';
import { X, ExternalLink, Target, TrendingUp, TrendingDown, Layers } from 'lucide-react';

interface CoinDetailModalProps {
  coin: CoinData | null;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({ coin, onClose }) => {
  if (!coin) return null;

  const { symbol, price, pivots, changes, pivotStatus, baselines, volume24h } = coin;

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

  const pivotLevels = [
    { name: 'R3', label: 'Resistance 3', val: pivots.R3, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    { name: 'R2', label: 'Resistance 2', val: pivots.R2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { name: 'R1', label: 'Resistance 1', val: pivots.R1, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'P', label: 'Daily Pivot (Center)', val: pivots.P, color: 'text-sky-400 font-bold', bg: 'bg-sky-500/15' },
    { name: 'S1', label: 'Support 1', val: pivots.S1, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'S2', label: 'Support 2', val: pivots.S2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { name: 'S3', label: 'Support 3', val: pivots.S3, color: 'text-red-500', bg: 'bg-red-500/10' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
              {coin.baseAsset.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-zinc-100">{symbol}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-300">
                  Spot USDT
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Vol 24j: ${(volume24h / 1e6).toFixed(2)}M USDT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.binance.com/id/trade/${coin.baseAsset}_USDT`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors"
              title="Buka di Binance"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Price & Current Status Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div>
              <span className="text-xs text-zinc-400">Harga Terakhir:</span>
              <div className="text-2xl font-bold font-mono text-zinc-100 mt-0.5">
                ${formatPrice(price)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Jarak ke Pivot P:{' '}
                <span className={`font-mono font-semibold ${pivotStatus.distP >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pivotStatus.distP > 0 ? '+' : ''}{pivotStatus.distP}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-400">Status Pivot:</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {pivotStatus.label}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {pivotStatus.description}
              </p>
            </div>
          </div>

          {/* Multi-Timeframe Changes Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              Perubahan Multi-Timeframe (1m s/d 24j)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {tfList.map((tf) => {
                const isPos = tf.change >= 0;
                return (
                  <div
                    key={tf.key}
                    className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-center"
                  >
                    <div className="text-[11px] text-zinc-400 font-medium">{tf.label}</div>
                    <div
                      className={`text-sm sm:text-base font-bold font-mono mt-1 ${
                        isPos ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPos ? '+' : ''}{tf.change}%
                    </div>
                    {tf.open && (
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                        ${formatPrice(tf.open)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Pivot Points Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-sky-400" />
                Level Daily Pivot Points (Standar Harian)
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Basis Candle Kemarin: H: ${formatPrice(pivots.H)} | L: ${formatPrice(pivots.L)} | C: ${formatPrice(pivots.C)}
              </span>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80">
              {pivotLevels.map((lvl) => {
                const isClosest = Math.abs(price - lvl.val) / lvl.val < 0.005;
                return (
                  <div
                    key={lvl.name}
                    className={`flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${lvl.bg} ${
                      isClosest ? 'ring-1 ring-white/20 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 font-mono font-bold ${lvl.color}`}>
                        {lvl.name}
                      </span>
                      <span className="text-zinc-300">{lvl.label}</span>
                      {isClosest && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-white text-zinc-950 font-bold">
                          DEKAT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="font-mono text-zinc-100 font-medium">
                        ${formatPrice(lvl.val)}
                      </span>
                      <span
                        className={`font-mono text-[11px] w-16 text-right ${getDistColor(
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
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-500">
          <span>Formula Classic Standard Pivot Point (H+L+C)/3</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
