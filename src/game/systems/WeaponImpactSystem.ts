import type { WeaponDefinition } from "../data/weaponCatalog";

export type WeaponImpactPresentation = {
  shape: "slash" | "arc" | "crush" | "spark";
  color: number;
  radius: number;
  durationMs: number;
  strokeWidth: number;
  cameraShakeMs: number;
  trailCount: number;
  fragmentCount: number;
  aftershock?: {
    color: number;
    radiusMultiplier: number;
    durationMs: number;
  };
};

export function createWeaponImpactPresentation(weapon: WeaponDefinition): WeaponImpactPresentation {
  if (weapon.attackProfile === "heavy") {
    return {
      shape: "arc",
      color: 0xf0b354,
      radius: Math.round(weapon.range * 0.72),
      durationMs: 260,
      strokeWidth: 8,
      cameraShakeMs: 70,
      trailCount: 1,
      fragmentCount: 3,
      aftershock: {
        color: 0x8f3f24,
        radiusMultiplier: 0.62,
        durationMs: 320
      }
    };
  }

  if (weapon.id === "duskHook" || weapon.attackProfile === "flail") {
    return {
      shape: "arc",
      color: 0xd97b43,
      radius: Math.round(weapon.range * 0.76),
      durationMs: 220,
      strokeWidth: 6,
      cameraShakeMs: 30,
      trailCount: 2,
      fragmentCount: 4
    };
  }

  if (weapon.attackProfile === "shoot") {
    return {
      shape: "spark",
      color: 0xffd37a,
      radius: 34,
      durationMs: 150,
      strokeWidth: 5,
      cameraShakeMs: 0,
      trailCount: 0,
      fragmentCount: 5
    };
  }

  return {
    shape: "slash",
    color: 0xf4d08a,
    radius: Math.round(weapon.range * 0.56),
    durationMs: 150,
    strokeWidth: 5,
    cameraShakeMs: 0,
    trailCount: 2,
    fragmentCount: 0
  };
}
