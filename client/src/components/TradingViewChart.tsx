import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, Layers, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  initialInterval?: string;
  height?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  initialInterval = '5',
  height = '640px',
}) => {
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
  // Dependencies are strictly tvSymbol and reloadKey so user drawings are NEVER erased when changing timeframes
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
      interval: initialInterval,
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
        'PivotPointsStandard@tv-basicstudies',
        'STD;MACD',
        'RSI@tv-basicstudies'
      ],
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
      container.innerHTML = '';
    };
  }, [tvSymbol, reloadKey, initialInterval]);

  return (
    <div
      className={`flex flex-col bg-[#12151a] border border-[#2b313a] rounded-xs overflow-hidden shadow-lg transition-all ${
        isChartFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none border-0'
          : 'w-full'
      }`}
    >
      {/* Top Toolbar: Timeframe Selector Guide + Indicator Tag + External Links */}
      <div className="p-2 sm:px-3 sm:py-2 border-b border-[#2b313a] bg-[#181a20] flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
        {/* Left: Timeframe Guide to preserve drawings */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-mono bg-[#22262e] border border-[#2b313a] text-[#eaecef]">
            <span className="text-[#848e9c]">TF Default:</span>
            <span className="font-bold text-[#f0b90b]">5m</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] bg-[#f0b90b]/10 border border-[#f0b90b]/30 text-[#eaecef]">
            <Sparkles className="w-3.5 h-3.5 text-[#f0b90b] shrink-0" />
            <span>
              Ganti TF langsung di toolbar atas chart{' '}
              <span className="font-mono font-bold text-[#f0b90b] bg-[#12151a] px-1 py-0.2 rounded border border-[#f0b90b]/40">
                (5m ▾)
              </span>{' '}
              agar garis analisa tetap tersimpan!
            </span>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#22262e] border border-[#2b313a] text-[#f0b90b]">
            <Layers className="w-3 h-3 text-[#f0b90b]" />
            <span className="font-semibold">Pivot + MACD + RSI</span>
          </div>

          {/* Refresh Chart Button */}
          <button
            onClick={() => {
              setReloadKey((k) => k + 1);
            }}
            title="Muat ulang chart (Gunakan hanya jika chart error)"
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
