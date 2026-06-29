import { describe, expect, it } from "vitest";

import {
  createBossCodexEntries,
  createEnemyCodexEntries,
  createWeaponCodexEntries,
  getCodexCategorySummary
} from "../../src/game/data/codexCatalog";

describe("codex catalog", () => {
  it("separates ordinary pigs from boss pigs", () => {
    const enemies = createEnemyCodexEntries();
    const bosses = createBossCodexEntries();

    expect(enemies.map((entry) => entry.id)).toEqual([
      "fatPig",
      "leanPig",
      "forkPig",
      "helmetPig",
      "chargePig",
      "feedPig",
      "elitePenPig"
    ]);
    expect(bosses.map((entry) => entry.id)).toEqual([
      "ironBarrelBoar",
      "feedMountain",
      "forkliftHog",
      "stitchedPenBeast",
      "pigKing"
    ]);
  });

  it("describes boss behavior in readable Chinese", () => {
    expect(createBossCodexEntries().map((entry) => entry.trait)).toEqual([
      "冲锋型 Boss：蓄力后直线猛撞",
      "震地型 Boss：周期性范围砸地",
      "冲锋型 Boss：蓄力后直线猛撞",
      "召唤型 Boss：呼叫小猪包围战场",
      "震地型 Boss：周期性范围砸地"
    ]);
  });

  it("formats weapons with rarity, damage, speed, and range", () => {
    expect(createWeaponCodexEntries()[0]).toMatchObject({
      id: "rustyCleaver",
      title: "生锈的屠刀",
      subtitle: "普通 · 快速挥砍",
      stats: "攻击 24 · 1.54 次/秒 · 范围 88"
    });
    expect(createWeaponCodexEntries().at(-1)).toMatchObject({
      id: "dragonSlayer",
      subtitle: "史诗 · 双手重劈"
    });
  });

  it("summarizes each category for the menu panel", () => {
    expect(getCodexCategorySummary("enemies")).toBe("7 种荒诞小猪");
    expect(getCodexCategorySummary("bosses")).toBe("5 个夸张 Boss");
    expect(getCodexCategorySummary("weapons")).toBe("5 把本局可选武器");
  });
});
