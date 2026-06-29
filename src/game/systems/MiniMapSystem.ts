export type MiniMapRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MiniMapWorld = {
  width: number;
  height: number;
};

export type MiniMapEntity = {
  x: number;
  y: number;
  isBoss?: boolean;
};

export type MiniMapDot = {
  x: number;
  y: number;
  kind: "player" | "enemy" | "boss";
};

export type MiniMapSnapshot = {
  player: MiniMapDot;
  enemies: MiniMapDot[];
};

export function projectWorldPointToMiniMap(
  point: { x: number; y: number },
  world: MiniMapWorld,
  miniMap: MiniMapRect
): { x: number; y: number } {
  const ratioX = clampRatio(point.x / Math.max(1, world.width));
  const ratioY = clampRatio(point.y / Math.max(1, world.height));
  return {
    x: roundMiniMapValue(miniMap.x + ratioX * miniMap.width),
    y: roundMiniMapValue(miniMap.y + ratioY * miniMap.height)
  };
}

export function createMiniMapSnapshot(input: {
  world: MiniMapWorld;
  miniMap: MiniMapRect;
  player: { x: number; y: number };
  enemies: MiniMapEntity[];
  maxEnemies?: number;
}): MiniMapSnapshot {
  const maxEnemies = input.maxEnemies ?? 10;
  return {
    player: {
      ...projectWorldPointToMiniMap(input.player, input.world, input.miniMap),
      kind: "player"
    },
    enemies: input.enemies.slice(0, maxEnemies).map((enemy) => ({
      ...projectWorldPointToMiniMap(enemy, input.world, input.miniMap),
      kind: enemy.isBoss ? "boss" : "enemy"
    }))
  };
}

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function roundMiniMapValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
