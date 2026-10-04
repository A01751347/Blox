import type { GameRuntime } from '../runtime.js';

export const MAX_TICK_AGE_MS = 5000;

export function buildHealth(runtime: GameRuntime) {
  const state = runtime.engine.getState();
  const tickAgeMs = runtime.tickAgeMs();
  return {
    ok: tickAgeMs < MAX_TICK_AGE_MS,
    uptimeSeconds: runtime.uptimeSeconds(),
    tickAgeMs,
    phase: state.phase,
    roundNumber: state.roundNumber,
    source: state.source,
    tiktokConnected: runtime.tiktokInfo().connected,
    stageClients: runtime.hub.size,
  };
}
