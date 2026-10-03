import * as THREE from 'three';

const CLOUD_COUNT = 9;
const CLOUD_WRAP = 90;

export function createSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#3d7bd9');
  gradient.addColorStop(0.55, '#8fc7f5');
  gradient.addColorStop(1, '#ffe9c2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class Clouds {
  readonly group = new THREE.Group();

  constructor() {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      flatShading: true,
    });
    for (let index = 0; index < CLOUD_COUNT; index += 1) {
      const cloud = new THREE.Group();
      const puffs = 3 + (index % 3);
      for (let puff = 0; puff < puffs; puff += 1) {
        const width = 5 + ((index * 3 + puff * 5) % 5);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 2 + (puff % 2), 3), material);
        mesh.position.set(puff * 3.5 - puffs * 1.7, (puff % 2) * 0.8, ((puff * 2) % 3) - 1);
        cloud.add(mesh);
      }
      cloud.position.set(
        -CLOUD_WRAP / 2 + (index * CLOUD_WRAP) / CLOUD_COUNT,
        18 + (index % 4) * 5,
        -30 - (index % 3) * 18,
      );
      this.group.add(cloud);
    }
  }

  update(deltaSeconds: number): void {
    this.group.children.forEach((cloud, index) => {
      cloud.position.x += deltaSeconds * (0.6 + (index % 3) * 0.25);
      if (cloud.position.x > CLOUD_WRAP / 2) cloud.position.x = -CLOUD_WRAP / 2;
    });
  }
}
