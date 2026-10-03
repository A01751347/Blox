import * as THREE from 'three';
import { createStudTexture } from './studTexture';

const FLOOR_SIZE = 130;
const FLOOR_DEPTH = 2;

export function createFloor(): THREE.Group {
  const top = new THREE.MeshStandardMaterial({
    map: createStudTexture('#8a8f98', FLOOR_SIZE / 2),
    roughness: 0.6,
  });
  const side = new THREE.MeshStandardMaterial({ color: '#4e535c', roughness: 0.8 });
  const island = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_SIZE, FLOOR_DEPTH, FLOOR_SIZE), [
    side,
    side,
    top,
    side,
    side,
    side,
  ]);
  island.position.set(0, -FLOOR_DEPTH / 2, -10);
  island.receiveShadow = true;
  const group = new THREE.Group();
  group.add(island);
  return group;
}
