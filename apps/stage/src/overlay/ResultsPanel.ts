import { TEAM_COLORS, TEAM_LABELS } from '@bloxdance/shared';
import type { GameState } from '@bloxdance/shared';
import { createDiv } from './dom';

export class ResultsPanel {
  private readonly root: HTMLElement;
  private readonly winner: HTMLElement;
  private readonly donors: HTMLElement;
  private signature = '';

  constructor(parent: HTMLElement) {
    this.root = createDiv('results shadowed', parent);
    this.winner = createDiv('winner', this.root);
    this.donors = createDiv('donors', this.root);
  }

  update(state: GameState): void {
    const visible = state.phase === 'RESULTS' && state.winners.length > 0;
    this.root.style.display = visible ? 'block' : 'none';
    if (!visible) return;
    const signature = JSON.stringify([state.winners, state.topDonors]);
    if (signature === this.signature) return;
    this.signature = signature;
    const names = state.winners.map((team) => TEAM_LABELS[team]).join(' y ');
    this.winner.textContent = state.winners.length > 1 ? `¡Empate! ${names}` : `¡Ganó ${names}!`;
    this.winner.style.color = TEAM_COLORS[state.winners[0] ?? 'red'];
    const lines = state.topDonors.map(
      (donor, index) => `${index + 1}. ${donor.user} · ${donor.points} ⚡`,
    );
    this.donors.style.whiteSpace = 'pre-line';
    this.donors.textContent = lines.length > 0 ? `Top energía\n${lines.join('\n')}` : '';
  }
}
