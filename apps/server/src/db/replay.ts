import type { TeamId } from '@bloxdance/shared';
import { GameEngine } from '../game/GameEngine.js';
import type { GameDatabase } from './Database.js';

const FROZEN_TIME = 1_700_000_000_000;

export function replayRound(database: GameDatabase, roundId: number): Record<TeamId, number> {
  const round = database.rounds().find((candidate) => candidate.id === roundId);
  if (!round) throw new Error(`Unknown round ${roundId}`);
  const engine = new GameEngine({ now: () => FROZEN_TIME });
  engine.users.restore(round.teamsSnapshot);
  database
    .eventsForRound(roundId)
    .filter((event) => event.scored || event.input.kind === 'chat')
    .forEach((event) => engine.handle(event.input));
  return engine.getState().energy;
}
