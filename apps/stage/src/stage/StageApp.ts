import * as THREE from 'three';
import { STAGE_HEIGHT, STAGE_WIDTH, TEAM_IDS } from '@bloxdance/shared';
import type { FxEvent, GameState, TeamId } from '@bloxdance/shared';
import { BeatClock } from '../animation/BeatClock';
import { confettiRain, giftSparks, joinPuff } from '../fx/effects';
import type { ScreenPoint } from '../overlay/NameTags';
import { CameraRig } from './CameraRig';
import { VIEW_SHIFT_X_PX, VIEW_SHIFT_Y_PX } from './layout';
import { createComposer } from './postprocessing';
import { RosterController } from './RosterController';
import { StageWorld } from './StageWorld';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

const HEAD_TAG_HEIGHT = 6.9;

export class StageApp {
  readonly world = new StageWorld();
  readonly clock = new BeatClock(() => Date.now() / 1000);
  private readonly camera: THREE.PerspectiveCamera;
  private readonly rig: CameraRig;
  private readonly roster: RosterController;
  private readonly composer: EffectComposer;
  private state: GameState;
  private trackKey = '';

  constructor(renderer: THREE.WebGLRenderer, initialState: GameState) {
    const camera = new THREE.PerspectiveCamera(40, STAGE_WIDTH / STAGE_HEIGHT, 0.1, 400);
    camera.setViewOffset(
      STAGE_WIDTH,
      STAGE_HEIGHT,
      VIEW_SHIFT_X_PX,
      VIEW_SHIFT_Y_PX,
      STAGE_WIDTH,
      STAGE_HEIGHT,
    );
    this.camera = camera;
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

  headScreenPositions(): Record<TeamId, ScreenPoint> {
    const result = {} as Record<TeamId, ScreenPoint>;
    TEAM_IDS.forEach((team) => {
      const root = this.roster.positionOf(team);
      result[team] = this.project(root.setY(root.y + HEAD_TAG_HEIGHT));
    });
    return result;
  }

  characterScreenRects(): Array<{
    team: TeamId;
    left: number;
    top: number;
    right: number;
    bottom: number;
  }> {
    return this.roster.characterRoots().map(([team, root]) => {
      const box = new THREE.Box3().setFromObject(root);
      const points = [box.min.x, box.max.x].flatMap((x) =>
        [box.min.y, box.max.y].flatMap((y) =>
          [box.min.z, box.max.z].map((z) => this.project(new THREE.Vector3(x, y, z))),
        ),
      );
      return {
        team,
        left: Math.min(...points.map((point) => point.x)),
        top: Math.min(...points.map((point) => point.y)),
        right: Math.max(...points.map((point) => point.x)),
        bottom: Math.max(...points.map((point) => point.y)),
      };
    });
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

  private project(world: THREE.Vector3): ScreenPoint {
    const ndc = world.clone().project(this.camera);
    return { x: ((ndc.x + 1) / 2) * STAGE_WIDTH, y: ((1 - ndc.y) / 2) * STAGE_HEIGHT };
  }

  private updateCamera(state: GameState): void {
    if (state.phase === 'RESULTS') this.rig.startOrbit();
    else if (state.phase === 'FINAL_30') this.rig.setFinalPush(true);
    else if (this.rig.currentMode() === 'orbit' || state.phase === 'LOBBY') this.rig.reset();
  }
}
