import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { STAGE_HEIGHT, STAGE_WIDTH } from '@bloxdance/shared';

export const BLOOM_STRENGTH = 0.6;
const BLOOM_RADIUS = 0.4;
const BLOOM_THRESHOLD = 0.85;

export function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.setSize(STAGE_WIDTH, STAGE_HEIGHT);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(STAGE_WIDTH, STAGE_HEIGHT),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    ),
  );
  composer.addPass(new OutputPass());
  return composer;
}
