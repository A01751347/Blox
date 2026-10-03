import * as THREE from 'three';
import expressionsJson from '../../data/expressions.json';
import { drawEyes, FACE_TEXTURE_SIZE } from './eyePieces';
import { drawExtra } from './extraPieces';
import { drawMouth } from './mouthPieces';
import type { ExpressionName, ExpressionOverride, FaceSpec } from './faceTypes';

const expressions = expressionsJson as Record<ExpressionName, ExpressionOverride>;

const BLINK_DURATION_SECONDS = 0.12;
const BLINK_MIN_INTERVAL_SECONDS = 3;
const BLINK_MAX_INTERVAL_SECONDS = 5;

export function resolveFace(base: FaceSpec, expression: ExpressionName): FaceSpec {
  const override = expressions[expression];
  const keepsShades = base.eyes === 'shades';
  return {
    eyes: keepsShades ? base.eyes : (override.eyes ?? base.eyes),
    mouth: override.mouth ?? base.mouth,
    extras: [...new Set([...base.extras, ...(override.extras ?? [])])],
  };
}

export function nextBlinkInterval(random: () => number): number {
  return (
    BLINK_MIN_INTERVAL_SECONDS +
    random() * (BLINK_MAX_INTERVAL_SECONDS - BLINK_MIN_INTERVAL_SECONDS)
  );
}

export class FaceController {
  readonly texture: THREE.CanvasTexture;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private expression: ExpressionName = 'idle';
  private blinkTimer: number;
  private blinkRemaining = 0;
  private drawnKey = '';

  constructor(
    private readonly base: FaceSpec,
    private readonly skinTone: string,
    private readonly random: () => number = Math.random,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = FACE_TEXTURE_SIZE;
    this.canvas.height = FACE_TEXTURE_SIZE;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('2D canvas context unavailable');
    this.context = context;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.blinkTimer = nextBlinkInterval(random);
    this.redraw();
  }

  setExpression(expression: ExpressionName): void {
    this.expression = expression;
    this.redraw();
  }

  getExpression(): ExpressionName {
    return this.expression;
  }

  isBlinking(): boolean {
    return this.blinkRemaining > 0;
  }

  update(deltaSeconds: number): void {
    if (this.blinkRemaining > 0) {
      this.blinkRemaining -= deltaSeconds;
      if (this.blinkRemaining <= 0) {
        this.blinkRemaining = 0;
        this.blinkTimer = nextBlinkInterval(this.random);
      }
    } else {
      this.blinkTimer -= deltaSeconds;
      if (this.blinkTimer <= 0) this.blinkRemaining = BLINK_DURATION_SECONDS;
    }
    this.redraw();
  }

  dispose(): void {
    this.texture.dispose();
  }

  private redraw(): void {
    const face = resolveFace(this.base, this.expression);
    const eyes = this.isBlinking() && face.eyes !== 'shades' ? 'closed' : face.eyes;
    const key = `${eyes}|${face.mouth}|${face.extras.join(',')}`;
    if (key === this.drawnKey) return;
    this.drawnKey = key;
    const ctx = this.context;
    ctx.clearRect(0, 0, FACE_TEXTURE_SIZE, FACE_TEXTURE_SIZE);
    ctx.fillStyle = this.skinTone;
    ctx.fillRect(0, 0, FACE_TEXTURE_SIZE, FACE_TEXTURE_SIZE);
    face.extras.forEach((extra) => drawExtra(ctx, extra));
    drawEyes(ctx, eyes);
    drawMouth(ctx, face.mouth);
    this.texture.needsUpdate = true;
  }
}
