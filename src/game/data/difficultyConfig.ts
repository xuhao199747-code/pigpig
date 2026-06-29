export type DifficultyId = "casual" | "standard" | "butcherNight" | "pigGodDusk";

export type DifficultyConfig = {
  id: DifficultyId;
  label: string;
  description: string;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  coinMultiplier: number;
};

export const difficultyCatalog: readonly DifficultyConfig[] = [
  {
    id: "casual",
    label: "休闲",
    description: "猪少肉嫩，适合试刀。",
    enemyHealthMultiplier: 0.8,
    enemyDamageMultiplier: 0.75,
    enemySpeedMultiplier: 0.92,
    coinMultiplier: 0.9
  },
  {
    id: "standard",
    label: "标准",
    description: "正常屠宰场强度。",
    enemyHealthMultiplier: 1,
    enemyDamageMultiplier: 1,
    enemySpeedMultiplier: 1,
    coinMultiplier: 1
  },
  {
    id: "butcherNight",
    label: "屠宰夜",
    description: "猪群更硬，掉钱更多。",
    enemyHealthMultiplier: 1.22,
    enemyDamageMultiplier: 1.18,
    enemySpeedMultiplier: 1.06,
    coinMultiplier: 1.25
  },
  {
    id: "pigGodDusk",
    label: "猪神黄昏",
    description: "荒诞高压，猪神盯着你。",
    enemyHealthMultiplier: 1.5,
    enemyDamageMultiplier: 1.38,
    enemySpeedMultiplier: 1.12,
    coinMultiplier: 1.55
  }
] as const;

export function getDifficultyConfig(id: string | undefined): DifficultyConfig {
  return difficultyCatalog.find((entry) => entry.id === id) ?? difficultyCatalog[1];
}
