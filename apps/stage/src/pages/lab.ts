import { Character } from '../character/Character';
import { createJointSliders } from './jointSliders';
import { createLabScene } from './labScene';

const canvas = document.getElementById('lab-canvas') as HTMLCanvasElement;
const panel = document.getElementById('lab-panel') as HTMLElement;

const lab = createLabScene(canvas);
const character = new Character();
lab.scene.add(character.root);

const resetRow = document.createElement('div');
resetRow.className = 'panel-row';
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset pose';
resetRow.appendChild(resetButton);
panel.appendChild(resetRow);

const sliders = createJointSliders(panel, () => character);
resetButton.addEventListener('click', () => {
  character.resetPose();
  sliders.refresh();
});

lab.run(() => undefined);
