import React from 'react';
import { ScreenerStats, FilterState } from '../types';
import { Target, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface StatsOverviewProps {
  stats: ScreenerStats | null;
  totalFiltered: number;
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  totalFiltered,
  filters,
  onFilterChange,
}) => {
  if (!stats) return null;

  const isUnder5Active = filters.enablePercentFilter && filters.maxPercent === 5 && filters.selectedTimeframe === 'h24';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Filter < 5% 24 Jam */}
      <button
        onClick={() => {
          if (isUnder5Active) {
            onFilterChange({ enablePercentFilter: false });
          } else {
            onFilterChange({
              selectedTimeframe: 'h24',
              maxPercent: 5,
              enablePercentFilter: true,
              filterMode: 'absolute_below'
            });
          }
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          isUnder5Active
            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">24h &lt; 5%</span>
          </div>
          {isUnder5Active && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-zinc-100 tracking-tight">
          {stats.under5pct24h}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Perubahan 24j di bawah 5%
        </p>
      </button>

      {/* 2. Area P (Pivot Point) */}
      <button
        onClick={() => {
          onFilterChange({
            pivotCondition: filters.pivotCondition === 'AREA_P' ? 'ALL' : 'AREA_P'
          });
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          filters.pivotCondition === 'AREA_P'
            ? 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Target className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">Area P</span>
          </div>
          {filters.pivotCondition === 'AREA_P' && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 tracking-tight">
          {stats.areaP}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Konsolidasi dekat Pivot P
        </p>
      </button>

      {/* 3. Tembus R1 -> R2 (Breakout) */}
      <button
        onClick={() => {
          onFilterChange({
            pivotCondition: filters.pivotCondition === 'R1_TO_R2' ? 'ALL' : 'R1_TO_R2'
          });
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          filters.pivotCondition === 'R1_TO_R2'
            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">R1 ➔ R2</span>
          </div>
          {filters.pivotCondition === 'R1_TO_R2' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 tracking-tight">
          {stats.r1ToR2}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Tembus R1 menuju R2
        </p>
      </button>

      {/* 4. Pantul S1 -> P (Bounce) */}
      <button
        onClick={() => {
          onFilterChange({
            pivotCondition: filters.pivotCondition === 'S1_TO_P' ? 'ALL' : 'S1_TO_P'
          });
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          filters.pivotCondition === 'S1_TO_P'
            ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">S1 ➔ P</span>
          </div>
          {filters.pivotCondition === 'S1_TO_P' && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-teal-400 tracking-tight">
          {stats.s1ToP}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Pantul S1 menuju P
        </p>
      </button>

      {/* 5. Tembus S1 -> S2 (Breakdown) */}
      <button
        onClick={() => {
          onFilterChange({
            pivotCondition: filters.pivotCondition === 'S1_TO_S2' ? 'ALL' : 'S1_TO_S2'
          });
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          filters.pivotCondition === 'S1_TO_S2'
            ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrendingDown className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">S1 ➔ S2</span>
          </div>
          {filters.pivotCondition === 'S1_TO_S2' && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_#fb7185]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 tracking-tight">
          {stats.s1ToS2}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Tembus S1 menuju S2
        </p>
      </button>

      {/* 6. Tolak R1 -> P (Rejection) */}
      <button
        onClick={() => {
          onFilterChange({
            pivotCondition: filters.pivotCondition === 'R1_TO_P' ? 'ALL' : 'R1_TO_P'
          });
        }}
        className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
          filters.pivotCondition === 'R1_TO_P'
            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ArrowDownRight className="w-3 h-3 stroke-[2.2]" />
            </span>
            <span className="text-zinc-300 text-xs">R1 ➔ P</span>
          </div>
          {filters.pivotCondition === 'R1_TO_P' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]"></span>
          )}
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 tracking-tight">
          {stats.r1ToP}
        </div>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">
          Tertahan di R1 menuju P
        </p>
      </button>
    </div>
  );
};
