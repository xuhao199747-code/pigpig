export type GameSettings = {
  version: 1;
  soundEnabled: boolean;
  screenShakeEnabled: boolean;
  controlHintsEnabled: boolean;
};

export type GameSettingKey = Exclude<keyof GameSettings, "version">;

const settingsKey = "zhu-zhu-huang-hun.settings.v1";

export function createDefaultSettings(): GameSettings {
  return {
    version: 1,
    soundEnabled: true,
    screenShakeEnabled: true,
    controlHintsEnabled: true
  };
}

export function loadSettings(storage: Storage | undefined = getLocalStorage()): GameSettings {
  if (!storage) return createDefaultSettings();

  try {
    const raw = storage.getItem(settingsKey);
    if (!raw) return createDefaultSettings();
    return normalizeSettings(JSON.parse(raw) as Partial<GameSettings>);
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(
  storage: Storage | undefined,
  settings: Omit<GameSettings, "version"> | GameSettings
): GameSettings {
  const next = normalizeSettings(settings);
  storage?.setItem(settingsKey, JSON.stringify(next));
  return next;
}

export function toggleSetting(storage: Storage | undefined, key: GameSettingKey): GameSettings {
  const current = loadSettings(storage);
  return saveSettings(storage, {
    ...current,
    [key]: !current[key]
  });
}

function normalizeSettings(value: Partial<GameSettings>): GameSettings {
  const fallback = createDefaultSettings();
  return {
    version: 1,
    soundEnabled: typeof value.soundEnabled === "boolean" ? value.soundEnabled : fallback.soundEnabled,
    screenShakeEnabled: typeof value.screenShakeEnabled === "boolean" ? value.screenShakeEnabled : fallback.screenShakeEnabled,
    controlHintsEnabled: typeof value.controlHintsEnabled === "boolean" ? value.controlHintsEnabled : fallback.controlHintsEnabled
  };
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
