import { TEAM_IDS } from '@bloxdance/shared';
import type { GameRuntime } from '../runtime.js';

function line(name: string, value: number, labels?: Record<string, string>): string {
  const rendered = labels
    ? `{${Object.entries(labels)
        .map(([key, label]) => `${key}="${label}"`)
        .join(',')}}`
    : '';
  return `${name}${rendered} ${value}`;
}

export function renderMetrics(runtime: GameRuntime): string {
  const state = runtime.engine.getState();
  const tiktok = runtime.tiktokInfo();
  const lines = [
    line('bloxdance_up', 1),
    line('bloxdance_uptime_seconds', runtime.uptimeSeconds()),
    line('bloxdance_round_number', state.roundNumber),
    line('bloxdance_phase', 1, { phase: state.phase }),
    line('bloxdance_ws_clients', runtime.hub.size),
    line('bloxdance_tiktok_connected', tiktok.connected ? 1 : 0),
    line('bloxdance_source_tiktok', state.source === 'tiktok' ? 1 : 0),
    line('bloxdance_last_tick_age_seconds', runtime.tickAgeMs() / 1000),
    line('bloxdance_paused', state.paused ? 1 : 0),
    line('bloxdance_panic', state.panic ? 1 : 0),
    ...TEAM_IDS.map((team) => line('bloxdance_energy', state.energy[team], { team })),
    ...TEAM_IDS.map((team) => line('bloxdance_members', state.members[team], { team })),
    ...runtime
      .ingestCounts()
      .map(({ source, kind, count }) => line('bloxdance_events_total', count, { source, kind })),
  ];
  return `${lines.join('\n')}\n`;
}
