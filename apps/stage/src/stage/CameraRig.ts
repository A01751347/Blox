import * as THREE from 'three';
import { GENERAL_CAMERA, PODIUM_Z, platformPosition } from './layout';
import type { TeamId } from '@bloxdance/shared';

const SMOOTHING_SECONDS = 0.45;
const ZOOM_HOLD_SECONDS = 2.5;
const ORBIT_RADIUS = 20;
const ORBIT_SWING_RADIANS = 0.6;
const ORBIT_SPEED = 0.35;
const FINAL_PUSH_IN = 0.86;

type Mode = 'general' | 'zoom' | 'orbit';

export class CameraRig {
  private mode: Mode = 'general';
  private zoomTeam: TeamId = 'red';
  private zoomRemaining = 0;
  private finalPush = false;
  private orbitAngle = 0;
  private readonly desiredPosition = GENERAL_CAMERA.position.clone();
  private readonly desiredTarget = GENERAL_CAMERA.target.clone();
  private readonly currentTarget = GENERAL_CAMERA.target.clone();

  constructor(readonly camera: THREE.PerspectiveCamera) {
    camera.position.copy(GENERAL_CAMERA.position);
    camera.lookAt(this.currentTarget);
  }

  currentMode(): Mode {
    return this.mode;
  }

  zoomToTeam(team: TeamId): void {
    if (this.mode === 'orbit') return;
    this.mode = 'zoom';
    this.zoomTeam = team;
    this.zoomRemaining = ZOOM_HOLD_SECONDS;
  }

  setFinalPush(enabled: boolean): void {
    this.finalPush = enabled;
  }

  startOrbit(): void {
    this.mode = 'orbit';
    this.orbitAngle = 0;
  }

  reset(): void {
    this.mode = 'general';
    this.zoomRemaining = 0;
    this.finalPush = false;
  }

  update(deltaSeconds: number): void {
    this.updateGoals(deltaSeconds);
    const blend = 1 - Math.exp(-deltaSeconds / SMOOTHING_SECONDS);
    this.camera.position.lerp(this.desiredPosition, blend);
    this.currentTarget.lerp(this.desiredTarget, blend);
    this.camera.lookAt(this.currentTarget);
  }

  private updateGoals(deltaSeconds: number): void {
    if (this.mode === 'zoom') {
      this.zoomRemaining -= deltaSeconds;
      if (this.zoomRemaining <= 0) this.mode = 'general';
    }
    if (this.mode === 'zoom') {
      const platform = platformPosition(this.zoomTeam);
      this.desiredPosition.set(platform.x * 0.6, 7, platform.z + 14);
      this.desiredTarget.set(platform.x, 3.4, platform.z);
      return;
    }
    if (this.mode === 'orbit') {
      this.orbitAngle += deltaSeconds * ORBIT_SPEED;
      const swing = Math.sin(this.orbitAngle) * ORBIT_SWING_RADIANS;
      this.desiredPosition.set(
        Math.sin(swing) * ORBIT_RADIUS,
        7,
        PODIUM_Z + Math.cos(swing) * ORBIT_RADIUS,
      );
      this.desiredTarget.set(0, 3, PODIUM_Z);
      return;
    }
    const factor = this.finalPush ? FINAL_PUSH_IN : 1;
    this.desiredPosition.copy(GENERAL_CAMERA.target).lerp(GENERAL_CAMERA.position, factor);
    this.desiredTarget.copy(GENERAL_CAMERA.target);
  }
}
