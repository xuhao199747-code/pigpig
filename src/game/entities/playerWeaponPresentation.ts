import type { WeaponDefinition } from "../data/weaponCatalog";
import { getWeaponHoldOverride, getWeaponHoldTemplate } from "../data/weaponHoldTemplates";

export type WeaponFacingDirection = "left" | "right" | "up" | "down";

export type WeaponMotionState = {
  rotation: number;
  reach: number;
  scale: number;
};

export type WeaponVisualState = "idle" | "move" | "attack";

export function getWeaponMotionPreset(state: WeaponVisualState, weapon: WeaponDefinition): WeaponMotionState {
  const override = getWeaponHoldOverride(weapon.id);
  const template = getWeaponHoldTemplate(override.templateId);

  if (state === "attack") return getWeaponAttackMotionAtProgress(weapon, 1);

  const reach = state === "move" ? template.idleReach + 1 : template.idleReach;
  const rotation = state === "move" ? template.idleRotation * 0.7 : template.idleRotation;

  return {
    rotation: rotation + override.fineTune.rotation,
    reach: reach + override.fineTune.x,
    scale: override.fineTune.scale
  };
}

export function getWeaponAttackMotionAtProgress(weapon: WeaponDefinition, progress: number): WeaponMotionState {
  const override = getWeaponHoldOverride(weapon.id);
  const template = getWeaponHoldTemplate(override.templateId);
  const safeProgress = Math.max(0, Math.min(1, progress));
  return {
    rotation: lerp(template.attackStartRotation, template.attackEndRotation, easeSwingProgress(safeProgress, template.id)) + override.fineTune.rotation,
    reach: lerp(template.idleReach, template.attackReach, getReachProgress(safeProgress, template.id)) + override.fineTune.x,
    scale: override.fineTune.scale
  };
}

export function getWeaponPresentationSnapshot(input: {
  weapon: WeaponDefinition;
  playerX: number;
  playerY: number;
  facingRight: boolean;
  facingDirection?: WeaponFacingDirection;
  state: WeaponVisualState;
  weaponMotion: WeaponMotionState;
}): { x: number; y: number; rotation: number; scale: number; depthOffset: number } {
  const override = getWeaponHoldOverride(input.weapon.id);
  const template = getWeaponHoldTemplate(override.templateId);
  const handOffset =
    input.state === "attack"
      ? template.attackHandOffset
      : input.state === "move"
        ? template.moveHandOffset
        : template.idleHandOffset;
  const direction = input.facingRight ? -1 : 1;
  const rotationBase = input.state === "attack" ? input.weaponMotion.rotation : template.idleRotation;
  const vertical = getVerticalWeaponOffset(input.facingDirection, input.state);

  return {
    x: input.playerX + handOffset.x * direction + input.weaponMotion.reach * direction + vertical.x * direction,
    y: input.playerY + handOffset.y + override.fineTune.y + vertical.y,
    rotation: (input.state === "attack" ? rotationBase * direction : rotationBase * direction + override.fineTune.rotation) + vertical.rotation * direction,
    scale: input.weapon.worldScale * input.weaponMotion.scale,
    depthOffset: template.depthBias + vertical.depthOffset
  };
}

function lerp(from: number, to: number, progress: number): number {
  return roundPoseValue(from + (to - from) * progress);
}

function easeSwingProgress(progress: number, templateId: string): number {
  if (templateId === "heavyBlade") return progress < 0.6 ? progress * 0.45 : 0.27 + (progress - 0.6) * 1.825;
  if (templateId === "hookClamp") return Math.min(1, progress * 0.8);
  return progress < 0.35 ? progress * 1.35 : 0.4725 + (progress - 0.35) * 0.8115;
}

function getReachProgress(progress: number, templateId: string): number {
  if (templateId === "heavyBlade") return progress < 0.65 ? progress * 0.45 : 0.2925 + (progress - 0.65) * 2.0215;
  if (templateId === "hookClamp") return Math.min(0.85, progress * 0.85);
  return Math.min(1, progress * 1.15);
}

function roundPoseValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getVerticalWeaponOffset(
  facingDirection: WeaponFacingDirection | undefined,
  state: WeaponVisualState
): { x: number; y: number; rotation: number; depthOffset: number } {
  if (state !== "attack") return { x: 0, y: 0, rotation: 0, depthOffset: 0 };
  if (facingDirection === "up") return { x: -2, y: -10, rotation: 0.32, depthOffset: -2 };
  if (facingDirection === "down") return { x: 1, y: 8, rotation: -0.18, depthOffset: 2 };
  return { x: 0, y: 0, rotation: 0, depthOffset: 0 };
}
