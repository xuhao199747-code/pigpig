import type { PlayerFacingDirection } from "../entities/playerAnimationState";

export type SaltBurstTargeting = {
  originX: number;
  originY: number;
  centerX: number;
  centerY: number;
  directionX: number;
  directionY: number;
  radius: number;
  coneCosine: number;
};

export function createSaltBurstTargeting(input: {
  originX: number;
  originY: number;
  facingDirection: PlayerFacingDirection;
  radius: number;
}): SaltBurstTargeting {
  const direction = getFacingVector(input.facingDirection);
  const forwardOffset = input.radius * 0.5;
  return {
    originX: input.originX,
    originY: input.originY,
    centerX: roundTargetingValue(input.originX + direction.x * forwardOffset),
    centerY: roundTargetingValue(input.originY + direction.y * forwardOffset),
    directionX: direction.x,
    directionY: direction.y,
    radius: input.radius,
    coneCosine: Math.cos((92 * Math.PI) / 180)
  };
}

export function isPointInSaltBurst(targeting: SaltBurstTargeting, point: { x: number; y: number }): boolean {
  const deltaX = point.x - targeting.originX;
  const deltaY = point.y - targeting.originY;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance > targeting.radius) return false;
  if (distance <= 0.001) return true;

  const dot = (deltaX / distance) * targeting.directionX + (deltaY / distance) * targeting.directionY;
  return dot >= targeting.coneCosine;
}

function getFacingVector(direction: PlayerFacingDirection): { x: number; y: number } {
  if (direction === "right") return { x: 1, y: 0 };
  if (direction === "up") return { x: 0, y: -1 };
  if (direction === "down") return { x: 0, y: 1 };
  return { x: -1, y: 0 };
}

function roundTargetingValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
