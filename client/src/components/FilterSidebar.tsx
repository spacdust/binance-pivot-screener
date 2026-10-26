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
  { key: 'ALL', label: 'Semua Koin', icon: LayoutGrid, iconColor: 'text-zinc-400', desc: 'Seluruh koin USDT aktif' },
  { key: 'TOP_GAINERS', label: 'Top Gainers', icon: TrendingUp, iconColor: 'text-emerald-400', desc: 'Kenaikan persentase tertinggi' },
  { key: 'TOP_LOSERS', label: 'Top Losers', icon: TrendingDown, iconColor: 'text-rose-400', desc: 'Penurunan terdalam (Buy on dip)' },
  { key: 'FLASH_MOVERS', label: 'Flash Spike', icon: Zap, iconColor: 'text-amber-400', desc: 'Volatilitas kilat di 1m / 5m' },
  { key: 'TOP_VOLUME', label: 'Top Volume', icon: BarChart3, iconColor: 'text-sky-400', desc: 'Turnover USDT 24 jam terbesar' },
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
  { value: 'R1_TO_R2', code: 'R1 ➔ R2', label: 'Tembus R1 ➔ R2', desc: 'Breakout', icon: ChevronsUp, iconColor: 'text-emerald-400', selectedClass: 'bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20' },
  { value: 'R2_TO_R3', code: 'R2 ➔ R3', label: 'Tembus R2 ➔ R3', desc: 'Super Bullish', icon: Rocket, iconColor: 'text-purple-400', selectedClass: 'bg-purple-500 text-zinc-950 font-bold border-purple-400 shadow-md shadow-purple-500/20' },
  { value: 'R3_TO_R4', code: 'R3 ➔ R4', label: 'Tembus R3 ➔ R4', desc: 'Hyper Pump', icon: Flame, iconColor: 'text-fuchsia-400', selectedClass: 'bg-fuchsia-500 text-zinc-950 font-bold border-fuchsia-400 shadow-md shadow-fuchsia-500/20' },
  { value: 'ABOVE_R4', code: '> R4', label: 'Di atas R4', desc: 'Mega Pump', icon: Sparkles, iconColor: 'text-pink-400', selectedClass: 'bg-pink-500 text-zinc-950 font-bold border-pink-400 shadow-md shadow-pink-500/20' },
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
  { value: 'AREA_P', code: 'Area P', label: 'Area P', desc: 'Konsolidasi', icon: Target, iconColor: 'text-sky-400', selectedClass: 'bg-sky-500 text-zinc-950 font-bold border-sky-400 shadow-md shadow-sky-500/20' },
  { value: 'S1_TO_P', code: 'S1 ➔ P', label: 'Pantul S1 ➔ P', desc: 'Reversal', icon: ArrowUpRight, iconColor: 'text-teal-400', selectedClass: 'bg-teal-500 text-zinc-950 font-bold border-teal-400 shadow-md shadow-teal-500/20' },
  { value: 'R1_TO_P', code: 'R1 ➔ P', label: 'Tolak R1 ➔ P', desc: 'Pullback', icon: ArrowDownRight, iconColor: 'text-amber-400', selectedClass: 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20' },
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
  { value: 'S1_TO_S2', code: 'S1 ➔ S2', label: 'Tembus S1 ➔ S2', desc: 'Breakdown', icon: ChevronsDown, iconColor: 'text-rose-400', selectedClass: 'bg-rose-500 text-zinc-950 font-bold border-rose-400 shadow-md shadow-rose-500/20' },
  { value: 'S2_TO_S3', code: 'S2 ➔ S3', label: 'Tembus S2 ➔ S3', desc: 'Diskon Ekstrem', icon: ShieldAlert, iconColor: 'text-red-400', selectedClass: 'bg-red-500 text-zinc-950 font-bold border-red-400 shadow-md shadow-red-500/20' },
  { value: 'S3_TO_S4', code: 'S3 ➔ S4', label: 'Tembus S3 ➔ S4', desc: 'Kapitulasi Berat', icon: AlertTriangle, iconColor: 'text-red-500', selectedClass: 'bg-red-600 text-white font-bold border-red-500 shadow-md shadow-red-600/20' },
  { value: 'BELOW_S4', code: '< S4', label: 'Di bawah S4', desc: 'Oversold Maksimal', icon: AlertOctagon, iconColor: 'text-red-600', selectedClass: 'bg-red-700 text-white font-bold border-red-600 shadow-md shadow-red-700/20' },
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
        className={`fixed lg:static top-[52px] bottom-0 left-0 z-40 bg-[#0b0e14]/98 border-r border-[#1c2333] flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen
            ? 'w-80 translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-[#1c2333] flex items-center justify-between shrink-0 bg-[#0e121a]/60">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
            </span>
            <span className="text-xs font-bold text-zinc-100">Filter Screener</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-zinc-950">
                {activeCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activeCount > 0 && (
              <button
                onClick={onReset}
                title="Reset Semua Filter"
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-100 bg-zinc-800/60 hover:bg-zinc-800 rounded-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onToggle}
              title="Minimize Sidebar"
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Controls Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar text-xs">
          {/* Section 1: Search */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cari Koin</span>
              <span className="font-mono text-amber-400 font-bold normal-case">
                {resultCount} koin
              </span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                placeholder="BTC, SOL, PEPE, ETH..."
                className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-800/70" />

          {/* Section 2: 3TF Confluence Highlight Banner */}
          <button
            onClick={() => onFilterChange({ onlyConfluence: !filters.onlyConfluence })}
            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
              filters.onlyConfluence
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/40'
                : 'bg-zinc-900/60 border-amber-500/20 hover:border-amber-400/40 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-lg ${filters.onlyConfluence ? 'bg-amber-400 text-zinc-950' : 'bg-amber-500/10 text-amber-400'}`}>
                <Zap className="w-3.5 h-3.5 stroke-[2.2] fill-current" />
              </span>
              <div>
                <div className="font-bold text-zinc-100 text-[11px] leading-tight flex items-center gap-1.5">
                  <span>3TF Confluence</span>
                  {filters.onlyConfluence && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">Area Daily, 1H & 5M Selaras</div>
              </div>
            </div>
            {typeof confluenceCount === 'number' && (
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md tabular-nums ${
                  filters.onlyConfluence
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {confluenceCount}
              </span>
            )}
          </button>

          <div className="h-px bg-zinc-800/70" />

          {/* Section 3: Kategori Top Movers */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
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
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 border-white shadow-sm font-bold'
                        : 'bg-zinc-900/60 text-zinc-300 border-zinc-800/70 hover:bg-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : cat.iconColor}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      {cat.key === 'ALL' ? 'Semua' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-zinc-800/70" />

          {/* Section 4: Filter Persentase / Sideways dengan Pilihan Timeframe Acuan Terpadu */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sidebarEnablePercent"
                  checked={filters.enablePercentFilter}
                  onChange={(e) => onFilterChange({ enablePercentFilter: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-amber-500 cursor-pointer accent-amber-500"
                />
                <label htmlFor="sidebarEnablePercent" className="font-semibold text-zinc-200 cursor-pointer text-xs flex items-center gap-1">
                  <span>Filter Sideways</span>
                  <span className="font-mono text-amber-400 font-bold">&le; {filters.maxPercent}%</span>
                </label>
              </div>

              {/* Compact Timeframe Dropdown */}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <select
                  value={filters.selectedTimeframe}
                  onChange={(e) => onFilterChange({ selectedTimeframe: e.target.value as SelectedTimeframe })}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] font-mono rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            <div className="grid grid-cols-2 gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => onFilterChange({ filterMode: 'absolute_below' })}
                className={`py-1 px-1.5 rounded text-[10px] font-mono transition-colors text-center ${
                  filters.filterMode === 'absolute_below'
                    ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                |&plusmn;{filters.maxPercent}%| Sideways
              </button>
              <button
                onClick={() => onFilterChange({ filterMode: 'below' })}
                className={`py-1 px-1.5 rounded text-[10px] font-mono transition-colors text-center ${
                  filters.filterMode === 'below'
                    ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                &lt; {filters.maxPercent}%
              </button>
            </div>

            {/* Presets and custom slider */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-500 mr-0.5">Preset:</span>
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
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums border ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
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
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] font-mono tabular-nums text-zinc-400 w-8 text-right">
                {filters.maxPercent}%
              </span>
            </div>
          </div>

          <div className="h-px bg-zinc-800/70" />

          {/* Section 5: Filter Kondisi Pivot Point */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3 text-sky-400" />
                <span>Kondisi Pivot Daily</span>
              </label>

              {/* Reset to ALL condition */}
              <button
                onClick={() => onFilterChange({ pivotCondition: 'ALL' })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                  filters.pivotCondition === 'ALL'
                    ? 'bg-zinc-100 text-zinc-950 border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Semua ({conditionCounts?.ALL ?? resultCount})
              </button>
            </div>

            {/* Sub-card 1: Zona Bullish */}
            <div className="bg-zinc-900/40 border border-emerald-950/50 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 pb-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Zona Bullish (Breakout)</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
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
                      className={`flex items-center justify-between p-1.5 rounded-lg text-left border transition-all ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-zinc-950' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded tabular-nums ${
                          isSelected
                            ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                            : count > 0
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                            : 'text-zinc-600'
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
            <div className="bg-zinc-900/40 border border-sky-950/50 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 pb-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-sky-400" />
                  <span>Center & Reversal</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-400">
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
                      className={`flex items-center justify-between p-1.5 rounded-lg text-left border transition-all ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:border-sky-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-zinc-950' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                        <span className={`text-[9px] truncate ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>{cond.desc}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded tabular-nums ${
                          isSelected
                            ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                            : count > 0
                            ? 'bg-sky-500/15 text-sky-400 font-semibold'
                            : 'text-zinc-600'
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
            <div className="bg-zinc-900/40 border border-rose-950/50 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 pb-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  <span>Zona Bearish (Breakdown)</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/10 text-rose-400">
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
                      className={`flex items-center justify-between p-1.5 rounded-lg text-left border transition-all ${
                        isSelected
                          ? cond.selectedClass
                          : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : cond.iconColor}`} />
                        <span className="font-mono text-[10px] font-bold truncate">{cond.code}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1 rounded tabular-nums ${
                          isSelected
                            ? 'bg-zinc-950/30 text-white font-bold'
                            : count > 0
                            ? 'bg-rose-500/15 text-rose-400 font-semibold'
                            : 'text-zinc-600'
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
