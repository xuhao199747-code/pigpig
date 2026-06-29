import type { PickupDefinition, PickupType } from "../types";

export const pickupDefinitions: Record<PickupType, PickupDefinition> = {
  health: {
    type: "health",
    label: "生命包",
    textureKey: "pickup.health",
    amount: 24,
    dropChance: 0.045
  },
  stamina: {
    type: "stamina",
    label: "体力包",
    textureKey: "pickup.stamina",
    amount: 28,
    dropChance: 0.04
  },
  armor: {
    type: "armor",
    label: "护甲包",
    textureKey: "pickup.armor",
    amount: 16,
    dropChance: 0.032
  }
};

const pickupRollOrder: PickupType[] = ["health", "stamina", "armor"];

export type PickupDropRollInput = {
  rolls?: readonly number[];
  enemyIsBoss?: boolean;
};

export type PlayerResourceSnapshot = {
  type: PickupType;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  maxArmor: number;
  pickupPowerMultiplier?: number;
};

export function expNeededForLevel(level: number): number {
  return 12 + (level - 1) * 8;
}

export function rollPickupDrop(input: PickupDropRollInput = {}): PickupDefinition | null {
  if (input.enemyIsBoss) return null;

  for (const [index, type] of pickupRollOrder.entries()) {
    const definition = pickupDefinitions[type];
    const roll = input.rolls?.[index] ?? Math.random();
    if (roll <= definition.dropChance) return definition;
  }

  return null;
}

export function applyPickupEffect(snapshot: PlayerResourceSnapshot): Omit<PlayerResourceSnapshot, "type"> {
  const next = {
    health: snapshot.health,
    maxHealth: snapshot.maxHealth,
    stamina: snapshot.stamina,
    maxStamina: snapshot.maxStamina,
    armor: snapshot.armor,
    maxArmor: snapshot.maxArmor
  };
  const amount = Math.round(pickupDefinitions[snapshot.type].amount * (snapshot.pickupPowerMultiplier ?? 1));

  if (snapshot.type === "health") next.health = Math.min(snapshot.maxHealth, snapshot.health + amount);
  if (snapshot.type === "stamina") next.stamina = Math.min(snapshot.maxStamina, snapshot.stamina + amount);
  if (snapshot.type === "armor") next.armor = Math.min(snapshot.maxArmor, snapshot.armor + amount);

  return next;
}
