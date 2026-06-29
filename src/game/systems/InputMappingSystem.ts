import type { ActiveSkillId } from "../types";

export type ArenaKeyBindings = {
  movement: readonly ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  skills: Readonly<Record<"Q" | "W" | "E", ActiveSkillId>>;
};

export function createArenaKeyBindings(): ArenaKeyBindings {
  return {
    movement: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
    skills: {
      Q: "spin",
      W: "saltBurst",
      E: "pigPenTrap"
    }
  };
}

export function getSkillForKey(key: string): ActiveSkillId | undefined {
  const normalized = key.toUpperCase();
  const skills = createArenaKeyBindings().skills;
  if (normalized === "Q" || normalized === "W" || normalized === "E") return skills[normalized];
  return undefined;
}
