export const MAX_PARTICLES = 2000;

export interface EmitConfig {
  position: [number, number, number];
  count: number;
  speed: number;
  spread: number;
  upwardBias: number;
  life: number;
  size: number;
  gravity: number;
  colors: [number, number, number][];
}

export class ParticleSim {
  readonly position = new Float32Array(MAX_PARTICLES * 3);
  readonly velocity = new Float32Array(MAX_PARTICLES * 3);
  readonly color = new Float32Array(MAX_PARTICLES * 3);
  readonly age = new Float32Array(MAX_PARTICLES);
  readonly life = new Float32Array(MAX_PARTICLES);
  readonly size = new Float32Array(MAX_PARTICLES);
  readonly gravity = new Float32Array(MAX_PARTICLES);
  alive = 0;

  constructor(private readonly random: () => number = Math.random) {}

  emit(config: EmitConfig): number {
    const room = MAX_PARTICLES - this.alive;
    const count = Math.min(config.count, room);
    for (let n = 0; n < count; n += 1) this.spawn(config);
    return count;
  }

  update(deltaSeconds: number): void {
    let index = 0;
    while (index < this.alive) {
      this.age[index] = (this.age[index] ?? 0) + deltaSeconds;
      if ((this.age[index] ?? 0) >= (this.life[index] ?? 0)) {
        this.remove(index);
        continue;
      }
      const base = index * 3;
      this.velocity[base + 1] =
        (this.velocity[base + 1] ?? 0) - (this.gravity[index] ?? 0) * deltaSeconds;
      for (let axis = 0; axis < 3; axis += 1) {
        this.position[base + axis] =
          (this.position[base + axis] ?? 0) + (this.velocity[base + axis] ?? 0) * deltaSeconds;
      }
      index += 1;
    }
  }

  clear(): void {
    this.alive = 0;
  }

  private spawn(config: EmitConfig): void {
    const index = this.alive;
    const base = index * 3;
    const theta = this.random() * Math.PI * 2;
    const lift = this.random();
    const horizontal = Math.sqrt(1 - lift * lift) * config.spread;
    const speed = config.speed * (0.5 + this.random() * 0.5);
    this.position[base] = config.position[0];
    this.position[base + 1] = config.position[1];
    this.position[base + 2] = config.position[2];
    this.velocity[base] = Math.cos(theta) * horizontal * speed;
    this.velocity[base + 1] = (lift + config.upwardBias) * speed;
    this.velocity[base + 2] = Math.sin(theta) * horizontal * speed;
    const color = config.colors[Math.floor(this.random() * config.colors.length)] ?? [1, 1, 1];
    this.color[base] = color[0];
    this.color[base + 1] = color[1];
    this.color[base + 2] = color[2];
    this.age[index] = 0;
    this.life[index] = config.life * (0.7 + this.random() * 0.6);
    this.size[index] = config.size * (0.6 + this.random() * 0.8);
    this.gravity[index] = config.gravity;
    this.alive += 1;
  }

  private remove(index: number): void {
    const last = this.alive - 1;
    if (index !== last) {
      for (let axis = 0; axis < 3; axis += 1) {
        this.position[index * 3 + axis] = this.position[last * 3 + axis] ?? 0;
        this.velocity[index * 3 + axis] = this.velocity[last * 3 + axis] ?? 0;
        this.color[index * 3 + axis] = this.color[last * 3 + axis] ?? 0;
      }
      this.age[index] = this.age[last] ?? 0;
      this.life[index] = this.life[last] ?? 0;
      this.size[index] = this.size[last] ?? 0;
      this.gravity[index] = this.gravity[last] ?? 0;
    }
    this.alive = last;
  }
}
