import { describe, expect, it } from "vitest";

import { animationCatalog, bossSpriteSheets, playerWeaponSpriteSheets } from "../../src/game/data/animationCatalog";
import { weaponCatalog } from "../../src/game/data/weaponCatalog";

describe("animation catalog", () => {
  it("defines weapon-specific player, pig, and skill animation sheets", () => {
    expect(playerWeaponSpriteSheets).toHaveLength(weaponCatalog.length * 2);
    expect(playerWeaponSpriteSheets.every((sheet) => sheet.frames === 4)).toBe(true);
    expect(animationCatalog.enemy.walk.frames).toBe(4);
    expect(animationCatalog.enemy.attack.frames).toBe(4);
    expect(animationCatalog.skills.spin.frames).toBe(4);
    expect(animationCatalog.skills.saltBurst.frames).toBe(4);
    expect(animationCatalog.skills.trap.frames).toBe(4);
  });

  it("defines walk and attack sheets for every boss so bosses use real frame animation", () => {
    expect(bossSpriteSheets).toHaveLength(10);
    expect(bossSpriteSheets.every((sheet) => sheet.frames === 4)).toBe(true);
    expect(bossSpriteSheets.every((sheet) => sheet.frameWidth === 256)).toBe(true);
    expect(bossSpriteSheets.every((sheet) => sheet.frameHeight === 256)).toBe(true);
    expect(bossSpriteSheets.map((sheet) => sheet.key)).toEqual([
      "enemy.ironBarrelBoar.walk",
      "enemy.ironBarrelBoar.attack",
      "enemy.feedMountain.walk",
      "enemy.feedMountain.attack",
      "enemy.forkliftHog.walk",
      "enemy.forkliftHog.attack",
      "enemy.stitchedPenBeast.walk",
      "enemy.stitchedPenBeast.attack",
      "enemy.pigKing.walk",
      "enemy.pigKing.attack"
    ]);
  });
});
