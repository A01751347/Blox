import { BeatClock } from '../animation/BeatClock';
import { DANCE_CLIPS, findDance } from '../animation/danceLibrary';
import { EditorModel, SNAP_STEPS } from '../animation/EditorModel';
import { EASING_NAMES, DANCE_KINDS } from '../animation/types';
import type { DanceKind, EasingName } from '../animation/types';
import { Metronome } from '../audio/Metronome';
import type { Character } from '../character/Character';
import { CHARACTER_SPECS, findCharacterSpec } from '../character/characterLibrary';
import { createCharacter } from '../character/characterFactory';
import {
  appendHeading,
  appendRow,
  createButton,
  createFileInput,
  createNumberInput,
  createSelect,
  createTextInput,
  downloadText,
} from './dom';
import { EditorSession } from './editorSession';
import { createJointSliders } from './jointSliders';
import { createLabScene } from './labScene';
import { TimelineView } from './timelineView';

const DEFAULT_BPM = 120;
const OFFSET_AXES = ['x', 'y', 'z'] as const;

const canvas = document.getElementById('lab-canvas') as HTMLCanvasElement;
const panel = document.getElementById('lab-panel') as HTMLElement;
const timelineElement = document.getElementById('timeline') as HTMLElement;

const lab = createLabScene(canvas);
const session = new EditorSession();
const metronome = new Metronome(new AudioContext());
let character: Character = createCharacter(findCharacterSpec('chispa'));
lab.scene.add(character.root);
let playing = false;
let bpm = DEFAULT_BPM;
const clock = new BeatClock(() => (metronome.running ? metronome.now() : performance.now() / 1000));

const errors = document.createElement('div');
errors.className = 'panel-error';
const offsetInputs: HTMLInputElement[] = [];
let easeSelect: HTMLSelectElement;
let metaFields: HTMLInputElement[] = [];

function refreshUi(): void {
  session.applyTo(character);
  sliders.refresh();
  easeSelect.value = session.selectedEase();
  const offset = session.currentOffset();
  offsetInputs.forEach((input, axis) => (input.value = String(offset[axis] ?? 0)));
  const clip = session.model.clip;
  const [idField, nameField, beatsField] = metaFields;
  if (idField) idField.value = clip.id;
  if (nameField) nameField.value = clip.name;
  if (beatsField) beatsField.value = String(clip.beats);
  errors.textContent = session.model.validate().join('\n');
  timeline.render(session.model, session.selected, session.playhead);
}

function togglePlayback(button: HTMLButtonElement): void {
  playing = !playing;
  button.textContent = playing ? '■ Pausa' : '▶ Reproducir';
  if (!playing) {
    metronome.stop();
    refreshUi();
    return;
  }
  const startedAt = metronome.start(bpm);
  clock.setTrack({
    bpm,
    offsetSeconds: -(session.playhead * 60) / bpm,
    startedAtSeconds: startedAt,
  });
}

function buildMetaSection(): void {
  appendHeading(panel, 'Baile');
  const idInput = createTextInput(session.model.clip.id, (value) => {
    session.model.setMeta({ id: value });
    session.persist();
    refreshUi();
  });
  const nameInput = createTextInput(session.model.clip.name, (value) => {
    session.model.setMeta({ name: value });
    session.persist();
    refreshUi();
  });
  const beatsInput = createNumberInput(session.model.clip.beats, 1, 32, 1, (value) => {
    session.model.setBeats(value, session.snap);
    session.persist();
    refreshUi();
  });
  metaFields = [idInput, nameInput, beatsInput];
  appendRow(panel, 'id', idInput);
  appendRow(panel, 'nombre', nameInput);
  appendRow(panel, 'beats', beatsInput);
  appendRow(
    panel,
    'tipo',
    createSelect(DANCE_KINDS, session.model.clip.kind, (value: DanceKind) => {
      session.model.setMeta({ kind: value });
      session.persist();
    }),
  );
  appendRow(
    panel,
    'nivel',
    createSelect(
      ['0', '1', '2', '3'] as const,
      String(session.model.clip.level) as '0',
      (value) => {
        session.model.setMeta({ level: Number(value) as 0 | 1 | 2 | 3 });
        session.persist();
      },
    ),
  );
  appendRow(
    panel,
    'snap',
    createSelect(SNAP_STEPS.map(String), String(session.snap), (value) => {
      session.snap = Number(value);
    }),
  );
  appendRow(
    panel,
    'BPM',
    createNumberInput(bpm, 60, 200, 1, (value) => (bpm = value)),
  );
}

