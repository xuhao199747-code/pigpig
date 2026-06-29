import { describe, expect, it } from "vitest";

import { createBurnTicks, resolveHit } from "../../src/game/systems/CombatResolver";

describe("combat resolver", () => {
  it("applies armor mitigation before returning remaining health", () => {
    const result = resolveHit({
      attackDamage: 30,
      critMultiplier: 1,
      isCrit: false,
      armor: 6,
      currentHealth: 40
    });

    expect(result.finalDamage).toBe(24);
    expect(result.remainingHealth).toBe(16);
  });

  it("creates two small burn ticks after a heated skill hit", () => {
    expect(createBurnTicks({ enabled: true, tickDamage: 8, tickCount: 2, intervalMs: 450 })).toEqual([
      { delayMs: 450, damage: 8 },
      { delayMs: 900, damage: 8 }
    ]);
  });

  it("does not create burn ticks when the heated upgrade is missing", () => {
    expect(createBurnTicks({ enabled: false, tickDamage: 8, tickCount: 2, intervalMs: 450 })).toEqual([]);
  });
});
