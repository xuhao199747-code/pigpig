import { describe, expect, it } from "vitest";

import { canCastUnlockedSkill } from "../../src/game/entities/playerSkillState";

describe("player skill unlock state", () => {
  it("starts with spin available while salt and trap are locked", () => {
    const unlocked = ["spin"] as const;

    expect(canCastUnlockedSkill(unlocked, "spin", 0)).toBe(true);
    expect(canCastUnlockedSkill(unlocked, "saltBurst", 0)).toBe(false);
    expect(canCastUnlockedSkill(unlocked, "pigPenTrap", 0)).toBe(false);
  });

  it("allows a newly unlocked skill only when its cooldown is ready", () => {
    const unlocked = ["spin", "saltBurst"] as const;

    expect(canCastUnlockedSkill(unlocked, "saltBurst", 0)).toBe(true);
    expect(canCastUnlockedSkill(unlocked, "saltBurst", 1200)).toBe(false);
  });
});
