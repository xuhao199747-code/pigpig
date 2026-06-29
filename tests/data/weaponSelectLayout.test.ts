import { describe, expect, it } from "vitest";

import { rectInside } from "../../src/game/data/menuLayout";
import { getWeaponCardLayout, weaponSelectLayout } from "../../src/game/data/weaponSelectLayout";

describe("weapon select layout", () => {
  it("keeps preview text, footer buttons, and keyboard hints separated", () => {
    const screen = { x: 0, y: 0, width: 1600, height: 900 };

    for (const rect of Object.values(weaponSelectLayout).filter((value) => typeof value === "object")) {
      expect(rectInside(rect, screen)).toBe(true);
    }
    expect(weaponSelectLayout.cardGrid.width).toBeLessThan(weaponSelectLayout.previewPanel.x - weaponSelectLayout.cardGrid.x);
    expect(weaponSelectLayout.previewPanel.x - (weaponSelectLayout.cardGrid.x + weaponSelectLayout.cardGrid.width)).toBeGreaterThanOrEqual(70);
    expect(weaponSelectLayout.titleDivider.y).toBeGreaterThanOrEqual(weaponSelectLayout.title.y + weaponSelectLayout.title.height + 8);
    expect(weaponSelectLayout.stats.y).toBeGreaterThanOrEqual(weaponSelectLayout.titleDivider.y + weaponSelectLayout.titleDivider.height + 10);
    expect(weaponSelectLayout.statsBox.y).toBeLessThanOrEqual(weaponSelectLayout.stats.y - 12);
    expect(weaponSelectLayout.stats.y + weaponSelectLayout.stats.height).toBeLessThanOrEqual(
      weaponSelectLayout.statsBox.y + weaponSelectLayout.statsBox.height - 12
    );
    expect(weaponSelectLayout.description.y).toBeGreaterThanOrEqual(weaponSelectLayout.statsBox.y + weaponSelectLayout.statsBox.height + 18);
    expect(weaponSelectLayout.descriptionBox.y).toBeGreaterThanOrEqual(weaponSelectLayout.statsBox.y + weaponSelectLayout.statsBox.height + 18);
    expect(rectInside(weaponSelectLayout.description, weaponSelectLayout.descriptionBox)).toBe(true);
    expect(weaponSelectLayout.confirmButton.y - (weaponSelectLayout.description.y + weaponSelectLayout.description.height)).toBeGreaterThanOrEqual(36);
    expect(weaponSelectLayout.keyboardHint.y - (weaponSelectLayout.confirmButton.y + weaponSelectLayout.confirmButton.height)).toBeGreaterThanOrEqual(20);
  });

  it("gives weapon stat and description text separate containers", () => {
    const statLineCount = 5;
    const statFontSize = 18;
    const statLineSpacing = 5;
    const requiredStatsHeight = statLineCount * statFontSize + (statLineCount - 1) * statLineSpacing;

    expect(weaponSelectLayout.stats.height).toBeGreaterThanOrEqual(requiredStatsHeight);
    expect(weaponSelectLayout.stats.y + weaponSelectLayout.stats.height).toBeLessThanOrEqual(
      weaponSelectLayout.descriptionBox.y - 20
    );
    expect(weaponSelectLayout.descriptionBox.height).toBeGreaterThanOrEqual(64);
  });

  it("keeps weapon card art clear of decorative bars and title bands", () => {
    const card = getWeaponCardLayout(0);

    expect(weaponSelectLayout.cardGridStrokeAlpha).toBeLessThanOrEqual(0.22);
    expect(card.art.y + card.art.height).toBeLessThanOrEqual(card.titleBand.y - 8);
    expect(card.titleText.y).toBeGreaterThanOrEqual(card.titleBand.y);
    expect(card.titleText.y + card.titleText.height).toBeLessThanOrEqual(card.titleBand.y + card.titleBand.height);
  });
});
