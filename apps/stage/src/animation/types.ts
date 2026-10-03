import type { JointName, JointPose, Vec3 } from '../character/types';

export const EASING_NAMES = ['linear', 'easeInOut', 'backOut', 'bounce', 'step'] as const;
export const DANCE_KINDS = ['dance', 'signature', 'victory', 'defeat'] as const;

export type EasingName = (typeof EASING_NAMES)[number];
export type DanceKind = (typeof DANCE_KINDS)[number];

export interface Keyframe {
  beat: number;
  joints: JointPose;
  rootOffset?: Vec3;
  ease?: EasingName;
}

export interface DanceClip {
  id: string;
  name: string;
  kind: DanceKind;
  level: 0 | 1 | 2 | 3;
  beats: number;
  loop: boolean;
  keyframes: Keyframe[];
}

export interface Pose {
  joints: Record<JointName, Vec3>;
  rootOffset: Vec3;
}
