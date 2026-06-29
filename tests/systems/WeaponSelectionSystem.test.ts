import { describe, expect, it } from "vitest";

import { getNextWeaponSelectionIndex, getWeaponSelectionActionForKey } from "../../src/game/systems/WeaponSelectionSystem";

describe("weapon selection system", () => {
  it("moves through the weapon grid horizontally with wrapping", () => {
    expect(getNextWeaponSelectionIndex({ currentIndex: 0, direction: "right", itemCount: 7, columns: 3 })).toBe(1);
    expect(getNextWeaponSelectionIndex({ currentIndex: 2, direction: "right", itemCount: 7, columns: 3 })).toBe(0);
    expect(getNextWeaponSelectionIndex({ currentIndex: 0, direction: "left", itemCount: 7, columns: 3 })).toBe(2);
  });

  it("moves vertically while clamping to the last available weapon", () => {
    expect(getNextWeaponSelectionIndex({ currentIndex: 1, direction: "down", itemCount: 7, columns: 3 })).toBe(4);
    expect(getNextWeaponSelectionIndex({ currentIndex: 4, direction: "down", itemCount: 7, columns: 3 })).toBe(6);
    expect(getNextWeaponSelectionIndex({ currentIndex: 1, direction: "up", itemCount: 7, columns: 3 })).toBe(6);
  });

  it("keeps selection stable for empty or invalid grids", () => {
    expect(getNextWeaponSelectionIndex({ currentIndex: 2, direction: "right", itemCount: 0, columns: 3 })).toBe(0);
    expect(getNextWeaponSelectionIndex({ currentIndex: 2, direction: "right", itemCount: 7, columns: 0 })).toBe(0);
  });

  it("maps keyboard input to weapon select actions", () => {
    expect(getWeaponSelectionActionForKey({ key: "ArrowRight", code: "ArrowRight" })).toBe("right");
    expect(getWeaponSelectionActionForKey({ key: "d", code: "KeyD" })).toBe("right");
    expect(getWeaponSelectionActionForKey({ key: "Enter", code: "Enter" })).toBe("confirm");
    expect(getWeaponSelectionActionForKey({ key: " ", code: "Space" })).toBe("confirm");
    expect(getWeaponSelectionActionForKey({ key: "Escape", code: "Escape" })).toBe("back");
    expect(getWeaponSelectionActionForKey({ key: "Shift", code: "ShiftLeft" })).toBeNull();
  });
});
