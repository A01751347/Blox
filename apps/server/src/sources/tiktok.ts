import type { InputEvent } from '../game/inputEvents.js';
import type { EventSource, SourceStatus } from './EventSource.js';

export class TikTokSource implements EventSource {
  readonly kind = 'tiktok' as const;

  start(emit: (event: InputEvent) => void): void {
    void emit;
  }

  stop(): void {
    return;
  }

  status(): SourceStatus {
    return { connected: false, detail: 'not configured' };
  }
}
