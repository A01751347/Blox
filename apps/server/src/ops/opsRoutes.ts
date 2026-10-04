import type { FastifyInstance } from 'fastify';
import type { GameRuntime } from '../runtime.js';
import { buildHealth } from './health.js';
import { renderMetrics } from './Metrics.js';

export function registerOpsRoutes(app: FastifyInstance, runtime: GameRuntime): void {
  app.get('/api/health', async (_request, reply) => {
    const health = buildHealth(runtime);
    return reply.code(health.ok ? 200 : 503).send(health);
  });
  app.get('/metrics', async (_request, reply) =>
    reply.type('text/plain; version=0.0.4').send(renderMetrics(runtime)),
  );
}
