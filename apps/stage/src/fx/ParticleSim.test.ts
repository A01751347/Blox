import { describe, expect, it } from 'vitest';
import { MAX_PARTICLES, ParticleSim } from './ParticleSim';
import type { EmitConfig } from './ParticleSim';

const BASE: EmitConfig = {
  position: [0, 1, 0],
  count: 100,
  speed: 5,
  spread: 1,
  upwardBias: 0.5,
  life: 1,
  size: 0.2,
  gravity: 9.8,
  colors: [[1, 0, 0]],
};

describe('ParticleSim', () => {
  it('never exceeds 2000 live particles', () => {
    const sim = new ParticleSim();
    for (let burst = 0; burst < 40; burst += 1) sim.emit({ ...BASE, count: 200 });
    expect(sim.alive).toBe(MAX_PARTICLES);
    expect(sim.emit(BASE)).toBe(0);
  });

  it('removes particles when their life ends', () => {
    const sim = new ParticleSim();
    sim.emit({ ...BASE, count: 50, life: 0.5 });
    sim.update(0.2);
    expect(sim.alive).toBe(50);
    sim.update(1);
    expect(sim.alive).toBe(0);
  });

  it('applies gravity so particles eventually fall', () => {
    const sim = new ParticleSim(() => 0.5);
    sim.emit({ ...BASE, count: 1, upwardBias: 0, life: 10 });
    for (let step = 0; step < 120; step += 1) sim.update(1 / 60);
    expect(sim.position[1]).toBeLessThan(1);
  });

  it('keeps remaining particles intact after removals', () => {
    const sim = new ParticleSim();
    sim.emit({ ...BASE, count: 10, life: 0.1, colors: [[1, 0, 0]] });
    sim.emit({ ...BASE, count: 10, life: 5, colors: [[0, 1, 0]] });
    sim.update(0.5);
    expect(sim.alive).toBe(10);
    for (let index = 0; index < sim.alive; index += 1) expect(sim.color[index * 3 + 1]).toBe(1);
  });
});
