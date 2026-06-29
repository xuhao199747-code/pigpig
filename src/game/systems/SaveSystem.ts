import type { DifficultyId } from "../data/difficultyConfig";
import { getDifficultyConfig } from "../data/difficultyConfig";
import { playerConfig } from "../data/playerConfig";
import { getWeaponDefinition } from "../data/weaponCatalog";
import type { ActiveSkillId, PlayerProgressState } from "../types";

export type SaveRunRecord = {
  difficultyId: DifficultyId;
  weaponId: string;
  wave: number;
  coins: number;
  level: number;
  kills: number;
  victory: boolean;
  completedAt: string;
};

export type GameSave = {
  version: 1;
  lastDifficultyId: DifficultyId;
  lastWeaponId: string;
  runCount: number;
  bestRun: SaveRunRecord | null;
  lastRun: SaveRunRecord | null;
  activeRun: ActiveRunRecord | null;
};

export type RunResultInput = {
  difficultyId: DifficultyId;
  weaponId: string;
  wave: number;
  coins: number;
  level: number;
  kills: number;
  victory: boolean;
};

export type ContinueRunData = {
  difficultyId: DifficultyId;
  weaponId: string;
  activeRun?: ActiveRunRecord | null;
};

export type ActiveRunRecord = {
  difficultyId: DifficultyId;
  weaponId: string;
  wave: number;
  coins: number;
  level: number;
  exp: number;
  kills: number;
  elapsedMs: number;
  health: number;
  stamina: number;
  armor: number;
  unlockedSkillIds: ActiveSkillId[];
  progress: PlayerProgressState;
  savedAt: string;
};

export type ActiveRunInput = Omit<ActiveRunRecord, "savedAt">;

const saveKey = "zhu-zhu-huang-hun.save.v1";

export function createDefaultSave(): GameSave {
  return {
    version: 1,
    lastDifficultyId: "standard",
    lastWeaponId: "rustyCleaver",
    runCount: 0,
    bestRun: null,
    lastRun: null,
    activeRun: null
  };
}

export function loadSave(storage: Storage | undefined = getLocalStorage()): GameSave {
  if (!storage) return createDefaultSave();

  try {
    const raw = storage.getItem(saveKey);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    return normalizeSave(parsed);
  } catch {
    return createDefaultSave();
  }
}

export function saveSelectedDifficulty(storage: Storage | undefined, difficultyId: DifficultyId): GameSave {
  const next = {
    ...loadSave(storage),
    lastDifficultyId: difficultyId
  };
  writeSave(storage, next);
  return next;
}

export function saveSelectedWeapon(storage: Storage | undefined, weaponId: string): GameSave {
  const next = {
    ...loadSave(storage),
    lastWeaponId: getWeaponDefinition(weaponId).id
  };
  writeSave(storage, next);
  return next;
}

export function saveRunResult(storage: Storage | undefined, result: RunResultInput): GameSave {
  const current = loadSave(storage);
  const record: SaveRunRecord = {
    ...result,
    completedAt: new Date().toISOString()
  };
  const next = {
    ...current,
    lastDifficultyId: result.difficultyId,
    lastWeaponId: getWeaponDefinition(result.weaponId).id,
    runCount: current.runCount + 1,
    bestRun: isBetterRun(record, current.bestRun) ? record : current.bestRun,
    lastRun: record,
    activeRun: null
  };
  writeSave(storage, next);
  return next;
}

export function createContinueRunData(save: GameSave): ContinueRunData {
  if (save.activeRun) {
    return {
      difficultyId: save.activeRun.difficultyId,
      weaponId: getWeaponDefinition(save.activeRun.weaponId).id,
      activeRun: save.activeRun
    };
  }
  return {
    difficultyId: save.lastDifficultyId,
    weaponId: getWeaponDefinition(save.lastWeaponId).id
  };
}

export function hasClearableSaveData(save: GameSave): boolean {
  return save.runCount > 0 || Boolean(save.activeRun);
}

