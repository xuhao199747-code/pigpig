import { describe, expect, it } from "vitest";

import { wavePlan } from "../../src/game/data/wavePlan";
import { WaveDirector } from "../../src/game/systems/WaveDirector";

describe("wave director", () => {
  it("assigns a distinct boss to every even wave", () => {
    const director = new WaveDirector(wavePlan);
    expect(director.getCurrentWave().index).toBe(1);
    expect(wavePlan.filter((wave) => wave.bossId).map((wave) => [wave.index, wave.bossId])).toEqual([
      [2, "ironBarrelBoar"],
      [4, "feedMountain"],
      [6, "forkliftHog"],
      [8, "stitchedPenBeast"],
      [10, "pigKing"]
    ]);
  });

  it("spawns normal enemies before spawning one boss", () => {
    const director = new WaveDirector([
      { index: 2, spawnBudget: 2, spawnIntervalMs: 100, enemies: ["fatPig"], bossId: "ironBarrelBoar" }
    ]);

    expect(director.update(100, 0)).toEqual([{ enemyId: "fatPig", isBoss: false }]);
    expect(director.update(100, 1)).toEqual([{ enemyId: "fatPig", isBoss: false }]);
    expect(director.update(0, 0)).toEqual([
      { enemyId: "ironBarrelBoar", bossId: "ironBarrelBoar", isBoss: true }
    ]);
    expect(director.update(1000, 0)).toEqual([]);
  });

  it("reports compact wave progress for cleanup and boss phases", () => {
    const director = new WaveDirector([
      { index: 2, spawnBudget: 2, spawnIntervalMs: 100, enemies: ["fatPig"], bossId: "ironBarrelBoar" }
    ]);

    expect(director.getWaveProgress(0)).toEqual({
      spawned: 0,
      spawnBudget: 2,
      livingEnemies: 0,
      bossId: "ironBarrelBoar",
      bossSpawned: false,
      normalSpawnComplete: false
    });

    director.update(200, 2);
    expect(director.getWaveProgress(2)).toEqual({
      spawned: 2,
      spawnBudget: 2,
      livingEnemies: 2,
      bossId: "ironBarrelBoar",
      bossSpawned: false,
      normalSpawnComplete: true
    });

    director.update(0, 0);
    expect(director.getWaveProgress(1)).toEqual({
      spawned: 2,
      spawnBudget: 2,
      livingEnemies: 1,
      bossId: "ironBarrelBoar",
      bossSpawned: true,
      normalSpawnComplete: true
    });
  });

  it("can restore the current wave from a saved run", () => {
    const director = new WaveDirector(wavePlan);

    director.restoreWaveNumber(4);

    expect(director.getWaveNumber()).toBe(4);
    expect(director.getWaveProgress(0)).toMatchObject({
      spawned: 0,
      bossSpawned: false,
      normalSpawnComplete: false
    });
  });
});
