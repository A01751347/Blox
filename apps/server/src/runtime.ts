import { STATE_BROADCAST_INTERVAL_MS } from '@bloxdance/shared';
import { GameDatabase } from './db/Database.js';
import { GameEngine } from './game/GameEngine.js';
import { ModerationService } from './moderation/ModerationService.js';
import { Hub } from './net/Hub.js';
import { Maintenance } from './ops/Maintenance.js';
import type { MaintenanceOptions } from './ops/Maintenance.js';
import type { InputEvent } from './game/inputEvents.js';
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
  maintenance?: Partial<Omit<MaintenanceOptions, 'now'>>;
}

const MAINTENANCE_INTERVAL_MS = 6 * 3_600_000;
const DEFAULT_BACKUPS_TO_KEEP = 7;
const DEFAULT_RAW_RETENTION_DAYS = 7;

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
  private maintenanceTimer: NodeJS.Timeout | null = null;
  private readonly maintenance: Maintenance;
  private readonly startedAt: number;
  private lastTickAt: number;
  private readonly ingested = new Map<string, number>();

  constructor(private readonly options: RuntimeOptions = {}) {
    this.now = options.now ?? Date.now;
    this.startedAt = this.now();
    this.lastTickAt = this.startedAt;
    this.database = new GameDatabase(options.dbPath ?? ':memory:', this.now);
    this.moderation = new ModerationService(this.database);
    this.engine = new GameEngine({
      now: this.now,
      recorder: this.database,
      toDisplayName: this.moderation.displayName,
    });
    this.simulator = new SimulatorSource(options.random);
    this.maintenance = new Maintenance(this.database, {
      backupDir: options.maintenance?.backupDir ?? null,
      backupsToKeep: options.maintenance?.backupsToKeep ?? DEFAULT_BACKUPS_TO_KEEP,
      rawRetentionDays: options.maintenance?.rawRetentionDays ?? DEFAULT_RAW_RETENTION_DAYS,
      now: this.now,
    });
    this.simulator.start((event) => this.ingest('simulator', event));
    this.engine.onFx((event) => this.hub.broadcast({ type: 'fx', event }));
  }

  ingest(source: string, event: InputEvent): void {
    const key = `${source}|${event.kind}`;
    this.ingested.set(key, (this.ingested.get(key) ?? 0) + 1);
    this.engine.handle(event);
  }

  ingestCounts(): Array<{ source: string; kind: string; count: number }> {
    return [...this.ingested.entries()].map(([key, count]) => {
      const [source = '', kind = ''] = key.split('|');
      return { source, kind, count };
    });
  }

  uptimeSeconds(): number {
    return Math.floor((this.now() - this.startedAt) / 1000);
  }

  tickAgeMs(): number {
    return this.now() - this.lastTickAt;
  }

  runMaintenance(): Promise<void> {
    return this.maintenance.runAll();
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
    this.tiktokSource.start((event) => this.ingest('tiktok', event));
  }

  disconnectTikTok(): void {
    this.tiktokSource?.stop();
    this.tiktokSource = null;
    this.engine.setSource('simulator');
    this.tiktokStatus = { connected: false, detail: 'not configured' };
  }

  tick(): void {
    this.lastTickAt = this.now();
    this.simulator.step(this.now());
    this.engine.tick();
    this.hub.broadcast({ type: 'state', state: this.engine.getState() });
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), STATE_BROADCAST_INTERVAL_MS);
    void this.runMaintenance().catch(() => undefined);
    this.maintenanceTimer = setInterval(
      () => void this.runMaintenance().catch(() => undefined),
      MAINTENANCE_INTERVAL_MS,
    );
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.maintenanceTimer) clearInterval(this.maintenanceTimer);
    this.timer = null;
    this.maintenanceTimer = null;
    this.simulator.stop();
    this.disconnectTikTok();
    this.database.close();
  }
}
