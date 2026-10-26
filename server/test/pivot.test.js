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
    assert.equal(pivots.R4, 130);
    assert.equal(pivots.S4, 50);
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

  test('classifies R2_TO_R3 when price breaks above R2 towards R3', () => {
    // Price = 115 (between R2=110 and R3=120)
    const res = classifyPivotCondition(115, pivots, 2.0);
    assert.equal(res.condition, 'R2_TO_R3');
    assert.equal(res.tagColor, 'purple');
  });

  test('classifies R3_TO_R4 when price breaks above R3 towards R4', () => {
    // Price = 125 (between R3=120 and R4=130)
    const res = classifyPivotCondition(125, pivots, 3.0);
    assert.equal(res.condition, 'R3_TO_R4');
    assert.match(res.label, /R3 ➔ R4/);
  });

  test('classifies ABOVE_R4 when price exceeds R4', () => {
    // Price = 135 (> R4=130)
    const res = classifyPivotCondition(135, pivots, 4.0);
    assert.equal(res.condition, 'ABOVE_R4');
    assert.match(res.label, /Di atas R4/);
  });

  test('classifies S2_TO_S3 when price breaks below S2 towards S3', () => {
    // Price = 65 (between S3=60 and S2=70)
    const res = classifyPivotCondition(65, pivots, -2.0);
    assert.equal(res.condition, 'S2_TO_S3');
    assert.equal(res.tagColor, 'red');
  });

  test('classifies S3_TO_S4 when price breaks below S3 towards S4', () => {
    // Price = 55 (between S4=50 and S3=60)
    const res = classifyPivotCondition(55, pivots, -3.0);
    assert.equal(res.condition, 'S3_TO_S4');
    assert.match(res.label, /S3 ➔ S4/);
  });

  test('classifies BELOW_S4 when price drops below S4', () => {
    // Price = 45 (< S4=50)
    const res = classifyPivotCondition(45, pivots, -4.0);
    assert.equal(res.condition, 'BELOW_S4');
    assert.match(res.label, /Di bawah S4/);
  });
});
