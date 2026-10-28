import React from 'react';
import { Pivots } from '../types';

export type PivotVisualStyle = 'hud' | 'zone_zoom';

interface PivotVisualizerProps {
  pivots: Pivots;
  currentPrice: number;
  rangePercent: number; // 0 (S4) to 100 (R4)
  distP?: number;
  timeframeLabel?: string;
  visualStyle?: PivotVisualStyle;
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
  visualStyle = 'hud',
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
  let activeZoneLeft = 37.5;
  let activeZoneWidth = 12.5;

  if (currentPrice > effectiveR4) {
    isExtreme = 'ABOVE_R4';
    zoneCode = '>R4';
    lowerName = 'R4';
    upperName = '>R4';
    lowerVal = effectiveR4;
    upperVal = effectiveR4 + (effectiveR4 - R3);
    activeZoneLeft = 87.5;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= R3) {
    zoneCode = 'R3-R4';
    lowerName = 'R3';
    upperName = 'R4';
    lowerVal = R3;
    upperVal = effectiveR4;
    activeZoneLeft = 87.5;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= R2) {
    zoneCode = 'R2-R3';
    lowerName = 'R2';
    upperName = 'R3';
    lowerVal = R2;
    upperVal = R3;
    activeZoneLeft = 75;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= R1) {
    zoneCode = 'R1-R2';
    lowerName = 'R1';
    upperName = 'R2';
    lowerVal = R1;
    upperVal = R2;
    activeZoneLeft = 62.5;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= P) {
    zoneCode = 'P-R1';
    lowerName = 'P';
    upperName = 'R1';
    lowerVal = P;
    upperVal = R1;
    activeZoneLeft = 50;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= S1) {
    zoneCode = 'S1-P';
    lowerName = 'S1';
    upperName = 'P';
    lowerVal = S1;
    upperVal = P;
    activeZoneLeft = 37.5;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= S2) {
    zoneCode = 'S2-S1';
    lowerName = 'S2';
    upperName = 'S1';
    lowerVal = S2;
    upperVal = S1;
    activeZoneLeft = 25;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= S3) {
    zoneCode = 'S3-S2';
    lowerName = 'S3';
    upperName = 'S2';
    lowerVal = S3;
    upperVal = S2;
    activeZoneLeft = 12.5;
    activeZoneWidth = 12.5;
  } else if (currentPrice >= effectiveS4) {
    zoneCode = 'S4-S3';
    lowerName = 'S4';
    upperName = 'S3';
    lowerVal = effectiveS4;
    upperVal = S3;
    activeZoneLeft = 0;
    activeZoneWidth = 12.5;
  } else {
    isExtreme = 'BELOW_S4';
    zoneCode = '<S4';
    lowerName = '<S4';
    upperName = 'S4';
    lowerVal = effectiveS4 - (S3 - effectiveS4);
    upperVal = effectiveS4;
    activeZoneLeft = 0;
    activeZoneWidth = 12.5;
  }

  // 2. Intra-zone percentage (0% = at lowerVal, 50% = tepat di tengah, 100% = at upperVal)
  const span = upperVal - lowerVal;
  const rawRatio = span > 0 ? (currentPrice - lowerVal) / span : 0.5;
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  const intraPct = Math.round(clampedRatio * 100);

  // 3. Precision classification for label & styling
  let positionText = '';
  let statusColorClass = '';
  let pinColorHex = '#f0b90b';

