import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CoinData, FilterState, SelectedTimeframe, TopMoverCategory } from '../types';
import { PivotVisualizer } from './PivotVisualizer';
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
          aVal = a.pivotStatus.distP;
          bVal = b.pivotStatus.distP;
          break;
        case 'distP1h':
          aVal = a.pivotStatus1h?.distP ?? 0;
          bVal = b.pivotStatus1h?.distP ?? 0;
          break;
        case 'distP5m':
          aVal = a.pivotStatus5m?.distP ?? 0;
          bVal = b.pivotStatus5m?.distP ?? 0;
          break;
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [coins, sortField, sortDirection]);

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
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'green':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'fuchsia':
        return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'pink':
        return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
      case 'red':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 inline ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-amber-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-400 inline ml-1" />
    );
  };

  const renderChangeCell = (val: number) => {
    const isPos = val > 0;
    const isZero = val === 0;

    let colorStyles = '';
    if (isZero) {
      colorStyles = 'text-zinc-500 bg-zinc-800/30 font-semibold';
    } else if (isPos) {
      colorStyles = 'text-emerald-400 bg-emerald-500/10 font-semibold';
    } else {
      colorStyles = 'text-rose-400 bg-rose-500/10 font-semibold';
    }

    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums transition-all duration-200 ${colorStyles}`}
      >
        {isPos ? '+' : ''}{val.toFixed(2)}%
      </span>
    );
  };

  const pyRow = density === 'compact' ? 'py-1.5' : 'py-2.5';

  return (
    <div className="flex-1 min-h-0 bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
      {/* Top Workspace Toolbar */}
      <div className="p-2.5 sm:p-3 border-b border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Sidebar Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSidebarOpen
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? 'Tutup Filter' : 'Buka Filter'}</span>
              {!isSidebarOpen && activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-zinc-950">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>
              Total:{' '}
              <strong className="text-zinc-100 font-bold tabular-nums">
                {coins.length}
              </strong>{' '}
              koin
            </span>
            {typeof confluenceCount === 'number' && confluenceCount > 0 && (
              <button
                onClick={() => onFilterChange?.({ onlyConfluence: !filters?.onlyConfluence })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${
                  filters?.onlyConfluence
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-sm'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>3TF Confluence: {confluenceCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Density Switch + Page Size */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Density Toggle (Rapat / Normal) */}
          <div className="flex items-center bg-zinc-900/90 rounded-lg border border-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setDensity('compact')}
              title="Compact View (Data lebih padat & banyak)"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                density === 'compact'
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rapat
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="Normal View"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                density === 'normal'
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="hidden sm:inline text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
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
        <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center gap-1.5 flex-wrap text-xs shrink-0">
          <span className="text-[11px] text-zinc-500 font-medium">Filter Aktif:</span>
          {activePills.map((pill) => (
            <span
              key={pill.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 shadow-xs"
            >
              <span>{pill.label}</span>
              <button
                onClick={pill.onRemove}
                className="text-zinc-400 hover:text-rose-400 transition-colors ml-0.5"
                title="Hapus filter ini"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-zinc-400 hover:text-amber-400 ml-1 underline decoration-zinc-700 hover:decoration-amber-400 transition-colors"
            >
              Hapus Semua
            </button>
          )}
        </div>
      )}

      {/* Table Scrollable Container: Sticky Header + Freeze Symbol Column */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-zinc-950 shadow-sm border-b border-zinc-800">
            <tr className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
              {/* Frozen Column 1: Rank # */}
              <th className="py-2.5 px-3 w-12 text-center sticky left-0 z-30 bg-zinc-950 border-r border-zinc-800/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                #
              </th>

              {/* Frozen Column 2: Symbol & Volume */}
              <th
                onClick={() => handleSort('symbol')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 transition-colors sticky left-12 z-30 bg-zinc-950 min-w-[130px] border-r border-zinc-800/80 shadow-[2px_0_5px_rgba(0,0,0,0.3)]"
              >
                Pasang / Volume {renderSortIcon('symbol')}
              </th>

              {/* Unfrozen Table Columns */}
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 cursor-pointer hover:text-zinc-200 transition-colors min-w-[110px]"
              >
                Harga Terakhir {renderSortIcon('price')}
              </th>
              <th
                onClick={() => handleSort('m1')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                1m {renderSortIcon('m1')}
              </th>
              <th
                onClick={() => handleSort('m5')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                5m {renderSortIcon('m5')}
              </th>
              <th
                onClick={() => handleSort('m15')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                15m {renderSortIcon('m15')}
              </th>
              <th
                onClick={() => handleSort('m30')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                30m {renderSortIcon('m30')}
              </th>
              <th
                onClick={() => handleSort('h1')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                1j {renderSortIcon('h1')}
              </th>
              <th
                onClick={() => handleSort('h3')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                3j {renderSortIcon('h3')}
              </th>
              <th
                onClick={() => handleSort('h6')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                6j {renderSortIcon('h6')}
              </th>
              <th
                onClick={() => handleSort('h12')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                12j {renderSortIcon('h12')}
              </th>
              <th
                onClick={() => handleSort('h24')}
                className="py-2.5 px-2 text-center cursor-pointer hover:text-zinc-200 transition-colors"
              >
                24j {renderSortIcon('h24')}
              </th>
              <th
                onClick={() => handleSort('distP5m')}
                className="py-2.5 px-2 text-center min-w-[135px] cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Pivot 5M (S4 ➔ R4) {renderSortIcon('distP5m')}
              </th>
              <th
                onClick={() => handleSort('distP1h')}
                className="py-2.5 px-2 text-center min-w-[135px] cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Pivot 1H (S4 ➔ R4) {renderSortIcon('distP1h')}
              </th>
              <th
                onClick={() => handleSort('distP')}
                className="py-2.5 px-2 text-center min-w-[135px] cursor-pointer hover:text-zinc-200 transition-colors"
              >
                Pivot Daily (S4 ➔ R4) {renderSortIcon('distP')}
              </th>
              <th className="py-2.5 px-3 min-w-[150px] cursor-pointer hover:text-zinc-200 transition-colors">
                Kondisi Pivot Daily
              </th>
              <th className="py-2.5 px-3 text-center w-14">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {paginatedCoins.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-zinc-600" />
                    <p className="text-sm font-medium">Tidak ada koin yang sesuai kriteria filter.</p>
                    <p className="text-xs text-zinc-600">Coba ubah threshold persentase atau reset kondisi pivot.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCoins.map((coin, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const flash = priceFlashMap.get(coin.symbol);
                const confluence = checkPivotConfluence(coin);

                // Real-time live condition & range evaluations directly tied to coin.price
                const dCond = classifyPriceZone(coin.price, coin.pivots) ?? coin.pivotStatus?.condition;
                const hCond = coin.pivots1h ? (classifyPriceZone(coin.price, coin.pivots1h) ?? coin.pivotStatus1h?.condition) : null;
                const mCond = coin.pivots5m ? (classifyPriceZone(coin.price, coin.pivots5m) ?? coin.pivotStatus5m?.condition) : null;

                const distPDaily = Number((((coin.price - coin.pivots.P) / coin.pivots.P) * 100).toFixed(2));
                const distP1h = coin.pivots1h ? Number((((coin.price - coin.pivots1h.P) / coin.pivots1h.P) * 100).toFixed(2)) : 0;
                const distP5m = coin.pivots5m ? Number((((coin.price - coin.pivots5m.P) / coin.pivots5m.P) * 100).toFixed(2)) : 0;

                const range5m = calculateRangePercent(coin.price, coin.pivots5m);
                const range1h = calculateRangePercent(coin.price, coin.pivots1h);
                const rangeDaily = calculateRangePercent(coin.price, coin.pivots);

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className={`cursor-pointer transition-all group ${
                      confluence.hasConfluence
                        ? confluence.rowHighlight
                        : 'hover:bg-zinc-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Frozen Column 1: Rank # */}
                    <td className={`${pyRow} px-2 text-center text-zinc-500 font-mono tabular-nums text-[11px] sticky left-0 z-10 bg-zinc-950/95 group-hover:bg-zinc-900/95 border-r border-zinc-800/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)]`}>
                      {rank}
                    </td>

                    {/* Frozen Column 2: Symbol & Volume */}
                    <td className={`${pyRow} px-3 sticky left-12 z-10 bg-zinc-950/95 group-hover:bg-zinc-900/95 border-r border-zinc-800/80 shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[130px]`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-zinc-100 group-hover:text-amber-400 transition-colors ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                          {coin.baseAsset}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">/USDT</span>
                        {confluence.hasConfluence && (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border tracking-tight ${confluence.badgeStyle}`}
                            title={confluence.label}
                          >
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            {confluence.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono tabular-nums">
                        ${(coin.volume24h / 1e6).toFixed(2)}M
                      </div>
                    </td>

                    {/* Live Price with Smooth Flash Animation */}
                    <td className={`${pyRow} px-3`}>
                      <div
                        className={`font-mono tabular-nums font-semibold transition-all inline-block px-2 py-0.5 rounded ${
                          density === 'compact' ? 'text-xs' : 'text-sm'
                        } ${
                          flash === 'up'
                            ? 'tick-flash-up border border-emerald-500/30'
                            : flash === 'down'
                            ? 'tick-flash-down border border-rose-500/30'
                            : 'text-zinc-100 border border-transparent'
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
                      {coin.pivots5m ? (
                        <div className={`flex flex-col items-center gap-0.5 p-0.5 ${confluence.hasConfluence ? confluence.visualizerRing : ''}`}>
                          <PivotVisualizer
                            pivots={coin.pivots5m}
                            currentPrice={coin.price}
                            rangePercent={range5m}
                          />
                          {mCond && (
                            <span className="text-[10px] text-zinc-400 font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block">
                              {getConditionLabel(mCond)} ({distP5m > 0 ? '+' : ''}{distP5m}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">Syncing...</span>
                      )}
                    </td>

                    {/* Pivot 1H Visualizer */}
                    <td className="py-1 px-1.5 text-center">
                      {coin.pivots1h ? (
                        <div className={`flex flex-col items-center gap-0.5 p-0.5 ${confluence.hasConfluence ? confluence.visualizerRing : ''}`}>
                          <PivotVisualizer
                            pivots={coin.pivots1h}
                            currentPrice={coin.price}
                            rangePercent={range1h}
                          />
                          {hCond && (
                            <span className="text-[10px] text-zinc-400 font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block">
                              {getConditionLabel(hCond)} ({distP1h > 0 ? '+' : ''}{distP1h}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">Syncing...</span>
                      )}
                    </td>

                    {/* Pivot Daily Visualizer */}
                    <td className="py-1 px-1.5 text-center">
                      <div className={`flex flex-col items-center gap-0.5 p-0.5 ${confluence.hasConfluence ? confluence.visualizerRing : ''}`}>
                        <PivotVisualizer
                          pivots={coin.pivots}
                          currentPrice={coin.price}
                          rangePercent={rangeDaily}
                        />
                        <span className="text-[10px] text-zinc-400 font-mono tabular-nums leading-none truncate whitespace-nowrap max-w-[145px] block">
                          {getConditionLabel(dCond)} ({distPDaily > 0 ? '+' : ''}{distPDaily}%)
                        </span>
                      </div>
                    </td>

                    {/* Pivot Condition Badge */}
                    <td className={`${pyRow} px-3`}>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getConditionBadgeStyle(
                            getConditionTagColor(dCond)
                          )}`}
                        >
                          {getConditionLabel(dCond)}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono tabular-nums">
                          Dist P: {distPDaily > 0 ? '+' : ''}{distPDaily}%
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className={`${pyRow} px-2 text-center`} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectCoin(coin)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
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
        <div className="p-2.5 sm:p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div>
            Menampilkan{' '}
            <span className="font-mono text-zinc-200">
              {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedCoins.length)}
            </span>{' '}
            dari <span className="font-mono text-zinc-200">{sortedCoins.length}</span> koin
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-medium transition-colors"
            >
              Sebelumnya
            </button>
            <span className="font-mono text-zinc-300 px-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 font-medium transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
