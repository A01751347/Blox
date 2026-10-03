import * as THREE from 'three';

const STIFFNESS = 90;
const DAMPING = 10;
const MAX_STEP_SECONDS = 1 / 30;
const MAX_SWAY_RADIANS = 0.18;
const SIDE_GAIN = 0.05;
const LIFT_GAIN = 0.03;

export function createHairSway(object: THREE.Object3D): (deltaSeconds: number) => void {
  const previous = new THREE.Vector3();
  const current = new THREE.Vector3();
  const sway = { x: 0, z: 0, vx: 0, vz: 0 };
  let initialised = false;

  return (deltaSeconds) => {
    if (deltaSeconds <= 0) return;
    object.getWorldPosition(current);
    if (!initialised) {
      previous.copy(current);
      initialised = true;
    }
    const velocityX = (current.x - previous.x) / deltaSeconds;
    const velocityY = (current.y - previous.y) / deltaSeconds;
    previous.copy(current);

    const step = Math.min(deltaSeconds, MAX_STEP_SECONDS);
    const targetZ = THREE.MathUtils.clamp(
      -velocityX * SIDE_GAIN,
      -MAX_SWAY_RADIANS,
      MAX_SWAY_RADIANS,
    );
    const targetX = THREE.MathUtils.clamp(
      -velocityY * LIFT_GAIN,
      -MAX_SWAY_RADIANS,
      MAX_SWAY_RADIANS,
    );
    sway.vz += (STIFFNESS * (targetZ - sway.z) - DAMPING * sway.vz) * step;
    sway.vx += (STIFFNESS * (targetX - sway.x) - DAMPING * sway.vx) * step;
    sway.z += sway.vz * step;
    sway.x += sway.vx * step;
    object.rotation.set(sway.x, 0, sway.z);
  };
}
