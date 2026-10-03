import {
  levelForEnergy,
  PHASE_SECONDS,
  PLAYLIST,
  rosterForRound,
  TEAM_IDS,
  trackForRound,
} from '@bloxdance/shared';
import type {
  Donor,
  EventSourceKind,
  FxEvent,
  GamePhase,
  GameState,
  TeamId,
} from '@bloxdance/shared';
import { NullRecorder } from '../db/GameRecorder.js';
import type { GameRecorder } from '../db/GameRecorder.js';
import type { InputEvent } from './inputEvents.js';
import {
  accumulateLikes,
  countedDiamonds,
  isBigGift,
  leastPopulatedTeam,
  parseTeamComment,
  pickWinners,
  pointsForDiamonds,
} from './scoring.js';
import { ScoreBoard } from './ScoreBoard.js';
import { UserRegistry } from './UserRegistry.js';

const PHASE_ORDER: GamePhase[] = ['LOBBY', 'ROUND', 'FINAL_30', 'RESULTS', 'COOLDOWN'];
const SCORING_PHASES: GamePhase[] = ['LOBBY', 'ROUND', 'FINAL_30'];
const TOP_DONOR_COUNT = 3;
const FALLBACK_NAME = 'un fan';

export interface EngineOptions {
  now: () => number;
  recorder?: GameRecorder;
  toDisplayName?: (userId: string, nickname: string) => string;
  phaseSeconds?: Record<GamePhase, number>;
}

type FxListener = (event: FxEvent) => void;

export class GameEngine {
  readonly users = new UserRegistry();
  private readonly recorder: GameRecorder;
  private readonly phaseSeconds: Record<GamePhase, number>;
  private readonly listeners: FxListener[] = [];
  private readonly board = new ScoreBoard();
  private phase: GamePhase = 'LOBBY';
  private phaseEndsAt = 0;
  private roundNumber = 1;
  private roundId = 0;
  private roster = rosterForRound(1);
  private winners: TeamId[] = [];
  private track = trackForRound(1);
  private trackStartedAt = 0;
  private source: EventSourceKind = 'simulator';
  private panic = false;
  private brb = false;
  private pausedAt: number | null = null;
  private rosterOverrides: Partial<Record<TeamId, string>> = {};
  private trackOverride: string | null = null;

  constructor(private readonly options: EngineOptions) {
    this.recorder = options.recorder ?? new NullRecorder();
    this.phaseSeconds = options.phaseSeconds ?? { ...PHASE_SECONDS };
    this.beginRound();
  }

  onFx(listener: FxListener): void {
    this.listeners.push(listener);
  }

  setSource(source: EventSourceKind): void {
    this.source = source;
  }

  setPanic(enabled: boolean): void {
    this.panic = enabled;
  }

  setBrb(enabled: boolean): void {
    this.brb = enabled;
  }

  overrideRoster(team: TeamId, characterId: string | null): void {
    if (characterId) this.rosterOverrides[team] = characterId;
    else delete this.rosterOverrides[team];
  }

  overrideTrack(trackId: string | null): void {
    this.trackOverride = trackId;
  }

  getRosterOverrides(): Partial<Record<TeamId, string>> {
    return { ...this.rosterOverrides };
  }

  pause(): void {
    if (this.pausedAt === null) this.pausedAt = this.options.now();
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.phaseEndsAt += this.options.now() - this.pausedAt;
    this.pausedAt = null;
  }

  skipPhase(): void {
    this.advance(this.pausedAt ?? this.options.now());
  }

  resetPoints(): void {
    this.board.reset();
  }

  tick(): void {
    if (this.pausedAt !== null) return;
    while (this.options.now() >= this.phaseEndsAt) this.advance(this.phaseEndsAt);
  }

  handle(event: InputEvent): void {
    const user = this.users.touch(event.userId, event.nickname);
    const display = this.displayName(user.userId, user.nickname);
    const scored = SCORING_PHASES.includes(this.phase);
    let applied: { team: TeamId | null; points: number } = { team: user.team, points: 0 };

    if (event.kind === 'chat') {
      const team = parseTeamComment(event.text);
      if (team && team !== user.team) {
        user.team = team;
        this.emit({ kind: 'join', team, user: display });
        applied = { team, points: 0 };
      }
    } else if (event.kind === 'gift') {
      applied = this.applyGift(event, display);
    } else if (event.kind === 'like') {
      applied = this.applyLikes(event.likeCount, user.team, user.likeRemainder, (remainder) => {
        user.likeRemainder = remainder;
      });
    } else if (event.kind === 'follow') {
      this.emit({ kind: 'follow', user: display });
    } else {
      this.emit({ kind: 'share', user: display });
    }
    this.recorder.event(this.roundId, this.options.now(), event, { ...applied, scored });
  }

