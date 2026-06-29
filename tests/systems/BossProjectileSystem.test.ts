import { describe, expect, it } from "vitest";

import { createBossProjectilePattern } from "../../src/game/systems/BossProjectileSystem";

describe("boss projectile system", () => {
  it("gives slam bosses radial meat bullets after the shockwave", () => {
    expect(createBossProjectilePattern({ bossId: "feedMountain", enraged: false })).toEqual({
      count: 8,
      speed: 235,
      radius: 12,
      damageMultiplier: 0.42,
      tint: 0xf08a45,
      strokeTint: 0xffd391,
      shape: "meatball",
      burstDelayMs: 18,
      travelDurationMs: 860
    });
  });

  it("makes the final boss projectile pattern denser", () => {
    expect(createBossProjectilePattern({ bossId: "pigKing", enraged: true })).toEqual({
      count: 14,
      speed: 310,
      radius: 10,
      damageMultiplier: 0.5,
      tint: 0xffc66d,
      strokeTint: 0xfff0b0,
      shape: "crown",
      burstDelayMs: 32,
      travelDurationMs: 720
    });
  });

  it("makes forklift bosses fire faster nail-like volleys", () => {
    expect(createBossProjectilePattern({ bossId: "forkliftHog", enraged: false })).toMatchObject({
      count: 7,
      speed: 270,
      radius: 7,
      shape: "nail",
      burstDelayMs: 10
    });
  });
});
