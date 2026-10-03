import { describe, expect, it } from 'vitest';
import { ALERT_DURATION_MS, AlertScheduler, MAX_VISIBLE_ALERTS } from './AlertScheduler';
import { energyBarFill, formatClock } from './formatClock';
import { SAFE_AREA } from './safeZones';

describe('formatClock', () => {
  it('formats m:ss rounding partial seconds up', () => {
    expect(formatClock(180_000)).toBe('3:00');
    expect(formatClock(61_200)).toBe('1:02');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('energyBarFill', () => {
  it('scales against the leader with a floor of 500', () => {
    expect(energyBarFill(0, 0)).toBe(0);
    expect(energyBarFill(250, 100)).toBe(0.5);
    expect(energyBarFill(1000, 1000)).toBeCloseTo(1 / 1.15, 5);
  });
});

describe('AlertScheduler', () => {
  it('shows at most 3 alerts for 2.5 seconds each and queues the rest', () => {
    const scheduler = new AlertScheduler();
    for (let index = 0; index < 5; index += 1) scheduler.push(`a${index}`, '#fff');
    expect(scheduler.update(0).map((alert) => alert.text)).toEqual(['a0', 'a1', 'a2']);
    expect(scheduler.pending()).toBe(2);
    expect(scheduler.update(ALERT_DURATION_MS - 1)).toHaveLength(MAX_VISIBLE_ALERTS);
    expect(scheduler.update(ALERT_DURATION_MS).map((alert) => alert.text)).toEqual(['a3', 'a4']);
    expect(scheduler.update(ALERT_DURATION_MS * 2)).toEqual([]);
  });

  it('clears everything for the panic button', () => {
    const scheduler = new AlertScheduler();
    scheduler.push('x', '#fff');
    scheduler.update(0);
    scheduler.push('y', '#fff');
    scheduler.clear();
    expect(scheduler.update(1)).toEqual([]);
  });
});

describe('TikTok safe area', () => {
  it('leaves the last 600px and the right 160px free', () => {
    expect(SAFE_AREA.bottom).toBe(1320);
    expect(SAFE_AREA.right).toBe(920);
  });
});
