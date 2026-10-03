import { TEAM_IDS } from '@bloxdance/shared';
import { giftSparks } from '../fx/effects';
import type { ParticlePool } from '../fx/ParticlePool';
import { platformPosition } from '../stage/layout';

const TARGET_PARTICLES = 2000;

export function keepParticleStorm(pool: ParticlePool): void {
  if (pool.aliveCount >= TARGET_PARTICLES - 300) return;
  TEAM_IDS.forEach((team) => giftSparks(pool, team, platformPosition(team), 4000));
}
