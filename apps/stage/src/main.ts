import { fitFrameToViewport } from './stage/fitToViewport';
import { createRenderer } from './stage/createRenderer';
import { StageApp } from './stage/StageApp';
import { FpsCounter } from './dev/fpsCounter';
import { createDemoState } from './dev/demoState';
import { keepParticleStorm } from './dev/particleStorm';
import { connectToServer } from './net/client';

const frame = document.getElementById('frame') as HTMLElement;
const canvas = document.getElementById('stage-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const params = new URLSearchParams(location.search);

fitFrameToViewport(frame);
const renderer = createRenderer(canvas);
const app = new StageApp(renderer, createDemoState(params));
const useDemo = params.has('demo') || params.has('bench');

const phaseLabel = document.createElement('div');
phaseLabel.style.cssText =
  'position:absolute;left:0;right:0;top:300px;text-align:center;color:#fff;' +
  'font-size:96px;font-weight:700;text-shadow:0 6px 0 #0006';
overlay.appendChild(phaseLabel);

if (!useDemo) {
  connectToServer({
    onState: (state) => {
      app.applyState(state);
      phaseLabel.textContent = state.phase;
    },
    onFx: (event) => app.handleFx(event),
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
  fps?.tick();
});
