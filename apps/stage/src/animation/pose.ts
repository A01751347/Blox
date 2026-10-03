import { JOINT_NAMES } from '../character/types';
import type { JointName, JointPose, Vec3 } from '../character/types';
import type { Pose } from './types';

const ZERO: Vec3 = [0, 0, 0];

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function createNeutralPose(): Pose {
  const joints = Object.fromEntries(JOINT_NAMES.map((name) => [name, [...ZERO] as Vec3])) as Record<
    JointName,
    Vec3
  >;
  return { joints, rootOffset: [...ZERO] };
}

export function poseFromJoints(joints: JointPose, rootOffset: Vec3 = ZERO): Pose {
  const pose = createNeutralPose();
  JOINT_NAMES.forEach((name) => {
    pose.joints[name] = [...(joints[name] ?? ZERO)];
  });
  pose.rootOffset = [...rootOffset];
  return pose;
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const result = createNeutralPose();
  JOINT_NAMES.forEach((name) => {
    result.joints[name] = lerpVec(a.joints[name], b.joints[name], t);
  });
  result.rootOffset = lerpVec(a.rootOffset, b.rootOffset, t);
  return result;
}

export function scalePose(pose: Pose, amplitude: number): Pose {
  const result = createNeutralPose();
  JOINT_NAMES.forEach((name) => {
    const [x, y, z] = pose.joints[name];
    result.joints[name] = [x * amplitude, y * amplitude, z * amplitude];
  });
  const [ox, oy, oz] = pose.rootOffset;
  result.rootOffset = [ox * amplitude, oy * amplitude, oz * amplitude];
  return result;
}
