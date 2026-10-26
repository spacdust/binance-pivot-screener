import { CoinData, PivotConditionType, Pivots } from '../types';

export interface ConfluenceResult {
  hasConfluence: boolean;
  isExact: boolean;
  type: 'AREA_P' | 'BULLISH' | 'BEARISH' | 'OTHER' | 'NONE';
  label: string;
  badgeText: string;
  badgeStyle: string;
  rowHighlight: string;
  visualizerRing: string;
}

/**
 * Classifies current price relative to pivot levels.
 * Proportional dynamic thresholds ensure accurate classification on any timeframe (5M, 1H, Daily).
 */
export function classifyPriceZone(price: number, pivots?: Pivots | null): PivotConditionType | null {
  if (!pivots || isNaN(price)) return null;
  const { P, R1, S1, R2, S2, R3, R4, S3, S4 } = pivots;
  const effectiveR4 = R4 !== undefined ? R4 : (R3 + (R3 - R2));
  const effectiveS4 = S4 !== undefined ? S4 : (S3 - (S2 - S3));

  // 1. Extreme Bullish (Beyond R1 / R2 / R3 / R4)
  if (price > effectiveR4) return 'ABOVE_R4';
  if (price > R3 && price <= effectiveR4) return 'R3_TO_R4';
  if (price > R2 && price <= R3) return 'R2_TO_R3';
  if (price > R1 && price <= R2) return 'R1_TO_R2';

  // 2. Extreme Bearish (Below S1 / S2 / S3 / S4)
  if (price < effectiveS4) return 'BELOW_S4';
  if (price >= effectiveS4 && price < S3) return 'S3_TO_S4';
  if (price >= S3 && price < S2) return 'S2_TO_S3';
  if (price >= S2 && price < S1) return 'S1_TO_S2';

  // 3. Central Pivot Zone: strictly between S1 and R1
  const upperPTolerance = (R1 - P) * 0.35;
  const lowerPTolerance = (P - S1) * 0.35;

  if (price >= (P - lowerPTolerance) && price <= (P + upperPTolerance)) {
    return 'AREA_P';
  } else if (price > P) {
    return 'R1_TO_P';
  } else {
    return 'S1_TO_P';
  }
}

/**
 * Calculates continuous position score across 8 zones: S4 (0%) to R4 (100%)
 */
export function calculateRangePercent(price: number, pivots?: Pivots | null): number {
  if (!pivots || isNaN(price)) return 50;
  const { P, R1, S1, R2, S2, R3, R4, S3, S4 } = pivots;
  const effectiveR4 = R4 !== undefined ? R4 : (R3 + (R3 - R2));
  const effectiveS4 = S4 !== undefined ? S4 : (S3 - (S2 - S3));

  let range = 50;
  if (price >= effectiveR4) {
    range = 100;
  } else if (price >= R3) {
    range = 87.5 + ((price - R3) / (effectiveR4 - R3 || 1)) * 12.5;
  } else if (price >= R2) {
    range = 75 + ((price - R2) / (R3 - R2 || 1)) * 12.5;
  } else if (price >= R1) {
    range = 62.5 + ((price - R1) / (R2 - R1 || 1)) * 12.5;
  } else if (price >= P) {
    range = 50 + ((price - P) / (R1 - P || 1)) * 12.5;
  } else if (price >= S1) {
    range = 37.5 + ((price - S1) / (P - S1 || 1)) * 12.5;
  } else if (price >= S2) {
    range = 25 + ((price - S2) / (S1 - S2 || 1)) * 12.5;
  } else if (price >= S3) {
    range = 12.5 + ((price - S3) / (S2 - S3 || 1)) * 12.5;
  } else if (price >= effectiveS4) {
    range = ((price - effectiveS4) / (S3 - effectiveS4 || 1)) * 12.5;
  } else {
    range = 0;
  }
  return Math.max(0, Math.min(100, Math.round(range)));
}

export function getPivotCode(cond?: PivotConditionType | null): string {
  if (!cond) return '';
  switch (cond) {
    case 'AREA_P': return 'AREA P';
    case 'S1_TO_P': return 'S1-P';
    case 'R1_TO_P': return 'R1-P';
    case 'R1_TO_R2': return 'R1-R2';
    case 'R2_TO_R3': return 'R2-R3';
    case 'R3_TO_R4': return 'R3-R4';
    case 'ABOVE_R4': return '>R4';
    case 'ABOVE_R3': return '>R3';
    case 'ABOVE_R2': return '>R2';
    case 'S1_TO_S2': return 'S1-S2';
    case 'S2_TO_S3': return 'S2-S3';
    case 'S3_TO_S4': return 'S3-S4';
    case 'BELOW_S4': return '<S4';
    case 'BELOW_S3': return '<S3';
    case 'BELOW_S2': return '<S2';
    default: return cond;
  }
}

