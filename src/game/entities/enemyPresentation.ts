import type { EnemyDefinition } from "../types";

export type EnemyFacingDirection = "left" | "right" | "up" | "down";

export type EnemyVisualState = "idle" | "move" | "attack";

export function usesSharedPigAnimation(definition: EnemyDefinition): boolean {
  return !definition.isBoss;
}

export function getEnemyVisualState(input: {
  velocityX: number;
  velocityY: number;
  isAttacking: boolean;
}): EnemyVisualState {
  if (input.isAttacking) return "attack";
  return Math.abs(input.velocityX) + Math.abs(input.velocityY) > 0.1 ? "move" : "idle";
}

export function getEnemyFacingFlip(input: { velocityX: number; currentFlipX: boolean; targetDeltaX?: number }): boolean {
  if (Math.abs(input.velocityX) < 8 && Math.abs(input.targetDeltaX ?? 0) >= 6) {
    return (input.targetDeltaX ?? 0) > 0;
  }
  if (Math.abs(input.velocityX) < 0.1) return input.currentFlipX;
  return input.velocityX > 0;
}

export function getBossContactFacingFlip(input: {
  velocityX: number;
  currentFlipX: boolean;
  targetDeltaX?: number;
}): boolean {
  return getEnemyFacingFlip({
    velocityX: input.velocityX,
    currentFlipX: input.currentFlipX,
    targetDeltaX: input.targetDeltaX
  });
}

export function getEnemyMovementFacingDirection(input: {
  velocityX: number;
  velocityY: number;
  currentDirection: EnemyFacingDirection;
  targetDeltaX?: number;
  targetDeltaY?: number;
}): EnemyFacingDirection {
  const velocityDirection = getDominantFacingDirection({
    deltaX: input.velocityX,
    deltaY: input.velocityY,
    currentDirection: input.currentDirection,
    deadZone: 0.1
  });
  if (velocityDirection !== input.currentDirection || Math.abs(input.velocityX) + Math.abs(input.velocityY) > 0.1) {
    return velocityDirection;
  }
  return getDominantFacingDirection({
    deltaX: input.targetDeltaX ?? 0,
    deltaY: input.targetDeltaY ?? 0,
    currentDirection: input.currentDirection,
    deadZone: 6
  });
}

export function getEnemyAttackFacingDirection(input: {
  targetDeltaX: number;
  targetDeltaY: number;
  currentDirection: EnemyFacingDirection;
}): EnemyFacingDirection {
  return getDominantFacingDirection({
    deltaX: input.targetDeltaX,
    deltaY: input.targetDeltaY,
    currentDirection: input.currentDirection,
    deadZone: 4
  });
}

export function getSharedPigAnimationKey(input: { isAttacking: boolean }): "enemy.pig.walk" | "enemy.pig.attack" {
  return input.isAttacking ? "enemy.pig.attack" : "enemy.pig.walk";
}

export function getEnemyAttackPose(input: {
  baseScale: number;
  facingRight: boolean;
  approachVelocityY?: number;
  enemyId?: string;
  facingDirection?: EnemyFacingDirection;
}): { angle: number; scaleX: number; scaleY: number } {
  const gait = getEnemyGait(input.enemyId);
  const attackProfile = getEnemyAttackProfile(input.enemyId);
  const direction = input.facingRight ? 1 : -1;
  const hasVerticalBite = Math.abs(input.approachVelocityY ?? 0) > 30;
  const biteLean = (Math.max(4.8, gait.horizontalLean + 2.8) + (hasVerticalBite ? 0.9 : 0)) * attackProfile.leanMultiplier;
  const verticalLean = getVerticalDirectionLean(input.facingDirection) * attackProfile.leanMultiplier;
  return {
    angle: roundPoseValue(direction * biteLean + verticalLean),
    scaleX: roundPoseValue(input.baseScale * (hasVerticalBite ? 1.09 : attackProfile.scaleXMultiplier)),
    scaleY: roundPoseValue(input.baseScale * (hasVerticalBite ? 0.925 : attackProfile.scaleYMultiplier))
  };
}

