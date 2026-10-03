import type { Character } from '../character/Character';
import { JOINT_NAMES } from '../character/types';
import { BeatClock } from './BeatClock';
import { applyLayers } from './layers';
import { lerpPose, scalePose } from './pose';
import { sampleClip } from './sampleClip';
import { applyEasing } from './easing';
import type { DanceClip, Pose } from './types';

export const AMPLITUDE_AT_REST = 0.6;
export const AMPLITUDE_AT_HYPE = 1.4;
export const MAX_AMPLITUDE = 1.6;
export const DEFAULT_CROSSFADE_BEATS = 1;

interface ActiveClip {
  clip: DanceClip;
  startBeat: number;
}

export function amplitudeFor(intensity: number, bias: number): number {
  const clamped = Math.min(1, Math.max(0, intensity));
  const base = AMPLITUDE_AT_REST + (AMPLITUDE_AT_HYPE - AMPLITUDE_AT_REST) * clamped;
  return Math.min(MAX_AMPLITUDE, base * bias);
}

export class Animator {
  private current: ActiveClip | null = null;
  private previous: ActiveClip | null = null;
  private fadeStartBeat = 0;
  private fadeBeats = DEFAULT_CROSSFADE_BEATS;
  private intensity = 0;
  private lookYawDegrees = 0;

  constructor(
    private readonly character: Character,
    private readonly clock: BeatClock,
    private readonly amplitudeBias = 1,
  ) {}

  play(clip: DanceClip, crossfadeBeats = DEFAULT_CROSSFADE_BEATS): void {
    const beat = this.clock.getBeat();
    this.previous = this.current;
    this.current = { clip, startBeat: Math.floor(beat) };
    this.fadeStartBeat = beat;
    this.fadeBeats = crossfadeBeats;
  }

  currentClipId(): string | null {
    return this.current?.clip.id ?? null;
  }

  setIntensity(intensity: number): void {
    this.intensity = Math.min(1, Math.max(0, intensity));
  }

  setLookYaw(degrees: number): void {
    this.lookYawDegrees = degrees;
  }

  computePose(beat: number, elapsedSeconds: number): Pose | null {
    if (!this.current) return null;
    const amplitude = amplitudeFor(this.intensity, this.amplitudeBias);
    const currentPose = scalePose(
      sampleClip(this.current.clip, beat - this.current.startBeat),
      amplitude,
    );

    let blended = currentPose;
    if (this.previous) {
      const progress = this.fadeBeats <= 0 ? 1 : (beat - this.fadeStartBeat) / this.fadeBeats;
      if (progress >= 1) {
        this.previous = null;
      } else {
        const previousPose = scalePose(
          sampleClip(this.previous.clip, beat - this.previous.startBeat),
          amplitude,
        );
        blended = lerpPose(previousPose, currentPose, applyEasing('easeInOut', progress));
      }
    }

    return applyLayers(blended, {
      elapsedSeconds,
      beatPhase: beat - Math.floor(beat),
      intensity: this.intensity,
      lookYawDegrees: this.lookYawDegrees,
    });
  }

  update(elapsedSeconds: number): void {
    this.renderAt(this.clock.getBeat(), elapsedSeconds);
  }

  renderAt(beat: number, elapsedSeconds: number): void {
    const pose = this.computePose(beat, elapsedSeconds);
    if (!pose) return;
    JOINT_NAMES.forEach((name) => this.character.setJoint(name, pose.joints[name]));
    this.character.setHipsOffset(pose.rootOffset);
  }
}
