import type { GameSettings } from "./SettingsSystem";

export type AudioCueId =
  | "menuClick"
  | "weaponSwing"
  | "attackHit"
  | "pigDeath"
  | "enemyDeath"
  | "pickup"
  | "levelUp"
  | "bossWarning"
  | "result";

export type AudioCueDefinition = {
  id: AudioCueId;
  frequency: number;
  endFrequency: number;
  durationMs: number;
  gain: number;
  wave: OscillatorType;
};

type AudioHost = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const cueDefinitions: Record<AudioCueId, AudioCueDefinition> = {
  menuClick: { id: "menuClick", frequency: 240, endFrequency: 320, durationMs: 70, gain: 0.035, wave: "square" },
  weaponSwing: { id: "weaponSwing", frequency: 520, endFrequency: 170, durationMs: 115, gain: 0.038, wave: "triangle" },
  attackHit: { id: "attackHit", frequency: 190, endFrequency: 92, durationMs: 90, gain: 0.05, wave: "sawtooth" },
  pigDeath: { id: "pigDeath", frequency: 760, endFrequency: 130, durationMs: 240, gain: 0.055, wave: "sawtooth" },
  enemyDeath: { id: "enemyDeath", frequency: 120, endFrequency: 48, durationMs: 180, gain: 0.06, wave: "sawtooth" },
  pickup: { id: "pickup", frequency: 520, endFrequency: 760, durationMs: 105, gain: 0.045, wave: "triangle" },
  levelUp: { id: "levelUp", frequency: 430, endFrequency: 920, durationMs: 260, gain: 0.055, wave: "triangle" },
  bossWarning: { id: "bossWarning", frequency: 90, endFrequency: 70, durationMs: 360, gain: 0.06, wave: "sawtooth" },
  result: { id: "result", frequency: 330, endFrequency: 520, durationMs: 310, gain: 0.05, wave: "triangle" }
};

let sharedContext: AudioContext | undefined;

export function shouldPlayAudioCue(settings: Pick<GameSettings, "soundEnabled">): boolean {
  return settings.soundEnabled;
}

export function getAudioCueDefinition(id: AudioCueId): AudioCueDefinition {
  return cueDefinitions[id];
}

export function createAudioCuePlan(settings: Pick<GameSettings, "soundEnabled">, id: AudioCueId): AudioCueDefinition | null {
  if (!shouldPlayAudioCue(settings)) return null;
  return getAudioCueDefinition(id);
}

export function playAudioCue(
  settings: Pick<GameSettings, "soundEnabled">,
  id: AudioCueId,
  host: AudioHost = globalThis
): boolean {
  const cue = createAudioCuePlan(settings, id);
  if (!cue) return false;

  const AudioContextCtor = host.AudioContext ?? host.webkitAudioContext;
  if (!AudioContextCtor) return false;

  try {
    const context = sharedContext ?? new AudioContextCtor();
    sharedContext = context;
    if (context.state === "suspended") {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const endTime = now + cue.durationMs / 1000;
    oscillator.type = cue.wave;
    oscillator.frequency.setValueAtTime(cue.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, cue.endFrequency), endTime);
    gain.gain.setValueAtTime(cue.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(endTime);
    return true;
  } catch {
    return false;
  }
}
