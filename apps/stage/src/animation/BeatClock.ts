export type TimeSource = () => number;

export interface TrackTiming {
  bpm: number;
  offsetSeconds: number;
  startedAtSeconds: number;
}

export class BeatClock {
  private timing: TrackTiming;

  constructor(
    private readonly timeSource: TimeSource,
    timing: Partial<TrackTiming> = {},
  ) {
    this.timing = {
      bpm: timing.bpm ?? 120,
      offsetSeconds: timing.offsetSeconds ?? 0,
      startedAtSeconds: timing.startedAtSeconds ?? timeSource(),
    };
  }

  setTrack(timing: TrackTiming): void {
    this.timing = { ...timing };
  }

  getBpm(): number {
    return this.timing.bpm;
  }

  getBeat(): number {
    const elapsed = this.timeSource() - this.timing.startedAtSeconds - this.timing.offsetSeconds;
    return (elapsed * this.timing.bpm) / 60;
  }

  getBeatIndex(): number {
    return Math.floor(this.getBeat());
  }

  getPhase(): number {
    const beat = this.getBeat();
    return beat - Math.floor(beat);
  }

  beatsToSeconds(beats: number): number {
    return (beats * 60) / this.timing.bpm;
  }
}
