import { describe, expect, it } from 'vitest';
import { PHASE_SECONDS } from '@bloxdance/shared';
import type { FxEvent } from '@bloxdance/shared';
import { GameEngine } from './GameEngine.js';
import type { InputEvent } from './inputEvents.js';

function setup() {
  const clock = { now: 1_000_000 };
  const engine = new GameEngine({ now: () => clock.now });
  const fx: FxEvent[] = [];
  engine.onFx((event) => fx.push(event));
  const advance = (seconds: number) => {
    clock.now += seconds * 1000;
    engine.tick();
  };
  return { engine, fx, advance, clock };
}

const chat = (userId: string, text: string): InputEvent => ({
  kind: 'chat',
  userId,
  nickname: userId,
  text,
});
const gift = (
  userId: string,
  diamonds: number,
  extra: Partial<Extract<InputEvent, { kind: 'gift' }>> = {},
): InputEvent => ({
  kind: 'gift',
  userId,
  nickname: userId,
  giftName: 'Rose',
  diamondCount: diamonds,
  repeatCount: 1,
  repeatEnd: true,
  streakable: false,
  ...extra,
});

describe('round state machine', () => {
  it('walks LOBBY -> ROUND -> FINAL_30 -> RESULTS -> COOLDOWN -> LOBBY with the plan durations', () => {
    const { engine, advance } = setup();
    expect(engine.getState().phase).toBe('LOBBY');
    advance(PHASE_SECONDS.LOBBY);
    expect(engine.getState().phase).toBe('ROUND');
    advance(PHASE_SECONDS.ROUND);
    expect(engine.getState().phase).toBe('FINAL_30');
    advance(PHASE_SECONDS.FINAL_30);
    expect(engine.getState().phase).toBe('RESULTS');
    advance(PHASE_SECONDS.RESULTS);
    expect(engine.getState().phase).toBe('COOLDOWN');
    advance(PHASE_SECONDS.COOLDOWN);
    const state = engine.getState();
    expect(state.phase).toBe('LOBBY');
    expect(state.roundNumber).toBe(2);
  });

  it('keeps the 3 minute round: ROUND plus FINAL_30 equal 180 seconds', () => {
    expect(PHASE_SECONDS.ROUND + PHASE_SECONDS.FINAL_30).toBe(180);
  });

  it('rotates the 8 characters across two rounds and resets energy', () => {
    const { engine, advance } = setup();
    const first = engine.getState().roster;
    engine.handle(chat('a', '1'));
    engine.handle(gift('a', 10));
    expect(engine.getState().energy.red).toBe(100);
    advance(221);
    const second = engine.getState();
    expect(second.roster).not.toEqual(first);
    expect(Object.values(second.roster).concat(Object.values(first)).sort()).toEqual([
      'bloop',
      'chispa',
      'mochi',
      'nova',
      'pixel',
      'rex',
      'taco',
      'turbo',
    ]);
    expect(second.energy.red).toBe(0);
  });

  it('does not drift when ticks arrive late', () => {
    const { engine, advance } = setup();
    advance(PHASE_SECONDS.LOBBY + 5);
    const state = engine.getState();
    expect(state.phase).toBe('ROUND');
    expect(state.phaseEndsAt - 1_000_000).toBe((PHASE_SECONDS.LOBBY + PHASE_SECONDS.ROUND) * 1000);
  });

  it('supports pause, resume and skip', () => {
    const { engine, advance, clock } = setup();
    const endsAt = engine.getState().phaseEndsAt;
    engine.pause();
    advance(100);
    expect(engine.getState().phase).toBe('LOBBY');
    expect(engine.getState().paused).toBe(true);
    engine.resume();
    expect(engine.getState().phaseEndsAt).toBe(endsAt + 100_000);
    engine.skipPhase();
    expect(engine.getState().phase).toBe('ROUND');
    expect(engine.getState().phaseEndsAt).toBe(clock.now + PHASE_SECONDS.ROUND * 1000);
  });
});

