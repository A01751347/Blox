import type { EyeKind } from './faceTypes';

export const FACE_TEXTURE_SIZE = 256;
export const INK = '#1b1b1f';
export const EYE_Y = 112;
export const EYE_OFFSET_X = 44;
const CENTER_X = FACE_TEXTURE_SIZE / 2;

type EyeDrawer = (ctx: CanvasRenderingContext2D, centerX: number) => void;

function strokeStyle(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
}

const drawDot: EyeDrawer = (ctx, centerX) => {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(centerX, EYE_Y, 12, 0, Math.PI * 2);
  ctx.fill();
};

const drawOval: EyeDrawer = (ctx, centerX) => {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(centerX, EYE_Y, 13, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX + 4, EYE_Y - 8, 5, 0, Math.PI * 2);
  ctx.fill();
};

const drawHappyArc: EyeDrawer = (ctx, centerX) => {
  strokeStyle(ctx, 10);
  ctx.beginPath();
  ctx.arc(centerX, EYE_Y + 10, 17, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
};

const drawClosed: EyeDrawer = (ctx, centerX) => {
  strokeStyle(ctx, 9);
  ctx.beginPath();
  ctx.arc(centerX, EYE_Y - 8, 16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
};

const drawStar: EyeDrawer = (ctx, centerX) => {
  const points = 5;
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? 22 : 9;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const x = centerX + Math.cos(angle) * radius;
    const y = EYE_Y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
};

function drawShades(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(CENTER_X - EYE_OFFSET_X - 30, EYE_Y - 22, 60, 44, 10);
  ctx.roundRect(CENTER_X + EYE_OFFSET_X - 30, EYE_Y - 22, 60, 44, 10);
  ctx.fill();
  ctx.fillRect(CENTER_X - EYE_OFFSET_X + 28, EYE_Y - 14, 2 * EYE_OFFSET_X - 56, 10);
  ctx.fillStyle = '#ffffff44';
  ctx.fillRect(CENTER_X - EYE_OFFSET_X - 22, EYE_Y - 15, 18, 6);
  ctx.fillRect(CENTER_X + EYE_OFFSET_X - 22, EYE_Y - 15, 18, 6);
}

const PAIR_DRAWERS: Record<Exclude<EyeKind, 'shades'>, EyeDrawer> = {
  dot: drawDot,
  oval: drawOval,
  happyArc: drawHappyArc,
  star: drawStar,
  closed: drawClosed,
};

export function drawEyes(ctx: CanvasRenderingContext2D, kind: EyeKind): void {
  if (kind === 'shades') {
    drawShades(ctx);
    return;
  }
  const drawer = PAIR_DRAWERS[kind];
  drawer(ctx, CENTER_X - EYE_OFFSET_X);
  drawer(ctx, CENTER_X + EYE_OFFSET_X);
}
