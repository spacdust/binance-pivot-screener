import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyPivots, classifyPivotCondition } from '../src/services/pivot.js';

describe('Comprehensive Screener Logic & Filter Simulation', () => {
  // Test fixture: BTC-like sample
  const prevDayHigh = 81200;
  const prevDayLow = 79200;
  const prevDayClose = 80800;
  const pivots = calculateDailyPivots(prevDayHigh, prevDayLow, prevDayClose);

  test('Daily Pivot point accuracy check', () => {
    // P = (81200 + 79200 + 80800) / 3 = 80400
    assert.equal(pivots.P, 80400);
    // R1 = 2 * 80400 - 79200 = 81600
    assert.equal(pivots.R1, 81600);
    // S1 = 2 * 80400 - 81200 = 79600
    assert.equal(pivots.S1, 79600);
    // R2 = 80400 + (81200 - 79200) = 82400
    assert.equal(pivots.R2, 82400);
    // S2 = 80400 - (81200 - 79200) = 78400
    assert.equal(pivots.S2, 78400);
  });

  test('Condition 1: Area P (Price around Pivot point)', () => {
    // 80450 is within 0.06% of P (80400)
    const result = classifyPivotCondition(80450, pivots, 0.05);
    assert.equal(result.condition, 'AREA_P');
    assert.equal(result.tagColor, 'cyan');
    assert.ok(Math.abs(result.distP) <= 0.4);
  });

  test('Condition 2: Menembus S1 dan menuju S2 (Bearish Breakdown)', () => {
    // Price = 79000 (between S2=78400 and S1=79600)
    const result = classifyPivotCondition(79000, pivots, -0.8);
    assert.equal(result.condition, 'S1_TO_S2');
    assert.equal(result.tagColor, 'rose');
    assert.match(result.label, /S1 ➔ S2/);
  });

  test('Condition 3: Menembus S1 dan menuju P (Bullish Bounce from Support)', () => {
    // Price = 79800 (above S1=79600, below P=80400, with positive bounce momentum)
    const result = classifyPivotCondition(79800, pivots, 0.4);
    assert.equal(result.condition, 'S1_TO_P');
    assert.equal(result.tagColor, 'green');
    assert.match(result.label, /S1 ➔ P/);
  });

  test('Condition 4: Menembus R1 dan menuju R2 (Bullish Breakout)', () => {
    // Price = 81900 (between R1=81600 and R2=82400)
    const result = classifyPivotCondition(81900, pivots, 0.9);
    assert.equal(result.condition, 'R1_TO_R2');
    assert.equal(result.tagColor, 'emerald');
    assert.match(result.label, /R1 ➔ R2/);
  });

  test('Condition 5: Menembus R1 dan menuju P (Rejection from Resistance)', () => {
    // Price = 81400 (between P=80400 and R1=81600, with negative momentum pulling back)
    const result = classifyPivotCondition(81400, pivots, -0.4);
    assert.equal(result.condition, 'R1_TO_P');
    assert.equal(result.tagColor, 'amber');
    assert.match(result.label, /R1 ➔ P/);
  });

  test('Multi-timeframe percentage filter logic simulation', () => {
    const mockCoins = [
      { symbol: 'COIN_A', changes: { h1: 0.2, h3: 0.5, h6: 1.1, h12: 2.0, h24: 3.5 }, condition: 'AREA_P' },
      { symbol: 'COIN_B', changes: { h1: -1.0, h3: -2.0, h6: -4.0, h12: -6.0, h24: -8.0 }, condition: 'S1_TO_S2' },
      { symbol: 'COIN_C', changes: { h1: 1.5, h3: 3.2, h6: 4.8, h12: 5.2, h24: 4.9 }, condition: 'R1_TO_R2' },
      { symbol: 'COIN_D', changes: { h1: 0.1, h3: 0.2, h6: 0.3, h12: 0.4, h24: 0.8 }, condition: 'AREA_P' },
    ];

    // Filter: 24h change < 5% (absolute)
    const filter24hUnder5 = mockCoins.filter(c => Math.abs(c.changes.h24) < 5);
    assert.deepEqual(filter24hUnder5.map(c => c.symbol), ['COIN_A', 'COIN_C', 'COIN_D']);

    // Filter: 1h change < 1% (absolute)
    const filter1hUnder1 = mockCoins.filter(c => Math.abs(c.changes.h1) < 1);
    assert.deepEqual(filter1hUnder1.map(c => c.symbol), ['COIN_A', 'COIN_D']);

    // Filter combined: 24h < 5% AND Condition === 'AREA_P'
    const filterCombined = mockCoins.filter(c => Math.abs(c.changes.h24) < 5 && c.condition === 'AREA_P');
    assert.deepEqual(filterCombined.map(c => c.symbol), ['COIN_A', 'COIN_D']);
  });
});
