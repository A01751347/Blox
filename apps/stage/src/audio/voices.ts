import { midiToFrequency } from './musicPattern';

export type LeadWave = 'square' | 'triangle' | 'sawtooth';

export class VoiceBank {
  private readonly noise: AudioBuffer;

  constructor(
    private readonly context: AudioContext,
    private readonly output: AudioNode,
  ) {
    const length = context.sampleRate;
    this.noise = context.createBuffer(1, length, context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  }

  kick(time: number): void {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    oscillator.connect(gain).connect(this.output);
    oscillator.start(time);
    oscillator.stop(time + 0.3);
  }

  snare(time: number): void {
    this.noiseBurst(time, 0.16, 1800, 'bandpass', 0.5);
    const body = this.context.createOscillator();
    const gain = this.context.createGain();
    body.frequency.setValueAtTime(220, time);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    body.connect(gain).connect(this.output);
    body.start(time);
    body.stop(time + 0.12);
  }

  hat(time: number, accent: boolean): void {
    this.noiseBurst(time, accent ? 0.07 : 0.04, 7000, 'highpass', accent ? 0.28 : 0.16);
  }

  bass(time: number, midi: number, seconds: number): void {
    this.tone(time, midi, seconds, 'sawtooth', 0.32, 420);
  }

  lead(time: number, midi: number, seconds: number, wave: LeadWave): void {
    this.tone(time, midi, seconds, wave, 0.14, 3500);
  }

  pad(time: number, midis: number[], seconds: number): void {
    midis.forEach((midi) => this.tone(time, midi, seconds, 'triangle', 0.07, 1800));
  }

  private tone(
    time: number,
    midi: number,
    seconds: number,
    wave: OscillatorType,
    volume: number,
    cutoff: number,
  ): void {
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = midiToFrequency(midi);
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
    oscillator.connect(filter).connect(gain).connect(this.output);
    oscillator.start(time);
    oscillator.stop(time + seconds + 0.02);
  }

  private noiseBurst(
    time: number,
    seconds: number,
    frequency: number,
    type: BiquadFilterType,
    volume: number,
  ): void {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + seconds);
    source.connect(filter).connect(gain).connect(this.output);
    source.start(time);
    source.stop(time + seconds + 0.01);
  }
}
