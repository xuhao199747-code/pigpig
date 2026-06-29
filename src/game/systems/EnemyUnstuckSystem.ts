export type EnemyUnstuckInput = {
  velocityX: number;
  velocityY: number;
  targetDeltaX: number;
  targetDeltaY: number;
  blockedLeft: boolean;
  blockedRight: boolean;
  blockedUp: boolean;
  blockedDown: boolean;
};

export type EnemyUnstuckVelocity = {
  x: number;
  y: number;
};

export function createUnstuckVelocity(input: EnemyUnstuckInput): EnemyUnstuckVelocity {
  let x = input.velocityX;
  let y = input.velocityY;
  const blockedHorizontally = (input.blockedLeft && input.velocityX < 0) || (input.blockedRight && input.velocityX > 0);
  const blockedVertically = (input.blockedUp && input.velocityY < 0) || (input.blockedDown && input.velocityY > 0);

  if (blockedHorizontally) {
    const escapeY = Math.abs(input.targetDeltaY) >= 8 ? Math.sign(input.targetDeltaY) : 1;
    x = Math.round(input.velocityX * 0.25);
    y = Math.round(Math.max(Math.abs(input.velocityY), Math.abs(input.velocityX)) * escapeY);
  }

  if (blockedVertically) {
    const escapeX = Math.abs(input.targetDeltaX) >= 8 ? Math.sign(input.targetDeltaX) : 1;
    y = Math.round(input.velocityY * 0.25);
    x = Math.round(Math.max(Math.abs(input.velocityX), Math.abs(input.velocityY)) * escapeX);
  }

  return { x, y };
}
