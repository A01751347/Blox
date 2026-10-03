import { levelForEnergy, PHASE_SECONDS, TEAM_IDS } from '@bloxdance/shared';
import type { GameState, TeamId } from '@bloxdance/shared';

export function createDemoState(params: URLSearchParams): GameState {
  const now = Date.now();
  const energyParam = Number(params.get('energy') ?? 300);
  const energy = Object.fromEntries(
    TEAM_IDS.map((team, index) => [team, energyParam * (1 + index * 0.4)]),
  ) as Record<TeamId, number>;
  const level = Object.fromEntries(
    TEAM_IDS.map((team) => [team, levelForEnergy(energy[team])]),
  ) as GameState['level'];
  const phase = (params.get('phase') ?? 'ROUND') as GameState['phase'];
  return {
    phase,
    phaseEndsAt: now + PHASE_SECONDS.ROUND * 1000,
    roundNumber: 1,
    roster: { red: 'chispa', blue: 'mochi', green: 'turbo', yellow: 'nova' },
    energy,
    level,
    members: { red: 3, blue: 2, green: 4, yellow: 1 },
    topDonors: [],
    track: { id: 'demo', bpm: 120, startedAt: now },
    source: 'simulator',
    winners: phase === 'RESULTS' ? ['yellow'] : [],
    panic: false,
    brb: false,
    paused: false,
  };
}
