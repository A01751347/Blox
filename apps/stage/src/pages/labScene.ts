import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface LabScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  run: (update: (deltaSeconds: number, elapsedSeconds: number) => void) => void;
}

export function createLabScene(canvas: HTMLCanvasElement): LabScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2b2f38');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 4.5, 13);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 3, 0);
  controls.update();

  scene.add(new THREE.HemisphereLight('#ffffff', '#555566', 1.1));
  const sun = new THREE.DirectionalLight('#ffffff', 2);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    new THREE.MeshStandardMaterial({ color: '#454a55', roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor, new THREE.GridHelper(16, 16, '#666c78', '#3a3f4a'));

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const run: LabScene['run'] = (update) => {
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      update(clock.getDelta(), clock.elapsedTime);
      controls.update();
      renderer.render(scene, camera);
    });
  };

  return { scene, camera, renderer, controls, run };
}
