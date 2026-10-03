import { describe, expect, it } from 'vitest';
import { TEAM_IDS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import { replayRound } from './db/replay.js';
import { GameRuntime } from './runtime.js';

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe('one hour storm with the simulator', () => {
  it('runs without errors and points match the event log', () => {
    const clock = { now: 1_700_000_000_000 };
    const runtime = new GameRuntime({ now: () => clock.now, random: seededRandom(2024) });
    runtime.simulator.startStorm(clock.now, 3600 * 1000, 5);
    runtime.database.raw.exec('BEGIN');
    for (let step = 0; step < 36000; step += 1) {
      clock.now += 100;
      runtime.tick();
    }
    runtime.database.raw.exec('COMMIT');

    const finished = runtime.database.rounds().filter((round) => round.energy !== null);
    expect(finished.length).toBeGreaterThanOrEqual(15);

    finished.forEach((round) => {
      const events = runtime.database.eventsForRound(round.id);
      const fromLog = Object.fromEntries(TEAM_IDS.map((team) => [team, 0])) as Record<
        TeamId,
        number
      >;
      events.forEach((event) => {
        if (event.team && event.scored) fromLog[event.team] += event.points;
      });
      expect(round.energy).toEqual(fromLog);
      expect(replayRound(runtime.database, round.id)).toEqual(round.energy);
      expect(round.winners?.length).toBeGreaterThan(0);
    });
    runtime.stop();
  }, 120_000);
});
