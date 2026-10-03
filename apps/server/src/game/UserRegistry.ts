import { TEAM_IDS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';

export type TeamSnapshot = Record<string, { team: TeamId; likeRemainder: number }>;

export interface UserRecord {
  userId: string;
  nickname: string;
  team: TeamId | null;
  likeRemainder: number;
  activeThisRound: boolean;
  lastSeen: number;
}

function emptyCounts(): Record<TeamId, number> {
  return { red: 0, blue: 0, green: 0, yellow: 0 };
}

export class UserRegistry {
  private readonly users = new Map<string, UserRecord>();
  private clock = 0;

  touch(userId: string, nickname: string): UserRecord {
    this.clock += 1;
    const existing = this.users.get(userId);
    if (existing) {
      existing.nickname = nickname;
      existing.activeThisRound = true;
      existing.lastSeen = this.clock;
      return existing;
    }
    const created: UserRecord = {
      userId,
      nickname,
      team: null,
      likeRemainder: 0,
      activeThisRound: true,
      lastSeen: this.clock,
    };
    this.users.set(userId, created);
    return created;
  }

  recent(limit: number): UserRecord[] {
    return [...this.users.values()].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, limit);
  }

  members(): Record<TeamId, number> {
    const counts = emptyCounts();
    this.users.forEach((user) => {
      if (user.team) counts[user.team] += 1;
    });
    return counts;
  }

  activeMembers(): Record<TeamId, number> {
    const counts = emptyCounts();
    this.users.forEach((user) => {
      if (user.team && user.activeThisRound) counts[user.team] += 1;
    });
    return counts;
  }

  startRound(): void {
    this.users.forEach((user) => {
      user.activeThisRound = false;
    });
  }

  teamSnapshot(): TeamSnapshot {
    const snapshot: TeamSnapshot = {};
    this.users.forEach((user) => {
      if (user.team) snapshot[user.userId] = { team: user.team, likeRemainder: user.likeRemainder };
    });
    return snapshot;
  }

  restore(snapshot: TeamSnapshot): void {
    this.users.clear();
    Object.entries(snapshot).forEach(([userId, entry]) => {
      if (!TEAM_IDS.includes(entry.team)) return;
      this.users.set(userId, {
        userId,
        nickname: userId,
        team: entry.team,
        likeRemainder: entry.likeRemainder,
        activeThisRound: false,
        lastSeen: 0,
      });
    });
  }
}
