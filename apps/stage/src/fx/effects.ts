import * as THREE from 'three';
import { TEAM_COLORS } from '@bloxdance/shared';
import type { TeamId } from '@bloxdance/shared';
import type { ParticlePool } from './ParticlePool';
import type { EmitConfig } from './ParticleSim';

const CONFETTI_PALETTE = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ffffff'];
const SPARK_BRIGHTNESS = 1.5;
const MAX_SPARKS_PER_GIFT = 240;
const SPARKS_PER_GIFT_POINT = 0.05;

function rgb(hex: string, brightness = 1): [number, number, number] {
  const color = new THREE.Color(hex);
  return [color.r * brightness, color.g * brightness, color.b * brightness];
}

export function giftSparks(
  pool: ParticlePool,
  team: TeamId,
  position: THREE.Vector3,
  points: number,
): void {
  const count = Math.min(
    MAX_SPARKS_PER_GIFT,
    Math.max(12, Math.round(points * SPARKS_PER_GIFT_POINT)),
  );
  const config: EmitConfig = {
    position: [position.x, position.y + 2, position.z],
    count,
    speed: 9,
    spread: 0.8,
    upwardBias: 0.6,
    life: 1.1,
    size: 0.12,
    gravity: 9,
    colors: [rgb(TEAM_COLORS[team], SPARK_BRIGHTNESS), rgb('#ffffff', SPARK_BRIGHTNESS)],
  };
  pool.emit(config);
}

export function joinPuff(pool: ParticlePool, team: TeamId, position: THREE.Vector3): void {
  pool.emit({
    position: [position.x, position.y + 0.3, position.z],
    count: 16,
    speed: 4,
    spread: 1,
    upwardBias: 0.2,
    life: 0.8,
    size: 0.14,
    gravity: 4,
    colors: [rgb(TEAM_COLORS[team], 1.6)],
  });
}

export function confettiRain(pool: ParticlePool, centerX = 0, centerZ = -4, count = 220): void {
  const colors = CONFETTI_PALETTE.map((hex) => rgb(hex));
  const batches = 10;
  for (let batch = 0; batch < batches; batch += 1) {
    pool.emit({
      position: [centerX + (batch - batches / 2) * 1.6, 17, centerZ + ((batch * 7) % 5) - 2],
      count: Math.round(count / batches),
      speed: 2.5,
      spread: 2.5,
      upwardBias: -0.5,
      life: 3.2,
      size: 0.26,
      gravity: 3.2,
      colors,
    });
  }
}
