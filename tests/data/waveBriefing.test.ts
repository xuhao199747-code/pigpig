import { describe, expect, it } from "vitest";

import { createWaveBanner, createWaveBriefing } from "../../src/game/data/waveBriefing";
import { wavePlan } from "../../src/game/data/wavePlan";

describe("wave briefing", () => {
  it("describes ordinary cleanup waves with a clear objective", () => {
    expect(createWaveBriefing(wavePlan[0], wavePlan.length)).toEqual({
      title: "第 1 波 · 清栏热身",
      objective: "清空 14 只猪，撑住屠宰场第一阵骚动。",
      isBossWave: false
    });
  });

  it("calls out boss waves before the boss appears", () => {
    expect(createWaveBriefing(wavePlan[1], wavePlan.length)).toEqual({
      title: "第 2 波 · Boss 前夜",
      objective: "清空 18 只猪后，铁桶猪会进场。",
      isBossWave: true
    });
  });

  it("marks the final wave as the last stand", () => {
    expect(createWaveBriefing(wavePlan[9], wavePlan.length)).toEqual({
      title: "第 10 波 · 猪王终局",
      objective: "清空 50 只猪后，猪王会进场。打完这一波就收工。",
      isBossWave: true
    });
  });

  it("creates a stronger start banner for ordinary waves", () => {
    expect(createWaveBanner(wavePlan[0], wavePlan.length)).toEqual({
      title: "第 1 波",
      subtitle: "清栏热身 · 清空 14 只猪",
      tone: "normal"
    });
  });

  it("warns clearly when a boss wave starts", () => {
    expect(createWaveBanner(wavePlan[3], wavePlan.length)).toEqual({
      title: "Boss 波来袭",
      subtitle: "第 4 波 · 清场后饲料山入场",
      tone: "boss"
    });
  });

  it("makes the final wave feel like the run climax", () => {
    expect(createWaveBanner(wavePlan[9], wavePlan.length)).toEqual({
      title: "最终波",
      subtitle: "第 10 波 · 清场后猪王入场",
      tone: "final"
    });
  });
});
