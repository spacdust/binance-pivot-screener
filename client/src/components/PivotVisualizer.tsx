import React from 'react';
import { Pivots } from '../types';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S3) to 100 (R3)
}

export const PivotVisualizer: React.FC<PivotVisualizerProps> = ({
  pivots,
  currentPrice,
  rangePercent,
}) => {
  // Clamp between 2% and 98%
  const clampedPercent = Math.max(2, Math.min(98, rangePercent));

  return (
    <div className="w-full flex flex-col gap-1 min-w-[150px] max-w-[210px]">
      {/* Gauge track */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center">
        {/* Color segments: S3->S2, S2->S1, S1->P, P->R1, R1->R2, R2->R3 */}
        <div className="h-full w-[16.6%] bg-red-600/35 border-r border-zinc-900" title={`S3: ${pivots.S3.toFixed(4)}`} />
        <div className="h-full w-[16.6%] bg-rose-500/25 border-r border-zinc-900" title={`S2: ${pivots.S2.toFixed(4)}`} />
        <div className="h-full w-[16.6%] bg-amber-500/25 border-r border-zinc-900" title={`S1: ${pivots.S1.toFixed(4)}`} />
        <div className="h-full w-[16.6%] bg-sky-500/25 border-r border-zinc-900" title={`P: ${pivots.P.toFixed(4)}`} />
        <div className="h-full w-[16.6%] bg-emerald-500/25 border-r border-zinc-900" title={`R1: ${pivots.R1.toFixed(4)}`} />
        <div className="h-full w-[17%] bg-purple-500/35" title={`R2/R3: ${pivots.R2.toFixed(4)} - ${pivots.R3.toFixed(4)}`} />

        {/* Current price indicator marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-zinc-950 transition-all duration-300"
          style={{ left: `calc(${clampedPercent}% - 5px)` }}
        />
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-[8px] font-mono text-zinc-500 leading-none">
        <span className="text-red-500 font-semibold" title={`S3: ${pivots.S3.toFixed(2)}`}>S3</span>
        <span className="text-rose-400" title={`S2: ${pivots.S2.toFixed(2)}`}>S2</span>
        <span className="text-amber-400" title={`S1: ${pivots.S1.toFixed(2)}`}>S1</span>
        <span className="text-sky-400 font-bold" title={`P: ${pivots.P.toFixed(2)}`}>P</span>
        <span className="text-emerald-400" title={`R1: ${pivots.R1.toFixed(2)}`}>R1</span>
        <span className="text-purple-400" title={`R2: ${pivots.R2.toFixed(2)}`}>R2</span>
        <span className="text-fuchsia-400 font-semibold" title={`R3: ${pivots.R3.toFixed(2)}`}>R3</span>
      </div>
    </div>
  );
};
