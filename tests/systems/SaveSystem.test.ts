import { describe, expect, it } from "vitest";

import {
  clearSave,
  createDefaultSave,
  createContinueRunData,
  createRunResultSummaryLines,
  createSaveSummaryText,
  hasClearableSaveData,
  loadSave,
  saveActiveRun,
  saveRunResult,
  saveSelectedDifficulty,
  saveSelectedWeapon
} from "../../src/game/systems/SaveSystem";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  length = 0;

  clear(): void {
    this.data.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
    this.length = this.data.size;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
    this.length = this.data.size;
  }
}

const savedProgress = {
  attackDamage: 42,
  critChance: 0.34,
  moveSpeed: 270,
  spinRadius: 175,
  spinDamage: 91,
  saltRadius: 210,
  saltDamage: 72,
  trapRadius: 96,
  trapDamage: 0.44,
  trapDurationMs: 4800,
  coinGainMultiplier: 1.5,
  pickupPowerMultiplier: 1.35,
  unlockedSkillIds: ["spin", "saltBurst"] as const,
  burnEnabled: true
};

describe("save system", () => {
  it("returns a default save when local storage is empty", () => {
    expect(loadSave(new MemoryStorage())).toEqual(createDefaultSave());
  });

  it("persists the selected difficulty", () => {
    const storage = new MemoryStorage();
    saveSelectedDifficulty(storage, "butcherNight");

    expect(loadSave(storage).lastDifficultyId).toBe("butcherNight");
  });

  it("persists the selected weapon for continue runs", () => {
    const storage = new MemoryStorage();
    saveSelectedWeapon(storage, "dragonSlayer");

    expect(loadSave(storage).lastWeaponId).toBe("dragonSlayer");
  });

  it("keeps the highest wave and coin record after a run", () => {
    const storage = new MemoryStorage();
    saveRunResult(storage, { difficultyId: "standard", weaponId: "dragonSlayer", wave: 4, coins: 12, level: 2, kills: 48, victory: false });
    saveRunResult(storage, { difficultyId: "casual", weaponId: "rustyCleaver", wave: 2, coins: 20, level: 1, kills: 22, victory: false });

    expect(loadSave(storage).bestRun).toMatchObject({
      difficultyId: "standard",
      weaponId: "dragonSlayer",
      wave: 4,
      coins: 12,
      level: 2,
      kills: 48
    });
    expect(loadSave(storage).lastRun).toMatchObject({
      difficultyId: "casual",
      weaponId: "rustyCleaver",
      wave: 2,
      kills: 22
    });
  });

  it("ignores obsolete inventory fields from older saves", () => {
    const storage = new MemoryStorage();
    storage.setItem("zhu-zhu-huang-hun.save.v1", JSON.stringify({
      version: 1,
      lastDifficultyId: "standard",
      runCount: 2,
      bestRun: null,
      kills: 999,
      ownedWeaponIds: ["duskHook"],
      equippedWeaponId: "duskHook"
    }));

    expect(loadSave(storage)).toEqual({
      version: 1,
      lastDifficultyId: "standard",
      lastWeaponId: "rustyCleaver",
      runCount: 2,
      bestRun: null,
      lastRun: null,
      activeRun: null
    });
  });

  it("normalizes removed difficulty ids back to standard", () => {
    const storage = new MemoryStorage();
    storage.setItem("zhu-zhu-huang-hun.save.v1", JSON.stringify({
      version: 1,
      lastDifficultyId: "nightmarePigFog",
      lastWeaponId: "dragonSlayer",
      runCount: 1,
      bestRun: null,
      lastRun: null
    }));

    expect(loadSave(storage).lastDifficultyId).toBe("standard");
  });

  it("normalizes older run records without kills", () => {
    const storage = new MemoryStorage();
    storage.setItem("zhu-zhu-huang-hun.save.v1", JSON.stringify({
      version: 1,
      lastDifficultyId: "standard",
      lastWeaponId: "rustyCleaver",
      runCount: 1,
      bestRun: {
        difficultyId: "standard",
        weaponId: "rustyCleaver",
        wave: 3,
        coins: 30,
        level: 2,
        victory: false,
        completedAt: "2026-01-01T00:00:00.000Z"
      },
      lastRun: {
        difficultyId: "standard",
        weaponId: "rustyCleaver",
        wave: 3,
        coins: 30,
        level: 2,
        victory: false,
        completedAt: "2026-01-01T00:00:00.000Z"
      }
    }));

    expect(loadSave(storage).lastRun?.kills).toBe(0);
    expect(loadSave(storage).bestRun?.kills).toBe(0);
  });

  it("creates continue run data from the last saved choices", () => {
    const save = {
      ...createDefaultSave(),
      lastDifficultyId: "hard",
      lastWeaponId: "dragonSlayer"
    } as const;

    expect(createContinueRunData(save)).toEqual({
      difficultyId: "hard",
      weaponId: "dragonSlayer"
    });
  });

  it("persists an active local run for continue game", () => {
    const storage = new MemoryStorage();
    saveActiveRun(storage, {
      difficultyId: "butcherNight",
      weaponId: "dragonSlayer",
      wave: 4,
      coins: 88,
      level: 3,
      exp: 17,
      kills: 64,
      elapsedMs: 120000,
      health: 41,
      stamina: 33,
      armor: 12,
      unlockedSkillIds: ["spin", "saltBurst"],
      progress: savedProgress
    });

    const save = loadSave(storage);
    expect(save.activeRun).toMatchObject({
      difficultyId: "butcherNight",
      weaponId: "dragonSlayer",
      wave: 4,
      coins: 88,
      level: 3,
      exp: 17,
      kills: 64,
      health: 41,
      stamina: 33,
      armor: 12,
      unlockedSkillIds: ["spin", "saltBurst"],
      progress: savedProgress
    });
    expect(createContinueRunData(save)).toMatchObject({
      difficultyId: "butcherNight",
      weaponId: "dragonSlayer",
      activeRun: save.activeRun
    });
    expect(save.activeRun?.progress).toEqual(savedProgress);
  });

  it("treats an unfinished active run as clearable save data", () => {
    const storage = new MemoryStorage();
    const save = saveActiveRun(storage, {
      difficultyId: "standard",
      weaponId: "rustyCleaver",
      wave: 2,
      coins: 18,
      level: 1,
      exp: 9,
      kills: 17,
      elapsedMs: 45000,
      health: 74,
      stamina: 51,
      armor: 30,
      unlockedSkillIds: ["spin"],
      progress: { ...savedProgress, unlockedSkillIds: ["spin"] as const }
    });

    expect(save.runCount).toBe(0);
    expect(hasClearableSaveData(save)).toBe(true);
    expect(hasClearableSaveData(createDefaultSave())).toBe(false);
  });

  it("normalizes older active runs without vitality fields", () => {
    const storage = new MemoryStorage();
    storage.setItem("zhu-zhu-huang-hun.save.v1", JSON.stringify({
      version: 1,
      lastDifficultyId: "standard",
      lastWeaponId: "rustyCleaver",
      runCount: 0,
      bestRun: null,
      lastRun: null,
      activeRun: {
        difficultyId: "standard",
        weaponId: "rustyCleaver",
        wave: 3,
        coins: 22,
        level: 2,
        exp: 8,
        kills: 31,
        elapsedMs: 60000,
        unlockedSkillIds: ["spin"],
        progress: savedProgress,
        savedAt: "2026-01-01T00:00:00.000Z"
      }
    }));

    expect(loadSave(storage).activeRun).toMatchObject({
      health: 100,
      stamina: 100,
      armor: 50
    });
  });

  it("clears active local run after a result is saved", () => {
    const storage = new MemoryStorage();
    saveActiveRun(storage, {
      difficultyId: "butcherNight",
      weaponId: "dragonSlayer",
      wave: 4,
      coins: 88,
      level: 3,
      exp: 17,
      kills: 64,
      elapsedMs: 120000,
      health: 41,
      stamina: 33,
      armor: 12,
      unlockedSkillIds: ["spin", "saltBurst"],
      progress: savedProgress
    });

    const save = saveRunResult(storage, {
      difficultyId: "hard",
      weaponId: "dragonSlayer",
      wave: 4,
      coins: 88,
      level: 3,
      kills: 64,
      victory: false
    });

    expect(save.activeRun).toBeNull();
    expect(loadSave(storage).activeRun).toBeNull();
  });

  it("creates a readable menu summary for local saves", () => {
    const storage = new MemoryStorage();
    saveRunResult(storage, { difficultyId: "standard", weaponId: "dragonSlayer", wave: 4, coins: 12, level: 2, kills: 48, victory: false });
    saveRunResult(storage, { difficultyId: "casual", weaponId: "rustyCleaver", wave: 2, coins: 20, level: 1, kills: 22, victory: false });

    expect(createSaveSummaryText(loadSave(storage))).toBe("上次：生锈的屠刀 · 休闲 · 第 2 波    最好：杀猪屠龙刀 · 第 4 波 · 12 金币");
    expect(createSaveSummaryText(createDefaultSave())).toBe("本地存档：暂无记录，先开一局把猪圈热起来。");
  });

  it("highlights an active local run in the menu summary", () => {
    const storage = new MemoryStorage();
    const save = saveActiveRun(storage, {
      difficultyId: "butcherNight",
      weaponId: "hundredMeterPigBlade",
      wave: 6,
      coins: 120,
      level: 4,
      exp: 12,
      kills: 108,
      elapsedMs: 240000,
      health: 58,
      stamina: 21,
      armor: 9,
      unlockedSkillIds: ["spin", "saltBurst", "pigPenTrap"],
      progress: {
        ...savedProgress,
        unlockedSkillIds: ["spin", "saltBurst", "pigPenTrap"] as const
      }
    });

    expect(createSaveSummaryText(save)).toBe("继续：生锈的屠刀 · 屠宰夜 · 第 6 波 · 等级 4 · 108 击杀");
  });

  it("creates readable result lines for the end-of-run panel", () => {
    const storage = new MemoryStorage();
    const save = saveRunResult(storage, {
      difficultyId: "butcherNight",
      weaponId: "hundredMeterPigBlade",
      wave: 10,
      coins: 186,
      level: 6,
      kills: 320,
      victory: true
    });

    expect(createRunResultSummaryLines(save)).toEqual([
      "本局：通关 · 屠宰夜 · 生锈的屠刀",
      "进度：第 10 波 · 等级 6 · 击杀 320 只猪",
      "收获：186 金币",
      "新纪录：第 10 波 · 等级 6 · 320 击杀",
      "累计开局：1 次"
    ]);
  });

  it("clears local run records and selected choices back to defaults", () => {
    const storage = new MemoryStorage();
    saveSelectedDifficulty(storage, "butcherNight");
    saveSelectedWeapon(storage, "dragonSlayer");
    saveRunResult(storage, {
      difficultyId: "butcherNight",
      weaponId: "dragonSlayer",
      wave: 6,
      coins: 99,
      level: 4,
      kills: 120,
      victory: false
    });

    expect(clearSave(storage)).toEqual(createDefaultSave());
    expect(loadSave(storage)).toEqual(createDefaultSave());
  });

  it("distinguishes a normal saved run from an older best record", () => {
    const storage = new MemoryStorage();
    saveRunResult(storage, { difficultyId: "standard", weaponId: "dragonSlayer", wave: 8, coins: 220, level: 7, kills: 188, victory: false });
    const save = saveRunResult(storage, { difficultyId: "casual", weaponId: "rustyCleaver", wave: 3, coins: 45, level: 2, kills: 31, victory: false });

    expect(createRunResultSummaryLines(save)).toEqual([
      "本局：战败 · 休闲 · 生锈的屠刀",
      "进度：第 3 波 · 等级 2 · 击杀 31 只猪",
      "收获：45 金币",
      "最好：第 8 波 · 等级 7 · 188 击杀",
      "累计开局：2 次"
    ]);
  });
});
