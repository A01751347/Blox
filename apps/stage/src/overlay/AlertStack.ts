import { TEAM_COLORS } from '@bloxdance/shared';
import type { FxEvent, GameState } from '@bloxdance/shared';
import { AlertScheduler } from './AlertScheduler';
import type { AlertItem } from './AlertScheduler';
import { createDiv } from './dom';

export class AlertStack {
  private readonly scheduler = new AlertScheduler();
  private readonly root: HTMLElement;
  private shownIds: number[] = [];

  constructor(parent: HTMLElement) {
    this.root = createDiv('alert-stack', parent);
  }

  push(event: FxEvent): void {
    if (event.kind === 'gift') {
      this.scheduler.push(
        `${event.user} · ${event.giftName} +${event.points} ⚡`,
        TEAM_COLORS[event.team],
      );
    } else if (event.kind === 'hint') {
      this.scheduler.push(`${event.user}: comenta 1, 2, 3 o 4 para elegir equipo`, '#ffffff');
    }
  }

  update(state: GameState, nowMs: number): void {
    if (state.panic) {
      this.scheduler.clear();
      this.render([]);
      return;
    }
    this.render(this.scheduler.update(nowMs));
  }

  private render(items: AlertItem[]): void {
    const ids = items.map((item) => item.id);
    if (ids.join() === this.shownIds.join()) return;
    this.shownIds = ids;
    this.root.replaceChildren(
      ...items.map((item) => {
        const element = createDiv('alert');
        element.style.setProperty('--alert-color', item.color);
        element.textContent = item.text;
        return element;
      }),
    );
  }
}
