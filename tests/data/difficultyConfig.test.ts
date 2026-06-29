import { describe, expect, it } from "vitest";

import { difficultyCatalog, getDifficultyConfig } from "../../src/game/data/difficultyConfig";

describe("difficulty config", () => {
  it("defines four ordered local game difficulties", () => {
    expect(difficultyCatalog.map((entry) => entry.id)).toEqual([
      "casual",
      "standard",
      "butcherNight",
      "pigGodDusk"
    ]);
  });

  it("falls back to standard difficulty for unknown ids", () => {
    expect(getDifficultyConfig("missing").id).toBe("standard");
  });
});
