import { TEAM_COLORS, TEAM_IDS, TEAM_NUMBER } from '@bloxdance/shared';
import type { GameState, TeamId } from '@bloxdance/shared';
import { createDiv, setText } from './dom';
import { energyBarFill, formatClock } from './formatClock';

const PHASE_LABELS: Record<GameState['phase'], string> = {
  LOBBY: 'Elige tu equipo',
  ROUND: 'En vivo',
  FINAL_30: '¡Últimos 30!',
  RESULTS: 'Resultados',
  COOLDOWN: 'Siguiente roster',
};

interface BarRefs {
  fill: HTMLElement;
  level: HTMLElement;
}

export class TopBar {
  private readonly round: HTMLElement;
  private readonly timer: HTMLElement;
  private readonly phase: HTMLElement;
  private readonly bars = new Map<TeamId, BarRefs>();

  constructor(parent: HTMLElement) {
    const root = createDiv('topbar shadowed', parent);
    const head = createDiv('topbar-head', root);
    this.round = createDiv('topbar-round', head);
    this.timer = createDiv('topbar-timer', head);
    this.phase = createDiv('topbar-phase', head);
    TEAM_IDS.forEach((team) => {
      const row = createDiv('energy-row', root);
      const badge = createDiv('team-badge', row);
      badge.style.background = TEAM_COLORS[team];
      badge.textContent = String(TEAM_NUMBER[team]);
      const track = createDiv('energy-track', row);
      const fill = createDiv('energy-fill', track);
      fill.style.background = TEAM_COLORS[team];
      this.bars.set(team, { fill, level: createDiv('energy-level', row) });
    });
  }

  update(state: GameState, nowMs: number): void {
    setText(this.round, `RONDA ${state.roundNumber}`);
    setText(this.timer, formatClock(state.phaseEndsAt - nowMs));
    setText(this.phase, state.paused ? 'En pausa' : PHASE_LABELS[state.phase]);
    this.phase.classList.toggle('final', state.phase === 'FINAL_30');
    const top = Math.max(...TEAM_IDS.map((team) => state.energy[team]));
    TEAM_IDS.forEach((team) => {
      const refs = this.bars.get(team);
      if (!refs) return;
      refs.fill.style.width = `${energyBarFill(state.energy[team], top) * 100}%`;
      setText(refs.level, `Nv ${state.level[team]}`);
    });
  }
}
