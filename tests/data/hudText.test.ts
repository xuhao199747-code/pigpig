import { describe, expect, it } from "vitest";

import {
  createCharacterStatsView,
  createSkillBadgeViews,
  formatCharacterStatsBlock,
  formatRunResourceLine,
  formatSkillStatus,
  formatSkillUnlockToast,
  formatWaveObjectiveLine,
  formatWaveProgressLine
} from "../../src/game/data/hudText";

describe("hud text formatting", () => {
  it("derives the character stats block from live player progress", () => {
    const stats = createCharacterStatsView({
      attackDamage: 42,
      critChance: 0.34,
      moveSpeed: 275,
      spinRadius: 120,
      spinDamage: 55,
      saltRadius: 150,
      saltDamage: 40,
      trapRadius: 100,
      trapDamage: 10,
      trapDurationMs: 3000,
      coinGainMultiplier: 1,
      pickupPowerMultiplier: 1,
      unlockedSkillIds: []
    });

    expect(formatCharacterStatsBlock(stats)).toBe("攻击 42   暴击 34%\n移速 1.25   闪避 12%");
  });

  it("keeps the character stats block compact", () => {
    const block = formatCharacterStatsBlock({
      attackDamage: 24,
      critChancePercent: 18,
      moveSpeed: 1,
      dodgeChancePercent: 12
    });

    expect(block.split("\n")).toHaveLength(2);
  });

  it("summarizes unlocked skills and upgrade tiers for the character panel", () => {
    const badges = createSkillBadgeViews({
      attackDamage: 36,
      critChance: 0.26,
      moveSpeed: 245,
      spinRadius: 160,
      spinDamage: 73,
      saltRadius: 185,
      saltDamage: 56,
      trapRadius: 82,
      trapDamage: 0.32,
      trapDurationMs: 4200,
      coinGainMultiplier: 1,
      pickupPowerMultiplier: 1,
      unlockedSkillIds: ["spin", "saltBurst", "pigPenTrap"],
      burnEnabled: true
    });

    expect(badges).toEqual([
      { id: "spin", glyph: "旋", label: "旋斩", tier: 2, unlocked: true },
      { id: "saltBurst", glyph: "盐", label: "盐袋", tier: 2, unlocked: true },
      { id: "pigPenTrap", glyph: "圈", label: "猪圈", tier: 3, unlocked: true },
      { id: "burn", glyph: "火", label: "灼烧", tier: 1, unlocked: true }
    ]);
  });

  it("distinguishes locked, ready, and cooling-down skills", () => {
    expect(formatSkillStatus(false, 0)).toBe("升级时获得");
    expect(formatSkillStatus(true, 0)).toBe("就绪");
    expect(formatSkillStatus(true, 1250)).toBe("1.3s");
  });

  it("formats a clear toast when a skill is unlocked into the hotbar", () => {
    expect(formatSkillUnlockToast("saltBurst")).toBe("获得技能：W 盐袋爆撒");
    expect(formatSkillUnlockToast("pigPenTrap")).toBe("获得技能：E 猪圈陷阱");
  });

  it("combines coins and kills into a compact run resource line", () => {
    expect(formatRunResourceLine({ coins: 186, kills: 23 })).toBe("金币 186   击杀 23");
  });

  it("formats live wave progress for cleanup and boss phases", () => {
    expect(formatWaveProgressLine({
      spawned: 8,
      spawnBudget: 14,
      livingEnemies: 5,
      bossSpawned: false,
      normalSpawnComplete: false
    })).toBe("清场 8/14 · 场上 5");

    expect(formatWaveProgressLine({
      spawned: 18,
      spawnBudget: 18,
      livingEnemies: 0,
      bossId: "ironBarrelBoar",
      bossSpawned: false,
      normalSpawnComplete: true
    })).toBe("清场完成 · 等 Boss");

    expect(formatWaveProgressLine({
      spawned: 18,
      spawnBudget: 18,
      livingEnemies: 1,
      bossId: "ironBarrelBoar",
      bossSpawned: true,
      normalSpawnComplete: true
    })).toBe("Boss 已入场 · 场上 1");
  });

  it("formats the live wave objective without reintroducing task wording", () => {
    const text = formatWaveObjectiveLine(
      { title: "第 10 波 · 猪王终局", objective: "清空 30 只猪后，猪王会进场。打完这一波就收工。", isBossWave: true },
      {
        spawned: 30,
        spawnBudget: 30,
        livingEnemies: 1,
        bossId: "pigKing",
        bossSpawned: true,
        normalSpawnComplete: true
      }
    );

    expect(text).toBe("目标：清空 30 只猪后，猪王会进场。打完这一波就收工。\n进度：Boss 已入场 · 场上 1");
    expect(text).not.toContain("任务");
    expect(text).not.toContain("主线");
    expect(text).not.toContain("支线");
  });
});
