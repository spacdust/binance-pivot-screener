import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CoinData, FilterState, SelectedTimeframe, TopMoverCategory } from '../types';
import { PivotVisualizer } from './PivotVisualizer';
import { CoinIcon } from './CoinIcon';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Info,
  Zap,
  SlidersHorizontal,
  X,
  Layers,
  ChevronLeft
} from 'lucide-react';
import {
  checkPivotConfluence,
  classifyPriceZone,
  calculateRangePercent,
  getConditionLabel,
  getConditionTagColor,
  getPivotCode,
} from '../utils/pivotConfluence';

interface ScreenerTableProps {
  coins: CoinData[];
  selectedTimeframe: SelectedTimeframe;
  topMoverCategory?: TopMoverCategory;
  onSelectCoin: (coin: CoinData) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activeFilterCount?: number;
  filters?: FilterState;
  onFilterChange?: (updates: Partial<FilterState>) => void;
  onResetFilters?: () => void;
  confluenceCount?: number;
}

type SortField = 'symbol' | 'price' | 'volume24h' | 'm1' | 'm5' | 'm15' | 'm30' | 'h1' | 'h3' | 'h6' | 'h12' | 'h24' | 'distP' | 'distP1h' | 'distP5m';

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  coins,
  selectedTimeframe,
  topMoverCategory,
  onSelectCoin,
  isSidebarOpen = true,
  onToggleSidebar,
  activeFilterCount = 0,
  filters,
  onFilterChange,
  onResetFilters,
  confluenceCount,
}) => {
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [density, setDensity] = useState<'compact' | 'normal'>('compact');
  const [pivotMode, setPivotMode] = useState<'tradingview' | 'micro'>('tradingview');

  // Respond to Top Mover Category changes
  useEffect(() => {
    if (!topMoverCategory || topMoverCategory === 'ALL') return;
    if (topMoverCategory === 'TOP_GAINERS') {
      setSortField(selectedTimeframe);
      setSortDirection('desc');
    } else if (topMoverCategory === 'TOP_LOSERS') {
      setSortField(selectedTimeframe);
      setSortDirection('asc');
    } else if (topMoverCategory === 'FLASH_MOVERS') {
      setSortField('m5');
      setSortDirection('desc');
    } else if (topMoverCategory === 'TOP_VOLUME') {
      setSortField('volume24h');
      setSortDirection('desc');
    }
    setPage(1);
  }, [topMoverCategory, selectedTimeframe]);

  // Flash tracker for price changes
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  const [priceFlashMap, setPriceFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  useEffect(() => {
    const flashes = new Map<string, 'up' | 'down'>();
    coins.forEach((c) => {
      const prev = prevPricesRef.current.get(c.symbol);
      if (prev !== undefined && prev !== c.price) {
        flashes.set(c.symbol, c.price > prev ? 'up' : 'down');
      }
      prevPricesRef.current.set(c.symbol, c.price);
    });

    if (flashes.size > 0) {
      setPriceFlashMap(flashes);
      const timer = setTimeout(() => setPriceFlashMap(new Map()), 1100);
      return () => clearTimeout(timer);
    }
  }, [coins]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sorting logic
  const sortedCoins = useMemo(() => {
    return [...coins].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          return sortDirection === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'volume24h':
          aVal = a.volume24h;
          bVal = b.volume24h;
          break;
        case 'm1':
          aVal = a.changes.m1;
          bVal = b.changes.m1;
          break;
        case 'm5':
          aVal = a.changes.m5;
          bVal = b.changes.m5;
          break;
        case 'm15':
          aVal = a.changes.m15;
          bVal = b.changes.m15;
          break;
        case 'm30':
          aVal = a.changes.m30;
          bVal = b.changes.m30;
          break;
        case 'h1':
          aVal = a.changes.h1;
          bVal = b.changes.h1;
          break;
        case 'h3':
          aVal = a.changes.h3;
          bVal = b.changes.h3;
          break;
        case 'h6':
          aVal = a.changes.h6;
          bVal = b.changes.h6;
          break;
        case 'h12':
          aVal = a.changes.h12;
          bVal = b.changes.h12;
          break;
        case 'h24':
          aVal = a.changes.h24;
          bVal = b.changes.h24;
          break;
        case 'distP':
          aVal = pivotMode === 'tradingview'
            ? Number((((a.price - (a.pivotsMonthly?.P ?? a.pivots.P)) / (a.pivotsMonthly?.P ?? a.pivots.P)) * 100).toFixed(2))
            : a.pivotStatus.distP;
          bVal = pivotMode === 'tradingview'
            ? Number((((b.price - (b.pivotsMonthly?.P ?? b.pivots.P)) / (b.pivotsMonthly?.P ?? b.pivots.P)) * 100).toFixed(2))
            : b.pivotStatus.distP;
          break;
        case 'distP1h':
          aVal = pivotMode === 'tradingview'
            ? Number((((a.price - (a.pivotsWeekly?.P ?? a.pivots.P)) / (a.pivotsWeekly?.P ?? a.pivots.P)) * 100).toFixed(2))
            : (a.pivotStatus1h?.distP ?? 0);
          bVal = pivotMode === 'tradingview'
            ? Number((((b.price - (b.pivotsWeekly?.P ?? b.pivots.P)) / (b.pivotsWeekly?.P ?? b.pivots.P)) * 100).toFixed(2))
            : (b.pivotStatus1h?.distP ?? 0);
          break;
        case 'distP5m':
          aVal = pivotMode === 'tradingview'
            ? Number((((a.price - a.pivots.P) / a.pivots.P) * 100).toFixed(2))
            : (a.pivotStatus5m?.distP ?? 0);
          bVal = pivotMode === 'tradingview'
            ? Number((((b.price - b.pivots.P) / b.pivots.P) * 100).toFixed(2))
            : (b.pivotStatus5m?.distP ?? 0);
          break;
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [coins, sortField, sortDirection, pivotMode]);

  const totalPages = Math.ceil(sortedCoins.length / pageSize) || 1;

  // Auto-reset page if out of bounds after filter change
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedCoins = useMemo(() => {
    return sortedCoins.slice((page - 1) * pageSize, page * pageSize);
  }, [sortedCoins, page, pageSize]);

  // Active filter dismissible pills
  const activePills = useMemo(() => {
    if (!filters || !onFilterChange) return [];
    const pills: { id: string; label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery) {
      pills.push({
        id: 'search',
        label: `Cari: "${filters.searchQuery}"`,
        onRemove: () => onFilterChange({ searchQuery: '' }),
      });
    }

    if (filters.onlyConfluence) {
      pills.push({
        id: 'confluence',
        label: '⚡ 3TF Confluence',
        onRemove: () => onFilterChange({ onlyConfluence: false }),
      });
    }

    if (filters.topMoverCategory && filters.topMoverCategory !== 'ALL') {
      const labels: Record<string, string> = {
        TOP_GAINERS: 'Top Gainers',
        TOP_LOSERS: 'Top Losers',
        FLASH_MOVERS: 'Flash Spike',
        TOP_VOLUME: 'Top Volume',
      };
      pills.push({
        id: 'category',
        label: labels[filters.topMoverCategory] || filters.topMoverCategory,
        onRemove: () => onFilterChange({ topMoverCategory: 'ALL' }),
      });
    }

    if (filters.pivotCondition && filters.pivotCondition !== 'ALL') {
      pills.push({
        id: 'pivot',
        label: `Pivot: ${getConditionLabel(filters.pivotCondition)}`,
        onRemove: () => onFilterChange({ pivotCondition: 'ALL' }),
      });
    }

    if (filters.enablePercentFilter) {
      pills.push({
        id: 'percent',
        label: `${filters.filterMode === 'absolute_below' ? '|±' : '<'}${filters.maxPercent}%| (${filters.selectedTimeframe})`,
        onRemove: () => onFilterChange({ enablePercentFilter: false }),
      });
    }

    return pills;
  }, [filters, onFilterChange]);

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(4);
    if (val >= 0.0001) return val.toFixed(6);
    return val.toFixed(8);
  };

  const getConditionBadgeStyle = (tagColor: string) => {
    switch (tagColor) {
      case 'cyan':
        return 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/30';
      case 'emerald':
      case 'green':
      case 'purple':
      case 'fuchsia':
      case 'pink':
        return 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/30';
      case 'amber':
        return 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/30';
      case 'rose':
      case 'red':
        return 'bg-[#f6465d]/10 text-[#f6465d] border-[#f6465d]/30';
      default:
        return 'bg-[#22262e] text-[#848e9c] border-[#2b313a]';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#474d57] inline ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#f0b90b] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#f0b90b] inline ml-1" />
    );
  };

  const renderChangeCell = (val: number) => {
    const isPos = val > 0;
    const isNeg = val < 0;

    // Authentic Binance Spot typography
    const textColor = isPos ? 'text-[#0ecb81]' : isNeg ? 'text-[#f6465d]' : 'text-[#848e9c]';
    const highlight =
      Math.abs(val) >= 5
        ? isPos
          ? 'bg-[#0ecb81]/12 font-bold px-1 rounded-xs'
          : 'bg-[#f6465d]/12 font-bold px-1 rounded-xs'
        : 'font-medium';

    return (
      <span
        className={`inline-block text-[11px] font-mono tabular-nums ${textColor} ${highlight}`}
      >
        {isPos ? '+' : ''}{val.toFixed(2)}%
      </span>
    );
  };

  const pyRow = density === 'compact' ? 'py-1.5' : 'py-2.5';

  return (
    <div className="flex-1 min-h-0 bg-[#181a20] border border-[#2b313a] rounded-xs overflow-hidden flex flex-col shadow-sm">
      {/* Top Workspace Toolbar */}
      <div className="p-2 sm:p-2.5 border-b border-[#2b313a] bg-[#181a20] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Sidebar Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium border transition-colors ${
                isSidebarOpen
                  ? 'bg-[#22262e] text-[#eaecef] border-[#2b313a] hover:bg-[#2b313a]'
                  : 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/40 hover:bg-[#f0b90b]/20'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? 'Tutup Filter' : 'Buka Filter'}</span>
              {!isSidebarOpen && activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#f0b90b] text-[#181a20]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs text-[#848e9c] font-mono">
            <span>
              Total:{' '}
              <strong className="text-[#eaecef] font-bold tabular-nums">
                {coins.length}
              </strong>{' '}
              koin
            </span>
            {typeof confluenceCount === 'number' && confluenceCount > 0 && (
              <button
                onClick={() => onFilterChange?.({ onlyConfluence: !filters?.onlyConfluence })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-bold transition-all ${
                  filters?.onlyConfluence
                    ? 'bg-[#f0b90b] text-[#181a20] border-[#f0b90b]'
                    : 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/30 hover:bg-[#f0b90b]/20'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>3TF Confluence: {confluenceCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Pivot Mode + Density Switch + Page Size */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Pivot Mode Selector (TV Auto vs Micro Candle) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => setPivotMode('tradingview')}
              title="Standar TradingView Auto: M5 (Daily 1D), 1H (Weekly 1W), Daily (Monthly 1M)"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                pivotMode === 'tradingview'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              TV Auto
            </button>
            <button
              onClick={() => setPivotMode('micro')}
              title="Micro-Candle: Pivot dihitung dari candle 5m, 1h, dan 1d masing-masing"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                pivotMode === 'micro'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Micro Candle
            </button>
          </div>

          {/* Density Toggle (Rapat / Normal) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => setDensity('compact')}
              title="Compact View (Data lebih padat & banyak)"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                density === 'compact'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Rapat
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="Normal View"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-medium transition-colors ${
                density === 'normal'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#848e9c]">
            <span className="hidden sm:inline text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#12151a] border border-[#2b313a] text-[#eaecef] text-xs rounded-xs px-2 py-1 focus:outline-none focus:border-[#f0b90b] cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar (Dismissible chips) */}
      {activePills.length > 0 && (
        <div className="px-3 py-1.5 border-b border-[#2b313a] bg-[#12151a] flex items-center gap-1.5 flex-wrap text-xs shrink-0">
          <span className="text-[11px] text-[#848e9c] font-medium">Filter Aktif:</span>
          {activePills.map((pill) => (
            <span
              key={pill.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono bg-[#181a20] border border-[#2b313a] text-[#eaecef]"
            >
              <span>{pill.label}</span>
              <button
                onClick={pill.onRemove}
                className="text-[#848e9c] hover:text-[#f6465d] transition-colors ml-0.5"
                title="Hapus filter ini"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-[#848e9c] hover:text-[#f0b90b] ml-1 underline decoration-[#474d57] hover:decoration-[#f0b90b] transition-colors"
            >
              Hapus Semua
            </button>
          )}
        </div>
      )}

      {/* Table Scrollable Container: Sticky Header + Freeze Symbol Column */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#181a20] shadow-xs border-b border-[#2b313a]">
            <tr className="text-[#848e9c] font-semibold uppercase tracking-wider text-[11px]">
              {/* Frozen Column 1: Rank # */}
              <th className="py-2 px-3 w-12 text-center sticky left-0 z-30 bg-[#181a20] border-r border-[#2b313a]">
                #
              </th>

              {/* Frozen Column 2: Symbol & Volume */}
              <th
                onClick={() => handleSort('symbol')}
                className="py-2 px-3 cursor-pointer hover:text-[#eaecef] transition-colors sticky left-12 z-30 bg-[#181a20] min-w-[130px] border-r border-[#2b313a]"
              >
                Kontrak PERP / Volume {renderSortIcon('symbol')}
              </th>

              {/* Unfrozen Table Columns */}
              <th
                onClick={() => handleSort('price')}
                className="py-2 px-3 cursor-pointer hover:text-[#eaecef] transition-colors min-w-[110px]"
              >
                Harga Terakhir {renderSortIcon('price')}
              </th>
              <th
                onClick={() => handleSort('m1')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                1m {renderSortIcon('m1')}
              </th>
              <th
                onClick={() => handleSort('m5')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                5m {renderSortIcon('m5')}
              </th>
              <th
                onClick={() => handleSort('m15')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                15m {renderSortIcon('m15')}
              </th>
              <th
                onClick={() => handleSort('m30')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                30m {renderSortIcon('m30')}
              </th>
              <th
                onClick={() => handleSort('h1')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                1j {renderSortIcon('h1')}
              </th>
              <th
                onClick={() => handleSort('h3')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                3j {renderSortIcon('h3')}
              </th>
              <th
                onClick={() => handleSort('h6')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                6j {renderSortIcon('h6')}
              </th>
              <th
                onClick={() => handleSort('h12')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                12j {renderSortIcon('h12')}
              </th>
              <th
                onClick={() => handleSort('h24')}
                className="py-2 px-2 text-center cursor-pointer hover:text-[#eaecef] transition-colors"
              >
                24j {renderSortIcon('h24')}
              </th>
              <th
                onClick={() => handleSort('distP5m')}
                className="py-2 px-2 text-center min-w-[135px] cursor-pointer hover:text-[#eaecef] transition-colors"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart 5m menggunakan Pivot Daily (1D)' : 'Pivot dari candle 5m sebelumnya'}
              >
                {pivotMode === 'tradingview' ? 'Pivot 5M (Daily 1D)' : 'Pivot 5M (Candle)'} {renderSortIcon('distP5m')}
              </th>
              <th
                onClick={() => handleSort('distP1h')}
                className="py-2 px-2 text-center min-w-[135px] cursor-pointer hover:text-[#eaecef] transition-colors"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart 1H menggunakan Pivot Weekly (1W)' : 'Pivot dari candle 1h sebelumnya'}
              >
                {pivotMode === 'tradingview' ? 'Pivot 1H (Weekly 1W)' : 'Pivot 1H (Candle)'} {renderSortIcon('distP1h')}
              </th>
              <th
                onClick={() => handleSort('distP')}
                className="py-2 px-2 text-center min-w-[135px] cursor-pointer hover:text-[#eaecef] transition-colors"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart Daily menggunakan Pivot Monthly (1M)' : 'Pivot Daily (1D)'}
              >
                {pivotMode === 'tradingview' ? 'Pivot Daily (Monthly 1M)' : 'Pivot Daily (1D)'} {renderSortIcon('distP')}
              </th>
              <th className="py-2 px-3 min-w-[150px] cursor-pointer hover:text-[#eaecef] transition-colors">
                Kondisi Pivot Daily
              </th>
              <th className="py-2 px-3 text-center w-14">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#22262e]">
            {paginatedCoins.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-12 text-center text-[#848e9c]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-[#474d57]" />
                    <p className="text-sm font-medium">Tidak ada koin yang sesuai kriteria filter.</p>
                    <p className="text-xs text-[#474d57]">Coba ubah threshold persentase atau reset kondisi pivot.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCoins.map((coin, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const flash = priceFlashMap.get(coin.symbol);
                const confluence = checkPivotConfluence(coin, pivotMode);

                // Real-time live condition & range evaluations directly tied to coin.price
                const targetPivots5m = pivotMode === 'tradingview' ? coin.pivots : (coin.pivots5m || coin.pivots);
                const targetPivots1h = pivotMode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);
                const targetPivotsDaily = pivotMode === 'tradingview' ? (coin.pivotsMonthly || coin.pivots) : coin.pivots;

                const mCond = classifyPriceZone(coin.price, targetPivots5m) ?? coin.pivotStatus?.condition;
                const hCond = classifyPriceZone(coin.price, targetPivots1h) ?? (pivotMode === 'tradingview' ? (coin.pivotStatusWeekly?.condition ?? coin.pivotStatus?.condition) : coin.pivotStatus1h?.condition);
                const dCond = classifyPriceZone(coin.price, targetPivotsDaily) ?? (pivotMode === 'tradingview' ? (coin.pivotStatusMonthly?.condition ?? coin.pivotStatus?.condition) : coin.pivotStatus?.condition);
                const dailyBaseCond = classifyPriceZone(coin.price, coin.pivots) ?? coin.pivotStatus?.condition;

                const distP5m = Number((((coin.price - targetPivots5m.P) / targetPivots5m.P) * 100).toFixed(2));
                const distP1h = Number((((coin.price - targetPivots1h.P) / targetPivots1h.P) * 100).toFixed(2));
                const distPDaily = Number((((coin.price - targetPivotsDaily.P) / targetPivotsDaily.P) * 100).toFixed(2));

                const range5m = calculateRangePercent(coin.price, targetPivots5m);
                const range1h = calculateRangePercent(coin.price, targetPivots1h);
                const rangeDaily = calculateRangePercent(coin.price, targetPivotsDaily);

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className={`cursor-pointer transition-colors group ${
                      confluence.hasConfluence
                        ? confluence.rowHighlight
                        : 'hover:bg-[#1e2329] border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Frozen Column 1: Rank # */}
                    <td className={`${pyRow} px-2 text-center text-[#848e9c] font-mono tabular-nums text-[11px] sticky left-0 z-10 bg-[#181a20] group-hover:bg-[#1e2329] border-r border-[#2b313a]`}>
                      {rank}
                    </td>

                    {/* Frozen Column 2: Symbol & Volume */}
                    <td className={`${pyRow} px-2.5 sm:px-3 sticky left-12 z-10 bg-[#181a20] group-hover:bg-[#1e2329] border-r border-[#2b313a] min-w-[145px]`}>
                      <div className="flex items-center gap-2">
                        <CoinIcon symbol={coin.baseAsset} logoUrl={coin.logoUrl} size={density === 'compact' ? 'sm' : 'md'} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`font-bold text-[#eaecef] group-hover:text-[#f0b90b] transition-colors ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                              {coin.baseAsset}
                            </span>
                            <span className="text-[10px] text-[#848e9c] font-mono">/USDT</span>
                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-mono font-semibold bg-[#22262e] border border-[#2b313a] text-[#f0b90b]/90">
                              PERP
                            </span>
                            {confluence.hasConfluence && (
                              <span
                                className={`inline-flex items-center gap-1 px-1 py-0.2 rounded-xs text-[9px] font-mono font-medium border tracking-tight ${confluence.badgeStyle}`}
                                title={confluence.label}
                              >
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                {confluence.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#848e9c] font-mono tabular-nums">
                            ${(coin.volume24h / 1e6).toFixed(2)}M
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Live Price with Smooth Flash Animation */}
                    <td className={`${pyRow} px-3`}>
                      <div
                        className={`font-mono tabular-nums font-semibold transition-all inline-block px-1.5 py-0.5 rounded-xs ${
                          density === 'compact' ? 'text-xs' : 'text-sm'
                        } ${
                          flash === 'up'
                            ? 'tick-flash-up'
                            : flash === 'down'
                            ? 'tick-flash-down'
                            : 'text-[#eaecef]'
                        }`}
                      >
                        ${formatPrice(coin.price)}
                      </div>
                    </td>

                    {/* Changes columns (1m to 24h) */}
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.m1)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.m5)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.m15)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.m30)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.h1)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.h3)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.h6)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.h12)}</td>
                    <td className={`${pyRow} px-1 text-center`}>{renderChangeCell(coin.changes.h24)}</td>

                    {/* Pivot 5M Visualizer */}
                    <td className="py-1 px-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5 py-0.5">
                        <PivotVisualizer
                          pivots={targetPivots5m}
                          currentPrice={coin.price}
                          rangePercent={range5m}
                        />
                        {mCond && (
                          <span className="text-[10px] text-[#848e9c] font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block mt-0.5">
                            {getPivotCode(mCond)} ({distP5m > 0 ? '+' : ''}{distP5m}%)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pivot 1H Visualizer */}
                    <td className="py-1 px-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5 py-0.5">
                        <PivotVisualizer
                          pivots={targetPivots1h}
                          currentPrice={coin.price}
                          rangePercent={range1h}
                        />
                        {hCond && (
                          <span className="text-[10px] text-[#848e9c] font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block mt-0.5">
                            {getPivotCode(hCond)} ({distP1h > 0 ? '+' : ''}{distP1h}%)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pivot Daily Visualizer */}
                    <td className="py-1 px-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5 py-0.5">
                        <PivotVisualizer
                          pivots={targetPivotsDaily}
                          currentPrice={coin.price}
                          rangePercent={rangeDaily}
                        />
                        <span className="text-[10px] text-[#848e9c] font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block mt-0.5">
                          {getPivotCode(dCond)} ({distPDaily > 0 ? '+' : ''}{distPDaily}%)
                        </span>
                      </div>
                    </td>

                    {/* Pivot Condition Badge */}
                    <td className={`${pyRow} px-3`}>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-medium border ${getConditionBadgeStyle(
                            getConditionTagColor(dailyBaseCond)
                          )}`}
                          title={`Kondisi Pivot Daily (1D): ${getConditionLabel(dailyBaseCond)}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span className="truncate">{getConditionLabel(dailyBaseCond)}</span>
                        </span>
                        <span className="text-[9px] text-[#848e9c] font-mono tabular-nums">
                          Dist P: {distPDaily > 0 ? '+' : ''}{distPDaily}%
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className={`${pyRow} px-2 text-center`} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectCoin(coin)}
                        className="p-1.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors"
                        title="Lihat Detail Pivot"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedCoins.length > 0 && (
        <div className="p-2 sm:p-2.5 border-t border-[#2b313a] bg-[#181a20] flex items-center justify-between text-xs text-[#848e9c] shrink-0">
          <div>
            Menampilkan{' '}
            <span className="font-mono text-[#eaecef]">
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedCoins.length)}
            </span>{' '}
            dari <span className="font-mono text-[#eaecef]">{sortedCoins.length}</span> koin
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] disabled:opacity-30 disabled:cursor-not-allowed text-[#eaecef] font-medium border border-[#2b313a] transition-colors"
            >
              Sebelumnya
            </button>
            <span className="font-mono text-[#eaecef] px-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-xs bg-[#22262e] hover:bg-[#2b313a] disabled:opacity-30 disabled:cursor-not-allowed text-[#eaecef] font-medium border border-[#2b313a] transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
