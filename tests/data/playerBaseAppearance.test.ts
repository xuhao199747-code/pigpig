import { describe, expect, it } from "vitest";

import { getPlayerBaseAppearanceForWeaponProfile } from "../../src/game/data/playerBaseAppearance";

describe("player base appearance", () => {
  it("uses unarmed butcher sprites as the common player body", () => {
    expect(getPlayerBaseAppearanceForWeaponProfile("slash")).toEqual({
      idleKey: "player.butcher.idle",
      walkKey: "player.butcher.walk",
      attackKey: "player.butcher.attack"
    });
  });

  it("selects matching body attack sheets for special weapon profiles", () => {
    expect(getPlayerBaseAppearanceForWeaponProfile("shoot").attackKey).toBe("player.butcher.shoot");
    expect(getPlayerBaseAppearanceForWeaponProfile("heavy").attackKey).toBe("player.butcher.attack");
  });
});
