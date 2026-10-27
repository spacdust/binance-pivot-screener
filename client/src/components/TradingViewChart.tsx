import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Layers } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  initialInterval?: string;
  height?: string;
}

const TIMEFRAMES = [
  { label: '1m', value: '1', desc: '1 Menit' },
  { label: '5m', value: '5', desc: '5 Menit' },
  { label: '15m', value: '15', desc: '15 Menit (Standar TradingView)' },
  { label: '30m', value: '30', desc: '30 Menit' },
  { label: '1H', value: '60', desc: '1 Jam' },
  { label: '4H', value: '240', desc: '4 Jam' },
  { label: '1D', value: 'D', desc: '1 Hari' },
  { label: '1W', value: 'W', desc: '1 Minggu' },
];

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  initialInterval = '15',
  height = '520px',
}) => {
  const [activeInterval, setActiveInterval] = useState<string>(initialInterval);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Normalize symbol: ensure standard BINANCE:SYMBOL.P for Perpetual Futures
  const cleanBase = symbol.toUpperCase().replace(/USDT$/, '');
  const cleanSymbol = `${cleanBase}USDT`;
  const tvSymbol = `BINANCE:${cleanSymbol}.P`;

  // TradingView Widget Embed URL with Pivot Points Standard Study preloaded
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=${activeInterval}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=181a20&studies=${encodeURIComponent(
    '["PivotPointsStandard@tv-basicstudies"]'
  )}&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id&utm_source=binance-screener`;

  return (
    <div className="flex flex-col w-full bg-[#12151a] border border-[#2b313a] rounded-xs overflow-hidden shadow-md">
      {/* Top Toolbar: Timeframe Selector + Indicator Tag + External Links */}
      <div className="p-2 sm:px-3 sm:py-2 border-b border-[#2b313a] bg-[#181a20] flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-[#848e9c] font-medium mr-1 hidden sm:inline">Timeframe:</span>
          {TIMEFRAMES.map((tf) => {
            const isActive = activeInterval === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => {
                  if (activeInterval !== tf.value) {
                    setIsLoading(true);
                    setActiveInterval(tf.value);
                  }
                }}
                title={tf.desc}
                className={`px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#f0b90b] text-[#181a20] font-bold shadow-xs'
                    : 'bg-[#22262e] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a]'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2">
          {/* Active Indicator Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#22262e] border border-[#2b313a] text-[#f0b90b]">
            <Layers className="w-3 h-3 text-[#f0b90b]" />
            <span>Pivot Points Standard (Traditional)</span>
          </div>

          {/* Refresh Chart Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              setReloadKey((k) => k + 1);
            }}
            title="Muat ulang chart"
            className="p-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Direct TradingView Link */}
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#f0b90b] transition-colors text-[11px] font-medium cursor-pointer"
            title="Buka chart di TradingView tab baru"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">TradingView</span>
          </a>

          {/* Direct Binance Futures Link */}
          <a
            href={`https://www.binance.com/id/futures/${cleanSymbol}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] border border-[#f0b90b]/30 transition-colors text-[11px] font-bold cursor-pointer"
            title="Buka pasar live di Binance Futures"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Binance PERP</span>
          </a>
        </div>
      </div>

      {/* Chart Iframe Container */}
      <div className="relative w-full overflow-hidden bg-[#12151a]" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#12151a]/90 gap-2">
            <div className="w-6 h-6 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#848e9c] font-mono">Memuat Chart Binance TradingView...</span>
          </div>
        )}
        <iframe
          key={`${tvSymbol}-${activeInterval}-${reloadKey}`}
          src={iframeSrc}
          title={`Binance TradingView Chart ${tvSymbol}`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="fullscreen"
        />
      </div>
    </div>
  );
};
