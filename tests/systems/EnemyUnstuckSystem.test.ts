import { describe, expect, it } from "vitest";

import { createUnstuckVelocity } from "../../src/game/systems/EnemyUnstuckSystem";

describe("enemy unstuck system", () => {
  it("adds vertical escape when an enemy is pushing into a side blocker", () => {
    expect(createUnstuckVelocity({
      velocityX: -80,
      velocityY: 0,
      targetDeltaX: -400,
      targetDeltaY: 120,
      blockedLeft: true,
      blockedRight: false,
      blockedUp: false,
      blockedDown: false
    })).toEqual({ x: -20, y: 80 });
  });

  it("adds horizontal escape when an enemy is pushing into a vertical blocker", () => {
    expect(createUnstuckVelocity({
      velocityX: 0,
      velocityY: 70,
      targetDeltaX: -160,
      targetDeltaY: 300,
      blockedLeft: false,
      blockedRight: false,
      blockedUp: false,
      blockedDown: true
    })).toEqual({ x: -70, y: 18 });
  });
});
