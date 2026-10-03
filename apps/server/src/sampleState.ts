import { PHASE_SECONDS } from '@bloxdance/shared';
import type { GameState } from '@bloxdance/shared';

export function createSampleState(now: number): GameState {
  return {
    phase: 'LOBBY',
    phaseEndsAt: now + PHASE_SECONDS.LOBBY * 1000,
    roundNumber: 1,
    roster: { red: 'chispa', blue: 'mochi', green: 'turbo', yellow: 'nova' },
    energy: { red: 0, blue: 0, green: 0, yellow: 0 },
    level: { red: 0, blue: 0, green: 0, yellow: 0 },
    members: { red: 0, blue: 0, green: 0, yellow: 0 },
    topDonors: [],
    track: { id: 'sample', bpm: 120, startedAt: now },
    source: 'simulator',
    winners: [],
    panic: false,
    brb: false,
  };
}
