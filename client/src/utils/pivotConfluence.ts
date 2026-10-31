import { CoinData, PivotConditionType, Pivots, PivotConditionTimeframe } from '../types';

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

export function getConditionBadgeStyle(cond?: PivotConditionType | null): string {
  if (!cond) return 'bg-[#2b313a] text-[#848e9c] border border-[#2b313a]';
  if (['R1_TO_R2', 'R2_TO_R3', 'R3_TO_R4', 'ABOVE_R4'].includes(cond)) {
    return 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/40 font-bold';
  }
  if (['S1_TO_S2', 'S2_TO_S3', 'S3_TO_S4', 'BELOW_S4'].includes(cond)) {
    return 'bg-[#f6465d]/15 text-[#f6465d] border border-[#f6465d]/40 font-bold';
  }
  return 'bg-[#f0b90b]/15 text-[#f0b90b] border border-[#f0b90b]/40 font-bold';
}

/**
 * Checks if 3 pivot timeframes are aligned in the same market zone live.
 * In 'tradingview' mode: aligns Daily (1D), Weekly (1W), and Monthly (1M) pivots (TradingView Auto).
 * In 'micro' mode: aligns Daily (1D), 1H Candle, and 5M Candle pivots.
 */
export function checkPivotConfluence(coin: CoinData, mode: 'tradingview' | 'micro' = 'tradingview'): ConfluenceResult {
  const p1 = coin.pivots; // Daily (1D)
  const p2 = mode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);
  const p3 = mode === 'tradingview' ? (coin.pivotsMonthly || coin.pivots) : (coin.pivots5m || coin.pivots);

  const cond1 = classifyPriceZone(coin.price, p1) ?? coin.pivotStatus?.condition;
  const cond2 = classifyPriceZone(coin.price, p2) ?? (mode === 'tradingview' ? coin.pivotStatusWeekly?.condition : coin.pivotStatus1h?.condition);
  const cond3 = classifyPriceZone(coin.price, p3) ?? (mode === 'tradingview' ? coin.pivotStatusMonthly?.condition : coin.pivotStatus5m?.condition);

  if (!cond1 || !cond2 || !cond3) {
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

  // 1. Exact condition match across all 3 timeframes
  const isExact = cond1 === cond2 && cond1 === cond3;

  // 2. All 3 in Bullish zones (R1 s/d >R4)
  const isBullishCondition = (c: PivotConditionType) =>
    ['R1_TO_R2', 'R2_TO_R3', 'R3_TO_R4', 'ABOVE_R4'].includes(c);
  const isAllBullish = isBullishCondition(cond1) && isBullishCondition(cond2) && isBullishCondition(cond3);

  // 3. All 3 in Bearish zones (S1 s/d <S4)
  const isBearishCondition = (c: PivotConditionType) =>
    ['S1_TO_S2', 'S2_TO_S3', 'S3_TO_S4', 'BELOW_S4'].includes(c);
  const isAllBearish = isBearishCondition(cond1) && isBearishCondition(cond2) && isBearishCondition(cond3);

  // Priority 1: Exact condition match with specific code (e.g. 3TF S1-P, 3TF R1-P, 3TF S1-S2, 3TF AREA P)
  if (isExact) {
    const code = getPivotCode(cond1);

    if (cond1 === 'AREA_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'AREA_P',
        label: mode === 'tradingview' ? 'Triple Area P (Daily, Weekly, Monthly di Level Pivot P)' : 'Triple Area P (Daily, 1H, 5M di Level Pivot P)',
        badgeText: '3TF AREA P',
        badgeStyle: 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30 rounded-xs',
        rowHighlight: 'border-l-2 border-l-[#f0b90b] bg-[#f0b90b]/[0.03]',
        visualizerRing: ''
      };
    }

    if (cond1 === 'S1_TO_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'OTHER',
        label: 'Triple S1-P (Pantul Reversal di 3 Timeframe)',
        badgeText: '3TF S1-P',
        badgeStyle: 'bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/30 rounded-xs',
        rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.03]',
        visualizerRing: ''
      };
    }

    if (cond1 === 'R1_TO_P') {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'OTHER',
        label: 'Triple R1-P (Tolak Pullback di 3 Timeframe)',
        badgeText: '3TF R1-P',
        badgeStyle: 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30 rounded-xs',
        rowHighlight: 'border-l-2 border-l-[#f0b90b] bg-[#f0b90b]/[0.03]',
        visualizerRing: ''
      };
    }

    if (isBullishCondition(cond1)) {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'BULLISH',
        label: `Triple Bullish Breakout (${getConditionLabel(cond1)})`,
        badgeText: `3TF ${code}`,
        badgeStyle: 'bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/30 rounded-xs',
        rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.03]',
        visualizerRing: ''
      };
    }

    if (isBearishCondition(cond1)) {
      return {
        hasConfluence: true,
        isExact: true,
        type: 'BEARISH',
        label: `Triple Bearish Breakdown (${getConditionLabel(cond1)})`,
        badgeText: `3TF ${code}`,
        badgeStyle: 'bg-[#f6465d]/10 text-[#f6465d] border border-[#f6465d]/30 rounded-xs',
        rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.03]',
        visualizerRing: ''
      };
    }

    return {
      hasConfluence: true,
      isExact: true,
      type: 'OTHER',
      label: `3TF Selaras (${getConditionLabel(cond1)})`,
      badgeText: `3TF ${code}`,
      badgeStyle: 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30 rounded-xs',
      rowHighlight: 'border-l-2 border-l-[#f0b90b] bg-[#f0b90b]/[0.03]',
      visualizerRing: ''
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
      badgeStyle: 'bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/30 rounded-xs',
      rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.02]',
      visualizerRing: ''
    };
  }

  if (isAllBearish) {
    return {
      hasConfluence: true,
      isExact: false,
      type: 'BEARISH',
      label: '3TF Bearish Zone Confluence (Daily, 1H, 5M Menembus Support)',
      badgeText: '3TF BEARISH',
      badgeStyle: 'bg-[#f6465d]/10 text-[#f6465d] border border-[#f6465d]/30 rounded-xs',
      rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.02]',
      visualizerRing: ''
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

export type TwoTfConfluenceType =
  | 'R1_TO_R2'
  | 'R2_TO_R3'
  | 'R3_TO_R4'
  | 'S1_TO_S2'
  | 'S2_TO_S3'
  | 'S3_TO_S4'
  | 'NONE';

export interface TwoTfZoneResult {
  hasConfluence: boolean;
  type: TwoTfConfluenceType;
  label: string;
  badgeText: string;
  badgeStyle: string;
  rowHighlight: string;
}

/**
 * Checks if price is simultaneously in matching R or S zones on both M5 and H1 pivots.
 * Covers: R1-R2, R2-R3, R3-R4 (Bullish) and S1-S2, S2-S3, S3-S4 (Bearish).
 */
export function checkTwoTfZoneConfluence(
  coin: CoinData,
  mode: 'tradingview' | 'micro' = 'tradingview'
): TwoTfZoneResult {
  const p5m = mode === 'tradingview' ? coin.pivots : (coin.pivots5m || coin.pivots);
  const p1h = mode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);

  if (!p5m || !p1h || isNaN(coin.price)) {
    return { hasConfluence: false, type: 'NONE', label: '', badgeText: '', badgeStyle: '', rowHighlight: '' };
  }

  const price = coin.price;
  const r4_5m = p5m.R4 ?? (p5m.R3 + (p5m.R3 - p5m.R2));
  const r4_1h = p1h.R4 ?? (p1h.R3 + (p1h.R3 - p1h.R2));
  const s4_5m = p5m.S4 ?? (p5m.S3 - (p5m.S2 - p5m.S3));
  const s4_1h = p1h.S4 ?? (p1h.S3 - (p1h.S2 - p1h.S3));

  // --- BULLISH ZONES ---

  // 1. R3 ➔ R4: di M5 di antara R3 & R4, DAN di H1 di antara R3 & R4
  const isM5_R3_R4 = price >= Math.min(p5m.R3, r4_5m) && price <= Math.max(p5m.R3, r4_5m);
  const isH1_R3_R4 = price >= Math.min(p1h.R3, r4_1h) && price <= Math.max(p1h.R3, r4_1h);
  if (isM5_R3_R4 && isH1_R3_R4) {
    return {
      hasConfluence: true,
      type: 'R3_TO_R4',
      label: '2TF Confluence (5M & 1H di antara R3 ➔ R4)',
      badgeText: '2TF R3-R4',
      badgeStyle: 'bg-[#0ecb81]/25 text-[#0ecb81] border border-[#0ecb81]/60 font-bold',
      rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.05]',
    };
  }

  // 2. R2 ➔ R3: di M5 di antara R2 & R3, DAN di H1 di antara R2 & R3
  const isM5_R2_R3 = price >= Math.min(p5m.R2, p5m.R3) && price <= Math.max(p5m.R2, p5m.R3);
  const isH1_R2_R3 = price >= Math.min(p1h.R2, p1h.R3) && price <= Math.max(p1h.R2, p1h.R3);
  if (isM5_R2_R3 && isH1_R2_R3) {
    return {
      hasConfluence: true,
      type: 'R2_TO_R3',
      label: '2TF Confluence (5M & 1H di antara R2 ➔ R3)',
      badgeText: '2TF R2-R3',
      badgeStyle: 'bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/50 font-bold',
      rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.04]',
    };
  }

  // 3. R1 ➔ R2: di M5 di antara R1 & R2, DAN di H1 di antara R1 & R2
  const isM5_R1_R2 = price >= Math.min(p5m.R1, p5m.R2) && price <= Math.max(p5m.R1, p5m.R2);
  const isH1_R1_R2 = price >= Math.min(p1h.R1, p1h.R2) && price <= Math.max(p1h.R1, p1h.R2);
  if (isM5_R1_R2 && isH1_R1_R2) {
    return {
      hasConfluence: true,
      type: 'R1_TO_R2',
      label: '2TF Confluence (5M & 1H di antara R1 ➔ R2)',
      badgeText: '2TF R1-R2',
      badgeStyle: 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/40',
      rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.03]',
    };
  }

  // --- BEARISH ZONES ---

  // 4. S3 ➔ S4: di M5 di antara S3 & S4, DAN di H1 di antara S3 & S4
  const isM5_S3_S4 = price <= Math.max(p5m.S3, s4_5m) && price >= Math.min(p5m.S3, s4_5m);
  const isH1_S3_S4 = price <= Math.max(p1h.S3, s4_1h) && price >= Math.min(p1h.S3, s4_1h);
  if (isM5_S3_S4 && isH1_S3_S4) {
    return {
      hasConfluence: true,
      type: 'S3_TO_S4',
      label: '2TF Confluence (5M & 1H di antara S3 ➔ S4)',
      badgeText: '2TF S3-S4',
      badgeStyle: 'bg-[#f6465d]/25 text-[#f6465d] border border-[#f6465d]/60 font-bold',
      rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.05]',
    };
  }

  // 5. S2 ➔ S3: di M5 di antara S2 & S3, DAN di H1 di antara S2 & S3
  const isM5_S2_S3 = price <= Math.max(p5m.S2, p5m.S3) && price >= Math.min(p5m.S2, p5m.S3);
  const isH1_S2_S3 = price <= Math.max(p1h.S2, p1h.S3) && price >= Math.min(p1h.S2, p1h.S3);
  if (isM5_S2_S3 && isH1_S2_S3) {
    return {
      hasConfluence: true,
      type: 'S2_TO_S3',
      label: '2TF Confluence (5M & 1H di antara S2 ➔ S3)',
      badgeText: '2TF S2-S3',
      badgeStyle: 'bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/50 font-bold',
      rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.04]',
    };
  }

  // 6. S1 ➔ S2: di M5 di antara S1 & S2, DAN di H1 di antara S1 & S2
  const isM5_S1_S2 = price <= Math.max(p5m.S1, p5m.S2) && price >= Math.min(p5m.S1, p5m.S2);
  const isH1_S1_S2 = price <= Math.max(p1h.S1, p1h.S2) && price >= Math.min(p1h.S1, p1h.S2);
  if (isM5_S1_S2 && isH1_S1_S2) {
    return {
      hasConfluence: true,
      type: 'S1_TO_S2',
      label: '2TF Confluence (5M & 1H di antara S1 ➔ S2)',
      badgeText: '2TF S1-S2',
      badgeStyle: 'bg-[#f6465d]/15 text-[#f6465d] border border-[#f6465d]/40',
      rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.03]',
    };
  }

  return { hasConfluence: false, type: 'NONE', label: '', badgeText: '', badgeStyle: '', rowHighlight: '' };
}

