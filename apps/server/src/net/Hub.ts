import type { ServerMessage } from '@bloxdance/shared';

export interface HubClient {
  send(data: string): void;
}

export class Hub {
  private readonly clients = new Set<HubClient>();

  add(client: HubClient): void {
    this.clients.add(client);
  }

  remove(client: HubClient): void {
    this.clients.delete(client);
  }

  get size(): number {
    return this.clients.size;
  }

  broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => client.send(payload));
  }
}