export function getBossMotionScale(input: { baseScale: number; isCharging: boolean }): number {
  return input.isCharging ? input.baseScale * 1.1 : input.baseScale;
}

export function getEnemyWalkPose(input: {
  elapsedMs: number;
  velocityX: number;
  velocityY: number;
  baseScale: number;
  enemyId?: string;
  facingDirection?: EnemyFacingDirection;
}): { angle: number; scaleX: number; scaleY: number } {
  const gait = getEnemyGait(input.enemyId);
  const step = Math.sin(input.elapsedMs / gait.periodMs);
  const bounce = Math.abs(step);
  const horizontalLean = input.velocityX === 0 ? 0 : Math.sign(input.velocityX) * gait.horizontalLean;
  const verticalLean = input.velocityY === 0 ? 0 : Math.sign(input.velocityY) * gait.verticalLean;
  const facingLean = input.facingDirection === "up" ? -gait.verticalLean * 0.8 : input.facingDirection === "down" ? gait.verticalLean * 0.65 : 0;
  return {
    angle: roundPoseValue(horizontalLean + verticalLean + facingLean),
    scaleX: roundPoseValue(input.baseScale * (1 + bounce * gait.scaleXWobble)),
    scaleY: roundPoseValue(input.baseScale * (1 - bounce * gait.scaleYWobble))
  };
}

export function getBossMovementPose(input: {
  baseScale: number;
  velocityX: number;
  velocityY?: number;
  elapsedMs?: number;
  isCharging: boolean;
  enemyId?: string;
  facingDirection?: EnemyFacingDirection;
}): { angle: number; scaleX: number; scaleY: number } {
  const profile = getBossPoseProfile(input.enemyId);
  const direction = input.velocityX === 0 ? 0 : Math.sign(input.velocityX);
  const verticalDirection = (input.velocityY ?? 0) === 0 ? 0 : Math.sign(input.velocityY ?? 0);
  const mostlyVertical = Math.abs(input.velocityY ?? 0) > Math.abs(input.velocityX);
  const stomp = Math.abs(Math.sin((input.elapsedMs ?? 0) / 95));
  const baseScale = getBossMotionScale({ baseScale: input.baseScale, isCharging: input.isCharging });
  const scaleXWobble = (input.isCharging && mostlyVertical ? 0.04 : input.isCharging ? 0.038 : 0.021) * profile.squashXMultiplier;
  const scaleYWobble = (input.isCharging && mostlyVertical ? 0.045 : input.isCharging ? 0.038 : 0.015) * profile.squashYMultiplier;
  const horizontalLean = direction * (input.isCharging ? 5.5 : 1.6) * profile.horizontalLeanMultiplier;
  const verticalLean = verticalDirection
    * (input.isCharging && mostlyVertical ? 2.2 : input.isCharging ? 1.6 : 0.9)
    * profile.verticalLeanMultiplier;
  const facingLean = getVerticalDirectionLean(input.facingDirection) * 0.35 * profile.verticalLeanMultiplier;
  return {
    angle: roundPoseValue(horizontalLean + verticalLean + facingLean),
    scaleX: roundPoseValue(baseScale * (1 + stomp * scaleXWobble)),
    scaleY: roundPoseValue(baseScale * (1 - stomp * scaleYWobble))
  };
}

export function getBossTelegraphPose(input: {
  baseScale: number;
  velocityX: number;
  velocityY?: number;
  elapsedMs?: number;
  enemyId?: string;
  facingDirection?: EnemyFacingDirection;
}): { angle: number; scaleX: number; scaleY: number } {
  const profile = getBossPoseProfile(input.enemyId);
  const direction = input.velocityX === 0 ? 0 : Math.sign(input.velocityX);
  const verticalDirection = (input.velocityY ?? 0) === 0 ? 0 : Math.sign(input.velocityY ?? 0);
  const pulse = Math.abs(Math.sin((input.elapsedMs ?? 0) / 70));
  const facingLean = getVerticalDirectionLean(input.facingDirection) * 0.4;
  return {
    angle: roundPoseValue((direction * 3.4 + verticalDirection * 1.4 + facingLean) * profile.telegraphLeanMultiplier),
    scaleX: roundPoseValue(input.baseScale * (1.06 + pulse * 0.0425 * profile.telegraphPulseXMultiplier)),
    scaleY: roundPoseValue(input.baseScale * (0.98 - pulse * 0.047 * profile.telegraphPulseYMultiplier))
  };
}

