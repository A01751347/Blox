import type { FxEvent, GameState } from '@bloxdance/shared';
import type { BeatClock } from '../animation/BeatClock';
import { MusicPlayer } from './MusicPlayer';
import { Sfx } from './Sfx';

const COUNTDOWN_TICKS = [5, 4, 3, 2, 1];

export class AudioEngine {
  private readonly music: MusicPlayer;
  private readonly sfx: Sfx | null;
  private readonly context: AudioContext | null;
  private trackKey = '';
  private lastPhase: GameState['phase'] | null = null;
  private lastCountdown = -1;

  constructor(
    private readonly clock: BeatClock,
    enabled: boolean,
  ) {
    const created = enabled ? AudioEngine.createContext() : null;
    this.context = created;
    const master = created ? created.createGain() : null;
    master?.connect(created?.destination as AudioNode);
    this.music = new MusicPlayer(clock, created, master);
    this.sfx = created && master ? new Sfx(created, master) : null;
    if (created) this.unlockOnGesture(created);
  }

  private static createContext(): AudioContext | null {
    try {
      return new AudioContext();
    } catch {
      return null;
    }
  }

  private unlockOnGesture(context: AudioContext): void {
    const resume = () => void context.resume();
    ['pointerdown', 'keydown'].forEach((name) =>
      window.addEventListener(name, resume, { once: true }),
    );
    void context.resume().catch(() => undefined);
  }

  applyState(state: GameState, nowMs: number): void {
    const key = `${state.track.id}|${state.track.startedAt}`;
    if (key !== this.trackKey) {
      this.trackKey = key;
      this.music.start(state.track.id, state.track.startedAt);
    }
    const topEnergy = Math.max(...Object.values(state.energy));
    this.music.setIntensity(Math.min(1, topEnergy / 800));
    this.music.setFinalPush(state.phase === 'FINAL_30');
    this.music.setDucked(state.brb);
    if (this.sfx) this.sfx.muted = state.panic;
    if (state.phase !== this.lastPhase) this.onPhase(state.phase);
    this.lastPhase = state.phase;
    this.countdown(state, nowMs);
  }

  handleFx(event: FxEvent): void {
    if (!this.sfx) return;
    if (event.kind === 'gift') this.sfx.gift(event.big);
    else if (event.kind === 'join') this.sfx.join();
    else if (event.kind === 'follow') this.sfx.follow();
    else if (event.kind === 'share') this.sfx.share();
  }

  private onPhase(phase: GameState['phase']): void {
    if (!this.sfx) return;
    if (phase === 'ROUND') this.sfx.roundStart();
    else if (phase === 'FINAL_30') this.sfx.finalPush();
    else if (phase === 'RESULTS') this.sfx.fanfare();
  }

  private countdown(state: GameState, nowMs: number): void {
    if (!this.sfx || state.phase !== 'FINAL_30') {
      this.lastCountdown = -1;
      return;
    }
    const secondsLeft = Math.ceil((state.phaseEndsAt - nowMs) / 1000);
    if (COUNTDOWN_TICKS.includes(secondsLeft) && secondsLeft !== this.lastCountdown)
      this.sfx.tick();
    this.lastCountdown = secondsLeft;
  }

  get contextState(): string {
    return this.context?.state ?? 'disabled';
  }
}
