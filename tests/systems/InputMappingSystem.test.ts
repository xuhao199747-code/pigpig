import { describe, expect, it } from "vitest";

import { createArenaKeyBindings, getSkillForKey } from "../../src/game/systems/InputMappingSystem";

describe("input mapping system", () => {
  it("uses arrow keys as the only movement keys", () => {
    expect(createArenaKeyBindings().movement).toEqual(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);
  });

  it("maps Q W E to the three active skills", () => {
    expect(getSkillForKey("Q")).toBe("spin");
    expect(getSkillForKey("W")).toBe("saltBurst");
    expect(getSkillForKey("E")).toBe("pigPenTrap");
    expect(getSkillForKey("A")).toBeUndefined();
  });
});
