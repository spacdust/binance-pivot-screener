import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

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
    <header className="h-[48px] border-b border-[#2b313a] bg-[#181a20] sticky top-0 z-30 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Market Identity */}
      <div className="flex items-center gap-3">
        {/* Authentic Binance Diamond Mark */}
        <div className="flex items-center justify-center w-7 h-7 rounded-xs bg-[#f0b90b]/10 border border-[#f0b90b]/30">
          <svg className="w-4 h-4 text-[#f0b90b]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5L7.5 7L12 11.5L16.5 7L12 2.5Z" />
            <path d="M2.5 12L7 7.5L11.5 12L7 16.5L2.5 12Z" />
            <path d="M12 12.5L7.5 17L12 21.5L16.5 17L12 12.5Z" />
            <path d="M16.5 7.5L21.5 12L16.5 16.5L12.5 12.5L16.5 7.5Z" />
            <path d="M12 8.5L8.5 12L12 15.5L15.5 12L12 8.5Z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-[#eaecef]">
            BINANCE SCREENER
          </span>
          <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium uppercase border border-[#f0b90b]/40 text-[#f0b90b] bg-[#f0b90b]/10 rounded-xs">
            PRO PIVOT
          </span>
        </div>

        <span className="hidden lg:inline text-[11px] text-[#848e9c] border-l border-[#2b313a] pl-2.5">
          Multi-Timeframe Momentum (1m - 24j) & Pivots (5M, 1H, Daily)
        </span>
      </div>

      {/* Live Controls & Diagnostics */}
      <div className="flex items-center gap-2">
        {/* Live WS Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#12151a] border border-[#2b313a] text-xs">
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ecb81] opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'
              }`}
            />
          </span>
          <span className="text-[#eaecef] text-xs font-medium">
            {isConnected ? 'Binance Live' : 'Connecting...'}
          </span>
          <span className="text-[#848e9c] text-[11px] font-mono tabular-nums border-l border-[#2b313a] pl-2">
            {formattedTime}
          </span>
        </div>

        {/* Total USDT Pairs */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#12151a] border border-[#2b313a] text-xs text-[#848e9c]">
          <Activity className="w-3.5 h-3.5 text-[#f0b90b]" />
          <span>
            <strong className="text-[#eaecef] font-mono tabular-nums">{totalCoins}</strong> Pasang USDT
          </span>
        </div>

        {/* Snapshot Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="p-1.5 rounded-xs bg-[#12151a] hover:bg-[#22262e] border border-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
