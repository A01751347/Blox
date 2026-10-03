export function createDiv(className: string, parent?: HTMLElement): HTMLDivElement {
  const element = document.createElement('div');
  element.className = className;
  parent?.appendChild(element);
  return element;
}

export function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}