  getState(): GameState {
    const now = this.options.now();
    const level = Object.fromEntries(
      TEAM_IDS.map((team) => [team, levelForEnergy(this.board.energy[team])]),
    ) as GameState['level'];
    return {
      phase: this.phase,
      phaseEndsAt: this.phaseEndsAt + (this.pausedAt === null ? 0 : now - this.pausedAt),
      roundNumber: this.roundNumber,
      roster: { ...this.roster },
      energy: { ...this.board.energy },
      level,
      members: this.users.members(),
      topDonors: this.topDonors(),
      track: { id: this.track.id, bpm: this.track.bpm, startedAt: this.trackStartedAt },
      source: this.source,
      winners: [...this.winners],
      panic: this.panic,
      brb: this.brb,
      paused: this.pausedAt !== null,
    };
  }

  private applyGift(
    event: Extract<InputEvent, { kind: 'gift' }>,
    display: string,
  ): { team: TeamId | null; points: number } {
    const user = this.users.touch(event.userId, event.nickname);
    const diamonds = countedDiamonds(event);
    if (diamonds === null || !SCORING_PHASES.includes(this.phase))
      return { team: user.team, points: 0 };
    if (!user.team) {
      user.team = leastPopulatedTeam(this.users.members());
      this.emit({ kind: 'join', team: user.team, user: display });
      this.emit({ kind: 'hint', user: display });
    }
    const points = pointsForDiamonds(diamonds);
    this.board.addEnergy(user.team, points);
    this.board.addDonation(user.userId, user.nickname, user.team, points);
    this.emit({
      kind: 'gift',
      team: user.team,
      user: display,
      giftName: event.giftName,
      points,
      big: isBigGift(diamonds),
    });
    return { team: user.team, points };
  }

  private applyLikes(
    likeCount: number,
    team: TeamId | null,
    remainder: number,
    store: (remainder: number) => void,
  ): { team: TeamId | null; points: number } {
    if (!team || !SCORING_PHASES.includes(this.phase)) return { team, points: 0 };
    const result = accumulateLikes(remainder, likeCount);
    store(result.remainder);
    this.board.addEnergy(team, result.points);
    return { team, points: result.points };
  }

  private advance(anchor: number): void {
    const index = PHASE_ORDER.indexOf(this.phase);
    const next = PHASE_ORDER[(index + 1) % PHASE_ORDER.length] as GamePhase;
    if (next === 'LOBBY') {
      this.roundNumber += 1;
      this.beginRound(anchor);
      return;
    }
    if (next === 'RESULTS') this.finishRound();
    this.phase = next;
    this.phaseEndsAt = anchor + this.phaseSeconds[next] * 1000;
  }

  private beginRound(startAt: number = this.options.now()): void {
    const now = startAt;
    this.roster = { ...rosterForRound(this.roundNumber), ...this.rosterOverrides };
    this.track =
      PLAYLIST.find((entry) => entry.id === this.trackOverride) ?? trackForRound(this.roundNumber);
    this.trackStartedAt = now;
    this.board.reset();
    this.winners = [];
    this.users.startRound();
    this.phase = 'LOBBY';
    this.phaseEndsAt = now + this.phaseSeconds.LOBBY * 1000;
    this.roundId = this.recorder.roundStarted(
      this.roundNumber,
      this.roster,
      this.users.teamSnapshot(),
      now,
    );
  }

  private finishRound(): void {
    this.winners = pickWinners(this.board.energy, this.users.activeMembers());
    this.recorder.roundEnded(
      this.roundId,
      { ...this.board.energy },
      this.winners,
      this.options.now(),
    );
  }

  private topDonors(): Donor[] {
    const onlyTeams = this.phase === 'RESULTS' ? this.winners : undefined;
    return this.board.top(TOP_DONOR_COUNT, onlyTeams).map((donor) => ({
      user: this.displayName(donor.userId, donor.nickname),
      team: donor.team,
      points: donor.points,
    }));
  }

  private displayName(userId: string, nickname: string): string {
    return this.options.toDisplayName?.(userId, nickname) ?? (nickname || FALLBACK_NAME);
  }

  private emit(event: FxEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