describe('scoring', () => {
  it('assigns a team from a 1-4 comment, remembers it and allows changing', () => {
    const { engine, fx } = setup();
    engine.handle(chat('a', '3'));
    expect(engine.getState().members.green).toBe(1);
    engine.handle(chat('a', '3'));
    expect(fx.filter((event) => event.kind === 'join')).toHaveLength(1);
    engine.handle(chat('a', '2'));
    expect(engine.getState().members).toEqual({ red: 0, blue: 1, green: 0, yellow: 0 });
  });

  it('adds diamonds x 10 to the donor team and marks 100+ diamonds as big', () => {
    const { engine, fx } = setup();
    engine.handle(chat('a', '4'));
    engine.handle(gift('a', 150));
    expect(engine.getState().energy.yellow).toBe(1500);
    expect(engine.getState().level.yellow).toBe(2);
    const event = fx.find((candidate) => candidate.kind === 'gift');
    expect(event && event.kind === 'gift' && event.big).toBe(true);
  });

  it('only counts streak gifts at repeatEnd', () => {
    const { engine } = setup();
    engine.handle(chat('a', '1'));
    const streak = { streakable: true, diamondCount: 5 };
    engine.handle(gift('a', 5, { ...streak, repeatCount: 1, repeatEnd: false }));
    engine.handle(gift('a', 5, { ...streak, repeatCount: 2, repeatEnd: false }));
    expect(engine.getState().energy.red).toBe(0);
    engine.handle(gift('a', 5, { ...streak, repeatCount: 3, repeatEnd: true }));
    expect(engine.getState().energy.red).toBe(150);
  });

  it('puts unteamed donors on the least populated team and shows a hint', () => {
    const { engine, fx } = setup();
    engine.handle(chat('x', '1'));
    engine.handle(chat('y', '1'));
    engine.handle(chat('z', '2'));
    engine.handle(gift('w', 1));
    expect(engine.getState().members.green).toBe(1);
    expect(fx.some((event) => event.kind === 'hint')).toBe(true);
  });

  it('gives one point per ten likes per user', () => {
    const { engine } = setup();
    engine.handle(chat('a', '1'));
    for (let index = 0; index < 5; index += 1) {
      engine.handle({ kind: 'like', userId: 'a', nickname: 'a', likeCount: 4 });
    }
    expect(engine.getState().energy.red).toBe(2);
  });

  it('ignores points outside the scoring phases', () => {
    const { engine, advance } = setup();
    engine.handle(chat('a', '1'));
    advance(PHASE_SECONDS.LOBBY + PHASE_SECONDS.ROUND + PHASE_SECONDS.FINAL_30);
    expect(engine.getState().phase).toBe('RESULTS');
    engine.handle(gift('a', 100));
    expect(engine.getState().energy.red).toBe(0);
  });

  it('crowns the highest energy at RESULTS and lists the top 3 donors of the winner', () => {
    const { engine, advance } = setup();
    ['1', '2'].forEach((team, index) => engine.handle(chat(`u${index}`, team)));
    advance(PHASE_SECONDS.LOBBY);
    ['d1', 'd2', 'd3', 'd4'].forEach((id) => engine.handle(chat(id, '2')));
    engine.handle(gift('d1', 10));
    engine.handle(gift('d2', 30));
    engine.handle(gift('d3', 20));
    engine.handle(gift('d4', 5));
    engine.handle(gift('u0', 1));
    advance(PHASE_SECONDS.ROUND + PHASE_SECONDS.FINAL_30);
    const state = engine.getState();
    expect(state.phase).toBe('RESULTS');
    expect(state.winners).toEqual(['blue']);
    expect(state.topDonors.map((donor) => donor.user)).toEqual(['d2', 'd3', 'd1']);
  });

  it('shares the win on a full tie', () => {
    const { engine, advance } = setup();
    engine.handle(chat('a', '1'));
    engine.handle(chat('b', '2'));
    advance(PHASE_SECONDS.LOBBY);
    engine.handle(gift('a', 5));
    engine.handle(gift('b', 5));
    advance(PHASE_SECONDS.ROUND + PHASE_SECONDS.FINAL_30);
    expect(engine.getState().winners).toEqual(['red', 'blue']);
  });

  it('uses the display name filter for fx and donors', () => {
    const clock = { now: 0 };
    const engine = new GameEngine({ now: () => clock.now, toDisplayName: () => 'un fan' });
    const fx: FxEvent[] = [];
    engine.onFx((event) => fx.push(event));
    engine.handle(chat('a', '1'));
    engine.handle(gift('a', 1));
    expect(fx.every((event) => !('user' in event) || event.user === 'un fan')).toBe(true);
    expect(engine.getState().topDonors[0]?.user).toBe('un fan');
  });
});
