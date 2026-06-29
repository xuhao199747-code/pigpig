import { getWeaponDefinition } from "./weaponCatalog";

export function normalizeRunWeaponId(weaponId?: string): string {
  return getWeaponDefinition(weaponId).id;
}
