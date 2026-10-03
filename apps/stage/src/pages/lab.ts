import type { Character } from '../character/Character';
import { CHARACTER_SPECS, findCharacterSpec } from '../character/characterLibrary';
import { createCharacter } from '../character/characterFactory';
import { EXPRESSION_NAMES } from '../character/face/faceTypes';
import type { ExpressionName } from '../character/face/faceTypes';
import { createDanceControls } from './danceControls';
import { createJointSliders } from './jointSliders';
import { createLabScene } from './labScene';

const GALLERY_SPACING = 4.8;

const canvas = document.getElementById('lab-canvas') as HTMLCanvasElement;
const panel = document.getElementById('lab-panel') as HTMLElement;
const lab = createLabScene(canvas);

let expression: ExpressionName = 'idle';
let characters: Character[] = [];
let danceControls: ReturnType<typeof createDanceControls> | null = null;

function clearCharacters(): void {
  characters.forEach((character) => {
    lab.scene.remove(character.root);
    character.dispose();
  });
  characters = [];
}

function showCharacter(id: string): void {
  clearCharacters();
  const character = createCharacter(findCharacterSpec(id));
  character.setExpression(expression);
  lab.scene.add(character.root);
  characters = [character];
  danceControls?.rebind(characters);
  lab.controls.target.set(0, 3, 0);
  lab.camera.position.set(0, 4.5, 13);
}

function showGallery(): void {
  clearCharacters();
  const offset = ((CHARACTER_SPECS.length - 1) * GALLERY_SPACING) / 2;
  characters = CHARACTER_SPECS.map((spec, index) => {
    const character = createCharacter(spec);
    character.setExpression(expression);
    character.root.position.x = index * GALLERY_SPACING - offset;
    lab.scene.add(character.root);
    return character;
  });
  danceControls?.rebind(characters);
  lab.controls.target.set(0, 3, 0);
  lab.camera.position.set(0, 5, 34);
}

function addSelect<T extends string>(
  label: string,
  options: readonly T[],
  onChange: (value: T) => void,
): HTMLSelectElement {
  const row = document.createElement('div');
  row.className = 'panel-row';
  const title = document.createElement('span');
  title.textContent = label;
  const select = document.createElement('select');
  options.forEach((option) => select.add(new Option(option, option)));
  select.addEventListener('change', () => onChange(select.value as T));
  row.append(title, select);
  panel.appendChild(row);
  return select;
}

function addButton(label: string, onClick: () => void): void {
  const row = document.createElement('div');
  row.className = 'panel-row';
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', onClick);
  row.appendChild(button);
  panel.appendChild(row);
}

const ids = CHARACTER_SPECS.map((spec) => spec.id);
const characterSelect = addSelect('Personaje', ids, showCharacter);
addSelect('Expresión', EXPRESSION_NAMES, (value) => {
  expression = value;
  characters.forEach((character) => character.setExpression(value));
});
addButton('Ver los 8', showGallery);

danceControls = createDanceControls(panel, characters);
const sliders = createJointSliders(
  panel,
  () => characters[0] ?? createCharacter(findCharacterSpec('chispa')),
);
addButton('Reset pose', () => {
  characters.forEach((character) => character.resetPose());
  sliders.refresh();
});

const query = new URLSearchParams(location.search);
const requestedExpression = query.get('expression');
if (EXPRESSION_NAMES.some((name) => name === requestedExpression)) {
  expression = requestedExpression as ExpressionName;
}
if (query.has('all')) showGallery();
else {
  const initialId = query.get('id') ?? ids[0] ?? 'chispa';
  characterSelect.value = initialId;
  showCharacter(initialId);
}
if (query.has('back')) lab.camera.position.z = -lab.camera.position.z;

lab.run((delta, elapsed) => {
  danceControls?.update(elapsed);
  characters.forEach((character) => character.update(delta, elapsed));
});
