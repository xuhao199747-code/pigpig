import { upgradeCatalog } from "../data/upgradeCatalog";
import type { ActiveSkillId, PlayerProgressState } from "../types";

export type UpgradeChoiceKind = "stat" | "skill" | "unlock";
export type UpgradeChoiceTone = "blade" | "blood" | "salt" | "trap";

export type UpgradeChoiceView = {
  id: string;
  label: string;
  description: string;
  kind: UpgradeChoiceKind;
  categoryLabel: string;
  effectLine: string;
  glyph: string;
  tone: UpgradeChoiceTone;
};

export function getEligibleUpgrades(state?: PlayerProgressState) {
  if (!state) return upgradeCatalog;
  return upgradeCatalog.filter((upgrade) => {
    const requirement = "requiresSkillId" in upgrade ? upgrade.requiresSkillId : undefined;
    const unlock = "unlocksSkillId" in upgrade ? upgrade.unlocksSkillId : undefined;
    if (requirement && !state.unlockedSkillIds.includes(requirement as ActiveSkillId)) return false;
    if (unlock && state.unlockedSkillIds.includes(unlock as ActiveSkillId)) return false;
    return true;
  });
}

export function rollUpgradeChoices(count = 3, cursor = 0, state?: PlayerProgressState): UpgradeChoiceView[] {
  const eligible = getEligibleUpgrades(state);
  const choices = Array.from({ length: count }, (_, index) => {
    const catalogIndex = Math.abs(cursor + index) % eligible.length;
    return getUpgradeChoiceView(eligible[catalogIndex].id);
  });
  const priorityUnlock = getPriorityUnlockUpgradeId(state);
  if (priorityUnlock && !choices.some((choice) => choice.id === priorityUnlock)) {
    choices[choices.length - 1] = getUpgradeChoiceView(priorityUnlock);
  }
  return choices;
}

export function getUpgradeChoiceView(upgradeId: string): UpgradeChoiceView {
  const upgrade = upgradeCatalog.find((entry) => entry.id === upgradeId) ?? upgradeCatalog[0];
  const presentation = getUpgradePresentation(upgrade.id);
  return {
    id: upgrade.id,
    label: upgrade.label,
    description: upgrade.description,
    kind: upgrade.kind,
    categoryLabel: getUpgradeKindLabel(upgrade.kind),
    effectLine: getUpgradeEffectLine(upgrade.id),
    glyph: presentation.glyph,
    tone: presentation.tone
  };
}

export function applyUpgrade(state: PlayerProgressState, upgradeId: string): PlayerProgressState {
  switch (upgradeId) {
    case "unlockSaltBurst":
      return unlockSkill(state, "saltBurst");
    case "unlockPigPenTrap":
      return unlockSkill(state, "pigPenTrap");
    case "cleaverTempering":
      return { ...state, attackDamage: state.attackDamage + 6 };
    case "openRibTechnique":
      return { ...state, critChance: state.critChance + 0.08 };
    case "wideButcherSpin":
      return { ...state, spinRadius: state.spinRadius + 35 };
    case "backAlleyKnifeWind":
      return { ...state, spinDamage: state.spinDamage + 18 };
    case "coarseSalt":
      return { ...state, saltRadius: state.saltRadius + 35 };
    case "saltedWound":
      return { ...state, saltDamage: state.saltDamage + 16 };
    case "penReinforcement":
      return { ...state, trapDurationMs: state.trapDurationMs + 1200 };
    case "widePigPen":
      return { ...state, trapRadius: state.trapRadius + 26 };
    case "barbedFence":
      return { ...state, trapDamage: state.trapDamage + 0.12 };
    case "perfectHeat":
      return { ...state, burnEnabled: true };
    case "bloodRush":
      return { ...state, moveSpeed: state.moveSpeed + 25 };
    case "piggyBankRitual":
      return { ...state, coinGainMultiplier: state.coinGainMultiplier + 0.25 };
    case "threePackButcher":
      return { ...state, pickupPowerMultiplier: state.pickupPowerMultiplier + 0.35 };
    default:
      return state;
  }
}

function unlockSkill(state: PlayerProgressState, skillId: ActiveSkillId): PlayerProgressState {
  if (state.unlockedSkillIds.includes(skillId)) return state;
  return { ...state, unlockedSkillIds: [...state.unlockedSkillIds, skillId] };
}

function getPriorityUnlockUpgradeId(state?: PlayerProgressState): string | undefined {
  if (!state) return undefined;
  if (!state.unlockedSkillIds.includes("saltBurst")) return "unlockSaltBurst";
  if (!state.unlockedSkillIds.includes("pigPenTrap")) return "unlockPigPenTrap";
  return undefined;
}

function getUpgradeKindLabel(kind: UpgradeChoiceKind): string {
  if (kind === "unlock") return "新技能";
  if (kind === "skill") return "技能强化";
  return "属性成长";
}

function getUpgradeEffectLine(upgradeId: string): string {
  switch (upgradeId) {
    case "cleaverTempering":
      return "永久属性 · 攻击 +6";
    case "openRibTechnique":
      return "永久属性 · 暴击 +8%";
    case "wideButcherSpin":
      return "强化 Q · 范围 +35";
    case "backAlleyKnifeWind":
      return "强化 Q · 伤害 +18";
    case "unlockSaltBurst":
      return "解锁 W · 盐袋爆撒";
    case "coarseSalt":
      return "强化 W · 范围 +35";
    case "saltedWound":
      return "强化 W · 伤害 +16";
    case "unlockPigPenTrap":
      return "解锁 E · 猪圈陷阱";
    case "penReinforcement":
      return "强化 E · 持续 +1.2s";
    case "widePigPen":
      return "强化 E · 半径 +26";
    case "barbedFence":
      return "强化 E · 持续伤害 +0.12";
    case "perfectHeat":
      return "强化 W · 附加灼烧";
    case "bloodRush":
      return "永久属性 · 移速 +25";
    case "piggyBankRitual":
      return "永久属性 · 金币 +25%";
    case "threePackButcher":
      return "永久属性 · 补给 +35%";
    default:
      return "本局强化 · 立即生效";
  }
}

function getUpgradePresentation(upgradeId: string): { glyph: string; tone: UpgradeChoiceTone } {
  switch (upgradeId) {
    case "cleaverTempering":
      return { glyph: "刀", tone: "blade" };
    case "openRibTechnique":
      return { glyph: "暴", tone: "blood" };
    case "wideButcherSpin":
      return { glyph: "旋", tone: "blade" };
    case "backAlleyKnifeWind":
      return { glyph: "风", tone: "blade" };
    case "unlockSaltBurst":
      return { glyph: "W", tone: "salt" };
    case "coarseSalt":
      return { glyph: "盐", tone: "salt" };
    case "saltedWound":
      return { glyph: "腌", tone: "salt" };
    case "unlockPigPenTrap":
      return { glyph: "E", tone: "trap" };
    case "penReinforcement":
      return { glyph: "栏", tone: "trap" };
    case "widePigPen":
      return { glyph: "圈", tone: "trap" };
    case "barbedFence":
      return { glyph: "刺", tone: "trap" };
    case "perfectHeat":
      return { glyph: "火", tone: "salt" };
    case "bloodRush":
      return { glyph: "速", tone: "blood" };
    case "piggyBankRitual":
      return { glyph: "币", tone: "blood" };
    case "threePackButcher":
      return { glyph: "包", tone: "blood" };
    default:
      return { glyph: "升", tone: "blade" };
  }
}
