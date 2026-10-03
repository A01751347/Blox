export type Vec3 = [number, number, number];

export type JointName =
  'root' | 'hips' | 'torso' | 'neck' | 'shoulderL' | 'shoulderR' | 'legL' | 'legR';

export const JOINT_NAMES: readonly JointName[] = [
  'root',
  'hips',
  'torso',
  'neck',
  'shoulderL',
  'shoulderR',
  'legL',
  'legR',
];

export type PartName = 'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR';

export interface BlockSpec {
  size: Vec3;
  bevel: number;
}

export interface ArmSpec extends BlockSpec {
  shoulderDrop: number;
}

export interface RigSpec {
  head: BlockSpec;
  torso: BlockSpec;
  arm: ArmSpec;
  leg: BlockSpec;
  bevelSegments: number;
  material: { roughness: number; metalness: number };
}

export type JointPose = Partial<Record<JointName, Vec3>>;
