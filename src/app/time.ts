const OFFSET_MS = -3 * 60 * 60 * 1000;

export function isoBrasilia(d: Date): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().replace('Z', '-03:00');
}

export function diaBrasilia(d: Date): string {
  return isoBrasilia(d).slice(0, 10);
}