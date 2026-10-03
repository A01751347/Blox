import { TikTokLiveConnection } from 'tiktok-live-connector';
import type { ConnectionLike } from './TikTokSource.js';

export function createLiveConnection(username: string): ConnectionLike {
  const connection = new TikTokLiveConnection(username, {
    enableExtendedGiftInfo: true,
    ...(process.env.SIGN_API_KEY ? { signApiKey: process.env.SIGN_API_KEY } : {}),
  });
  return {
    on: (event, handler) => {
      (connection as unknown as { on: (name: string, fn: (payload: unknown) => void) => void }).on(
        event,
        handler,
      );
    },
    connect: () => connection.connect(),
    disconnect: () => connection.disconnect(),
  };
}
