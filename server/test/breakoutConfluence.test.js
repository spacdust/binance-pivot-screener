import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyPivots } from '../src/services/pivot.js';

/**
 * Mirror of client's checkBreakoutConfluence to verify cross-timeframe logic in unit test suite.
 */
function checkBreakoutConfluence(coin, mode = 'tradingview') {
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

describe('Cross-TF Breakout / Breakdown Confluence Filter', () => {
  // Setup pivots:
  // M5 (Daily in TV mode): H=100, L=80, C=90 -> P=90, R1=100, S1=80, R2=110, S2=70
  const m5Pivots = calculateDailyPivots(100, 80, 90);
  // 1H (Weekly in TV mode): H=120, L=60, C=90 -> P=90, R1=120, S1=60, R2=150, S2=30
  const h1Pivots = calculateDailyPivots(120, 60, 90);

  test('Bullish Breakout: triggers when M5 price >= R1 and 1H price is between P and R1', () => {
    // Price = 105:
    // On M5: 105 >= R1 (100) -> M5 broke above R1
    // On 1H: 105 is between P (90) and R1 (120) -> 1H broke P from S
    const coin = {
      price: 105,
      pivots: m5Pivots,
      pivotsWeekly: h1Pivots,
    };

    const res = checkBreakoutConfluence(coin, 'tradingview');
    assert.equal(res.hasConfluence, true);
    assert.equal(res.type, 'BULLISH');
    assert.match(res.badgeText, /BO: M5>R1/);
  });

  test('Bearish Breakdown: triggers when M5 price <= S1 and 1H price is between S1 and P', () => {
    // Price = 75:
    // On M5: 75 <= S1 (80) -> M5 broke below S1
    // On 1H: 75 is between S1 (60) and P (90) -> 1H broke below P from R
    const coin = {
      price: 75,
      pivots: m5Pivots,
      pivotsWeekly: h1Pivots,
    };

    const res = checkBreakoutConfluence(coin, 'tradingview');
    assert.equal(res.hasConfluence, true);
    assert.equal(res.type, 'BEARISH');
    assert.match(res.badgeText, /BD: M5<S1/);
  });

  test('Non-confluence: does not trigger when M5 is not above R1', () => {
    // Price = 95:
    // On M5: 95 < R1 (100) -> M5 has NOT broken R1
    // On 1H: 95 is between P (90) and R1 (120)
    const coin = {
      price: 95,
      pivots: m5Pivots,
      pivotsWeekly: h1Pivots,
    };

    const res = checkBreakoutConfluence(coin, 'tradingview');
    assert.equal(res.hasConfluence, false);
    assert.equal(res.type, 'NONE');
  });

  test('Non-confluence: does not trigger when 1H is already above 1H.R1', () => {
    // Price = 125:
    // On M5: 125 >= R1 (100)
    // On 1H: 125 > R1 (120) -> 1H already broke R1, not breaking P
    const coin = {
      price: 125,
      pivots: m5Pivots,
      pivotsWeekly: h1Pivots,
    };

    const res = checkBreakoutConfluence(coin, 'tradingview');
    assert.equal(res.hasConfluence, false);
    assert.equal(res.type, 'NONE');
  });

  test('Supports micro mode with 5M and 1H candle pivots', () => {
    const coin = {
      price: 105,
      pivots: m5Pivots,
      pivots5m: m5Pivots,
      pivots1h: h1Pivots,
    };

    const res = checkBreakoutConfluence(coin, 'micro');
    assert.equal(res.hasConfluence, true);
    assert.equal(res.type, 'BULLISH');
  });
});
