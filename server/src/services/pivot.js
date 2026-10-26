/**
 * Daily Pivot Points Calculator and Condition Classifier
 * Standard (Classic) Pivot Formula based on Previous Day (00:00 - 23:59 UTC)
 */

export function calculateDailyPivots(high, low, close) {
  const H = parseFloat(high);
  const L = parseFloat(low);
  const C = parseFloat(close);

  if (isNaN(H) || isNaN(L) || isNaN(C)) {
    throw new Error('Invalid High/Low/Close values for Pivot calculation');
  }

  // Classic Standard Pivot Points
  const P = (H + L + C) / 3;
  const R1 = (2 * P) - L;
  const S1 = (2 * P) - H;
  const R2 = P + (H - L);
  const S2 = P - (H - L);
  const R3 = H + 2 * (P - L);
  const S3 = L - 2 * (H - P);

  return {
    H,
    L,
    C,
    P,
    R1,
    S1,
    R2,
    S2,
    R3,
    S3
  };
}

/**
 * Classifies current price position relative to Daily Pivot points
 * 
 * Target conditions:
 * 1. AREA_P: Pivot di area P (dekat dengan level P)
 * 2. S1_TO_S2: Menembus S1 dan menuju S2 (Breakdown S1)
 * 3. S1_TO_P: Memantul dari S1 dan menuju P (Bounce S1)
 * 4. R1_TO_R2: Menembus R1 dan menuju R2 (Breakout R1)
 * 5. R1_TO_P: Tertolak di R1 dan menuju P (Pullback R1)
 * 6. ABOVE_R2: Di atas R2 (Super Bullish)
 * 7. BELOW_S2: Di bawah S2 (Super Bearish)
 */
export function classifyPivotCondition(currentPrice, pivots, momentum1h = 0) {
  const price = parseFloat(currentPrice);
  if (!pivots || isNaN(price)) {
    return {
      condition: 'UNKNOWN',
      label: 'Unknown',
      zone: 'UNKNOWN',
      description: 'Data tidak tersedia',
      distanceP: 0,
      rangePercent: 50
    };
  }

  const { P, R1, S1, R2, S2 } = pivots;

  // Percentage distances
  const distP = ((price - P) / P) * 100;
  const distR1 = ((price - R1) / R1) * 100;
  const distS1 = ((price - S1) / S1) * 100;
  const distR2 = ((price - R2) / R2) * 100;
  const distS2 = ((price - S2) / S2) * 100;

  // Relative position score: 0 = S2, 25 = S1, 50 = P, 75 = R1, 100 = R2
  let rangePercent = 50;
  if (price >= R2) {
    rangePercent = 100;
  } else if (price >= R1) {
    rangePercent = 75 + ((price - R1) / (R2 - R1 || 1)) * 25;
  } else if (price >= P) {
    rangePercent = 50 + ((price - P) / (R1 - P || 1)) * 25;
  } else if (price >= S1) {
    rangePercent = 25 + ((price - S1) / (P - S1 || 1)) * 25;
  } else if (price >= S2) {
    rangePercent = ((price - S2) / (S1 - S2 || 1)) * 25;
  } else {
    rangePercent = 0;
  }
  rangePercent = Math.max(0, Math.min(100, Math.round(rangePercent)));

  // Tolerance for "Area P": within +/- 0.4% of P or very close to middle
  const pTolerance = 0.4; // 0.4%
  const isNearP = Math.abs(distP) <= pTolerance;

  let condition = 'BETWEEN_P_R1';
  let label = 'P ke R1';
  let description = 'Harga bergerak di antara Pivot dan R1';
  let tagColor = 'blue';

  if (isNearP) {
    condition = 'AREA_P';
    label = 'Area P (Pivot)';
    description = 'Harga berkonsolidasi di sekitar level Pivot';
    tagColor = 'cyan';
  } else if (price > R2) {
    condition = 'ABOVE_R2';
    label = 'Di atas R2';
    description = 'Breakout kuat di atas Resistance 2';
    tagColor = 'fuchsia';
  } else if (price > R1 && price <= R2) {
    condition = 'R1_TO_R2';
    label = 'Tembus R1 ➔ R2';
    description = 'Menembus R1 dan bergerak menuju R2 (Bullish Breakout)';
    tagColor = 'emerald';
  } else if (price >= P && price <= R1) {
    // Check if price is heading back down to P from R1, or climbing from P to R1
    // If momentum1h is negative or price is closer to R1 and dropping, it's R1_TO_P
    if (momentum1h < -0.15 || (price > (P + (R1 - P) * 0.5) && momentum1h <= 0)) {
      condition = 'R1_TO_P';
      label = 'Tolak R1 ➔ P';
      description = 'Tertahan di R1 dan bergerak turun menuju Pivot P (Pullback)';
      tagColor = 'amber';
    } else {
      condition = 'P_TO_R1';
      label = 'P ➔ R1';
      description = 'Beranjak dari Pivot P mengarah ke R1';
      tagColor = 'sky';
    }
  } else if (price >= S1 && price < P) {
    // Check if price is bouncing from S1 towards P, or falling from P to S1
    if (momentum1h > 0.15 || (price < (S1 + (P - S1) * 0.5) && momentum1h >= 0)) {
      condition = 'S1_TO_P';
      label = 'Pantul S1 ➔ P';
      description = 'Memantul dari S1 dan bergerak naik menuju Pivot P (Reversal)';
      tagColor = 'green';
    } else {
      condition = 'P_TO_S1';
      label = 'P ➔ S1';
      description = 'Turun dari Pivot P mengarah ke Support S1';
      tagColor = 'orange';
    }
  } else if (price >= S2 && price < S1) {
    condition = 'S1_TO_S2';
    label = 'Tembus S1 ➔ S2';
    description = 'Menembus S1 dan bergerak menuju S2 (Bearish Breakdown)';
    tagColor = 'rose';
  } else if (price < S2) {
    condition = 'BELOW_S2';
    label = 'Di bawah S2';
    description = 'Penurunan tajam di bawah Support 2';
    tagColor = 'red';
  }

  return {
    condition,
    label,
    description,
    tagColor,
    distP: Number(distP.toFixed(2)),
    distR1: Number(distR1.toFixed(2)),
    distS1: Number(distS1.toFixed(2)),
    distR2: Number(distR2.toFixed(2)),
    distS2: Number(distS2.toFixed(2)),
    rangePercent
  };
}
