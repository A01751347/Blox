import * as THREE from 'three';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@bloxdance/shared';
import { fitFrameToViewport } from './stage/fitToViewport';
import { createRenderer } from './stage/createRenderer';
import { FpsCounter } from './dev/fpsCounter';
import { connectToServer } from './net/client';

const frame = document.getElementById('frame') as HTMLElement;
const canvas = document.getElementById('stage-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;

fitFrameToViewport(frame);
const renderer = createRenderer(canvas);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#87ceeb');
const camera = new THREE.PerspectiveCamera(40, STAGE_WIDTH / STAGE_HEIGHT, 0.1, 500);
camera.position.set(0, 6, 22);

const phaseLabel = document.createElement('div');
phaseLabel.style.cssText =
  'position:absolute;left:0;right:0;top:300px;text-align:center;color:#fff;' +
  'font-size:96px;font-weight:700;text-shadow:0 6px 0 #0006';
phaseLabel.textContent = '…';
overlay.appendChild(phaseLabel);

connectToServer({
  onState: (state) => {
    phaseLabel.textContent = state.phase;
  },
  onFx: () => undefined,
});

const fps = import.meta.env.DEV ? new FpsCounter(overlay) : null;

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  fps?.tick();
});
