import { describe, expect, it } from "vitest";

import { applyUpgrade, getEligibleUpgrades, getUpgradeChoiceView, rollUpgradeChoices } from "../../src/game/systems/UpgradeSystem";

const initialState = {
  attackDamage: 24,
  critChance: 0.18,
  moveSpeed: 220,
  spinRadius: 125,
  spinDamage: 55,
  saltRadius: 150,
  saltDamage: 40,
  trapRadius: 56,
  trapDamage: 0.2,
  trapDurationMs: 3000,
  coinGainMultiplier: 1,
  pickupPowerMultiplier: 1,
  unlockedSkillIds: ["spin" as const]
};

describe("upgrade system", () => {
  it("applies cleaver tempering as a direct damage increase", () => {
    const next = applyUpgrade(
      initialState,
      "cleaverTempering"
    );

    expect(next.attackDamage).toBe(30);
  });

  it("offers unlock cards but hides enhancements for locked skills", () => {
    expect(getEligibleUpgrades(initialState).map((upgrade) => upgrade.id)).toEqual([
      "cleaverTempering",
      "openRibTechnique",
      "wideButcherSpin",
      "backAlleyKnifeWind",
      "unlockSaltBurst",
      "unlockPigPenTrap",
      "bloodRush",
      "piggyBankRitual",
      "threePackButcher"
    ]);
  });

  it("replaces an unlock card with its enhancements after selection", () => {
    const withSalt = applyUpgrade(initialState, "unlockSaltBurst");

    expect(withSalt.unlockedSkillIds).toEqual(["spin", "saltBurst"]);
    expect(getEligibleUpgrades(withSalt).map((upgrade) => upgrade.id)).toContain("coarseSalt");
    expect(getEligibleUpgrades(withSalt).map((upgrade) => upgrade.id)).toContain("saltedWound");
    expect(getEligibleUpgrades(withSalt).map((upgrade) => upgrade.id)).toContain("perfectHeat");
    expect(getEligibleUpgrades(withSalt).map((upgrade) => upgrade.id)).not.toContain("unlockSaltBurst");
  });

  it("applies skill upgrade cards to the matching combat fields", () => {
    expect(applyUpgrade(initialState, "wideButcherSpin").spinRadius).toBe(160);
    expect(applyUpgrade(initialState, "backAlleyKnifeWind").spinDamage).toBe(73);
    expect(applyUpgrade(initialState, "saltedWound").saltDamage).toBe(56);
    expect(applyUpgrade(initialState, "widePigPen").trapRadius).toBe(82);
    expect(applyUpgrade(initialState, "barbedFence").trapDamage).toBeCloseTo(0.32);
  });

  it("applies economy and survival passive upgrades", () => {
    expect(applyUpgrade(initialState, "piggyBankRitual").coinGainMultiplier).toBeCloseTo(1.25);
    expect(applyUpgrade(initialState, "threePackButcher").pickupPowerMultiplier).toBeCloseTo(1.35);
  });

  it("rolls unique eligible choices from a rotating cursor for rerolls", () => {
    expect(rollUpgradeChoices(3, 0, initialState).map((choice) => choice.id)).toEqual([
      "cleaverTempering",
      "openRibTechnique",
      "unlockSaltBurst"
    ]);
    expect(rollUpgradeChoices(3, 2, initialState).map((choice) => choice.id)).toEqual([
      "wideButcherSpin",
      "backAlleyKnifeWind",
      "unlockSaltBurst",
    ]);
  });

  it("keeps at least one active skill unlock visible until all skills are learned", () => {
    expect(rollUpgradeChoices(3, 6, initialState).map((choice) => choice.id)).toContain("unlockSaltBurst");

    const withSalt = applyUpgrade(initialState, "unlockSaltBurst");
    expect(rollUpgradeChoices(3, 6, withSalt).map((choice) => choice.id)).toContain("unlockPigPenTrap");
  });

  it("exposes a player-facing description for upgrade choices", () => {
    expect(getUpgradeChoiceView("coarseSalt")).toEqual({
      id: "coarseSalt",
      label: "粗盐增量",
      description: "盐袋爆撒范围 +35，密集猪群更容易一起腌。",
      kind: "skill",
      categoryLabel: "技能强化",
      effectLine: "强化 W · 范围 +35",
      glyph: "盐",
      tone: "salt"
    });
  });

  it("summarizes unlock and stat cards with clear card categories", () => {
    expect(getUpgradeChoiceView("unlockPigPenTrap")).toMatchObject({
      categoryLabel: "新技能",
      effectLine: "解锁 E · 猪圈陷阱"
    });
    expect(getUpgradeChoiceView("bloodRush")).toMatchObject({
      categoryLabel: "属性成长",
      effectLine: "永久属性 · 移速 +25"
    });
  });

  it("marks skill unlock cards with their future hotkeys", () => {
    expect(getUpgradeChoiceView("unlockSaltBurst")).toEqual({
      id: "unlockSaltBurst",
      label: "盐袋开封",
      description: "解锁盐袋爆撒（W），向前方扇形撒出伤害粗盐。",
      kind: "unlock",
      categoryLabel: "新技能",
      effectLine: "解锁 W · 盐袋爆撒",
      glyph: "W",
      tone: "salt"
    });
    expect(getUpgradeChoiceView("unlockPigPenTrap")).toEqual({
      id: "unlockPigPenTrap",
      label: "就地搭圈",
      description: "解锁猪圈陷阱（E），困住并持续伤害附近猪群。",
      kind: "unlock",
      categoryLabel: "新技能",
      effectLine: "解锁 E · 猪圈陷阱",
      glyph: "E",
      tone: "trap"
    });
  });
});
