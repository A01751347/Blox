import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { registerAdminRoutes } from './admin/adminRoutes.js';
import { GameRuntime } from './runtime.js';

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

  app.addHook('onClose', async () => runtime.stop());
  return { app, runtime };
}