export function getConditionLabel(cond?: PivotConditionType | null): string {
  if (!cond) return 'Unknown';
  switch (cond) {
    case 'AREA_P': return 'Area P (Pivot)';
    case 'R1_TO_R2': return 'Tembus R1 ➔ R2';
    case 'R2_TO_R3': return 'Tembus R2 ➔ R3';
    case 'R3_TO_R4': return 'Tembus R3 ➔ R4';
    case 'ABOVE_R4': return 'Di atas R4';
    case 'R1_TO_P': return 'Tolak R1 ➔ P';
    case 'S1_TO_P': return 'Pantul S1 ➔ P';
    case 'S1_TO_S2': return 'Tembus S1 ➔ S2';
    case 'S2_TO_S3': return 'Tembus S2 ➔ S3';
    case 'S3_TO_S4': return 'Tembus S3 ➔ S4';
    case 'BELOW_S4': return 'Di bawah S4';
    default: return cond;
  }
}

export function getConditionTagColor(cond?: PivotConditionType | null): string {
  if (!cond) return 'zinc';
  switch (cond) {
    case 'AREA_P': return 'cyan';
    case 'R1_TO_R2': return 'emerald';
    case 'R2_TO_R3': return 'purple';
    case 'R3_TO_R4': return 'fuchsia';
    case 'ABOVE_R4': return 'pink';
    case 'R1_TO_P': return 'amber';
    case 'S1_TO_P': return 'green';
    case 'S1_TO_S2': return 'rose';
    case 'S2_TO_S3': return 'red';
    case 'S3_TO_S4': return 'red';
    case 'BELOW_S4': return 'red';
    default: return 'zinc';
  }
}

/**
 * Checks if Daily, 1H, and 5M pivots are aligned in the same market zone live.
 */
