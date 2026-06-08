export function computeElapsedSeconds(startedAt: Date, closedAt: Date): number {
  return Math.floor((closedAt.getTime() - startedAt.getTime()) / 1000);
}
