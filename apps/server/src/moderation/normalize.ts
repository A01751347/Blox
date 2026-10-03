const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};

export function foldForMatching(text: string): string {
  const folded = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[01345 7@$!]/g, (char) => LEET[char] ?? '')
    .replace(/[^a-zñ]/g, '');
  return folded.replace(/(.)\1+/g, '$1');
}

export function foldWord(word: string): string {
  return foldForMatching(word);
}
