import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import rigJson from '../data/rig.json';
import type { BlockSpec, JointName, PartName, RigSpec } from './types';

export const rigSpec = rigJson as RigSpec;

export interface BuiltRig {
  root: THREE.Object3D;
  joints: Record<JointName, THREE.Object3D>;
  parts: Record<PartName, THREE.Mesh>;
}

const FACE_MATERIAL_COUNT = 6;

export function createFaceMaterials(
  color: THREE.ColorRepresentation,
): THREE.MeshStandardMaterial[] {
  return Array.from({ length: FACE_MATERIAL_COUNT }, () => createMaterial(color));
}

export function createMaterial(color: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rigSpec.material.roughness,
    metalness: rigSpec.material.metalness,
  });
}

function createBlock(spec: BlockSpec, color: THREE.ColorRepresentation): THREE.Mesh {
  const [width, height, depth] = spec.size;
  const geometry = new RoundedBoxGeometry(width, height, depth, rigSpec.bevelSegments, spec.bevel);
  const mesh = new THREE.Mesh(geometry, createFaceMaterials(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createJoint(name: string, parent: THREE.Object3D, position: THREE.Vector3Tuple) {
  const joint = new THREE.Object3D();
  joint.name = name;
  joint.position.set(...position);
  parent.add(joint);
  return joint;
}

function attachBlock(
  joint: THREE.Object3D,
  spec: BlockSpec,
  color: THREE.ColorRepresentation,
  centerOffsetY: number,
): THREE.Mesh {
  const mesh = createBlock(spec, color);
  mesh.position.y = centerOffsetY;
  joint.add(mesh);
  return mesh;
}

export function buildRig(color: THREE.ColorRepresentation): BuiltRig {
  const { head, torso, arm, leg } = rigSpec;
  const legHeight = leg.size[1];
  const torsoHeight = torso.size[1];
  const shoulderY = torsoHeight - arm.shoulderDrop;
  const shoulderX = (torso.size[0] + arm.size[0]) / 2;
  const legX = leg.size[0] / 2;

  const root = new THREE.Object3D();
  root.name = 'root';
  const hips = createJoint('hips', root, [0, legHeight, 0]);
  const torsoJoint = createJoint('torso', hips, [0, 0, 0]);
  const neck = createJoint('neck', torsoJoint, [0, torsoHeight, 0]);
  const shoulderL = createJoint('shoulderL', torsoJoint, [-shoulderX, shoulderY, 0]);
  const shoulderR = createJoint('shoulderR', torsoJoint, [shoulderX, shoulderY, 0]);
  const legL = createJoint('legL', hips, [-legX, 0, 0]);
  const legR = createJoint('legR', hips, [legX, 0, 0]);

  const armCenterY = -(arm.size[1] / 2 - arm.shoulderDrop);
  const parts: Record<PartName, THREE.Mesh> = {
    head: attachBlock(neck, head, color, head.size[1] / 2),
    torso: attachBlock(torsoJoint, torso, color, torsoHeight / 2),
    armL: attachBlock(shoulderL, arm, color, armCenterY),
    armR: attachBlock(shoulderR, arm, color, armCenterY),
    legL: attachBlock(legL, leg, color, -legHeight / 2),
    legR: attachBlock(legR, leg, color, -legHeight / 2),
  };

  const joints: Record<JointName, THREE.Object3D> = {
    root,
    hips,
    torso: torsoJoint,
    neck,
    shoulderL,
    shoulderR,
    legL,
    legR,
  };
  return { root, joints, parts };
}
