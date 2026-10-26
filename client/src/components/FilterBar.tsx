import React from 'react';
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
  Layers,
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
  SlidersHorizontal
} from 'lucide-react';

interface FilterBarProps {
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

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  resultCount,
  conditionCounts,
  confluenceCount,
}) => {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 lg:p-5 space-y-4 shadow-xl backdrop-blur-sm">
      {/* Row 1: Search + Result Count + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Cari simbol (contoh: BTC, SOL, PEPE, ETH)..."
            className="w-full bg-zinc-950/80 border border-zinc-800/90 rounded-xl pl-10 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-xs text-zinc-400 font-medium">
            Ditemukan:{' '}
            <span className="font-bold text-amber-400 font-mono tabular-nums text-sm">
              {resultCount}
            </span>{' '}
            koin
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 transition-all font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800/70" />

      {/* Row 2: Top Movers Categories */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-3 h-3 stroke-[2.2]" />
            </span>
            Kategori Top Movers:
          </label>
          <span className="text-[11px] text-zinc-500 hidden sm:inline font-mono">
            {TOP_MOVER_CATEGORIES.find((c) => c.key === filters.topMoverCategory)?.desc}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TOP_MOVER_CATEGORIES.map((cat) => {
            const isActive = filters.topMoverCategory === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => onFilterChange({ topMoverCategory: cat.key })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md shadow-white/5 ring-1 ring-white/50 font-bold'
                    : 'bg-zinc-950/70 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 stroke-[2.2] ${isActive ? 'text-zinc-950' : cat.iconColor}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-zinc-800/70" />

      {/* Row 3: Timeframe selector & Percentage Threshold Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Timeframe Buttons */}
        <div className="lg:col-span-6 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
            Pilih Timeframe Perubahan Harga (1m s/d 24j):
          </label>
          <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/90 gap-1 overflow-x-auto">
            {TIMEFRAMES.map((tf) => {
              const active = filters.selectedTimeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  onClick={() => onFilterChange({ selectedTimeframe: tf.key })}
                  className={`flex-1 min-w-[36px] py-1.5 px-1.5 text-center rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Percentage Filter Threshold */}
        <div className="lg:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enablePercent"
                checked={filters.enablePercentFilter}
                onChange={(e) => onFilterChange({ enablePercentFilter: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
              />
              <label htmlFor="enablePercent" className="font-medium text-zinc-300 cursor-pointer flex items-center gap-1">
                Filter Perubahan &le; <span className="font-mono tabular-nums font-bold text-amber-400">{filters.maxPercent}%</span>
              </label>
            </div>

            {/* Mode selection: |%| < X or % < X */}
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span className="hidden sm:inline">Mode:</span>
              <button
                onClick={() => onFilterChange({ filterMode: 'absolute_below' })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  filters.filterMode === 'absolute_below'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                    : 'hover:text-zinc-200 text-zinc-500'
                }`}
                title="Perubahan mutlak: -5% s/d +5%"
              >
                |&plusmn;{filters.maxPercent}%| Sideways
              </button>
              <button
                onClick={() => onFilterChange({ filterMode: 'below' })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  filters.filterMode === 'below'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                    : 'hover:text-zinc-200 text-zinc-500'
                }`}
                title="Hanya nilai di bawah threshold"
              >
                &lt; {filters.maxPercent}%
              </button>
            </div>
          </div>

          {/* Quick presets and slider */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs text-zinc-500">Preset:</span>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-medium border transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm font-bold'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  &lt; {pct}%
                </button>
              );
            })}

            {/* Custom slider */}
            <div className="flex-1 min-w-[120px] flex items-center gap-2 ml-2">
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
                className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-zinc-400 w-10 text-right">
                {filters.maxPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-800/70" />

      {/* Row 4: Pivot Conditions Filter Categorized into 3 Market Zones */}
      <div className="flex flex-col gap-3">
        {/* Top Control: Section Title + "Semua Kondisi" + "3TF Confluence" Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Target className="w-3.5 h-3.5 stroke-[2.2]" />
            </span>
            <div>
              <span className="text-xs font-semibold text-zinc-200">
                Filter Kondisi Pivot Point
              </span>
              <span className="text-[11px] text-zinc-500 ml-2 font-mono hidden sm:inline">
                (Daily Pivot &bull; Multi-Zone)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Semua Kondisi (ALL) Button */}
            <button
              onClick={() => onFilterChange({ pivotCondition: 'ALL' })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all ${
                filters.pivotCondition === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 border-white shadow-md shadow-white/10 font-bold'
                  : 'bg-zinc-950/80 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua Kondisi</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums ${
                  filters.pivotCondition === 'ALL'
                    ? 'bg-zinc-900 text-zinc-100 font-bold'
                    : 'bg-zinc-800/80 text-zinc-300'
                }`}
              >
                {conditionCounts?.ALL ?? resultCount}
              </span>
            </button>

            {/* 3TF Confluence Toggle */}
            <button
              onClick={() => onFilterChange({ onlyConfluence: !filters.onlyConfluence })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                filters.onlyConfluence
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                  : 'bg-zinc-950/90 text-amber-400 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/10'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${filters.onlyConfluence ? 'fill-zinc-950' : 'fill-amber-400'}`} />
              <span>3TF Confluence</span>
              {typeof confluenceCount === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold tabular-nums ${
                    filters.onlyConfluence
                      ? 'bg-zinc-950 text-amber-300'
                      : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {confluenceCount}
                </span>
              )}
              {filters.onlyConfluence && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* 3-Column Categorized Market Zone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Zona Bullish (Breakout & Resistance Targets) */}
          <div className="bg-zinc-950/60 border border-emerald-950/40 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 text-emerald-400 stroke-[2.2]" />
                </span>
                <span>Zona Bullish (Breakout)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20 font-semibold">
                R1 ➔ R4+
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
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
                    className={`flex items-center justify-between gap-1 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? cond.selectedClass
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] ${isSelected ? 'text-zinc-950' : cond.iconColor}`} />
                      <div className="truncate">
                        <div className="font-mono font-bold text-[11px] leading-tight">{cond.code}</div>
                        <div className={`text-[10px] truncate leading-tight ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>{cond.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                        isSelected
                          ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                          : count > 0
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20'
                          : 'bg-zinc-800/40 text-zinc-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Center Pivot & Reversal (Konsolidasi & Retest) */}
          <div className="bg-zinc-950/60 border border-sky-950/40 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <span className="p-1 rounded-md bg-sky-500/10 border border-sky-500/20">
                  <Target className="w-3 h-3 text-sky-400 stroke-[2.2]" />
                </span>
                <span>Center & Reversal</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300/80 border border-sky-500/20 font-semibold">
                Area P & Retest
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
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
                    className={`flex items-center justify-between gap-1 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? cond.selectedClass
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-sky-500/40 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] ${isSelected ? 'text-zinc-950' : cond.iconColor}`} />
                      <div className="truncate">
                        <div className="font-mono font-bold text-[11px] leading-tight">{cond.code}</div>
                        <div className={`text-[10px] truncate leading-tight ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>{cond.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                        isSelected
                          ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                          : count > 0
                          ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/20'
                          : 'bg-zinc-800/40 text-zinc-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Zona Bearish (Breakdown & Support Levels) */}
          <div className="bg-zinc-950/60 border border-rose-950/40 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <span className="p-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                  <TrendingDown className="w-3 h-3 text-rose-400 stroke-[2.2]" />
                </span>
                <span>Zona Bearish (Breakdown)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300/80 border border-rose-500/20 font-semibold">
                S1 ➔ S4-
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
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
                    className={`flex items-center justify-between gap-1 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? cond.selectedClass
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-rose-500/40 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 stroke-[2.2] ${isSelected ? 'text-white' : cond.iconColor}`} />
                      <div className="truncate">
                        <div className="font-mono font-bold text-[11px] leading-tight">{cond.code}</div>
                        <div className={`text-[10px] truncate leading-tight ${isSelected ? 'text-zinc-100 font-semibold' : 'text-zinc-500'}`}>{cond.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 tabular-nums ${
                        isSelected
                          ? 'bg-zinc-950/30 text-white font-bold'
                          : count > 0
                          ? 'bg-rose-500/15 text-rose-400 font-semibold border border-rose-500/20'
                          : 'bg-zinc-800/40 text-zinc-600'
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
    </div>
  );
};
