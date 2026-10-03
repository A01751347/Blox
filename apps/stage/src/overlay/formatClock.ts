export function formatClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function energyBarFill(energy: number, topEnergy: number): number {
  const scale = Math.max(500, topEnergy * 1.15);
  return Math.min(1, Math.max(0, energy / scale));
}
