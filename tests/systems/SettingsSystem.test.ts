import { describe, expect, it } from "vitest";

import {
  createDefaultSettings,
  loadSettings,
  saveSettings,
  toggleSetting
} from "../../src/game/systems/SettingsSystem";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  length = 0;

  clear(): void {
    this.data.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
    this.length = this.data.size;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
    this.length = this.data.size;
  }
}

describe("settings system", () => {
  it("returns immersive but readable defaults", () => {
    expect(loadSettings(new MemoryStorage())).toEqual(createDefaultSettings());
  });

  it("persists settings and normalizes missing fields", () => {
    const storage = new MemoryStorage();
    saveSettings(storage, { soundEnabled: false, screenShakeEnabled: false, controlHintsEnabled: false });

    expect(loadSettings(storage)).toEqual({
      version: 1,
      soundEnabled: false,
      screenShakeEnabled: false,
      controlHintsEnabled: false
    });
  });

  it("toggles one setting without disturbing the others", () => {
    const storage = new MemoryStorage();

    expect(toggleSetting(storage, "controlHintsEnabled").controlHintsEnabled).toBe(false);
    expect(loadSettings(storage)).toMatchObject({
      soundEnabled: true,
      screenShakeEnabled: true,
      controlHintsEnabled: false
    });
  });

  it("falls back to defaults when stored settings are malformed", () => {
    const storage = new MemoryStorage();
    storage.setItem("zhu-zhu-huang-hun.settings.v1", "{not json");

    expect(loadSettings(storage)).toEqual(createDefaultSettings());
  });
});
