import { describe, expect, it } from 'vitest';
import { Character } from '../character/Character';
import { Animator, amplitudeFor } from './Animator';
import { BeatClock } from './BeatClock';
import { DANCE_CLIPS, findDance } from './danceLibrary';
import { applyEasing } from './easing';
import { sampleClip, wrapBeat } from './sampleClip';
import { EASING_NAMES } from './types';
import type { DanceClip } from './types';

const TEST_CLIP: DanceClip = {
  id: 'test',
  name: 'Test',
  kind: 'dance',
  level: 0,
  beats: 4,
  loop: true,
  keyframes: [
    { beat: 0, joints: { torso: [0, 0, 0] }, rootOffset: [0, 0, 0], ease: 'linear' },
    { beat: 2, joints: { torso: [40, 0, 0] }, rootOffset: [0, 1, 0], ease: 'linear' },
  ],
};

describe('easing', () => {
  it('starts at 0 and ends at 1 for every easing', () => {
    EASING_NAMES.forEach((name) => {
      expect(applyEasing(name, 0)).toBeCloseTo(0, 6);
      expect(applyEasing(name, 1)).toBeCloseTo(1, 6);
    });
  });

  it('easeInOut is slow at the ends and fast in the middle', () => {
    expect(applyEasing('easeInOut', 0.25)).toBeLessThan(0.25);
    expect(applyEasing('easeInOut', 0.5)).toBeCloseTo(0.5, 6);
  });

  it('backOut overshoots before settling', () => {
    expect(applyEasing('backOut', 0.7)).toBeGreaterThan(1);
  });

  it('step jumps only at the end', () => {
    expect(applyEasing('step', 0.99)).toBe(0);
    expect(applyEasing('step', 1)).toBe(1);
  });
});

describe('sampleClip', () => {
  it('interpolates between keyframes', () => {
    const pose = sampleClip(TEST_CLIP, 1);
    expect(pose.joints.torso[0]).toBeCloseTo(20, 6);
    expect(pose.rootOffset[1]).toBeCloseTo(0.5, 6);
  });

  it('loops back to the first keyframe at the end of the clip', () => {
    expect(sampleClip(TEST_CLIP, 3).joints.torso[0]).toBeCloseTo(20, 6);
    expect(sampleClip(TEST_CLIP, 4).joints.torso[0]).toBeCloseTo(0, 6);
    expect(sampleClip(TEST_CLIP, 4 * 1000 + 2).joints.torso[0]).toBeCloseTo(40, 6);
  });

  it('wraps negative beats into the clip', () => {
    expect(wrapBeat(-1, 4)).toBe(3);
    expect(sampleClip(TEST_CLIP, -1).joints.torso[0]).toBeCloseTo(20, 6);
  });

  it('holds the last keyframe in a non-looping clip', () => {
    const once: DanceClip = { ...TEST_CLIP, loop: false };
    expect(sampleClip(once, 3.5).joints.torso[0]).toBeCloseTo(40, 6);
    expect(sampleClip(once, 100).joints.torso[0]).toBeCloseTo(40, 6);
  });

  it('applies the easing of the starting keyframe', () => {
    const eased: DanceClip = {
      ...TEST_CLIP,
      keyframes: [
        { ...(TEST_CLIP.keyframes[0] as DanceClip['keyframes'][number]), ease: 'step' },
        ...TEST_CLIP.keyframes.slice(1),
      ],
    };
    expect(sampleClip(eased, 1).joints.torso[0]).toBe(0);
  });
});

describe('BeatClock', () => {
  it('does not drift after 5 minutes of jittery frames', () => {
    let now = 1000;
    const clock = new BeatClock(() => now, {
      bpm: 128,
      offsetSeconds: 0.25,
      startedAtSeconds: 1000,
    });
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    while (now < 1000 + 300) {
      now += 1 / 60 + (random() - 0.5) * 0.01;
      const expected = ((now - 1000 - 0.25) * 128) / 60;
      expect(clock.getBeat()).toBeCloseTo(expected, 9);
    }
    now = 1000 + 0.25 + ((4 * 60) / 128) * 640;
    expect(clock.getBeat()).toBeCloseTo(4 * 640, 6);
    expect(clock.getPhase()).toBeCloseTo(0, 6);
  });

  it('lands the dance exactly on keyframes at integer beats after 5 minutes', () => {
    const clip = findDance('idle_bop');
    const beatsInFiveMinutes = 600;
    const atStart = sampleClip(clip, 0);
    const atEnd = sampleClip(clip, beatsInFiveMinutes);
    expect(atEnd.rootOffset).toEqual(atStart.rootOffset);
    expect(atEnd.joints.shoulderL).toEqual(atStart.joints.shoulderL);
  });
});

describe('Animator', () => {
  it('scales amplitude from 0.6x at rest to 1.4x at hype', () => {
    expect(amplitudeFor(0, 1)).toBeCloseTo(0.6, 6);
    expect(amplitudeFor(1, 1)).toBeCloseTo(1.4, 6);
    expect(amplitudeFor(2, 1)).toBeCloseTo(1.4, 6);
    expect(amplitudeFor(1, 1.2)).toBeCloseTo(1.6, 6);
  });

  it('crossfades between clips over one beat', () => {
    let now = 0;
    const clock = new BeatClock(() => now, { bpm: 60, startedAtSeconds: 0 });
    const animator = new Animator(new Character(), clock);
    animator.setIntensity(1);
    const flat: DanceClip = {
      ...TEST_CLIP,
      id: 'flat',
      keyframes: [{ beat: 0, joints: { torso: [0, 0, 0] } }],
    };
    const tilted: DanceClip = {
      ...TEST_CLIP,
      id: 'tilted',
      keyframes: [{ beat: 0, joints: { torso: [10, 0, 0] } }],
    };
    animator.play(flat);
    now = 4;
    animator.play(tilted);
    const halfway = animator.computePose(4.5, 0);
    expect(halfway?.joints.torso[0]).toBeCloseTo(0.5 * 10 * 1.4, 3);
    const done = animator.computePose(5.5, 0);
    expect(done?.joints.torso[0]).toBeCloseTo(10 * 1.4, 3);
  });

  it('writes the sampled pose onto the character', () => {
    let now = 0;
    const clock = new BeatClock(() => now, { bpm: 60, startedAtSeconds: 0 });
    const character = new Character();
    const animator = new Animator(character, clock);
    animator.setIntensity(1);
    animator.play(TEST_CLIP);
    now = 2;
    animator.update(0);
    expect(character.getJoint('torso')[0]).toBeCloseTo(40 * 1.4, 3);
  });
});

describe('dance data', () => {
  it('has well formed clips', () => {
    expect(DANCE_CLIPS.length).toBeGreaterThanOrEqual(3);
    DANCE_CLIPS.forEach((clip) => {
      expect(clip.keyframes[0]?.beat).toBe(0);
      const beats = clip.keyframes.map((frame) => frame.beat);
      expect([...beats].sort((a, b) => a - b)).toEqual(beats);
      beats.forEach((beat) => expect(beat).toBeLessThanOrEqual(clip.beats));
      expect(clip.id).toBe(clip.id.toLowerCase());
    });
  });
});
