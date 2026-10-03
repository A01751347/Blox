import BetterSqlite3 from 'better-sqlite3';
import type { TeamId } from '@bloxdance/shared';
import type { InputEvent } from '../game/inputEvents.js';
import type { TeamSnapshot } from '../game/UserRegistry.js';
import type { AppliedEffect, GameRecorder } from './GameRecorder.js';
import type { ModerationStore } from '../moderation/ModerationService.js';
import { SCHEMA } from './schema.js';

export interface StoredEvent {
  at: number;
  input: InputEvent;
  team: TeamId | null;
  points: number;
  scored: boolean;
}

export interface StoredRound {
  id: number;
  number: number;
  teamsSnapshot: TeamSnapshot;
  energy: Record<TeamId, number> | null;
  winners: TeamId[] | null;
}

export class GameDatabase implements GameRecorder, ModerationStore {
  readonly raw: BetterSqlite3.Database;
  private readonly sessionId: number;

  constructor(path: string, now: () => number = Date.now) {
    this.raw = new BetterSqlite3(path);
    this.raw.pragma('journal_mode = WAL');
    this.raw.exec(SCHEMA);
    const result = this.raw.prepare('INSERT INTO sessions (started_at) VALUES (?)').run(now());
    this.sessionId = Number(result.lastInsertRowid);
  }

  roundStarted(
    roundNumber: number,
    roster: Record<TeamId, string>,
    teams: TeamSnapshot,
    at: number,
  ): number {
    const result = this.raw
      .prepare(
        'INSERT INTO rounds (session_id, number, roster, teams_snapshot, started_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(this.sessionId, roundNumber, JSON.stringify(roster), JSON.stringify(teams), at);
    return Number(result.lastInsertRowid);
  }

  roundEnded(roundId: number, energy: Record<TeamId, number>, winners: TeamId[], at: number): void {
    this.raw
      .prepare('UPDATE rounds SET ended_at = ?, energy = ?, winners = ? WHERE id = ?')
      .run(at, JSON.stringify(energy), JSON.stringify(winners), roundId);
  }

  event(roundId: number, at: number, input: InputEvent, applied: AppliedEffect): void {
    this.raw
      .prepare(
        'INSERT INTO events (round_id, at, kind, user_id, payload, team, points, scored) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        roundId,
        at,
        input.kind,
        input.userId,
        JSON.stringify(input),
        applied.team,
        applied.points,
        applied.scored ? 1 : 0,
      );
    if (applied.points > 0) {
      this.raw
        .prepare(
          `INSERT INTO users (user_id, nickname, team, first_seen, total_points) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, team = excluded.team,
           total_points = total_points + excluded.total_points`,
        )
        .run(input.userId, input.nickname, applied.team, at, applied.points);
    }
  }

  load(kind: 'blockedUser' | 'bannedWord'): string[] {
    const rows = this.raw
      .prepare('SELECT value FROM moderation_lists WHERE kind = ?')
      .all(kind) as Array<{ value: string }>;
    return rows.map((row) => row.value);
  }

  add(kind: 'blockedUser' | 'bannedWord', value: string): void {
    this.raw
      .prepare('INSERT OR IGNORE INTO moderation_lists (kind, value) VALUES (?, ?)')
      .run(kind, value);
  }

  remove(kind: 'blockedUser' | 'bannedWord', value: string): void {
    this.raw.prepare('DELETE FROM moderation_lists WHERE kind = ? AND value = ?').run(kind, value);
  }

  recordRaw(at: number, source: string, type: string, payload: unknown): void {
    this.raw
      .prepare('INSERT INTO raw_events (at, source, type, payload) VALUES (?, ?, ?, ?)')
      .run(at, source, type, JSON.stringify(payload));
  }

  rounds(): StoredRound[] {
    const rows = this.raw.prepare('SELECT * FROM rounds ORDER BY id').all() as Array<{
      id: number;
      number: number;
      teams_snapshot: string;
      energy: string | null;
      winners: string | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      number: row.number,
      teamsSnapshot: JSON.parse(row.teams_snapshot) as TeamSnapshot,
      energy: row.energy ? (JSON.parse(row.energy) as Record<TeamId, number>) : null,
      winners: row.winners ? (JSON.parse(row.winners) as TeamId[]) : null,
    }));
  }

  eventsForRound(roundId: number): StoredEvent[] {
    const rows = this.raw
      .prepare(
        'SELECT at, payload, team, points, scored FROM events WHERE round_id = ? ORDER BY id',
      )
      .all(roundId) as Array<{
      at: number;
      payload: string;
      team: TeamId | null;
      points: number;
      scored: number;
    }>;
    return rows.map((row) => ({
      at: row.at,
      input: JSON.parse(row.payload) as InputEvent,
      team: row.team,
      points: row.points,
      scored: row.scored === 1,
    }));
  }

  weeklyRanking(since: number, limit = 10): Array<{ nickname: string; points: number }> {
    return this.raw
      .prepare(
        `SELECT u.nickname AS nickname, SUM(e.points) AS points FROM events e
         JOIN users u ON u.user_id = e.user_id WHERE e.at >= ? AND e.points > 0
         GROUP BY e.user_id ORDER BY points DESC LIMIT ?`,
      )
      .all(since, limit) as Array<{ nickname: string; points: number }>;
  }

  close(): void {
    this.raw
      .prepare('UPDATE sessions SET ended_at = ? WHERE id = ?')
      .run(Date.now(), this.sessionId);
    this.raw.close();
  }
}
