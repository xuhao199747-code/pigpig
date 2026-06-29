import { describe, expect, it } from "vitest";

import {
  createBossChargeTrailPresentation,
  createBossSlamImpactPresentation,
  createBossSummonGatePresentation
} from "../../src/game/systems/BossActionPresentationSystem";

describe("boss action presentation system", () => {
  it("gives charge bosses a layered red line instead of a broad warning strip", () => {
    expect(createBossChargeTrailPresentation({ enemyId: "forkliftHog", power: 2.8, enraged: true })).toEqual({
      afterimageCount: 5,
      dustCount: 9,
      trailLength: 282,
      trailWidth: 13,
      durationMs: 420,
      tint: 0xff3328,
      glowAlpha: 0.24,
      coreAlpha: 0.92,
      strokeAlpha: 0.66
    });
  });

  it("makes the first boss charge warning a narrow red danger line", () => {
    expect(createBossChargeTrailPresentation({ enemyId: "ironBarrelBoar", power: 2.8, enraged: false })).toMatchObject({
      afterimageCount: 5,
      dustCount: 12,
      trailLength: 360,
      trailWidth: 14,
      durationMs: 520,
      tint: 0xd9281f,
      glowAlpha: 0.18,
      coreAlpha: 0.86,
      strokeAlpha: 0.58
    });
  });

  it("turns slam attacks into staged shockwaves with debris", () => {
    expect(createBossSlamImpactPresentation({ enemyId: "feedMountain", radius: 210, enraged: false })).toEqual({
      ringCount: 3,
      debrisCount: 14,
      crackCount: 8,
      durationMs: 520,
      tint: 0xf08a45
    });
  });

  it("gives summon bosses readable gate effects around every spawn point", () => {
    expect(createBossSummonGatePresentation({ enemyId: "stitchedPenBeast", count: 4, enraged: true })).toEqual({
      gateCount: 4,
      sparkCountPerGate: 5,
      durationMs: 700,
      radius: 34,
      tint: 0xffc66d
    });
  });
});
