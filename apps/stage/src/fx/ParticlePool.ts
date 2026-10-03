import * as THREE from 'three';
import { MAX_PARTICLES, ParticleSim } from './ParticleSim';
import type { EmitConfig } from './ParticleSim';

export class ParticlePool {
  readonly mesh: THREE.InstancedMesh;
  private readonly sim = new ParticleSim();
  private readonly matrix = new THREE.Matrix4();
  private readonly quaternion = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly scale = new THREE.Vector3();
  private readonly position = new THREE.Vector3();
  private time = 0;

  constructor() {
    const material = new THREE.MeshBasicMaterial({ toneMapped: false });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, MAX_PARTICLES);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_PARTICLES * 3),
      3,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }

  get aliveCount(): number {
    return this.sim.alive;
  }

  emit(config: EmitConfig): void {
    this.sim.emit(config);
  }

  clear(): void {
    this.sim.clear();
    this.mesh.count = 0;
  }

  update(deltaSeconds: number): void {
    this.time += deltaSeconds;
    this.sim.update(deltaSeconds);
    const sim = this.sim;
    const colors = this.mesh.instanceColor?.array as Float32Array;
    for (let index = 0; index < sim.alive; index += 1) {
      const base = index * 3;
      const fade = Math.min(1, ((sim.life[index] ?? 1) - (sim.age[index] ?? 0)) * 3);
      const size = (sim.size[index] ?? 0.1) * Math.max(0.05, fade);
      this.position.set(
        sim.position[base] ?? 0,
        sim.position[base + 1] ?? 0,
        sim.position[base + 2] ?? 0,
      );
      this.euler.set(this.time * 3 + index, this.time * 2 + index * 0.5, 0);
      this.quaternion.setFromEuler(this.euler);
      this.scale.setScalar(size);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.mesh.setMatrixAt(index, this.matrix);
      colors[base] = sim.color[base] ?? 1;
      colors[base + 1] = sim.color[base + 1] ?? 1;
      colors[base + 2] = sim.color[base + 2] ?? 1;
    }
    this.mesh.count = sim.alive;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