export function saveActiveRun(storage: Storage | undefined, activeRun: ActiveRunInput): GameSave {
  const normalized: ActiveRunRecord = {
    ...activeRun,
    difficultyId: getDifficultyConfig(activeRun.difficultyId).id,
    weaponId: getWeaponDefinition(activeRun.weaponId).id,
    wave: clampPositiveInteger(activeRun.wave, 1),
    coins: clampNonNegativeInteger(activeRun.coins),
    level: clampPositiveInteger(activeRun.level, 1),
    exp: clampNonNegativeInteger(activeRun.exp),
    kills: clampNonNegativeInteger(activeRun.kills),
    elapsedMs: clampNonNegativeInteger(activeRun.elapsedMs),
    health: clampVitality(activeRun.health, playerConfig.maxHealth),
    stamina: clampVitality(activeRun.stamina, playerConfig.maxStamina),
    armor: clampVitality(activeRun.armor, playerConfig.maxArmor),
    unlockedSkillIds: normalizeSkillIds(activeRun.unlockedSkillIds),
    progress: normalizeProgress(activeRun.progress, activeRun.weaponId, activeRun.unlockedSkillIds),
    savedAt: new Date().toISOString()
  };
  normalized.unlockedSkillIds = [...normalized.progress.unlockedSkillIds];
  const next = {
    ...loadSave(storage),
    lastDifficultyId: normalized.difficultyId,
    lastWeaponId: normalized.weaponId,
    activeRun: normalized
  };
  writeSave(storage, next);
  return next;
}

export function clearSave(storage: Storage | undefined): GameSave {
  const next = createDefaultSave();
  writeSave(storage, next);
  return next;
}

export function createSaveSummaryText(save: GameSave): string {
  if (save.activeRun) {
    const run = save.activeRun;
    return `继续：${getWeaponDefinition(run.weaponId).label} · ${getDifficultyConfig(run.difficultyId).label} · 第 ${run.wave} 波 · 等级 ${run.level} · ${run.kills} 击杀`;
  }

  const best = save.bestRun;
  const last = save.lastRun;
  if (!best || !last) return "本地存档：暂无记录，先开一局把猪圈热起来。";

  return [
    `上次：${getWeaponDefinition(last.weaponId).label} · ${getDifficultyConfig(last.difficultyId).label} · 第 ${last.wave} 波`,
    `最好：${getWeaponDefinition(best.weaponId).label} · 第 ${best.wave} 波 · ${best.coins} 金币`
  ].join("    ");
}

export function createRunResultSummaryLines(save: GameSave): string[] {
  const last = save.lastRun;
  if (!last) return ["本局：未写入记录", "进度：暂无", "最好：暂无", `累计开局：${save.runCount} 次`];

  const best = save.bestRun;
  const difficulty = getDifficultyConfig(last.difficultyId).label;
  const weapon = getWeaponDefinition(last.weaponId).label;
  const bestPrefix = best && isSameRunRecord(best, last) ? "新纪录" : "最好";
  const bestLine = best
    ? `${bestPrefix}：第 ${best.wave} 波 · 等级 ${best.level} · ${best.kills} 击杀`
    : "最好：暂无";

  return [
    `本局：${last.victory ? "通关" : "战败"} · ${difficulty} · ${weapon}`,
    `进度：第 ${last.wave} 波 · 等级 ${last.level} · 击杀 ${last.kills} 只猪`,
    `收获：${last.coins} 金币`,
    bestLine,
    `累计开局：${save.runCount} 次`
  ];
}

function normalizeSave(value: Partial<GameSave>): GameSave {
  const fallback = createDefaultSave();
  return {
    version: 1,
    lastDifficultyId: getDifficultyConfig(value.lastDifficultyId).id,
    lastWeaponId: getWeaponDefinition(value.lastWeaponId).id,
    runCount: Number.isFinite(value.runCount) ? value.runCount ?? 0 : 0,
    bestRun: normalizeRunRecord(value.bestRun),
    lastRun: normalizeRunRecord(value.lastRun),
    activeRun: normalizeActiveRun(value.activeRun)
  };
}

function normalizeRunRecord(record: SaveRunRecord | null | undefined): SaveRunRecord | null {
  if (!record) return null;
  return {
    ...record,
    difficultyId: getDifficultyConfig(record.difficultyId).id,
    weaponId: getWeaponDefinition(record.weaponId).id,
    kills: Number.isFinite(record.kills) ? record.kills : 0
  };
}

