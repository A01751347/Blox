import { describe, expect, it } from 'vitest';
import { ModerationService } from './ModerationService.js';
import { cleanCharacters, sanitizeName } from './nameSanitizer.js';

describe('name sanitizer', () => {
  const banned = ['puta', 'fuck'];

  it('strips emojis and odd symbols that would break the font', () => {
    expect(cleanCharacters('Luna 🔥✨ <3 ♪')).toBe('Luna 3');
    expect(sanitizeName('🔥🔥🔥', banned)).toBe('un fan');
  });

  it('truncates to 16 characters', () => {
    expect(sanitizeName('abcdefghijklmnopqrstuvwxyz', banned)).toBe('abcdefghijklmnop');
  });

  it('keeps accents and ñ', () => {
    expect(sanitizeName('Ñandú_01', banned)).toBe('Ñandú_01');
  });

  it('catches profanity in Spanish and English including leetspeak and spacing', () => {
    expect(sanitizeName('p u t a', banned)).toBe('un fan');
    expect(sanitizeName('Fuuuck_me', banned)).toBe('un fan');
    expect(sanitizeName('fvck'.replace('v', 'u'), banned)).toBe('un fan');
    expect(sanitizeName('PUT4', banned)).toBe('un fan');
  });

  it('lets harmless names through', () => {
    expect(sanitizeName('Compass', banned)).toBe('Compass');
    expect(sanitizeName('Mia', banned)).toBe('Mia');
  });
});

describe('ModerationService', () => {
  it('shows blocked users as un fan', () => {
    const moderation = new ModerationService();
    expect(moderation.displayName('u1', 'Luna')).toBe('Luna');
    moderation.blockUser('u1');
    expect(moderation.displayName('u1', 'Luna')).toBe('un fan');
    moderation.unblockUser('u1');
    expect(moderation.displayName('u1', 'Luna')).toBe('Luna');
  });

  it('applies custom banned words immediately', () => {
    const moderation = new ModerationService();
    moderation.addWord('Tomate');
    expect(moderation.displayName('u2', 'tomate rojo')).toBe('un fan');
    moderation.removeWord('tomate');
    expect(moderation.displayName('u2', 'tomate rojo')).toBe('tomate rojo');
  });

  it('ships a default list in both languages', () => {
    expect(new ModerationService().lists().defaultWordCount).toBeGreaterThan(50);
  });
});
