import * as THREE from 'three';

const TOWER_COUNT = 34;
const TREE_COUNT = 26;
const PALETTE = ['#7c8da6', '#9bb0c9', '#b8c4d6', '#6a7b94', '#a5b6cd'];

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

export function createCityscape(): THREE.Group {
  const random = seeded(42);
  const group = new THREE.Group();
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();

  const towers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    TOWER_COUNT,
  );
  for (let index = 0; index < TOWER_COUNT; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const height = 8 + random() * 26;
    const width = 4 + random() * 5;
    matrix.compose(
      new THREE.Vector3(side * (26 + random() * 30), height / 2 - 6, -45 - random() * 55),
      new THREE.Quaternion(),
      new THREE.Vector3(width, height, width),
    );
    towers.setMatrixAt(index, matrix);
    towers.setColorAt(index, color.set(PALETTE[index % PALETTE.length] ?? '#999999'));
  }

  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#4caf50', roughness: 0.9 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.9 });
  const leaves = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), leafMaterial, TREE_COUNT);
  const trunks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), trunkMaterial, TREE_COUNT);
  for (let index = 0; index < TREE_COUNT; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (16 + random() * 28);
    const z = -26 - random() * 36;
    const scale = 1 + random() * 1.2;
    matrix.compose(
      new THREE.Vector3(x, 1.5 * scale, z),
      new THREE.Quaternion(),
      new THREE.Vector3(0.9 * scale, 3 * scale, 0.9 * scale),
    );
    trunks.setMatrixAt(index, matrix);
    matrix.compose(
      new THREE.Vector3(x, 4.2 * scale, z),
      new THREE.Quaternion(),
      new THREE.Vector3(3 * scale, 2.6 * scale, 3 * scale),
    );
    leaves.setMatrixAt(index, matrix);
  }
  group.add(towers, trunks, leaves);
  return group;
}
