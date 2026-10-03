import { JOINT_NAMES } from '../character/types';
import type { Character } from '../character/Character';
import type { JointName, Vec3 } from '../character/types';

const AXES = ['x', 'y', 'z'] as const;
const RANGE_DEGREES = 180;

export interface JointSliders {
  refresh: () => void;
}

export function createJointSliders(
  parent: HTMLElement,
  character: () => Character,
  onChange?: () => void,
): JointSliders {
  const inputs = new Map<string, HTMLInputElement>();
  const readouts = new Map<string, HTMLElement>();

  const readJoint = (name: JointName): Vec3 =>
    AXES.map((axis) => Number(inputs.get(`${name}.${axis}`)?.value ?? 0)) as Vec3;

  JOINT_NAMES.forEach((name) => {
    const title = document.createElement('h3');
    title.textContent = name;
    parent.appendChild(title);

    AXES.forEach((axis) => {
      const row = document.createElement('div');
      row.className = 'slider-row';
      const label = document.createElement('span');
      label.textContent = axis;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(-RANGE_DEGREES);
      slider.max = String(RANGE_DEGREES);
      slider.step = '1';
      slider.value = '0';
      const readout = document.createElement('span');
      readout.textContent = '0';
      slider.addEventListener('input', () => {
        readout.textContent = slider.value;
        character().setJoint(name, readJoint(name));
        onChange?.();
      });
      inputs.set(`${name}.${axis}`, slider);
      readouts.set(`${name}.${axis}`, readout);
      row.append(label, slider, readout);
      parent.appendChild(row);
    });
  });

  const refresh = () => {
    JOINT_NAMES.forEach((name) => {
      const rotation = character().getJoint(name);
      AXES.forEach((axis, index) => {
        const value = String(Math.round(rotation[index] ?? 0));
        const key = `${name}.${axis}`;
        const input = inputs.get(key);
        const readout = readouts.get(key);
        if (input) input.value = value;
        if (readout) readout.textContent = value;
      });
    });
  };

  return { refresh };
}
