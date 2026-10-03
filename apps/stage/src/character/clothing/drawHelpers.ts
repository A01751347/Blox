import * as THREE from 'three';
import type { FaceDrawContext } from './clothingTypes';

export function colorAt(colors: string[], index: number): string {
  return colors[index] ?? colors[0] ?? '#cccccc';
}

export function shade(color: string, amount: number): string {
  const result = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  result.getHSL(hsl);
  result.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${result.getHexString()}`;
}

export function fillBase(draw: FaceDrawContext, color: string): void {
  draw.ctx.fillStyle = color;
  draw.ctx.fillRect(0, 0, draw.width, draw.height);
}

export function isSideFace(draw: FaceDrawContext): boolean {
  return draw.face !== 'top' && draw.face !== 'bottom';
}

export function drawNumber(
  draw: FaceDrawContext,
  color: string,
  centerY: number,
  size: number,
): void {
  if (draw.number === undefined) return;
  const { ctx } = draw;
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Fredoka", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(draw.number), draw.width / 2, centerY);
}

export function paintSkinTail(draw: FaceDrawContext, fraction: number): void {
  if (draw.part !== 'arm') return;
  const { ctx, width, height } = draw;
  if (draw.face === 'bottom') {
    fillBase(draw, draw.skin);
    return;
  }
  if (draw.face === 'top') return;
  ctx.fillStyle = draw.skin;
  ctx.fillRect(0, height * (1 - fraction), width, height * fraction);
}
