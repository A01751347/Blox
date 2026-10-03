import type { JointName, Vec3 } from '../character/types';
import { sampleClip } from './sampleClip';
import { validateClip } from './validateClip';
import type { DanceClip, EasingName, Keyframe, Pose } from './types';

export const SNAP_STEPS = [0.125, 0.25, 0.5, 1] as const;
const MATCH_TOLERANCE = 1e-6;
const DEFAULT_BEATS = 8;
const NEUTRAL_EASE: EasingName = 'easeInOut';

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function poseToKeyframe(beat: number, pose: Pose, ease: EasingName): Keyframe {
  const joints: Keyframe['joints'] = {};
  (Object.keys(pose.joints) as JointName[]).forEach((name) => {
    joints[name] = [...pose.joints[name]];
  });
  return { beat, joints, rootOffset: [...pose.rootOffset], ease };
}

export class EditorModel {
  clip: DanceClip;

  constructor(clip?: DanceClip) {
    this.clip = clip ? structuredClone(clip) : EditorModel.blankClip();
  }

  static blankClip(): DanceClip {
    return {
      id: 'new_dance',
      name: 'New Dance',
      kind: 'dance',
      level: 0,
      beats: DEFAULT_BEATS,
      loop: true,
      keyframes: [{ beat: 0, joints: {}, rootOffset: [0, 0, 0], ease: NEUTRAL_EASE }],
    };
  }

  static parse(text: string): DanceClip {
    const parsed = JSON.parse(text) as DanceClip;
    const errors = validateClip(parsed);
    if (errors.length > 0) throw new Error(errors.join('\n'));
    return parsed;
  }

  toJson(): string {
    return JSON.stringify(this.clip, null, 2);
  }

  validate(): string[] {
    return validateClip(this.clip);
  }

  keyframeIndexAt(beat: number): number {
    return this.clip.keyframes.findIndex((frame) => Math.abs(frame.beat - beat) < MATCH_TOLERANCE);
  }

  addKeyframe(beat: number, snap: number): number {
    const snapped = Math.min(roundTo(beat, snap), this.clip.beats - snap);
    const existing = this.keyframeIndexAt(snapped);
    if (existing >= 0) return existing;
    const frame = poseToKeyframe(snapped, sampleClip(this.clip, snapped), NEUTRAL_EASE);
    this.clip.keyframes.push(frame);
    this.clip.keyframes.sort((a, b) => a.beat - b.beat);
    return this.keyframeIndexAt(snapped);
  }

  moveKeyframe(index: number, beat: number, snap: number): number {
    const frame = this.clip.keyframes[index];
    if (!frame || index === 0) return index;
    const target = Math.min(Math.max(roundTo(beat, snap), snap), this.clip.beats - snap);
    const occupied = this.keyframeIndexAt(target);
    if (occupied >= 0 && occupied !== index) return index;
    frame.beat = target;
    this.clip.keyframes.sort((a, b) => a.beat - b.beat);
    return this.clip.keyframes.indexOf(frame);
  }

  deleteKeyframe(index: number): boolean {
    if (index <= 0 || index >= this.clip.keyframes.length) return false;
    this.clip.keyframes.splice(index, 1);
    return true;
  }

  setEase(index: number, ease: EasingName): void {
    const frame = this.clip.keyframes[index];
    if (frame) frame.ease = ease;
  }

  setJoint(index: number, joint: JointName, value: Vec3): void {
    const frame = this.clip.keyframes[index];
    if (frame) frame.joints[joint] = [...value];
  }

  setRootOffset(index: number, value: Vec3): void {
    const frame = this.clip.keyframes[index];
    if (frame) frame.rootOffset = [...value];
  }

  setBeats(beats: number, snap: number): void {
    this.clip.beats = Math.max(snap, beats);
    this.clip.keyframes = this.clip.keyframes.filter(
      (frame, index) => index === 0 || frame.beat < this.clip.beats,
    );
  }

  setMeta(meta: Partial<Pick<DanceClip, 'id' | 'name' | 'kind' | 'level' | 'loop'>>): void {
    this.clip = { ...this.clip, ...meta };
  }

  sample(beat: number): Pose {
    return sampleClip(this.clip, beat);
  }
}
