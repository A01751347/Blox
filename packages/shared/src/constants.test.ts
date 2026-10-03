import { describe, expect, it } from 'vitest';
import { levelForEnergy } from './constants.js';

describe('levelForEnergy', () => {
  it('maps energy to the plan thresholds', () => {
    expect(levelForEnergy(0)).toBe(0);
    expect(levelForEnergy(99)).toBe(0);
    expect(levelForEnergy(100)).toBe(1);
    expect(levelForEnergy(499)).toBe(1);
    expect(levelForEnergy(500)).toBe(2);
    expect(levelForEnergy(1999)).toBe(2);
    expect(levelForEnergy(2000)).toBe(3);
  });
});
