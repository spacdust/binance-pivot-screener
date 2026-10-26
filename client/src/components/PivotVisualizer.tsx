import React from 'react';
import { Pivots } from '../types';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S4) to 100 (R4)
}

export const PivotVisualizer: React.FC<PivotVisualizerProps> = ({
  pivots,
  rangePercent,
}) => {
  // Clamp between 3% and 97% for smooth dot visibility
  const clampedPercent = Math.max(3, Math.min(97, rangePercent));

  const s4Val = pivots.S4 ?? (pivots.S3 - (pivots.S2 - pivots.S3));
  const r4Val = pivots.R4 ?? (pivots.R3 + (pivots.R3 - pivots.R2));

  return (
    <div className="w-full flex flex-col gap-1 min-w-[110px] max-w-[150px] mx-auto">
      {/* Sleek Dual-Zone Gauge Track */}
      <div className="relative h-1.5 bg-zinc-800/90 rounded-full overflow-hidden flex items-center shadow-inner">
        {/* Support Half (S4 -> P): Soft Red Gradient */}
        <div className="h-full w-1/2 bg-gradient-to-r from-rose-900/40 via-rose-500/20 to-zinc-800/60" />

        {/* Resistance Half (P -> R4): Soft Green Gradient */}
        <div className="h-full w-1/2 bg-gradient-to-r from-zinc-800/60 via-emerald-500/20 to-emerald-900/40" />

        {/* Center Pivot P Notch */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-sky-400 z-10 -translate-x-1/2"
          title={`Pivot Center P: ${pivots.P.toFixed(2)}`}
        />

        {/* S1 & R1 Subtle Ticks */}
        <div className="absolute left-[37.5%] top-0 bottom-0 w-px bg-zinc-700/60 pointer-events-none" />
        <div className="absolute left-[62.5%] top-0 bottom-0 w-px bg-zinc-700/60 pointer-events-none" />

        {/* Glowing Current Price Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] border border-zinc-950 transition-all duration-300 pointer-events-none z-20"
          style={{ left: `calc(${clampedPercent}% - 5px)` }}
        />
      </div>

      {/* Clean 3-Point Axis (S4 ... P ... R4) */}
      <div className="flex justify-between text-[8px] font-mono leading-none text-zinc-500 px-0.5">
        <span className="text-rose-400/80 font-medium" title={`Support S4: ${s4Val.toFixed(2)}`}>
          S4
        </span>
        <span className="text-sky-400 font-bold" title={`Pivot P: ${pivots.P.toFixed(2)}`}>
          P
        </span>
        <span className="text-emerald-400/80 font-medium" title={`Resistance R4: ${r4Val.toFixed(2)}`}>
          R4
        </span>
      </div>
    </div>
  );
};