function normalizeActiveRun(record: ActiveRunRecord | null | undefined): ActiveRunRecord | null {
  if (!record) return null;
  return {
    difficultyId: getDifficultyConfig(record.difficultyId).id,
    weaponId: getWeaponDefinition(record.weaponId).id,
    wave: clampPositiveInteger(record.wave, 1),
    coins: clampNonNegativeInteger(record.coins),
    level: clampPositiveInteger(record.level, 1),
    exp: clampNonNegativeInteger(record.exp),
    kills: clampNonNegativeInteger(record.kills),
    elapsedMs: clampNonNegativeInteger(record.elapsedMs),
    health: clampVitality(record.health, playerConfig.maxHealth),
    stamina: clampVitality(record.stamina, playerConfig.maxStamina),
    armor: clampVitality(record.armor, playerConfig.maxArmor),
    unlockedSkillIds: normalizeProgress(record.progress, record.weaponId, record.unlockedSkillIds).unlockedSkillIds,
    progress: normalizeProgress(record.progress, record.weaponId, record.unlockedSkillIds),
    savedAt: typeof record.savedAt === "string" ? record.savedAt : new Date(0).toISOString()
  };
}

function normalizeProgress(
  progress: PlayerProgressState | undefined,
  weaponId: string | undefined,
  fallbackSkillIds: readonly ActiveSkillId[] | undefined
): PlayerProgressState {
  const fallback = createBaseProgress(weaponId, fallbackSkillIds);
  if (!progress) return fallback;
  return {
    attackDamage: finiteOr(progress.attackDamage, fallback.attackDamage),
    critChance: finiteOr(progress.critChance, fallback.critChance),
    moveSpeed: finiteOr(progress.moveSpeed, fallback.moveSpeed),
    spinRadius: finiteOr(progress.spinRadius, fallback.spinRadius),
    spinDamage: finiteOr(progress.spinDamage, fallback.spinDamage),
    saltRadius: finiteOr(progress.saltRadius, fallback.saltRadius),
    saltDamage: finiteOr(progress.saltDamage, fallback.saltDamage),
    trapRadius: finiteOr(progress.trapRadius, fallback.trapRadius),
    trapDamage: finiteOr(progress.trapDamage, fallback.trapDamage),
    trapDurationMs: finiteOr(progress.trapDurationMs, fallback.trapDurationMs),
    coinGainMultiplier: finiteOr(progress.coinGainMultiplier, fallback.coinGainMultiplier),
    pickupPowerMultiplier: finiteOr(progress.pickupPowerMultiplier, fallback.pickupPowerMultiplier),
    unlockedSkillIds: normalizeSkillIds(progress.unlockedSkillIds ?? fallbackSkillIds),
    ...(progress.burnEnabled ? { burnEnabled: true } : {})
  };
}

function createBaseProgress(weaponId: string | undefined, skillIds: readonly ActiveSkillId[] | undefined): PlayerProgressState {
  const weapon = getWeaponDefinition(weaponId);
  return {
    attackDamage: weapon.attackDamage,
    critChance: playerConfig.critChance + weapon.critChanceBonus,
    moveSpeed: playerConfig.moveSpeed,
    spinRadius: 125,
    spinDamage: 55,
    saltRadius: 150,
    saltDamage: 40,
    trapRadius: 56,
    trapDamage: 0.2,
    trapDurationMs: 3000,
    coinGainMultiplier: 1,
    pickupPowerMultiplier: 1,
    unlockedSkillIds: normalizeSkillIds(skillIds)
  };
}

function finiteOr(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function normalizeSkillIds(skillIds: readonly ActiveSkillId[] | undefined): ActiveSkillId[] {
  const known: ActiveSkillId[] = ["spin", "saltBurst", "pigPenTrap"];
  const normalized = known.filter((skillId) => skillIds?.includes(skillId));
  return normalized.includes("spin") ? normalized : ["spin", ...normalized];
}

function clampPositiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function clampNonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function clampVitality(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(fallback, Math.floor(value as number)));
}

function isSameRunRecord(a: SaveRunRecord, b: SaveRunRecord): boolean {
  return a.completedAt === b.completedAt
    && a.difficultyId === b.difficultyId
    && a.weaponId === b.weaponId
    && a.wave === b.wave
    && a.coins === b.coins
    && a.level === b.level
    && a.kills === b.kills
    && a.victory === b.victory;
}

function isBetterRun(candidate: SaveRunRecord, current: SaveRunRecord | null): boolean {
  if (!current) return true;
  if (candidate.victory !== current.victory) return candidate.victory;
  if (candidate.wave !== current.wave) return candidate.wave > current.wave;
  if (candidate.level !== current.level) return candidate.level > current.level;
  if (candidate.kills !== current.kills) return candidate.kills > current.kills;
  return candidate.coins > current.coins;
}

function writeSave(storage: Storage | undefined, save: GameSave): void {
  storage?.setItem(saveKey, JSON.stringify(save));
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
