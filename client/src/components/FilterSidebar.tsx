import React, { useMemo } from 'react';
import { FilterState, PivotConditionType, SelectedTimeframe, TopMoverCategory } from '../types';
import {
  Search,
  X,
  Clock,
  Target,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ChevronsUp,
  ChevronsDown,
  Rocket,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Flame,
  AlertOctagon,
  SlidersHorizontal,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  resultCount: number;
  conditionCounts?: Record<string, number>;
  confluenceCount?: number;
}

const TOP_MOVER_CATEGORIES: {
  key: TopMoverCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  desc: string;
}[] = [
  { key: 'ALL', label: 'Semua Koin', icon: LayoutGrid, iconColor: 'text-[#848e9c]', desc: 'Seluruh koin USDT aktif' },
  { key: 'TOP_GAINERS', label: 'Top Gainers', icon: TrendingUp, iconColor: 'text-[#0ecb81]', desc: 'Kenaikan persentase tertinggi' },
  { key: 'TOP_LOSERS', label: 'Top Losers', icon: TrendingDown, iconColor: 'text-[#f6465d]', desc: 'Penurunan terdalam' },
  { key: 'FLASH_MOVERS', label: 'Flash Spike', icon: Zap, iconColor: 'text-[#f0b90b]', desc: 'Volatilitas kilat di 1m / 5m' },
  { key: 'TOP_VOLUME', label: 'Top Volume', icon: BarChart3, iconColor: 'text-[#eaecef]', desc: 'Turnover USDT 24 jam terbesar' },
];

const TIMEFRAMES: { key: SelectedTimeframe; label: string }[] = [
  { key: 'h24', label: '24j' },
  { key: 'h12', label: '12j' },
  { key: 'h6', label: '6j' },
  { key: 'h3', label: '3j' },
  { key: 'h1', label: '1j' },
  { key: 'm30', label: '30m' },
  { key: 'm15', label: '15m' },
  { key: 'm5', label: '5m' },
  { key: 'm1', label: '1m' },
];

const QUICK_PERCENT_PRESETS = [1, 2, 3, 5, 10];

const BULLISH_GROUP: {
  value: PivotConditionType;
  code: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  selectedClass: string;
}[] = [
  { value: 'R1_TO_R2', code: 'R1 ➔ R2', label: 'Tembus R1 ➔ R2', desc: 'Breakout', icon: ChevronsUp, iconColor: 'text-[#0ecb81]', selectedClass: 'bg-[#0ecb81] text-[#181a20] font-bold border-[#0ecb81]' },
  { value: 'R2_TO_R3', code: 'R2 ➔ R3', label: 'Tembus R2 ➔ R3', desc: 'Super Bullish', icon: Rocket, iconColor: 'text-[#0ecb81]', selectedClass: 'bg-[#0ecb81] text-[#181a20] font-bold border-[#0ecb81]' },
  { value: 'R3_TO_R4', code: 'R3 ➔ R4', label: 'Tembus R3 ➔ R4', desc: 'Hyper Pump', icon: Flame, iconColor: 'text-[#0ecb81]', selectedClass: 'bg-[#0ecb81] text-[#181a20] font-bold border-[#0ecb81]' },
  { value: 'ABOVE_R4', code: '> R4', label: 'Di atas R4', desc: 'Mega Pump', icon: Sparkles, iconColor: 'text-[#0ecb81]', selectedClass: 'bg-[#0ecb81] text-[#181a20] font-bold border-[#0ecb81]' },
];

const CENTER_GROUP: {
  value: PivotConditionType;
  code: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  selectedClass: string;
}[] = [
  { value: 'AREA_P', code: 'Area P', label: 'Area P', desc: 'Konsolidasi', icon: Target, iconColor: 'text-[#f0b90b]', selectedClass: 'bg-[#f0b90b] text-[#181a20] font-bold border-[#f0b90b]' },
  { value: 'S1_TO_P', code: 'S1 ➔ P', label: 'Pantul S1 ➔ P', desc: 'Reversal', icon: ArrowUpRight, iconColor: 'text-[#0ecb81]', selectedClass: 'bg-[#0ecb81] text-[#181a20] font-bold border-[#0ecb81]' },
  { value: 'R1_TO_P', code: 'R1 ➔ P', label: 'Tolak R1 ➔ P', desc: 'Pullback', icon: ArrowDownRight, iconColor: 'text-[#f0b90b]', selectedClass: 'bg-[#f0b90b] text-[#181a20] font-bold border-[#f0b90b]' },
];

