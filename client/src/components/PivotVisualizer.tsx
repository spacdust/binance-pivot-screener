import React from 'react';
import { Pivots } from '../types';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S2) to 100 (R2)
}

export const PivotVisualizer: React.FC<PivotVisualizerProps> = ({
  pivots,
  currentPrice,
  rangePercent,
}) => {
  // Clamp between 0% and 100%
  const clampedPercent = Math.max(2, Math.min(98, rangePercent));

  return (
    <div className="w-full flex flex-col gap-1 min-w-[140px] max-w-[200px]">
      {/* Gauge track */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center">
        {/* Color segments: S2->S1 (Rose), S1->P (Amber), P->R1 (Sky), R1->R2 (Emerald) */}
        <div className="h-full w-1/4 bg-rose-500/25 border-r border-zinc-900" title={`S2: ${pivots.S2.toFixed(4)}`} />
        <div className="h-full w-1/4 bg-amber-500/25 border-r border-zinc-900" title={`S1: ${pivots.S1.toFixed(4)}`} />
        <div className="h-full w-1/4 bg-sky-500/25 border-r border-zinc-900" title={`P: ${pivots.P.toFixed(4)}`} />
        <div className="h-full w-1/4 bg-emerald-500/25" title={`R1: ${pivots.R1.toFixed(4)}`} />

        {/* Current price indicator marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-zinc-950 transition-all duration-300"
          style={{ left: `calc(${clampedPercent}% - 5px)` }}
        />
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-[9px] font-mono text-zinc-500 leading-none">
        <span className="text-rose-400">S2</span>
        <span className="text-amber-400">S1</span>
        <span className="text-sky-400 font-bold">P</span>
        <span className="text-purple-400">R1</span>
        <span className="text-emerald-400">R2</span>
      </div>
    </div>
  );
};
