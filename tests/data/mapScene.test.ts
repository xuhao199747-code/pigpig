import { describe, expect, it } from "vitest";

import { hudLayout, rectsOverlap } from "../../src/game/data/hudLayout";
import { getPropBounds, slaughterhouseMap } from "../../src/game/data/mapScene";

describe("slaughterhouse map definition", () => {
  it("points at layered map assets and metadata", () => {
    expect(slaughterhouseMap.baseTextureKey).toBe("map.slaughterhouse.base");
    expect(slaughterhouseMap.props.length).toBeGreaterThan(0);
    expect(slaughterhouseMap.spawnZones.length).toBeGreaterThanOrEqual(4);
    expect(slaughterhouseMap.playerSpawn).toEqual({ x: 800, y: 470 });
  });

  it("keeps the neon sign out of the top-right hud reserve", () => {
    const neonSign = slaughterhouseMap.props.find((prop) => prop.id === "neon-sign");

    expect(neonSign).toBeDefined();
    expect(rectsOverlap(getPropBounds(neonSign!), hudLayout.runPanel)).toBe(false);
    expect(rectsOverlap(getPropBounds(neonSign!), hudLayout.commandPanel)).toBe(false);
    expect(rectsOverlap(getPropBounds(neonSign!), hudLayout.miniMapPanel)).toBe(false);
  });
});
