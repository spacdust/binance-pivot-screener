import { CoinData, PivotConditionType } from '../types';

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

export function checkPivotConfluence(coin: CoinData): ConfluenceResult {
  const d = coin.pivotStatus;
  const h = coin.pivotStatus1h;
  const m = coin.pivotStatus5m;

  if (!d || !h || !m) {
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
  const isExact = d.condition === h.condition && d.condition === m.condition;

  // 2. All 3 in AREA_P (Golden Pivot Convergence)
  const isAllAreaP = d.condition === 'AREA_P' && h.condition === 'AREA_P' && m.condition === 'AREA_P';

  // 3. All 3 in Bullish Breakout/Extension zone
  const isBullishCondition = (cond: PivotConditionType) =>
    ['R1_TO_R2', 'R2_TO_R3', 'R3_TO_R4', 'ABOVE_R4'].includes(cond);
  const isAllBullish = isBullishCondition(d.condition) && isBullishCondition(h.condition) && isBullishCondition(m.condition);

  // 4. All 3 in Bearish Breakdown/Capitulation zone
  const isBearishCondition = (cond: PivotConditionType) =>
    ['S1_TO_S2', 'S2_TO_S3', 'S3_TO_S4', 'BELOW_S4'].includes(cond);
  const isAllBearish = isBearishCondition(d.condition) && isBearishCondition(h.condition) && isBearishCondition(m.condition);

  if (isAllAreaP) {
    return {
      hasConfluence: true,
      isExact: true,
      type: 'AREA_P',
      label: 'Triple Area P (Konsolidasi Selaras di Pivot)',
      badgeText: '3TF AREA P',
      badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
      rowHighlight: 'bg-sky-500/[0.08] hover:bg-sky-500/[0.13] border-l-4 border-l-sky-400',
      visualizerRing: 'ring-1 ring-sky-500/40 bg-sky-500/[0.03] rounded-lg'
    };
  }

  if (isExact && isBullishCondition(d.condition)) {
    return {
      hasConfluence: true,
      isExact: true,
      type: 'BULLISH',
      label: `Triple Bullish Breakout (${d.label})`,
      badgeText: '3TF BREAKOUT',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.25)]',
      rowHighlight: 'bg-emerald-500/[0.08] hover:bg-emerald-500/[0.13] border-l-4 border-l-emerald-400',
      visualizerRing: 'ring-1 ring-emerald-500/40 bg-emerald-500/[0.03] rounded-lg'
    };
  }

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

  if (isExact && isBearishCondition(d.condition)) {
    return {
      hasConfluence: true,
      isExact: true,
      type: 'BEARISH',
      label: `Triple Bearish Breakdown (${d.label})`,
      badgeText: '3TF BREAKDOWN',
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-400/50 shadow-[0_0_8px_rgba(251,113,133,0.25)]',
      rowHighlight: 'bg-rose-500/[0.08] hover:bg-rose-500/[0.13] border-l-4 border-l-rose-400',
      visualizerRing: 'ring-1 ring-rose-500/40 bg-rose-500/[0.03] rounded-lg'
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

  if (isExact) {
    return {
      hasConfluence: true,
      isExact: true,
      type: 'OTHER',
      label: `3TF Selaras (${d.label})`,
      badgeText: '3TF SELARAS',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.25)]',
      rowHighlight: 'bg-amber-500/[0.08] hover:bg-amber-500/[0.13] border-l-4 border-l-amber-400',
      visualizerRing: 'ring-1 ring-amber-500/40 bg-amber-500/[0.03] rounded-lg'
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
