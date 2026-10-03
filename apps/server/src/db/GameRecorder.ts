import type { TeamId } from '@bloxdance/shared';
import type { InputEvent } from '../game/inputEvents.js';
import type { TeamSnapshot } from '../game/UserRegistry.js';

export interface AppliedEffect {
  team: TeamId | null;
  points: number;
  scored: boolean;
}

export interface GameRecorder {
  roundStarted(
    roundNumber: number,
    roster: Record<TeamId, string>,
    teams: TeamSnapshot,
    at: number,
  ): number;
  roundEnded(roundId: number, energy: Record<TeamId, number>, winners: TeamId[], at: number): void;
  event(roundId: number, at: number, input: InputEvent, applied: AppliedEffect): void;
}

export class NullRecorder implements GameRecorder {
  private nextId = 1;

  roundStarted(): number {
    return this.nextId++;
  }

  roundEnded(): void {
    return;
  }

  event(): void {
    return;
  }
}
