import type { DanceClip } from './types';

const modules = import.meta.glob<DanceClip>('../data/dances/*.json', {
  eager: true,
  import: 'default',
});

export const DANCE_CLIPS: DanceClip[] = Object.values(modules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

export function findDance(id: string): DanceClip {
  const clip = DANCE_CLIPS.find((candidate) => candidate.id === id);
  if (!clip) throw new Error(`Unknown dance: ${id}`);
  return clip;
}
