import { describe, expect, it } from "vitest";

import { hasVerticalGap, menuHomeLayout, menuModalLayout, rectInside } from "../../src/game/data/menuLayout";

describe("menu layout", () => {
  it("keeps the settings dialog centered with explicit close controls", () => {
    expect(menuModalLayout.overlay).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
    expect(menuModalLayout.settingsPanel.x + menuModalLayout.settingsPanel.width / 2).toBe(800);
    expect(menuModalLayout.settingsPanel.y + menuModalLayout.settingsPanel.height / 2).toBe(450);
    expect(rectInside(menuModalLayout.settingsPanel, menuModalLayout.overlay)).toBe(true);
    expect(rectInside(menuModalLayout.settingsCloseButton, menuModalLayout.settingsPanel)).toBe(true);
    expect(rectInside(menuModalLayout.settingsFooterCloseButton, menuModalLayout.settingsPanel)).toBe(true);
  });

  it("keeps the home menu footer controls readable at scaled browser sizes", () => {
    const screen = menuModalLayout.overlay;

    for (const rect of Object.values(menuHomeLayout)) {
      expect(rectInside(rect, screen)).toBe(true);
    }
    expect(rectInside(menuHomeLayout.heroPanel, screen)).toBe(true);
    expect(rectInside(menuHomeLayout.primaryActions, menuHomeLayout.heroPanel)).toBe(true);
    expect(menuHomeLayout.difficultyCards.height).toBeGreaterThanOrEqual(72);
    expect(hasVerticalGap(menuHomeLayout.difficultyCards, menuHomeLayout.utilityButtons, 24)).toBe(true);
    expect(hasVerticalGap(menuHomeLayout.utilityButtons, menuHomeLayout.saveSummary, 7)).toBe(true);
    expect(hasVerticalGap(menuHomeLayout.saveSummary, menuHomeLayout.keyboardHint, 16)).toBe(true);
  });

  it("keeps the lower home controls inside the hero frame with breathing room", () => {
    expect(rectInside(menuHomeLayout.utilityButtons, menuHomeLayout.heroPanel)).toBe(true);
    expect(rectInside(menuHomeLayout.saveSummary, menuHomeLayout.heroPanel)).toBe(true);
    expect(rectInside(menuHomeLayout.keyboardHint, menuHomeLayout.heroPanel)).toBe(true);
    expect(menuHomeLayout.heroPanel.y + menuHomeLayout.heroPanel.height - (menuHomeLayout.saveSummary.y + menuHomeLayout.saveSummary.height)).toBeGreaterThanOrEqual(34);
    expect(menuHomeLayout.heroPanel.y + menuHomeLayout.heroPanel.height - (menuHomeLayout.keyboardHint.y + menuHomeLayout.keyboardHint.height)).toBeGreaterThanOrEqual(18);
  });

  it("renders the home subtitle as compact copy instead of a framed plate", () => {
    expect("subtitlePlate" in menuHomeLayout).toBe(false);
    expect(rectInside(menuHomeLayout.subtitle, menuHomeLayout.heroPanel)).toBe(true);
    expect(menuHomeLayout.subtitle.height).toBeLessThanOrEqual(32);
    expect(hasVerticalGap(menuHomeLayout.subtitle, menuHomeLayout.primaryActions, 54)).toBe(true);
  });
});
