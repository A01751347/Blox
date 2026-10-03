import * as THREE from 'three';
import { rigSpec } from '../rigBuilder';
import type { AccessoryContext } from './accessoryTypes';
import { accessoryMaterial, box, cone, cylinder, group, placeMesh } from './primitives';

const HEAD_TOP = rigSpec.head.size[1];
const HEAD_CENTER = HEAD_TOP / 2;
const HEAD_FRONT = rigSpec.head.size[2] / 2;
const HEAD_SIDE = rigSpec.head.size[0] / 2;

export function buildCap(context: AccessoryContext, backwards: boolean): THREE.Group {
  const brimZ = (backwards ? -1 : 1) * (HEAD_FRONT + 0.3);
  return group([
    box([1.46, 0.5, 1.46], context.primary, [0, HEAD_TOP + 0.12, 0]),
    box([1.3, 0.1, 0.8], context.accent, [0, HEAD_TOP + 0.02, brimZ]),
  ]);
}

export function buildBeanie(context: AccessoryContext): THREE.Group {
  const dome = placeMesh(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      accessoryMaterial(context.primary),
    ),
    [0, HEAD_TOP - 0.08, 0],
  );
  return group([
    dome,
    box([1.5, 0.22, 1.5], context.accent, [0, HEAD_TOP - 0.06, 0]),
    placeMesh(
      new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), accessoryMaterial(context.accent)),
      [0, HEAD_TOP + 0.78, 0],
    ),
  ]);
}

export function buildCrown(): THREE.Group {
  const gold = '#f7c92b';
  const spikes = [-0.5, -0.25, 0, 0.25, 0.5].map((offset, index) =>
    cone(0.13, index % 2 === 0 ? 0.42 : 0.3, gold, [offset * 1.25, HEAD_TOP + 0.4, 0]),
  );
  return group([box([1.4, 0.25, 1.1], gold, [0, HEAD_TOP + 0.12, 0]), ...spikes]);
}

export function buildHeadphones(context: AccessoryContext): THREE.Group {
  const band = placeMesh(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.07, 8, 24, Math.PI),
      accessoryMaterial('#2b2b33'),
    ),
    [0, HEAD_CENTER, 0],
    [0, 0, 0],
  );
  const cups = [-1, 1].map((side) =>
    cylinder(
      0.3,
      0.26,
      context.accent,
      [side * (HEAD_SIDE + 0.12), HEAD_CENTER, 0],
      [0, 0, Math.PI / 2],
    ),
  );
  return group([band, ...cups]);
}

export function buildTrafficCone(): THREE.Group {
  const orange = '#ff7a1a';
  return group([
    cone(0.62, 1.3, orange, [0, HEAD_TOP + 0.62, 0], 24),
    cylinder(0.43, 0.14, '#ffffff', [0, HEAD_TOP + 0.55, 0]),
    box([1.4, 0.1, 1.4], orange, [0, HEAD_TOP + 0.03, 0]),
  ]);
}

export function buildRoundGlasses(): THREE.Group {
  const frame = '#1d1d22';
  const rings = [-0.3, 0.3].map((x) =>
    placeMesh(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20), accessoryMaterial(frame)), [
      x,
      HEAD_CENTER + 0.05,
      HEAD_FRONT + 0.03,
    ]),
  );
  return group([
    ...rings,
    box([0.18, 0.04, 0.04], frame, [0, HEAD_CENTER + 0.1, HEAD_FRONT + 0.03]),
  ]);
}

export function buildSpikyHair(context: AccessoryContext): THREE.Group {
  const spikes = [-0.5, -0.25, 0, 0.25, 0.5].map((offset, index) => {
    const lean = offset * -0.5;
    const height = 0.55 + (index % 2) * 0.3;
    return box(
      [0.26, height, 0.3],
      context.hair,
      [offset * 1.15, HEAD_TOP + height / 2 - 0.02, 0],
      [0, 0, lean],
    );
  });
  const cap = box([1.38, 0.2, 1.38], context.hair, [0, HEAD_TOP + 0.02, -0.04]);
  const fringe = box([1.38, 0.34, 0.2], context.hair, [0, HEAD_TOP - 0.1, -HEAD_FRONT - 0.02]);
  return group([cap, fringe, ...spikes]);
}

export function buildMane(context: AccessoryContext): THREE.Group {
  const top = box([1.42, 0.3, 1.42], context.hair, [0, HEAD_TOP + 0.04, 0]);
  const back = box([1.42, 1.1, 0.34], context.hair, [0, HEAD_CENTER - 0.1, -HEAD_FRONT + 0.1]);
  const sides = [-1, 1].map((side) =>
    box([0.22, 0.9, 1.1], context.hair, [side * (HEAD_SIDE + 0.03), HEAD_CENTER + 0.1, -0.15]),
  );
  const fringe = box([1.42, 0.3, 0.2], context.hair, [0, HEAD_TOP - 0.06, HEAD_FRONT - 0.05]);
  return group([top, back, fringe, ...sides]);
}
