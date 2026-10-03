import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { GENERAL_CAMERA } from './layout';

function run(rig: CameraRig, seconds: number): void {
  for (let step = 0; step < seconds * 60; step += 1) rig.update(1 / 60);
}

describe('CameraRig', () => {
  it('starts in the general shot', () => {
    const rig = new CameraRig(new THREE.PerspectiveCamera());
    expect(rig.camera.position.distanceTo(GENERAL_CAMERA.position)).toBeLessThan(1e-6);
  });

  it('zooms to a team and returns to the general shot after 2.5 seconds', () => {
    const rig = new CameraRig(new THREE.PerspectiveCamera());
    rig.zoomToTeam('yellow');
    run(rig, 2);
    expect(rig.currentMode()).toBe('zoom');
    expect(rig.camera.position.distanceTo(GENERAL_CAMERA.position)).toBeGreaterThan(10);
    run(rig, 5);
    expect(rig.currentMode()).toBe('general');
    expect(rig.camera.position.distanceTo(GENERAL_CAMERA.position)).toBeLessThan(0.5);
  });

  it('never jumps more than a small distance in a single frame', () => {
    const rig = new CameraRig(new THREE.PerspectiveCamera());
    rig.zoomToTeam('red');
    let largest = 0;
    for (let step = 0; step < 300; step += 1) {
      const before = rig.camera.position.clone();
      rig.update(1 / 60);
      largest = Math.max(largest, before.distanceTo(rig.camera.position));
    }
    expect(largest).toBeLessThan(1.5);
  });

  it('keeps the orbit on a gentle arc around the podium', () => {
    const rig = new CameraRig(new THREE.PerspectiveCamera());
    rig.startOrbit();
    run(rig, 20);
    expect(rig.currentMode()).toBe('orbit');
    expect(Math.abs(rig.camera.position.x)).toBeLessThan(15);
  });
});
