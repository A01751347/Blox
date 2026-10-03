import * as THREE from 'three';
import { rigSpec } from '../rigBuilder';
import type { Accessory, AccessoryContext } from './accessoryTypes';
import { box } from './primitives';

const SEGMENT_COUNT = 4;
const SEGMENT_HEIGHT = 0.55;
const CAPE_WIDTH = 1.8;
const REST_ANGLE = 0.06;
const MAX_ANGLE = 1.2;
const STIFFNESS = 70;
const DAMPING = 9;
const VELOCITY_GAIN = 0.22;
const MAX_STEP_SECONDS = 1 / 30;

export function buildCape(context: AccessoryContext): Accessory {
  const root = new THREE.Group();
  root.position.set(0, rigSpec.torso.size[1] - 0.1, -rigSpec.torso.size[2] / 2 - 0.08);

  const pivots: THREE.Object3D[] = [];
  let parent: THREE.Object3D = root;
  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const pivot = new THREE.Object3D();
    pivot.position.y = index === 0 ? 0 : -SEGMENT_HEIGHT;
    const color = index % 2 === 0 ? context.primary : context.accent;
    pivot.add(
      box([CAPE_WIDTH - index * 0.1, SEGMENT_HEIGHT, 0.08], color, [0, -SEGMENT_HEIGHT / 2, 0]),
    );
    parent.add(pivot);
    pivots.push(pivot);
    parent = pivot;
  }

  const angles = new Array<number>(SEGMENT_COUNT).fill(REST_ANGLE);
  const velocities = new Array<number>(SEGMENT_COUNT).fill(0);
  const previousPosition = new THREE.Vector3();
  const currentPosition = new THREE.Vector3();
  const euler = new THREE.Euler();
  let hasPrevious = false;

  const update = (deltaSeconds: number) => {
    if (deltaSeconds <= 0) return;
    root.getWorldPosition(currentPosition);
    if (!hasPrevious) {
      previousPosition.copy(currentPosition);
      hasPrevious = true;
    }
    const step = Math.min(deltaSeconds, MAX_STEP_SECONDS);
    const forwardVelocity = (currentPosition.z - previousPosition.z) / deltaSeconds;
    const upwardVelocity = (currentPosition.y - previousPosition.y) / deltaSeconds;
    previousPosition.copy(currentPosition);

    const parentQuaternion = root.parent?.getWorldQuaternion(new THREE.Quaternion());
    const pitch = parentQuaternion ? euler.setFromQuaternion(parentQuaternion, 'XYZ').x : 0;
    const drive = REST_ANGLE + forwardVelocity * VELOCITY_GAIN + upwardVelocity * 0.05 - pitch;

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const previousAngle = index === 0 ? drive : (angles[index - 1] ?? drive);
      const target = Math.min(
        MAX_ANGLE,
        Math.max(REST_ANGLE, index === 0 ? drive : previousAngle * 0.85),
      );
      const angle = angles[index] ?? REST_ANGLE;
      const velocity =
        (velocities[index] ?? 0) +
        (STIFFNESS * (target - angle) - DAMPING * (velocities[index] ?? 0)) * step;
      velocities[index] = velocity;
      const nextAngle = Math.min(MAX_ANGLE, Math.max(0, angle + velocity * step));
      angles[index] = nextAngle;
      const pivot = pivots[index];
      if (pivot) pivot.rotation.x = index === 0 ? nextAngle : nextAngle - (angles[index - 1] ?? 0);
    }
  };

  return { name: 'cape', anchor: 'torso', object: root, update };
}
