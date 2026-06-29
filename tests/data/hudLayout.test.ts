import { describe, expect, it } from "vitest";

import {
  characterPanelLayout,
  commandPanelLayout,
  hudLayout,
  hudSafeBounds,
  modalLayout,
  rectInside,
  rectsOverlap,
  runPanelLayout,
  skillBarLayout,
  statusPanelLayout,
  upgradeModalLayout
} from "../../src/game/data/hudLayout";
import { skillButtonCopy } from "../../src/game/data/uiCopy";

describe("hud layout", () => {
  it("keeps key hud regions inside the safe area", () => {
    for (const rect of Object.values(hudLayout)) {
      expect(rectInside(rect, hudSafeBounds)).toBe(true);
    }
  });

  it("does not overlap the bottom panels and skill bar", () => {
    const bottomRegions = [
      hudLayout.characterPanel,
      hudLayout.skillBar
    ];

    for (let i = 0; i < bottomRegions.length; i += 1) {
      for (let j = i + 1; j < bottomRegions.length; j += 1) {
        expect(rectsOverlap(bottomRegions[i], bottomRegions[j])).toBe(false);
      }
    }
  });

  it("keeps the top-right cluster separated", () => {
    const topRightRegions = [
      hudLayout.runPanel,
      hudLayout.commandPanel,
      hudLayout.miniMapPanel
    ];

    for (let i = 0; i < topRightRegions.length; i += 1) {
      for (let j = i + 1; j < topRightRegions.length; j += 1) {
        expect(rectsOverlap(topRightRegions[i], topRightRegions[j])).toBe(false);
      }
    }
  });

  it("keeps the character exp bar clear of the skill upgrade cluster", () => {
    expect(rectsOverlap(characterPanelLayout.expBar, characterPanelLayout.skillTitle)).toBe(false);
    expect(rectsOverlap(characterPanelLayout.expBar, characterPanelLayout.skillGrid)).toBe(false);
    expect(rectsOverlap(characterPanelLayout.statsBlock, characterPanelLayout.skillGrid)).toBe(false);
  });

  it("gives the character skill cells enough room for stroked glyphs", () => {
    expect(characterPanelLayout.skillCellSize).toBeGreaterThanOrEqual(52);
    expect(characterPanelLayout.skillCellSize - characterPanelLayout.skillCellFontSize).toBeGreaterThanOrEqual(32);
    expect(characterPanelLayout.skillCellStroke).toBeLessThanOrEqual(3);
  });

  it("keeps the skill glyph styling within each upgrade cell", () => {
    const cellSize = characterPanelLayout.skillCellSize;
    const fontSize = characterPanelLayout.skillCellFontSize;
    const stroke = characterPanelLayout.skillCellStroke;

    expect(fontSize + stroke * 4).toBeLessThanOrEqual(cellSize);
    expect(characterPanelLayout.skillTierBadge.height).toBeLessThanOrEqual(14);
    expect(characterPanelLayout.skillTierBadge.xOffset).toBeGreaterThanOrEqual(4);
    expect(characterPanelLayout.skillTierBadge.xOffset + characterPanelLayout.skillTierBadge.width).toBeLessThanOrEqual(cellSize / 2);
    expect(characterPanelLayout.skillTierBadge.yOffset).toBeGreaterThanOrEqual(-cellSize / 2 + 4);
    expect(characterPanelLayout.skillTierBadge.yOffset + characterPanelLayout.skillTierBadge.height).toBeLessThanOrEqual(
      characterPanelLayout.skillGlyphOffsetY - 6
    );
  });

  it("keeps all status bars inside the status panel", () => {
    const rows = [0, 1, 2].map((index) => ({
      x: statusPanelLayout.barX,
      y: statusPanelLayout.firstRowY + statusPanelLayout.rowGap * index - statusPanelLayout.barHeight / 2,
      width: statusPanelLayout.barWidth,
      height: statusPanelLayout.barHeight
    }));

    for (const row of rows) {
      expect(rectInside(row, hudLayout.statusPanel)).toBe(true);
      expect(row.x - hudLayout.statusPanel.x).toBeGreaterThanOrEqual(statusPanelLayout.panelInset);
      expect(hudLayout.statusPanel.x + hudLayout.statusPanel.width - (row.x + row.width)).toBeGreaterThanOrEqual(
        statusPanelLayout.panelInset
      );
    }
  });

  it("keeps run panel content padded from the frame", () => {
    expect(hudLayout.runPanel.width).toBeGreaterThanOrEqual(300);
    expect(rectInside(runPanelLayout.textBlock, hudLayout.runPanel)).toBe(true);
    expect(runPanelLayout.textBlock.x - hudLayout.runPanel.x).toBeGreaterThanOrEqual(runPanelLayout.inset);
    expect(hudLayout.runPanel.x + hudLayout.runPanel.width - (runPanelLayout.textBlock.x + runPanelLayout.textBlock.width)).toBeGreaterThanOrEqual(
      runPanelLayout.inset
    );
    expect(runPanelLayout.textBlock.width).toBeGreaterThanOrEqual(230);
  });

  it("leaves vertical room for two-line wave objective text", () => {
    expect(rectInside(runPanelLayout.titleLine, hudLayout.runPanel)).toBe(true);
    expect(rectInside(runPanelLayout.objectiveBlock, hudLayout.runPanel)).toBe(true);
    expect(rectInside(runPanelLayout.timeLine, hudLayout.runPanel)).toBe(true);
    expect(rectInside(runPanelLayout.resourceLine, hudLayout.runPanel)).toBe(true);
    expect(runPanelLayout.objectiveBlock.height).toBeGreaterThanOrEqual(54);
    expect(runPanelLayout.titleLine.y + runPanelLayout.titleLine.height).toBeLessThanOrEqual(runPanelLayout.objectiveBlock.y);
    expect(runPanelLayout.objectiveBlock.y + runPanelLayout.objectiveBlock.height + 10).toBeLessThanOrEqual(runPanelLayout.timeLine.y);
    expect(runPanelLayout.timeLine.y + runPanelLayout.timeLine.height).toBeLessThanOrEqual(runPanelLayout.resourceLine.y);
  });

  it("does not reserve bottom-right space for the removed weapon panel", () => {
    expect("weaponPanel" in hudLayout).toBe(false);
  });

  it("keeps command buttons inside their panel", () => {
    expect(rectInside(commandPanelLayout.leftButton, hudLayout.commandPanel)).toBe(true);
    expect(rectInside(commandPanelLayout.rightButton, hudLayout.commandPanel)).toBe(true);
    expect(rectsOverlap(commandPanelLayout.leftButton, commandPanelLayout.rightButton)).toBe(false);
  });

  it("centers modal panels and lets the shade cover the whole screen", () => {
    expect(modalLayout.overlay).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
    for (const panel of [modalLayout.upgradePanel, modalLayout.resultPanel, modalLayout.pausePanel]) {
      expect(panel.x + panel.width / 2).toBe(800);
      expect(rectInside(panel, modalLayout.overlay)).toBe(true);
    }
  });

  it("gives upgrade cards enough room for text, stars, and footer actions", () => {
    const panel = modalLayout.upgradePanel;
    expect(rectInside(upgradeModalLayout.subtitle, panel)).toBe(true);
    expect(rectInside(upgradeModalLayout.firstCard, panel)).toBe(true);
    expect(rectInside(upgradeModalLayout.footer, panel)).toBe(true);
    expect(rectInside(upgradeModalLayout.error, panel)).toBe(true);

    const cards = [0, 1, 2].map((index) => ({
      ...upgradeModalLayout.firstCard,
      y: upgradeModalLayout.firstCard.y + index * (upgradeModalLayout.firstCard.height + upgradeModalLayout.cardGap)
    }));

    for (const card of cards) {
      expect(card.height).toBeGreaterThanOrEqual(108);
      expect(card.y + card.height).toBeLessThanOrEqual(upgradeModalLayout.footer.y - 14);
    }
    expect(upgradeModalLayout.textColumn.width).toBeGreaterThanOrEqual(270);
    expect(upgradeModalLayout.metaColumn.x).toBeGreaterThanOrEqual(upgradeModalLayout.textColumn.x + upgradeModalLayout.textColumn.width + 16);
  });

  it("keeps skill labels and cooldowns inside the skill bar content area", () => {
    expect(skillButtonCopy.map((skill) => skill.key)).toEqual(["Q", "W", "E"]);
    expect(skillBarLayout.visibleSlotCount).toBe(skillButtonCopy.length);

    for (let index = 0; index < skillBarLayout.visibleSlotCount; index += 1) {
      const offset = index * skillBarLayout.slotSpacing;
      const slotBlock = {
        x: skillBarLayout.slotStartX + offset - skillBarLayout.slotWidth / 2,
        y: skillBarLayout.slotCenterY - skillBarLayout.slotHeight / 2,
        width: skillBarLayout.slotWidth,
        height: skillBarLayout.slotHeight
      };
      const labelBlock = {
        ...skillBarLayout.labelBlock,
        x: skillBarLayout.labelBlock.x + offset
      };
      const cooldownBlock = {
        ...skillBarLayout.cooldownBlock,
        x: skillBarLayout.cooldownBlock.x + offset
      };

      expect(rectInside(slotBlock, hudLayout.skillBar)).toBe(true);
      expect(rectInside(labelBlock, hudLayout.skillBar)).toBe(true);
      expect(rectInside(cooldownBlock, hudLayout.skillBar)).toBe(true);
      expect(labelBlock.y + labelBlock.height).toBeLessThanOrEqual(cooldownBlock.y);
      expect(cooldownBlock.y + cooldownBlock.height).toBeLessThanOrEqual(skillBarLayout.pagerY - 4);
    }

    expect(skillBarLayout.labelBlock.height).toBeGreaterThanOrEqual(skillBarLayout.labelFontSize + skillBarLayout.labelStroke * 2);
    expect(skillBarLayout.cooldownBlock.height).toBeGreaterThanOrEqual(skillBarLayout.cooldownFontSize + skillBarLayout.cooldownStroke * 2);
  });
});
