import { describe, expect, it } from "vitest";

import { flattenModalChildren, shouldFreezeArenaSimulation } from "../../src/game/systems/ModalSimulationSystem";

describe("modal simulation system", () => {
  it("freezes arena simulation while modal states are visible", () => {
    expect(shouldFreezeArenaSimulation({ gameEnded: false, isLeveling: true, isPaused: false })).toBe(true);
    expect(shouldFreezeArenaSimulation({ gameEnded: false, isLeveling: false, isPaused: true })).toBe(true);
    expect(shouldFreezeArenaSimulation({ gameEnded: true, isLeveling: false, isPaused: false })).toBe(true);
  });

  it("lets the arena advance only when no modal state is active", () => {
    expect(shouldFreezeArenaSimulation({ gameEnded: false, isLeveling: false, isPaused: false })).toBe(false);
  });

  it("flattens grouped modal children before they are added to a Phaser container", () => {
    const closeButton = { id: "close" };
    const rows = [{ id: "row-bg" }, { id: "row-title" }];
    const footer = { id: "footer" };

    expect(flattenModalChildren([closeButton, rows, footer])).toEqual([closeButton, rows[0], rows[1], footer]);
  });
});
