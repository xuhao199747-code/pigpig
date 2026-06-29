import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const arenaSource = readFileSync(join(process.cwd(), "src/game/scenes/ArenaScene.ts"), "utf8");

describe("arena audio integration", () => {
  it("plays a swing cue when the butcher commits an auto attack", () => {
    expect(arenaSource).toContain('this.playAudio("weaponSwing")');
  });

  it("plays a pig death cue when an enemy dies", () => {
    expect(arenaSource).toContain('this.playAudio("pigDeath")');
  });
});
