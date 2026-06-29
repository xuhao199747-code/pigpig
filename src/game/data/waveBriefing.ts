import type { WaveDefinition } from "../types";
import { enemyCatalog } from "./enemyCatalog";

export type WaveBriefing = {
  title: string;
  objective: string;
  isBossWave: boolean;
};

export type WaveBannerTone = "normal" | "boss" | "final";

export type WaveBanner = {
  title: string;
  subtitle: string;
  tone: WaveBannerTone;
};

const ordinaryWaveNames: Record<number, string> = {
  1: "清栏热身",
  3: "铁帽乱撞",
  5: "饲料骚动",
  7: "猪群暴走",
  9: "终局前厅"
};

export function createWaveBriefing(wave: WaveDefinition, totalWaves: number): WaveBriefing {
  const isFinalWave = wave.index === totalWaves;
  const bossLabel = wave.bossId ? enemyCatalog[wave.bossId]?.label : undefined;
  const title = wave.bossId
    ? `第 ${wave.index} 波 · ${isFinalWave ? "猪王终局" : "Boss 前夜"}`
    : `第 ${wave.index} 波 · ${ordinaryWaveNames[wave.index] ?? "清栏推进"}`;
  const objective = wave.bossId && bossLabel
    ? `清空 ${wave.spawnBudget} 只猪后，${bossLabel}会进场。${isFinalWave ? "打完这一波就收工。" : ""}`
    : `清空 ${wave.spawnBudget} 只猪，${wave.index === 1 ? "撑住屠宰场第一阵骚动。" : "别让猪群把场子夺回去。"}`;

  return {
    title,
    objective,
    isBossWave: Boolean(wave.bossId)
  };
}

export function createWaveBanner(wave: WaveDefinition, totalWaves: number): WaveBanner {
  const isFinalWave = wave.index === totalWaves;
  const bossLabel = wave.bossId ? enemyCatalog[wave.bossId]?.label : undefined;
  if (isFinalWave) {
    return {
      title: "最终波",
      subtitle: `第 ${wave.index} 波 · 清场后${bossLabel ?? "猪王"}入场`,
      tone: "final"
    };
  }

  if (wave.bossId) {
    return {
      title: "Boss 波来袭",
      subtitle: `第 ${wave.index} 波 · 清场后${bossLabel ?? "Boss"}入场`,
      tone: "boss"
    };
  }

  return {
    title: `第 ${wave.index} 波`,
    subtitle: `${ordinaryWaveNames[wave.index] ?? "清栏推进"} · 清空 ${wave.spawnBudget} 只猪`,
    tone: "normal"
  };
}
