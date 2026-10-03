import type { EnergyLevel } from '@bloxdance/shared';
import type { DanceClip } from './types';

const DIRECTOR_BAR_BEATS = 8;
const SHORT_INTERVAL_BEATS = 8;
const LONG_INTERVAL_BEATS = 16;
const REPEAT_MEMORY = 2;

interface Slot {
  signatureId: string;
  clip: DanceClip | null;
  nextChangeBeat: number;
  history: string[];
  forced: { clip: DanceClip; untilBeat: number } | null;
}

export function eligibleDances(
  library: DanceClip[],
  level: EnergyLevel,
  signatureId: string,
): DanceClip[] {
  return library.filter((clip) => {
    if (clip.kind === 'dance') return clip.level <= level;
    if (clip.kind === 'signature') return level >= 3 && clip.id === signatureId;
    return false;
  });
}

export class DanceDirector {
  private readonly slots = new Map<string, Slot>();

  constructor(
    private readonly library: DanceClip[],
    private readonly random: () => number = Math.random,
  ) {}

  register(characterId: string, signatureId: string): void {
    this.slots.set(characterId, {
      signatureId,
      clip: null,
      nextChangeBeat: 0,
      history: [],
      forced: null,
    });
  }

  unregister(characterId: string): void {
    this.slots.delete(characterId);
  }

  force(characterId: string, clip: DanceClip, fromBeat: number, durationBeats: number): void {
    const slot = this.requireSlot(characterId);
    slot.forced = { clip, untilBeat: fromBeat + durationBeats };
  }

  forceAll(clip: DanceClip, fromBeat: number, durationBeats: number): void {
    this.slots.forEach((_, characterId) => this.force(characterId, clip, fromBeat, durationBeats));
  }

  releaseAll(): void {
    this.slots.forEach((slot) => {
      slot.forced = null;
      slot.nextChangeBeat = 0;
    });
  }

  clipFor(characterId: string, beat: number, level: EnergyLevel): DanceClip | null {
    const slot = this.requireSlot(characterId);
    if (slot.forced) {
      if (beat < slot.forced.untilBeat) return slot.forced.clip;
      slot.forced = null;
      slot.nextChangeBeat = 0;
    }
    const stale = slot.clip !== null && !this.isEligible(slot, slot.clip, level);
    if (slot.clip === null || beat >= slot.nextChangeBeat || stale) this.choose(slot, beat, level);
    return slot.clip;
  }

  private isEligible(slot: Slot, clip: DanceClip, level: EnergyLevel): boolean {
    return eligibleDances(this.library, level, slot.signatureId).some(
      (candidate) => candidate.id === clip.id,
    );
  }

  private choose(slot: Slot, beat: number, level: EnergyLevel): void {
    const pool = eligibleDances(this.library, level, slot.signatureId);
    const fresh = pool.filter((clip) => !slot.history.slice(-REPEAT_MEMORY).includes(clip.id));
    const candidates = fresh.length > 0 ? fresh : pool;
    const picked = candidates[Math.floor(this.random() * candidates.length)] ?? null;
    slot.clip = picked;
    if (picked) slot.history.push(picked.id);
    const interval = this.random() < 0.5 ? SHORT_INTERVAL_BEATS : LONG_INTERVAL_BEATS;
    slot.nextChangeBeat = Math.floor(beat / DIRECTOR_BAR_BEATS) * DIRECTOR_BAR_BEATS + interval;
  }

  private requireSlot(characterId: string): Slot {
    const slot = this.slots.get(characterId);
    if (!slot) throw new Error(`Character not registered with director: ${characterId}`);
    return slot;
  }
}
