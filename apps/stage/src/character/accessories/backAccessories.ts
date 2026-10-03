import * as THREE from 'three';
import { rigSpec } from '../rigBuilder';
import type { AccessoryContext } from './accessoryTypes';
import { box, cone, group } from './primitives';

const TORSO_BACK = -rigSpec.torso.size[2] / 2;
const TORSO_TOP = rigSpec.torso.size[1];

export function buildWings(context: AccessoryContext): THREE.Group {
  const feathers = [0, 1, 2].map((row) => ({
    size: [1.9 - row * 0.4, 0.42, 0.1] as THREE.Vector3Tuple,
    y: TORSO_TOP - 0.55 - row * 0.4,
    angle: 0.1 + row * 0.12,
  }));
  const buildSide = (side: -1 | 1) =>
    group(
      feathers.map((feather) =>
        box(
          feather.size,
          context.primary,
          [side * (0.45 + feather.size[0] / 2), feather.y, TORSO_BACK - 0.12],
          [0, side * -0.35, side * feather.angle],
        ),
      ),
    );
  return group([buildSide(-1), buildSide(1)]);
}

export function buildBackpack(context: AccessoryContext): THREE.Group {
  const strapColor = '#2b2b33';
  const straps = [-0.55, 0.55].map((x) =>
    box([0.18, 1.3, 0.08], strapColor, [x, 1.2, -TORSO_BACK + 0.02]),
  );
  return group([
    box([1.3, 1.5, 0.5], context.accent, [0, 1.15, TORSO_BACK - 0.27]),
    box([1.0, 0.6, 0.12], context.primary, [0, 0.95, TORSO_BACK - 0.55]),
    ...straps,
  ]);
}

export function buildDinoSpikes(context: AccessoryContext): THREE.Group {
  const spikes = [0, 1, 2, 3].map((index) =>
    cone(
      0.3 - index * 0.03,
      0.55,
      context.accent,
      [0, TORSO_TOP - 0.4 - index * 0.45, TORSO_BACK - 0.12],
      4,
      [-Math.PI / 2 - 0.4, Math.PI / 4, 0],
    ),
  );
  return group(spikes);
}
