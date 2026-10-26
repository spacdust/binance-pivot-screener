import React from 'react';
import { Activity, RefreshCw, Zap, Radio, BarChart2 } from 'lucide-react';

interface HeaderProps {
  totalCoins: number;
  isConnected: boolean;
  onRefresh: () => void;
  lastUpdated: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalCoins,
  isConnected,
  onRefresh,
  lastUpdated,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/15 border border-amber-300/30">
            <BarChart2 className="w-5 h-5 text-zinc-950 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-zinc-100 tracking-tight flex items-center gap-1.5 font-sans">
                Binance Coin Screener
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-md font-mono">
                PRO PIVOT & MOMENTUM
              </span>
            </div>
            <p className="text-xs text-zinc-400 tracking-normal">
              Multi-Timeframe Momentum (1m - 24j) & Multi-Timeframe Pivots 5M, 1H, Daily (S4 ➔ R4)
            </p>
          </div>
        </div>

        {/* Live Status and Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs shadow-inner">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="text-zinc-200 font-medium">
              {isConnected ? 'Binance Live WS' : 'Connecting...'}
            </span>
            <span className="text-zinc-500 text-[11px] font-mono tabular-nums border-l border-zinc-800 pl-2">
              {formattedTime}
            </span>
          </div>

          {/* Active pairs pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-zinc-100 font-mono tabular-nums">{totalCoins}</strong> Pasang USDT
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Refresh Snapshot"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
