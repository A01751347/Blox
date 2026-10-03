import { STATE_BROADCAST_INTERVAL_MS } from '@bloxdance/shared';
import { GameDatabase } from './db/Database.js';
import { GameEngine } from './game/GameEngine.js';
import { Hub } from './net/Hub.js';
import { SimulatorSource } from './sources/SimulatorSource.js';
import { TikTokSource } from './sources/tiktok.js';

export interface RuntimeOptions {
  now?: () => number;
  dbPath?: string;
  random?: () => number;
}

export class GameRuntime {
  readonly now: () => number;
  readonly database: GameDatabase;
  readonly engine: GameEngine;
  readonly simulator: SimulatorSource;
  readonly tiktok = new TikTokSource();
  readonly hub = new Hub();
  private timer: NodeJS.Timeout | null = null;

  constructor(options: RuntimeOptions = {}) {
    this.now = options.now ?? Date.now;
    this.database = new GameDatabase(options.dbPath ?? ':memory:', this.now);
    this.engine = new GameEngine({ now: this.now, recorder: this.database });
    this.simulator = new SimulatorSource(options.random);
    this.simulator.start((event) => this.engine.handle(event));
    this.engine.onFx((event) => this.hub.broadcast({ type: 'fx', event }));
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
    this.database.close();
  }
}
