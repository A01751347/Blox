import { fitFrameToViewport } from './stage/fitToViewport';
import { createRenderer } from './stage/createRenderer';
import { StageApp } from './stage/StageApp';
import { FpsCounter } from './dev/fpsCounter';
import { createDemoState } from './dev/demoState';
import { keepParticleStorm } from './dev/particleStorm';
import { connectToServer } from './net/client';
import { Overlay } from './overlay/Overlay';
import './overlay/overlay.css';

const frame = document.getElementById('frame') as HTMLElement;
const canvas = document.getElementById('stage-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const params = new URLSearchParams(location.search);

fitFrameToViewport(frame);
const renderer = createRenderer(canvas);
const app = new StageApp(renderer, createDemoState(params));
const useDemo = params.has('demo') || params.has('bench');

const overlayView = new Overlay(overlay);

if (!useDemo) {
  connectToServer({
    onState: (state) => {
      app.applyState(state);
    },
    onFx: (event) => {
      app.handleFx(event);
      overlayView.pushFx(event);
    },
  });
}

const fps = import.meta.env.DEV ? new FpsCounter(overlay) : null;
let previous = performance.now();
const start = previous;

renderer.setAnimationLoop((now) => {
  const delta = (now - previous) / 1000;
  previous = now;
  if (params.has('bench')) keepParticleStorm(app.world.particles);
  app.frame(delta, (now - start) / 1000);
  overlayView.update(app.currentState, app.headScreenPositions(), Date.now());
  fps?.tick();
});

if (import.meta.env.DEV) {
  (window as unknown as { __stage: unknown }).__stage = {
    rects: () => app.characterScreenRects(),
  };
}
