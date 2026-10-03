import type { FxEvent, GameState, TeamId } from '@bloxdance/shared';
import { AlertStack } from './AlertStack';
import { createDiv, setText } from './dom';
import { NameTags } from './NameTags';
import type { ScreenPoint } from './NameTags';
import { ResultsPanel } from './ResultsPanel';
import { TopBar } from './TopBar';

const INSTRUCTIONS = [
  'Comenta 1, 2, 3 o 4 para unirte a un equipo',
  'Likes y regalos dan energía a tu equipo',
  'Gana el equipo con más energía',
];
const INSTRUCTION_ROTATION_MS = 6000;

export class Overlay {
  private readonly topBar: TopBar;
  private readonly nameTags: NameTags;
  private readonly alerts: AlertStack;
  private readonly results: ResultsPanel;
  private readonly instruction: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    this.topBar = new TopBar(root);
    this.nameTags = new NameTags(root);
    this.results = new ResultsPanel(root);
    this.instruction = createDiv('instruction shadowed', root);
    this.alerts = new AlertStack(root);
    const brb = createDiv('brb', root);
    brb.textContent = 'Volvemos enseguida';
    createDiv('', brb).appendChild(document.createElement('small')).textContent =
      'No te vayas, ya casi';
  }

  pushFx(event: FxEvent): void {
    this.alerts.push(event);
  }

  update(state: GameState, heads: Record<TeamId, ScreenPoint>, nowMs: number): void {
    this.root.classList.toggle('panic', state.panic);
    this.root.classList.toggle('brb-on', state.brb);
    this.topBar.update(state, nowMs);
    this.nameTags.update(state, heads);
    this.results.update(state);
    this.alerts.update(state, nowMs);
    const index = Math.floor(nowMs / INSTRUCTION_ROTATION_MS) % INSTRUCTIONS.length;
    setText(this.instruction, INSTRUCTIONS[index] ?? '');
  }
}
