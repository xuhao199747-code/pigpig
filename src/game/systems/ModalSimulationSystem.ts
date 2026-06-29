export function shouldFreezeArenaSimulation(input: {
  gameEnded: boolean;
  isLeveling: boolean;
  isPaused: boolean;
}): boolean {
  return input.gameEnded || input.isLeveling || input.isPaused;
}

export function flattenModalChildren<T>(children: readonly (T | readonly T[])[]): T[] {
  return children.flatMap((child) => Array.isArray(child) ? child : [child]);
}
