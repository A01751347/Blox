import type { Accessory, AccessoryAnchor, AccessoryContext, AccessoryName } from './accessoryTypes';
import { buildBackpack, buildDinoSpikes, buildWings } from './backAccessories';
import { buildCape } from './cape';
import {
  buildBeanie,
  buildCap,
  buildCrown,
  buildHeadphones,
  buildMane,
  buildRoundGlasses,
  buildSpikyHair,
  buildTrafficCone,
} from './headAccessories';
import type * as THREE from 'three';
import { createHairSway } from './hairSway';

type Builder = (context: AccessoryContext) => THREE.Object3D;

const STATIC_BUILDERS: Record<Exclude<AccessoryName, 'cape'>, [AccessoryAnchor, Builder]> = {
  cap: ['neck', (context) => buildCap(context, false)],
  cap_back: ['neck', (context) => buildCap(context, true)],
  beanie: ['neck', buildBeanie],
  crown: ['neck', () => buildCrown()],
  headphones: ['neck', buildHeadphones],
  traffic_cone: ['neck', () => buildTrafficCone()],
  glasses_round: ['neck', () => buildRoundGlasses()],
  hair_spiky: ['neck', buildSpikyHair],
  hair_mane: ['neck', buildMane],
  wings: ['torso', buildWings],
  backpack: ['torso', buildBackpack],
  dino_spikes: ['torso', buildDinoSpikes],
};

export function buildAccessory(name: AccessoryName, context: AccessoryContext): Accessory {
  if (name === 'cape') return buildCape(context);
  const [anchor, builder] = STATIC_BUILDERS[name];
  const object = builder(context);
  if (name.startsWith('hair_')) return { name, anchor, object, update: createHairSway(object) };
  return { name, anchor, object };
}
