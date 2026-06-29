import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const arenaSource = readFileSync(join(process.cwd(), "src/game/scenes/ArenaScene.ts"), "utf8");

describe("boss charge line effect", () => {
  it("draws charge effects as red lines instead of broad ellipse cones", () => {
    expect(arenaSource).toContain("const warningGlow = this.add.line");
    expect(arenaSource).toContain("const chargeCore = this.add.line");
    expect(arenaSource).not.toContain("const shock = this.add.ellipse");
    expect(arenaSource).not.toContain("const mist = this.add.ellipse");
  });
});
