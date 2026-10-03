import type { EventSourceKind } from '@bloxdance/shared';
import type { InputEvent, ViewerRef } from '../game/inputEvents.js';
import type { EventSource, SourceStatus } from './EventSource.js';
import { CHAT_LINES, SIMULATED_GIFTS, SIMULATED_VIEWERS } from './simulatorPopulation.js';
import type { SimulatedGift } from './simulatorPopulation.js';

const DEFAULT_STORM_RATE = 6;
const MAX_STREAK = 6;

export class SimulatorSource implements EventSource {
  readonly kind: EventSourceKind = 'simulator';
  private emit: ((event: InputEvent) => void) | null = null;
  private stormEndsAt = 0;
  private stormRate = DEFAULT_STORM_RATE;
  private lastStep = 0;
  private carry = 0;

  constructor(private readonly random: () => number = Math.random) {}

  start(emit: (event: InputEvent) => void): void {
    this.emit = emit;
  }

  stop(): void {
    this.emit = null;
    this.stormEndsAt = 0;
  }

  status(): SourceStatus {
    return { connected: this.emit !== null, detail: this.stormEndsAt > 0 ? 'storm' : 'manual' };
  }

  inject(event: InputEvent): void {
    this.emit?.(event);
  }

  startStorm(now: number, durationMs: number, eventsPerSecond = DEFAULT_STORM_RATE): void {
    this.stormEndsAt = now + durationMs;
    this.stormRate = eventsPerSecond;
    this.lastStep = now;
    this.carry = 0;
  }

  stopStorm(): void {
    this.stormEndsAt = 0;
  }

  isStorming(): boolean {
    return this.stormEndsAt > 0;
  }

  step(now: number): void {
    if (this.stormEndsAt === 0) return;
    const until = Math.min(now, this.stormEndsAt);
    this.carry += ((until - this.lastStep) / 1000) * this.stormRate;
    this.lastStep = until;
    while (this.carry >= 1) {
      this.carry -= 1;
      this.randomEvent();
    }
    if (now >= this.stormEndsAt) this.stormEndsAt = 0;
  }

  chat(viewer: ViewerRef, text: string): void {
    this.inject({ kind: 'chat', ...viewer, text });
  }

  gift(viewer: ViewerRef, gift: SimulatedGift, repeatCount = 1): void {
    const base = {
      kind: 'gift' as const,
      ...viewer,
      giftName: gift.name,
      diamondCount: gift.diamonds,
    };
    if (!gift.streakable) {
      this.inject({ ...base, repeatCount: 1, repeatEnd: true, streakable: false });
      return;
    }
    for (let count = 1; count < repeatCount; count += 1) {
      this.inject({ ...base, repeatCount: count, repeatEnd: false, streakable: true });
    }
    this.inject({ ...base, repeatCount, repeatEnd: true, streakable: true });
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(this.random() * items.length)] as T;
  }

  private pickGift(): SimulatedGift {
    const total = SIMULATED_GIFTS.reduce((sum, gift) => sum + gift.weight, 0);
    let roll = this.random() * total;
    for (const gift of SIMULATED_GIFTS) {
      roll -= gift.weight;
      if (roll <= 0) return gift;
    }
    return SIMULATED_GIFTS[0] as SimulatedGift;
  }

  private randomEvent(): void {
    const viewer = this.pick(SIMULATED_VIEWERS);
    const roll = this.random();
    if (roll < 0.25) this.chat(viewer, this.pick(CHAT_LINES));
    else if (roll < 0.6)
      this.inject({ kind: 'like', ...viewer, likeCount: 1 + Math.floor(this.random() * 15) });
    else if (roll < 0.82)
      this.gift(viewer, this.pickGift(), 1 + Math.floor(this.random() * MAX_STREAK));
    else if (roll < 0.92) this.inject({ kind: 'follow', ...viewer });
    else this.inject({ kind: 'share', ...viewer });
  }
}
