import type { CharacterSpec } from './characterSpec';

const modules = import.meta.glob<CharacterSpec>('../data/characters/*.json', {
  eager: true,
  import: 'default',
});

export const CHARACTER_SPECS: CharacterSpec[] = Object.values(modules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

export function findCharacterSpec(id: string): CharacterSpec {
  const spec = CHARACTER_SPECS.find((candidate) => candidate.id === id);
  if (!spec) throw new Error(`Unknown character: ${id}`);
  return spec;
}
