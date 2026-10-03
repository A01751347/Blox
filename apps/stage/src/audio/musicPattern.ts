import type { TrackStyle } from '@bloxdance/shared';

export const STEPS_PER_BEAT = 4;
export const STEPS_PER_BAR = 16;

export interface StepEvents {
  kick: boolean;
  snare: boolean;
  hat: boolean;
  bassNote: number | null;
  leadNote: number | null;
}

function hit(pattern: string, step: number): boolean {
  return pattern[step % pattern.length] === 'x';
}

export function degreeToMidi(style: TrackStyle, degree: number): number {
  const size = style.scale.length;
  const octave = Math.floor(degree / size);
  const index = ((degree % size) + size) % size;
  return style.root + (style.scale[index] ?? 0) + octave * 12;
}

export function chordRootDegree(style: TrackStyle, step: number): number {
  const bar = Math.floor(step / STEPS_PER_BAR);
  return style.progression[bar % style.progression.length] ?? 0;
}

export function chordTones(style: TrackStyle, step: number): number[] {
  const root = chordRootDegree(style, step);
  return [0, 2, 4].map((offset) => degreeToMidi(style, root + offset));
}

export function eventsForStep(style: TrackStyle, step: number): StepEvents {
  const inBar = ((step % STEPS_PER_BAR) + STEPS_PER_BAR) % STEPS_PER_BAR;
  const root = chordRootDegree(style, step);
  const tones = chordTones(style, step);
  const leadIndex = Math.floor(step / 2) % tones.length;
  return {
    kick: hit(style.kick, inBar),
    snare: hit(style.snare, inBar),
    hat: hit(style.hat, inBar),
    bassNote: hit(style.bass, inBar) ? degreeToMidi(style, root) - 12 : null,
    leadNote: hit(style.lead, inBar) ? (tones[leadIndex] ?? tones[0] ?? style.root) + 12 : null,
  };
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function stepDurationSeconds(bpm: number): number {
  return 60 / bpm / STEPS_PER_BEAT;
}

export interface SectionMask {
  kick: boolean;
  snare: boolean;
  hat: boolean;
  bass: boolean;
  lead: boolean;
}

export const SECTION_BARS = 4;

const SECTIONS: SectionMask[] = [
  { kick: true, snare: false, hat: true, bass: true, lead: false },
  { kick: true, snare: true, hat: true, bass: true, lead: true },
  { kick: false, snare: false, hat: true, bass: false, lead: true },
  { kick: true, snare: true, hat: true, bass: true, lead: true },
];

export function sectionForStep(step: number): SectionMask {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const index = Math.floor(bar / SECTION_BARS) % SECTIONS.length;
  return SECTIONS[index] as SectionMask;
}
