import { describe, expect, it } from 'vitest';
import { DanceDirector, eligibleDances } from './DanceDirector';
import type { DanceClip } from './types';

function clip(id: string, kind: DanceClip['kind'], level: DanceClip['level']): DanceClip {
  return { id, name: id, kind, level, beats: 4, loop: true, keyframes: [{ beat: 0, joints: {} }] };
}

const LIBRARY = [
  clip('a', 'dance', 0),
  clip('b', 'dance', 0),
  clip('c', 'dance', 1),
  clip('d', 'dance', 2),
  clip('e', 'dance', 3),
  clip('sig_chispa', 'signature', 3),
  clip('sig_nova', 'signature', 3),
  clip('victory', 'victory', 0),
  clip('defeat', 'defeat', 0),
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe('eligibleDances', () => {
  it('unlocks dances by energy level', () => {
    expect(eligibleDances(LIBRARY, 0, 'sig_chispa').map((item) => item.id)).toEqual(['a', 'b']);
    expect(eligibleDances(LIBRARY, 1, 'sig_chispa').map((item) => item.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(eligibleDances(LIBRARY, 2, 'sig_chispa')).toHaveLength(4);
  });

  it('only offers the own signature at level 3 and never victory or defeat', () => {
    const ids = eligibleDances(LIBRARY, 3, 'sig_chispa').map((item) => item.id);
    expect(ids).toContain('sig_chispa');
    expect(ids).not.toContain('sig_nova');
    expect(ids).not.toContain('victory');
    expect(ids).not.toContain('defeat');
  });
});

describe('DanceDirector', () => {
  it('changes dances every 8 or 16 beats and never repeats back to back', () => {
    const director = new DanceDirector(LIBRARY, seededRandom(11));
    director.register('chispa', 'sig_chispa');
    let last = director.clipFor('chispa', 0, 3);
    let changes = 0;
    for (let beat = 1; beat < 400; beat += 1) {
      const current = director.clipFor('chispa', beat, 3);
      if (current?.id !== last?.id) {
        changes += 1;
        expect(beat % 8).toBe(0);
        last = current;
      }
    }
    expect(changes).toBeGreaterThan(400 / 16 - 2);
    expect(changes).toBeLessThan(400 / 8 + 1);
  });

  it('keeps the clip for at least 8 beats', () => {
    const director = new DanceDirector(LIBRARY, seededRandom(3));
    director.register('nova', 'sig_nova');
    const first = director.clipFor('nova', 0, 1);
    for (let beat = 1; beat < 8; beat += 1) {
      expect(director.clipFor('nova', beat, 1)?.id).toBe(first?.id);
    }
  });

  it('forces a clip for a duration and then resumes', () => {
    const director = new DanceDirector(LIBRARY, seededRandom(5));
    director.register('rex', 'sig_rex');
    director.force('rex', LIBRARY[5] as DanceClip, 10, 8);
    expect(director.clipFor('rex', 12, 0)?.id).toBe('sig_chispa');
    expect(director.clipFor('rex', 18, 0)?.id).not.toBe('sig_chispa');
  });

  it('forces every registered character at once', () => {
    const director = new DanceDirector(LIBRARY, seededRandom(5));
    director.register('x', 's');
    director.register('y', 's');
    director.forceAll(LIBRARY[0] as DanceClip, 0, 4);
    expect(director.clipFor('x', 1, 3)?.id).toBe('a');
    expect(director.clipFor('y', 1, 3)?.id).toBe('a');
  });
});
