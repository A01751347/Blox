import * as THREE from 'three';
import { TEAM_COLORS, TEAM_IDS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import { beatPulse } from '../animation/layers';
import { PLATFORM_SIZE, platformPosition } from './layout';

const STUDS_PER_SIDE = 4;
const MAX_ENERGY_FOR_GLOW = 2000;
const BASE_GLOW = 0.15;
const RING_RADIUS = 3.4;

interface TeamPlatform {
  group: THREE.Group;
  bodyMaterial: THREE.MeshStandardMaterial;
  studMaterial: THREE.MeshStandardMaterial;
  ring: THREE.Mesh;
  ringMaterial: THREE.MeshBasicMaterial;
}

export class Platforms {
  readonly group = new THREE.Group();
  private readonly byTeam = new Map<TeamId, TeamPlatform>();

  constructor() {
    TEAM_IDS.forEach((team) => {
      const platform = this.build(team);
      this.byTeam.set(team, platform);
      this.group.add(platform.group);
    });
  }

  update(elapsedSeconds: number, beatPhase: number, energy: Record<TeamId, number>): void {
    const pulse = beatPulse(beatPhase);
    TEAM_IDS.forEach((team) => {
      const platform = this.byTeam.get(team);
      if (!platform) return;
      const level = Math.min(1, energy[team] / MAX_ENERGY_FOR_GLOW);
      const glow = BASE_GLOW + level * (0.35 + 0.5 * pulse);
      platform.bodyMaterial.emissiveIntensity = glow;
      platform.studMaterial.emissiveIntensity = glow * 1.4;
      platform.ringMaterial.opacity = 0.15 + 0.7 * level;
      const scale = 1 + 0.06 * pulse * (0.4 + level) + 0.03 * Math.sin(elapsedSeconds * 2);
      platform.ring.scale.setScalar(scale);
      platform.ring.rotation.z = elapsedSeconds * 0.4;
    });
  }

  private build(team: TeamId): TeamPlatform {
    const color = new THREE.Color(TEAM_COLORS[team]);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: BASE_GLOW,
      roughness: 0.5,
    });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(PLATFORM_SIZE.x, PLATFORM_SIZE.y, PLATFORM_SIZE.z),
      bodyMaterial,
    );
    body.position.y = PLATFORM_SIZE.y / 2;
    body.castShadow = true;
    body.receiveShadow = true;

    const studMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: BASE_GLOW * 1.4,
      roughness: 0.45,
    });
    const studCount = STUDS_PER_SIDE * STUDS_PER_SIDE;
    const studs = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20),
      studMaterial,
      studCount,
    );
    const matrix = new THREE.Matrix4();
    const spacing = PLATFORM_SIZE.x / STUDS_PER_SIDE;
    for (let row = 0; row < STUDS_PER_SIDE; row += 1) {
      for (let column = 0; column < STUDS_PER_SIDE; column += 1) {
        matrix.makeTranslation(
          (column + 0.5) * spacing - PLATFORM_SIZE.x / 2,
          PLATFORM_SIZE.y + 0.1,
          (row + 0.5) * spacing - PLATFORM_SIZE.z / 2,
        );
        studs.setMatrixAt(row * STUDS_PER_SIDE + column, matrix);
      }
    }

    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(RING_RADIUS, RING_RADIUS + 0.35, 4),
      ringMaterial,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;

    const group = new THREE.Group();
    group.add(body, studs, ring);
    group.position.copy(platformPosition(team));
    return { group, bodyMaterial, studMaterial, ring, ringMaterial };
  }
}
