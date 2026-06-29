import type { WeaponAttackProfile } from "./weaponCatalog";

export type PlayerBaseAppearance = {
  idleKey: string;
  walkKey: string;
  attackKey: string;
};

const baseAppearance: PlayerBaseAppearance = {
  idleKey: "player.butcher.idle",
  walkKey: "player.butcher.walk",
  attackKey: "player.butcher.attack"
};

export function getPlayerBaseAppearanceForWeaponProfile(profile: WeaponAttackProfile): PlayerBaseAppearance {
  if (profile === "shoot") return { ...baseAppearance, attackKey: "player.butcher.shoot" };
  return baseAppearance;
}
