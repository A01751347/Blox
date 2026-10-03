import bannedWordsJson from '../data/bannedWords.json' with { type: 'json' };
import { FALLBACK_NAME, sanitizeName } from './nameSanitizer.js';

export interface ModerationStore {
  load(kind: 'blockedUser' | 'bannedWord'): string[];
  add(kind: 'blockedUser' | 'bannedWord', value: string): void;
  remove(kind: 'blockedUser' | 'bannedWord', value: string): void;
}

export class ModerationService {
  private readonly blocked = new Set<string>();
  private readonly customWords = new Set<string>();
  private readonly defaultWords = [...bannedWordsJson.es, ...bannedWordsJson.en];

  constructor(private readonly store?: ModerationStore) {
    store?.load('blockedUser').forEach((id) => this.blocked.add(id));
    store?.load('bannedWord').forEach((word) => this.customWords.add(word));
  }

  displayName = (userId: string, nickname: string): string => {
    if (this.blocked.has(userId)) return FALLBACK_NAME;
    return sanitizeName(nickname, this.allWords());
  };

  blockUser(userId: string): void {
    this.blocked.add(userId);
    this.store?.add('blockedUser', userId);
  }

  unblockUser(userId: string): void {
    this.blocked.delete(userId);
    this.store?.remove('blockedUser', userId);
  }

  addWord(word: string): void {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;
    this.customWords.add(trimmed);
    this.store?.add('bannedWord', trimmed);
  }

  removeWord(word: string): void {
    this.customWords.delete(word);
    this.store?.remove('bannedWord', word);
  }

  isBlocked(userId: string): boolean {
    return this.blocked.has(userId);
  }

  lists(): { blockedUsers: string[]; customWords: string[]; defaultWordCount: number } {
    return {
      blockedUsers: [...this.blocked],
      customWords: [...this.customWords],
      defaultWordCount: this.defaultWords.length,
    };
  }

  private allWords(): string[] {
    return [...this.defaultWords, ...this.customWords];
  }
}
