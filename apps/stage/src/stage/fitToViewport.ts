import { STAGE_HEIGHT, STAGE_WIDTH } from '@bloxdance/shared';

export function fitFrameToViewport(frame: HTMLElement): void {
  const apply = () => {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    frame.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };
  apply();
  window.addEventListener('resize', apply);
}