  if (isExtreme === 'ABOVE_R4') {
    positionText = 'Breakout > R4';
    statusColorClass = 'text-[#0ecb81] font-bold';
    pinColorHex = '#0ecb81';
  } else if (isExtreme === 'BELOW_S4') {
    positionText = 'Breakdown < S4';
    statusColorClass = 'text-[#f6465d] font-bold';
    pinColorHex = '#f6465d';
  } else if (intraPct >= 42 && intraPct <= 58) {
    positionText = intraPct >= 48 && intraPct <= 52 ? `Tepat Tengah (50%)` : `Tengah (${intraPct}%)`;
    statusColorClass = 'text-[#f0b90b] font-bold';
    pinColorHex = '#f0b90b';
  } else if (intraPct <= 15) {
    positionText = `Mepet ${lowerName} (${intraPct}%)`;
    statusColorClass = lowerName === 'P' ? 'text-[#f0b90b] font-bold' : 'text-[#f6465d] font-bold';
    pinColorHex = lowerName === 'P' ? '#f0b90b' : '#f6465d';
  } else if (intraPct >= 85) {
    positionText = `Mepet ${upperName} (${intraPct}%)`;
    statusColorClass = upperName === 'P' ? 'text-[#f0b90b] font-bold' : 'text-[#0ecb81] font-bold';
    pinColorHex = upperName === 'P' ? '#f0b90b' : '#0ecb81';
  } else if (intraPct < 42) {
    positionText = `Dekat ${lowerName} (${intraPct}%)`;
    statusColorClass = 'text-[#eaecef]';
    pinColorHex = lowerName === 'P' ? '#f0b90b' : currentPrice > P ? '#0ecb81' : '#f6465d';
  } else {
    positionText = `Dekat ${upperName} (${intraPct}%)`;
    statusColorClass = 'text-[#eaecef]';
    pinColorHex = upperName === 'P' ? '#f0b90b' : currentPrice > P ? '#0ecb81' : '#f6465d';
  }

  const deltaP = distP !== undefined ? distP : Number((((currentPrice - P) / P) * 100).toFixed(2));
  // Clamp between 2% and 98% for needle visibility
  const clampedPercent = Math.max(2, Math.min(98, rangePercent));

  // Determine active zone highlight style
  const zoneHighlightClass =
    zoneCode === 'S1-P' || zoneCode === 'P-R1'
      ? 'bg-[#f0b90b]/18 border-x border-[#f0b90b]/40'
      : currentPrice > P
      ? 'bg-[#0ecb81]/18 border-x border-[#0ecb81]/40'
      : 'bg-[#f6465d]/18 border-x border-[#f6465d]/40';

  const getPillBadgeStyle = (name: string) => {
    if (name === 'P') return 'bg-[#f0b90b]/15 text-[#f0b90b] border-[#f0b90b]/40';
    if (name.startsWith('R') || name === '>R4') return 'bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/40';
    if (name.startsWith('S') || name === '<S4') return 'bg-[#f6465d]/15 text-[#f6465d] border-[#f6465d]/40';
    return 'bg-[#22262e] text-[#848e9c] border-[#2b313a]';
  };

