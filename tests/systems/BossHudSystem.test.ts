import { describe, expect, it } from "vitest";

import { createBossEnrageWarning, createBossHudPayload, createBossTelegraphWarning } from "../../src/game/systems/BossHudSystem";
import { enemyCatalog } from "../../src/game/data/enemyCatalog";

describe("boss hud system", () => {
  it("creates a clamped boss hud payload from boss health", () => {
    const payload = createBossHudPayload(enemyCatalog.pigKing, -20);

    expect(payload).toEqual({
      id: "pigKing",
      label: "猪王",
      currentHealth: 0,
      maxHealth: 620,
      healthRatio: 0,
      warningText: "猪王 入场",
      isEnraged: false,
      phaseLabel: "压制中",
      barColor: 0xb83025
    });
  });

  it("uses max health as the minimum denominator for malformed definitions", () => {
    const payload = createBossHudPayload({ ...enemyCatalog.pigKing, maxHealth: 0 }, 40);

    expect(payload.maxHealth).toBe(1);
    expect(payload.healthRatio).toBe(1);
  });

  it("creates readable warnings for each boss special move", () => {
    expect(createBossTelegraphWarning(enemyCatalog.ironBarrelBoar, "charge")).toEqual({
      title: "铁桶猪 要冲锋了",
      hint: "离开正面红线"
    });
    expect(createBossTelegraphWarning(enemyCatalog.feedMountain, "slam")).toEqual({
      title: "饲料山 要震地了",
      hint: "跑出红圈"
    });
    expect(createBossTelegraphWarning(enemyCatalog.stitchedPenBeast, "summon")).toEqual({
      title: "缝合栏兽 在叫猪",
      hint: "先清小猪"
    });
  });

  it("creates a readable warning when a boss enrages", () => {
    expect(createBossEnrageWarning(enemyCatalog.pigKing)).toEqual({
      title: "猪王 狂暴了",
      hint: "技能更快，先拉开距离"
    });
  });

  it("marks the boss hud payload when the boss is enraged", () => {
    expect(createBossHudPayload(enemyCatalog.pigKing, 240, true)).toMatchObject({
      isEnraged: true,
      phaseLabel: "狂暴",
      barColor: 0xf05f3b,
      warningText: "猪王 狂暴"
    });
  });
});