export function getBossContactAttackPose(input: {
  baseScale: number;
  facingRight: boolean;
  enemyId?: string;
  facingDirection?: EnemyFacingDirection;
  enraged?: boolean;
}): { angle: number; scaleX: number; scaleY: number } {
  const profile = getBossPoseProfile(input.enemyId);
  const direction = input.facingRight ? 1 : -1;
  const enrageBoost = input.enraged ? 1.12 : 1;
  const horizontalLean = direction * 7.2 * profile.horizontalLeanMultiplier * enrageBoost;
  const verticalLean = getVerticalDirectionLean(input.facingDirection) * 0.7 * profile.verticalLeanMultiplier;
  const extraEnrageScale = input.enraged ? 0.04 : 0;
  return {
    angle: roundPoseValue(horizontalLean + verticalLean),
    scaleX: roundPoseValue(input.baseScale * (1 + 0.07 * profile.squashXMultiplier + extraEnrageScale)),
    scaleY: roundPoseValue(input.baseScale * (1 - 0.075 * profile.squashYMultiplier - (input.enraged ? 0.025 : 0)))
  };
}

export function getEnemyAnimationTimeScale(input: {
  enemyId?: string;
  speedMultiplier: number;
  isAttacking: boolean;
}): number {
  if (input.isAttacking) return 1;
  const gait = getEnemyGait(input.enemyId);
  const gaitBoost = input.speedMultiplier > 1 && gait.periodMs < 50 ? 0.04 : 0;
  return roundPoseValue(Math.min(1.34, 1 + Math.max(0, input.speedMultiplier - 1) * 0.15 + gaitBoost));
}

export function getHitReactionPresentation(definition: EnemyDefinition): {
  flashMs: number;
  scaleBump: number;
  recoilDistance: number;
  sparkCount: number;
  tint: number;
  cameraShakeMs: number;
} {
  return definition.isBoss
    ? { flashMs: 150, scaleBump: 1.08, recoilDistance: 18, sparkCount: 7, tint: 0xffd08a, cameraShakeMs: 70 }
    : { flashMs: 90, scaleBump: 1.04, recoilDistance: 10, sparkCount: 3, tint: 0xffffff, cameraShakeMs: 0 };
}

export function getDeathBurstPresentation(definition: EnemyDefinition): {
  radius: number;
  durationMs: number;
  particleCount: number;
  shockwaveCount: number;
  stainRadius: number;
} {
  return definition.isBoss
    ? { radius: 76, durationMs: 520, particleCount: 10, shockwaveCount: 3, stainRadius: 50 }
    : { radius: 26, durationMs: 260, particleCount: 4, shockwaveCount: 1, stainRadius: 18 };
}

function roundPoseValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getDominantFacingDirection(input: {
  deltaX: number;
  deltaY: number;
  currentDirection: EnemyFacingDirection;
  deadZone: number;
}): EnemyFacingDirection {
  const absX = Math.abs(input.deltaX);
  const absY = Math.abs(input.deltaY);
  if (absX + absY <= input.deadZone) return input.currentDirection;
  if (absY > absX * 1.15) return input.deltaY < 0 ? "up" : "down";
  return input.deltaX >= 0 ? "right" : "left";
}

function getVerticalDirectionLean(direction: EnemyFacingDirection | undefined): number {
  if (direction === "up") return -1.8;
  if (direction === "down") return 1.45;
  return 0;
}

