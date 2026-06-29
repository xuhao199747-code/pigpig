import { describe, expect, it } from "vitest";

import { createMiniMapSnapshot, projectWorldPointToMiniMap } from "../../src/game/systems/MiniMapSystem";

const miniMap = { x: 1430, y: 68, width: 132, height: 92 };
const world = { width: 1600, height: 900 };

describe("mini map system", () => {
  it("projects world coordinates into the mini map rectangle", () => {
    expect(projectWorldPointToMiniMap({ x: 0, y: 0 }, world, miniMap)).toEqual({ x: 1430, y: 68 });
    expect(projectWorldPointToMiniMap({ x: 1600, y: 900 }, world, miniMap)).toEqual({ x: 1562, y: 160 });
    expect(projectWorldPointToMiniMap({ x: 800, y: 450 }, world, miniMap)).toEqual({ x: 1496, y: 114 });
  });

  it("clamps off-map entities and marks boss dots distinctly", () => {
    const snapshot = createMiniMapSnapshot({
      world,
      miniMap,
      player: { x: 800, y: 450 },
      enemies: [
        { x: -80, y: 120 },
        { x: 1700, y: 930, isBoss: true }
      ]
    });

    expect(snapshot.player).toEqual({ x: 1496, y: 114, kind: "player" });
    expect(snapshot.enemies).toEqual([
      { x: 1430, y: 80.267, kind: "enemy" },
      { x: 1562, y: 160, kind: "boss" }
    ]);
  });

  it("limits enemy dots so the mini map stays readable", () => {
    const snapshot = createMiniMapSnapshot({
      world,
      miniMap,
      player: { x: 800, y: 450 },
      maxEnemies: 3,
      enemies: Array.from({ length: 8 }, (_, index) => ({ x: index * 100, y: 200 }))
    });

    expect(snapshot.enemies).toHaveLength(3);
  });
});
