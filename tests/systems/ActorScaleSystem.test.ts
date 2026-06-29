import { describe, expect, it } from "vitest";

import { getEnemyVisualScale, playerVisualScale } from "../../src/game/systems/ActorScaleSystem";
import { enemyCatalog } from "../../src/game/data/enemyCatalog";

describe("actor scale system", () => {
  it("makes the butcher large enough to read on the full arena view", () => {
    expect(playerVisualScale).toBe(0.68);
  });

  it("enlarges normal pigs more aggressively than bosses", () => {
    expect(getEnemyVisualScale(enemyCatalog.leanPig)).toBeCloseTo(0.621);
    expect(getEnemyVisualScale(enemyCatalog.feedMountain)).toBeCloseTo(0.897);
  });
});
