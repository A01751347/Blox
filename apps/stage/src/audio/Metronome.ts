const LOOKAHEAD_SECONDS = 0.15;
const SCHEDULER_INTERVAL_MS = 25;
const CLICK_SECONDS = 0.04;
const START_DELAY_SECONDS = 0.1;

export class Metronome {
  private timer: number | null = null;
  private nextBeatIndex = 0;
  private bpm = 120;
  private startedAt = 0;

  constructor(private readonly context: AudioContext) {}

  get startTime(): number {
    return this.startedAt;
  }

  get running(): boolean {
    return this.timer !== null;
  }

  now(): number {
    return this.context.currentTime;
  }

  start(bpm: number): number {
    this.stop();
    this.bpm = bpm;
    this.startedAt = this.context.currentTime + START_DELAY_SECONDS;
    this.nextBeatIndex = 0;
    void this.context.resume();
    this.timer = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
    this.schedule();
    return this.startedAt;
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    const horizon = this.context.currentTime + LOOKAHEAD_SECONDS;
    for (;;) {
      const time = this.startedAt + (this.nextBeatIndex * 60) / this.bpm;
      if (time > horizon) return;
      this.click(time, this.nextBeatIndex % 4 === 0);
      this.nextBeatIndex += 1;
    }
  }

  private click(time: number, accent: boolean): void {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_SECONDS);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + CLICK_SECONDS);
  }
}
