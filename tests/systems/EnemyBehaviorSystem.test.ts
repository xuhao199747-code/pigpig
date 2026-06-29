import { describe, expect, it } from "vitest";

import {
  advanceEnemyBehavior,
  getFeedAuraPresentation,
  getFeedAuraSpeedMultiplier,
  hasFeedAura
} from "../../src/game/systems/EnemyBehaviorSystem";
import { enemyCatalog } from "../../src/game/data/enemyCatalog";

describe("enemy behavior system", () => {
  it("keeps ordinary pigs on their base speed", () => {
    expect(
      advanceEnemyBehavior({
        definition: enemyCatalog.fatPig,
        state: { elapsedMs: 0 },
        deltaMs: 200,
        feedAuraMultiplier: 1
      })
    ).toEqual({
      speedMultiplier: 1,
      state: { elapsedMs: 200, burstRemainingMs: 0 },
      telegraphTriggered: false
    });
  });

  it("lets charge pigs periodically burst faster after a short warning", () => {
    expect(
      advanceEnemyBehavior({
        definition: enemyCatalog.chargePig,
        state: { elapsedMs: 1050 },
        deltaMs: 100,
        feedAuraMultiplier: 1
      })
    ).toEqual({
      speedMultiplier: 1.68,
      state: { elapsedMs: 0, burstRemainingMs: 420 },
      telegraphTriggered: true
    });
  });

  it("stacks feed aura speed on top of variant movement", () => {
    expect(
      advanceEnemyBehavior({
        definition: enemyCatalog.leanPig,
        state: { elapsedMs: 50 },
        deltaMs: 100,
        feedAuraMultiplier: 1.18
      })
    ).toEqual({
      speedMultiplier: 1.18,
      state: { elapsedMs: 150, burstRemainingMs: 0 },
      telegraphTriggered: false
    });
  });

  it("detects and presents the feed pig aura", () => {
    expect(hasFeedAura(enemyCatalog.feedPig)).toBe(true);
    expect(hasFeedAura(enemyCatalog.leanPig)).toBe(false);
    expect(getFeedAuraSpeedMultiplier({ distance: 120 })).toBe(1.18);
    expect(getFeedAuraSpeedMultiplier({ distance: 260 })).toBe(1);
    expect(getFeedAuraPresentation()).toEqual({
      radius: 170,
      tint: 0xffc76a,
      alpha: 0.13
    });
  });
});
