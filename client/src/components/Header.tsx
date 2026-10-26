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
        {/* Pro Market Screener Mark */}
        <div className="flex items-center justify-center w-7 h-7 rounded-xs bg-[#181a20] border border-[#2b313a] shadow-xs">
          <svg className="w-4.5 h-4.5" viewBox="0 0 128 128" fill="none">
            {/* Scope Ring */}
            <circle cx="64" cy="64" r="46" stroke="#2b313a" strokeWidth="6" />
            <circle cx="64" cy="64" r="30" stroke="#f0b90b" strokeOpacity="0.3" strokeWidth="4" strokeDasharray="6 6" />
            {/* Reticles */}
            <path d="M64 8 L64 22 M64 106 L64 120 M8 64 L22 64 M106 64 L120 64" stroke="#f0b90b" strokeWidth="7" strokeLinecap="round" />
            {/* Candlesticks */}
            <line x1="42" y1="50" x2="42" y2="88" stroke="#f0b90b" strokeWidth="5" strokeLinecap="round" />
            <rect x="35" y="58" width="14" height="22" rx="3" fill="#f0b90b" />
            <line x1="64" y1="38" x2="64" y2="82" stroke="#0ecb81" strokeWidth="5" strokeLinecap="round" />
            <rect x="57" y="46" width="14" height="26" rx="3" fill="#0ecb81" />
            <line x1="86" y1="26" x2="86" y2="76" stroke="#0ecb81" strokeWidth="5" strokeLinecap="round" />
            <rect x="79" y="34" width="14" height="30" rx="3" fill="#0ecb81" />
            {/* Pivot Center Level */}
            <line x1="22" y1="64" x2="106" y2="64" stroke="#f0b90b" strokeWidth="4" strokeDasharray="6 6" strokeOpacity="0.85" />
            {/* Laser Trend Line */}
            <line x1="30" y1="80" x2="94" y2="26" stroke="#0ecb81" strokeWidth="5" strokeLinecap="round" />
            <circle cx="94" cy="26" r="8" fill="#0ecb81" stroke="#ffffff" strokeWidth="3" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-[#eaecef]">
            BINANCE FUTURES SCREENER
          </span>
          <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium uppercase border border-[#f0b90b]/40 text-[#f0b90b] bg-[#f0b90b]/10 rounded-xs">
            USDⓈ-M PERP
          </span>
        </div>
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
