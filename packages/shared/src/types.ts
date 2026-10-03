export type TeamId = 'red' | 'blue' | 'green' | 'yellow';

export type GamePhase = 'LOBBY' | 'ROUND' | 'FINAL_30' | 'RESULTS' | 'COOLDOWN';

export type EnergyLevel = 0 | 1 | 2 | 3;

export type EventSourceKind = 'tiktok' | 'simulator';

export interface Donor {
  user: string;
  team: TeamId;
  points: number;
}

export interface TrackInfo {
  id: string;
  bpm: number;
  startedAt: number;
}

export interface GameState {
  phase: GamePhase;
  phaseEndsAt: number;
  roundNumber: number;
  roster: Record<TeamId, string>;
  energy: Record<TeamId, number>;
  level: Record<TeamId, EnergyLevel>;
  members: Record<TeamId, number>;
  topDonors: Donor[];
  track: TrackInfo;
  source: EventSourceKind;
  winners: TeamId[];
  panic: boolean;
  brb: boolean;
  paused: boolean;
}

export type FxEvent =
  | {
      kind: 'gift';
      team: TeamId;
      user: string;
      giftName: string;
      points: number;
      big: boolean;
    }
  | { kind: 'join'; team: TeamId; user: string }
  | { kind: 'hint'; user: string }
  | { kind: 'follow'; user: string }
  | { kind: 'share'; user: string };

export type ServerMessage = { type: 'state'; state: GameState } | { type: 'fx'; event: FxEvent };
