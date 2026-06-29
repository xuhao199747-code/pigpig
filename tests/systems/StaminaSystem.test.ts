import { describe, expect, it } from "vitest";

import { advanceStamina, getSprintMoveSpeedMultiplier } from "../../src/game/systems/StaminaSystem";

describe("stamina system", () => {
  it("spends stamina while sprinting and moving", () => {
    const result = advanceStamina({
      currentStamina: 60,
      maxStamina: 100,
      deltaMs: 1000,
      wantsSprint: true,
      isMoving: true
    });

    expect(result.currentStamina).toBe(34);
    expect(result.isSprinting).toBe(true);
    expect(getSprintMoveSpeedMultiplier(result.isSprinting)).toBe(1.35);
  });

  it("recovers stamina when not sprinting or when standing still", () => {
    expect(advanceStamina({
      currentStamina: 40,
      maxStamina: 100,
      deltaMs: 1000,
      wantsSprint: false,
      isMoving: true
    })).toEqual({ currentStamina: 56, isSprinting: false });

    expect(advanceStamina({
      currentStamina: 96,
      maxStamina: 100,
      deltaMs: 1000,
      wantsSprint: true,
      isMoving: false
    })).toEqual({ currentStamina: 100, isSprinting: false });
  });

  it("blocks sprinting when stamina is too low", () => {
    expect(advanceStamina({
      currentStamina: 7,
      maxStamina: 100,
      deltaMs: 1000,
      wantsSprint: true,
      isMoving: true
    })).toEqual({ currentStamina: 23, isSprinting: false });
  });
});
