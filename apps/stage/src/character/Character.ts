import * as THREE from 'three';
import { buildRig } from './rigBuilder';
import { JOINT_NAMES } from './types';
import type { Accessory } from './accessories/accessoryTypes';
import type { ExpressionName } from './face/faceTypes';
import type { FaceController } from './face/FaceController';
import type { JointName, JointPose, PartName, Vec3 } from './types';

const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export class Character {
  readonly root: THREE.Object3D;
  readonly joints: Record<JointName, THREE.Object3D>;
  readonly parts: Record<PartName, THREE.Mesh>;
  readonly accessories: Accessory[] = [];
  face: FaceController | null = null;
  private readonly restPositions: Record<JointName, THREE.Vector3>;

  constructor(baseColor: THREE.ColorRepresentation = '#9aa0a6') {
    const rig = buildRig(baseColor);
    this.root = rig.root;
    this.joints = rig.joints;
    this.parts = rig.parts;
    this.restPositions = Object.fromEntries(
      JOINT_NAMES.map((name) => [name, rig.joints[name].position.clone()]),
    ) as Record<JointName, THREE.Vector3>;
  }

  setJoint(name: JointName, rotationDegrees: Vec3): void {
    const [x, y, z] = rotationDegrees;
    this.joints[name].rotation.set(
      x * DEGREES_TO_RADIANS,
      y * DEGREES_TO_RADIANS,
      z * DEGREES_TO_RADIANS,
    );
  }

  getJoint(name: JointName): Vec3 {
    const { x, y, z } = this.joints[name].rotation;
    return [x * RADIANS_TO_DEGREES, y * RADIANS_TO_DEGREES, z * RADIANS_TO_DEGREES];
  }

  setPose(pose: JointPose): void {
    for (const name of JOINT_NAMES) this.setJoint(name, pose[name] ?? [0, 0, 0]);
  }

  setRootOffset(offset: Vec3): void {
    this.root.position.set(...offset);
  }

  setHipsOffset(offset: Vec3): void {
    const rest = this.restPositions.hips;
    this.joints.hips.position.set(rest.x + offset[0], rest.y + offset[1], rest.z + offset[2]);
  }

  resetPose(): void {
    this.setPose({});
    this.setHipsOffset([0, 0, 0]);
  }

  mountAccessory(accessory: Accessory): void {
    const anchor = accessory.anchor === 'neck' ? this.joints.neck : this.joints.torso;
    anchor.add(accessory.object);
    this.accessories.push(accessory);
  }

  setExpression(expression: ExpressionName): void {
    this.face?.setExpression(expression);
  }

  update(deltaSeconds: number, elapsedSeconds: number): void {
    this.face?.update(deltaSeconds);
    this.accessories.forEach((accessory) => accessory.update?.(deltaSeconds, elapsedSeconds));
  }

  dispose(): void {
    this.face?.dispose();
    this.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: THREE.Material) => material.dispose());
    });
  }
}
