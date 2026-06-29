import { describe, expect, it } from "vitest";

import {
  createAudioCuePlan,
  getAudioCueDefinition,
  playAudioCue,
  shouldPlayAudioCue,
  type AudioCueId
} from "../../src/game/systems/AudioFeedbackSystem";
import { createDefaultSettings } from "../../src/game/systems/SettingsSystem";

describe("audio feedback system", () => {
  it("respects the sound setting before attempting playback", () => {
    expect(shouldPlayAudioCue(createDefaultSettings())).toBe(true);
    expect(shouldPlayAudioCue({ ...createDefaultSettings(), soundEnabled: false })).toBe(false);
    expect(createAudioCuePlan({ ...createDefaultSettings(), soundEnabled: false }, "menuClick")).toBeNull();
  });

  it("defines short non-invasive cues for core game feedback", () => {
    const cueIds: AudioCueId[] = [
      "menuClick",
      "weaponSwing",
      "attackHit",
      "pigDeath",
      "enemyDeath",
      "pickup",
      "levelUp",
      "bossWarning",
      "result"
    ];

    for (const cueId of cueIds) {
      const cue = getAudioCueDefinition(cueId);
      expect(cue.durationMs).toBeGreaterThanOrEqual(40);
      expect(cue.durationMs).toBeLessThanOrEqual(420);
      expect(cue.gain).toBeGreaterThan(0);
      expect(cue.gain).toBeLessThanOrEqual(0.08);
    }
  });

  it("creates a playable plan only when sound is enabled", () => {
    expect(createAudioCuePlan(createDefaultSettings(), "pickup")).toMatchObject({
      id: "pickup",
      frequency: 520,
      endFrequency: 760
    });
  });

  it("shapes weapon swings and pig deaths as distinct action sounds", () => {
    const swing = getAudioCueDefinition("weaponSwing");
    expect(swing.frequency).toBeGreaterThan(swing.endFrequency);
    expect(swing.durationMs).toBeLessThanOrEqual(140);
    expect(swing.wave).toBe("triangle");

    const pigDeath = getAudioCueDefinition("pigDeath");
    expect(pigDeath.frequency).toBeGreaterThan(500);
    expect(pigDeath.endFrequency).toBeLessThan(220);
    expect(pigDeath.durationMs).toBeGreaterThanOrEqual(180);
  });

  it("fails safely when WebAudio is unavailable", () => {
    expect(playAudioCue(createDefaultSettings(), "menuClick", {})).toBe(false);
  });
});
