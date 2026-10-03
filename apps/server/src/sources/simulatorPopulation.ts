import type { ViewerRef } from '../game/inputEvents.js';

const FIRST_NAMES = [
  'Luna',
  'Max',
  'Sol',
  'Nico',
  'Mia',
  'Leo',
  'Zoe',
  'Teo',
  'Ana',
  'Raul',
  'Isa',
  'Dani',
  'Vale',
  'Hugo',
  'Lola',
  'Eli',
  'Sami',
  'Gael',
  'Nora',
  'Ivan',
];
const POPULATION_SIZE = 80;

export const SIMULATED_VIEWERS: ViewerRef[] = Array.from(
  { length: POPULATION_SIZE },
  (_, index) => ({
    userId: `sim_${index}`,
    nickname: `${FIRST_NAMES[index % FIRST_NAMES.length]}${Math.floor(index / FIRST_NAMES.length) + 1}`,
  }),
);

export interface SimulatedGift {
  name: string;
  diamonds: number;
  streakable: boolean;
  weight: number;
}

export const SIMULATED_GIFTS: SimulatedGift[] = [
  { name: 'Rose', diamonds: 1, streakable: true, weight: 40 },
  { name: 'Finger Heart', diamonds: 5, streakable: true, weight: 25 },
  { name: 'Perfume', diamonds: 20, streakable: true, weight: 15 },
  { name: 'Doughnut', diamonds: 30, streakable: true, weight: 12 },
  { name: 'Galaxy', diamonds: 1000, streakable: false, weight: 2 },
  { name: 'Lion', diamonds: 29999, streakable: false, weight: 0.3 },
];

export const CHAT_LINES = ['hola', 'vamos!', 'jaja', 'que baile', 'fuego', '1', '2', '3', '4'];
