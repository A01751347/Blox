import type { Pose } from './types';

const BREATH_PERIOD_SECONDS = 4;
const BREATH_TORSO_DEGREES = 1.5;
const BREATH_HIPS_LIFT = 0.015;
const HEAD_BOUNCE_DEGREES = 8;
const MAX_LOOK_YAW_DEGREES = 30;
const LOOK_YAW_WEIGHT = 0.6;

export interface LayerInput {
  elapsedSeconds: number;
  beatPhase: number;
  intensity: number;
  lookYawDegrees: number;
}

export function beatPulse(phase: number): number {
  return Math.pow(1 - phase, 3);
}

export function applyLayers(pose: Pose, input: LayerInput): Pose {
  const breath = Math.sin((2 * Math.PI * input.elapsedSeconds) / BREATH_PERIOD_SECONDS);
  const bounce = beatPulse(input.beatPhase) * HEAD_BOUNCE_DEGREES * (0.5 + 0.5 * input.intensity);
  const look = Math.max(
    -MAX_LOOK_YAW_DEGREES,
    Math.min(MAX_LOOK_YAW_DEGREES, input.lookYawDegrees),
  );

  const torso = pose.joints.torso;
  const neck = pose.joints.neck;
  return {
    joints: {
      ...pose.joints,
      torso: [torso[0] + breath * BREATH_TORSO_DEGREES, torso[1], torso[2]],
      neck: [neck[0] + bounce, neck[1] + look * LOOK_YAW_WEIGHT, neck[2]],
    },
    rootOffset: [
      pose.rootOffset[0],
      pose.rootOffset[1] + breath * BREATH_HIPS_LIFT,
      pose.rootOffset[2],
    ],
  };
}
