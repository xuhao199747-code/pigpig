import { describe, expect, it } from "vitest";

import { createBossSpawnPresentation } from "../../src/game/systems/BossSpawnPresentationSystem";

describe("boss spawn presentation system", () => {
  it("gives a readable entrance package for normal bosses", () => {
    expect(createBossSpawnPresentation({ bossId: "feedMountain", label: "饲料山", wave: 4 })).toEqual({
      title: "饲料山 入场",
      hint: "清出空间，准备躲招",
      ringCount: 3,
      sparkCount: 14,
      warningDurationMs: 1500,
      spawnLockMs: 420,
      cameraShakeMs: 220,
      tint: 0xf08a45
    });
  });

  it("makes the final boss entrance louder and longer", () => {
    expect(createBossSpawnPresentation({ bossId: "pigKing", label: "猪王", wave: 10 })).toMatchObject({
      title: "猪王 入场",
      ringCount: 4,
      sparkCount: 22,
      warningDurationMs: 1900,
      spawnLockMs: 560,
      cameraShakeMs: 320,
      tint: 0xffc66d
    });
  });
});
