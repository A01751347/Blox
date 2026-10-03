import { STATE_BROADCAST_INTERVAL_MS } from '@bloxdance/shared';
import { GameDatabase } from './db/Database.js';
import { GameEngine } from './game/GameEngine.js';
import { ModerationService } from './moderation/ModerationService.js';
import { Hub } from './net/Hub.js';
import { SimulatorSource } from './sources/SimulatorSource.js';
import { TikTokSource } from './sources/TikTokSource.js';
import type { ConnectionLike } from './sources/TikTokSource.js';
import { safeStringify } from './sources/tiktokNormalize.js';
import type { SourceStatus } from './sources/EventSource.js';

export interface RuntimeOptions {
  createConnection?: (username: string) => ConnectionLike;
  now?: () => number;
  dbPath?: string;
  random?: () => number;
}

export class GameRuntime {
  readonly now: () => number;
  readonly database: GameDatabase;
  readonly moderation: ModerationService;
  readonly engine: GameEngine;
  readonly simulator: SimulatorSource;
  readonly hub = new Hub();
  private tiktokSource: TikTokSource | null = null;
  private tiktokUsername: string | null = null;
  private tiktokStatus: SourceStatus = { connected: false, detail: 'not configured' };
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly options: RuntimeOptions = {}) {
    this.now = options.now ?? Date.now;
    this.database = new GameDatabase(options.dbPath ?? ':memory:', this.now);
    this.moderation = new ModerationService(this.database);
    this.engine = new GameEngine({
      now: this.now,
      recorder: this.database,
      toDisplayName: this.moderation.displayName,
    });
    this.simulator = new SimulatorSource(options.random);
    this.simulator.start((event) => this.engine.handle(event));
    this.engine.onFx((event) => this.hub.broadcast({ type: 'fx', event }));
  }

  tiktokInfo(): SourceStatus & { username: string | null } {
    return { ...this.tiktokStatus, username: this.tiktokUsername };
  }

  connectTikTok(username: string): void {
    this.disconnectTikTok();
    const createConnection = this.options.createConnection;
    if (!createConnection) throw new Error('No TikTok connection factory configured');
    this.tiktokUsername = username;
    this.tiktokSource = new TikTokSource({
      username,
      createConnection,
      onRaw: (type, payload) =>
        this.database.recordRaw(this.now(), 'tiktok', type, safeStringify(payload)),
      onStatusChange: (status) => {
        this.tiktokStatus = status;
        this.engine.setSource(status.connected ? 'tiktok' : 'simulator');
      },
    });
    this.tiktokSource.start((event) => this.engine.handle(event));
  }

  disconnectTikTok(): void {
    this.tiktokSource?.stop();
    this.tiktokSource = null;
    this.engine.setSource('simulator');
    this.tiktokStatus = { connected: false, detail: 'not configured' };
  }

  tick(): void {
    this.simulator.step(this.now());
    this.engine.tick();
    this.hub.broadcast({ type: 'state', state: this.engine.getState() });
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), STATE_BROADCAST_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.simulator.stop();
    this.disconnectTikTok();
    this.database.close();
  }
}
