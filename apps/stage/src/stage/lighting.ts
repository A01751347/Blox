import * as THREE from 'three';
import { TEAM_COLORS, TEAM_IDS } from '@bloxdance/shared';
import { platformPosition } from './layout';

const SHADOW_MAP_SIZE = 2048;
const SWEEP_AMPLITUDE = 4.5;

export class Lighting {
  readonly group = new THREE.Group();
  private readonly spots: { light: THREE.SpotLight; baseX: number; phase: number }[] = [];

  constructor() {
    this.group.add(new THREE.HemisphereLight('#cfe8ff', '#6d6a60', 1.1));

    const sun = new THREE.DirectionalLight('#fff4e0', 2.6);
    sun.position.set(10, 24, 20);
    sun.target.position.set(0, 0, -6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 70;
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0004;
    this.group.add(sun, sun.target);

    TEAM_IDS.forEach((team, index) => {
      const position = platformPosition(team);
      const light = new THREE.SpotLight(TEAM_COLORS[team], 900, 60, 0.35, 0.6, 2);
      light.position.set(position.x * 0.8, 17, position.z - 6);
      light.target.position.copy(position);
      this.group.add(light, light.target);
      this.spots.push({ light, baseX: position.x, phase: index * 1.3 });
    });
  }

  update(beat: number, energyBoost: number): void {
    this.spots.forEach(({ light, baseX, phase }) => {
      const sweep = Math.sin((beat * Math.PI) / 4 + phase) * SWEEP_AMPLITUDE;
      light.target.position.x = baseX + sweep;
      light.intensity = 700 + 600 * energyBoost;
    });
  }
}
