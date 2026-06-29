import { describe, expect, it } from "vitest";

import {
  getPlayerAttackBodyPose,
  getPlayerAttackFacingDirection,
  getPlayerAttackFacingFlip,
  getPlayerAnimationTimeScale,
  getPlayerMovementFacingDirection,
  getPlayerVisualState,
  getPlayerWalkPose,
  getPlayerDeathPresentation,
  getPlayerHitReactionPresentation,
  getPlayerMovementFacingFlip,
  shouldFlipPlayerForHorizontalVelocity,
  shouldStartWalkAnimation
} from "../../src/game/entities/playerAnimationState";

describe("player animation state", () => {
  it("restarts walk when the previous walk animation is stopped", () => {
    expect(
      shouldStartWalkAnimation({
        isMoving: true,
        currentAnimationKey: "player.held.rustyCleaver.walk",
        isAnimationPlaying: false,
        walkAnimationKey: "player.held.rustyCleaver.walk"
      })
    ).toBe(true);
  });

  it("flips the default right-facing sprite when moving left", () => {
    expect(shouldFlipPlayerForHorizontalVelocity(-120, false)).toBe(true);
  });

  it("keeps the default right-facing sprite unflipped when moving right", () => {
    expect(shouldFlipPlayerForHorizontalVelocity(120, false)).toBe(false);
  });

  it("keeps facing stable for tiny horizontal input jitter", () => {
    expect(shouldFlipPlayerForHorizontalVelocity(0.05, false)).toBe(false);
    expect(shouldFlipPlayerForHorizontalVelocity(-0.05, true)).toBe(true);
  });

  it("locks movement facing while the attack animation is active", () => {
    expect(
      getPlayerMovementFacingFlip({
        velocityX: -180,
        currentFlipX: true,
        isAttackAnimationActive: true
      })
    ).toBe(true);
    expect(
      getPlayerMovementFacingFlip({
        velocityX: -180,
        currentFlipX: true,
        isAttackAnimationActive: false
      })
    ).toBe(true);
  });

  it("keeps an explicit butcher direction for vertical and diagonal movement", () => {
    expect(getPlayerMovementFacingDirection({ velocityX: 0, velocityY: -160, currentDirection: "right" })).toBe("up");
    expect(getPlayerMovementFacingDirection({ velocityX: 0, velocityY: 160, currentDirection: "left" })).toBe("down");
    expect(getPlayerMovementFacingDirection({ velocityX: 150, velocityY: -90, currentDirection: "left" })).toBe("right");
    expect(getPlayerMovementFacingDirection({ velocityX: 0.02, velocityY: 0.03, currentDirection: "down" })).toBe("down");
  });

  it("faces attack targets without depending on current movement", () => {
    expect(getPlayerAttackFacingFlip({ playerX: 500, targetX: 620, currentFlipX: false })).toBe(false);
    expect(getPlayerAttackFacingFlip({ playerX: 500, targetX: 380, currentFlipX: false })).toBe(true);
    expect(getPlayerAttackFacingFlip({ playerX: 500, targetX: 502, currentFlipX: true })).toBe(true);
  });

  it("aims attack direction toward mostly vertical targets", () => {
    expect(getPlayerAttackFacingDirection({ playerX: 500, playerY: 500, targetX: 508, targetY: 360, currentDirection: "right" })).toBe("up");
    expect(getPlayerAttackFacingDirection({ playerX: 500, playerY: 500, targetX: 490, targetY: 660, currentDirection: "left" })).toBe("down");
    expect(getPlayerAttackFacingDirection({ playerX: 500, playerY: 500, targetX: 640, targetY: 540, currentDirection: "up" })).toBe("right");
  });

  it("syncs body attack pose with weapon weight and swing progress", () => {
    expect(getPlayerAttackBodyPose({ attackProfile: "slash", progress: 0.5, facingRight: true, baseScale: 0.5 })).toEqual({
      angle: 4.2,
      scaleX: 0.52,
      scaleY: 0.483
    });
    expect(getPlayerAttackBodyPose({ attackProfile: "heavy", progress: 0.72, facingRight: true, baseScale: 0.5 })).toEqual({
      angle: 7.4,
      scaleX: 0.545,
      scaleY: 0.465
    });
  });

  it("leans and breathes the butcher into the movement direction", () => {
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: 120, velocityY: -80, baseScale: 0.5 })).toEqual({
      angle: 2.7,
      scaleX: 0.516,
      scaleY: 0.489
    });
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: -120, velocityY: 80, baseScale: 0.5 })).toEqual({
      angle: -2.7,
      scaleX: 0.516,
      scaleY: 0.489
    });
  });

  it("adds a heavier shoulder bob when the butcher moves mostly vertical", () => {
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: 0, velocityY: 120, baseScale: 0.5 })).toEqual({
      angle: 1.25,
      scaleX: 0.518,
      scaleY: 0.487
    });
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: 0, velocityY: -120, baseScale: 0.5 })).toEqual({
      angle: -1.25,
      scaleX: 0.518,
      scaleY: 0.487
    });
  });

  it("changes the butcher walk weight to match the equipped weapon profile", () => {
    const light = getPlayerWalkPose({ elapsedMs: 140, velocityX: 120, velocityY: 0, baseScale: 0.5, attackProfile: "slash" });
    const heavy = getPlayerWalkPose({ elapsedMs: 140, velocityX: 120, velocityY: 0, baseScale: 0.5, attackProfile: "heavy" });

    expect(heavy.angle).toBeGreaterThan(light.angle);
    expect(heavy.scaleX).toBeGreaterThan(light.scaleX);
  });

  it("ignores tiny horizontal drift while the butcher is clearly walking vertical", () => {
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: 3, velocityY: 160, baseScale: 0.5 })).toEqual({
      angle: 1.25,
      scaleX: 0.518,
      scaleY: 0.487
    });
    expect(getPlayerWalkPose({ elapsedMs: 140, velocityX: -3, velocityY: -160, baseScale: 0.5 })).toEqual({
      angle: -1.25,
      scaleX: 0.518,
      scaleY: 0.487
    });
  });

  it("speeds up walk frames for stronger input without affecting attacks", () => {
    expect(getPlayerAnimationTimeScale({ velocityX: 0, velocityY: 0, isAttackAnimationActive: false })).toBe(1);
    expect(getPlayerAnimationTimeScale({ velocityX: 180, velocityY: 0, isAttackAnimationActive: false })).toBe(1.12);
    expect(getPlayerAnimationTimeScale({ velocityX: 180, velocityY: 0, isAttackAnimationActive: true })).toBe(1);
  });

  it("prioritizes attack visuals over movement and falls back to idle", () => {
    expect(getPlayerVisualState({ velocityX: 120, velocityY: 0, isAttackAnimationActive: true })).toBe("attack");
    expect(getPlayerVisualState({ velocityX: 120, velocityY: 0, isAttackAnimationActive: false })).toBe("move");
    expect(getPlayerVisualState({ velocityX: 0.02, velocityY: -0.01, isAttackAnimationActive: false })).toBe("idle");
  });

  it("defines a short readable hit reaction for the butcher", () => {
    expect(getPlayerHitReactionPresentation()).toEqual({
      flashMs: 130,
      scaleBump: 1.06,
      tint: 0xf2b0a0
    });
  });

  it("defines a heavier death presentation for failed runs", () => {
    expect(getPlayerDeathPresentation()).toEqual({
      burstRadius: 88,
      durationMs: 620,
      particleCount: 12,
      tint: 0x7f2332
    });
  });
});
