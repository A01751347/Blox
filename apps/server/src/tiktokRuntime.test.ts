import { describe, expect, it, vi } from 'vitest';
import type { ServerMessage } from '@bloxdance/shared';
import { GameRuntime } from './runtime.js';
import type { ConnectionLike } from './sources/TikTokSource.js';

class FakeConnection implements ConnectionLike {
  handlers = new Map<string, (payload: unknown) => void>();
  constructor(private readonly failing: boolean) {}
  on(event: string, handler: (payload: unknown) => void): void {
    this.handlers.set(event, handler);
  }
  connect(): Promise<unknown> {
    return this.failing ? Promise.reject(new Error('offline')) : Promise.resolve();
  }
  disconnect(): Promise<unknown> {
    return Promise.resolve();
  }
}

describe('TikTok integration in the runtime', () => {
  it('moves the team bar within one broadcast tick after a real gift and stores raw events', async () => {
    const clock = { now: 1_700_000_000_000 };
    const connections: FakeConnection[] = [];
    const runtime = new GameRuntime({
      now: () => clock.now,
      createConnection: () => {
        const connection = new FakeConnection(false);
        connections.push(connection);
        return connection;
      },
    });
    const messages: ServerMessage[] = [];
    runtime.hub.add({ send: (data) => messages.push(JSON.parse(data) as ServerMessage) });

    runtime.connectTikTok('host');
    await vi.waitFor(() => expect(runtime.engine.getState().source).toBe('tiktok'));

    const user = { userId: '9', uniqueId: 'fan', nickname: 'Fan' };
    connections[0]?.handlers.get('chat')?.({ user, comment: '2' });
    const sentAt = clock.now;
    connections[0]?.handlers.get('gift')?.({
      user,
      repeatCount: 1,
      repeatEnd: 1,
      giftDetails: { giftName: 'Rose', diamondCount: 10, giftType: 2 },
    });
    clock.now += 100;
    runtime.tick();

    const last = [...messages].reverse().find((message) => message.type === 'state');
    expect(last?.type === 'state' && last.state.energy.blue).toBe(100);
    expect(clock.now - sentAt).toBeLessThan(1000);
    const raw = runtime.database.raw.prepare('SELECT COUNT(*) AS count FROM raw_events').get() as {
      count: number;
    };
    expect(raw.count).toBe(2);
    runtime.stop();
  });

  it('falls back to the simulator and reports after 3 failures', async () => {
    vi.useFakeTimers();
    const runtime = new GameRuntime({ createConnection: () => new FakeConnection(true) });
    runtime.connectTikTok('host');
    await vi.advanceTimersByTimeAsync(10_000);
    const info = runtime.tiktokInfo();
    expect(info.connected).toBe(false);
    expect(info.detail).toContain('failed');
    expect(runtime.engine.getState().source).toBe('simulator');
    runtime.stop();
    vi.useRealTimers();
  });
});
