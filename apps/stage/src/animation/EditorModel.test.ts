import { describe, expect, it } from 'vitest';
import { EditorModel } from './EditorModel';
import { DANCE_CLIPS } from './danceLibrary';
import { validateClip } from './validateClip';

describe('EditorModel', () => {
  it('starts as a valid 8 beat clip with a keyframe at beat 0', () => {
    const model = new EditorModel();
    expect(model.clip.beats).toBe(8);
    expect(model.validate()).toEqual([]);
  });

  it('adds keyframes snapped to the grid, sampled from the current motion', () => {
    const model = new EditorModel();
    model.setJoint(0, 'torso', [20, 0, 0]);
    const index = model.addKeyframe(2.13, 0.25);
    expect(model.clip.keyframes[index]?.beat).toBe(2.25);
    expect(model.clip.keyframes[index]?.joints.torso).toEqual([20, 0, 0]);
    expect(model.addKeyframe(2.2, 0.25)).toBe(index);
    expect(model.clip.keyframes).toHaveLength(2);
  });

  it('keeps keyframes sorted when moving and refuses to move beat 0', () => {
    const model = new EditorModel();
    model.addKeyframe(2, 0.25);
    model.addKeyframe(4, 0.25);
    expect(model.moveKeyframe(0, 3, 0.25)).toBe(0);
    const moved = model.moveKeyframe(1, 6, 0.25);
    expect(moved).toBe(2);
    expect(model.clip.keyframes.map((frame) => frame.beat)).toEqual([0, 4, 6]);
  });

  it('does not stack two keyframes on the same beat', () => {
    const model = new EditorModel();
    model.addKeyframe(2, 0.25);
    model.addKeyframe(4, 0.25);
    expect(model.moveKeyframe(2, 2, 0.25)).toBe(2);
    expect(model.clip.keyframes.map((frame) => frame.beat)).toEqual([0, 2, 4]);
  });

  it('deletes keyframes except the one at beat 0', () => {
    const model = new EditorModel();
    model.addKeyframe(2, 0.25);
    expect(model.deleteKeyframe(0)).toBe(false);
    expect(model.deleteKeyframe(1)).toBe(true);
    expect(model.clip.keyframes).toHaveLength(1);
  });

  it('drops keyframes beyond the new length when shortening', () => {
    const model = new EditorModel();
    model.addKeyframe(6, 0.25);
    model.setBeats(4, 0.25);
    expect(model.clip.keyframes).toHaveLength(1);
  });

  it('round trips through JSON and rejects malformed clips', () => {
    const model = new EditorModel();
    model.addKeyframe(4, 0.25);
    model.setJoint(1, 'shoulderL', [-90, 0, 0]);
    const reloaded = EditorModel.parse(model.toJson());
    expect(reloaded).toEqual(model.clip);
    expect(() => EditorModel.parse('{"id":"Bad Id"}')).toThrow();
  });
});

describe('dance library data', () => {
  it('validates every shipped clip', () => {
    DANCE_CLIPS.forEach((clip) => expect(validateClip(clip), clip.id).toEqual([]));
  });
});
