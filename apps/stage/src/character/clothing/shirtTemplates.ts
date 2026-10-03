import { colorAt, drawNumber, fillBase, isSideFace, paintSkinTail, shade } from './drawHelpers';
import type { FaceDrawContext, ShirtTemplateName } from './clothingTypes';

type ShirtDrawer = (draw: FaceDrawContext) => void;

const LONG_SLEEVE_SKIN = 0.2;
const SHORT_SLEEVE_SKIN = 0.45;

const drawPlain: ShirtDrawer = (draw) => {
  fillBase(draw, colorAt(draw.colors, 0));
  paintSkinTail(draw, SHORT_SLEEVE_SKIN);
};

const drawStripes: ShirtDrawer = (draw) => {
  const { ctx, width, height } = draw;
  fillBase(draw, colorAt(draw.colors, 0));
  if (isSideFace(draw)) {
    ctx.fillStyle = colorAt(draw.colors, 1);
    const stripeHeight = height / 8;
    for (let row = 1; row < 8; row += 2) ctx.fillRect(0, row * stripeHeight, width, stripeHeight);
  }
  paintSkinTail(draw, SHORT_SLEEVE_SKIN);
};

const drawHoodie: ShirtDrawer = (draw) => {
  const { ctx, width, height } = draw;
  const accent = colorAt(draw.colors, 1);
  fillBase(draw, colorAt(draw.colors, 0));
  if (draw.part === 'torso' && draw.face === 'front') {
    ctx.fillStyle = shade(colorAt(draw.colors, 0), -0.08);
    ctx.fillRect(width * 0.22, height * 0.62, width * 0.56, height * 0.26);
    ctx.fillStyle = accent;
    ctx.fillRect(width * 0.4, height * 0.04, width * 0.04, height * 0.2);
    ctx.fillRect(width * 0.56, height * 0.04, width * 0.04, height * 0.2);
    drawNumber(draw, accent, height * 0.42, height * 0.3);
  }
  if (draw.part === 'torso' && draw.face === 'back')
    drawNumber(draw, accent, height * 0.42, height * 0.5);
  if (draw.part === 'arm' && isSideFace(draw)) {
    ctx.fillStyle = shade(colorAt(draw.colors, 0), -0.1);
    ctx.fillRect(0, height * 0.7, width, height * 0.1);
  }
  paintSkinTail(draw, LONG_SLEEVE_SKIN);
};

const drawJacket: ShirtDrawer = (draw) => {
  const { ctx, width, height } = draw;
  fillBase(draw, colorAt(draw.colors, 0));
  if (draw.part === 'torso' && draw.face === 'front') {
    ctx.fillStyle = colorAt(draw.colors, 1);
    ctx.fillRect(width * 0.34, 0, width * 0.32, height);
    ctx.fillStyle = shade(colorAt(draw.colors, 0), -0.2);
    ctx.fillRect(width * 0.335, 0, width * 0.015, height);
    ctx.fillRect(width * 0.65, 0, width * 0.015, height);
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(width * 0.08, height * 0.58, width * 0.16, height * 0.04);
  }
  paintSkinTail(draw, LONG_SLEEVE_SKIN);
};

const drawOveralls: ShirtDrawer = (draw) => {
  const { ctx, width, height } = draw;
  const overall = colorAt(draw.colors, 0);
  fillBase(draw, colorAt(draw.colors, 1));
  if (draw.part === 'torso' && draw.face === 'front') {
    ctx.fillStyle = overall;
    ctx.fillRect(width * 0.26, height * 0.45, width * 0.48, height * 0.55);
    ctx.fillRect(width * 0.26, 0, width * 0.1, height * 0.5);
    ctx.fillRect(width * 0.64, 0, width * 0.1, height * 0.5);
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.arc(width * 0.31, height * 0.47, width * 0.035, 0, Math.PI * 2);
    ctx.arc(width * 0.69, height * 0.47, width * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  if (draw.part === 'torso' && draw.face === 'back') {
    ctx.fillStyle = overall;
    ctx.fillRect(width * 0.2, 0, width * 0.1, height);
    ctx.fillRect(width * 0.7, 0, width * 0.1, height);
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }
  if (draw.part === 'torso' && isSideFace(draw) && draw.face !== 'front' && draw.face !== 'back') {
    ctx.fillStyle = overall;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }
  paintSkinTail(draw, SHORT_SLEEVE_SKIN);
};

const drawSuit: ShirtDrawer = (draw) => {
  const { ctx, width, height } = draw;
  const suit = colorAt(draw.colors, 0);
  fillBase(draw, suit);
  if (draw.part === 'torso' && draw.face === 'front') {
    ctx.fillStyle =
      colorAt(draw.colors, 2) === colorAt(draw.colors, 0) ? '#ffffff' : colorAt(draw.colors, 2);
    ctx.beginPath();
    ctx.moveTo(width * 0.32, 0);
    ctx.lineTo(width * 0.68, 0);
    ctx.lineTo(width * 0.5, height * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colorAt(draw.colors, 1);
    ctx.fillRect(width * 0.465, height * 0.08, width * 0.07, height * 0.42);
    ctx.fillStyle = shade(suit, -0.18);
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.72, width * 0.022, 0, Math.PI * 2);
    ctx.arc(width * 0.5, height * 0.86, width * 0.022, 0, Math.PI * 2);
    ctx.fill();
  }
  paintSkinTail(draw, LONG_SLEEVE_SKIN);
};

export const SHIRT_DRAWERS: Record<ShirtTemplateName, ShirtDrawer> = {
  plain: drawPlain,
  stripes: drawStripes,
  hoodie: drawHoodie,
  jacket: drawJacket,
  overalls: drawOveralls,
  suit: drawSuit,
};
