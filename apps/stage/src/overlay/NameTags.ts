import { TEAM_COLORS, TEAM_IDS, TEAM_NUMBER } from '@bloxdance/shared';
import type { GameState, TeamId } from '@bloxdance/shared';
import { createDiv, setText } from './dom';

export interface ScreenPoint {
  x: number;
  y: number;
}

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export class NameTags {
  private readonly tags = new Map<TeamId, { root: HTMLElement; label: HTMLElement }>();

  constructor(parent: HTMLElement) {
    TEAM_IDS.forEach((team) => {
      const root = createDiv('name-tag', parent);
      const number = createDiv('number', root);
      number.style.background = TEAM_COLORS[team];
      number.textContent = String(TEAM_NUMBER[team]);
      this.tags.set(team, { root, label: createDiv('label', root) });
    });
  }

  update(state: GameState, heads: Record<TeamId, ScreenPoint>): void {
    TEAM_IDS.forEach((team) => {
      const tag = this.tags.get(team);
      if (!tag) return;
      tag.root.style.left = `${heads[team].x}px`;
      tag.root.style.top = `${heads[team].y}px`;
      setText(tag.label, capitalize(state.roster[team]));
    });
  }
}
