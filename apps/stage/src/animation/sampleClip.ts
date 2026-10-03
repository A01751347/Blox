import { applyEasing } from './easing';
import { lerpPose, poseFromJoints } from './pose';
import type { DanceClip, Keyframe, Pose } from './types';

const EPSILON = 1e-9;

function keyframePose(keyframe: Keyframe): Pose {
  return poseFromJoints(keyframe.joints, keyframe.rootOffset);
}

export function wrapBeat(beat: number, length: number): number {
  return ((beat % length) + length) % length;
}

export function sampleClip(clip: DanceClip, beat: number): Pose {
  const frames = clip.keyframes;
  const first = frames[0];
  if (!first) return poseFromJoints({});
  const position = clip.loop ? wrapBeat(beat, clip.beats) : Math.min(Math.max(beat, 0), clip.beats);

  let index = 0;
  for (let candidate = 0; candidate < frames.length; candidate += 1) {
    const frame = frames[candidate];
    if (frame && frame.beat <= position + EPSILON) index = candidate;
  }
  const from = frames[index] ?? first;
  const next = frames[index + 1];

  let toPose: Pose;
  let toBeat: number;
  if (next) {
    toPose = keyframePose(next);
    toBeat = next.beat;
  } else if (clip.loop) {
    toPose = keyframePose(first);
    toBeat = clip.beats + first.beat;
  } else {
    return keyframePose(from);
  }

  const span = toBeat - from.beat;
  const progress = span <= EPSILON ? 1 : (position - from.beat) / span;
  return lerpPose(keyframePose(from), toPose, applyEasing(from.ease ?? 'linear', progress));
}
