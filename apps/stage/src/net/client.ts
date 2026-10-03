import type { FxEvent, GameState, ServerMessage } from '@bloxdance/shared';

export interface ServerClientHandlers {
  onState: (state: GameState) => void;
  onFx: (event: FxEvent) => void;
  onStatus?: (connected: boolean) => void;
}

const RECONNECT_DELAY_MS = 1000;

export function connectToServer(handlers: ServerClientHandlers): void {
  const host = location.port === '5173' ? `${location.hostname}:3000` : location.host;
  const url = `ws://${host}/ws`;

  const open = () => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => handlers.onStatus?.(true));
    socket.addEventListener('message', (message) => {
      const parsed = JSON.parse(String(message.data)) as ServerMessage;
      if (parsed.type === 'state') handlers.onState(parsed.state);
      else handlers.onFx(parsed.event);
    });
    socket.addEventListener('close', () => {
      handlers.onStatus?.(false);
      setTimeout(open, RECONNECT_DELAY_MS);
    });
  };

  open();
}
