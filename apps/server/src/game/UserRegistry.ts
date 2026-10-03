import { TEAM_IDS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';

export type TeamSnapshot = Record<string, { team: TeamId; likeRemainder: number }>;

export interface UserRecord {
  userId: string;
  nickname: string;
  team: TeamId | null;
  likeRemainder: number;
  activeThisRound: boolean;
}

function emptyCounts(): Record<TeamId, number> {
  return { red: 0, blue: 0, green: 0, yellow: 0 };
}

export class UserRegistry {
  private readonly users = new Map<string, UserRecord>();

  touch(userId: string, nickname: string): UserRecord {
    const existing = this.users.get(userId);
    if (existing) {
      existing.nickname = nickname;
      existing.activeThisRound = true;
      return existing;
    }
    const created: UserRecord = {
      userId,
      nickname,
      team: null,
      likeRemainder: 0,
      activeThisRound: true,
    };
    this.users.set(userId, created);
    return created;
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
      });
    });
  }
}
