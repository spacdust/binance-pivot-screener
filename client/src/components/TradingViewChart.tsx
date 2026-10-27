import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  initialInterval?: string;
  height?: string;
}

const TIMEFRAMES = [
  { label: '1m', value: '1', desc: '1 Menit' },
  { label: '5m', value: '5', desc: '5 Menit' },
  { label: '15m', value: '15', desc: '15 Menit (Rekomendasi)' },
  { label: '30m', value: '30', desc: '30 Menit' },
  { label: '1H', value: '60', desc: '1 Jam' },
  { label: '4H', value: '240', desc: '4 Jam' },
  { label: '1D', value: 'D', desc: '1 Hari' },
  { label: '1W', value: 'W', desc: '1 Minggu' },
];

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  initialInterval = '15',
  height = '620px',
}) => {
  const [activeInterval, setActiveInterval] = useState<string>(initialInterval);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartFullscreen, setIsChartFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize symbol: ensure standard BINANCE:SYMBOL.P for Perpetual Futures
  const cleanBase = symbol.toUpperCase().replace(/USDT$/, '');
  const cleanSymbol = `${cleanBase}USDT`;
  const tvSymbol = `BINANCE:${cleanSymbol}.P`;

  // Keyboard escape listener for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChartFullscreen) {
        setIsChartFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChartFullscreen]);

  // Inject official TradingView Advanced Chart widget with Pivot Points Standard study
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    container.innerHTML = '';

    // Create wrapper div required by TradingView embed widget script
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    // Watch for iframe insertion to attach load listener
    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        iframe.onload = () => setIsLoading(false);
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    // Fallback timer in case iframe onLoad doesn't bubble across origins
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    // Create script element with official configuration
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: activeInterval,
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      studies: [
        'PivotPointsStandard@tv-basicstudies'
      ],
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
      container.innerHTML = '';
    };
  }, [tvSymbol, activeInterval, reloadKey]);

  return (
    <div
      className={`flex flex-col bg-[#12151a] border border-[#2b313a] rounded-xs overflow-hidden shadow-lg transition-all ${
        isChartFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none border-0'
          : 'w-full'
      }`}
    >
      {/* Top Toolbar: Timeframe Selector + Indicator Tag + External Links */}
      <div className="p-2 sm:px-3 sm:py-2 border-b border-[#2b313a] bg-[#181a20] flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#22262e] border border-[#2b313a] text-[#f0b90b]">
            <Layers className="w-3 h-3 text-[#f0b90b]" />
            <span className="font-semibold">Pivot Points Standard (Traditional)</span>
          </div>

          {/* Refresh Chart Button */}
          <button
            onClick={() => {
              setReloadKey((k) => k + 1);
            }}
            title="Muat ulang chart"
            className="p-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsChartFullscreen(!isChartFullscreen)}
            title={isChartFullscreen ? 'Keluar layar penuh (Esc)' : 'Perbesar chart layar penuh'}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#f0b90b] transition-colors text-[11px] font-medium cursor-pointer"
          >
            {isChartFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Normal (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </>
            )}
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

      {/* Chart Container */}
      <div
        className="relative w-full bg-[#12151a] overflow-hidden"
        style={{
          height: isChartFullscreen ? 'calc(100vh - 42px)' : height,
          minHeight: isChartFullscreen ? 'auto' : '520px',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#12151a]/90 gap-2">
            <div className="w-6 h-6 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#848e9c] font-mono">
              Memuat Chart Binance TradingView & Garis Pivot...
            </span>
          </div>
        )}

        {/* Dynamic TradingView mount container */}
        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
};