export type BreakoutConfluenceType = 'BULLISH' | 'BEARISH' | 'NONE';

export interface BreakoutConfluenceResult {
  hasConfluence: boolean;
  type: BreakoutConfluenceType;
  label: string;
  badgeText: string;
  badgeStyle: string;
  rowHighlight: string;
}

/**
 * Checks Cross-Timeframe Breakout/Breakdown Confluence:
 * - Bullish: M5 harga menembus di atas R1 (price >= M5.R1) AND 1H harga menembus P dari S (1H.P <= price <= 1H.R1)
 * - Bearish: M5 harga menembus di bawah S1 (price <= M5.S1) AND 1H harga menembus di bawah P dari R (1H.S1 <= price <= 1H.P)
 */
export function checkBreakoutConfluence(
  coin: CoinData,
  mode: 'tradingview' | 'micro' = 'tradingview'
): BreakoutConfluenceResult {
  const p5m = mode === 'tradingview' ? coin.pivots : (coin.pivots5m || coin.pivots);
  const p1h = mode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);

  if (!p5m || !p1h || isNaN(coin.price)) {
    return { hasConfluence: false, type: 'NONE', label: '', badgeText: '', badgeStyle: '', rowHighlight: '' };
  }

  const price = coin.price;

  // Bullish:
  // 1. M5 menembus di atas R1 dari P atau S: price >= p5m.R1
  // 2. 1H menembus P dari S: price >= p1h.P && price <= p1h.R1
  const isM5Bullish = price >= p5m.R1;
  const is1hBullish = price >= p1h.P && price <= p1h.R1;

  if (isM5Bullish && is1hBullish) {
    return {
      hasConfluence: true,
      type: 'BULLISH',
      label: 'Breakout Confluence (M5 > R1 & 1H > P)',
      badgeText: 'BO: M5>R1 • 1H>P',
      badgeStyle: 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/40',
      rowHighlight: 'border-l-2 border-l-[#0ecb81] bg-[#0ecb81]/[0.03]',
    };
  }

  // Bearish:
  // 1. M5 menembus di bawah S1 dari P atau R: price <= p5m.S1
  // 2. 1H menembus di bawah P dari R: price <= p1h.P && price >= p1h.S1
  const isM5Bearish = price <= p5m.S1;
  const is1hBearish = price <= p1h.P && price >= p1h.S1;

  if (isM5Bearish && is1hBearish) {
    return {
      hasConfluence: true,
      type: 'BEARISH',
      label: 'Breakdown Confluence (M5 < S1 & 1H < P)',
      badgeText: 'BD: M5<S1 • 1H<P',
      badgeStyle: 'bg-[#f6465d]/15 text-[#f6465d] border border-[#f6465d]/40',
      rowHighlight: 'border-l-2 border-l-[#f6465d] bg-[#f6465d]/[0.03]',
    };
  }

  return { hasConfluence: false, type: 'NONE', label: '', badgeText: '', badgeStyle: '', rowHighlight: '' };
}

