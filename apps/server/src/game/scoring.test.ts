import { describe, expect, it } from 'vitest';
import {
  accumulateLikes,
  countedDiamonds,
  isBigGift,
  leastPopulatedTeam,
  parseTeamComment,
  pickWinners,
  pointsForDiamonds,
} from './scoring.js';

const gift = (overrides: Partial<Parameters<typeof countedDiamonds>[0]> = {}) => ({
  kind: 'gift' as const,
  userId: 'u',
  nickname: 'n',
  giftName: 'Rose',
  diamondCount: 5,
  repeatCount: 1,
  repeatEnd: false,
  streakable: true,
  ...overrides,
});

describe('gift streaks', () => {
  it('ignores streak events until repeatEnd and then counts diamondCount x repeatCount', () => {
    expect(countedDiamonds(gift({ repeatCount: 3, repeatEnd: false }))).toBeNull();
    expect(countedDiamonds(gift({ repeatCount: 4, repeatEnd: true }))).toBe(20);
  });

  it('counts non streakable gifts immediately', () => {
    expect(countedDiamonds(gift({ streakable: false, diamondCount: 1000 }))).toBe(1000);
  });

  it('turns diamonds into 10 points each and flags 100+ as big', () => {
    expect(pointsForDiamonds(7)).toBe(70);
    expect(isBigGift(99)).toBe(false);
    expect(isBigGift(100)).toBe(true);
  });
});

describe('likes', () => {
  it('gives 1 point per 10 likes accumulated per user', () => {
    expect(accumulateLikes(0, 7)).toEqual({ points: 0, remainder: 7 });
    expect(accumulateLikes(7, 8)).toEqual({ points: 1, remainder: 5 });
    expect(accumulateLikes(5, 25)).toEqual({ points: 3, remainder: 0 });
  });
});

describe('teams', () => {
  it('parses only exact 1 to 4 comments', () => {
    expect(parseTeamComment('1')).toBe('red');
    expect(parseTeamComment(' 4 ')).toBe('yellow');
    expect(parseTeamComment('5')).toBeNull();
    expect(parseTeamComment('quiero el 2')).toBeNull();
  });

  it('assigns unteamed users to the least populated team', () => {
    expect(leastPopulatedTeam({ red: 3, blue: 1, green: 2, yellow: 1 })).toBe('blue');
  });

  it('picks the highest energy, then most active members, then declares a shared win', () => {
    const none = { red: 0, blue: 0, green: 0, yellow: 0 };
    expect(pickWinners({ ...none, green: 50 }, none)).toEqual(['green']);
    expect(
      pickWinners({ red: 80, blue: 80, green: 10, yellow: 0 }, { ...none, blue: 3, red: 2 }),
    ).toEqual(['blue']);
    expect(
      pickWinners({ red: 80, blue: 80, green: 10, yellow: 0 }, { ...none, blue: 2, red: 2 }),
    ).toEqual(['red', 'blue']);
  });
});