function getEnemyGait(enemyId?: string): {
  periodMs: number;
  horizontalLean: number;
  verticalLean: number;
  scaleXWobble: number;
  scaleYWobble: number;
} {
  if (enemyId === "chargePig") {
    return { periodMs: 45, horizontalLean: 4.1, verticalLean: 0.3, scaleXWobble: 0.0374, scaleYWobble: 0.0264 };
  }
  if (enemyId === "feedPig") {
    return { periodMs: 45, horizontalLean: 1.75, verticalLean: 0.5, scaleXWobble: 0.063, scaleYWobble: 0.0337 };
  }
  if (enemyId === "helmetPig" || enemyId === "elitePenPig") {
    return { periodMs: 58, horizontalLean: 1.7, verticalLean: 0.35, scaleXWobble: 0.022, scaleYWobble: 0.018 };
  }
  return { periodMs: 45, horizontalLean: 2.4, verticalLean: 0.45, scaleXWobble: 0.03, scaleYWobble: 0.022 };
}

function getEnemyAttackProfile(enemyId?: string): {
  leanMultiplier: number;
  scaleXMultiplier: number;
  scaleYMultiplier: number;
} {
  if (enemyId === "chargePig") return { leanMultiplier: 1.21739, scaleXMultiplier: 1.14, scaleYMultiplier: 0.91 };
  if (enemyId === "helmetPig" || enemyId === "elitePenPig") {
    return { leanMultiplier: 0.85417, scaleXMultiplier: 1.06, scaleYMultiplier: 0.96 };
  }
  if (enemyId === "feedPig") return { leanMultiplier: 0.95, scaleXMultiplier: 1.12, scaleYMultiplier: 0.92 };
  return { leanMultiplier: 1, scaleXMultiplier: 1.08, scaleYMultiplier: 0.935 };
}

function getBossPoseProfile(enemyId?: string): {
  horizontalLeanMultiplier: number;
  verticalLeanMultiplier: number;
  squashXMultiplier: number;
  squashYMultiplier: number;
  telegraphLeanMultiplier: number;
  telegraphPulseXMultiplier: number;
  telegraphPulseYMultiplier: number;
} {
  if (enemyId === "feedMountain") {
    return {
      horizontalLeanMultiplier: 0.55,
      verticalLeanMultiplier: 0.5,
      squashXMultiplier: 1.96,
      squashYMultiplier: 1.5,
      telegraphLeanMultiplier: 0.75,
      telegraphPulseXMultiplier: 1.45,
      telegraphPulseYMultiplier: 1.25
    };
  }
  if (enemyId === "forkliftHog") {
    return {
      horizontalLeanMultiplier: 1.2291,
      verticalLeanMultiplier: 0.65,
      squashXMultiplier: 2.22,
      squashYMultiplier: 0.99,
      telegraphLeanMultiplier: 1.2,
      telegraphPulseXMultiplier: 1.2,
      telegraphPulseYMultiplier: 1.2
    };
  }
  if (enemyId === "stitchedPenBeast") {
    return {
      horizontalLeanMultiplier: 0.85,
      verticalLeanMultiplier: 1.35,
      squashXMultiplier: 1.35,
      squashYMultiplier: 1.55,
      telegraphLeanMultiplier: 1.05,
      telegraphPulseXMultiplier: 1.5,
      telegraphPulseYMultiplier: 1.45
    };
  }
  if (enemyId === "pigKing") {
    return {
      horizontalLeanMultiplier: 1.15,
      verticalLeanMultiplier: 1.1,
      squashXMultiplier: 1.2,
      squashYMultiplier: 1.2,
      telegraphLeanMultiplier: 1.6,
      telegraphPulseXMultiplier: 1.82,
      telegraphPulseYMultiplier: 1.55
    };
  }
  return {
    horizontalLeanMultiplier: 1,
    verticalLeanMultiplier: 1,
    squashXMultiplier: 1,
    squashYMultiplier: 1,
    telegraphLeanMultiplier: 1,
    telegraphPulseXMultiplier: 1,
    telegraphPulseYMultiplier: 1
  };
}
