import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { rigSpec } from '../rigBuilder';

const ACCESSORY_BEVEL = 0.04;
const ACCESSORY_SEGMENTS = 2;

export function accessoryMaterial(color: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rigSpec.material.roughness,
    metalness: rigSpec.material.metalness,
  });
}

export function placeMesh(
  mesh: THREE.Mesh,
  position: THREE.Vector3Tuple,
  rotation: THREE.Vector3Tuple = [0, 0, 0],
): THREE.Mesh {
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  return mesh;
}

export function box(
  size: THREE.Vector3Tuple,
  color: THREE.ColorRepresentation,
  position: THREE.Vector3Tuple,
  rotation: THREE.Vector3Tuple = [0, 0, 0],
): THREE.Mesh {
  const [width, height, depth] = size;
  const bevel = Math.min(ACCESSORY_BEVEL, width / 2.2, height / 2.2, depth / 2.2);
  const geometry = new RoundedBoxGeometry(width, height, depth, ACCESSORY_SEGMENTS, bevel);
  return placeMesh(new THREE.Mesh(geometry, accessoryMaterial(color)), position, rotation);
}

export function cone(
  radius: number,
  height: number,
  color: THREE.ColorRepresentation,
  position: THREE.Vector3Tuple,
  radialSegments = 4,
  rotation: THREE.Vector3Tuple = [0, 0, 0],
): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
  return placeMesh(new THREE.Mesh(geometry, accessoryMaterial(color)), position, rotation);
}

export function cylinder(
  radius: number,
  height: number,
  color: THREE.ColorRepresentation,
  position: THREE.Vector3Tuple,
  rotation: THREE.Vector3Tuple = [0, 0, 0],
): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
  return placeMesh(new THREE.Mesh(geometry, accessoryMaterial(color)), position, rotation);
}

export function group(children: THREE.Object3D[]): THREE.Group {
  const result = new THREE.Group();
  result.add(...children);
  return result;
}
