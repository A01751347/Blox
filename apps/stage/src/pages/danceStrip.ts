import type { Character } from '../character/Character';
import { findDance } from '../animation/danceLibrary';
import { sampleClip } from '../animation/sampleClip';
import { createCharacter } from '../character/characterFactory';
import { findCharacterSpec } from '../character/characterLibrary';
import { JOINT_NAMES } from '../character/types';

const STRIP_SPACING = 4.4;

export function buildDanceStrip(danceId: string, count: number, characterId: string): Character[] {
  const clip = findDance(danceId);
  const offset = ((count - 1) * STRIP_SPACING) / 2;
  return Array.from({ length: count }, (_, index) => {
    const character = createCharacter(findCharacterSpec(characterId));
    const pose = sampleClip(clip, (index * clip.beats) / count);
    JOINT_NAMES.forEach((name) => character.setJoint(name, pose.joints[name]));
    character.setHipsOffset(pose.rootOffset);
    character.root.position.x = index * STRIP_SPACING - offset;
    return character;
  });
}
