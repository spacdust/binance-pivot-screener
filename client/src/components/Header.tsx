import React from 'react';
import { Activity, RefreshCw, Volume2, VolumeX, Settings } from 'lucide-react';

interface HeaderProps {
  totalCoins: number;
  isConnected: boolean;
  onRefresh: () => void;
  lastUpdated: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCoins,
  isConnected,
  onRefresh,
  lastUpdated,
  soundEnabled = true,
  onToggleSound,
  onOpenSettings,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="h-[48px] border-b border-[#2b313a] bg-[#181a20] sticky top-0 z-30 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Market Identity */}
      <div className="flex items-center gap-3">
        {/* Pro Market Screener Mark */}
        <div className="flex items-center justify-center w-7 h-7 rounded-xs bg-[#1e2329] border border-[#2b313a] shadow-xs">
          <svg className="w-5 h-5 drop-shadow-[0_0_8px_rgba(240,185,11,0.2)]" viewBox="0 0 128 128" fill="none">
            <defs>
              <linearGradient id="hdrGold" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f0b90b" />
                <stop offset="100%" stopColor="#fcd535" />
              </linearGradient>
              <linearGradient id="hdrGreen" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ecb81" />
                <stop offset="100%" stopColor="#2ebd85" />
              </linearGradient>
            </defs>
            {/* Center Pivot Level P */}
            <line x1="18" y1="64" x2="110" y2="64" stroke="#2b313a" strokeWidth="4" strokeLinecap="round" />
            <line x1="42" y1="64" x2="86" y2="64" stroke="#f0b90b" strokeWidth="4" strokeDasharray="5 4" strokeOpacity="0.8" />
            {/* Binance Diamond Frame */}
            <path d="M64 24 L96 56 L64 88 L32 56 Z" fill="none" stroke="url(#hdrGold)" strokeWidth="10" strokeLinejoin="round" />
            {/* Focal Pivot Dot */}
            <circle cx="64" cy="56" r="7" fill="#f0b90b" />
            {/* Lower Anchor */}
            <path d="M42 98 L64 78 L86 98" fill="none" stroke="#2b313a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            {/* Breakout Surge Vector */}
            <path d="M50 44 L80 14" stroke="url(#hdrGreen)" strokeWidth="10" strokeLinecap="round" />
            <path d="M64 14 L80 14 L80 30" fill="none" stroke="url(#hdrGreen)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
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

        {/* Quick Audio Alert Toggle Button */}
        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Suara Alert 2TF: AKTIF (Klik untuk mematikan)' : 'Suara Alert 2TF: MATI (Klik untuk mengaktifkan)'}
            className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/40 hover:bg-[#0ecb81]/25'
                : 'bg-[#12151a] text-[#848e9c] border-[#2b313a] hover:bg-[#22262e] hover:text-[#eaecef]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Buka Pengaturan Alert & Tampilan"
            className="flex items-center gap-1 px-2 py-1 rounded-xs bg-[#12151a] hover:bg-[#22262e] border border-[#2b313a] text-[#848e9c] hover:text-[#f0b90b] transition-colors cursor-pointer text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">Pengaturan</span>
          </button>
        )}

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
