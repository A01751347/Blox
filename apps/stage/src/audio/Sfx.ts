import { midiToFrequency } from './musicPattern';

interface Blip {
  midi: number;
  at: number;
  seconds: number;
  wave: OscillatorType;
  volume: number;
}

export class Sfx {
  muted = false;

  constructor(
    private readonly context: AudioContext,
    private readonly output: AudioNode,
  ) {}

  gift(big: boolean): void {
    const notes = big ? [72, 76, 79, 84, 88] : [76, 83];
    this.play(
      notes.map((midi, index) => ({
        midi,
        at: index * 0.07,
        seconds: 0.18,
        wave: 'triangle',
        volume: 0.25,
      })),
    );
  }

  join(): void {
    this.play([{ midi: 79, at: 0, seconds: 0.08, wave: 'sine', volume: 0.18 }]);
  }

  follow(): void {
    this.play(
      [84, 88, 91, 96].map((midi, index) => ({
        midi,
        at: index * 0.05,
        seconds: 0.2,
        wave: 'sine',
        volume: 0.16,
      })),
    );
  }

  share(): void {
    this.play(
      [60, 67, 72].map((midi, index) => ({
        midi,
        at: index * 0.06,
        seconds: 0.14,
        wave: 'square',
        volume: 0.12,
      })),
    );
  }

  roundStart(): void {
    this.play(
      [72, 79].map((midi, index) => ({
        midi,
        at: index * 0.12,
        seconds: 0.3,
        wave: 'triangle',
        volume: 0.3,
      })),
    );
  }

  finalPush(): void {
    this.play(
      [0, 0.18, 0.36].map((at) => ({ midi: 81, at, seconds: 0.12, wave: 'square', volume: 0.22 })),
    );
  }

  fanfare(): void {
    this.play(
      [67, 72, 76, 79, 84].map((midi, index) => ({
        midi,
        at: index * 0.14,
        seconds: 0.5,
        wave: 'sawtooth',
        volume: 0.18,
      })),
    );
  }

  tick(): void {
    this.play([{ midi: 90, at: 0, seconds: 0.05, wave: 'square', volume: 0.1 }]);
  }

  private play(blips: Blip[]): void {
    if (this.muted) return;
    const base = this.context.currentTime + 0.01;
    blips.forEach((blip) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = blip.wave;
      oscillator.frequency.value = midiToFrequency(blip.midi);
      const start = base + blip.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(blip.volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + blip.seconds);
      oscillator.connect(gain).connect(this.output);
      oscillator.start(start);
      oscillator.stop(start + blip.seconds + 0.02);
    });
  }
}
