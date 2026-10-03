import { SIMULATED_GIFTS, SIMULATED_VIEWERS } from '../sources/simulatorPopulation.js';
import { TEAM_IDS, TEAM_NUMBER } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import type { GameRuntime } from '../runtime.js';

const VIEWERS_PER_TEAM = 4;

export type SimulatorAction =
  | { action: 'gift'; team: TeamId; giftName: string; repeat?: number }
  | { action: 'like'; team: TeamId; count?: number }
  | { action: 'chat'; team: TeamId }
  | { action: 'follow' }
  | { action: 'share' }
  | { action: 'storm'; minutes: number }
  | { action: 'stopStorm' };

function viewerFor(team: TeamId, runtime: GameRuntime) {
  const teamIndex = TEAM_IDS.indexOf(team);
  const offset = Math.floor(Math.random() * VIEWERS_PER_TEAM);
  const viewer = SIMULATED_VIEWERS[teamIndex * VIEWERS_PER_TEAM + offset] ?? SIMULATED_VIEWERS[0];
  if (!viewer) throw new Error('No simulated viewers available');
  runtime.simulator.chat(viewer, String(TEAM_NUMBER[team]));
  return viewer;
}

export function runSimulatorAction(runtime: GameRuntime, request: SimulatorAction): void {
  const { simulator } = runtime;
  if (request.action === 'storm') {
    simulator.startStorm(runtime.now(), request.minutes * 60_000);
  } else if (request.action === 'stopStorm') {
    simulator.stopStorm();
  } else if (request.action === 'chat') {
    viewerFor(request.team, runtime);
  } else if (request.action === 'gift') {
    const gift =
      SIMULATED_GIFTS.find((candidate) => candidate.name === request.giftName) ??
      SIMULATED_GIFTS[0];
    if (gift) simulator.gift(viewerFor(request.team, runtime), gift, request.repeat ?? 1);
  } else if (request.action === 'like') {
    simulator.inject({
      kind: 'like',
      ...viewerFor(request.team, runtime),
      likeCount: request.count ?? 10,
    });
  } else {
    const viewer = SIMULATED_VIEWERS[Math.floor(Math.random() * SIMULATED_VIEWERS.length)];
    if (viewer) simulator.inject({ kind: request.action, ...viewer });
  }
}
