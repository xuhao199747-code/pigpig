import { describe, expect, it } from "vitest";

import {
  getDeathBurstPresentation,
  getBossContactAttackPose,
  getBossContactFacingFlip,
  getBossMotionScale,
  getBossMovementPose,
  getBossTelegraphPose,
  getEnemyAnimationTimeScale,
  getEnemyAttackFacingDirection,
  getEnemyFacingFlip,
  getEnemyAttackPose,
  getEnemyMovementFacingDirection,
  getEnemyVisualState,
  getEnemyWalkPose,
  getHitReactionPresentation,
  getSharedPigAnimationKey,
  usesSharedPigAnimation
} from "../../src/game/entities/enemyPresentation";
import { enemyCatalog } from "../../src/game/data/enemyCatalog";

describe("enemy presentation", () => {
  it("keeps bosses on their dedicated static texture", () => {
    expect(usesSharedPigAnimation(enemyCatalog.fatPig)).toBe(true);
    expect(usesSharedPigAnimation(enemyCatalog.ironBarrelBoar)).toBe(false);
  });

  it("faces shared pig sprites toward horizontal movement while preserving idle facing", () => {
    expect(getEnemyFacingFlip({ velocityX: -80, currentFlipX: false })).toBe(false);
    expect(getEnemyFacingFlip({ velocityX: 80, currentFlipX: false })).toBe(true);
    expect(getEnemyFacingFlip({ velocityX: 0, currentFlipX: true })).toBe(true);
    expect(getEnemyFacingFlip({ velocityX: 0.04, currentFlipX: false })).toBe(false);
  });

  it("uses the target side to face enemies during near-vertical chases", () => {
    expect(getEnemyFacingFlip({ velocityX: 0.04, targetDeltaX: 80, currentFlipX: false })).toBe(true);
    expect(getEnemyFacingFlip({ velocityX: -0.04, targetDeltaX: -80, currentFlipX: true })).toBe(false);
    expect(getEnemyFacingFlip({ velocityX: 0.04, targetDeltaX: 2, currentFlipX: true })).toBe(true);
  });

  it("keeps an explicit pig direction from movement or target fallback", () => {
    expect(getEnemyMovementFacingDirection({ velocityX: 0, velocityY: -120, currentDirection: "right" })).toBe("up");
    expect(getEnemyMovementFacingDirection({ velocityX: 0.04, velocityY: 0.02, targetDeltaX: -90, targetDeltaY: 6, currentDirection: "right" })).toBe("left");
    expect(getEnemyMovementFacingDirection({ velocityX: 50, velocityY: 120, targetDeltaX: 0, targetDeltaY: -80, currentDirection: "left" })).toBe("down");
  });

  it("selects attack animation only while the shared pig is attacking", () => {
    expect(getSharedPigAnimationKey({ isAttacking: false })).toBe("enemy.pig.walk");
    expect(getSharedPigAnimationKey({ isAttacking: true })).toBe("enemy.pig.attack");
  });

  it("prioritizes enemy attack visuals over movement and idle jitter", () => {
    expect(getEnemyVisualState({ velocityX: 80, velocityY: 0, isAttacking: true })).toBe("attack");
    expect(getEnemyVisualState({ velocityX: -80, velocityY: 20, isAttacking: false })).toBe("move");
    expect(getEnemyVisualState({ velocityX: 0.02, velocityY: -0.03, isAttacking: false })).toBe("idle");
  });

  it("adds a directional lunge pose when common pigs bite", () => {
    expect(getEnemyAttackPose({ baseScale: 0.36, facingRight: true, enemyId: "forkPig" })).toEqual({
      angle: 5.2,
      scaleX: 0.389,
      scaleY: 0.337
    });
    expect(getEnemyAttackPose({ baseScale: 0.36, facingRight: false, enemyId: "forkPig" })).toEqual({
      angle: -5.2,
      scaleX: 0.389,
      scaleY: 0.337
    });
  });

  it("re-aims enemy attack direction from the target at contact time", () => {
    expect(getEnemyAttackFacingDirection({ targetDeltaX: 12, targetDeltaY: -90, currentDirection: "right" })).toBe("up");
    expect(getEnemyAttackFacingDirection({ targetDeltaX: -14, targetDeltaY: 95, currentDirection: "left" })).toBe("down");
    expect(getEnemyAttackFacingDirection({ targetDeltaX: 90, targetDeltaY: 16, currentDirection: "up" })).toBe("right");
  });

  it("lets common pigs bite upward or downward without losing horizontal facing", () => {
    expect(getEnemyAttackPose({ baseScale: 0.36, facingRight: true, approachVelocityY: 120, enemyId: "fatPig" })).toEqual({
      angle: 6.1,
      scaleX: 0.392,
      scaleY: 0.333
    });
    expect(getEnemyAttackPose({ baseScale: 0.36, facingRight: false, approachVelocityY: -120, enemyId: "fatPig" })).toEqual({
      angle: -6.1,
      scaleX: 0.392,
      scaleY: 0.333
    });
  });

  it("gives special pig attacks variant-specific silhouettes", () => {
    expect(getEnemyAttackPose({ baseScale: 0.5, facingRight: true, approachVelocityY: 0, enemyId: "chargePig" })).toEqual({
      angle: 8.4,
      scaleX: 0.57,
      scaleY: 0.455
    });
    expect(getEnemyAttackPose({ baseScale: 0.54, facingRight: false, approachVelocityY: 0, enemyId: "helmetPig" })).toEqual({
      angle: -4.1,
      scaleX: 0.572,
      scaleY: 0.518
    });
  });

  it("gives bosses their own oversized contact attack pose", () => {
    expect(getBossContactAttackPose({
      baseScale: 0.76,
      facingRight: false,
      enemyId: "feedMountain",
      facingDirection: "up",
      enraged: false
    })).toEqual({
      angle: -4.59,
      scaleX: 0.864,
      scaleY: 0.675
    });
    expect(getBossContactAttackPose({
      baseScale: 0.8,
      facingRight: true,
      enemyId: "pigKing",
      facingDirection: "down",
      enraged: true
    })).toEqual({
      angle: 10.39,
      scaleX: 0.899,
      scaleY: 0.708
    });
  });

  it("aims boss contact attacks toward the target side during vertical contact", () => {
    expect(getBossContactFacingFlip({
      velocityX: 0.04,
      targetDeltaX: -80,
      currentFlipX: true
    })).toBe(false);
    expect(getBossContactFacingFlip({
      velocityX: -0.02,
      targetDeltaX: 90,
      currentFlipX: false
    })).toBe(true);
  });

  it("makes charging bosses read heavier than ordinary boss movement", () => {
    expect(getBossMotionScale({ baseScale: 0.8, isCharging: false })).toBe(0.8);
    expect(getBossMotionScale({ baseScale: 0.8, isCharging: true })).toBeCloseTo(0.88);
  });

  it("gives bosses a readable wind-up pose before their special attack", () => {
    expect(getBossTelegraphPose({ baseScale: 0.8, elapsedMs: 160, velocityX: 80, velocityY: 0 })).toEqual({
      angle: 3.4,
      scaleX: 0.874,
      scaleY: 0.756
    });
    expect(getBossTelegraphPose({ baseScale: 0.8, elapsedMs: 160, velocityX: -80, velocityY: 100 })).toEqual({
      angle: -2,
      scaleX: 0.874,
      scaleY: 0.756
    });
  });

  it("adds a small directional trot pose to common pigs", () => {
    expect(getEnemyWalkPose({ elapsedMs: 90, velocityX: 90, velocityY: 0, baseScale: 0.36, enemyId: "fatPig" })).toEqual({
      angle: 2.4,
      scaleX: 0.37,
      scaleY: 0.353
    });
    expect(getEnemyWalkPose({ elapsedMs: 90, velocityX: -90, velocityY: 0, baseScale: 0.36, enemyId: "fatPig" })).toEqual({
      angle: -2.4,
      scaleX: 0.37,
      scaleY: 0.353
    });
  });

  it("gives special pig variants readable movement personalities", () => {
    expect(getEnemyWalkPose({ elapsedMs: 90, velocityX: 90, velocityY: 0, baseScale: 0.5, enemyId: "chargePig" })).toEqual({
      angle: 4.1,
      scaleX: 0.517,
      scaleY: 0.488
    });
    expect(getEnemyWalkPose({ elapsedMs: 120, velocityX: -70, velocityY: 60, baseScale: 0.52, enemyId: "feedPig" })).toEqual({
      angle: -1.25,
      scaleX: 0.535,
      scaleY: 0.512
    });
  });

  it("gives bosses a heavier directional pose when charging", () => {
    expect(getBossMovementPose({ baseScale: 0.8, velocityX: 120, velocityY: 0, elapsedMs: 160, isCharging: false })).toEqual({
      angle: 1.6,
      scaleX: 0.817,
      scaleY: 0.788
    });
    expect(getBossMovementPose({ baseScale: 0.8, velocityX: -120, velocityY: 80, elapsedMs: 160, isCharging: true })).toEqual({
      angle: -3.9,
      scaleX: 0.913,
      scaleY: 0.847
    });
  });

  it("uses heavier boss squash when a boss charges mostly vertical", () => {
    expect(getBossMovementPose({ baseScale: 0.8, velocityX: 0, velocityY: 160, elapsedMs: 160, isCharging: true })).toEqual({
      angle: 2.2,
      scaleX: 0.915,
      scaleY: 0.841
    });
  });

  it("gives boss variants distinct movement silhouettes", () => {
    expect(getBossMovementPose({
      baseScale: 0.76,
      velocityX: 0,
      velocityY: 120,
      elapsedMs: 160,
      isCharging: false,
      enemyId: "feedMountain"
    })).toEqual({
      angle: 0.45,
      scaleX: 0.791,
      scaleY: 0.743
    });
    expect(getBossMovementPose({
      baseScale: 0.78,
      velocityX: 140,
      velocityY: 20,
      elapsedMs: 160,
      isCharging: true,
      enemyId: "forkliftHog"
    })).toEqual({
      angle: 7.8,
      scaleX: 0.93,
      scaleY: 0.826
    });
  });

  it("makes the pig king wind-up read more ceremonial than other bosses", () => {
    expect(getBossTelegraphPose({
      baseScale: 0.8,
      velocityX: -80,
      velocityY: 80,
      elapsedMs: 160,
      enemyId: "pigKing"
    })).toEqual({
      angle: -3.2,
      scaleX: 0.895,
      scaleY: 0.74
    });
  });

  it("scales enemy walk animation speed by variant and active movement", () => {
    expect(getEnemyAnimationTimeScale({ enemyId: "fatPig", speedMultiplier: 1, isAttacking: false })).toBe(1);
    expect(getEnemyAnimationTimeScale({ enemyId: "chargePig", speedMultiplier: 2.6, isAttacking: false })).toBe(1.28);
    expect(getEnemyAnimationTimeScale({ enemyId: "feedPig", speedMultiplier: 1.4, isAttacking: true })).toBe(1);
  });

  it("lets vertical boss movement affect the heavy body lean", () => {
    expect(getBossMovementPose({ baseScale: 0.8, velocityX: 0, velocityY: 120, elapsedMs: 160, isCharging: false }).angle).toBe(0.9);
    expect(getBossMovementPose({ baseScale: 0.8, velocityX: 0, velocityY: -120, elapsedMs: 160, isCharging: true }).angle).toBe(-2.2);
  });

  it("gives bosses a heavier hit reaction than common pigs", () => {
    expect(getHitReactionPresentation(enemyCatalog.fatPig)).toEqual({
      flashMs: 90,
      scaleBump: 1.04,
      recoilDistance: 10,
      sparkCount: 3,
      tint: 0xffffff,
      cameraShakeMs: 0
    });
    expect(getHitReactionPresentation(enemyCatalog.pigKing)).toEqual({
      flashMs: 150,
      scaleBump: 1.08,
      recoilDistance: 18,
      sparkCount: 7,
      tint: 0xffd08a,
      cameraShakeMs: 70
    });
  });

  it("uses larger death bursts for bosses", () => {
    expect(getDeathBurstPresentation(enemyCatalog.leanPig)).toEqual({
      radius: 26,
      durationMs: 260,
      particleCount: 4,
      shockwaveCount: 1,
      stainRadius: 18
    });
    expect(getDeathBurstPresentation(enemyCatalog.feedMountain)).toEqual({
      radius: 76,
      durationMs: 520,
      particleCount: 10,
      shockwaveCount: 3,
      stainRadius: 50
    });
  });
});