const BEARISH_GROUP: {
  value: PivotConditionType;
  code: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  selectedClass: string;
}[] = [
  { value: 'S1_TO_S2', code: 'S1 ➔ S2', label: 'Tembus S1 ➔ S2', desc: 'Breakdown', icon: ChevronsDown, iconColor: 'text-[#f6465d]', selectedClass: 'bg-[#f6465d] text-white font-bold border-[#f6465d]' },
  { value: 'S2_TO_S3', code: 'S2 ➔ S3', label: 'Tembus S2 ➔ S3', desc: 'Diskon Ekstrem', icon: ShieldAlert, iconColor: 'text-[#f6465d]', selectedClass: 'bg-[#f6465d] text-white font-bold border-[#f6465d]' },
  { value: 'S3_TO_S4', code: 'S3 ➔ S4', label: 'Tembus S3 ➔ S4', desc: 'Kapitulasi Berat', icon: AlertTriangle, iconColor: 'text-[#f6465d]', selectedClass: 'bg-[#f6465d] text-white font-bold border-[#f6465d]' },
  { value: 'BELOW_S4', code: '< S4', label: 'Di bawah S4', desc: 'Oversold Maksimal', icon: AlertOctagon, iconColor: 'text-[#f6465d]', selectedClass: 'bg-[#f6465d] text-white font-bold border-[#f6465d]' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onToggle,
  filters,
  onFilterChange,
  onReset,
  resultCount,
  conditionCounts,
  confluenceCount,
}) => {
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.topMoverCategory !== 'ALL') count++;
    if (filters.enablePercentFilter) count++;
    if (filters.pivotCondition !== 'ALL') count++;
    if (filters.onlyConfluence) count++;
    return count;
  }, [filters]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-[48px] bottom-0 left-0 z-40 bg-[#181a20] border-r border-[#2b313a] flex flex-col transition-all duration-200 ease-in-out shadow-lg lg:shadow-none ${
          isOpen
            ? 'w-76 translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-[#2b313a] flex items-center justify-between shrink-0 bg-[#181a20]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xs bg-[#f0b90b]/10 border border-[#f0b90b]/30 text-[#f0b90b]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-[#eaecef]">FILTER SCREENER</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#f0b90b] text-[#181a20]">
                {activeCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activeCount > 0 && (
              <button
                onClick={onReset}
                title="Reset Semua Filter"
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-[#848e9c] hover:text-[#eaecef] bg-[#22262e] hover:bg-[#2b313a] rounded-xs border border-[#2b313a] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onToggle}
              title="Minimize Sidebar"
              className="p-1 text-[#848e9c] hover:text-[#eaecef] rounded-xs hover:bg-[#22262e] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Controls Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
          {/* Section 1: Search */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider flex items-center justify-between">
              <span>Cari Koin</span>
              <span className="font-mono text-[#f0b90b] font-bold normal-case">
                {resultCount} koin
              </span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#848e9c]" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                placeholder="BTC, ETH, SOL, PEPE..."
                className="w-full bg-[#12151a] border border-[#2b313a] rounded-xs pl-8 pr-7 py-1.5 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#f0b90b] transition-colors font-sans"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-[#eaecef]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-[#2b313a]" />

          {/* Section 2: 3TF Confluence Highlight Banner */}
          <button
            onClick={() => onFilterChange({ onlyConfluence: !filters.onlyConfluence })}
            className={`w-full p-2.5 rounded-xs border text-left transition-colors flex items-center justify-between group ${
              filters.onlyConfluence
                ? 'bg-[#f0b90b]/10 border-[#f0b90b] text-[#f0b90b]'
                : 'bg-[#12151a] border-[#2b313a] hover:border-[#f0b90b]/40 text-[#eaecef]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-xs ${filters.onlyConfluence ? 'bg-[#f0b90b] text-[#181a20]' : 'bg-[#f0b90b]/10 text-[#f0b90b]'}`}>
                <Zap className="w-3.5 h-3.5 fill-current" />
              </span>
              <div>
                <div className="font-bold text-[#eaecef] text-[11px] leading-tight flex items-center gap-1.5">
                  <span>3TF Confluence</span>
                  {filters.onlyConfluence && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] text-[#848e9c] leading-tight">Area Daily, 1H & 5M Selaras</div>
              </div>
            </div>
            {typeof confluenceCount === 'number' && (
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs tabular-nums ${
                  filters.onlyConfluence
                    ? 'bg-[#f0b90b] text-[#181a20]'
                    : 'bg-[#22262e] text-[#f0b90b] border border-[#2b313a]'
                }`}
              >
                {confluenceCount}
              </span>
            )}
          </button>

          <div className="h-px bg-[#2b313a]" />

          {/* Section 3: Kategori Top Movers */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider flex items-center justify-between">
              <span>Kategori Top Movers</span>
            </label>
            <div className="grid grid-cols-1 gap-1">
              {TOP_MOVER_CATEGORIES.map((cat) => {
                const isActive = filters.topMoverCategory === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => onFilterChange({ topMoverCategory: cat.key })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xs text-xs font-medium border transition-colors ${
                      isActive
                        ? 'bg-[#22262e] text-[#eaecef] border-[#f0b90b] font-bold'
                        : 'bg-[#12151a] text-[#848e9c] border-[#2b313a] hover:bg-[#1e2329] hover:text-[#eaecef]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#f0b90b]' : cat.iconColor}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-[#f0b90b]' : 'text-[#848e9c]'}`}>
                      {cat.key === 'ALL' ? 'Semua' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#2b313a]" />

          {/* Section 4: Filter Persentase / Sideways */}
          <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sidebarEnablePercent"
                  checked={filters.enablePercentFilter}
                  onChange={(e) => onFilterChange({ enablePercentFilter: e.target.checked })}
                  className="w-3.5 h-3.5 rounded-xs border-[#2b313a] bg-[#181a20] text-[#f0b90b] cursor-pointer accent-[#f0b90b]"
                />
                <label htmlFor="sidebarEnablePercent" className="font-semibold text-[#eaecef] cursor-pointer text-xs flex items-center gap-1">
                  <span>Filter Sideways</span>
                  <span className="font-mono text-[#f0b90b] font-bold">&le; {filters.maxPercent}%</span>
                </label>
              </div>

              {/* Compact Timeframe Dropdown */}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#848e9c]" />
                <select
                  value={filters.selectedTimeframe}
                  onChange={(e) => onFilterChange({ selectedTimeframe: e.target.value as SelectedTimeframe })}
                  className="bg-[#181a20] border border-[#2b313a] text-[#eaecef] text-[11px] font-mono rounded-xs px-2 py-0.5 focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                  title="Pilih timeframe acuan untuk filter persentase"
                >
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf.key} value={tf.key}>
                      TF: {tf.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode switch */}
            <div className="grid grid-cols-2 gap-1 bg-[#181a20] p-0.5 rounded-xs border border-[#2b313a]">
              <button
                onClick={() => onFilterChange({ filterMode: 'absolute_below' })}
                className={`py-1 px-1.5 rounded-xs text-[10px] font-mono transition-colors text-center ${
                  filters.filterMode === 'absolute_below'
                    ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                |&plusmn;{filters.maxPercent}%| Sideways
              </button>
              <button
                onClick={() => onFilterChange({ filterMode: 'below' })}
                className={`py-1 px-1.5 rounded-xs text-[10px] font-mono transition-colors text-center ${
                  filters.filterMode === 'below'
                    ? 'bg-[#2b313a] text-[#f0b90b] font-bold'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                &lt; {filters.maxPercent}%
              </button>
            </div>

            {/* Presets and custom slider */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] text-[#848e9c] mr-0.5">Preset:</span>
              {QUICK_PERCENT_PRESETS.map((pct) => {
                const isSelected = filters.enablePercentFilter && filters.maxPercent === pct;
                return (
                  <button
                    key={pct}
                    onClick={() =>
                      onFilterChange({
                        enablePercentFilter: true,
                        maxPercent: pct,
                      })
                    }
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono tabular-nums border ${
                      isSelected
                        ? 'bg-[#f0b90b] text-[#181a20] font-bold border-[#f0b90b]'
                        : 'bg-[#181a20] border-[#2b313a] text-[#848e9c] hover:border-[#474d57]'
                    }`}
                  >
                    &lt;{pct}%
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={filters.maxPercent}
                onChange={(e) =>
                  onFilterChange({
                    enablePercentFilter: true,
                    maxPercent: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-[#f0b90b] h-1 bg-[#2b313a] rounded-xs appearance-none cursor-pointer"
              />
              <span className="text-[11px] font-mono tabular-nums text-[#848e9c] w-8 text-right">
                {filters.maxPercent}%
              </span>
            </div>
          </div>

          <div className="h-px bg-[#2b313a]" />

          {/* Section 5: Filter Kondisi Pivot Point */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#848e9c] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3 text-[#f0b90b]" />
                <span>Kondisi Pivot Daily</span>
              </label>

              {/* Reset to ALL condition */}
              <button
                onClick={() => onFilterChange({ pivotCondition: 'ALL' })}
                className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold border transition-colors ${
                  filters.pivotCondition === 'ALL'
                    ? 'bg-[#22262e] text-[#f0b90b] border-[#f0b90b]'
                    : 'bg-[#12151a] text-[#848e9c] border-[#2b313a] hover:text-[#eaecef]'
                }`}
              >
                Semua ({conditionCounts?.ALL ?? resultCount})
              </button>
            </div>

            {/* Sub-card 1: Zona Bullish */}
            <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#0ecb81] pb-1 border-b border-[#2b313a]">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[#0ecb81]" />
                  <span>Zona Bullish (Breakout)</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#0ecb81]/10 text-[#0ecb81]">
                  R1 ➔ R4+
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {BULLISH_GROUP.map((cond) => {
                  const isSelected = filters.pivotCondition === cond.value;
                  const count = conditionCounts?.[cond.value] ?? 0;
                  const Icon = cond.icon;
                  return (
                    <button
                      key={cond.value}
                      onClick={() =>
                        onFilterChange({
                          pivotCondition: isSelected ? 'ALL' : cond.value,
                        })
                      }
                      className={`flex items-center justify-between p-1.5 rounded-xs text-left border transition-colors ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-[#181a20] border-[#2b313a] text-[#eaecef] hover:border-[#0ecb81]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-[#181a20]' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded-xs tabular-nums ${
                          isSelected
                            ? 'bg-[#181a20]/20 text-[#181a20] font-bold'
                            : count > 0
                            ? 'bg-[#0ecb81]/15 text-[#0ecb81] font-semibold'
                            : 'text-[#474d57]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-card 2: Center Pivot & Reversal */}
            <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#f0b90b] pb-1 border-b border-[#2b313a]">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-[#f0b90b]" />
                  <span>Center & Reversal</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#f0b90b]/10 text-[#f0b90b]">
                  Area P & Retest
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {CENTER_GROUP.map((cond) => {
                  const isSelected = filters.pivotCondition === cond.value;
                  const count = conditionCounts?.[cond.value] ?? 0;
                  const Icon = cond.icon;
                  return (
                    <button
                      key={cond.value}
                      onClick={() =>
                        onFilterChange({
                          pivotCondition: isSelected ? 'ALL' : cond.value,
                        })
                      }
                      className={`flex items-center justify-between p-1.5 rounded-xs text-left border transition-colors ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-[#181a20] border-[#2b313a] text-[#eaecef] hover:border-[#f0b90b]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-[#181a20]' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                        <span className={`text-[9px] truncate ${isSelected ? 'text-[#181a20]' : 'text-[#848e9c]'}`}>{cond.desc}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded-xs tabular-nums ${
                          isSelected
                            ? 'bg-[#181a20]/20 text-[#181a20] font-bold'
                            : count > 0
                            ? 'bg-[#f0b90b]/15 text-[#f0b90b] font-semibold'
                            : 'text-[#474d57]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-card 3: Zona Bearish */}
            <div className="bg-[#12151a] border border-[#2b313a] rounded-xs p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#f6465d] pb-1 border-b border-[#2b313a]">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-[#f6465d]" />
                  <span>Zona Bearish (Breakdown)</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#f6465d]/10 text-[#f6465d]">
                  S1 ➔ S4-
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {BEARISH_GROUP.map((cond) => {
                  const isSelected = filters.pivotCondition === cond.value;
                  const count = conditionCounts?.[cond.value] ?? 0;
                  const Icon = cond.icon;
                  return (
                    <button
                      key={cond.value}
                      onClick={() =>
                        onFilterChange({
                          pivotCondition: isSelected ? 'ALL' : cond.value,
                        })
                      }
                      className={`flex items-center justify-between p-1.5 rounded-xs text-left border transition-colors ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-[#181a20] border-[#2b313a] text-[#eaecef] hover:border-[#f6465d]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded-xs tabular-nums ${
                          isSelected
                            ? 'bg-black/30 text-white font-bold'
                            : count > 0
                            ? 'bg-[#f6465d]/15 text-[#f6465d] font-semibold'
                            : 'text-[#474d57]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
