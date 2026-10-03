import type * as THREE from 'three';

export const ACCESSORY_NAMES = [
  'cap',
  'cap_back',
  'beanie',
  'crown',
  'headphones',
  'traffic_cone',
  'glasses_round',
  'hair_spiky',
  'hair_mane',
  'wings',
  'backpack',
  'dino_spikes',
  'cape',
] as const;

export type AccessoryName = (typeof ACCESSORY_NAMES)[number];
export type AccessoryAnchor = 'neck' | 'torso';

export interface AccessoryContext {
  primary: string;
  accent: string;
  hair: string;
}

export interface Accessory {
  name: AccessoryName;
  anchor: AccessoryAnchor;
  object: THREE.Object3D;
  update?: (deltaSeconds: number, elapsedSeconds: number) => void;
}
