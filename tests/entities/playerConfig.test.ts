import { describe, expect, it } from "vitest";

import { playerConfig } from "../../src/game/data/playerConfig";

describe("player config", () => {
  it("defines one auto weapon and three active skills", () => {
    expect(playerConfig.autoWeapon.baseDamage).toBe(24);
    expect(playerConfig.activeSkills.map((skill) => skill.id)).toEqual([
      "spin",
      "saltBurst",
      "pigPenTrap"
    ]);
  });
});
