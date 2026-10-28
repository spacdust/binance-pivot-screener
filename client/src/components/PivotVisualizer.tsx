import React from 'react';
import { Pivots } from '../types';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S4) to 100 (R4)
  distP?: number;
  timeframeLabel?: string;
}

const formatPrice = (val: number): string => {
  if (isNaN(val)) return '-';
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(4);
  if (val >= 0.0001) return val.toFixed(6);
  return val.toFixed(8);
};

export const PivotVisualizer: React.FC<PivotVisualizerProps> = ({
  pivots,
  currentPrice,
  rangePercent,
  distP,
  timeframeLabel,
}) => {
  if (!pivots || isNaN(currentPrice)) {
    return (
      <div className="w-[166px] text-center text-[10px] text-[#848e9c] font-mono py-1 mx-auto">
        -
      </div>
    );
  }

  const { P, R1, S1, R2, S2, R3, R4, S3, S4 } = pivots;
  const effectiveR4 = R4 !== undefined ? R4 : R3 + (R3 - R2);
  const effectiveS4 = S4 !== undefined ? S4 : S3 - (S2 - S3);

  // 1. Identify active pivot zone & bounds
  let zoneCode = 'P';
  let lowerName = 'S1';
  let upperName = 'P';
  let lowerVal = S1;
  let upperVal = P;
  let isExtreme: 'ABOVE_R4' | 'BELOW_S4' | null = null;

  if (currentPrice > effectiveR4) {
    isExtreme = 'ABOVE_R4';
    zoneCode = '>R4';
    lowerName = 'R4';
    upperName = '>R4';
    lowerVal = effectiveR4;
    upperVal = effectiveR4 + (effectiveR4 - R3);
  } else if (currentPrice >= R3) {
    zoneCode = 'R3-R4';
    lowerName = 'R3';
    upperName = 'R4';
    lowerVal = R3;
    upperVal = effectiveR4;
  } else if (currentPrice >= R2) {
    zoneCode = 'R2-R3';
    lowerName = 'R2';
    upperName = 'R3';
    lowerVal = R2;
    upperVal = R3;
  } else if (currentPrice >= R1) {
    zoneCode = 'R1-R2';
    lowerName = 'R1';
    upperName = 'R2';
    lowerVal = R1;
    upperVal = R2;
  } else if (currentPrice >= P) {
    zoneCode = 'P-R1';
    lowerName = 'P';
    upperName = 'R1';
    lowerVal = P;
    upperVal = R1;
  } else if (currentPrice >= S1) {
    zoneCode = 'S1-P';
    lowerName = 'S1';
    upperName = 'P';
    lowerVal = S1;
    upperVal = P;
  } else if (currentPrice >= S2) {
    zoneCode = 'S2-S1';
    lowerName = 'S2';
    upperName = 'S1';
    lowerVal = S2;
    upperVal = S1;
  } else if (currentPrice >= S3) {
    zoneCode = 'S3-S2';
    lowerName = 'S3';
    upperName = 'S2';
    lowerVal = S3;
    upperVal = S2;
  } else if (currentPrice >= effectiveS4) {
    zoneCode = 'S4-S3';
    lowerName = 'S4';
    upperName = 'S3';
    lowerVal = effectiveS4;
    upperVal = S3;
  } else {
    isExtreme = 'BELOW_S4';
    zoneCode = '<S4';
    lowerName = '<S4';
    upperName = 'S4';
    lowerVal = effectiveS4 - (S3 - effectiveS4);
    upperVal = effectiveS4;
  }

  // 2. Intra-zone percentage (0% = at lowerVal, 50% = tepat di tengah, 100% = at upperVal)
  const span = upperVal - lowerVal;
  const rawRatio = span > 0 ? (currentPrice - lowerVal) / span : 0.5;
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  const intraPct = Math.round(clampedRatio * 100);

  // 3. Precision classification for label & styling
  let positionText = '';
  let statusColorClass = '';

  if (isExtreme === 'ABOVE_R4') {
    positionText = 'Breakout > R4';
    statusColorClass = 'text-[#0ecb81] font-bold';
  } else if (isExtreme === 'BELOW_S4') {
    positionText = 'Breakdown < S4';
    statusColorClass = 'text-[#f6465d] font-bold';
  } else if (intraPct >= 42 && intraPct <= 58) {
    positionText = intraPct >= 48 && intraPct <= 52 ? `Tepat Tengah (50%)` : `Tengah (${intraPct}%)`;
    statusColorClass = 'text-[#f0b90b] font-bold';
  } else if (intraPct <= 15) {
    positionText = `Mepet ${lowerName} (${intraPct}%)`;
    statusColorClass = lowerName === 'P' ? 'text-[#f0b90b] font-bold' : 'text-[#f6465d] font-bold';
  } else if (intraPct >= 85) {
    positionText = `Mepet ${upperName} (${intraPct}%)`;
    statusColorClass = upperName === 'P' ? 'text-[#f0b90b] font-bold' : 'text-[#0ecb81] font-bold';
  } else if (intraPct < 42) {
    positionText = `Dekat ${lowerName} (${intraPct}%)`;
    statusColorClass = 'text-[#eaecef]';
  } else {
    positionText = `Dekat ${upperName} (${intraPct}%)`;
    statusColorClass = 'text-[#eaecef]';
  }

  const deltaP = distP !== undefined ? distP : Number((((currentPrice - P) / P) * 100).toFixed(2));
  // Clamp between 1.5% and 98.5% so needle stays fully inside visible container
  const clampedPercent = Math.max(1.5, Math.min(98.5, rangePercent));

  // Pointer caret color scheme based on zone proximity
  const isNearP = Math.abs(currentPrice - P) <= (Math.min(R1 - P, P - S1) * 0.35);
  const caretColorTop = isNearP
    ? 'border-t-[#f0b90b]'
    : currentPrice > P
    ? 'border-t-[#0ecb81]'
    : 'border-t-[#f6465d]';
  const caretColorBottom = isNearP
    ? 'border-b-[#f0b90b]'
    : currentPrice > P
    ? 'border-b-[#0ecb81]'
    : 'border-b-[#f6465d]';

  return (
    <div
      className="w-[166px] flex flex-col mx-auto select-none shrink-0 py-0.5"
      title={`[${timeframeLabel || 'Pivot'}] Harga: $${formatPrice(currentPrice)}
Zona: ${zoneCode} (${lowerName} $${formatPrice(lowerVal)} ↔ ${upperName} $${formatPrice(upperVal)})
Posisi Rentang: ${intraPct}% (${positionText})
Jarak ke P: ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(2)}%`}
    >
      {/* 8-Zone Full Segmented Track with Precision Notches */}
      <div className="relative h-[9px] bg-[#12151a] rounded-xs border border-[#2b313a] flex items-center overflow-visible shadow-xs mt-1">
        {/* Support Half: S4..S3 (12.5%), S3..S2 (12.5%), S2..S1 (12.5%), S1..P (12.5%) */}
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/35 border-r border-[#2b313a]"
          title={`S4 - S3: ${formatPrice(effectiveS4)} - ${formatPrice(pivots.S3)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/24 border-r border-[#2b313a]"
          title={`S3 - S2: ${formatPrice(pivots.S3)} - ${formatPrice(pivots.S2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/16 border-r border-[#2b313a]"
          title={`S2 - S1: ${formatPrice(pivots.S2)} - ${formatPrice(pivots.S1)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#f6465d]/08 border-r border-[#2b313a]"
          title={`S1 - P: ${formatPrice(pivots.S1)} - ${formatPrice(pivots.P)}`}
        />

        {/* Resistance Half: P..R1 (12.5%), R1..R2 (12.5%), R2..R3 (12.5%), R3..R4 (12.5%) */}
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/08 border-r border-[#2b313a]"
          title={`P - R1: ${formatPrice(pivots.P)} - ${formatPrice(pivots.R1)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/16 border-r border-[#2b313a]"
          title={`R1 - R2: ${formatPrice(pivots.R1)} - ${formatPrice(pivots.R2)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/24 border-r border-[#2b313a]"
          title={`R2 - R3: ${formatPrice(pivots.R2)} - ${formatPrice(pivots.R3)}`}
        />
        <div
          className="h-full w-[12.5%] bg-[#0ecb81]/35"
          title={`R3 - R4: ${formatPrice(pivots.R3)} - ${formatPrice(effectiveR4)}`}
        />

        {/* S1 Key Divider Tick (37.5%) */}
        <div
          className="absolute left-[37.5%] -top-[1.5px] -bottom-[1.5px] w-[1px] bg-[#f6465d] z-10 -translate-x-1/2 pointer-events-none"
          title={`Support 1 (S1): ${formatPrice(pivots.S1)}`}
        />

        {/* S1 ↔ P Midpoint Guide (43.75%) */}
        <div
          className="absolute left-[43.75%] top-[1px] bottom-[1px] w-[1px] bg-white/15 -translate-x-1/2 pointer-events-none"
          title="Titik Tengah S1 - P"
        />

        {/* Center Pivot P Distinct Notch (50%) in Binance Yellow */}
        <div
          className="absolute left-1/2 -top-[2.5px] -bottom-[2.5px] w-[2px] bg-[#f0b90b] z-10 -translate-x-1/2 shadow-[0_0_4px_rgba(240,185,11,0.7)] pointer-events-none"
          title={`Center Pivot (P): ${formatPrice(pivots.P)}`}
        />

        {/* P ↔ R1 Midpoint Guide (56.25%) */}
        <div
          className="absolute left-[56.25%] top-[1px] bottom-[1px] w-[1px] bg-white/15 -translate-x-1/2 pointer-events-none"
          title="Titik Tengah P - R1"
        />

        {/* R1 Key Divider Tick (62.5%) */}
        <div
          className="absolute left-[62.5%] -top-[1.5px] -bottom-[1.5px] w-[1px] bg-[#0ecb81] z-10 -translate-x-1/2 pointer-events-none"
          title={`Resistance 1 (R1): ${formatPrice(pivots.R1)}`}
        />

        {/* High-Precision Needle Price Pointer: Top Caret (▼) + Laser Hairline + Bottom Caret (▲) */}
        <div
          className="absolute -top-[4px] -bottom-[4px] pointer-events-none z-20 transition-[left] duration-150 ease-out flex flex-col items-center"
          style={{ left: `calc(${clampedPercent}% - 4px)`, width: '8px' }}
        >
          {/* Top Precision Caret Arrow (▼) */}
          <div
            className={`w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] -mb-[0.5px] drop-shadow-xs ${caretColorTop}`}
          />

          {/* Vertical Laser Hairline Needle */}
          <div className="w-[1.5px] flex-1 bg-white ring-1 ring-black/90 shadow-[0_0_3px_rgba(255,255,255,0.95)]" />

          {/* Bottom Precision Caret Arrow (▲) */}
          <div
            className={`w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[3.5px] -mt-[0.5px] drop-shadow-xs ${caretColorBottom}`}
          />
        </div>
      </div>

      {/* Complete 9-Point Reference Scale: S4 · S3 · S2 · S1 · P · R1 · R2 · R3 · R4 */}
      <div className="relative w-full h-[10px] text-[8px] font-mono leading-none mt-1 select-none">
        <span
          className="absolute left-0 text-[#f6465d] font-semibold"
          title={`S4: ${formatPrice(effectiveS4)}`}
        >
          S4
        </span>
        <span
          className="absolute left-[12.5%] -translate-x-1/2 text-[#f6465d]/70"
          title={`S3: ${formatPrice(pivots.S3)}`}
        >
          S3
        </span>
        <span
          className="absolute left-[25%] -translate-x-1/2 text-[#f6465d]/80"
          title={`S2: ${formatPrice(pivots.S2)}`}
        >
          S2
        </span>
        <span
          className="absolute left-[37.5%] -translate-x-1/2 text-[#f6465d] font-bold"
          title={`S1: ${formatPrice(pivots.S1)}`}
        >
          S1
        </span>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[#f0b90b] font-bold"
          title={`Center Pivot (P): ${formatPrice(pivots.P)}`}
        >
          P
        </span>
        <span
          className="absolute left-[62.5%] -translate-x-1/2 text-[#0ecb81] font-bold"
          title={`R1: ${formatPrice(pivots.R1)}`}
        >
          R1
        </span>
        <span
          className="absolute left-[75%] -translate-x-1/2 text-[#0ecb81]/80"
          title={`R2: ${formatPrice(pivots.R2)}`}
        >
          R2
        </span>
        <span
          className="absolute left-[87.5%] -translate-x-1/2 text-[#0ecb81]/70"
          title={`R3: ${formatPrice(pivots.R3)}`}
        >
          R3
        </span>
        <span
          className="absolute right-0 text-[#0ecb81] font-semibold"
          title={`R4: ${formatPrice(effectiveR4)}`}
        >
          R4
        </span>
      </div>

      {/* Detail Subtitle: Active Zone + Precision Position (e.g. "S1-P: Tepat Tengah (50%)") + ΔP */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none w-full px-0.5 mt-1">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <span className="font-bold text-[#848e9c] shrink-0">{zoneCode}:</span>
          <span className={`truncate ${statusColorClass}`} title={positionText}>
            {positionText}
          </span>
        </div>
        <span
          className={`tabular-nums shrink-0 font-medium ${
            deltaP > 0
              ? 'text-[#0ecb81]'
              : deltaP < 0
              ? 'text-[#f6465d]'
              : 'text-[#848e9c]'
          }`}
          title={`Jarak ke Pivot P: ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(2)}%`}
        >
          {deltaP > 0 ? '+' : ''}{deltaP.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};
