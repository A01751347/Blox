import { Animator } from '../animation/Animator';
import { BeatClock } from '../animation/BeatClock';
import { DANCE_CLIPS, findDance } from '../animation/danceLibrary';
import { Metronome } from '../audio/Metronome';
import type { Character } from '../character/Character';

const DEFAULT_BPM = 120;

export interface DanceControls {
  update: (elapsedSeconds: number) => void;
  rebind: (characters: Character[]) => void;
  isActive: () => boolean;
}

function labeledRow(parent: HTMLElement, label: string, control: HTMLElement): void {
  const row = document.createElement('div');
  row.className = 'panel-row';
  const title = document.createElement('span');
  title.textContent = label;
  row.append(title, control);
  parent.appendChild(row);
}

export function createDanceControls(parent: HTMLElement, initial: Character[]): DanceControls {
  const context = new AudioContext();
  const metronome = new Metronome(context);
  const clock = new BeatClock(
    () => (metronome.running ? metronome.now() : performance.now() / 1000),
    {
      bpm: DEFAULT_BPM,
    },
  );
  let animators: Animator[] = [];
  let characters = initial;
  let danceId = 'none';
  let intensity = 0.5;
  let frozenBeat: number | null = null;

  const rebuild = () => {
    animators = characters.map((character) => new Animator(character, clock));
    animators.forEach((animator) => animator.setIntensity(intensity));
    if (danceId !== 'none') animators.forEach((animator) => animator.play(findDance(danceId), 0));
  };

  const danceSelect = document.createElement('select');
  ['none', ...DANCE_CLIPS.map((clip) => clip.id)].forEach((id) =>
    danceSelect.add(new Option(id, id)),
  );
  danceSelect.addEventListener('change', () => {
    danceId = danceSelect.value;
    if (danceId === 'none') characters.forEach((character) => character.resetPose());
    rebuild();
  });
  labeledRow(parent, 'Baile', danceSelect);

  const bpmInput = document.createElement('input');
  bpmInput.type = 'number';
  bpmInput.value = String(DEFAULT_BPM);
  bpmInput.min = '60';
  bpmInput.max = '200';
  labeledRow(parent, 'BPM', bpmInput);

  const intensityInput = document.createElement('input');
  intensityInput.type = 'range';
  intensityInput.min = '0';
  intensityInput.max = '1';
  intensityInput.step = '0.05';
  intensityInput.value = String(intensity);
  intensityInput.addEventListener('input', () => {
    intensity = Number(intensityInput.value);
    animators.forEach((animator) => animator.setIntensity(intensity));
  });
  labeledRow(parent, 'Energía', intensityInput);

  const metronomeButton = document.createElement('button');
  metronomeButton.textContent = 'Metrónomo ▶';
  metronomeButton.addEventListener('click', () => {
    if (metronome.running) {
      metronome.stop();
      metronomeButton.textContent = 'Metrónomo ▶';
      return;
    }
    const bpm = Number(bpmInput.value) || DEFAULT_BPM;
    const startedAt = metronome.start(bpm);
    clock.setTrack({ bpm, offsetSeconds: 0, startedAtSeconds: startedAt });
    metronomeButton.textContent = 'Metrónomo ■';
  });
  const buttonRow = document.createElement('div');
  buttonRow.className = 'panel-row';
  buttonRow.appendChild(metronomeButton);
  parent.appendChild(buttonRow);

  const readout = document.createElement('div');
  readout.className = 'panel-row';
  parent.appendChild(readout);

  const params = new URLSearchParams(location.search);
  const requestedDance = params.get('dance');
  if (requestedDance) {
    danceId = requestedDance;
    danceSelect.value = requestedDance;
  }
  if (params.has('beat')) frozenBeat = Number(params.get('beat'));
  if (params.has('energy')) {
    intensity = Number(params.get('energy'));
    intensityInput.value = String(intensity);
  }
  rebuild();

  return {
    isActive: () => danceId !== 'none',
    rebind: (next) => {
      characters = next;
      rebuild();
    },
    update: (elapsedSeconds) => {
      const beat = frozenBeat ?? clock.getBeat();
      readout.textContent = `beat ${beat.toFixed(2)}`;
      if (danceId === 'none') return;
      animators.forEach((animator) => animator.renderAt(beat, elapsedSeconds));
    },
  };
}
