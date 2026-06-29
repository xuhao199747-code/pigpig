import type { WaveDefinition } from "../types";

export const wavePlan: WaveDefinition[] = [
  { index: 1, spawnBudget: 14, spawnIntervalMs: 1500, enemies: ["fatPig", "leanPig"] },
  { index: 2, spawnBudget: 18, spawnIntervalMs: 1350, enemies: ["fatPig", "leanPig", "forkPig"], bossId: "ironBarrelBoar" },
  { index: 3, spawnBudget: 22, spawnIntervalMs: 1250, enemies: ["fatPig", "leanPig", "helmetPig"] },
  { index: 4, spawnBudget: 26, spawnIntervalMs: 1200, enemies: ["fatPig", "forkPig", "chargePig"], bossId: "feedMountain" },
  { index: 5, spawnBudget: 30, spawnIntervalMs: 1100, enemies: ["leanPig", "chargePig", "feedPig"] },
  { index: 6, spawnBudget: 34, spawnIntervalMs: 1000, enemies: ["helmetPig", "forkPig", "elitePenPig"], bossId: "forkliftHog" },
  { index: 7, spawnBudget: 38, spawnIntervalMs: 925, enemies: ["chargePig", "feedPig", "elitePenPig"] },
  { index: 8, spawnBudget: 42, spawnIntervalMs: 850, enemies: ["helmetPig", "chargePig", "elitePenPig"], bossId: "stitchedPenBeast" },
  { index: 9, spawnBudget: 46, spawnIntervalMs: 800, enemies: ["forkPig", "feedPig", "elitePenPig"] },
  { index: 10, spawnBudget: 50, spawnIntervalMs: 750, enemies: ["helmetPig", "chargePig", "elitePenPig"], bossId: "pigKing" }
];
