import { MAX_NAME_LENGTH } from '@bloxdance/shared';
import { foldForMatching, foldWord } from './normalize.js';

export const FALLBACK_NAME = 'un fan';

const ALLOWED = /[^\p{L}\p{N} _.-]/gu;

export function cleanCharacters(nickname: string): string {
  return nickname.normalize('NFC').replace(ALLOWED, '').replace(/\s+/g, ' ').trim();
}

export function containsBannedWord(text: string, bannedWords: Iterable<string>): boolean {
  const folded = foldForMatching(text);
  if (!folded) return false;
  for (const word of bannedWords) {
    const target = foldWord(word);
    if (target.length >= 2 && folded.includes(target)) return true;
  }
  return false;
}

export function truncateName(name: string): string {
  return [...name].slice(0, MAX_NAME_LENGTH).join('').trim();
}

export function sanitizeName(nickname: string, bannedWords: Iterable<string>): string {
  const cleaned = cleanCharacters(nickname);
  if (!cleaned || containsBannedWord(cleaned, bannedWords)) return FALLBACK_NAME;
  const shortened = truncateName(cleaned);
  return shortened || FALLBACK_NAME;
}
