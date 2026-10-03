export const MAX_VISIBLE_ALERTS = 3;
export const ALERT_DURATION_MS = 2500;
const MAX_QUEUED_ALERTS = 40;

export interface AlertItem {
  id: number;
  text: string;
  color: string;
}

interface ActiveAlert {
  item: AlertItem;
  expiresAt: number;
}

export class AlertScheduler {
  private readonly queue: AlertItem[] = [];
  private active: ActiveAlert[] = [];
  private nextId = 1;

  push(text: string, color: string): void {
    if (this.queue.length >= MAX_QUEUED_ALERTS) this.queue.shift();
    this.queue.push({ id: this.nextId++, text, color });
  }

  clear(): void {
    this.queue.length = 0;
    this.active = [];
  }

  update(now: number): AlertItem[] {
    this.active = this.active.filter((entry) => entry.expiresAt > now);
    while (this.active.length < MAX_VISIBLE_ALERTS && this.queue.length > 0) {
      const item = this.queue.shift() as AlertItem;
      this.active.push({ item, expiresAt: now + ALERT_DURATION_MS });
    }
    return this.active.map((entry) => entry.item);
  }

  pending(): number {
    return this.queue.length;
  }
}
