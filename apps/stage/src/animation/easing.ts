import type { EasingName } from './types';

const BACK_OVERSHOOT = 1.70158;
const BOUNCE_STRENGTH = 7.5625;
const BOUNCE_DIVISOR = 2.75;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function backOut(t: number): number {
  const c3 = BACK_OVERSHOOT + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + BACK_OVERSHOOT * Math.pow(t - 1, 2);
}

function bounce(t: number): number {
  if (t < 1 / BOUNCE_DIVISOR) return BOUNCE_STRENGTH * t * t;
  if (t < 2 / BOUNCE_DIVISOR) {
    const shifted = t - 1.5 / BOUNCE_DIVISOR;
    return BOUNCE_STRENGTH * shifted * shifted + 0.75;
  }
  if (t < 2.5 / BOUNCE_DIVISOR) {
    const shifted = t - 2.25 / BOUNCE_DIVISOR;
    return BOUNCE_STRENGTH * shifted * shifted + 0.9375;
  }
  const shifted = t - 2.625 / BOUNCE_DIVISOR;
  return BOUNCE_STRENGTH * shifted * shifted + 0.984375;
}

const EASING_FUNCTIONS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeInOut,
  backOut,
  bounce,
  step: (t) => (t >= 1 ? 1 : 0),
};

export function applyEasing(name: EasingName, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return EASING_FUNCTIONS[name](clamped);
}
