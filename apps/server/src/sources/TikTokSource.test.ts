import { describe, expect, it, vi } from 'vitest';
import type { InputEvent } from '../game/inputEvents.js';
import { BACKOFF_MAX_MS, backoffDelay, TikTokSource } from './TikTokSource.js';
import type { ConnectionLike } from './TikTokSource.js';
import { normalizeChat, normalizeGift, normalizeLike, safeStringify } from './tiktokNormalize.js';

class FakeConnection implements ConnectionLike {
  handlers = new Map<string, (payload: unknown) => void>();
  constructor(private readonly behaviour: () => Promise<unknown>) {}
  on(event: string, handler: (payload: unknown) => void): void {
    this.handlers.set(event, handler);
  }
  connect(): Promise<unknown> {
    return this.behaviour();
  }
  disconnect(): Promise<unknown> {
    return Promise.resolve();
  }
  fire(event: string, payload: unknown): void {
    this.handlers.get(event)?.(payload);
  }
}

const user = { userId: 77n, uniqueId: 'luna', nickname: 'Luna' };

describe('normalizers', () => {
  it('maps chat, likes and gifts into the internal format', () => {
    expect(normalizeChat({ user, comment: '3' })).toEqual({
      kind: 'chat',
      userId: '77',
      nickname: 'Luna',
      text: '3',
    });
    expect(normalizeLike({ user, likeCount: 5 })).toMatchObject({ kind: 'like', likeCount: 5 });
    expect(normalizeLike({ user, likeCount: 0 })).toBeNull();
  });

  it('flags streak gifts and only trusts repeatEnd for streakable gifts', () => {
    const streak = {
      user,
      repeatCount: 4,
      repeatEnd: 0,
      giftDetails: { giftName: 'Rose', diamondCount: 1, giftType: 1 },
    };
    expect(normalizeGift(streak)).toMatchObject({
      streakable: true,
      repeatEnd: false,
      repeatCount: 4,
      diamondCount: 1,
    });
    expect(normalizeGift({ ...streak, repeatEnd: 1 })).toMatchObject({ repeatEnd: true });
    const single = {
      user,
      repeatCount: 1,
      repeatEnd: 0,
      giftDetails: { giftName: 'Lion', diamondCount: 29999, giftType: 2 },
    };
    expect(normalizeGift(single)).toMatchObject({
      streakable: false,
      repeatEnd: true,
      diamondCount: 29999,
    });
  });

  it('ignores payloads without a user', () => {
    expect(normalizeChat({ comment: 'hola' })).toBeNull();
  });

  it('stringifies bigint safely and truncates', () => {
    expect(safeStringify({ id: 10n })).toBe('{"id":"10"}');
    expect(safeStringify({ text: 'x'.repeat(100) }, 20)).toHaveLength(20);
  });
});

describe('backoff', () => {
  it('doubles from 1 second up to one minute', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(backoffDelay)).toEqual([
      1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000,
    ]);
    expect(backoffDelay(50)).toBe(BACKOFF_MAX_MS);
  });
});

describe('TikTokSource', () => {
  it('forwards normalized events and stores raw payloads', async () => {
    const connection = new FakeConnection(() => Promise.resolve());
    const events: InputEvent[] = [];
    const raw: string[] = [];
    const source = new TikTokSource({
      username: 'host',
      createConnection: () => connection,
      onRaw: (type) => raw.push(type),
    });
    source.start((event) => events.push(event));
    await vi.waitFor(() => expect(source.status().connected).toBe(true));
    connection.fire('chat', { user, comment: '2' });
    expect(events).toEqual([{ kind: 'chat', userId: '77', nickname: 'Luna', text: '2' }]);
    expect(raw).toContain('chat');
  });

  it('retries with exponential backoff, reports after 3 failures and recovers', async () => {
    const delays: number[] = [];
    const callbacks: Array<() => void> = [];
    let attempts = 0;
    const statuses: string[] = [];
    const source = new TikTokSource({
      username: 'host',
      createConnection: () =>
        new FakeConnection(() =>
          ++attempts < 4 ? Promise.reject(new Error('offline')) : Promise.resolve(),
        ),
      schedule: (callback, delay) => {
        delays.push(delay);
        callbacks.push(callback);
        return callbacks.length;
      },
      cancel: () => undefined,
      onStatusChange: (status) => statuses.push(status.detail),
    });
    source.start(() => undefined);
    for (let round = 0; round < 3; round += 1) {
      await vi.waitFor(() => expect(callbacks.length).toBe(round + 1));
      if (round === 2) expect(source.status().detail).toContain('failed 3 times');
      callbacks[round]?.();
    }
    await vi.waitFor(() => expect(source.status().connected).toBe(true));
    expect(delays).toEqual([1000, 2000, 4000]);
    expect(source.failureCount()).toBe(0);
  });

  it('reconnects after an unexpected disconnect', async () => {
    const callbacks: Array<() => void> = [];
    const connections: FakeConnection[] = [];
    const source = new TikTokSource({
      username: 'host',
      createConnection: () => {
        const connection = new FakeConnection(() => Promise.resolve());
        connections.push(connection);
        return connection;
      },
      schedule: (callback) => callbacks.push(callback),
      cancel: () => undefined,
    });
    source.start(() => undefined);
    await vi.waitFor(() => expect(source.status().connected).toBe(true));
    connections[0]?.fire('disconnected', {});
    expect(source.status().connected).toBe(false);
    expect(callbacks).toHaveLength(1);
    callbacks[0]?.();
    await vi.waitFor(() => expect(source.status().connected).toBe(true));
    expect(connections).toHaveLength(2);
  });

  it('stops cleanly without scheduling retries', async () => {
    const callbacks: Array<() => void> = [];
    const source = new TikTokSource({
      username: 'host',
      createConnection: () => new FakeConnection(() => Promise.reject(new Error('x'))),
      schedule: (callback) => callbacks.push(callback),
      cancel: () => undefined,
    });
    source.start(() => undefined);
    source.stop();
    await Promise.resolve();
    expect(callbacks.length).toBeLessThanOrEqual(0);
    expect(source.status().detail).toBe('stopped');
  });
});
