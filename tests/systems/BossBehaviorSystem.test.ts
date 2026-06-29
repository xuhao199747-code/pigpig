import { describe, expect, it } from "vitest";

import {
  advanceBossBehavior,
  getBossEnrageModifiers,
  shouldTriggerBossEnrage
} from "../../src/game/systems/BossBehaviorSystem";

describe("boss behavior system", () => {
  it("telegraphs once when entering the warning window before a trigger", () => {
    expect(advanceBossBehavior({ elapsedMs: 700 }, 100, 1000, 250)).toEqual({
      state: { elapsedMs: 800, telegraphShown: true },
      telegraphTriggered: true,
      triggered: false
    });

    expect(advanceBossBehavior({ elapsedMs: 800, telegraphShown: true }, 50, 1000, 250)).toEqual({
      state: { elapsedMs: 850, telegraphShown: true },
      telegraphTriggered: false,
      triggered: false
    });
  });

  it("triggers when the cooldown is reached", () => {
    expect(advanceBossBehavior({ elapsedMs: 900 }, 100, 1000)).toEqual({
      state: { elapsedMs: 0 },
      triggered: true
    });
  });

  it("preserves overflow time after a trigger", () => {
    expect(advanceBossBehavior({ elapsedMs: 900 }, 250, 1000)).toEqual({
      state: { elapsedMs: 150 },
      triggered: true
    });
  });

  it("resets the telegraph flag after the real boss action triggers", () => {
    expect(advanceBossBehavior({ elapsedMs: 900, telegraphShown: true }, 150, 1000, 250)).toEqual({
      state: { elapsedMs: 50, telegraphShown: false },
      telegraphTriggered: false,
      triggered: true
    });
  });

  it("does not trigger before the cooldown", () => {
    expect(advanceBossBehavior({ elapsedMs: 200 }, 300, 1000)).toEqual({
      state: { elapsedMs: 500 },
      triggered: false
    });
  });

  it("triggers boss enrage once below the health threshold", () => {
    expect(shouldTriggerBossEnrage({ currentHealth: 270, maxHealth: 620, alreadyEnraged: false })).toBe(true);
    expect(shouldTriggerBossEnrage({ currentHealth: 300, maxHealth: 620, alreadyEnraged: false })).toBe(false);
    expect(shouldTriggerBossEnrage({ currentHealth: 120, maxHealth: 620, alreadyEnraged: true })).toBe(false);
  });

  it("defines stronger boss behavior modifiers while enraged", () => {
    expect(getBossEnrageModifiers(false)).toEqual({
      cooldownMultiplier: 1,
      speedMultiplier: 1,
      telegraphLeadMultiplier: 1
    });
    expect(getBossEnrageModifiers(true)).toEqual({
      cooldownMultiplier: 0.72,
      speedMultiplier: 1.18,
      telegraphLeadMultiplier: 0.86
    });
  });
});
