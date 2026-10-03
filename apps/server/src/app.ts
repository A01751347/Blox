import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import { registerAdminRoutes } from './admin/adminRoutes.js';
import { GameRuntime } from './runtime.js';

const DEFAULT_STAGE_DIST = fileURLToPath(new URL('../../stage/dist', import.meta.url));

export async function buildApp(runtime: GameRuntime = new GameRuntime()) {
  const app = Fastify();
  await app.register(websocket);

  registerAdminRoutes(app, runtime);
  app.get('/health', async () => ({ ok: true }));

  app.get('/ws', { websocket: true }, (socket) => {
    runtime.hub.add(socket);
    socket.send(JSON.stringify({ type: 'state', state: runtime.engine.getState() }));
    socket.on('close', () => runtime.hub.remove(socket));
  });

  const stageDist = process.env.STAGE_DIST ?? DEFAULT_STAGE_DIST;
  if (existsSync(stageDist)) await app.register(fastifyStatic, { root: stageDist });

  app.addHook('onClose', async () => runtime.stop());
  return { app, runtime };
}
