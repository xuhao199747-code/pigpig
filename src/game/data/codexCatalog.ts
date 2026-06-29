import { enemyCatalog } from "./enemyCatalog";
import { weaponCatalog, type WeaponAttackProfile, type WeaponRarity } from "./weaponCatalog";
import type { EnemyDefinition } from "../types";

export type CodexCategory = "enemies" | "bosses" | "weapons";

export type CodexEntry = {
  id: string;
  title: string;
  subtitle: string;
  stats: string;
  trait: string;
  textureKey: string;
};

const enemyOrder = ["fatPig", "leanPig", "forkPig", "helmetPig", "chargePig", "feedPig", "elitePenPig"] as const;
const bossOrder = ["ironBarrelBoar", "feedMountain", "forkliftHog", "stitchedPenBeast", "pigKing"] as const;

const rarityLabels: Record<WeaponRarity, string> = {
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说"
};

const attackProfileLabels: Record<WeaponAttackProfile, string> = {
  slash: "快速挥砍",
  heavy: "双手重劈",
  flail: "绕身甩链",
  shoot: "后坐射击"
};

export function createEnemyCodexEntries(): CodexEntry[] {
  return enemyOrder.map((id) => createEnemyEntry(enemyCatalog[id]));
}

export function createBossCodexEntries(): CodexEntry[] {
  return bossOrder.map((id) => createEnemyEntry(enemyCatalog[id]));
}

export function createWeaponCodexEntries(): CodexEntry[] {
  return weaponCatalog.map((weapon) => ({
    id: weapon.id,
    title: weapon.label,
    subtitle: `${rarityLabels[weapon.rarity]} · ${attackProfileLabels[weapon.attackProfile]}`,
    stats: `攻击 ${weapon.attackDamage} · ${(1000 / weapon.attackRateMs).toFixed(2)} 次/秒 · 范围 ${weapon.range}`,
    trait: weapon.description,
    textureKey: weapon.spriteKey
  }));
}

export function getCodexCategorySummary(category: CodexCategory): string {
  if (category === "enemies") return `${createEnemyCodexEntries().length} 种荒诞小猪`;
  if (category === "bosses") return `${createBossCodexEntries().length} 个夸张 Boss`;
  return `${createWeaponCodexEntries().length} 把本局可选武器`;
}

function createEnemyEntry(definition: EnemyDefinition): CodexEntry {
  return {
    id: definition.id,
    title: definition.label,
    subtitle: definition.isBoss ? "Boss 猪型" : "普通猪型",
    stats: `生命 ${definition.maxHealth} · 伤害 ${definition.damage} · 护甲 ${definition.armor}`,
    trait: definition.isBoss ? describeBossBehavior(definition) : describeEnemyTrait(definition.id),
    textureKey: definition.textureKey
  };
}

function describeBossBehavior(definition: EnemyDefinition): string {
  switch (definition.bossBehavior?.type) {
    case "charge":
      return "冲锋型 Boss：蓄力后直线猛撞";
    case "slam":
      return "震地型 Boss：周期性范围砸地";
    case "summon":
      return "召唤型 Boss：呼叫小猪包围战场";
    default:
      return "巨型 Boss：压迫感很足";
  }
}

function describeEnemyTrait(enemyId: string): string {
  switch (enemyId) {
    case "leanPig":
      return "腿脚很快，专门贴脸骚扰。";
    case "forkPig":
      return "带叉子，接触伤害更凶。";
    case "helmetPig":
      return "头盔很硬，护甲更高。";
    case "chargePig":
      return "会短暂蓄力冲刺，别站正面。";
    case "feedPig":
      return "饲料味很重，会给附近猪群打鸡血。";
    case "elitePenPig":
      return "血厚伤高，是小怪里的场霸。";
    case "fatPig":
    default:
      return "慢但结实，是猪潮的肉墙。";
  }
}