export function checkPivotConfluence(coin: CoinData): ConfluenceResult {
  const dCond = classifyPriceZone(coin.price, coin.pivots) ?? coin.pivotStatus?.condition;
  const hCond = coin.pivots1h ? (classifyPriceZone(coin.price, coin.pivots1h) ?? coin.pivotStatus1h?.condition) : null;
  const mCond = coin.pivots5m ? (classifyPriceZone(coin.price, coin.pivots5m) ?? coin.pivotStatus5m?.condition) : null;

  if (!dCond || !hCond || !mCond) {
    return {
      hasConfluence: false,
      isExact: false,
      type: 'NONE',
      label: '',
      badgeText: '',
      badgeStyle: '',
      rowHighlight: '',
      visualizerRing: ''
    };
  }

  // 1. Exact condition match across all 3 timeframes (Daily + 1H + 5M)
  const isExact = dCond === hCond && dCond === mCond;

  // 2. All 3 in Bullish zones (R1 s/d >R4)
  const isBullishCondition = (c: PivotConditionType) =>
    ['R1_TO_R2', 'R2_TO_R3', 'R3_TO_R4', 'ABOVE_R4'].includes(c);
  const isAllBullish = isBullishCondition(dCond) && isBullishCondition(hCond) && isBullishCondition(mCond);

  // 3. All 3 in Bearish zones (S1 s/d <S4)
  const isBearishCondition = (c: PivotConditionType) =>
    ['S1_TO_S2', 'S2_TO_S3', 'S3_TO_S4', 'BELOW_S4'].includes(c);
  const isAllBearish = isBearishCondition(dCond) && isBearishCondition(hCond) && isBearishCondition(mCond);

  // Priority 1: Exact condition match with specific code (e.g. 3TF S1-P, 3TF R1-P, 3TF S1-S2, 3TF AREA P)
  if (isExact) {
    const code = getPivotCode(dCond);

    if (dCond === 'AREA_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'AREA_P',
        label: 'Triple Area P (Daily, 1H, 5M di Level Pivot P)',
        badgeText: '3TF AREA P',
        badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
        rowHighlight: 'bg-sky-500/[0.08] hover:bg-sky-500/[0.13] border-l-4 border-l-sky-400',
        visualizerRing: 'ring-1 ring-sky-500/40 bg-sky-500/[0.03] rounded-lg'
      };
    }

    if (dCond === 'S1_TO_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'OTHER',
        label: 'Triple S1-P (Pantul Reversal di Daily, 1H, 5M)',
        badgeText: '3TF S1-P',
        badgeStyle: 'bg-teal-500/20 text-teal-300 border-teal-400/50 shadow-[0_0_8px_rgba(45,212,191,0.25)]',
        rowHighlight: 'bg-teal-500/[0.08] hover:bg-teal-500/[0.13] border-l-4 border-l-teal-400',
        visualizerRing: 'ring-1 ring-teal-500/40 bg-teal-500/[0.03] rounded-lg'
      };
    }

    if (dCond === 'R1_TO_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'OTHER',
        label: 'Triple R1-P (Tolak Pullback di Daily, 1H, 5M)',
        badgeText: '3TF R1-P',
        badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.25)]',
        rowHighlight: 'bg-amber-500/[0.08] hover:bg-amber-500/[0.13] border-l-4 border-l-amber-400',
        visualizerRing: 'ring-1 ring-amber-500/40 bg-amber-500/[0.03] rounded-lg'
      };
    }

    if (isBullishCondition(dCond)) {
      const isExtreme = ['R2_TO_R3', 'R3_TO_R4', 'ABOVE_R4'].includes(dCond);
      return {
        hasConfluence: true,
        isExact: true,
        type: 'BULLISH',
        label: `Triple Bullish Breakout (${getConditionLabel(dCond)})`,
        badgeText: `3TF ${code}`,
        badgeStyle: isExtreme
          ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-[0_0_8px_rgba(192,132,252,0.25)]'
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.25)]',
        rowHighlight: isExtreme
          ? 'bg-purple-500/[0.08] hover:bg-purple-500/[0.13] border-l-4 border-l-purple-400'
          : 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.13] border-l-4 border-l-emerald-400',
        visualizerRing: isExtreme
          ? 'ring-1 ring-purple-500/40 bg-purple-500/[0.03] rounded-lg'
          : 'ring-1 ring-emerald-500/40 bg-emerald-500/[0.03] rounded-lg'
      };
    }

    if (isBearishCondition(dCond)) {
      const isExtreme = ['S2_TO_S3', 'S3_TO_S4', 'BELOW_S4'].includes(dCond);
      return {
        hasConfluence: true,
        isExact: true,
        type: 'BEARISH',
        label: `Triple Bearish Breakdown (${getConditionLabel(dCond)})`,
        badgeText: `3TF ${code}`,
        badgeStyle: isExtreme
          ? 'bg-red-500/20 text-red-300 border-red-400/50 shadow-[0_0_8px_rgba(248,113,113,0.25)]'
          : 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-[0_0_8px_rgba(251,113,133,0.25)]',
        rowHighlight: isExtreme
          ? 'bg-red-500/[0.08] hover:bg-red-500/[0.13] border-l-4 border-l-red-400'
          : 'bg-rose-500/[0.08] hover:bg-rose-500/[0.13] border-l-4 border-l-rose-400',
        visualizerRing: isExtreme
          ? 'ring-1 ring-red-500/40 bg-red-500/[0.03] rounded-lg'
          : 'ring-1 ring-rose-500/40 bg-rose-500/[0.03] rounded-lg'
      };
    }

    return {
      hasConfluence: true,
      isExact: true,
      type: 'OTHER',
      label: `3TF Selaras (${getConditionLabel(dCond)})`,
      badgeText: `3TF ${code}`,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.25)]',
      rowHighlight: 'bg-amber-500/[0.08] hover:bg-amber-500/[0.13] border-l-4 border-l-amber-400',
      visualizerRing: 'ring-1 ring-amber-500/40 bg-amber-500/[0.03] rounded-lg'
    };
  }

  // Priority 2: Zone-level Confluence (Daily, 1H, 5M all bullish or all bearish)
  if (isAllBullish) {
    return {
      hasConfluence: true,
      isExact: false,
      type: 'BULLISH',
      label: '3TF Bullish Zone Confluence (Daily, 1H, 5M Menembus Resistance)',
      badgeText: '3TF BULLISH',
      badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm',
      rowHighlight: 'bg-emerald-500/[0.05] hover:bg-emerald-500/[0.10] border-l-4 border-l-emerald-500',
      visualizerRing: 'ring-1 ring-emerald-500/30 rounded-lg'
    };
  }

  if (isAllBearish) {
    return {
      hasConfluence: true,
      isExact: false,
      type: 'BEARISH',
      label: '3TF Bearish Zone Confluence (Daily, 1H, 5M Menembus Support)',
      badgeText: '3TF BEARISH',
      badgeStyle: 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm',
      rowHighlight: 'bg-rose-500/[0.05] hover:bg-rose-500/[0.10] border-l-4 border-l-rose-500',
      visualizerRing: 'ring-1 ring-rose-500/30 rounded-lg'
    };
  }

  return {
    hasConfluence: false,
    isExact: false,
    type: 'NONE',
    label: '',
    badgeText: '',
    badgeStyle: '',
    rowHighlight: '',
    visualizerRing: ''
  };
}
