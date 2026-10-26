import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyPivots, classifyPivotCondition } from '../src/services/pivot.js';

describe('Daily Pivot Points Calculations', () => {
  test('correctly calculates standard classic pivot levels', () => {
    // Example test case:
    // High = 100, Low = 80, Close = 90
    // P = (100 + 80 + 90) / 3 = 90
    // R1 = (2 * 90) - 80 = 100
    // S1 = (2 * 90) - 100 = 80
    // R2 = 90 + (100 - 80) = 110
    // S2 = 90 - (100 - 80) = 70
    const pivots = calculateDailyPivots(100, 80, 90);

    assert.equal(pivots.P, 90);
    assert.equal(pivots.R1, 100);
    assert.equal(pivots.S1, 80);
    assert.equal(pivots.R2, 110);
    assert.equal(pivots.S2, 70);
    assert.equal(pivots.R3, 120);
    assert.equal(pivots.S3, 60);
  });

  test('throws error on invalid input', () => {
    assert.throws(() => calculateDailyPivots('foo', 80, 90));
  });
});

describe('Pivot Condition Classification', () => {
  // Setup pivots: H=100, L=80, C=90 -> P=90, R1=100, R2=110, S1=80, S2=70
  const pivots = calculateDailyPivots(100, 80, 90);

  test('classifies price in AREA_P when near Pivot P', () => {
    // 90.1 is 0.11% away from P (90), well within the 0.4% threshold
    const res = classifyPivotCondition(90.1, pivots, 0);
    assert.equal(res.condition, 'AREA_P');
    assert.match(res.label, /Area P/);
  });

  test('classifies R1_TO_R2 when price breaks above R1 towards R2', () => {
    // Price = 105 (between R1=100 and R2=110)
    const res = classifyPivotCondition(105, pivots, 1.5);
    assert.equal(res.condition, 'R1_TO_R2');
    assert.equal(res.tagColor, 'emerald');
  });

  test('classifies R1_TO_P when price rejects from R1 back down towards P', () => {
    // Price = 98 (between P=90 and R1=100), with negative momentum (-0.5%)
    const res = classifyPivotCondition(98, pivots, -0.5);
    assert.equal(res.condition, 'R1_TO_P');
    assert.equal(res.tagColor, 'amber');
  });

  test('classifies S1_TO_S2 when price breaks below S1 towards S2', () => {
    // Price = 75 (between S2=70 and S1=80)
    const res = classifyPivotCondition(75, pivots, -1.0);
    assert.equal(res.condition, 'S1_TO_S2');
    assert.equal(res.tagColor, 'rose');
  });

  test('classifies S1_TO_P when price bounces off S1 upwards towards P', () => {
    // Price = 83 (between S1=80 and P=90), with positive momentum (+0.8%)
    const res = classifyPivotCondition(83, pivots, 0.8);
    assert.equal(res.condition, 'S1_TO_P');
    assert.equal(res.tagColor, 'green');
  });

  test('classifies ABOVE_R2 when price exceeds R2', () => {
    const res = classifyPivotCondition(115, pivots, 2.0);
    assert.equal(res.condition, 'ABOVE_R2');
  });

  test('classifies BELOW_S2 when price drops below S2', () => {
    const res = classifyPivotCondition(65, pivots, -2.0);
    assert.equal(res.condition, 'BELOW_S2');
  });
});
