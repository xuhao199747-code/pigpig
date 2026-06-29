export type WeaponRarity = "common" | "rare" | "epic" | "legendary";
export type WeaponAttackProfile = "slash" | "heavy" | "flail" | "shoot";

export type WeaponDefinition = {
  id: string;
  label: string;
  rarity: WeaponRarity;
  description: string;
  attackDamage: number;
  attackRateMs: number;
  range: number;
  critChanceBonus: number;
  iconKey: string;
  spriteKey: string;
  worldScale: number;
  attackProfile: WeaponAttackProfile;
  grip: { x: number; y: number };
};

export const weaponCatalog: readonly WeaponDefinition[] = [
  {
    id: "rustyCleaver",
    label: "生锈的屠刀",
    rarity: "common",
    description: "稳定、趁手，适合开局清猪。",
    attackDamage: 24,
    attackRateMs: 650,
    range: 88,
    critChanceBonus: 0,
    iconKey: "ui.icon.skillSpin",
    spriteKey: "weapon.world.rustyCleaver",
    worldScale: 0.34,
    attackProfile: "slash",
    grip: { x: 0.22, y: 0.8 }
  },
  {
    id: "saltFrostCleaver",
    label: "盐霜砍刀",
    rarity: "rare",
    description: "刀口结盐，暴击更狠。",
    attackDamage: 32,
    attackRateMs: 620,
    range: 94,
    critChanceBonus: 0.04,
    iconKey: "ui.icon.skillSalt",
    spriteKey: "weapon.world.saltFrostCleaver",
    worldScale: 0.35,
    attackProfile: "slash",
    grip: { x: 0.22, y: 0.8 }
  },
  {
    id: "pigBoneChainsaw",
    label: "猪骨电锯",
    rarity: "epic",
    description: "用猪骨拼出的荒诞电锯。",
    attackDamage: 42,
    attackRateMs: 560,
    range: 104,
    critChanceBonus: 0.07,
    iconKey: "ui.icon.itemTorch",
    spriteKey: "weapon.world.pigBoneChainsaw",
    worldScale: 0.4,
    attackProfile: "slash",
    grip: { x: 0.24, y: 0.82 }
  },
  {
    id: "duskHook",
    label: "黄昏链钩",
    rarity: "legendary",
    description: "钩影绕场，越浮夸越可靠。",
    attackDamage: 56,
    attackRateMs: 720,
    range: 118,
    critChanceBonus: 0.12,
    iconKey: "ui.icon.itemHook",
    spriteKey: "weapon.world.duskHook",
    worldScale: 0.38,
    attackProfile: "slash",
    grip: { x: 0.3, y: 0.82 }
  },
  {
    id: "dragonSlayer",
    label: "杀猪屠龙刀",
    rarity: "epic",
    description: "刀比屠夫高，挥一下半个猪圈都安静。",
    attackDamage: 68,
    attackRateMs: 1080,
    range: 132,
    critChanceBonus: 0.08,
    iconKey: "ui.icon.skillSpin",
    spriteKey: "weapon.world.dragonSlayer",
    worldScale: 0.5,
    attackProfile: "heavy",
    grip: { x: 0.24, y: 0.88 }
  }
] as const;

export function getWeaponDefinition(id: string | undefined): WeaponDefinition {
  return weaponCatalog.find((weapon) => weapon.id === id) ?? weaponCatalog[0];
}
