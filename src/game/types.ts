export type ActiveSkillId = "spin" | "saltBurst" | "pigPenTrap";

export type AutoWeaponConfig = {
  id: "cleaver";
  attackRateMs: number;
  range: number;
  arcDeg: number;
  baseDamage: number;
};

export type ActiveSkillConfig = {
  id: ActiveSkillId;
  cooldownMs: number;
  damage: number;
  radius: number;
};

export type PlayerProgressState = {
  attackDamage: number;
  critChance: number;
  moveSpeed: number;
  spinRadius: number;
  spinDamage: number;
  saltRadius: number;
  saltDamage: number;
  trapRadius: number;
  trapDamage: number;
  trapDurationMs: number;
  coinGainMultiplier: number;
  pickupPowerMultiplier: number;
  unlockedSkillIds: ActiveSkillId[];
  burnEnabled?: boolean;
};

export type PickupType = "health" | "stamina" | "armor";

export type PickupDefinition = {
  type: PickupType;
  label: string;
  textureKey: string;
  amount: number;
  dropChance: number;
};

export type EnemyDefinition = {
  id: string;
  label: string;
  textureKey: string;
  maxHealth: number;
  speed: number;
  damage: number;
  armor: number;
  expDrop: number;
  coinDrop: number;
  scale: number;
  tint: number;
  weight: number;
  isBoss?: boolean;
  bossBehavior?: {
    type: "charge" | "slam" | "summon";
    cooldownMs: number;
    power: number;
  };
};

export type WaveDefinition = {
  index: number;
  spawnBudget: number;
  spawnIntervalMs: number;
  enemies: readonly string[];
  bossId?: string;
};

export type SpawnInstruction = {
  enemyId: string;
  bossId?: string;
  isBoss: boolean;
};

export type DamageResult = {
  finalDamage: number;
  remainingHealth: number;
  didDie: boolean;
};
