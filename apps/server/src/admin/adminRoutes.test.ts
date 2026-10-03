import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

describe('admin routes', () => {
  const built = buildApp();
  afterAll(async () => (await built).app.close());

  const local = { remoteAddress: '127.0.0.1' };

  it('serves the panel only to localhost', async () => {
    const { app } = await built;
    expect((await app.inject({ method: 'GET', url: '/admin', ...local })).statusCode).toBe(200);
    expect(
      (await app.inject({ method: 'GET', url: '/admin', remoteAddress: '192.168.1.20' }))
        .statusCode,
    ).toBe(403);
    expect(
      (await app.inject({ method: 'GET', url: '/api/admin/status', remoteAddress: '8.8.8.8' }))
        .statusCode,
    ).toBe(403);
    expect(
      (await app.inject({ method: 'GET', url: '/health', remoteAddress: '8.8.8.8' })).statusCode,
    ).toBe(200);
  });

  it('reports connection state and the active source', async () => {
    const { app } = await built;
    const status = (await app.inject({ method: 'GET', url: '/api/admin/status', ...local })).json();
    expect(status.state.source).toBe('simulator');
    expect(status.tiktok.connected).toBe(false);
    expect(status.characters).toHaveLength(8);
  });

  it('drives the simulator and round controls', async () => {
    const { app, runtime } = await built;
    const post = (path: string, payload: object) =>
      app.inject({ method: 'POST', url: `/api/admin/${path}`, payload, ...local });
    await post('simulator', { action: 'gift', team: 'green', giftName: 'Galaxy' });
    expect(runtime.engine.getState().energy.green).toBe(10_000);
    await post('round', { action: 'skip' });
    expect(runtime.engine.getState().phase).toBe('ROUND');
    await post('round', { action: 'pause' });
    expect(runtime.engine.getState().paused).toBe(true);
    await post('round', { action: 'resume' });
    await post('round', { action: 'resetPoints' });
    expect(runtime.engine.getState().energy.green).toBe(0);
  });

  it('toggles the panic button and the brb screen', async () => {
    const { app, runtime } = await built;
    await app.inject({
      method: 'POST',
      url: '/api/admin/panic',
      payload: { enabled: true },
      ...local,
    });
    await app.inject({
      method: 'POST',
      url: '/api/admin/brb',
      payload: { enabled: true },
      ...local,
    });
    expect(runtime.engine.getState()).toMatchObject({ panic: true, brb: true });
  });

  it('blocks a viewer so the name never shows but points keep counting', async () => {
    const { app, runtime } = await built;
    runtime.engine.handle({ kind: 'chat', userId: 'v1', nickname: 'Luna', text: '2' });
    await app.inject({
      method: 'POST',
      url: '/api/admin/moderation',
      payload: { action: 'blockUser', value: 'v1' },
      ...local,
    });
    runtime.engine.handle({
      kind: 'gift',
      userId: 'v1',
      nickname: 'Luna',
      giftName: 'Rose',
      diamondCount: 7,
      repeatCount: 1,
      repeatEnd: true,
      streakable: false,
    });
    const donor = runtime.engine.getState().topDonors.find((entry) => entry.points === 70);
    expect(donor?.user).toBe('un fan');
  });

  it('applies roster and playlist overrides at the next round', async () => {
    const { app, runtime } = await built;
    await app.inject({
      method: 'POST',
      url: '/api/admin/roster',
      payload: { team: 'red', characterId: 'rex' },
      ...local,
    });
    await app.inject({
      method: 'POST',
      url: '/api/admin/track',
      payload: { trackId: 'rush_132' },
      ...local,
    });
    for (let step = 0; step < 5; step += 1) runtime.engine.skipPhase();
    const state = runtime.engine.getState();
    expect(state.roster.red).toBe('rex');
    expect(state.track.id).toBe('rush_132');
  });
});
