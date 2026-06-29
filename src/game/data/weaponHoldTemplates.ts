export type WeaponHoldTemplateId = "lightBlade" | "heavyBlade" | "hookClamp";

export type HoldOffset = { x: number; y: number };

export type WeaponHoldTemplate = {
  id: WeaponHoldTemplateId;
  idleHandOffset: HoldOffset;
  moveHandOffset: HoldOffset;
  attackHandOffset: HoldOffset;
  idleRotation: number;
  attackStartRotation: number;
  attackEndRotation: number;
  idleReach: number;
  attackReach: number;
  depthBias: number;
};

export type WeaponHoldOverride = {
  templateId: WeaponHoldTemplateId;
  fineTune: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  };
};

const templateCatalog: Record<WeaponHoldTemplateId, WeaponHoldTemplate> = {
  lightBlade: {
    id: "lightBlade",
    idleHandOffset: { x: 18, y: 5 },
    moveHandOffset: { x: 20, y: 6 },
    attackHandOffset: { x: 16, y: 2 },
    idleRotation: -0.25,
    attackStartRotation: -0.72,
    attackEndRotation: 0.48,
    idleReach: 8,
    attackReach: 16,
    depthBias: 10
  },
  heavyBlade: {
    id: "heavyBlade",
    idleHandOffset: { x: 12, y: 0 },
    moveHandOffset: { x: 14, y: 1 },
    attackHandOffset: { x: 8, y: -4 },
    idleRotation: -0.42,
    attackStartRotation: -0.92,
    attackEndRotation: 0.18,
    idleReach: 10,
    attackReach: 20,
    depthBias: 10
  },
  hookClamp: {
    id: "hookClamp",
    idleHandOffset: { x: 17, y: -2 },
    moveHandOffset: { x: 18, y: 0 },
    attackHandOffset: { x: 15, y: -4 },
    idleRotation: -0.1,
    attackStartRotation: -0.48,
    attackEndRotation: -0.08,
    idleReach: 7,
    attackReach: 14,
    depthBias: 10
  }
};

const holdOverrides: Record<string, WeaponHoldOverride> = {
  rustyCleaver: { templateId: "lightBlade", fineTune: { x: 0, y: 0, rotation: 0, scale: 1 } },
  saltFrostCleaver: { templateId: "lightBlade", fineTune: { x: 1, y: 0, rotation: 0.02, scale: 1 } },
  pigBoneChainsaw: { templateId: "lightBlade", fineTune: { x: 1, y: 1, rotation: 0.08, scale: 1.02 } },
  duskHook: { templateId: "hookClamp", fineTune: { x: -1, y: 0, rotation: -0.06, scale: 1 } },
  dragonSlayer: { templateId: "heavyBlade", fineTune: { x: 0, y: 1, rotation: -0.08, scale: 1 } }
};

export function getWeaponHoldTemplate(id: WeaponHoldTemplateId): WeaponHoldTemplate {
  return templateCatalog[id];
}

export function getWeaponHoldOverride(weaponId: string): WeaponHoldOverride {
  return holdOverrides[weaponId] ?? holdOverrides.rustyCleaver;
}