function buildTransportSection(): void {
  appendHeading(panel, 'Transporte y archivo');
  const playButton = createButton('▶ Reproducir', () => togglePlayback(playButton));
  appendRow(panel, '', playButton);
  appendRow(
    panel,
    '',
    createButton('Exportar JSON', () =>
      downloadText(`${session.model.clip.id}.json`, session.model.toJson()),
    ),
    createButton('Copiar', () => void navigator.clipboard?.writeText(session.model.toJson())),
  );
  const fileInput = createFileInput(async (text) => {
    try {
      session.load(EditorModel.parse(text));
      refreshUi();
    } catch (error) {
      errors.textContent = String(error);
    }
  });
  appendRow(panel, 'Importar', fileInput);
  const existing = DANCE_CLIPS.map((clip) => clip.id);
  appendRow(
    panel,
    'Cargar',
    createSelect(['—', ...existing], '—', (id) => {
      if (id === '—') return;
      session.load(findDance(id));
      refreshUi();
    }),
  );
  appendRow(
    panel,
    'Personaje',
    createSelect(
      CHARACTER_SPECS.map((spec) => spec.id),
      'chispa',
      (id) => {
        lab.scene.remove(character.root);
        character.dispose();
        character = createCharacter(findCharacterSpec(id));
        lab.scene.add(character.root);
        refreshUi();
      },
    ),
  );
}

function buildKeyframeSection(): void {
  appendHeading(panel, 'Keyframe seleccionado');
  easeSelect = createSelect(EASING_NAMES, 'linear', (value: EasingName) => {
    session.setEase(value);
    refreshUi();
  });
  appendRow(panel, 'easing', easeSelect);
  appendRow(
    panel,
    '',
    createButton('+ Keyframe', () => {
      session.addAtPlayhead();
      refreshUi();
    }),
    createButton('Borrar', () => {
      session.deleteSelected();
      refreshUi();
    }),
  );
  OFFSET_AXES.forEach((axis, index) => {
    const input = createNumberInput(0, -4, 4, 0.05, (value) => {
      const offset = [...session.currentOffset()] as [number, number, number];
      offset[index] = value;
      session.editOffset(offset);
      refreshUi();
    });
    offsetInputs.push(input);
    appendRow(panel, `mover ${axis}`, input);
  });
  panel.appendChild(errors);
}

buildMetaSection();
buildTransportSection();
buildKeyframeSection();
const sliders = createJointSliders(
  panel,
  () => character,
  (name, value) => {
    session.editJoint(name, value);
    timeline.render(session.model, session.selected, session.playhead);
  },
);
const timeline = new TimelineView(timelineElement, {
  onSelect: (index) => {
    session.select(index);
    refreshUi();
  },
  onSeek: (beat) => {
    session.seek(beat);
    refreshUi();
  },
  onMove: (index, beat) => {
    const next = session.move(index, beat);
    refreshUi();
    return next;
  },
  onAdd: (beat) => {
    session.seek(beat);
    session.addAtPlayhead();
    refreshUi();
  },
});

window.addEventListener('keydown', (event) => {
  const typing = event.target instanceof HTMLInputElement && event.target.type !== 'range';
  if (typing || (event.key !== 'Delete' && event.key !== 'Backspace')) return;
  session.deleteSelected();
  refreshUi();
});

refreshUi();
lab.run((delta, elapsed) => {
  if (playing) {
    const beat = clock.getBeat();
    session.playhead = beat >= 0 ? beat % session.model.clip.beats : 0;
    session.applyTo(character, session.playhead);
    timeline.render(session.model, session.selected, session.playhead);
  }
  character.update(delta, elapsed);
});
