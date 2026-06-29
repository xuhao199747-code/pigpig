import { describe, expect, it } from "vitest";

import { createHelpGuideSections, getHelpGuideSummary } from "../../src/game/data/helpGuide";

describe("help guide", () => {
  it("summarizes the playable demo loop", () => {
    expect(getHelpGuideSummary()).toBe("清空 10 波猪潮，2 波一个 Boss，升级时获得技能和被动强化。");
  });

  it("covers controls, combat, upgrades, bosses, pickups, and persistence", () => {
    expect(createHelpGuideSections().map((section) => section.id)).toEqual([
      "goal",
      "controls",
      "combat",
      "upgrades",
      "bosses",
      "persistence"
    ]);
  });

  it("keeps keyboard controls visible in the help text", () => {
    const controls = createHelpGuideSections().find((section) => section.id === "controls");

    expect(controls?.lines).toContain("方向键移动，按住 Shift 消耗体力冲刺，P 或 ESC 暂停。");
    expect(controls?.lines).toContain("Q 旋斩，W 撒盐，E 猪圈陷阱；未解锁技能会显示为灰色。");
  });

  it("explains that skills come from level-up choices instead of relics or inventory", () => {
    const upgrades = createHelpGuideSections().find((section) => section.id === "upgrades");

    expect(upgrades?.lines.join(" ")).toContain("升级三选一");
    expect(upgrades?.lines.join(" ")).toContain("技能解锁");
  });
});
