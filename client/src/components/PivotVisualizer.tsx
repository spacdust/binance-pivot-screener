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
  // Clamp between 1.5% and 98.5% for pinpoint marker visibility
  const clampedPercent = Math.max(1.5, Math.min(98.5, rangePercent));

  const s4Val = pivots.S4 ?? (pivots.S3 - (pivots.S2 - pivots.S3));
  const r4Val = pivots.R4 ?? (pivots.R3 + (pivots.R3 - pivots.R2));

  return (
    <div className="w-full flex flex-col min-w-[115px] max-w-[155px] mx-auto select-none">
      {/* 8-Zone Precision Segmented Track with Clear R / S / P Boundaries */}
      <div className="relative h-2 bg-[#12151a] rounded-xs border border-[#2b313a] flex items-center overflow-visible shadow-xs">
        {/* Support Half: S4..S3 (12.5%), S3..S2 (12.5%), S2..S1 (12.5%), S1..P (12.5%) */}
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/35 border-r border-[#2b313a]"
          title={`S4 - S3: ${s4Val.toFixed(2)} - ${pivots.S3.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/24 border-r border-[#2b313a]"
          title={`S3 - S2: ${pivots.S3.toFixed(2)} - ${pivots.S2.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/16 border-r border-[#2b313a]"
          title={`S2 - S1: ${pivots.S2.toFixed(2)} - ${pivots.S1.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/08 border-r border-[#2b313a]"
          title={`S1 - P: ${pivots.S1.toFixed(2)} - ${pivots.P.toFixed(2)}`}
        />

        {/* Resistance Half: P..R1 (12.5%), R1..R2 (12.5%), R2..R3 (12.5%), R3..R4 (12.5%) */}
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/08 border-r border-[#2b313a]"
          title={`P - R1: ${pivots.P.toFixed(2)} - ${pivots.R1.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/16 border-r border-[#2b313a]"
          title={`R1 - R2: ${pivots.R1.toFixed(2)} - ${pivots.R2.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/24 border-r border-[#2b313a]"
          title={`R2 - R3: ${pivots.R2.toFixed(2)} - ${pivots.R3.toFixed(2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/35"
          title={`R3 - R4: ${pivots.R3.toFixed(2)} - ${r4Val.toFixed(2)}`}
        />

        {/* S1 Key Divider Tick (37.5%) */}
        <div
          className="absolute left-[37.5%] -top-[1px] -bottom-[1px] w-[1px] bg-[#f6465d]/70 z-10 -translate-x-1/2 pointer-events-none"
          title={`Support 1 (S1): ${pivots.S1.toFixed(2)}`}
        />

        {/* Center Pivot P Distinct Notch (50%) in Binance Yellow */}
        <div
          className="absolute left-1/2 -top-[2px] -bottom-[2px] w-[2px] bg-[#f0b90b] z-10 -translate-x-1/2 shadow-xs pointer-events-none"
          title={`Center Pivot (P): ${pivots.P.toFixed(2)}`}
        />

        {/* R1 Key Divider Tick (62.5%) */}
        <div
          className="absolute left-[62.5%] -top-[1px] -bottom-[1px] w-[1px] bg-[#0ecb81]/70 z-10 -translate-x-1/2 pointer-events-none"
          title={`Resistance 1 (R1): ${pivots.R1.toFixed(2)}`}
        />

        {/* Precise Small Current Price Marker (5px Sharp Dot, Zero Blurry Glare) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-white ring-1 ring-black/90 pointer-events-none z-20 transition-all duration-200"
          style={{ left: `calc(${clampedPercent}% - 2.5px)` }}
        />
      </div>

      {/* Clean 5-Point Reference Scale (S4 · S2 · P · R2 · R4) */}
      <div className="flex justify-between text-[8px] font-mono leading-none text-[#848e9c] px-0.5 mt-1">
        <span className="text-[#f6465d] font-semibold" title={`S4: ${s4Val.toFixed(2)}`}>
          S4
        </span>
        <span className="text-[#f6465d]/70" title={`S2: ${pivots.S2.toFixed(2)}`}>
          S2
        </span>
        <span className="text-[#f0b90b] font-bold" title={`Pivot Center P: ${pivots.P.toFixed(2)}`}>
          P
        </span>
        <span className="text-[#0ecb81]/70" title={`R2: ${pivots.R2.toFixed(2)}`}>
          R2
        </span>
        <span className="text-[#0ecb81] font-semibold" title={`R4: ${r4Val.toFixed(2)}`}>
          R4
        </span>
      </div>
    </div>
  );
};
