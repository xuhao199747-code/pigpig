export type BossProjectilePatternInput = {
  bossId: string;
  enraged: boolean;
};

export type BossProjectilePattern = {
  count: number;
  speed: number;
  radius: number;
  damageMultiplier: number;
  tint: number;
  strokeTint: number;
  shape: "meatball" | "crown" | "nail" | "ember";
  burstDelayMs: number;
  travelDurationMs: number;
};

export function createBossProjectilePattern(input: BossProjectilePatternInput): BossProjectilePattern {
  const isFinalBoss = input.bossId === "pigKing";
  const isSlamHeavy = input.bossId === "feedMountain";
  const isForklift = input.bossId === "forkliftHog";
  const enragedBonus = input.enraged ? 2 : 0;
  if (isFinalBoss) {
    return {
      count: 12 + enragedBonus,
      speed: 280 + (input.enraged ? 30 : 0),
      radius: 10,
      damageMultiplier: 0.5,
      tint: 0xffc66d,
      strokeTint: 0xfff0b0,
      shape: "crown",
      burstDelayMs: 32,
      travelDurationMs: 720
    };
  }
  if (isSlamHeavy) {
    return {
      count: 8 + enragedBonus,
      speed: 235 + (input.enraged ? 25 : 0),
      radius: 12,
      damageMultiplier: 0.42,
      tint: 0xf08a45,
      strokeTint: 0xffd391,
      shape: "meatball",
      burstDelayMs: 18,
      travelDurationMs: 860
    };
  }
  if (isForklift) {
    return {
      count: 7 + enragedBonus,
      speed: 270 + (input.enraged ? 30 : 0),
      radius: 7,
      damageMultiplier: 0.42,
      tint: 0xd8c2a2,
      strokeTint: 0xfff0c0,
      shape: "nail",
      burstDelayMs: 10,
      travelDurationMs: 620
    };
  }
  return {
    count: 6 + enragedBonus,
    speed: 220 + (input.enraged ? 24 : 0),
    radius: 9,
    damageMultiplier: 0.42,
    tint: 0xf08a45,
    strokeTint: 0xffd391,
    shape: "ember",
    burstDelayMs: 14,
    travelDurationMs: 760
  };
}
