import type { TeamId } from '@bloxdance/shared';

export interface DonorRecord {
  userId: string;
  nickname: string;
  team: TeamId;
  points: number;
}

export function zeroByTeam(): Record<TeamId, number> {
  return { red: 0, blue: 0, green: 0, yellow: 0 };
}

export class ScoreBoard {
  energy = zeroByTeam();
  private readonly donors = new Map<string, DonorRecord>();

  addEnergy(team: TeamId, points: number): void {
    this.energy[team] += points;
  }

  addDonation(userId: string, nickname: string, team: TeamId, points: number): void {
    const donor = this.donors.get(userId) ?? { userId, nickname, team, points: 0 };
    donor.team = team;
    donor.nickname = nickname;
    donor.points += points;
    this.donors.set(userId, donor);
  }

  top(count: number, onlyTeams?: TeamId[]): DonorRecord[] {
    return [...this.donors.values()]
      .filter((donor) => !onlyTeams || onlyTeams.includes(donor.team))
      .sort((a, b) => b.points - a.points)
      .slice(0, count);
  }

  reset(): void {
    this.energy = zeroByTeam();
    this.donors.clear();
  }
}
