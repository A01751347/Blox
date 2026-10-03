import { STAGE_HEIGHT, STAGE_WIDTH } from '@bloxdance/shared';

export const TIKTOK_BOTTOM_RESERVED_PX = 600;
export const TIKTOK_RIGHT_RESERVED_PX = 160;
export const TOP_ZONE = { top: 180, bottom: 420 } as const;

export const SAFE_AREA = {
  left: 0,
  top: 0,
  right: STAGE_WIDTH - TIKTOK_RIGHT_RESERVED_PX,
  bottom: STAGE_HEIGHT - TIKTOK_BOTTOM_RESERVED_PX,
} as const;
