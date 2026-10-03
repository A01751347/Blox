import type { InputEvent, ViewerRef } from '../game/inputEvents.js';

type Loose = Record<string, unknown>;

function asRecord(value: unknown): Loose | null {
  return typeof value === 'object' && value !== null ? (value as Loose) : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))
    return Number(value);
  return fallback;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
}

export function viewerFrom(raw: unknown): ViewerRef | null {
  const user = asRecord(asRecord(raw)?.user);
  if (!user) return null;
  const userId = asString(user.userId) || asString(user.uniqueId);
  if (!userId) return null;
  return { userId, nickname: asString(user.nickname) || asString(user.uniqueId) };
}

export function normalizeChat(raw: unknown): InputEvent | null {
  const viewer = viewerFrom(raw);
  const comment = asString(asRecord(raw)?.comment);
  if (!viewer || !comment) return null;
  return { kind: 'chat', ...viewer, text: comment };
}

export function normalizeGift(raw: unknown): InputEvent | null {
  const viewer = viewerFrom(raw);
  const record = asRecord(raw);
  if (!viewer || !record) return null;
  const details =
    asRecord(record.giftDetails) ??
    asRecord(record.gift) ??
    asRecord(record.extendedGiftInfo) ??
    {};
  const streakable = asNumber(details.giftType ?? details.type) === 1;
  const repeatEnd = record.repeatEnd === true || asNumber(record.repeatEnd) === 1;
  return {
    kind: 'gift',
    ...viewer,
    giftName: asString(details.giftName ?? details.name) || 'gift',
    diamondCount: Math.max(0, asNumber(details.diamondCount)),
    repeatCount: Math.max(1, asNumber(record.repeatCount, 1)),
    repeatEnd: streakable ? repeatEnd : true,
    streakable,
  };
}

export function normalizeLike(raw: unknown): InputEvent | null {
  const viewer = viewerFrom(raw);
  const likeCount = asNumber(asRecord(raw)?.likeCount);
  if (!viewer || likeCount <= 0) return null;
  return { kind: 'like', ...viewer, likeCount };
}

export function normalizeFollow(raw: unknown): InputEvent | null {
  const viewer = viewerFrom(raw);
  return viewer ? { kind: 'follow', ...viewer } : null;
}

export function normalizeShare(raw: unknown): InputEvent | null {
  const viewer = viewerFrom(raw);
  return viewer ? { kind: 'share', ...viewer } : null;
}

export function safeStringify(value: unknown, maxLength = 8000): string {
  const text = JSON.stringify(value, (_key, item) =>
    typeof item === 'bigint' ? item.toString() : item,
  );
  return (text ?? 'null').slice(0, maxLength);
}
