import { describe, expect, it } from "vitest";

import {
  createBossAnimationKeys,
  getBossAnimationKey,
  getBossAnimationTimeScale
} from "../../src/game/systems/BossAnimationSystem";

describe("boss animation system", () => {
  it("maps a boss id to dedicated walk and attack animation keys", () => {
    expect(createBossAnimationKeys("forkliftHog")).toEqual({
      walk: "enemy.forkliftHog.walk",
      attack: "enemy.forkliftHog.attack"
    });
  });

  it("uses attack animation while telegraphing, contact attacking, or charging", () => {
    expect(getBossAnimationKey({ bossId: "pigKing", isAttacking: true, isCharging: false })).toBe("enemy.pigKing.attack");
    expect(getBossAnimationKey({ bossId: "pigKing", isAttacking: false, isCharging: true })).toBe("enemy.pigKing.attack");
  });

  it("speeds up walk animation when enraged or charging", () => {
    expect(getBossAnimationTimeScale({ enraged: false, isCharging: false })).toBe(1);
    expect(getBossAnimationTimeScale({ enraged: true, isCharging: false })).toBe(1.18);
    expect(getBossAnimationTimeScale({ enraged: true, isCharging: true })).toBe(1.45);
  });
});
