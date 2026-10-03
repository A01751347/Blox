import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('server app', () => {
  const built = buildApp();
  afterAll(async () => (await built).app.close());

  it('answers /health', async () => {
    const { app } = await built;
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
