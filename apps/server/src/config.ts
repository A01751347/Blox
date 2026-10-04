import { dirname, join } from 'node:path';

export interface ServerConfig {
  port: number;
  dbPath: string;
  backupDir: string;
  backupsToKeep: number;
  rawRetentionDays: number;
  adminToken: string | undefined;
  logLevel: string;
  trustProxy: boolean;
  tiktokUsername: string | undefined;
}

type Env = Record<string, string | undefined>;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseConfig(env: Env): ServerConfig {
  const dbPath = env.DB_PATH || 'data/bloxdance.sqlite';
  const username = env.TIKTOK_USERNAME?.trim().replace(/^@/, '');
  return {
    port: positiveInteger(env.PORT, 3000),
    dbPath,
    backupDir: env.BACKUP_DIR || join(dirname(dbPath), 'backups'),
    backupsToKeep: positiveInteger(env.BACKUPS_TO_KEEP, 7),
    rawRetentionDays: positiveInteger(env.RAW_RETENTION_DAYS, 7),
    adminToken: env.ADMIN_TOKEN || undefined,
    logLevel: env.LOG_LEVEL || 'info',
    trustProxy: env.TRUST_PROXY === 'true',
    tiktokUsername: username || undefined,
  };
}