/**
 * Resolves the active Pivot levels for a given timeframe (5m, 1h, daily)
 * honoring TradingView Auto vs Micro Candle resolution.
 */
export function getCoinPivots(
  coin: CoinData,
  timeframe: PivotConditionTimeframe = '5m',
  mode: 'tradingview' | 'micro' = 'tradingview'
): Pivots | null | undefined {
  if (timeframe === '5m') {
    return mode === 'tradingview' ? coin.pivots : (coin.pivots5m || coin.pivots);
  }
  if (timeframe === '1h') {
    return mode === 'tradingview' ? (coin.pivotsWeekly || coin.pivots) : (coin.pivots1h || coin.pivots);
  }
  return mode === 'tradingview' ? (coin.pivotsMonthly || coin.pivots) : coin.pivots;
}

/**
 * Returns the live classified pivot condition (e.g. R1_TO_R2, AREA_P, S1_TO_S2)
 * for a specific timeframe (5m, 1h, or daily).
 */
export function getCoinPivotCondition(
  coin: CoinData,
  timeframe: PivotConditionTimeframe = '5m',
  mode: 'tradingview' | 'micro' = 'tradingview'
): PivotConditionType | null {
  const targetPivots = getCoinPivots(coin, timeframe, mode);
  const liveCond = classifyPriceZone(coin.price, targetPivots);
  if (liveCond) return liveCond;

  // Fallback to server status if price calculation is not available
  if (timeframe === '5m') {
    return mode === 'tradingview'
      ? coin.pivotStatus?.condition
      : (coin.pivotStatus5m?.condition || coin.pivotStatus?.condition);
  }
  if (timeframe === '1h') {
    return mode === 'tradingview'
      ? (coin.pivotStatusWeekly?.condition || coin.pivotStatus?.condition)
      : (coin.pivotStatus1h?.condition || coin.pivotStatus?.condition);
  }
  return mode === 'tradingview'
    ? (coin.pivotStatusMonthly?.condition || coin.pivotStatus?.condition)
    : coin.pivotStatus?.condition;
}


