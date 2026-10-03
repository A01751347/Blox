import { PLAYLIST } from '@bloxdance/shared';
import type { TrackManifestEntry, TrackStyle } from '@bloxdance/shared';
import type { BeatClock } from '../animation/BeatClock';
import { chordTones, eventsForStep, STEPS_PER_BAR, STEPS_PER_BEAT } from './musicPattern';
import { VoiceBank } from './voices';

const SCHEDULER_INTERVAL_MS = 25;
const LOOKAHEAD_SECONDS = 0.2;
const BASE_VOLUME = 0.55;
const FINAL_VOLUME = 0.72;
const DUCKED_VOLUME = 0.12;
const FILE_RESYNC_SECONDS = 0.08;

export class MusicPlayer {
  private voices: VoiceBank | null = null;
  private timer: number | null = null;
  private nextStep = 0;
  private track: TrackManifestEntry | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private intensity = 0;
  private finalPush = false;
  private ducked = false;

  constructor(
    private readonly clock: BeatClock,
    private readonly context: AudioContext | null,
    private readonly master: GainNode | null,
  ) {}

  start(trackId: string, startedAtMs: number): void {
    this.stopSource();
    const track = PLAYLIST.find((entry) => entry.id === trackId);
    if (!track) return;
    this.track = track;
    if (track.file) this.startFile(track, startedAtMs);
    else this.startProcedural(track, startedAtMs);
  }

  setIntensity(value: number): void {
    this.intensity = Math.min(1, Math.max(0, value));
  }

  setFinalPush(enabled: boolean): void {
    this.finalPush = enabled;
    this.applyVolume();
  }

  setDucked(enabled: boolean): void {
    this.ducked = enabled;
    this.applyVolume();
  }

  stop(): void {
    this.stopSource();
    this.track = null;
  }

  private applyVolume(): void {
    if (!this.master || !this.context) return;
    const target = this.ducked ? DUCKED_VOLUME : this.finalPush ? FINAL_VOLUME : BASE_VOLUME;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.25);
  }

  private stopSource(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.audioElement?.pause();
    this.audioElement = null;
  }

  private startProcedural(track: TrackManifestEntry, startedAtMs: number): void {
    this.clock.setTimeSource(() => Date.now() / 1000);
    this.clock.setTrack({
      bpm: track.bpm,
      offsetSeconds: track.offsetSeconds,
      startedAtSeconds: startedAtMs / 1000,
    });
    if (!this.context || !this.master || !track.style) return;
    this.voices = new VoiceBank(this.context, this.master);
    this.nextStep = Math.max(0, Math.ceil(this.clock.getBeat() * STEPS_PER_BEAT));
    this.applyVolume();
    this.timer = window.setInterval(
      () => this.schedule(track.style as TrackStyle),
      SCHEDULER_INTERVAL_MS,
    );
  }

  private startFile(track: TrackManifestEntry, startedAtMs: number): void {
    const audio = new Audio(track.file ?? '');
    audio.loop = true;
    const elapsed = Math.max(0, (Date.now() - startedAtMs) / 1000);
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration > 0) audio.currentTime = elapsed % audio.duration;
    });
    void audio.play().catch(() => undefined);
    this.audioElement = audio;
    this.clock.setTimeSource(() => audio.currentTime);
    this.clock.setTrack({
      bpm: track.bpm,
      offsetSeconds: track.offsetSeconds,
      startedAtSeconds: 0,
    });
    this.timer = window.setInterval(() => this.resyncFile(audio, startedAtMs), 1000);
  }

  private resyncFile(audio: HTMLAudioElement, startedAtMs: number): void {
    if (!audio.duration) return;
    const expected = ((Date.now() - startedAtMs) / 1000) % audio.duration;
    if (Math.abs(expected - audio.currentTime) > 1) audio.currentTime = expected;
    else if (Math.abs(expected - audio.currentTime) > FILE_RESYNC_SECONDS) {
      audio.playbackRate = expected > audio.currentTime ? 1.01 : 0.99;
    } else audio.playbackRate = 1;
  }

  private schedule(style: TrackStyle): void {
    const context = this.context;
    const voices = this.voices;
    const track = this.track;
    if (!context || !voices || !track) return;
    const secondsPerBeat = 60 / track.bpm;
    const beatNow = this.clock.getBeat();
    if (context.state !== 'running') {
      this.nextStep = Math.max(0, Math.ceil(beatNow * STEPS_PER_BEAT));
      return;
    }
    for (;;) {
      const stepBeat = this.nextStep / STEPS_PER_BEAT;
      const secondsAhead = (stepBeat - beatNow) * secondsPerBeat;
      if (secondsAhead > LOOKAHEAD_SECONDS) return;
      if (secondsAhead > -0.05)
        this.playStep(
          style,
          this.nextStep,
          context.currentTime + Math.max(0, secondsAhead),
          secondsPerBeat,
        );
      this.nextStep += 1;
    }
  }

  private playStep(style: TrackStyle, step: number, time: number, secondsPerBeat: number): void {
    const voices = this.voices;
    if (!voices) return;
    const events = eventsForStep(style, step);
    const stepSeconds = secondsPerBeat / STEPS_PER_BEAT;
    if (events.kick) voices.kick(time);
    if (events.snare) voices.snare(time);
    if (events.hat && (this.intensity > 0.3 || step % 2 === 0)) voices.hat(time, step % 4 === 2);
    if (this.finalPush && step % 2 === 1) voices.hat(time, false);
    if (events.bassNote !== null) voices.bass(time, events.bassNote, stepSeconds * 1.8);
    if (events.leadNote !== null && this.intensity > 0.15) {
      voices.lead(time, events.leadNote, stepSeconds * 1.6, style.leadWave);
    }
    if (step % STEPS_PER_BAR === 0) {
      voices.pad(time, chordTones(style, step), secondsPerBeat * 4 * 0.95);
    }
  }
}
