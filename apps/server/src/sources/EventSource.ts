import type { EventSourceKind } from '@bloxdance/shared';
import type { InputEvent } from '../game/inputEvents.js';

export interface SourceStatus {
  connected: boolean;
  detail: string;
}

export interface EventSource {
  readonly kind: EventSourceKind;
  start(emit: (event: InputEvent) => void): void;
  stop(): void;
  status(): SourceStatus;
}
