import { JOINT_NAMES } from '../character/types';
import { DANCE_KINDS, EASING_NAMES } from './types';
import type { DanceClip } from './types';

const ALLOWED_LEVELS = [0, 1, 2, 3];

function isVec3(value: unknown): boolean {
  return Array.isArray(value) && value.length === 3 && value.every((item) => Number.isFinite(item));
}

export function validateClip(clip: DanceClip): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9_]+$/.test(clip.id)) errors.push('id must be lowercase letters, digits or _');
  if (!clip.name) errors.push('name is required');
  if (!DANCE_KINDS.includes(clip.kind)) errors.push(`unknown kind ${String(clip.kind)}`);
  if (!ALLOWED_LEVELS.includes(clip.level)) errors.push('level must be 0, 1, 2 or 3');
  if (!Number.isFinite(clip.beats) || clip.beats <= 0) errors.push('beats must be positive');
  if (!Array.isArray(clip.keyframes) || clip.keyframes.length === 0) {
    errors.push('at least one keyframe is required');
    return errors;
  }

  let previousBeat = -1;
  clip.keyframes.forEach((frame, index) => {
    const label = `keyframe ${index}`;
    if (!Number.isFinite(frame.beat) || frame.beat < 0 || frame.beat > clip.beats) {
      errors.push(`${label}: beat out of range`);
    }
    if (frame.beat <= previousBeat) errors.push(`${label}: beats must be strictly increasing`);
    previousBeat = frame.beat;
    if (frame.ease !== undefined && !EASING_NAMES.includes(frame.ease)) {
      errors.push(`${label}: unknown easing ${String(frame.ease)}`);
    }
    if (frame.rootOffset !== undefined && !isVec3(frame.rootOffset)) {
      errors.push(`${label}: rootOffset must be [x, y, z]`);
    }
    Object.entries(frame.joints ?? {}).forEach(([name, value]) => {
      if (!(JOINT_NAMES as readonly string[]).includes(name))
        errors.push(`${label}: unknown joint ${name}`);
      else if (!isVec3(value)) errors.push(`${label}: joint ${name} must be [x, y, z]`);
    });
  });
  if (clip.keyframes[0]?.beat !== 0) errors.push('first keyframe must be at beat 0');
  return errors;
}
