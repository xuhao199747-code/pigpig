import { describe, expect, it } from "vitest";

import { weaponCatalog } from "../../src/game/data/weaponCatalog";
import { applyWeaponToProgress } from "../../src/game/systems/WeaponSystem";

describe("weapon system", () => {
  it("applies weapon combat stats to player progress", () => {
    const weapon = weaponCatalog.find((entry) => entry.id === "pigBoneChainsaw")!;
    const progress = applyWeaponToProgress(
      {
        attackDamage: 24,
        critChance: 0.18,
        moveSpeed: 220,
        spinRadius: 125,
        spinDamage: 55,
        saltRadius: 150,
        saltDamage: 40,
        trapRadius: 56,
        trapDamage: 0.2,
        trapDurationMs: 3000,
        coinGainMultiplier: 1,
        pickupPowerMultiplier: 1,
        unlockedSkillIds: ["spin"]
      },
      weapon
    );

    expect(progress.attackDamage).toBe(42);
    expect(progress.critChance).toBeCloseTo(0.25);
  });
});
