import { describe, expect, it } from "vitest";

import { gameFrameConfig, gameSceneKeys } from "../../src/game/config/gameConstants";

describe("game config", () => {
  it("registers boot, menu, arena, and hud scene keys and base frame size", () => {
    expect(gameSceneKeys).toEqual(["boot", "menu", "arena", "hud"]);
    expect(gameFrameConfig.width).toBe(1600);
    expect(gameFrameConfig.height).toBe(900);
  });
});
