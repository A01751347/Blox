import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { STATE_BROADCAST_INTERVAL_MS } from '@bloxdance/shared';
import type { ServerMessage } from '@bloxdance/shared';
import { createSampleState } from './sampleState.js';

export async function buildApp() {
  const app = Fastify();
  await app.register(websocket);

  app.get('/health', async () => ({ ok: true }));

  app.get('/ws', { websocket: true }, (socket) => {
    const timer = setInterval(() => {
      const message: ServerMessage = { type: 'state', state: createSampleState(Date.now()) };
      socket.send(JSON.stringify(message));
    }, STATE_BROADCAST_INTERVAL_MS);
    socket.on('close', () => clearInterval(timer));
  });

  return app;
}