  return (
    <div
      className="w-[166px] flex flex-col mx-auto select-none shrink-0 py-0.5 group/pv"
      title={`[${timeframeLabel || 'Pivot'}] Harga: $${formatPrice(currentPrice)}
Zona: ${zoneCode} (${lowerName} $${formatPrice(lowerVal)} ↔ ${upperName} $${formatPrice(upperVal)})
Posisi Rentang: ${intraPct}% (${positionText})
Jarak ke P: ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(2)}%`}
    >
      {visualStyle === 'hud' ? (
        /* ================= THEME 1: CHUNKY HUD SLIDER (DEFAULT) ================= */
        <>
          {/* Track 12px with Chunky 8px Thumb */}
          <div className="relative h-[12px] bg-[#12151a] rounded-xs border border-[#2b313a] flex items-center overflow-visible shadow-xs mt-1">
            {/* Left Support Half (0..50%) */}
            <div className="h-full w-1/2 bg-[#f6465d]/08 border-r border-[#2b313a]/60" />
            {/* Right Resistance Half (50..100%) */}
            <div className="h-full w-1/2 bg-[#0ecb81]/08" />

            {/* Active Zone Soft Glow Highlight */}
            <div
              className={`absolute top-0 bottom-0 pointer-events-none transition-all duration-150 ${zoneHighlightClass}`}
              style={{
                left: `${activeZoneLeft}%`,
                width: `${activeZoneWidth}%`,
              }}
            />

            {/* Landmark Tick: S1 (37.5%) */}
            <div
              className="absolute left-[37.5%] top-0 bottom-0 w-[1.5px] bg-[#f6465d] pointer-events-none -translate-x-1/2"
              title={`S1: ${formatPrice(pivots.S1)}`}
            />

            {/* S1 ↔ P Midpoint Dotted Guide (43.75%) */}
            <div
              className="absolute left-[43.75%] top-[1px] bottom-[1px] w-[1px] border-r border-dotted border-white/20 pointer-events-none -translate-x-1/2"
              title="Titik Tengah 50% S1 - P"
            />

            {/* Center Pivot P Prominent Gold Notch (50%) */}
            <div
              className="absolute left-1/2 -top-[2px] -bottom-[2px] w-[2.5px] bg-[#f0b90b] pointer-events-none -translate-x-1/2 z-10 shadow-[0_0_5px_rgba(240,185,11,0.8)]"
              title={`Center Pivot (P): ${formatPrice(pivots.P)}`}
            />

            {/* P ↔ R1 Midpoint Dotted Guide (56.25%) */}
            <div
              className="absolute left-[56.25%] top-[1px] bottom-[1px] w-[1px] border-r border-dotted border-white/20 pointer-events-none -translate-x-1/2"
              title="Titik Tengah 50% P - R1"
            />

            {/* Landmark Tick: R1 (62.5%) */}
            <div
              className="absolute left-[62.5%] top-0 bottom-0 w-[1.5px] bg-[#0ecb81] pointer-events-none -translate-x-1/2"
              title={`R1: ${formatPrice(pivots.R1)}`}
            />

            {/* Chunky Slider Thumb (8px wide x 16px high - Instantly spotted without squinting) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[8px] h-[16px] rounded-xs bg-white border border-black shadow-md z-20 flex items-center justify-center pointer-events-none transition-[left] duration-150 ease-out"
              style={{ left: `${clampedPercent}%` }}
            >
              <div
                className="w-[2px] h-[8px] rounded-2xs transition-colors duration-150"
                style={{ backgroundColor: pinColorHex }}
              />
            </div>
          </div>

          {/* Clean 5-Anchor Scale: S4 · S1 · P · R1 · R4 */}
          <div className="flex justify-between text-[8px] font-mono leading-none mt-1 select-none px-0.5">
            <span
              className={`transition-colors ${
                lowerName === 'S4' ? 'text-[#f6465d] font-bold scale-105' : 'text-[#f6465d] font-bold'
              }`}
              title={`S4: ${formatPrice(effectiveS4)}`}
            >
              S4
            </span>
            <span
              className={`transition-colors ${
                lowerName === 'S1' || upperName === 'S1' ? 'text-[#f6465d] font-bold scale-105' : 'text-[#f6465d]/70'
              }`}
              title={`S1: ${formatPrice(pivots.S1)}`}
            >
              S1
            </span>
            <span
              className={`font-bold transition-all text-[9px] ${
                lowerName === 'P' || upperName === 'P' ? 'text-[#f0b90b] drop-shadow-xs scale-110' : 'text-[#f0b90b]'
              }`}
              title={`Center Pivot (P): ${formatPrice(pivots.P)}`}
            >
              P
            </span>
            <span
              className={`transition-colors ${
                lowerName === 'R1' || upperName === 'R1' ? 'text-[#0ecb81] font-bold scale-105' : 'text-[#0ecb81]/70'
              }`}
              title={`R1: ${formatPrice(pivots.R1)}`}
            >
              R1
            </span>
            <span
              className={`transition-colors ${
                upperName === 'R4' ? 'text-[#0ecb81] font-bold scale-105' : 'text-[#0ecb81] font-bold'
              }`}
              title={`R4: ${formatPrice(effectiveR4)}`}
            >
              R4
            </span>
          </div>

          {/* Subtitle Readout */}
          <div className="flex items-center justify-between text-[9px] font-mono leading-none w-full px-0.5 mt-1">
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="font-bold text-[#848e9c] shrink-0">{zoneCode}:</span>
              <span className={`truncate ${statusColorClass}`} title={positionText}>
                {positionText}
              </span>
            </div>
            <span
              className={`tabular-nums shrink-0 font-medium ${
                deltaP > 0 ? 'text-[#0ecb81]' : deltaP < 0 ? 'text-[#f6465d]' : 'text-[#848e9c]'
              }`}
              title={`Jarak ke Pivot P: ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(2)}%`}
            >
              {deltaP > 0 ? '+' : ''}{deltaP.toFixed(2)}%
            </span>
          </div>
        </>
      ) : (
        /* ================= THEME 2: ZONE ZOOM (DUAL-LAYER PROXIMITY METER) ================= */
        <>
          {/* Top Macro Context Bar (4px) S4..P..R4 */}
          <div className="flex items-center justify-between text-[8px] font-mono text-[#848e9c] px-0.5 leading-none">
            <span className="text-[#f6465d]">S4</span>
            <span className="text-[#f0b90b] font-bold">P</span>
            <span className="text-[#0ecb81]">R4</span>
          </div>
          <div className="relative w-full h-[4px] bg-[#161a22] rounded-full border border-[#2b313a] overflow-hidden mt-0.5">
            <div className="w-1/2 h-full bg-[#f6465d]/20 border-r border-[#2b313a]" />
            <div className="w-1/2 h-full bg-[#0ecb81]/20" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#f0b90b] -translate-x-1/2" />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-white ring-1 ring-black transition-[left] duration-150 ease-out"
              style={{ left: `${clampedPercent}%` }}
            />
          </div>

          {/* Dedicated Active Zone Proximity Meter */}
          <div className="flex items-center gap-1.5 w-full mt-1">
            <span
              className={`px-1.5 py-0.2 rounded-xs text-[9px] font-mono font-bold border shrink-0 min-w-[24px] text-center ${getPillBadgeStyle(
                lowerName
              )}`}
              title={`${lowerName}: ${formatPrice(lowerVal)}`}
            >
              {lowerName}
            </span>

            <div className="relative flex-1 h-[8px] bg-[#161a22] rounded-full border border-[#2b313a] overflow-visible">
              {/* 50% Center Notch */}
              <div
                className="absolute left-1/2 -top-[2.5px] -bottom-[2.5px] w-[1.5px] bg-[#f0b90b] -translate-x-1/2 z-10 pointer-events-none"
                title="Titik Tengah (50%)"
              />
              {/* Progress Fill */}
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${intraPct}%`,
                  backgroundColor: `${pinColorHex}40`,
                }}
              />
              {/* Large Distinct Bead (8px) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full border-2 border-white ring-1 ring-black z-20 shadow-sm pointer-events-none transition-[left] duration-150 ease-out"
                style={{
                  left: `${intraPct}%`,
                  backgroundColor: pinColorHex,
                }}
              />
            </div>

            <span
              className={`px-1.5 py-0.2 rounded-xs text-[9px] font-mono font-bold border shrink-0 min-w-[24px] text-center ${getPillBadgeStyle(
                upperName
              )}`}
              title={`${upperName}: ${formatPrice(upperVal)}`}
            >
              {upperName}
            </span>
          </div>

          {/* Subtitle */}
          <div className="flex items-center justify-between text-[9px] font-mono leading-none w-full px-0.5 mt-1">
            <span className={`font-semibold truncate max-w-[105px] ${statusColorClass}`} title={positionText}>
              {positionText}
            </span>
            <span
              className={`tabular-nums shrink-0 font-medium ${
                deltaP > 0 ? 'text-[#0ecb81]' : deltaP < 0 ? 'text-[#f6465d]' : 'text-[#848e9c]'
              }`}
              title={`Jarak ke Pivot P: ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(2)}%`}
            >
              ΔP {deltaP > 0 ? '+' : ''}{deltaP.toFixed(2)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
};
