import type { TeamId } from '@bloxdance/shared';
import type { AccessoryName } from './accessories/accessoryTypes';
import type { PantsSpec, ShirtSpec } from './clothing/clothingTypes';
import type { FaceSpec } from './face/faceTypes';

export interface CharacterStyle {
  energyBias: number;
  signature: string;
}

export interface CharacterSpec {
  id: string;
  name: string;
  team: TeamId;
  skinTone: string;
  hairColor?: string;
  face: FaceSpec;
  shirt: ShirtSpec;
  pants: PantsSpec;
  accessories: AccessoryName[];
  style: CharacterStyle;
}
