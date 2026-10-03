import { colorAt, fillBase, isSideFace, shade } from './drawHelpers';
import type { FaceDrawContext, PantsTemplateName } from './clothingTypes';

type PantsDrawer = (draw: FaceDrawContext) => void;

const drawPlain: PantsDrawer = (draw) => {
  fillBase(draw, colorAt(draw.colors, 0));
  if (draw.face === 'bottom') fillBase(draw, shade(colorAt(draw.colors, 0), -0.12));
};

const drawSideStripe: PantsDrawer = (draw) => {
  const { ctx, width, height } = draw;
  drawPlain(draw);
  if (draw.face === 'right' || draw.face === 'left') {
    ctx.fillStyle = colorAt(draw.colors, 1);
    ctx.fillRect(width * 0.42, 0, width * 0.16, height);
  }
};

const drawShorts: PantsDrawer = (draw) => {
  const { ctx, width, height } = draw;
  drawPlain(draw);
  if (isSideFace(draw)) {
    ctx.fillStyle = draw.skin;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);
  }
  if (draw.face === 'bottom') fillBase(draw, draw.skin);
};

export const PANTS_DRAWERS: Record<PantsTemplateName, PantsDrawer> = {
  plain: drawPlain,
  sideStripe: drawSideStripe,
  shorts: drawShorts,
};
