import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { parseConfig } from './config.js';
import { GameRuntime } from './runtime.js';
import { createLiveConnection } from './sources/tiktokConnection.js';

const config = parseConfig(process.env);
mkdirSync(dirname(config.dbPath), { recursive: true });

const { app, runtime } = await buildApp(
  new GameRuntime({
    dbPath: config.dbPath,
    createConnection: createLiveConnection,
    maintenance: {
      backupDir: config.backupDir,
      backupsToKeep: config.backupsToKeep,
      rawRetentionDays: config.rawRetentionDays,
    },
  }),
  { adminToken: config.adminToken, logLevel: config.logLevel, trustProxy: config.trustProxy },
);
runtime.start();
await app.listen({ port: config.port, host: '0.0.0.0' });

if (config.tiktokUsername) runtime.connectTikTok(config.tiktokUsername);
if (!config.adminToken)
  app.log.warn('ADMIN_TOKEN not set: /admin is only reachable from localhost');

process.on('unhandledRejection', (reason) => app.log.error({ reason }, 'unhandled rejection'));
process.on('uncaughtException', (error) => app.log.error({ error }, 'uncaught exception'));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => void app.close().then(() => process.exit(0)));
}
