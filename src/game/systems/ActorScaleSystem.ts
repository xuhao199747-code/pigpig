import type { EnemyDefinition } from "../types";

export const playerVisualScale = 0.68;

export function getEnemyVisualScale(definition: EnemyDefinition): number {
  const multiplier = definition.isBoss ? 1.18 : 1.35;
  return roundScale(definition.scale * multiplier);
}

function roundScale(value: number): number {
  return Math.round(value * 1000) / 1000;
}
