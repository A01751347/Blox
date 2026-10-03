import { FACE_TEXTURE_SIZE, INK } from './eyePieces';
import type { MouthKind } from './faceTypes';

const CENTER_X = FACE_TEXTURE_SIZE / 2;
const MOUTH_Y = 168;

type MouthDrawer = (ctx: CanvasRenderingContext2D) => void;

function stroke(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
}

const drawSmile: MouthDrawer = (ctx) => {
  stroke(ctx, 9);
  ctx.beginPath();
  ctx.arc(CENTER_X, MOUTH_Y - 18, 34, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
};

const drawGrinOpen: MouthDrawer = (ctx) => {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(CENTER_X, MOUTH_Y - 20, 40, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8606e';
  ctx.beginPath();
  ctx.ellipse(CENTER_X, MOUTH_Y + 12, 22, 12, 0, Math.PI, Math.PI * 2);
  ctx.fill();
};

const drawOh: MouthDrawer = (ctx) => {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(CENTER_X, MOUTH_Y + 4, 17, 22, 0, 0, Math.PI * 2);
  ctx.fill();
};

const drawTongue: MouthDrawer = (ctx) => {
  drawSmile(ctx);
  ctx.fillStyle = '#e8606e';
  ctx.beginPath();
  ctx.roundRect(CENTER_X + 2, MOUTH_Y + 8, 26, 34, 12);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CENTER_X + 15, MOUTH_Y + 14);
  ctx.lineTo(CENTER_X + 15, MOUTH_Y + 30);
  ctx.stroke();
};

const drawTeeth: MouthDrawer = (ctx) => {
  const left = CENTER_X - 44;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(left, MOUTH_Y - 14, 88, 36, 8);
  ctx.fill();
  stroke(ctx, 5);
  ctx.beginPath();
  ctx.roundRect(left, MOUTH_Y - 14, 88, 36, 8);
  ctx.moveTo(left, MOUTH_Y + 4);
  ctx.lineTo(left + 88, MOUTH_Y + 4);
  for (let tooth = 1; tooth < 5; tooth += 1) {
    ctx.moveTo(left + tooth * 17.6, MOUTH_Y - 14);
    ctx.lineTo(left + tooth * 17.6, MOUTH_Y + 22);
  }
  ctx.stroke();
};

const drawLine: MouthDrawer = (ctx) => {
  stroke(ctx, 9);
  ctx.beginPath();
  ctx.moveTo(CENTER_X - 28, MOUTH_Y + 6);
  ctx.lineTo(CENTER_X + 28, MOUTH_Y + 6);
  ctx.stroke();
};

const drawFrown: MouthDrawer = (ctx) => {
  stroke(ctx, 9);
  ctx.beginPath();
  ctx.arc(CENTER_X, MOUTH_Y + 36, 30, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
};

const MOUTH_DRAWERS: Record<MouthKind, MouthDrawer> = {
  smile: drawSmile,
  grinOpen: drawGrinOpen,
  oh: drawOh,
  tongue: drawTongue,
  teeth: drawTeeth,
  line: drawLine,
  frown: drawFrown,
};

export function drawMouth(ctx: CanvasRenderingContext2D, kind: MouthKind): void {
  MOUTH_DRAWERS[kind](ctx);
}
