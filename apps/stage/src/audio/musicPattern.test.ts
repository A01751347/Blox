import { describe, expect, it } from 'vitest';
import { PLAYLIST } from '@bloxdance/shared';
import type { TrackStyle } from '@bloxdance/shared';
import {
  chordRootDegree,
  chordTones,
  degreeToMidi,
  eventsForStep,
  midiToFrequency,
  sectionForStep,
  stepDurationSeconds,
  STEPS_PER_BAR,
} from './musicPattern';

const STYLE: TrackStyle = {
  root: 57,
  scale: [0, 2, 3, 5, 7, 8, 10],
  progression: [0, 5, 3, 4],
  kick: 'x...x...x...x...',
  snare: '....x.......x...',
  hat: '..x...x...x...x.',
  bass: 'x..x..x.x..x..x.',
  lead: 'x.x.x.xxx.x.x.x.',
  leadWave: 'square',
};

describe('music patterns', () => {
  it('maps scale degrees to MIDI notes across octaves', () => {
    expect(degreeToMidi(STYLE, 0)).toBe(57);
    expect(degreeToMidi(STYLE, 2)).toBe(60);
    expect(degreeToMidi(STYLE, 7)).toBe(69);
    expect(degreeToMidi(STYLE, -1)).toBe(57 - 2);
  });

  it('changes chord every bar following the progression', () => {
    expect(chordRootDegree(STYLE, 0)).toBe(0);
    expect(chordRootDegree(STYLE, STEPS_PER_BAR)).toBe(5);
    expect(chordRootDegree(STYLE, STEPS_PER_BAR * 4)).toBe(0);
    expect(chordTones(STYLE, 0)).toEqual([57, 60, 64]);
  });

  it('puts the kick on every beat and the snare on 2 and 4 for the first style', () => {
    const kicks = Array.from({ length: 16 }, (_, step) => eventsForStep(STYLE, step).kick);
    expect(kicks.filter(Boolean)).toHaveLength(4);
    expect(eventsForStep(STYLE, 4).snare).toBe(true);
    expect(eventsForStep(STYLE, 12).snare).toBe(true);
    expect(eventsForStep(STYLE, 0).snare).toBe(false);
  });

  it('keeps the bass an octave under the chord root', () => {
    expect(eventsForStep(STYLE, 0).bassNote).toBe(45);
    expect(eventsForStep(STYLE, 1).bassNote).toBeNull();
  });

  it('converts MIDI to Hz and BPM to step length', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    expect(stepDurationSeconds(120)).toBeCloseTo(0.125, 6);
  });

  it('gives every playlist entry a valid 16 step style and a license', () => {
    expect(PLAYLIST.length).toBeGreaterThanOrEqual(4);
    PLAYLIST.forEach((track) => {
      expect(track.license).toBeTruthy();
      if (!track.file) {
        const style = track.style as TrackStyle;
        [style.kick, style.snare, style.hat, style.bass, style.lead].forEach((pattern) =>
          expect(pattern).toHaveLength(16),
        );
      }
    });
  });

  it('cycles build, drop, breakdown and drop every 4 bars', () => {
    const barStep = (bar: number) => bar * STEPS_PER_BAR;
    expect(sectionForStep(barStep(0)).lead).toBe(false);
    expect(sectionForStep(barStep(4)).snare).toBe(true);
    expect(sectionForStep(barStep(8)).kick).toBe(false);
    expect(sectionForStep(barStep(12)).kick).toBe(true);
    expect(sectionForStep(barStep(16)).lead).toBe(false);
  });
});
