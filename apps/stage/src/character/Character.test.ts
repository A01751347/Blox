import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Character } from './Character';

function worldPosition(object: THREE.Object3D): THREE.Vector3 {
  object.updateWorldMatrix(true, false);
  return object.getWorldPosition(new THREE.Vector3());
}

function worldBox(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

describe('Character rig', () => {
  it('stands on the ground with the plan proportions', () => {
    const character = new Character();
    const body = worldBox(character.root);
    expect(body.min.y).toBeCloseTo(0, 5);
    expect(body.max.y).toBeCloseTo(2 + 2 + 1.3, 5);
  });

  it('keeps the shoulder pivot fixed when the arm rotates', () => {
    const character = new Character();
    const before = worldPosition(character.joints.shoulderL);
    character.setJoint('shoulderL', [90, 20, 45]);
    const after = worldPosition(character.joints.shoulderL);
    expect(after.distanceTo(before)).toBeLessThan(1e-9);
  });

  it('keeps the top of the arm at the shoulder pivot 0.25 below the arm top', () => {
    const character = new Character();
    const armTopBefore = worldBox(character.parts.armL).max.y;
    const shoulder = worldPosition(character.joints.shoulderL);
    expect(armTopBefore - shoulder.y).toBeCloseTo(0.25, 5);
  });

  it('rotates a leg about the hip edge', () => {
    const character = new Character();
    const hipPivot = worldPosition(character.joints.legL);
    character.setJoint('legL', [-60, 0, 0]);
    expect(worldPosition(character.joints.legL).distanceTo(hipPivot)).toBeLessThan(1e-9);
    const leg = worldBox(character.parts.legL);
    expect(leg.max.y).toBeLessThanOrEqual(hipPivot.y + 0.6);
  });

  it('attaches limbs flush against the torso at rest', () => {
    const character = new Character();
    const torso = worldBox(character.parts.torso);
    const armL = worldBox(character.parts.armL);
    const armR = worldBox(character.parts.armR);
    const legL = worldBox(character.parts.legL);
    expect(armL.max.x).toBeCloseTo(torso.min.x, 5);
    expect(armR.min.x).toBeCloseTo(torso.max.x, 5);
    expect(legL.max.y).toBeCloseTo(torso.min.y, 5);
  });

  it('round-trips joint rotations in degrees', () => {
    const character = new Character();
    character.setJoint('torso', [10, 20, 30]);
    const [x, y, z] = character.getJoint('torso');
    expect([x, y, z].map((value) => Math.round(value))).toEqual([10, 20, 30]);
  });
});
