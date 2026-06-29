import { describe, expect, it } from "vitest";

import { weaponCatalog } from "../../src/game/data/weaponCatalog";
import { getWeaponHoldOverride, getWeaponHoldTemplate } from "../../src/game/data/weaponHoldTemplates";

describe("weapon hold templates", () => {
  it("assigns every remaining weapon to one of the three hold templates", () => {
    const templateIds = weaponCatalog.map((weapon) => getWeaponHoldOverride(weapon.id).templateId);
    expect(templateIds).toEqual([
      "lightBlade",
      "lightBlade",
      "lightBlade",
      "hookClamp",
      "heavyBlade"
    ]);
  });

  it("defines the expected stateful offsets for all templates", () => {
    const light = getWeaponHoldTemplate("lightBlade");
    const heavy = getWeaponHoldTemplate("heavyBlade");
    const hook = getWeaponHoldTemplate("hookClamp");

    expect(light.idleHandOffset.x).toBeGreaterThan(0);
    expect(heavy.attackReach).toBeGreaterThan(light.attackReach);
    expect(hook.attackEndRotation).toBeLessThan(heavy.attackEndRotation);
  });
});
