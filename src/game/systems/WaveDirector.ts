import type { SpawnInstruction, WaveDefinition } from "../types";

export type WaveProgressSnapshot = {
  spawned: number;
  spawnBudget: number;
  livingEnemies: number;
  bossId?: string;
  bossSpawned: boolean;
  normalSpawnComplete: boolean;
};

export class WaveDirector {
  private currentIndex = 0;
  private spawnedInWave = 0;
  private spawnElapsed = 0;
  private bossSpawned = false;

  constructor(private readonly waves: readonly WaveDefinition[]) {}

  getCurrentWave(): WaveDefinition {
    return this.waves[this.currentIndex];
  }

  getWaveNumber(): number {
    return this.getCurrentWave().index;
  }

  getWaveProgress(livingEnemyCount: number): WaveProgressSnapshot {
    const current = this.getCurrentWave();
    return {
      spawned: this.spawnedInWave,
      spawnBudget: current.spawnBudget,
      livingEnemies: livingEnemyCount,
      bossId: current.bossId,
      bossSpawned: this.bossSpawned,
      normalSpawnComplete: this.spawnedInWave >= current.spawnBudget
    };
  }

  update(deltaMs: number, livingEnemyCount: number): SpawnInstruction[] {
    const current = this.getCurrentWave();

    this.spawnElapsed += deltaMs;
    const spawns: SpawnInstruction[] = [];

    while (this.spawnedInWave < current.spawnBudget && this.spawnElapsed >= current.spawnIntervalMs) {
      this.spawnElapsed -= current.spawnIntervalMs;
      this.spawnedInWave += 1;
      const enemyId = current.enemies[(this.spawnedInWave - 1) % current.enemies.length];
      spawns.push({ enemyId, isBoss: false });
    }

    if (spawns.length > 0) return spawns;

    if (current.bossId && this.spawnedInWave >= current.spawnBudget && !this.bossSpawned && livingEnemyCount === 0) {
      this.bossSpawned = true;
      return [{ enemyId: current.bossId, bossId: current.bossId, isBoss: true }];
    }

    return spawns;
  }

  canAdvance(livingEnemyCount: number): boolean {
    const current = this.getCurrentWave();
    if (current.bossId) {
      return this.bossSpawned && livingEnemyCount === 0;
    }

    return this.spawnedInWave >= current.spawnBudget && livingEnemyCount === 0;
  }

  advanceWave(): WaveDefinition | null {
    this.currentIndex += 1;
    this.spawnedInWave = 0;
    this.spawnElapsed = 0;
    this.bossSpawned = false;
    return this.waves[this.currentIndex] ?? null;
  }

  restoreWaveNumber(waveNumber: number): void {
    const targetIndex = this.waves.findIndex((wave) => wave.index === waveNumber);
    this.currentIndex = targetIndex >= 0 ? targetIndex : 0;
    this.spawnedInWave = 0;
    this.spawnElapsed = 0;
    this.bossSpawned = false;
  }

  isFinalWaveComplete(livingEnemyCount: number): boolean {
    return this.currentIndex >= this.waves.length - 1 && this.bossSpawned && livingEnemyCount === 0;
  }
}
