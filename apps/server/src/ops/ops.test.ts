import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { decideAdminAccess, tokenFromAuthorization } from '../admin/adminAuth.js';
import { buildApp } from '../app.js';
import { parseConfig } from '../config.js';
import { GameRuntime } from '../runtime.js';
import { backupFileName, backupsToDelete } from './Maintenance.js';

describe('admin access decisions', () => {
  const basic = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

  it('always allows loopback', () => {
    expect(decideAdminAccess('127.0.0.1', undefined, undefined)).toBe('allow');
    expect(decideAdminAccess('::1', undefined, 'secret')).toBe('allow');
  });

  it('refuses remote clients when no token is configured', () => {
    expect(decideAdminAccess('192.168.1.10', basic, undefined)).toBe('forbidden');
  });

  it('accepts a matching Basic or Bearer token and challenges everything else', () => {
    expect(decideAdminAccess('192.168.1.10', basic, 'secret')).toBe('allow');
    expect(decideAdminAccess('192.168.1.10', 'Bearer secret', 'secret')).toBe('allow');
    expect(decideAdminAccess('192.168.1.10', 'Bearer nope', 'secret')).toBe('challenge');
    expect(decideAdminAccess('192.168.1.10', undefined, 'secret')).toBe('challenge');
    expect(tokenFromAuthorization('Digest abc')).toBeNull();
  });
});

describe('config', () => {
  it('uses safe defaults', () => {
    const config = parseConfig({});
    expect(config).toMatchObject({
      port: 3000,
      backupsToKeep: 7,
      rawRetentionDays: 7,
      trustProxy: false,
    });
    expect(config.backupDir).toBe(join('data', 'backups'));
    expect(config.adminToken).toBeUndefined();
  });

  it('reads and sanitizes environment values', () => {
    const config = parseConfig({
      PORT: '8080',
      DB_PATH: '/srv/blox/db.sqlite',
      TIKTOK_USERNAME: ' @MiLive ',
      ADMIN_TOKEN: 's3cret',
      TRUST_PROXY: 'true',
      BACKUPS_TO_KEEP: 'abc',
    });
    expect(config).toMatchObject({
      port: 8080,
      tiktokUsername: 'MiLive',
      adminToken: 's3cret',
      trustProxy: true,
      backupsToKeep: 7,
      backupDir: '/srv/blox/backups',
    });
  });
});

describe('backup rotation', () => {
  it('names backups by day and deletes the oldest beyond the limit', () => {
    expect(backupFileName(Date.UTC(2026, 9, 4))).toBe('bloxdance-2026-10-04.sqlite');
    const files = [
      'bloxdance-2026-10-01.sqlite',
      'bloxdance-2026-10-03.sqlite',
      'bloxdance-2026-10-02.sqlite',
      'notes.txt',
    ];
    expect(backupsToDelete(files, 2)).toEqual(['bloxdance-2026-10-01.sqlite']);
  });
});

describe('runtime operations', () => {
  const clock = { now: Date.UTC(2026, 9, 4) };
  const directory = mkdtempSync(join(tmpdir(), 'blox-backup-'));
  const runtime = new GameRuntime({
    now: () => clock.now,
    maintenance: { backupDir: directory, backupsToKeep: 2, rawRetentionDays: 7 },
  });
  const builtPromise = buildApp(runtime, { adminToken: 'secret' });
  afterAll(async () => (await builtPromise).app.close());

  it('prunes old raw events and keeps recent ones', async () => {
    runtime.database.recordRaw(clock.now - 10 * 86_400_000, 'tiktok', 'chat', {});
    runtime.database.recordRaw(clock.now - 1000, 'tiktok', 'chat', {});
    await runtime.runMaintenance();
    const row = runtime.database.raw.prepare('SELECT COUNT(*) AS count FROM raw_events').get() as {
      count: number;
    };
    expect(row.count).toBe(1);
  });

  it('writes one backup per day and rotates them', async () => {
    writeFileSync(join(directory, 'bloxdance-2026-01-01.sqlite'), 'old');
    writeFileSync(join(directory, 'bloxdance-2026-01-02.sqlite'), 'old');
    await runtime.runMaintenance();
    expect(readdirSync(directory).sort()).toEqual([
      'bloxdance-2026-01-02.sqlite',
      'bloxdance-2026-10-04.sqlite',
    ]);
  });

  it('reports health and turns 503 when the loop stalls', async () => {
    const { app } = await builtPromise;
    runtime.tick();
    expect((await app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(200);
    clock.now += 10_000;
    const stalled = await app.inject({ method: 'GET', url: '/api/health' });
    expect(stalled.statusCode).toBe(503);
    expect(stalled.json().ok).toBe(false);
  });

  it('exposes Prometheus metrics with event counters', async () => {
    const { app } = await builtPromise;
    runtime.ingest('tiktok', { kind: 'chat', userId: 'a', nickname: 'a', text: '1' });
    const body = (await app.inject({ method: 'GET', url: '/metrics' })).body;
    expect(body).toContain('bloxdance_up 1');
    expect(body).toContain('bloxdance_events_total{source="tiktok",kind="chat"} 1');
    expect(body).toContain('bloxdance_energy{team="red"}');
  });

  it('protects /admin with the token for remote clients', async () => {
    const { app } = await builtPromise;
    const remote = { remoteAddress: '192.168.1.50' };
    const denied = await app.inject({ method: 'GET', url: '/api/admin/status', ...remote });
    expect(denied.statusCode).toBe(401);
    expect(denied.headers['www-authenticate']).toContain('Basic');
    const allowed = await app.inject({
      method: 'GET',
      url: '/api/admin/status',
      headers: { authorization: `Bearer secret` },
      ...remote,
    });
    expect(allowed.statusCode).toBe(200);
  });
});
