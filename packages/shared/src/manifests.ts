import type { TeamId } from './types.js';
import rosterJson from './data/roster.json';
import playlistJson from './data/playlist.json';

export interface TrackStyle {
  root: number;
  scale: number[];
  progression: number[];
  kick: string;
  snare: string;
  hat: string;
  bass: string;
  lead: string;
  leadWave: 'square' | 'triangle' | 'sawtooth';
}

export interface TrackManifestEntry {
  id: string;
  title: string;
  file: string | null;
  bpm: number;
  offsetSeconds: number;
  license: string;
  style?: TrackStyle;
}

export const ROSTER_ROTATION = rosterJson.rotation as Array<Record<TeamId, string>>;
export const PLAYLIST = playlistJson.tracks as TrackManifestEntry[];

export function rosterForRound(roundNumber: number): Record<TeamId, string> {
  const index =
    (((roundNumber - 1) % ROSTER_ROTATION.length) + ROSTER_ROTATION.length) %
    ROSTER_ROTATION.length;
  return { ...(ROSTER_ROTATION[index] as Record<TeamId, string>) };
}

export function trackForRound(roundNumber: number): TrackManifestEntry {
  const index = (((roundNumber - 1) % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  return PLAYLIST[index] as TrackManifestEntry;
}
