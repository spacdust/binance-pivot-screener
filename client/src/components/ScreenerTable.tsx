import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CoinData, FilterState, SelectedTimeframe, TopMoverCategory, TwoTfCounts, BreakoutCounts } from '../types';
import { PivotVisualizer, PivotVisualStyle } from './PivotVisualizer';
import { CoinIcon } from './CoinIcon';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Info,
  Zap,
  Flame,
  SlidersHorizontal,
  X,
  Layers,
  ChevronLeft,
  Lock,
  Activity,
  RotateCw,
  Crosshair
} from 'lucide-react';
import {
  checkPivotConfluence,
  checkTwoTfZoneConfluence,
  checkBreakoutConfluence,
  calculateRangePercent,
  getConditionLabel,
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
  twoTfCounts?: TwoTfCounts;
  breakoutCounts?: BreakoutCounts;
}

type SortField =
  | 'symbol'
  | 'price'
  | 'volume24h'
  | 'm1'
  | 'm5'
  | 'm10'
  | 'm15'
  | 'm20'
  | 'm25'
  | 'm30'
  | 'm35'
  | 'm40'
  | 'm45'
  | 'm50'
  | 'm55'
  | 'h1'
  | 'h3'
  | 'h6'
  | 'h12'
  | 'h24'
  | 'distP'
  | 'distP1h'
  | 'distP5m';

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
  twoTfCounts,
  breakoutCounts,
}) => {
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [density, setDensity] = useState<'compact' | 'normal'>('compact');
  const [pivotMode, setPivotMode] = useState<'tradingview' | 'micro'>('tradingview');
  const [pivotStyle, setPivotStyle] = useState<PivotVisualStyle>(() => {
    const saved = localStorage.getItem('pivot_visual_style');
    return saved === 'zone_zoom' ? 'zone_zoom' : 'hud';
  });

  const handlePivotStyleChange = (style: PivotVisualStyle) => {
    setPivotStyle(style);
    localStorage.setItem('pivot_visual_style', style);
  };
  const [timeMode, setTimeMode] = useState<'standard' | 'detailed'>('standard');
  const [autoResort, setAutoResort] = useState<boolean>(false);
  const [orderedSymbols, setOrderedSymbols] = useState<string[]>([]);

  // Robust coin comparator across all sortable metrics
  const compareCoins = useCallback(
    (
      a: CoinData,
      b: CoinData,
      field: SortField,
      dir: 'asc' | 'desc',
      pMode: 'tradingview' | 'micro'
    ): number => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (field) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          return dir === 'asc'
            ? (aVal as string).localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal as string);
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
        case 'm10':
          aVal = a.changes.m10 ?? 0;
          bVal = b.changes.m10 ?? 0;
          break;
        case 'm15':
          aVal = a.changes.m15;
          bVal = b.changes.m15;
          break;
        case 'm20':
          aVal = a.changes.m20 ?? 0;
          bVal = b.changes.m20 ?? 0;
          break;
        case 'm25':
          aVal = a.changes.m25 ?? 0;
          bVal = b.changes.m25 ?? 0;
          break;
        case 'm30':
          aVal = a.changes.m30;
          bVal = b.changes.m30;
          break;
        case 'm35':
          aVal = a.changes.m35 ?? 0;
          bVal = b.changes.m35 ?? 0;
          break;
        case 'm40':
          aVal = a.changes.m40 ?? 0;
          bVal = b.changes.m40 ?? 0;
          break;
        case 'm45':
          aVal = a.changes.m45 ?? 0;
          bVal = b.changes.m45 ?? 0;
          break;
        case 'm50':
          aVal = a.changes.m50 ?? 0;
          bVal = b.changes.m50 ?? 0;
          break;
        case 'm55':
          aVal = a.changes.m55 ?? 0;
          bVal = b.changes.m55 ?? 0;
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
          aVal =
            pMode === 'tradingview'
              ? Number(
                  (
                    ((a.price - (a.pivotsMonthly?.P ?? a.pivots.P)) /
                      (a.pivotsMonthly?.P ?? a.pivots.P)) *
                    100
                  ).toFixed(2)
                )
              : a.pivotStatus.distP;
          bVal =
            pMode === 'tradingview'
              ? Number(
                  (
                    ((b.price - (b.pivotsMonthly?.P ?? b.pivots.P)) /
                      (b.pivotsMonthly?.P ?? b.pivots.P)) *
                    100
                  ).toFixed(2)
                )
              : b.pivotStatus.distP;
          break;
        case 'distP1h':
          aVal =
            pMode === 'tradingview'
              ? Number(
                  (
                    ((a.price - (a.pivotsWeekly?.P ?? a.pivots.P)) /
                      (a.pivotsWeekly?.P ?? a.pivots.P)) *
                    100
                  ).toFixed(2)
                )
              : a.pivotStatus1h?.distP ?? 0;
          bVal =
            pMode === 'tradingview'
              ? Number(
                  (
                    ((b.price - (b.pivotsWeekly?.P ?? b.pivots.P)) /
                      (b.pivotsWeekly?.P ?? b.pivots.P)) *
                    100
                  ).toFixed(2)
                )
              : b.pivotStatus1h?.distP ?? 0;
          break;
        case 'distP5m':
          aVal =
            pMode === 'tradingview'
              ? Number((((a.price - a.pivots.P) / a.pivots.P) * 100).toFixed(2))
              : a.pivotStatus5m?.distP ?? 0;
          bVal =
            pMode === 'tradingview'
              ? Number((((b.price - b.pivots.P) / b.pivots.P) * 100).toFixed(2))
              : b.pivotStatus5m?.distP ?? 0;
          break;
      }

      return dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    },
    []
  );

  // Re-calculate the solid symbol ordering based on current coins snapshot
  const reorderCoins = useCallback(
    (coinsToSort = coins, field = sortField, dir = sortDirection, pMode = pivotMode) => {
      const sorted = [...coinsToSort].sort((a, b) => compareCoins(a, b, field, dir, pMode));
      setOrderedSymbols(sorted.map((c) => c.symbol));
    },
    [coins, sortField, sortDirection, pivotMode, compareCoins]
  );

  // Initialize symbol ordering on first batch of coins
  useEffect(() => {
    if (orderedSymbols.length === 0 && coins.length > 0) {
      const sorted = [...coins].sort((a, b) => compareCoins(a, b, sortField, sortDirection, pivotMode));
      setOrderedSymbols(sorted.map((c) => c.symbol));
    }
  }, [coins, orderedSymbols.length, sortField, sortDirection, pivotMode, compareCoins]);

  // Respond to Top Mover Category changes
  useEffect(() => {
    if (!topMoverCategory || topMoverCategory === 'ALL') return;
    let targetField: SortField = 'volume24h';
    let targetDir: 'asc' | 'desc' = 'desc';

    if (topMoverCategory === 'TOP_GAINERS') {
      targetField = selectedTimeframe;
      targetDir = 'desc';
    } else if (topMoverCategory === 'TOP_LOSERS') {
      targetField = selectedTimeframe;
      targetDir = 'asc';
    } else if (topMoverCategory === 'FLASH_MOVERS') {
      targetField = 'm5';
      targetDir = 'desc';
    } else if (topMoverCategory === 'TOP_VOLUME') {
      targetField = 'volume24h';
      targetDir = 'desc';
    }
    setSortField(targetField);
    setSortDirection(targetDir);
    setPage(1);
    reorderCoins(coins, targetField, targetDir, pivotMode);
  }, [topMoverCategory, selectedTimeframe, pivotMode, coins, reorderCoins]);

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
    let nextDir: 'asc' | 'desc' = 'desc';
    if (sortField === field) {
      nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(nextDir);
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    reorderCoins(coins, field, nextDir, pivotMode);
  };

  // Sorting logic: Stable (pinned row positions while data updates live) vs Live auto-resort
  const sortedCoins = useMemo(() => {
    if (autoResort) {
      return [...coins].sort((a, b) => compareCoins(a, b, sortField, sortDirection, pivotMode));
    }

    if (orderedSymbols.length === 0) {
      return [...coins].sort((a, b) => compareCoins(a, b, sortField, sortDirection, pivotMode));
    }

    // STABLE MODE: Preserve established row order, updating CoinData in-place live
    const map = new Map<string, CoinData>(coins.map((c) => [c.symbol, c]));
    const result: CoinData[] = [];
    const seen = new Set<string>();

    for (const sym of orderedSymbols) {
      const c = map.get(sym);
      if (c) {
        result.push(c);
        seen.add(sym);
      }
    }

    for (const c of coins) {
      if (!seen.has(c.symbol)) {
        result.push(c);
      }
    }

    return result;
  }, [coins, autoResort, orderedSymbols, sortField, sortDirection, pivotMode, compareCoins]);

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

    if (filters.twoTfZoneFilter && filters.twoTfZoneFilter !== 'OFF') {
      const labelMap: Record<string, string> = {
        ALL: '2TF: M5+H1 (Semua R & S)',
        ALL_R: '2TF: M5+H1 (Semua Bullish R)',
        ALL_S: '2TF: M5+H1 (Semua Bearish S)',
        R1_R2: '2TF: M5+H1 (R1 ➔ R2)',
        R2_R3: '2TF: M5+H1 (R2 ➔ R3)',
        R3_R4: '2TF: M5+H1 (R3 ➔ R4)',
        S1_S2: '2TF: M5+H1 (S1 ➔ S2)',
        S2_S3: '2TF: M5+H1 (S2 ➔ S3)',
        S3_S4: '2TF: M5+H1 (S3 ➔ S4)',
      };
      pills.push({
        id: 'twoTfZone',
        label: labelMap[filters.twoTfZoneFilter] || '2TF Confluence',
        onRemove: () => onFilterChange({ twoTfZoneFilter: 'OFF' }),
      });
    }

    if (filters?.breakoutFilter && filters.breakoutFilter !== 'OFF') {
      const labelMap: Record<string, string> = {
        ALL: 'BO: M5>R1/S1 & 1H>P',
        BULLISH: 'BO: M5 > R1 & 1H > P',
        BEARISH: 'BD: M5 < S1 & 1H < P',
      };
      pills.push({
        id: 'breakoutFilter',
        label: labelMap[filters.breakoutFilter] || 'Breakout Confluence',
        onRemove: () => onFilterChange({ breakoutFilter: 'OFF' }),
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#474d57] inline ml-1 shrink-0" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#f0b90b] inline ml-1 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#f0b90b] inline ml-1 shrink-0" />
    );
  };

  const renderChangeCell = (val: number, isDetail = false) => {
    const isPos = val > 0;
    const isNeg = val < 0;

    // Authentic Binance Spot typography with rigid fixed dimensions to prevent any layout shifts
    const textColor = isPos ? 'text-[#0ecb81]' : isNeg ? 'text-[#f6465d]' : 'text-[#848e9c]';
    const bg =
      Math.abs(val) >= 5
        ? isPos
          ? 'bg-[#0ecb81]/15 font-bold'
          : 'bg-[#f6465d]/15 font-bold'
        : 'bg-transparent font-medium';

    const widthClass = isDetail ? 'w-[48px]' : 'w-[58px]';

    return (
      <span
        className={`inline-block ${widthClass} text-center py-0.5 rounded-xs text-[11px] font-mono tabular-nums leading-tight select-none ${textColor} ${bg}`}
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
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-bold transition-all cursor-pointer ${
                  filters?.onlyConfluence
                    ? 'bg-[#f0b90b] text-[#181a20] border-[#f0b90b]'
                    : 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/30 hover:bg-[#f0b90b]/20'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>3TF: {confluenceCount}</span>
              </button>
            )}
            {twoTfCounts && twoTfCounts.all > 0 && (
              <button
                onClick={() => {
                  const nextFilter = filters?.twoTfZoneFilter && filters.twoTfZoneFilter !== 'OFF' ? 'OFF' : 'ALL';
                  onFilterChange?.({ twoTfZoneFilter: nextFilter });
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-bold transition-all cursor-pointer ${
                  filters?.twoTfZoneFilter && filters.twoTfZoneFilter !== 'OFF'
                    ? 'bg-[#0ecb81] text-[#181a20] border-[#0ecb81]'
                    : 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/30 hover:bg-[#0ecb81]/20'
                }`}
                title="Filter 2TF Confluence: M5 & H1 serentak di R1-R2 / S1-S2"
              >
                <Flame className="w-3 h-3 fill-current" />
                <span>2TF (M5+H1): {twoTfCounts.all}</span>
              </button>
            )}
            {breakoutCounts && breakoutCounts.all > 0 && (
              <button
                onClick={() => {
                  const nextFilter = filters?.breakoutFilter && filters.breakoutFilter !== 'OFF' ? 'OFF' : 'ALL';
                  onFilterChange?.({ breakoutFilter: nextFilter });
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-bold transition-all cursor-pointer ${
                  filters?.breakoutFilter && filters.breakoutFilter !== 'OFF'
                    ? 'bg-[#0ecb81] text-[#181a20] border-[#0ecb81]'
                    : 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/30 hover:bg-[#0ecb81]/20'
                }`}
                title="Filter Breakout Confluence: M5 > R1/S1 & 1H > P"
              >
                <Crosshair className="w-3 h-3" />
                <span>BO (M5&gt;R1 &amp; 1H&gt;P): {breakoutCounts.all}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Stability + Re-sort + Time Mode + Pivot Mode + Density Switch + Page Size */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Row Stability Toggle (Stabil vs Live Sort) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => {
                reorderCoins();
                setAutoResort(false);
              }}
              title="Urutan baris stabil & tidak loncat saat harga bergerak. Nilai tetap terupdate live."
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                !autoResort
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Stabil</span>
            </button>
            <button
              onClick={() => setAutoResort(true)}
              title="Posisi baris bergerak dinamis secara real-time saat persentase/harga berubah"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                autoResort
                  ? 'bg-[#2b313a] text-[#0ecb81] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Live Sort</span>
            </button>
          </div>

          {/* Quick Re-sort Button (visible in Stabil mode) */}
          {!autoResort && (
            <button
              onClick={() => reorderCoins()}
              title="Perbarui urutan peringkat sekarang dengan data terbaru"
              className="flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] border border-[#2b313a] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-[#f0b90b]" />
              <span className="hidden md:inline">Urutkan Ulang</span>
            </button>
          )}

          {/* Time Mode Selector (Standar vs Detail) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => setTimeMode('standard')}
              title="Mode Standar: 1m, 5m, 15m, 30m, 1j, 3j, 6j, 12j, 24j"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                timeMode === 'standard'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Standar
            </button>
            <button
              onClick={() => setTimeMode('detailed')}
              title="Mode Detail: 1m, 5m, 10m, 15m, 20m, 25m, 30m, 35m, 40m, 45m, 50m, 55m, 1H"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                timeMode === 'detailed'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Detail (1m-1H)
            </button>
          </div>

          {/* Pivot Mode Selector (TV Auto vs Micro Candle) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => {
                setPivotMode('tradingview');
                reorderCoins(coins, sortField, sortDirection, 'tradingview');
              }}
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
              onClick={() => {
                setPivotMode('micro');
                reorderCoins(coins, sortField, sortDirection, 'micro');
              }}
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

          {/* Pivot Style Selector (HUD Slider vs Zone Zoom) */}
          <div className="flex items-center bg-[#12151a] rounded-xs border border-[#2b313a] p-0.5 text-xs">
            <button
              onClick={() => handlePivotStyleChange('hud')}
              title="Tema 1 (Default): Chunky HUD Slider dengan spektrum S4..P..R4 dan slider thumb 8px jelas"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                pivotStyle === 'hud'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              HUD Slider
            </button>
            <button
              onClick={() => handlePivotStyleChange('zone_zoom')}
              title="Tema 2: Dedicated Zone Meter (S1 ↔ P) zoom presisi bebas lelah mata"
              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold transition-colors ${
                pivotStyle === 'zone_zoom'
                  ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Zone Zoom
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
        <table
          className="w-full table-fixed text-left border-collapse text-xs select-none"
          style={{ minWidth: timeMode === 'standard' ? '1513px' : '1621px' }}
        >
          {/* Rigid colgroup definitions to lock column widths in concrete */}
          <colgroup>
            <col className="w-[42px]" />
            <col className="w-[180px]" />
            <col className="w-[105px]" />
            {timeMode === 'standard' ? (
              <>
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
                <col className="w-[66px]" />
              </>
            ) : (
              <>
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
                <col className="w-[54px]" />
              </>
            )}
            <col className="w-[180px]" />
            <col className="w-[180px]" />
            <col className="w-[180px]" />
            <col className="w-[52px]" />
          </colgroup>

          <thead className="sticky top-0 z-20 bg-[#181a20] shadow-xs border-b border-[#2b313a]">
            <tr className="text-[#848e9c] font-semibold uppercase tracking-wider text-[11px]">
              {/* Frozen Column 1: Rank # */}
              <th className="py-2 px-1 w-[42px] min-w-[42px] max-w-[42px] text-center sticky left-0 z-30 bg-[#181a20] border-r border-[#2b313a]">
                #
              </th>

              {/* Frozen Column 2: Symbol & Volume */}
              <th
                onClick={() => handleSort('symbol')}
                className="py-2 px-2.5 w-[180px] min-w-[180px] max-w-[180px] cursor-pointer hover:text-[#eaecef] transition-colors sticky left-[42px] z-30 bg-[#181a20] border-r border-[#2b313a] overflow-hidden"
              >
                Kontrak PERP {renderSortIcon('symbol')}
              </th>

              {/* Unfrozen Table Columns */}
              <th
                onClick={() => handleSort('price')}
                className="py-2 px-2 w-[105px] min-w-[105px] max-w-[105px] text-right cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
              >
                Harga {renderSortIcon('price')}
              </th>

              {/* Timeframe Percentage Headers */}
              {timeMode === 'standard' ? (
                <>
                  <th
                    onClick={() => handleSort('m1')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    1m {renderSortIcon('m1')}
                  </th>
                  <th
                    onClick={() => handleSort('m5')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    5m {renderSortIcon('m5')}
                  </th>
                  <th
                    onClick={() => handleSort('m15')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    15m {renderSortIcon('m15')}
                  </th>
                  <th
                    onClick={() => handleSort('m30')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    30m {renderSortIcon('m30')}
                  </th>
                  <th
                    onClick={() => handleSort('h1')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    1j {renderSortIcon('h1')}
                  </th>
                  <th
                    onClick={() => handleSort('h3')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    3j {renderSortIcon('h3')}
                  </th>
                  <th
                    onClick={() => handleSort('h6')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    6j {renderSortIcon('h6')}
                  </th>
                  <th
                    onClick={() => handleSort('h12')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    12j {renderSortIcon('h12')}
                  </th>
                  <th
                    onClick={() => handleSort('h24')}
                    className="py-2 px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    24j {renderSortIcon('h24')}
                  </th>
                </>
              ) : (
                <>
                  <th
                    onClick={() => handleSort('m1')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    1m {renderSortIcon('m1')}
                  </th>
                  <th
                    onClick={() => handleSort('m5')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    5m {renderSortIcon('m5')}
                  </th>
                  <th
                    onClick={() => handleSort('m10')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    10m {renderSortIcon('m10')}
                  </th>
                  <th
                    onClick={() => handleSort('m15')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    15m {renderSortIcon('m15')}
                  </th>
                  <th
                    onClick={() => handleSort('m20')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    20m {renderSortIcon('m20')}
                  </th>
                  <th
                    onClick={() => handleSort('m25')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    25m {renderSortIcon('m25')}
                  </th>
                  <th
                    onClick={() => handleSort('m30')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    30m {renderSortIcon('m30')}
                  </th>
                  <th
                    onClick={() => handleSort('m35')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    35m {renderSortIcon('m35')}
                  </th>
                  <th
                    onClick={() => handleSort('m40')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    40m {renderSortIcon('m40')}
                  </th>
                  <th
                    onClick={() => handleSort('m45')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    45m {renderSortIcon('m45')}
                  </th>
                  <th
                    onClick={() => handleSort('m50')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    50m {renderSortIcon('m50')}
                  </th>
                  <th
                    onClick={() => handleSort('m55')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                  >
                    55m {renderSortIcon('m55')}
                  </th>
                  <th
                    onClick={() => handleSort('h1')}
                    className="py-2 px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center cursor-pointer hover:text-[#eaecef] transition-colors font-bold text-[#f0b90b] overflow-hidden"
                  >
                    1H {renderSortIcon('h1')}
                  </th>
                </>
              )}
              <th
                onClick={() => handleSort('distP5m')}
                className="py-2 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart 5m menggunakan Pivot Daily (1D)' : 'Pivot dari candle 5m sebelumnya'}
              >
                {pivotMode === 'tradingview' ? 'Pivot 5M (1D)' : 'Pivot 5M'} {renderSortIcon('distP5m')}
              </th>
              <th
                onClick={() => handleSort('distP1h')}
                className="py-2 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart 1H menggunakan Pivot Weekly (1W)' : 'Pivot dari candle 1h sebelumnya'}
              >
                {pivotMode === 'tradingview' ? 'Pivot 1H (1W)' : 'Pivot 1H'} {renderSortIcon('distP1h')}
              </th>
              <th
                onClick={() => handleSort('distP')}
                className="py-2 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center cursor-pointer hover:text-[#eaecef] transition-colors overflow-hidden"
                title={pivotMode === 'tradingview' ? 'TradingView Auto: Chart Daily menggunakan Pivot Monthly (1M)' : 'Pivot Daily (1D)'}
              >
                {pivotMode === 'tradingview' ? 'Pivot Daily (1M)' : 'Pivot Daily'} {renderSortIcon('distP')}
              </th>
              <th className="py-2 px-1 w-[52px] min-w-[52px] max-w-[52px] text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#22262e]">
            {paginatedCoins.length === 0 ? (
              <tr>
                <td colSpan={timeMode === 'standard' ? 16 : 20} className="py-12 text-center text-[#848e9c]">
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
                const twoTf = checkTwoTfZoneConfluence(coin, pivotMode);
                const breakout = checkBreakoutConfluence(coin, pivotMode);

                // Real-time live condition & range evaluations directly tied to coin.price
                const targetPivots5m = pivotMode === 'tradingview' ? coin.pivots : (coin.pivots5m || coin.pivots);
                const targetPivots1h = pivotMode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);
                const targetPivotsDaily = pivotMode === 'tradingview' ? (coin.pivotsMonthly || coin.pivots) : coin.pivots;

                const distP5m = Number((((coin.price - targetPivots5m.P) / targetPivots5m.P) * 100).toFixed(2));
                const distP1h = Number((((coin.price - targetPivots1h.P) / targetPivots1h.P) * 100).toFixed(2));
                const distPDaily = Number((((coin.price - targetPivotsDaily.P) / targetPivotsDaily.P) * 100).toFixed(2));

                const range5m = calculateRangePercent(coin.price, targetPivots5m);
                const range1h = calculateRangePercent(coin.price, targetPivots1h);
                const rangeDaily = calculateRangePercent(coin.price, targetPivotsDaily);
                const displayName = coin.baseAsset || coin.symbol.replace(/USDT$/, '');

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin)}
                    className={`cursor-pointer transition-colors group ${
                      confluence.hasConfluence
                        ? confluence.rowHighlight
                        : twoTf.hasConfluence
                        ? twoTf.rowHighlight
                        : breakout.hasConfluence
                        ? breakout.rowHighlight
                        : 'hover:bg-[#1e2329] border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Frozen Column 1: Rank # */}
                    <td className={`${pyRow} px-1 w-[42px] min-w-[42px] max-w-[42px] text-center text-[#848e9c] font-mono tabular-nums text-[11px] sticky left-0 z-10 bg-[#181a20] group-hover:bg-[#1e2329] border-r border-[#2b313a]`}>
                      {rank}
                    </td>

                    {/* Frozen Column 2: Symbol & Volume */}
                    <td className={`${pyRow} px-2.5 w-[180px] min-w-[180px] max-w-[180px] sticky left-[42px] z-10 bg-[#181a20] group-hover:bg-[#1e2329] border-r border-[#2b313a] overflow-hidden`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">
                          <CoinIcon symbol={displayName} logoUrl={coin.logoUrl} size={density === 'compact' ? 'sm' : 'md'} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                          {/* Line 1: Coin Name (Bold, Always Visible) + /USDT + PERP Badge */}
                          <div className="flex items-center gap-1 min-w-0 whitespace-nowrap overflow-hidden">
                            <span className={`font-bold text-[#eaecef] group-hover:text-[#f0b90b] transition-colors shrink-0 ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                              {displayName}
                            </span>
                            <span className="text-[10px] text-[#848e9c] font-mono shrink-0">/USDT</span>
                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-mono font-semibold bg-[#22262e] border border-[#2b313a] text-[#f0b90b]/90 shrink-0">
                              PERP
                            </span>
                          </div>
                          {/* Line 2: 24h Volume + 3TF Confluence Badge */}
                          <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap overflow-hidden leading-tight mt-0.5">
                            <span className="text-[10px] text-[#848e9c] font-mono tabular-nums shrink-0">
                              ${(coin.volume24h / 1e6).toFixed(2)}M
                            </span>
                            {confluence.hasConfluence && (
                              <span
                                className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs text-[9px] font-mono font-medium border tracking-tight shrink-0 ${confluence.badgeStyle}`}
                                title={confluence.label}
                              >
                                <Zap className="w-2.5 h-2.5 fill-current shrink-0" />
                                <span>{confluence.badgeText}</span>
                              </span>
                            )}
                            {twoTf.hasConfluence && (
                              <span
                                className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs text-[9px] font-mono font-medium border tracking-tight shrink-0 ${twoTf.badgeStyle}`}
                                title={twoTf.label}
                              >
                                <Flame className="w-2.5 h-2.5 fill-current shrink-0" />
                                <span>{twoTf.badgeText}</span>
                              </span>
                            )}
                            {breakout.hasConfluence && (
                              <span
                                className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs text-[9px] font-mono font-medium border tracking-tight shrink-0 ${breakout.badgeStyle}`}
                                title={breakout.label}
                              >
                                <Crosshair className="w-2.5 h-2.5 shrink-0" />
                                <span>{breakout.badgeText}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Live Price with Solid Fixed Alignment & Color Flash */}
                    <td className={`${pyRow} px-2 w-[105px] min-w-[105px] max-w-[105px] text-right overflow-hidden`}>
                      <div
                        className={`font-mono tabular-nums font-semibold transition-colors duration-200 inline-block w-full text-right px-1 py-0.5 rounded-xs ${
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

                    {/* Changes columns */}
                    {timeMode === 'standard' ? (
                      <>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m1, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m5, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m15, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m30, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.h1, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.h3, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.h6, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.h12, false)}</td>
                        <td className={`${pyRow} px-0.5 w-[66px] min-w-[66px] max-w-[66px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.h24, false)}</td>
                      </>
                    ) : (
                      <>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m1, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m5, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m10 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m15, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m20 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m25 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m30, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m35 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m40 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m45 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m50 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center overflow-hidden`}>{renderChangeCell(coin.changes.m55 ?? 0, true)}</td>
                        <td className={`${pyRow} px-0.5 w-[54px] min-w-[54px] max-w-[54px] text-center font-medium overflow-hidden`}>{renderChangeCell(coin.changes.h1, true)}</td>
                      </>
                    )}

                    {/* Pivot 5M Visualizer */}
                    <td className="py-1 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center overflow-hidden">
                      <PivotVisualizer
                        pivots={targetPivots5m}
                        currentPrice={coin.price}
                        rangePercent={range5m}
                        distP={distP5m}
                        timeframeLabel={pivotMode === 'tradingview' ? '5M (1D)' : '5M'}
                        visualStyle={pivotStyle}
                      />
                    </td>

                    {/* Pivot 1H Visualizer */}
                    <td className="py-1 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center overflow-hidden">
                      <PivotVisualizer
                        pivots={targetPivots1h}
                        currentPrice={coin.price}
                        rangePercent={range1h}
                        distP={distP1h}
                        timeframeLabel={pivotMode === 'tradingview' ? '1H (1W)' : '1H'}
                        visualStyle={pivotStyle}
                      />
                    </td>

                    {/* Pivot Daily Visualizer */}
                    <td className="py-1 px-1 w-[180px] min-w-[180px] max-w-[180px] text-center overflow-hidden">
                      <PivotVisualizer
                        pivots={targetPivotsDaily}
                        currentPrice={coin.price}
                        rangePercent={rangeDaily}
                        distP={distPDaily}
                        timeframeLabel={pivotMode === 'tradingview' ? 'Daily (1M)' : 'Daily'}
                        visualStyle={pivotStyle}
                      />
                    </td>

                    {/* Action */}
                    <td className={`${pyRow} px-1 w-[52px] min-w-[52px] max-w-[52px] text-center`} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectCoin(coin)}
                        className="p-1.5 rounded-xs bg-[#22262e] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] transition-colors cursor-pointer"
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
