import type { WeaponDefinition } from "../data/weaponCatalog";
import type { PlayerProgressState } from "../types";

export function applyWeaponToProgress(
  progress: PlayerProgressState,
  weapon: WeaponDefinition,
  baseCritChance = 0.18
): PlayerProgressState {
  return {
    ...progress,
    attackDamage: weapon.attackDamage,
    critChance: baseCritChance + weapon.critChanceBonus
  };
}
