import * as THREE from 'three';
import { PODIUM_STEPS, PODIUM_STEP_SIZE, PODIUM_Z } from './layout';

const STEP_COLORS = ['#f7c92b', '#c9d1d9', '#c98a4b'];

export function createPodium(): THREE.Group {
  const group = new THREE.Group();
  PODIUM_STEPS.forEach((step, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(PODIUM_STEP_SIZE, step.height, PODIUM_STEP_SIZE),
      new THREE.MeshStandardMaterial({ color: STEP_COLORS[index] ?? '#ffffff', roughness: 0.5 }),
    );
    mesh.position.set(step.x, step.height / 2, PODIUM_Z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}
