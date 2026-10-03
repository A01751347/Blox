import * as THREE from 'three';

const TEXTURE_SIZE = 128;

export function createStudTexture(base: string, repeat: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  ctx.fillStyle = '#00000022';
  ctx.beginPath();
  ctx.arc(TEXTURE_SIZE / 2 + 3, TEXTURE_SIZE / 2 + 4, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff30';
  ctx.beginPath();
  ctx.arc(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00000030';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, TEXTURE_SIZE - 3, TEXTURE_SIZE - 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
