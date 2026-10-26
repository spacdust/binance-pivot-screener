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
          <svg className="w-4 h-4" viewBox="0 0 126.611 126.611" fill="#F0B90B">
            <polygon points="38.171,53.203 62.759,28.616 87.36,53.216 101.667,38.909 62.759,0 23.864,38.896" />
            <rect x="3.644" y="53.188" transform="matrix(0.7071 0.7071 -0.7071 0.7071 48.7933 8.8106)" width="20.233" height="20.234" />
            <polygon points="38.171,73.408 62.759,97.995 87.359,73.396 101.674,87.695 101.667,87.703 62.759,126.611 23.863,87.716 23.843,87.696" />
            <rect x="101.64" y="53.189" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 235.5457 29.0503)" width="20.234" height="20.233" />
            <polygon points="77.271,63.298 77.277,63.298 62.759,48.78 52.03,59.509 52.029,59.509 50.797,60.742 48.254,63.285 48.254,63.285 48.234,63.305 48.254,63.326 62.759,77.831 77.277,63.313 77.284,63.305" />
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
