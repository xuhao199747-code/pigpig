import type { ActiveSkillId } from "../types";

export function canCastUnlockedSkill(
  unlockedSkillIds: readonly ActiveSkillId[],
  skillId: ActiveSkillId,
  cooldownRemainingMs: number
): boolean {
  return unlockedSkillIds.includes(skillId) && cooldownRemainingMs <= 0;
}
