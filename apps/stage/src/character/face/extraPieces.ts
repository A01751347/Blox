import { EYE_OFFSET_X, EYE_Y, FACE_TEXTURE_SIZE, INK } from './eyePieces';
import type { ExtraKind } from './faceTypes';

const CENTER_X = FACE_TEXTURE_SIZE / 2;

type ExtraDrawer = (ctx: CanvasRenderingContext2D) => void;

const drawBlush: ExtraDrawer = (ctx) => {
  ctx.fillStyle = '#ff6b8166';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(CENTER_X + side * (EYE_OFFSET_X + 20), EYE_Y + 42, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  });
};

function drawBrowPair(ctx: CanvasRenderingContext2D, innerLift: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  [-1, 1].forEach((side) => {
    const innerX = CENTER_X + side * (EYE_OFFSET_X - 24);
    const outerX = CENTER_X + side * (EYE_OFFSET_X + 24);
    ctx.beginPath();
    ctx.moveTo(innerX, EYE_Y - 40 - innerLift);
    ctx.lineTo(outerX, EYE_Y - 40 + innerLift);
    ctx.stroke();
  });
}

const drawBrows: ExtraDrawer = (ctx) => drawBrowPair(ctx, -4);

const drawBrowsSad: ExtraDrawer = (ctx) => drawBrowPair(ctx, 12);

const drawFreckles: ExtraDrawer = (ctx) => {
  ctx.fillStyle = '#a8643c';
  const offsets: Array<[number, number]> = [
    [-70, 150],
    [-56, 140],
    [-44, 154],
    [70, 150],
    [56, 140],
    [44, 154],
  ];
  offsets.forEach(([dx, y]) => {
    ctx.beginPath();
    ctx.arc(CENTER_X + dx, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

const EXTRA_DRAWERS: Record<ExtraKind, ExtraDrawer> = {
  blush: drawBlush,
  brows: drawBrows,
  browsSad: drawBrowsSad,
  freckles: drawFreckles,
};

export function drawExtra(ctx: CanvasRenderingContext2D, kind: ExtraKind): void {
  EXTRA_DRAWERS[kind](ctx);
}
