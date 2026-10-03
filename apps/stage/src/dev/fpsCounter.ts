export class FpsCounter {
  private readonly element: HTMLDivElement;
  private frames = 0;
  private windowStart = performance.now();

  constructor(parent: HTMLElement) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'position:absolute;left:12px;top:12px;padding:4px 10px;background:#000a;color:#0f0;' +
      'font:600 28px monospace;border-radius:6px;z-index:10';
    parent.appendChild(this.element);
  }

  tick(): void {
    this.frames += 1;
    const now = performance.now();
    if (now - this.windowStart >= 500) {
      const fps = Math.round((this.frames * 1000) / (now - this.windowStart));
      this.element.textContent = `${fps} FPS`;
      this.frames = 0;
      this.windowStart = now;
    }
  }
}
