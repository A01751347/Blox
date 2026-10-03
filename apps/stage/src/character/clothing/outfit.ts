import * as THREE from 'three';
import { rigSpec } from '../rigBuilder';
import type { PartName } from '../types';
import type { FaceController } from '../face/FaceController';
import { PANTS_DRAWERS } from './pantsTemplates';
import { SHIRT_DRAWERS } from './shirtTemplates';
import type {
  BlockFace,
  ClothedPart,
  FaceDrawContext,
  PantsSpec,
  ShirtSpec,
} from './clothingTypes';
import { BLOCK_FACES } from './clothingTypes';

const PIXELS_PER_UNIT = 128;
const FRONT_FACE_INDEX = BLOCK_FACES.indexOf('front');

export interface OutfitSpec {
  skinTone: string;
  shirt: ShirtSpec;
  pants: PantsSpec;
}

function faceDimensions(
  size: readonly [number, number, number],
  face: BlockFace,
): [number, number] {
  const [width, height, depth] = size;
  if (face === 'right' || face === 'left') return [depth, height];
  if (face === 'top' || face === 'bottom') return [width, depth];
  return [width, height];
}

function paintFaceTexture(
  draw: (context: FaceDrawContext) => void,
  base: Omit<FaceDrawContext, 'ctx' | 'width' | 'height' | 'face'>,
  size: readonly [number, number, number],
  face: BlockFace,
): THREE.CanvasTexture {
  const [unitsWide, unitsHigh] = faceDimensions(size, face);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(unitsWide * PIXELS_PER_UNIT);
  canvas.height = Math.round(unitsHigh * PIXELS_PER_UNIT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  draw({ ...base, ctx, face, width: canvas.width, height: canvas.height });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function applyBlockTextures(
  mesh: THREE.Mesh,
  size: readonly [number, number, number],
  part: ClothedPart,
  draw: (context: FaceDrawContext) => void,
  base: Omit<FaceDrawContext, 'ctx' | 'width' | 'height' | 'face' | 'part'>,
): void {
  const materials = mesh.material as THREE.MeshStandardMaterial[];
  BLOCK_FACES.forEach((face, index) => {
    const material = materials[index];
    if (!material) return;
    material.color.set('#ffffff');
    material.map = paintFaceTexture(draw, { ...base, part }, size, face);
    material.needsUpdate = true;
  });
}

export function dressCharacter(
  parts: Record<PartName, THREE.Mesh>,
  outfit: OutfitSpec,
  face: FaceController,
): void {
  const shirtBase = {
    colors: outfit.shirt.colors,
    skin: outfit.skinTone,
    ...(outfit.shirt.number === undefined ? {} : { number: outfit.shirt.number }),
  };
  const pantsBase = { colors: outfit.pants.colors, skin: outfit.skinTone };
  const shirtDraw = SHIRT_DRAWERS[outfit.shirt.template];
  const pantsDraw = PANTS_DRAWERS[outfit.pants.template];

  applyBlockTextures(parts.torso, rigSpec.torso.size, 'torso', shirtDraw, shirtBase);
  applyBlockTextures(parts.armL, rigSpec.arm.size, 'arm', shirtDraw, shirtBase);
  applyBlockTextures(parts.armR, rigSpec.arm.size, 'arm', shirtDraw, shirtBase);
  applyBlockTextures(parts.legL, rigSpec.leg.size, 'leg', pantsDraw, pantsBase);
  applyBlockTextures(parts.legR, rigSpec.leg.size, 'leg', pantsDraw, pantsBase);

  const headMaterials = parts.head.material as THREE.MeshStandardMaterial[];
  headMaterials.forEach((material) => material.color.set(outfit.skinTone));
  const frontMaterial = headMaterials[FRONT_FACE_INDEX];
  if (frontMaterial) {
    frontMaterial.color.set('#ffffff');
    frontMaterial.map = face.texture;
    frontMaterial.needsUpdate = true;
  }
}
