import React from 'react';
import { Activity, RefreshCw, Zap } from 'lucide-react';

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
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-extrabold text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-zinc-100 tracking-tight flex items-center gap-1.5">
                Binance Coin Screener
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                Pivot & Momentum
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Multi-Timeframe Change (1h - 24h) & Daily Pivot Points (P, S1, S2, R1, R2)
            </p>
          </div>
        </div>

        {/* Live Status and Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="text-zinc-300 font-medium">
              {isConnected ? 'Binance Live WS' : 'Connecting...'}
            </span>
            <span className="text-zinc-500 text-[11px] font-mono border-l border-zinc-800 pl-2">
              {formattedTime}
            </span>
          </div>

          {/* Active pairs pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-zinc-100 font-mono">{totalCoins}</strong> Pasang USDT
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Refresh Snapshot"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
