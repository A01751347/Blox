import { readFileSync } from 'node:fs';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PLAYLIST, ROSTER_ROTATION, TEAM_IDS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import type { GameRuntime } from '../runtime.js';
import { runSimulatorAction } from './simulatorActions.js';
import type { SimulatorAction } from './simulatorActions.js';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const RECENT_VIEWERS = 30;
const pageHtml = readFileSync(new URL('./page.html', import.meta.url), 'utf8');

export function isLoopback(address: string): boolean {
  return LOOPBACK.has(address);
}

type RoundAction = 'pause' | 'resume' | 'skip' | 'resetPoints';
type ModerationAction = 'blockUser' | 'unblockUser' | 'addWord' | 'removeWord';

export function buildStatus(runtime: GameRuntime) {
  const { engine, moderation, simulator, tiktok } = runtime;
  return {
    state: engine.getState(),
    simulator: { ...simulator.status(), storming: simulator.isStorming() },
    tiktok: { ...tiktok.status(), username: process.env.TIKTOK_USERNAME ?? null },
    moderation: moderation.lists(),
    viewers: engine.users.recent(RECENT_VIEWERS).map((user) => ({
      userId: user.userId,
      nickname: user.nickname,
      team: user.team,
      blocked: moderation.isBlocked(user.userId),
    })),
    characters: [...new Set(ROSTER_ROTATION.flatMap((roster) => Object.values(roster)))],
    rosterOverrides: engine.getRosterOverrides(),
    playlist: PLAYLIST.map((track) => ({ id: track.id, title: track.title, bpm: track.bpm })),
  };
}

export function registerAdminRoutes(app: FastifyInstance, runtime: GameRuntime): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply) => {
    const isAdmin = request.url.startsWith('/admin') || request.url.startsWith('/api/admin');
    if (isAdmin && !isLoopback(request.ip)) await reply.code(403).send({ error: 'localhost only' });
  });

  app.get('/admin', async (_request, reply) => reply.type('text/html').send(pageHtml));
  app.get('/api/admin/status', async () => buildStatus(runtime));

  app.post<{ Body: { action: RoundAction } }>('/api/admin/round', async (request) => {
    const { engine } = runtime;
    const actions: Record<RoundAction, () => void> = {
      pause: () => engine.pause(),
      resume: () => engine.resume(),
      skip: () => engine.skipPhase(),
      resetPoints: () => engine.resetPoints(),
    };
    actions[request.body.action]?.();
    return { ok: true };
  });

  app.post<{ Body: SimulatorAction }>('/api/admin/simulator', async (request) => {
    runSimulatorAction(runtime, request.body);
    return { ok: true };
  });

  app.post<{ Body: { enabled: boolean } }>('/api/admin/panic', async (request) => {
    runtime.engine.setPanic(Boolean(request.body.enabled));
    return { ok: true };
  });

  app.post<{ Body: { enabled: boolean } }>('/api/admin/brb', async (request) => {
    runtime.engine.setBrb(Boolean(request.body.enabled));
    return { ok: true };
  });

  app.post<{ Body: { team: TeamId; characterId: string | null } }>(
    '/api/admin/roster',
    async (request) => {
      const { team, characterId } = request.body;
      if (TEAM_IDS.includes(team)) runtime.engine.overrideRoster(team, characterId || null);
      return { ok: true };
    },
  );

  app.post<{ Body: { trackId: string | null } }>('/api/admin/track', async (request) => {
    runtime.engine.overrideTrack(request.body.trackId || null);
    return { ok: true };
  });

  app.post<{ Body: { action: ModerationAction; value: string } }>(
    '/api/admin/moderation',
    async (request) => {
      const { moderation } = runtime;
      const { action, value } = request.body;
      const actions: Record<ModerationAction, (input: string) => void> = {
        blockUser: (input) => moderation.blockUser(input),
        unblockUser: (input) => moderation.unblockUser(input),
        addWord: (input) => moderation.addWord(input),
        removeWord: (input) => moderation.removeWord(input),
      };
      actions[action]?.(value);
      return { ok: true };
    },
  );
}
