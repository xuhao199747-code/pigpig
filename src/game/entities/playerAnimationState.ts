import type { WeaponAttackProfile } from "../data/weaponCatalog";

export type PlayerFacingDirection = "left" | "right" | "up" | "down";

export type WalkAnimationState = {
  isMoving: boolean;
  currentAnimationKey?: string;
  isAnimationPlaying: boolean;
  walkAnimationKey: string;
};

export type PlayerVisualState = "idle" | "move" | "attack";

export function getPlayerVisualState(input: {
  velocityX: number;
  velocityY: number;
  isAttackAnimationActive: boolean;
}): PlayerVisualState {
  if (input.isAttackAnimationActive) return "attack";
  return Math.abs(input.velocityX) + Math.abs(input.velocityY) > 0.1 ? "move" : "idle";
}

export function shouldStartWalkAnimation(state: WalkAnimationState): boolean {
  if (!state.isMoving) return false;
  return state.currentAnimationKey !== state.walkAnimationKey || !state.isAnimationPlaying;
}

export function shouldFlipPlayerForHorizontalVelocity(velocityX: number, currentFlipX: boolean): boolean {
  if (Math.abs(velocityX) < 0.1) return currentFlipX;
  return velocityX < 0;
}

export function getPlayerMovementFacingFlip(input: {
  velocityX: number;
  currentFlipX: boolean;
  isAttackAnimationActive: boolean;
}): boolean {
  if (input.isAttackAnimationActive) return input.currentFlipX;
  return shouldFlipPlayerForHorizontalVelocity(input.velocityX, input.currentFlipX);
}

export function getPlayerMovementFacingDirection(input: {
  velocityX: number;
  velocityY: number;
  currentDirection: PlayerFacingDirection;
}): PlayerFacingDirection {
  return getDominantFacingDirection({
    deltaX: input.velocityX,
    deltaY: input.velocityY,
    currentDirection: input.currentDirection,
    deadZone: 0.1
  });
}

export function getPlayerAttackFacingFlip(input: { playerX: number; targetX: number; currentFlipX: boolean }): boolean {
  const horizontalDistance = input.targetX - input.playerX;
  if (Math.abs(horizontalDistance) < 4) return input.currentFlipX;
  return horizontalDistance < 0;
}

export function getPlayerAttackFacingDirection(input: {
  playerX: number;
  playerY: number;
  targetX: number;
  targetY: number;
  currentDirection: PlayerFacingDirection;
}): PlayerFacingDirection {
  return getDominantFacingDirection({
    deltaX: input.targetX - input.playerX,
    deltaY: input.targetY - input.playerY,
    currentDirection: input.currentDirection,
    deadZone: 4
  });
}

export function getPlayerAttackBodyPose(input: {
  attackProfile: WeaponAttackProfile;
  progress: number;
  facingRight: boolean;
  baseScale: number;
  facingDirection?: PlayerFacingDirection;
}): { angle: number; scaleX: number; scaleY: number } {
  const safeProgress = Math.max(0, Math.min(1, input.progress));
  const direction = input.facingRight ? 1 : -1;
  const profile = getAttackPoseProfile(input.attackProfile);
  const impact = Math.sin(safeProgress * Math.PI);
  const lateWeight = safeProgress < 0.45 ? safeProgress * 0.7 : 0.315 + (safeProgress - 0.45) * 1.99;
  const drive = input.attackProfile === "heavy"
    ? Math.min(1, lateWeight)
    : impact;
  const verticalLean = getVerticalDirectionLean(input.facingDirection) * drive;

  return {
    angle: roundPoseValue(direction * profile.maxAngle * drive + verticalLean),
    scaleX: roundPoseValue(input.baseScale * (1 + profile.scaleXPush * drive)),
    scaleY: roundPoseValue(input.baseScale * (1 - profile.scaleYSquash * drive))
  };
}

