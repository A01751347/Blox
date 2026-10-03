import * as THREE from 'three';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@bloxdance/shared';
import type { FxEvent, GameState } from '@bloxdance/shared';
import { BeatClock } from '../animation/BeatClock';
import { confettiRain, giftSparks, joinPuff } from '../fx/effects';
import { CameraRig } from './CameraRig';
import { createComposer } from './postprocessing';
import { RosterController } from './RosterController';
import { StageWorld } from './StageWorld';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

export class StageApp {
  readonly world = new StageWorld();
  readonly clock = new BeatClock(() => Date.now() / 1000);
  private readonly rig: CameraRig;
  private readonly roster: RosterController;
  private readonly composer: EffectComposer;
  private state: GameState;
  private trackKey = '';

  constructor(renderer: THREE.WebGLRenderer, initialState: GameState) {
    const camera = new THREE.PerspectiveCamera(40, STAGE_WIDTH / STAGE_HEIGHT, 0.1, 400);
    this.rig = new CameraRig(camera);
    this.roster = new RosterController(this.world.scene, this.clock, camera);
    this.composer = createComposer(renderer, this.world.scene, camera);
    this.state = initialState;
    this.applyState(initialState);
  }

  get currentState(): GameState {
    return this.state;
  }

  applyState(state: GameState): void {
    const previous = this.state;
    this.state = state;
    const key = `${state.track.id}|${state.track.bpm}|${state.track.startedAt}`;
    if (key !== this.trackKey) {
      this.trackKey = key;
      this.clock.setTrack({
        bpm: state.track.bpm,
        offsetSeconds: 0,
        startedAtSeconds: state.track.startedAt / 1000,
      });
    }
    this.roster.applyState(state);
    if (state.phase !== previous.phase) this.updateCamera(state);
  }

  handleFx(event: FxEvent): void {
    const particles = this.world.particles;
    if (event.kind === 'gift') {
      giftSparks(particles, event.team, this.roster.positionOf(event.team), event.points);
      if (event.big) {
        this.rig.zoomToTeam(event.team);
        this.roster.triggerSignature(event.team);
      }
    } else if (event.kind === 'join') {
      joinPuff(particles, event.team, this.roster.positionOf(event.team));
    } else if (event.kind === 'follow') {
      confettiRain(particles);
    } else {
      this.roster.triggerShare();
    }
  }

  frame(deltaSeconds: number, elapsedSeconds: number): void {
    const dt = Math.min(deltaSeconds, 0.1);
    this.roster.update(this.state, dt, elapsedSeconds);
    this.world.update(dt, elapsedSeconds, this.clock.getBeat(), this.state.energy);
    this.rig.update(dt);
    this.composer.render();
  }

  private updateCamera(state: GameState): void {
    if (state.phase === 'RESULTS') this.rig.startOrbit();
    else if (state.phase === 'FINAL_30') this.rig.setFinalPush(true);
    else if (this.rig.currentMode() === 'orbit' || state.phase === 'LOBBY') this.rig.reset();
  }
}
