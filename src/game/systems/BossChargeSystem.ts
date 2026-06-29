export type BossChargeVectorInput = {
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
};

export type BossChargeVector = {
  x: number;
  y: number;
};

export type BossChargeSpecInput = {
  enemyId?: string;
  power: number;
  enraged: boolean;
};

export type BossChargeSpec = {
  durationMs: number;
  speedMultiplier: number;
  hitRadius: number;
  damageMultiplier: number;
  trailLength: number;
  telegraphWidth: number;
  impactShakeMs: number;
};

export function createLockedBossChargeVector(input: BossChargeVectorInput): BossChargeVector {
  const dx = input.targetX - input.fromX;
  const dy = input.targetY - input.fromY;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return { x: 1, y: 0 };
  return {
    x: roundVector(dx / length),
    y: roundVector(dy / length)
  };
}

export function createBossChargeSpec(input: BossChargeSpecInput): BossChargeSpec {
  if (input.enemyId === "ironBarrelBoar") {
    return {
      durationMs: input.enraged ? 660 : 720,
      speedMultiplier: input.enraged ? 8.2 : 7.2,
      hitRadius: 74,
      damageMultiplier: input.enraged ? 1.75 : 1.55,
      trailLength: 360,
      telegraphWidth: 14,
      impactShakeMs: input.enraged ? 210 : 180
    };
  }

  if (input.enemyId === "forkliftHog") {
    return {
      durationMs: input.enraged ? 560 : 620,
      speedMultiplier: input.enraged ? input.power * 2.85 : input.power * 2.45,
      hitRadius: 62,
      damageMultiplier: input.enraged ? 1.55 : 1.35,
      trailLength: Math.round(250 + input.power * 36),
      telegraphWidth: 12,
      impactShakeMs: input.enraged ? 170 : 140
    };
  }

  return {
    durationMs: input.enraged ? 620 : 700,
    speedMultiplier: input.enraged ? input.power * 2.55 : input.power * 2.2,
    hitRadius: 64,
    damageMultiplier: input.enraged ? 1.55 : 1.35,
    trailLength: Math.round(220 + input.power * 34),
    telegraphWidth: 12,
    impactShakeMs: input.enraged ? 170 : 140
  };
}

function roundVector(value: number): number {
  return Math.round(value * 1000) / 1000;
}
