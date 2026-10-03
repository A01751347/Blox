import { describe, expect, it } from 'vitest';
import { nextBlinkInterval, resolveFace } from './FaceController';

describe('face resolution', () => {
  const base = { eyes: 'oval', mouth: 'smile', extras: ['brows'] } as const;

  it('keeps the base face for idle', () => {
    expect(resolveFace({ ...base, extras: [...base.extras] }, 'idle')).toEqual(base);
  });

  it('applies expression overrides and merges extras', () => {
    const face = resolveFace({ ...base, extras: [...base.extras] }, 'victory');
    expect(face.eyes).toBe('happyArc');
    expect(face.mouth).toBe('grinOpen');
    expect(face.extras).toEqual(['brows', 'blush']);
  });

  it('never replaces shades with other eyes', () => {
    const face = resolveFace({ eyes: 'shades', mouth: 'line', extras: [] }, 'hype');
    expect(face.eyes).toBe('shades');
  });

  it('schedules blinks every 3 to 5 seconds', () => {
    expect(nextBlinkInterval(() => 0)).toBe(3);
    expect(nextBlinkInterval(() => 1)).toBe(5);
  });
});
