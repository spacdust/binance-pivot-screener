import React from 'react';
import { FilterState, PivotConditionType, SelectedTimeframe } from '../types';
import { Search, SlidersHorizontal, X, Clock, Target, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  resultCount: number;
}

const TIMEFRAMES: { key: SelectedTimeframe; label: string }[] = [
  { key: 'h24', label: '24 Jam' },
  { key: 'h12', label: '12 Jam' },
  { key: 'h6', label: '6 Jam' },
  { key: 'h3', label: '3 Jam' },
  { key: 'h1', label: '1 Jam' },
];

const QUICK_PERCENT_PRESETS = [1, 2, 3, 5, 10];

const PIVOT_CONDITIONS: { value: PivotConditionType; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Semua Kondisi', icon: '🌐' },
  { value: 'AREA_P', label: 'Area P (Konsolidasi)', icon: '🎯' },
  { value: 'S1_TO_S2', label: 'Tembus S1 ➔ S2 (Breakdown)', icon: '🔴' },
  { value: 'S1_TO_P', label: 'Pantul S1 ➔ P (Reversal)', icon: '🟢' },
  { value: 'R1_TO_R2', label: 'Tembus R1 ➔ R2 (Breakout)', icon: '🚀' },
  { value: 'R1_TO_P', label: 'Tolak R1 ➔ P (Pullback)', icon: '🔻' },
  { value: 'ABOVE_R2', label: 'Di atas R2 (Super Bull)', icon: '🔥' },
  { value: 'BELOW_S2', label: 'Di bawah S2 (Super Bear)', icon: '❄️' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  resultCount,
}) => {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 lg:p-5 space-y-4">
      {/* Top row: Search + Reset + Result Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Cari simbol (contoh: BTC, SOL, PEPE, ETH)..."
            className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
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
          <div className="text-xs text-zinc-400">
            Ditemukan: <span className="font-bold text-amber-400 font-mono text-sm">{resultCount}</span> koin
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      </div>

      <div className="h-px bg-zinc-800/80" />

      {/* Row 2: Timeframe selector & Percentage Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Timeframe Buttons */}
        <div className="lg:col-span-5 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pilih Timeframe Perubahan Harga:
          </label>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
            {TIMEFRAMES.map((tf) => {
              const active = filters.selectedTimeframe === tf.key;
              return (
                <button
                  key={tf.key}
                  onClick={() => onFilterChange({ selectedTimeframe: tf.key })}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
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
        <div className="lg:col-span-7 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enablePercent"
                checked={filters.enablePercentFilter}
                onChange={(e) => onFilterChange({ enablePercentFilter: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="enablePercent" className="font-medium text-zinc-300 cursor-pointer flex items-center gap-1">
                Filter Perubahan &le; <span className="font-mono font-bold text-amber-400">{filters.maxPercent}%</span>
              </label>
            </div>

            {/* Mode selection: |%| < X or % < X */}
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span className="hidden sm:inline">Mode:</span>
              <button
                onClick={() => onFilterChange({ filterMode: 'absolute_below' })}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  filters.filterMode === 'absolute_below'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'hover:text-zinc-200'
                }`}
                title="Perubahan mutlak: -5% s/d +5%"
              >
                |&plusmn;{filters.maxPercent}%| Sideways
              </button>
              <button
                onClick={() => onFilterChange({ filterMode: 'below' })}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  filters.filterMode === 'below'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'hover:text-zinc-200'
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
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
              <span className="text-xs font-mono text-zinc-400 w-10 text-right">
                {filters.maxPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-800/80" />

      {/* Row 3: Pivot Point Condition Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-sky-400" />
          Filter Kondisi Pivot Point Harian (Daily Pivots):
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PIVOT_CONDITIONS.map((cond) => {
            const isSelected = filters.pivotCondition === cond.value;
            return (
              <button
                key={cond.value}
                onClick={() => onFilterChange({ pivotCondition: cond.value })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md font-semibold'
                    : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <span>{cond.icon}</span>
                <span>{cond.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
