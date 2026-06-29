export type BossAnimationKeys = {
  walk: string;
  attack: string;
};

export function createBossAnimationKeys(bossId: string): BossAnimationKeys {
  return {
    walk: `enemy.${bossId}.walk`,
    attack: `enemy.${bossId}.attack`
  };
}

export function getBossAnimationKey(input: {
  bossId: string;
  isAttacking: boolean;
  isCharging: boolean;
}): string {
  const keys = createBossAnimationKeys(input.bossId);
  return input.isAttacking || input.isCharging ? keys.attack : keys.walk;
}

export function getBossAnimationTimeScale(input: { enraged: boolean; isCharging: boolean }): number {
  if (input.isCharging) return input.enraged ? 1.45 : 1.25;
  return input.enraged ? 1.18 : 1;
}
