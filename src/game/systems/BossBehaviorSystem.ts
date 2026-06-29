export type BossBehaviorState = { elapsedMs: number; telegraphShown?: boolean };

export type BossEnrageModifiers = {
  cooldownMultiplier: number;
  speedMultiplier: number;
  telegraphLeadMultiplier: number;
};

export function advanceBossBehavior(
  state: BossBehaviorState,
  deltaMs: number,
  cooldownMs: number,
  telegraphLeadMs = 0
): { state: BossBehaviorState; telegraphTriggered?: boolean; triggered: boolean } {
  const elapsedMs = state.elapsedMs + deltaMs;
  if (elapsedMs >= cooldownMs) {
    return {
      state: { elapsedMs: elapsedMs - cooldownMs, ...(telegraphLeadMs > 0 ? { telegraphShown: false } : {}) },
      ...(telegraphLeadMs > 0 ? { telegraphTriggered: false } : {}),
      triggered: true
    };
  }

  if (telegraphLeadMs > 0) {
    const entersTelegraphWindow = elapsedMs >= cooldownMs - telegraphLeadMs && !state.telegraphShown;
    return {
      state: { elapsedMs, telegraphShown: state.telegraphShown || entersTelegraphWindow },
      telegraphTriggered: entersTelegraphWindow,
      triggered: false
    };
  }

  return { state: { elapsedMs }, triggered: false };
}

export function shouldTriggerBossEnrage(input: {
  currentHealth: number;
  maxHealth: number;
  alreadyEnraged: boolean;
  thresholdRatio?: number;
}): boolean {
  if (input.alreadyEnraged) return false;
  const maxHealth = Math.max(1, input.maxHealth);
  const threshold = input.thresholdRatio ?? 0.45;
  return input.currentHealth / maxHealth <= threshold;
}

export function getBossEnrageModifiers(isEnraged: boolean): BossEnrageModifiers {
  return isEnraged
    ? { cooldownMultiplier: 0.72, speedMultiplier: 1.18, telegraphLeadMultiplier: 0.86 }
    : { cooldownMultiplier: 1, speedMultiplier: 1, telegraphLeadMultiplier: 1 };
}
