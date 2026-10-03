import type { EnergyLevel, TeamId } from './types.js';

export const TEAM_IDS: readonly TeamId[] = ['red', 'blue', 'green', 'yellow'];

export const TEAM_NUMBER: Record<TeamId, number> = { red: 1, blue: 2, green: 3, yellow: 4 };

export const TEAM_BY_NUMBER: Record<string, TeamId> = {
  '1': 'red',
  '2': 'blue',
  '3': 'green',
  '4': 'yellow',
};

export const TEAM_COLORS: Record<TeamId, string> = {
  red: '#e5383b',
  blue: '#3a86ff',
  green: '#2dc653',
  yellow: '#ffbe0b',
};

export const LEVEL_THRESHOLDS: readonly [number, number, number] = [100, 500, 2000];

export function levelForEnergy(energy: number): EnergyLevel {
  if (energy >= LEVEL_THRESHOLDS[2]) return 3;
  if (energy >= LEVEL_THRESHOLDS[1]) return 2;
  if (energy >= LEVEL_THRESHOLDS[0]) return 1;
  return 0;
}

export const PHASE_SECONDS = {
  LOBBY: 15,
  ROUND: 150,
  FINAL_30: 30,
  RESULTS: 15,
  COOLDOWN: 10,
} as const;

export const STATE_BROADCAST_INTERVAL_MS = 100;
export const BIG_GIFT_DIAMONDS = 100;
export const POINTS_PER_DIAMOND = 10;
export const LIKES_PER_POINT = 10;
export const MAX_NAME_LENGTH = 16;
export const STAGE_WIDTH = 1080;
export const STAGE_HEIGHT = 1920;
