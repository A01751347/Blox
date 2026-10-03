import { Character } from './Character';
import type { CharacterSpec } from './characterSpec';
import { buildAccessory } from './accessories/accessoryRegistry';
import type { AccessoryContext } from './accessories/accessoryTypes';
import { dressCharacter } from './clothing/outfit';
import { FaceController } from './face/FaceController';
import { TEAM_COLORS } from '@bloxdance/shared';

const DEFAULT_ACCENT = '#ffffff';
const DEFAULT_HAIR = '#2a2a35';

export function accessoryContextFor(spec: CharacterSpec): AccessoryContext {
  return {
    primary: TEAM_COLORS[spec.team],
    accent: spec.shirt.colors[1] ?? DEFAULT_ACCENT,
    hair: spec.hairColor ?? DEFAULT_HAIR,
  };
}

export function createCharacter(spec: CharacterSpec): Character {
  const character = new Character(spec.skinTone);
  const face = new FaceController(spec.face, spec.skinTone);
  character.face = face;
  dressCharacter(
    character.parts,
    { skinTone: spec.skinTone, shirt: spec.shirt, pants: spec.pants },
    face,
  );
  const context = accessoryContextFor(spec);
  spec.accessories.forEach((name) => character.mountAccessory(buildAccessory(name, context)));
  return character;
}
