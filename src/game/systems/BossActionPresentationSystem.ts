type BossActionInput = {
  enemyId?: string;
  power?: number;
  radius?: number;
  count?: number;
  enraged?: boolean;
};

export type BossChargeTrailPresentation = {
  afterimageCount: number;
  dustCount: number;
  trailLength: number;
  trailWidth: number;
  durationMs: number;
  tint: number;
  glowAlpha: number;
  coreAlpha: number;
  strokeAlpha: number;
};

export type BossSlamImpactPresentation = {
  ringCount: number;
  debrisCount: number;
  crackCount: number;
  durationMs: number;
  tint: number;
};

export type BossSummonGatePresentation = {
  gateCount: number;
  sparkCountPerGate: number;
  durationMs: number;
  radius: number;
  tint: number;
};

export function createBossChargeTrailPresentation(input: BossActionInput): BossChargeTrailPresentation {
  const profile = getBossActionProfile(input.enemyId);
  const power = input.power ?? 1;
  const enrageBonus = input.enraged ? 1 : 0;
  if (input.enemyId === "ironBarrelBoar") {
    return {
      afterimageCount: input.enraged ? 6 : 5,
      dustCount: input.enraged ? 14 : 12,
      trailLength: input.enraged ? 390 : 360,
      trailWidth: 14,
      durationMs: input.enraged ? 470 : 520,
      tint: input.enraged ? 0xff3328 : 0xd9281f,
      glowAlpha: input.enraged ? 0.24 : 0.18,
      coreAlpha: input.enraged ? 0.92 : 0.86,
      strokeAlpha: input.enraged ? 0.66 : 0.58
    };
  }
  return {
    afterimageCount: Math.max(3, Math.round(3 + profile.chargeWeight * 0.45 + enrageBonus)),
    dustCount: Math.max(5, Math.round(5 + power * 0.65 + profile.chargeWeight * 0.45 + enrageBonus)),
    trailLength: Math.round(150 + power * 28 + profile.chargeWeight * 16 + enrageBonus * 9),
    trailWidth: Math.round(10 + profile.chargeWeight * 0.8 + enrageBonus),
    durationMs: Math.round(330 + profile.chargeWeight * 25 + enrageBonus * 20),
    tint: input.enraged ? 0xff3328 : 0xd9281f,
    glowAlpha: input.enraged ? 0.24 : 0.18,
    coreAlpha: input.enraged ? 0.92 : 0.86,
    strokeAlpha: input.enraged ? 0.66 : 0.58
  };
}

export function createBossSlamImpactPresentation(input: BossActionInput): BossSlamImpactPresentation {
  const profile = getBossActionProfile(input.enemyId);
  const radius = input.radius ?? 160;
  const enrageBonus = input.enraged ? 2 : 0;
  return {
    ringCount: Math.max(2, Math.round(2 + profile.slamWeight * 0.6 + (input.enraged ? 1 : 0))),
    debrisCount: Math.round(7 + radius / 42 + profile.slamWeight * 0.9 + enrageBonus),
    crackCount: Math.round(5 + profile.slamWeight * 1.35 + (input.enraged ? 2 : 0)),
    durationMs: Math.round(432 + profile.slamWeight * 40 + (input.enraged ? 60 : 0)),
    tint: input.enraged ? 0xff765c : 0xf08a45
  };
}

export function createBossSummonGatePresentation(input: BossActionInput): BossSummonGatePresentation {
  const profile = getBossActionProfile(input.enemyId);
  const count = Math.max(1, Math.round(input.count ?? 1));
  return {
    gateCount: count,
    sparkCountPerGate: Math.round(3 + profile.summonWeight + (input.enraged ? 1 : 0)),
    durationMs: Math.round(544 + profile.summonWeight * 66 + (input.enraged ? 70 : 0)),
    radius: Math.round(25 + profile.summonWeight * 4 + (input.enraged ? 4 : 0)),
    tint: input.enraged ? 0xffc66d : 0xd9aa4d
  };
}

function getBossActionProfile(enemyId?: string): {
  chargeWeight: number;
  slamWeight: number;
  summonWeight: number;
} {
  if (enemyId === "forkliftHog") return { chargeWeight: 2.8, slamWeight: 1.2, summonWeight: 0.5 };
  if (enemyId === "feedMountain") return { chargeWeight: 0.8, slamWeight: 2.2, summonWeight: 0.8 };
  if (enemyId === "stitchedPenBeast") return { chargeWeight: 1.4, slamWeight: 1.5, summonWeight: 1.3 };
  if (enemyId === "pigKing") return { chargeWeight: 2.4, slamWeight: 2.4, summonWeight: 1.6 };
  return { chargeWeight: 1, slamWeight: 1, summonWeight: 0.7 };
}
