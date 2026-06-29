export type BossSpawnPresentationInput = {
  bossId: string;
  label: string;
  wave: number;
};

export type BossSpawnPresentation = {
  title: string;
  hint: string;
  ringCount: number;
  sparkCount: number;
  warningDurationMs: number;
  spawnLockMs: number;
  cameraShakeMs: number;
  tint: number;
};

export function createBossSpawnPresentation(input: BossSpawnPresentationInput): BossSpawnPresentation {
  const isFinalBoss = input.bossId === "pigKing" || input.wave >= 10;
  return {
    title: `${input.label} 入场`,
    hint: isFinalBoss ? "最终屠栏开门，先活下来" : "清出空间，准备躲招",
    ringCount: isFinalBoss ? 4 : 3,
    sparkCount: isFinalBoss ? 22 : 14,
    warningDurationMs: isFinalBoss ? 1900 : 1500,
    spawnLockMs: isFinalBoss ? 560 : 420,
    cameraShakeMs: isFinalBoss ? 320 : 220,
    tint: isFinalBoss ? 0xffc66d : 0xf08a45
  };
}
