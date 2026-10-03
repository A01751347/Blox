import * as THREE from 'three';
import { TEAM_IDS } from '@bloxdance/shared';
import type { GameState, TeamId } from '@bloxdance/shared';
import { Animator } from '../animation/Animator';
import type { BeatClock } from '../animation/BeatClock';
import { DANCE_CLIPS, findDance } from '../animation/danceLibrary';
import { DanceDirector } from '../animation/DanceDirector';
import type { Character } from '../character/Character';
import { createCharacter } from '../character/characterFactory';
import { findCharacterSpec } from '../character/characterLibrary';
import type { CharacterSpec } from '../character/characterSpec';
import { PLATFORM_TOP_Y, platformPosition, podiumStandPosition } from './layout';

const WALK_SMOOTHING_SECONDS = 0.6;
const FORCE_FOREVER_BEATS = 10000;
const SIGNATURE_BEATS = 8;
const SHARE_BEATS = 4;
const MAX_LOOK_YAW_DEGREES = 30;

interface Dancer {
  team: TeamId;
  spec: CharacterSpec;
  character: Character;
  animator: Animator;
  home: THREE.Vector3;
}

export class RosterController {
  private readonly dancers = new Map<TeamId, Dancer>();
  private readonly director = new DanceDirector(DANCE_CLIPS);
  private rosterKey = '';
  private lastPhase: GameState['phase'] | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly clock: BeatClock,
    private readonly camera: THREE.Camera,
  ) {}

  characterRoots(): Array<[TeamId, THREE.Object3D]> {
    return [...this.dancers.entries()].map(([team, dancer]) => [team, dancer.character.root]);
  }

  positionOf(team: TeamId): THREE.Vector3 {
    return this.dancers.get(team)?.character.root.position.clone() ?? platformPosition(team);
  }

  applyState(state: GameState): void {
    this.syncRoster(state.roster);
    if (state.phase !== this.lastPhase) this.onPhaseChange(state);
    this.lastPhase = state.phase;
  }

  triggerSignature(team: TeamId): void {
    const dancer = this.dancers.get(team);
    if (!dancer) return;
    const beat = this.clock.getBeat();
    this.director.force(
      dancer.spec.id,
      findDance(dancer.spec.style.signature),
      beat,
      SIGNATURE_BEATS,
    );
  }

  triggerShare(): void {
    this.director.forceAll(findDance('side_step'), this.clock.getBeat(), SHARE_BEATS);
  }

  update(state: GameState, deltaSeconds: number, elapsedSeconds: number): void {
    const beat = this.clock.getBeat();
    const resolving = state.phase === 'RESULTS';
    this.dancers.forEach((dancer, team) => {
      const level = state.level[team];
      const clip = this.director.clipFor(dancer.spec.id, beat, level);
      if (clip && dancer.animator.currentClipId() !== clip.id) dancer.animator.play(clip);
      dancer.animator.setIntensity(Math.min(1, state.energy[team] / 2000));
      dancer.animator.setLookYaw(this.lookYaw(dancer));
      dancer.animator.update(elapsedSeconds);
      dancer.character.setExpression(this.expressionFor(state, team, level));
      dancer.character.update(deltaSeconds, elapsedSeconds);
      this.walk(dancer, resolving ? this.standFor(state, team) : dancer.home, deltaSeconds);
    });
  }

  private syncRoster(roster: GameState['roster']): void {
    const key = TEAM_IDS.map((team) => roster[team]).join('|');
    if (key === this.rosterKey) return;
    this.rosterKey = key;
    this.dancers.forEach((dancer) => {
      this.scene.remove(dancer.character.root);
      dancer.character.dispose();
      this.director.unregister(dancer.spec.id);
    });
    this.dancers.clear();
    TEAM_IDS.forEach((team) => {
      const spec = findCharacterSpec(roster[team]);
      const character = createCharacter(spec);
      const home = platformPosition(team).setY(PLATFORM_TOP_Y);
      character.root.position.copy(home);
      this.scene.add(character.root);
      this.director.register(spec.id, spec.style.signature);
      const animator = new Animator(character, this.clock, spec.style.energyBias);
      this.dancers.set(team, { team, spec, character, animator, home });
    });
  }

  private onPhaseChange(state: GameState): void {
    this.director.releaseAll();
    if (state.phase !== 'RESULTS') return;
    const beat = this.clock.getBeat();
    this.dancers.forEach((dancer, team) => {
      const won = state.winners.includes(team);
      const clip = findDance(won ? 'victory' : 'defeat');
      this.director.force(dancer.spec.id, clip, beat, FORCE_FOREVER_BEATS);
    });
  }

  private expressionFor(state: GameState, team: TeamId, level: number) {
    if (state.phase === 'RESULTS') return state.winners.includes(team) ? 'victory' : 'lose';
    return level >= 2 ? 'hype' : 'idle';
  }

  private standFor(state: GameState, team: TeamId): THREE.Vector3 {
    const rank = state.winners.indexOf(team);
    if (rank < 0) return this.dancers.get(team)?.home ?? platformPosition(team);
    return podiumStandPosition(rank);
  }

  private walk(dancer: Dancer, target: THREE.Vector3, deltaSeconds: number): void {
    const blend = 1 - Math.exp(-deltaSeconds / WALK_SMOOTHING_SECONDS);
    dancer.character.root.position.lerp(target, blend);
  }

  private lookYaw(dancer: Dancer): number {
    const position = dancer.character.root.position;
    const dx = this.camera.position.x - position.x;
    const dz = this.camera.position.z - position.z;
    const degrees = (Math.atan2(dx, dz) * 180) / Math.PI;
    return Math.max(-MAX_LOOK_YAW_DEGREES, Math.min(MAX_LOOK_YAW_DEGREES, degrees));
  }
}
