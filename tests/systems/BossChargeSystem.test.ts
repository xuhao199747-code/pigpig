import { describe, expect, it } from "vitest";

import { createBossChargeSpec, createLockedBossChargeVector } from "../../src/game/systems/BossChargeSystem";

describe("boss charge system", () => {
  it("locks a normalized charge vector from the telegraph target", () => {
    expect(createLockedBossChargeVector({ fromX: 100, fromY: 100, targetX: 300, targetY: 100 })).toEqual({
      x: 1,
      y: 0
    });
  });

  it("falls back to horizontal charge when boss overlaps the target", () => {
    expect(createLockedBossChargeVector({ fromX: 100, fromY: 100, targetX: 100, targetY: 100 })).toEqual({
      x: 1,
      y: 0
    });
  });

  it("gives the first boss a long damaging barrel rush", () => {
    expect(createBossChargeSpec({ enemyId: "ironBarrelBoar", power: 2.8, enraged: false })).toEqual({
      durationMs: 720,
      speedMultiplier: 7.2,
      hitRadius: 74,
      damageMultiplier: 1.55,
      trailLength: 360,
      telegraphWidth: 14,
      impactShakeMs: 180
    });
  });

  it("keeps the charge warning as a narrow line instead of a broad cone", () => {
    expect(createBossChargeSpec({ enemyId: "ironBarrelBoar", power: 2.8, enraged: false }).telegraphWidth).toBeLessThanOrEqual(16);
    expect(createBossChargeSpec({ enemyId: "forkliftHog", power: 2.8, enraged: false }).telegraphWidth).toBeLessThanOrEqual(14);
  });

  it("makes enraged charges faster and harsher without changing the hit window shape", () => {
    expect(createBossChargeSpec({ enemyId: "ironBarrelBoar", power: 2.8, enraged: true })).toMatchObject({
      durationMs: 660,
      speedMultiplier: 8.2,
      hitRadius: 74,
      damageMultiplier: 1.75
    });
  });
});
