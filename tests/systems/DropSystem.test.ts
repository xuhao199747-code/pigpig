import { describe, expect, it } from "vitest";

import { applyPickupEffect, rollPickupDrop } from "../../src/game/systems/DropSystem";

describe("drop system", () => {
  it("rolls a health pickup when the health threshold is hit", () => {
    const pickup = rollPickupDrop({
      rolls: [0.01, 0.99, 0.99],
      enemyIsBoss: false
    });

    expect(pickup?.type).toBe("health");
  });

  it("does not drop a pickup when every roll misses", () => {
    const pickup = rollPickupDrop({
      rolls: [0.99, 0.99, 0.99],
      enemyIsBoss: false
    });

    expect(pickup).toBeNull();
  });

  it("applies pickup effects without exceeding player resource caps", () => {
    expect(applyPickupEffect({
      type: "armor",
      health: 80,
      maxHealth: 100,
      stamina: 70,
      maxStamina: 100,
      armor: 42,
      maxArmor: 50
    })).toMatchObject({ health: 80, stamina: 70, armor: 50 });
  });

  it("scales pickup recovery from survival upgrades", () => {
    expect(applyPickupEffect({
      type: "health",
      health: 30,
      maxHealth: 100,
      stamina: 70,
      maxStamina: 100,
      armor: 10,
      maxArmor: 50,
      pickupPowerMultiplier: 1.35
    })).toMatchObject({ health: 62, stamina: 70, armor: 10 });
  });
});
