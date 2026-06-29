import type { EnemyDefinition } from "../types";

export type EnemyBehaviorState = {
  elapsedMs: number;
  burstRemainingMs?: number;
};

export type EnemyBehaviorInput = {
  definition: EnemyDefinition;
  state: EnemyBehaviorState;
  deltaMs: number;
  feedAuraMultiplier: number;
};

export type EnemyBehaviorResult = {
  speedMultiplier: number;
  state: Required<EnemyBehaviorState>;
  telegraphTriggered: boolean;
};

const CHARGE_PIG_BURST_COOLDOWN_MS = 1150;
const CHARGE_PIG_BURST_DURATION_MS = 420;
const CHARGE_PIG_BURST_MULTIPLIER = 1.68;
const FEED_AURA_RADIUS = 170;
const FEED_AURA_SPEED_MULTIPLIER = 1.18;

export function advanceEnemyBehavior(input: EnemyBehaviorInput): EnemyBehaviorResult {
  const burstRemainingMs = Math.max(0, input.state.burstRemainingMs ?? 0);
  if (input.definition.id !== "chargePig") {
    return {
      speedMultiplier: input.feedAuraMultiplier,
      state: { elapsedMs: input.state.elapsedMs + input.deltaMs, burstRemainingMs },
      telegraphTriggered: false
    };
  }

  if (burstRemainingMs > 0) {
    const nextBurstRemainingMs = Math.max(0, burstRemainingMs - input.deltaMs);
    return {
      speedMultiplier: CHARGE_PIG_BURST_MULTIPLIER * input.feedAuraMultiplier,
      state: { elapsedMs: 0, burstRemainingMs: nextBurstRemainingMs },
      telegraphTriggered: false
    };
  }

  const elapsedMs = input.state.elapsedMs + input.deltaMs;
  if (elapsedMs >= CHARGE_PIG_BURST_COOLDOWN_MS) {
    return {
      speedMultiplier: CHARGE_PIG_BURST_MULTIPLIER * input.feedAuraMultiplier,
      state: { elapsedMs: 0, burstRemainingMs: CHARGE_PIG_BURST_DURATION_MS },
      telegraphTriggered: true
    };
  }

  return {
    speedMultiplier: input.feedAuraMultiplier,
    state: { elapsedMs, burstRemainingMs: 0 },
    telegraphTriggered: false
  };
}

export function hasFeedAura(definition: EnemyDefinition): boolean {
  return definition.id === "feedPig";
}

export function getFeedAuraSpeedMultiplier(input: { distance: number }): number {
  return input.distance <= FEED_AURA_RADIUS ? FEED_AURA_SPEED_MULTIPLIER : 1;
}

export function getFeedAuraPresentation(): { radius: number; tint: number; alpha: number } {
  return {
    radius: FEED_AURA_RADIUS,
    tint: 0xffc76a,
    alpha: 0.13
  };
}
