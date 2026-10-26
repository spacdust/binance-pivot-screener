import React from 'react';
import { Pivots } from '../types';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S4) to 100 (R4)
}

export const PivotVisualizer: React.FC<PivotVisualizerProps> = ({
  pivots,
  currentPrice,
  rangePercent,
}) => {
  // Clamp between 2% and 98%
  const clampedPercent = Math.max(2, Math.min(98, rangePercent));

  const s4Val = pivots.S4 ?? (pivots.S3 - (pivots.S2 - pivots.S3));
  const r4Val = pivots.R4 ?? (pivots.R3 + (pivots.R3 - pivots.R2));

  return (
    <div className="w-full flex flex-col gap-1 min-w-[120px] max-w-[170px] mx-auto">
      {/* Gauge track */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center">
        {/* 8 Color segments: S4->S3, S3->S2, S2->S1, S1->P, P->R1, R1->R2, R2->R3, R3->R4 */}
        <div className="h-full w-[12.5%] bg-red-900/50 border-r border-zinc-900" title={`S4: ${s4Val.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-red-600/35 border-r border-zinc-900" title={`S3: ${pivots.S3.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-rose-500/25 border-r border-zinc-900" title={`S2: ${pivots.S2.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-amber-500/25 border-r border-zinc-900" title={`S1: ${pivots.S1.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-sky-500/25 border-r border-zinc-900" title={`P: ${pivots.P.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-emerald-500/25 border-r border-zinc-900" title={`R1: ${pivots.R1.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-purple-500/30 border-r border-zinc-900" title={`R2: ${pivots.R2.toFixed(4)}`} />
        <div className="h-full w-[12.5%] bg-fuchsia-500/35" title={`R3/R4: ${pivots.R3.toFixed(4)} - ${r4Val.toFixed(4)}`} />

        {/* Current price indicator marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-zinc-950 transition-all duration-300 pointer-events-none"
          style={{ left: `calc(${clampedPercent}% - 5px)` }}
        />
      </div>

      {/* Axis Labels (S4 to R4) */}
      <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 leading-none">
        <span className="text-red-600 font-bold" title={`S4: ${s4Val.toFixed(2)}`}>S4</span>
        <span className="text-red-400 font-semibold" title={`S3: ${pivots.S3.toFixed(2)}`}>S3</span>
        <span className="text-rose-400" title={`S2: ${pivots.S2.toFixed(2)}`}>S2</span>
        <span className="text-amber-400" title={`S1: ${pivots.S1.toFixed(2)}`}>S1</span>
        <span className="text-sky-400 font-bold" title={`P: ${pivots.P.toFixed(2)}`}>P</span>
        <span className="text-emerald-400" title={`R1: ${pivots.R1.toFixed(2)}`}>R1</span>
        <span className="text-purple-400" title={`R2: ${pivots.R2.toFixed(2)}`}>R2</span>
        <span className="text-fuchsia-400 font-semibold" title={`R3: ${pivots.R3.toFixed(2)}`}>R3</span>
        <span className="text-pink-400 font-bold" title={`R4: ${r4Val.toFixed(2)}`}>R4</span>
      </div>
    </div>
  );
};
