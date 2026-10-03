export const SHIRT_TEMPLATES = [
  'plain',
  'stripes',
  'hoodie',
  'jacket',
  'overalls',
  'suit',
] as const;
export const PANTS_TEMPLATES = ['plain', 'sideStripe', 'shorts'] as const;
export const BLOCK_FACES = ['right', 'left', 'top', 'bottom', 'front', 'back'] as const;

export type ShirtTemplateName = (typeof SHIRT_TEMPLATES)[number];
export type PantsTemplateName = (typeof PANTS_TEMPLATES)[number];
export type BlockFace = (typeof BLOCK_FACES)[number];
export type ClothedPart = 'torso' | 'arm' | 'leg';

export interface ShirtSpec {
  template: ShirtTemplateName;
  colors: string[];
  number?: number;
}

export interface PantsSpec {
  template: PantsTemplateName;
  colors: string[];
}

export interface FaceDrawContext {
  ctx: CanvasRenderingContext2D;
  face: BlockFace;
  part: ClothedPart;
  width: number;
  height: number;
  colors: string[];
  skin: string;
  number?: number;
}
