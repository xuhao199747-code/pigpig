import type { ActiveSkillConfig, AutoWeaponConfig } from "../types";

export const playerConfig: {
  moveSpeed: number;
  maxHealth: number;
  maxStamina: number;
  maxArmor: number;
  critChance: number;
  autoWeapon: AutoWeaponConfig;
  activeSkills: readonly ActiveSkillConfig[];
} = {
  moveSpeed: 220,
  maxHealth: 100,
  maxStamina: 100,
  maxArmor: 50,
  critChance: 0.18,
  autoWeapon: {
    id: "cleaver",
    attackRateMs: 650,
    range: 92,
    arcDeg: 110,
    baseDamage: 24
  },
  activeSkills: [
    { id: "spin", cooldownMs: 5000, damage: 55, radius: 120 },
    { id: "saltBurst", cooldownMs: 7200, damage: 40, radius: 150 },
    { id: "pigPenTrap", cooldownMs: 9500, damage: 10, radius: 100 }
  ]
};
