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
const PHASE_FLASH: Record<GameState['phase'], string> = {
  LOBBY: '#7dd3fc',
  ROUND: '#fde047',
  FINAL_30: '#fb7185',
  RESULTS: '#fbbf24',
  COOLDOWN: '#c4b5fd',
};

export class Overlay {
  private readonly topBar: TopBar;
  private readonly nameTags: NameTags;
  private readonly alerts: AlertStack;
  private readonly results: ResultsPanel;
  private readonly instruction: HTMLElement;
  private readonly flash: HTMLElement;
  private lastPhase: GameState['phase'] | null = null;

  constructor(private readonly root: HTMLElement) {
    this.topBar = new TopBar(root);
    this.nameTags = new NameTags(root);
    this.results = new ResultsPanel(root);
    this.instruction = createDiv('instruction shadowed', root);
    this.alerts = new AlertStack(root);
    this.flash = createDiv('phase-flash', root);
    const brb = createDiv('brb', root);
    brb.textContent = 'Volvemos enseguida';
    createDiv('', brb).appendChild(document.createElement('small')).textContent =
      'No te vayas, ya casi';
  }

  private triggerFlash(phase: GameState['phase']): void {
    this.flash.style.setProperty('--flash-color', PHASE_FLASH[phase]);
    this.flash.classList.remove('go');
    void this.flash.offsetWidth;
    this.flash.classList.add('go');
  }

  pushFx(event: FxEvent): void {
    this.alerts.push(event);
  }

  update(state: GameState, heads: Record<TeamId, ScreenPoint>, nowMs: number): void {
    this.root.classList.toggle('panic', state.panic);
    this.root.classList.toggle('brb-on', state.brb);
    this.root.classList.toggle('results-on', state.phase === 'RESULTS');
    if (state.phase !== this.lastPhase) this.triggerFlash(state.phase);
    this.lastPhase = state.phase;
    this.topBar.update(state, nowMs);
    this.nameTags.update(state, heads);
    this.results.update(state);
    this.alerts.update(state, nowMs);
    const index = Math.floor(nowMs / INSTRUCTION_ROTATION_MS) % INSTRUCTIONS.length;
    setText(this.instruction, INSTRUCTIONS[index] ?? '');
  }
}
