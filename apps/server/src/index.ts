import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { GameRuntime } from './runtime.js';

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? 'data/bloxdance.sqlite';
mkdirSync(dirname(dbPath), { recursive: true });

const { app, runtime } = await buildApp(new GameRuntime({ dbPath }));
runtime.start();
await app.listen({ port, host: '0.0.0.0' });
