import type { WaveBriefing } from "./waveBriefing";
import { playerConfig } from "./playerConfig";
import { skillButtonCopy } from "./uiCopy";
import type { ActiveSkillId } from "../types";
import type { PlayerProgressState } from "../types";
import type { WaveProgressSnapshot } from "../systems/WaveDirector";

export function formatSkillStatus(unlocked: boolean, cooldownRemainingMs: number): string {
  if (!unlocked) return "升级时获得";
  return cooldownRemainingMs > 0 ? `${(cooldownRemainingMs / 1000).toFixed(1)}s` : "就绪";
}

export function formatSkillUnlockToast(skillId: ActiveSkillId): string {
  const labels: Record<ActiveSkillId, string> = {
    spin: "屠刀旋斩",
    saltBurst: "盐袋爆撒",
    pigPenTrap: "猪圈陷阱"
  };
  const key = skillButtonCopy.find((skill) => skill.id === skillId)?.key ?? "?";
  return `获得技能：${key} ${labels[skillId]}`;
}

export function formatRunResourceLine(input: { coins: number; kills: number }): string {
  return `金币 ${input.coins}   击杀 ${input.kills}`;
}

export function formatWaveProgressLine(progress: WaveProgressSnapshot): string {
  if (progress.bossId && progress.bossSpawned) {
    return `Boss 已入场 · 场上 ${progress.livingEnemies}`;
  }
  if (progress.bossId && progress.normalSpawnComplete && progress.livingEnemies === 0) {
    return "清场完成 · 等 Boss";
  }
  return `清场 ${progress.spawned}/${progress.spawnBudget} · 场上 ${progress.livingEnemies}`;
}

export function formatWaveObjectiveLine(briefing: WaveBriefing, progress: WaveProgressSnapshot): string {
  return [`目标：${briefing.objective}`, `进度：${formatWaveProgressLine(progress)}`].join("\n");
}

export function formatCharacterStatsBlock(input: {
  attackDamage: number;
  critChancePercent: number;
  moveSpeed: number;
  dodgeChancePercent: number;
}): string {
  return [
    `攻击 ${input.attackDamage}   暴击 ${input.critChancePercent}%`,
    `移速 ${input.moveSpeed.toFixed(2)}   闪避 ${input.dodgeChancePercent}%`
  ].join("\n");
}

export type CharacterStatsView = Parameters<typeof formatCharacterStatsBlock>[0];

export function createCharacterStatsView(progress: PlayerProgressState): CharacterStatsView {
  return {
    attackDamage: progress.attackDamage,
    critChancePercent: Math.round(progress.critChance * 100),
    moveSpeed: progress.moveSpeed / playerConfig.moveSpeed,
    dodgeChancePercent: 12
  };
}

export type SkillBadgeView = {
  id: ActiveSkillId | "burn";
  glyph: string;
  label: string;
  tier: number;
  unlocked: boolean;
};

export function createSkillBadgeViews(progress: PlayerProgressState): SkillBadgeView[] {
  const spin = playerConfig.activeSkills.find((skill) => skill.id === "spin")!;
  const salt = playerConfig.activeSkills.find((skill) => skill.id === "saltBurst")!;

  return [
    {
      id: "spin",
      glyph: "旋",
      label: "旋斩",
      tier: countPositive([
        progress.spinRadius > spin.radius,
        progress.spinDamage > spin.damage
      ]),
      unlocked: progress.unlockedSkillIds.includes("spin")
    },
    {
      id: "saltBurst",
      glyph: "盐",
      label: "盐袋",
      tier: countPositive([
        progress.saltRadius > salt.radius,
        progress.saltDamage > salt.damage
      ]),
      unlocked: progress.unlockedSkillIds.includes("saltBurst")
    },
    {
      id: "pigPenTrap",
      glyph: "圈",
      label: "猪圈",
      tier: countPositive([
        progress.trapRadius > 56,
        progress.trapDamage > 0.2,
        progress.trapDurationMs > 3000
      ]),
      unlocked: progress.unlockedSkillIds.includes("pigPenTrap")
    },
    {
      id: "burn",
      glyph: "火",
      label: "灼烧",
      tier: progress.burnEnabled ? 1 : 0,
      unlocked: Boolean(progress.burnEnabled)
    }
  ];
}

function countPositive(items: boolean[]): number {
  return items.filter(Boolean).length;
}
