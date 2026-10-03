import * as THREE from 'three';
import type { TeamId } from '@bloxdance/shared';
import { ParticlePool } from '../fx/ParticlePool';
import { createCityscape } from './cityscape';
import { createFloor } from './floor';
import { Lighting } from './lighting';
import { Platforms } from './platforms';
import { createPodium } from './podium';
import { Clouds, createSkyTexture } from './sky';

const FOG_COLOR = '#bfdcf5';

export class StageWorld {
  readonly scene = new THREE.Scene();
  readonly particles = new ParticlePool();
  private readonly platforms = new Platforms();
  private readonly lighting = new Lighting();
  private readonly clouds = new Clouds();

  constructor() {
    this.scene.background = createSkyTexture();
    this.scene.fog = new THREE.Fog(FOG_COLOR, 55, 150);
    this.scene.add(
      this.lighting.group,
      createFloor(),
      this.platforms.group,
      createPodium(),
      createCityscape(),
      this.clouds.group,
      this.particles.mesh,
    );
  }

  update(
    deltaSeconds: number,
    elapsedSeconds: number,
    beat: number,
    energy: Record<TeamId, number>,
  ): void {
    const beatPhase = beat - Math.floor(beat);
    const topEnergy = Math.max(...Object.values(energy));
    this.platforms.update(elapsedSeconds, beatPhase, energy);
    this.lighting.update(beat, Math.min(1, topEnergy / 2000));
    this.clouds.update(deltaSeconds);
    this.particles.update(deltaSeconds);
  }
}
