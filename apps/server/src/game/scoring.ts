import {
  BIG_GIFT_DIAMONDS,
  LIKES_PER_POINT,
  POINTS_PER_DIAMOND,
  TEAM_BY_NUMBER,
  TEAM_IDS,
} from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import type { InputEvent } from './inputEvents.js';

type GiftEvent = Extract<InputEvent, { kind: 'gift' }>;

export function countedDiamonds(gift: GiftEvent): number | null {
  if (gift.streakable && !gift.repeatEnd) return null;
  return gift.diamondCount * Math.max(1, gift.repeatCount);
}

export function pointsForDiamonds(diamonds: number): number {
  return diamonds * POINTS_PER_DIAMOND;
}

export function isBigGift(diamonds: number): boolean {
  return diamonds >= BIG_GIFT_DIAMONDS;
}

export function accumulateLikes(
  remainder: number,
  likeCount: number,
): { points: number; remainder: number } {
  const total = remainder + Math.max(0, likeCount);
  return { points: Math.floor(total / LIKES_PER_POINT), remainder: total % LIKES_PER_POINT };
}

export function parseTeamComment(text: string): TeamId | null {
  return TEAM_BY_NUMBER[text.trim()] ?? null;
}

export function leastPopulatedTeam(members: Record<TeamId, number>): TeamId {
  return TEAM_IDS.reduce(
    (best, team) => (members[team] < members[best] ? team : best),
    TEAM_IDS[0] as TeamId,
  );
}

export function pickWinners(
  energy: Record<TeamId, number>,
  activeMembers: Record<TeamId, number>,
): TeamId[] {
  const top = Math.max(...TEAM_IDS.map((team) => energy[team]));
  const leaders = TEAM_IDS.filter((team) => energy[team] === top);
  if (leaders.length === 1) return leaders;
  const mostActive = Math.max(...leaders.map((team) => activeMembers[team]));
  return leaders.filter((team) => activeMembers[team] === mostActive);
}
