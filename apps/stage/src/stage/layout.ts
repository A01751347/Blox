import * as THREE from 'three';
import type { TeamId } from '@bloxdance/shared';

const ARC_RADIUS = 8;
const ARC_ANGLES_DEGREES: Record<TeamId, number> = { red: -45, blue: -15, green: 15, yellow: 45 };
export const PLATFORM_SIZE = new THREE.Vector3(4, 1, 4);
export const PLATFORM_TOP_Y = PLATFORM_SIZE.y;
export const ARENA_CENTER_Z = -4;

export function platformPosition(team: TeamId): THREE.Vector3 {
  const angle = (ARC_ANGLES_DEGREES[team] * Math.PI) / 180;
  return new THREE.Vector3(
    ARC_RADIUS * Math.sin(angle),
    0,
    ARENA_CENTER_Z - ARC_RADIUS * Math.cos(angle) + ARC_RADIUS,
  );
}

export const PODIUM_Z = -22;
export const PODIUM_STEPS = [
  { x: 0, height: 1.8 },
  { x: -3.6, height: 1.2 },
  { x: 3.6, height: 0.7 },
] as const;
export const PODIUM_STEP_SIZE = 3.2;

export function podiumStandPosition(rank: number): THREE.Vector3 {
  const step = PODIUM_STEPS[Math.min(rank, PODIUM_STEPS.length - 1)] ?? PODIUM_STEPS[0];
  return new THREE.Vector3(step.x, step.height, PODIUM_Z);
}

export const GENERAL_CAMERA = {
  position: new THREE.Vector3(0, 14.5, 52),
  target: new THREE.Vector3(0, 3, -4),
};

export const VIEW_SHIFT_X_PX = 80;
export const VIEW_SHIFT_Y_PX = 185;
