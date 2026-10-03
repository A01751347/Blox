import { EditorModel, SNAP_STEPS } from '../animation/EditorModel';
import { wrapBeat } from '../animation/sampleClip';
import type { DanceClip, EasingName } from '../animation/types';
import type { Character } from '../character/Character';
import { JOINT_NAMES } from '../character/types';
import type { JointName, Vec3 } from '../character/types';

const STORAGE_KEY = 'bloxdance.editor.clip';

export class EditorSession {
  model: EditorModel;
  selected = 0;
  playhead = 0;
  snap: number = SNAP_STEPS[1];

  constructor() {
    this.model = new EditorModel(EditorSession.restore());
  }

  private static restore(): DanceClip | undefined {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? EditorModel.parse(stored) : undefined;
    } catch {
      return undefined;
    }
  }

  persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.model.toJson());
    } catch {
      return;
    }
  }

  load(clip: DanceClip): void {
    this.model = new EditorModel(clip);
    this.selected = 0;
    this.playhead = 0;
    this.persist();
  }

  seek(beat: number): void {
    this.playhead = Math.min(Math.max(0, beat), this.model.clip.beats);
    const index = this.model.keyframeIndexAt(this.playhead);
    if (index >= 0) this.selected = index;
  }

  select(index: number): void {
    const frame = this.model.clip.keyframes[index];
    if (!frame) return;
    this.selected = index;
    this.playhead = frame.beat;
  }

  addAtPlayhead(): void {
    this.selected = this.model.addKeyframe(this.playhead, this.snap);
    this.playhead = this.model.clip.keyframes[this.selected]?.beat ?? this.playhead;
    this.persist();
  }

  deleteSelected(): void {
    if (!this.model.deleteKeyframe(this.selected)) return;
    this.selected = Math.max(0, this.selected - 1);
    this.playhead = this.model.clip.keyframes[this.selected]?.beat ?? 0;
    this.persist();
  }

  move(index: number, beat: number): number {
    const next = this.model.moveKeyframe(index, beat, this.snap);
    this.selected = next;
    this.playhead = this.model.clip.keyframes[next]?.beat ?? this.playhead;
    this.persist();
    return next;
  }

  setEase(ease: EasingName): void {
    this.model.setEase(this.selected, ease);
    this.persist();
  }

  selectedEase(): EasingName {
    return this.model.clip.keyframes[this.selected]?.ease ?? 'linear';
  }

  private ensureKeyframeAtPlayhead(): void {
    const index = this.model.keyframeIndexAt(this.playhead);
    this.selected = index >= 0 ? index : this.model.addKeyframe(this.playhead, 0.001);
  }

  editJoint(name: JointName, value: Vec3): void {
    this.ensureKeyframeAtPlayhead();
    this.model.setJoint(this.selected, name, value);
    this.persist();
  }

  editOffset(value: Vec3): void {
    this.ensureKeyframeAtPlayhead();
    this.model.setRootOffset(this.selected, value);
    this.persist();
  }

  currentOffset(): Vec3 {
    return this.model.sample(this.playhead).rootOffset;
  }

  applyTo(character: Character, beat: number = this.playhead): void {
    const pose = this.model.sample(
      this.model.clip.loop ? wrapBeat(beat, this.model.clip.beats) : beat,
    );
    JOINT_NAMES.forEach((name) => character.setJoint(name, pose.joints[name]));
    character.setHipsOffset(pose.rootOffset);
  }
}
