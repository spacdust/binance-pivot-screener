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
  let lowerName = 'S1';
  let upperName = 'P';
  let lowerVal = S1;
  let upperVal = P;
  let isExtreme: 'ABOVE_R4' | 'BELOW_S4' | null = null;

  if (currentPrice > effectiveR4) {
    isExtreme = 'ABOVE_R4';
    lowerName = 'R4';
    upperName = '>R4';
    lowerVal = effectiveR4;
    upperVal = effectiveR4 + (effectiveR4 - R3);
  } else if (currentPrice >= R3) {
    lowerName = 'R3';
    upperName = 'R4';
    lowerVal = R3;
    upperVal = effectiveR4;
  } else if (currentPrice >= R2) {
    lowerName = 'R2';
    upperName = 'R3';
    lowerVal = R2;
    upperVal = R3;
  } else if (currentPrice >= R1) {
    lowerName = 'R1';
    upperName = 'R2';
    lowerVal = R1;
    upperVal = R2;
  } else if (currentPrice >= P) {
    lowerName = 'P';
    upperName = 'R1';
    lowerVal = P;
    upperVal = R1;
  } else if (currentPrice >= S1) {
    lowerName = 'S1';
    upperName = 'P';
    lowerVal = S1;
    upperVal = P;
  } else if (currentPrice >= S2) {
    lowerName = 'S2';
    upperName = 'S1';
    lowerVal = S2;
    upperVal = S1;
  } else if (currentPrice >= S3) {
    lowerName = 'S3';
    upperName = 'S2';
    lowerVal = S3;
    upperVal = S2;
  } else if (currentPrice >= effectiveS4) {
    lowerName = 'S4';
    upperName = 'S3';
    lowerVal = effectiveS4;
    upperVal = S3;
  } else {
    isExtreme = 'BELOW_S4';
    lowerName = '<S4';
    upperName = 'S4';
    lowerVal = effectiveS4 - (S3 - effectiveS4);
    upperVal = effectiveS4;
  }

  // 2. Intra-zone percentage (0% = at lowerVal, 50% = tepat di tengah, 100% = at upperVal)
  const span = upperVal - lowerVal;
  const rawRatio = span > 0 ? (currentPrice - lowerVal) / span : 0.5;
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  const posPct = Math.round(clampedRatio * 100);

  // 3. Precision classification for badge & indicators
  let statusLabel = '';
  let statusColorClass = '';
  let fillClass = '';
  let pinClass = '';

  if (isExtreme === 'ABOVE_R4') {
    statusLabel = 'Breakout > R4';
    statusColorClass = 'text-[#0ecb81]';
    fillClass = 'bg-[#0ecb81]/50';
    pinClass = 'bg-[#0ecb81] border-white ring-2 ring-[#0ecb81]/50';
  } else if (isExtreme === 'BELOW_S4') {
    statusLabel = 'Breakdown < S4';
    statusColorClass = 'text-[#f6465d]';
    fillClass = 'bg-[#f6465d]/50';
    pinClass = 'bg-[#f6465d] border-white ring-2 ring-[#f6465d]/50';
  } else if (posPct >= 42 && posPct <= 58) {
    // Exactly in the middle / dead center
    statusLabel = posPct >= 48 && posPct <= 52 ? `Tepat Tengah (${posPct}%)` : `Tengah (${posPct}%)`;
    statusColorClass = 'text-[#f0b90b] font-bold';
    fillClass = 'bg-[#f0b90b]/40';
    pinClass = 'bg-[#f0b90b] border-white ring-2 ring-[#f0b90b]/70';
  } else if (posPct <= 15) {
    // Hugging lower level (mepet bawah)
    statusLabel = `Mepet ${lowerName} (${posPct}%)`;
    const isP = lowerName === 'P';
    statusColorClass = isP ? 'text-[#f0b90b] font-bold' : 'text-[#f6465d] font-bold';
    fillClass = isP ? 'bg-[#f0b90b]/40' : 'bg-[#f6465d]/40';
    pinClass = isP
      ? 'bg-[#f0b90b] border-white ring-2 ring-[#f0b90b]/70'
      : 'bg-[#f6465d] border-white ring-2 ring-[#f6465d]/70';
  } else if (posPct >= 85) {
    // Hugging upper level (mepet atas)
    statusLabel = `Mepet ${upperName} (${posPct}%)`;
    const isP = upperName === 'P';
    statusColorClass = isP ? 'text-[#f0b90b] font-bold' : 'text-[#0ecb81] font-bold';
    fillClass = isP ? 'bg-[#f0b90b]/40' : 'bg-[#0ecb81]/40';
    pinClass = isP
      ? 'bg-[#f0b90b] border-white ring-2 ring-[#f0b90b]/70'
      : 'bg-[#0ecb81] border-white ring-2 ring-[#0ecb81]/70';
  } else if (posPct > 15 && posPct < 42) {
    // Leaning towards lower bound
    statusLabel = `Dekat ${lowerName} (${posPct}%)`;
    statusColorClass = 'text-[#eaecef]';
    fillClass = 'bg-[#848e9c]/30';
    pinClass = 'bg-white border-[#2b313a] ring-1 ring-black/80';
  } else {
    // Leaning towards upper bound
    statusLabel = `Dekat ${upperName} (${posPct}%)`;
    statusColorClass = 'text-[#eaecef]';
    fillClass = 'bg-[#848e9c]/30';
    pinClass = 'bg-white border-[#2b313a] ring-1 ring-black/80';
  }

  // Boundary pill color
  const getLevelBadgeColor = (name: string) => {
    if (name === 'P') return 'text-[#f0b90b] bg-[#f0b90b]/15 border-[#f0b90b]/40';
    if (name.startsWith('R') || name === '>R4') return 'text-[#0ecb81] bg-[#0ecb81]/15 border-[#0ecb81]/40';
    if (name.startsWith('S') || name === '<S4') return 'text-[#f6465d] bg-[#f6465d]/15 border-[#f6465d]/40';
    return 'text-[#848e9c] bg-[#22262e] border-[#2b313a]';
  };

  const deltaP = distP !== undefined ? distP : Number((((currentPrice - P) / P) * 100).toFixed(2));
  const clampedRangePercent = Math.max(2, Math.min(98, rangePercent));

  return (
    <div
      className="w-[166px] flex flex-col mx-auto select-none shrink-0 py-0.5 group/pv"
      title={`[${timeframeLabel || 'Pivot'}] Harga: $${formatPrice(currentPrice)}
Rentang: ${lowerName} ($${formatPrice(lowerVal)}) ↔ ${upperName} ($${formatPrice(upperVal)})
Posisi: ${posPct}% (${statusLabel})
Jarak ke P: ${deltaP > 0 ? '+' : ''}${deltaP}%`}
    >
      {/* Tier 1: Macro Spectrum (Full S4..R4 mini bar) */}
      <div className="relative w-full h-[3px] bg-[#12151a] rounded-full border border-[#2b313a] overflow-hidden flex items-center">
        {/* Support Half: S4..S3 (12.5%), S3..S2 (12.5%), S2..S1 (12.5%), S1..P (12.5%) */}
        <div className="h-full w-[12.5%] bg-[#f6465d]/40 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#f6465d]/30 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#f6465d]/20 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#f6465d]/10 border-r border-[#2b313a]/50" />
        {/* Resistance Half: P..R1 (12.5%), R1..R2 (12.5%), R2..R3 (12.5%), R3..R4 (12.5%) */}
        <div className="h-full w-[12.5%] bg-[#0ecb81]/10 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#0ecb81]/20 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#0ecb81]/30 border-r border-[#2b313a]/50" />
        <div className="h-full w-[12.5%] bg-[#0ecb81]/40" />

        {/* Center P gold notch */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#f0b90b] -translate-x-1/2 z-10 pointer-events-none" />

        {/* Macro Price Dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-white ring-1 ring-black/90 pointer-events-none z-20 transition-[left] duration-150 ease-out"
          style={{ left: `calc(${clampedRangePercent}% - 2px)` }}
        />
      </div>

      {/* Tier 2: Micro Active Zone Precision Gauge */}
      <div className="flex items-center gap-1.5 w-full mt-1">
        {/* Lower Boundary Badge */}
        <span
          className={`px-1 py-0.2 rounded-xs text-[9px] font-mono font-bold border shrink-0 min-w-[24px] text-center leading-none ${getLevelBadgeColor(
            lowerName
          )}`}
          title={`${lowerName}: $${formatPrice(lowerVal)}`}
        >
          {lowerName}
        </span>

        {/* Intra-Zone Precision Track */}
        <div className="relative flex-1 h-[6px] bg-[#12151a] rounded-full border border-[#2b313a] flex items-center overflow-visible">
          {/* 50% "Tengah Banget" Midpoint Tick */}
          <div
            className="absolute left-1/2 -top-[2px] -bottom-[2px] w-[1px] bg-[#848e9c]/60 z-10 -translate-x-1/2 pointer-events-none"
            title="Titik Tengah (50%)"
          />

          {/* Progress fill from lower bound to price */}
          <div
            className={`h-full rounded-full transition-all duration-150 ${fillClass}`}
            style={{ width: `${posPct}%` }}
          />

          {/* High-Precision Pin Needle Marker */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full border ring-1 pointer-events-none z-20 transition-[left] duration-150 ease-out shadow-xs ${pinClass}`}
            style={{ left: `calc(${clampedRatio * 100}% - 3.5px)` }}
          />
        </div>

        {/* Upper Boundary Badge */}
        <span
          className={`px-1 py-0.2 rounded-xs text-[9px] font-mono font-bold border shrink-0 min-w-[24px] text-center leading-none ${getLevelBadgeColor(
            upperName
          )}`}
          title={`${upperName}: $${formatPrice(upperVal)}`}
        >
          {upperName}
        </span>
      </div>

      {/* Tier 3: Precision Status & Distance to P */}
      <div className="flex items-center justify-between text-[9px] font-mono leading-none w-full px-0.5 mt-1">
        <span
          className={`font-semibold truncate max-w-[108px] ${statusColorClass}`}
          title={statusLabel}
        >
          {statusLabel}
        </span>
        <span
          className={`tabular-nums shrink-0 font-medium ${
            deltaP > 0
              ? 'text-[#0ecb81]'
              : deltaP < 0
              ? 'text-[#f6465d]'
              : 'text-[#848e9c]'
          }`}
          title={`Jarak ke P: ${deltaP > 0 ? '+' : ''}${deltaP}%`}
        >
          ΔP {deltaP > 0 ? '+' : ''}{deltaP.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};
