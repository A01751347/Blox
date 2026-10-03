import type { EditorModel } from '../animation/EditorModel';

export interface TimelineHandlers {
  onSelect: (index: number) => void;
  onSeek: (beat: number) => void;
  onMove: (index: number, beat: number) => number;
  onAdd: (beat: number) => void;
}

const EDGE_PADDING_PX = 24;

export class TimelineView {
  private readonly track: HTMLDivElement;
  private model: EditorModel | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly handlers: TimelineHandlers,
  ) {
    this.track = document.createElement('div');
    this.track.className = 'timeline-track';
    container.appendChild(this.track);
    this.track.addEventListener('pointerdown', (event) => {
      if (event.target === this.track) this.handlers.onSeek(this.beatFromEvent(event));
    });
    this.track.addEventListener('dblclick', (event) => {
      if (event.target === this.track) this.handlers.onAdd(this.beatFromEvent(event));
    });
  }

  render(model: EditorModel, selected: number, playhead: number): void {
    this.model = model;
    this.track.replaceChildren();
    const beats = model.clip.beats;

    for (let beat = 0; beat <= beats; beat += 1) {
      const tick = document.createElement('div');
      tick.className = 'timeline-tick';
      tick.style.left = this.positionFor(beat);
      tick.textContent = String(beat);
      this.track.appendChild(tick);
    }

    model.clip.keyframes.forEach((frame, index) => {
      const marker = document.createElement('div');
      marker.className = `timeline-key${index === selected ? ' selected' : ''}`;
      marker.style.left = this.positionFor(frame.beat);
      marker.title = `beat ${frame.beat} · ${frame.ease ?? 'linear'}`;
      marker.textContent = (frame.ease ?? 'linear').slice(0, 3);
      this.attachDrag(marker, index);
      this.track.appendChild(marker);
    });

    const head = document.createElement('div');
    head.className = 'timeline-playhead';
    head.style.left = this.positionFor(playhead);
    this.track.appendChild(head);
  }

  private positionFor(beat: number): string {
    const beats = this.model?.clip.beats ?? 1;
    return `calc(${EDGE_PADDING_PX}px + (100% - ${EDGE_PADDING_PX * 2}px) * ${beat / beats})`;
  }

  private beatFromEvent(event: MouseEvent): number {
    const rect = this.track.getBoundingClientRect();
    const usable = rect.width - EDGE_PADDING_PX * 2;
    const beats = this.model?.clip.beats ?? 1;
    const ratio = (event.clientX - rect.left - EDGE_PADDING_PX) / usable;
    return Math.min(beats, Math.max(0, ratio * beats));
  }

  private attachDrag(marker: HTMLElement, startIndex: number): void {
    marker.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      let index = startIndex;
      this.handlers.onSelect(index);
      marker.setPointerCapture(event.pointerId);
      const move = (moveEvent: PointerEvent) => {
        index = this.handlers.onMove(index, this.beatFromEvent(moveEvent));
      };
      const release = () => {
        marker.removeEventListener('pointermove', move);
        marker.removeEventListener('pointerup', release);
      };
      marker.addEventListener('pointermove', move);
      marker.addEventListener('pointerup', release);
    });
  }
}
