import type { EnemyDefinition } from "../types";

export type BossTelegraphType = NonNullable<EnemyDefinition["bossBehavior"]>["type"];

export type BossHudPayload = {
  id: string;
  label: string;
  currentHealth: number;
  maxHealth: number;
  healthRatio: number;
  warningText: string;
  isEnraged: boolean;
  phaseLabel: string;
  barColor: number;
};

export type BossTelegraphWarning = {
  title: string;
  hint: string;
};

export function createBossHudPayload(
  definition: EnemyDefinition,
  currentHealth: number,
  isEnraged = false
): BossHudPayload {
  const maxHealth = Math.max(1, definition.maxHealth);
  const safeHealth = Math.max(0, Math.min(maxHealth, currentHealth));

  return {
    id: definition.id,
    label: definition.label,
    currentHealth: safeHealth,
    maxHealth,
    healthRatio: safeHealth / maxHealth,
    warningText: isEnraged ? `${definition.label} 狂暴` : `${definition.label} 入场`,
    isEnraged,
    phaseLabel: isEnraged ? "狂暴" : "压制中",
    barColor: isEnraged ? 0xf05f3b : 0xb83025
  };
}

export function createBossTelegraphWarning(
  definition: EnemyDefinition,
  type: BossTelegraphType
): BossTelegraphWarning {
  if (type === "charge") {
    return {
      title: `${definition.label} 要冲锋了`,
      hint: "离开正面红线"
    };
  }
  if (type === "slam") {
    return {
      title: `${definition.label} 要震地了`,
      hint: "跑出红圈"
    };
  }
  return {
    title: `${definition.label} 在叫猪`,
    hint: "先清小猪"
  };
}

export function createBossEnrageWarning(definition: EnemyDefinition): BossTelegraphWarning {
  return {
    title: `${definition.label} 狂暴了`,
    hint: "技能更快，先拉开距离"
  };
}
