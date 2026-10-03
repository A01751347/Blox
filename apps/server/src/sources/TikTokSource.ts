import type { InputEvent } from '../game/inputEvents.js';
import type { EventSource, SourceStatus } from './EventSource.js';
import {
  normalizeChat,
  normalizeFollow,
  normalizeGift,
  normalizeLike,
  normalizeShare,
} from './tiktokNormalize.js';

export interface ConnectionLike {
  on(event: string, handler: (payload: unknown) => void): void;
  connect(): Promise<unknown>;
  disconnect(): Promise<unknown>;
}

export interface TikTokSourceOptions {
  username: string;
  createConnection: (username: string) => ConnectionLike;
  onRaw?: (type: string, payload: unknown) => void;
  onStatusChange?: (status: SourceStatus) => void;
  schedule?: (callback: () => void, delayMs: number) => unknown;
  cancel?: (handle: unknown) => void;
}

export const BACKOFF_BASE_MS = 1000;
export const BACKOFF_MAX_MS = 60_000;
export const FAILURES_BEFORE_NOTICE = 3;

type Normalizer = (raw: unknown) => InputEvent | null;

const NORMALIZERS: Record<string, Normalizer> = {
  chat: normalizeChat,
  gift: normalizeGift,
  like: normalizeLike,
  follow: normalizeFollow,
  share: normalizeShare,
};

export function backoffDelay(failures: number): number {
  return Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, failures - 1));
}

export class TikTokSource implements EventSource {
  readonly kind = 'tiktok' as const;
  private emit: ((event: InputEvent) => void) | null = null;
  private connection: ConnectionLike | null = null;
  private connected = false;
  private failures = 0;
  private lastError = '';
  private timer: unknown = null;
  private stopped = true;
  private readonly schedule: (callback: () => void, delayMs: number) => unknown;
  private readonly cancel: (handle: unknown) => void;

  constructor(private readonly options: TikTokSourceOptions) {
    this.schedule = options.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs));
    this.cancel = options.cancel ?? ((handle) => clearTimeout(handle as NodeJS.Timeout));
  }

  start(emit: (event: InputEvent) => void): void {
    this.emit = emit;
    this.stopped = false;
    this.failures = 0;
    void this.attempt();
  }

  stop(): void {
    this.stopped = true;
    this.emit = null;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.connected = false;
    const connection = this.connection;
    this.connection = null;
    void connection?.disconnect().catch(() => undefined);
    this.publishStatus();
  }

  status(): SourceStatus {
    if (this.connected) return { connected: true, detail: 'connected' };
    if (this.stopped) return { connected: false, detail: 'stopped' };
    if (this.failures >= FAILURES_BEFORE_NOTICE) {
      return {
        connected: false,
        detail: `failed ${this.failures} times (${this.lastError}); simulator in use, retrying`,
      };
    }
    return {
      connected: false,
      detail: this.failures === 0 ? 'connecting' : `retrying (${this.failures})`,
    };
  }

  failureCount(): number {
    return this.failures;
  }

  private async attempt(): Promise<void> {
    if (this.stopped) return;
    const connection = this.options.createConnection(this.options.username);
    this.connection = connection;
    this.bind(connection);
    this.publishStatus();
    try {
      await connection.connect();
      if (this.stopped) return;
      this.connected = true;
      this.failures = 0;
      this.publishStatus();
    } catch (error) {
      this.handleFailure(error);
    }
  }

  private bind(connection: ConnectionLike): void {
    Object.entries(NORMALIZERS).forEach(([type, normalize]) => {
      connection.on(type, (payload) => {
        this.options.onRaw?.(type, payload);
        const event = normalize(payload);
        if (event) this.emit?.(event);
      });
    });
    connection.on('disconnected', () => {
      if (!this.connected) return;
      this.connected = false;
      this.handleFailure(new Error('disconnected'));
    });
    connection.on('error', (error) => this.options.onRaw?.('error', error));
  }

  private handleFailure(error: unknown): void {
    if (this.stopped) return;
    this.connected = false;
    this.failures += 1;
    this.lastError = error instanceof Error ? error.message : String(error);
    this.publishStatus();
    this.timer = this.schedule(() => void this.attempt(), backoffDelay(this.failures));
  }

  private publishStatus(): void {
    this.options.onStatusChange?.(this.status());
  }
}
