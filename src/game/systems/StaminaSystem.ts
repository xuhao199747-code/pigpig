export type StaminaAdvanceResult = {
  currentStamina: number;
  isSprinting: boolean;
};

const sprintCostPerSecond = 26;
const recoveryPerSecond = 16;
const minSprintStamina = 10;
const sprintMoveSpeedMultiplier = 1.35;

export function advanceStamina(input: {
  currentStamina: number;
  maxStamina: number;
  deltaMs: number;
  wantsSprint: boolean;
  isMoving: boolean;
}): StaminaAdvanceResult {
  const seconds = Math.max(0, input.deltaMs) / 1000;
  const canSprint = input.wantsSprint && input.isMoving && input.currentStamina >= minSprintStamina;

  if (canSprint) {
    return {
      currentStamina: clampStamina(input.currentStamina - sprintCostPerSecond * seconds, input.maxStamina),
      isSprinting: true
    };
  }

  return {
    currentStamina: clampStamina(input.currentStamina + recoveryPerSecond * seconds, input.maxStamina),
    isSprinting: false
  };
}

export function getSprintMoveSpeedMultiplier(isSprinting: boolean): number {
  return isSprinting ? sprintMoveSpeedMultiplier : 1;
}

function clampStamina(value: number, maxStamina: number): number {
  return Math.round(Math.max(0, Math.min(maxStamina, value)));
}
