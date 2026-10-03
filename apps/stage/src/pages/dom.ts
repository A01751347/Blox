export function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

export function createSelect<T extends string>(
  options: readonly T[],
  value: T,
  onChange: (value: T) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  options.forEach((option) => select.add(new Option(option, option)));
  select.value = value;
  select.addEventListener('change', () => onChange(select.value as T));
  return select;
}

export function createNumberInput(
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('change', () => onChange(Number(input.value)));
  return input;
}

export function createTextInput(
  value: string,
  onChange: (value: string) => void,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.addEventListener('change', () => onChange(input.value.trim()));
  return input;
}

export function appendRow(
  parent: HTMLElement,
  label: string,
  ...controls: HTMLElement[]
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'panel-row';
  if (label) {
    const title = document.createElement('span');
    title.textContent = label;
    row.appendChild(title);
  }
  row.append(...controls);
  parent.appendChild(row);
  return row;
}

export function appendHeading(parent: HTMLElement, text: string): void {
  const heading = document.createElement('h3');
  heading.textContent = text;
  parent.appendChild(heading);
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