export function getPlayerWalkPose(input: {
  elapsedMs: number;
  velocityX: number;
  velocityY: number;
  baseScale: number;
  facingDirection?: PlayerFacingDirection;
  attackProfile?: WeaponAttackProfile;
}): { angle: number; scaleX: number; scaleY: number } {
  const weight = getWalkWeightProfile(input.attackProfile);
  const step = Math.sin(input.elapsedMs / 70);
  const bounce = Math.abs(step);
  const verticalDominant = Math.abs(input.velocityY) > Math.abs(input.velocityX);
  const horizontalIsIntentional = Math.abs(input.velocityX) >= 8 || Math.abs(input.velocityX) >= Math.abs(input.velocityY) * 0.18;
  const horizontalLean = horizontalIsIntentional ? Math.sign(input.velocityX) * 3.5 * weight.leanMultiplier : 0;
  const verticalLean = input.velocityY === 0 ? 0 : Math.sign(input.velocityY) * (verticalDominant ? 1.25 : 0.8) * weight.leanMultiplier;
  const facingLean = input.facingDirection === "up" ? -0.35 : input.facingDirection === "down" ? 0.28 : 0;
  const scaleXWobble = (verticalDominant ? 0.04 : 0.035) * weight.wobbleMultiplier;
  const scaleYWobble = (verticalDominant ? 0.028 : 0.025) * weight.wobbleMultiplier;
  return {
    angle: roundPoseValue(horizontalLean + verticalLean + facingLean),
    scaleX: roundPoseValue(input.baseScale * (1 + bounce * scaleXWobble)),
    scaleY: roundPoseValue(input.baseScale * (1 - bounce * scaleYWobble))
  };
}

export function getPlayerAnimationTimeScale(input: {
  velocityX: number;
  velocityY: number;
  isAttackAnimationActive: boolean;
}): number {
  if (input.isAttackAnimationActive) return 1;
  const speed = Math.hypot(input.velocityX, input.velocityY);
  if (speed < 1) return 1;
  return Math.round(Math.min(1.24, 1 + speed / 1500) * 100) / 100;
}

export function getPlayerHitReactionPresentation(): { flashMs: number; scaleBump: number; tint: number } {
  return {
    flashMs: 130,
    scaleBump: 1.06,
    tint: 0xf2b0a0
  };
}

export function getPlayerDeathPresentation(): {
  burstRadius: number;
  durationMs: number;
  particleCount: number;
  tint: number;
} {
  return {
    burstRadius: 88,
    durationMs: 620,
    particleCount: 12,
    tint: 0x7f2332
  };
}

function roundPoseValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getDominantFacingDirection(input: {
  deltaX: number;
  deltaY: number;
  currentDirection: PlayerFacingDirection;
  deadZone: number;
}): PlayerFacingDirection {
  const absX = Math.abs(input.deltaX);
  const absY = Math.abs(input.deltaY);
  if (absX + absY <= input.deadZone) return input.currentDirection;
  if (absY > absX * 1.15) return input.deltaY < 0 ? "up" : "down";
  return input.deltaX >= 0 ? "right" : "left";
}

function getVerticalDirectionLean(direction: PlayerFacingDirection | undefined): number {
  if (direction === "up") return -2.4;
  if (direction === "down") return 1.8;
  return 0;
}

function getWalkWeightProfile(profile: WeaponAttackProfile | undefined): {
  leanMultiplier: number;
  wobbleMultiplier: number;
} {
  if (profile === "heavy") return { leanMultiplier: 1.18, wobbleMultiplier: 1.2 };
  if (profile === "shoot") return { leanMultiplier: 0.82, wobbleMultiplier: 0.86 };
  if (profile === "flail") return { leanMultiplier: 1.08, wobbleMultiplier: 1.1 };
  return { leanMultiplier: 1, wobbleMultiplier: 1 };
}

function getAttackPoseProfile(attackProfile: WeaponAttackProfile): {
  maxAngle: number;
  scaleXPush: number;
  scaleYSquash: number;
} {
  if (attackProfile === "heavy") return { maxAngle: 8.682, scaleXPush: 0.105, scaleYSquash: 0.081 };
  if (attackProfile === "flail") return { maxAngle: 5.4, scaleXPush: 0.052, scaleYSquash: 0.044 };
  if (attackProfile === "shoot") return { maxAngle: 2.8, scaleXPush: 0.024, scaleYSquash: 0.02 };
  return { maxAngle: 4.2, scaleXPush: 0.04, scaleYSquash: 0.035 };
}
