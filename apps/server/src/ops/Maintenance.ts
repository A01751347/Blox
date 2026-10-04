import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { GameDatabase } from '../db/Database.js';

const DAY_MS = 86_400_000;
export const BACKUP_PREFIX = 'bloxdance-';

export interface MaintenanceOptions {
  backupDir: string | null;
  backupsToKeep: number;
  rawRetentionDays: number;
  now: () => number;
}

export function backupFileName(timestamp: number): string {
  return `${BACKUP_PREFIX}${new Date(timestamp).toISOString().slice(0, 10)}.sqlite`;
}

export function backupsToDelete(files: string[], keep: number): string[] {
  const sorted = files.filter((file) => file.startsWith(BACKUP_PREFIX)).sort();
  return sorted.slice(0, Math.max(0, sorted.length - keep));
}

export class Maintenance {
  constructor(
    private readonly database: GameDatabase,
    private readonly options: MaintenanceOptions,
  ) {}

  pruneRawEvents(): number {
    const cutoff = this.options.now() - this.options.rawRetentionDays * DAY_MS;
    return this.database.raw.prepare('DELETE FROM raw_events WHERE at < ?').run(cutoff).changes;
  }

  async backup(): Promise<string | null> {
    const directory = this.options.backupDir;
    if (!directory) return null;
    mkdirSync(directory, { recursive: true });
    const target = join(directory, backupFileName(this.options.now()));
    await this.database.raw.backup(target);
    backupsToDelete(readdirSync(directory), this.options.backupsToKeep).forEach((file) =>
      rmSync(join(directory, file), { force: true }),
    );
    return target;
  }

  async runAll(): Promise<void> {
    this.pruneRawEvents();
    await this.backup();
    this.database.raw.pragma('wal_checkpoint(TRUNCATE)');
  }
}
