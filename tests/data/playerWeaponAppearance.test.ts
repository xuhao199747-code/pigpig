import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { weaponCatalog } from "../../src/game/data/weaponCatalog";
import { getPlayerWeaponAppearance } from "../../src/game/data/playerWeaponAppearance";

describe("player weapon appearance", () => {
  it("maps every remaining weapon to integrated idle, walk, and attack assets", () => {
    for (const weapon of weaponCatalog) {
      const appearance = getPlayerWeaponAppearance(weapon.id);
      expect(appearance.idleKey).toContain(weapon.id);
      expect(appearance.walkKey).toContain(weapon.id);
      expect(appearance.attackKey).toContain(weapon.id);
      expect(appearance.idlePath.endsWith(".png")).toBe(true);
      expect(appearance.walkPath.endsWith(".png")).toBe(true);
      expect(appearance.attackPath.endsWith(".png")).toBe(true);
    }
  });

  it("falls removed weapon appearances back to the starter sheet", () => {
    expect(getPlayerWeaponAppearance("hydraulicBoneCrusher").attackKey).toContain("rustyCleaver");
    expect(getPlayerWeaponAppearance("hundredMeterPigBlade").attackKey).toContain("rustyCleaver");
    expect(getPlayerWeaponAppearance("rustyCleaver").attackKey).toContain("rustyCleaver");
  });

  it("keeps the runtime player on integrated held-character textures", () => {
    const source = readFileSync("src/game/entities/Player.ts", "utf8");
    expect(source).toContain("getPlayerWeaponAppearance");
    expect(source).not.toContain("heldWeaponSprite");
    expect(source).not.toContain("getPlayerBaseAppearanceForWeaponProfile");
  });
});
