import { describe, expect, it } from "vitest";

import { findSafeSpawnPoint, isSafeSpawnPoint } from "../../src/game/systems/SpawnPointSystem";

const blockers = [
  { x: 70, y: 465, width: 150, height: 165 },
  { x: 1330, y: 540, width: 140, height: 140 }
];

describe("spawn point system", () => {
  it("rejects points too close to blockers or world edges", () => {
    expect(isSafeSpawnPoint({ x: 95, y: 470 }, { blockers, world: { width: 1600, height: 900 }, padding: 46 })).toBe(false);
    expect(isSafeSpawnPoint({ x: 12, y: 470 }, { blockers, world: { width: 1600, height: 900 }, padding: 46 })).toBe(false);
    expect(isSafeSpawnPoint({ x: 310, y: 470 }, { blockers, world: { width: 1600, height: 900 }, padding: 46 })).toBe(true);
  });

  it("falls back toward the arena center side when random candidates are unsafe", () => {
    const point = findSafeSpawnPoint({
      zone: { id: "west-pen", x: 95, y: 470, radius: 85 },
      blockers,
      world: { width: 1600, height: 900 },
      padding: 46,
      random: () => 0
    });

    expect(point.x).toBeGreaterThan(220);
    expect(isSafeSpawnPoint(point, { blockers, world: { width: 1600, height: 900 }, padding: 46 })).toBe(true);
  });
});
