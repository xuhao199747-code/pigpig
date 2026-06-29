import { describe, expect, it } from "vitest";

import { getWeaponDefinition, weaponCatalog } from "../../src/game/data/weaponCatalog";

describe("weapon catalog", () => {
  it("defines the normalized melee-first weapon pool", () => {
    expect(weaponCatalog.map((weapon) => weapon.id)).toEqual([
      "rustyCleaver",
      "saltFrostCleaver",
      "pigBoneChainsaw",
      "duskHook",
      "dragonSlayer"
    ]);
  });

  it("keeps every world weapon inside the conservative size envelope", () => {
    expect(weaponCatalog.every((weapon) => weapon.spriteKey.startsWith("weapon.world."))).toBe(true);
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.62);
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.range))).toBeLessThanOrEqual(168);
  });

  it("keeps only the remaining special attack profiles", () => {
    expect(getWeaponDefinition("dragonSlayer").attackProfile).toBe("heavy");
    expect(weaponCatalog.some((weapon) => weapon.attackProfile === "flail")).toBe(false);
    expect(weaponCatalog.some((weapon) => weapon.attackProfile === "shoot")).toBe(false);
    expect(weaponCatalog.some((weapon) => weapon.attackProfile === "clamp")).toBe(false);
  });

  it("defines a normalized grip anchor for every weapon image", () => {
    for (const weapon of weaponCatalog) {
      expect(weapon.grip.x).toBeGreaterThanOrEqual(0);
      expect(weapon.grip.x).toBeLessThanOrEqual(1);
      expect(weapon.grip.y).toBeGreaterThanOrEqual(0);
      expect(weapon.grip.y).toBeLessThanOrEqual(1);
    }

    expect(getWeaponDefinition("dragonSlayer").grip).not.toEqual(getWeaponDefinition("rustyCleaver").grip);
  });

  it("falls back to the starter cleaver for unknown weapon ids", () => {
    expect(getWeaponDefinition("missing").id).toBe("rustyCleaver");
    expect(getWeaponDefinition("hydraulicBoneCrusher").id).toBe("rustyCleaver");
    expect(getWeaponDefinition("hundredMeterPigBlade").id).toBe("rustyCleaver");
  });

  it("keeps all surviving weapons within the grip-friendly scale band", () => {
    expect(Math.min(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeGreaterThanOrEqual(0.34);
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.58);
  });

  it("keeps all surviving weapons in the normalized hold-scale band", () => {
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.58);
  });
});
