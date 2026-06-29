import Phaser from "phaser";

import { Enemy } from "./Enemy";
import {
  getBossContactFacingFlip,
  getBossContactAttackPose,
  getBossMovementPose,
  getBossTelegraphPose,
  getEnemyFacingFlip,
  getEnemyMovementFacingDirection,
  type EnemyFacingDirection
} from "./enemyPresentation";
import { getBossAnimationKey, getBossAnimationTimeScale } from "../systems/BossAnimationSystem";
import { createBossChargeSpec, createLockedBossChargeVector, type BossChargeVector } from "../systems/BossChargeSystem";
import { advanceBossBehavior, getBossEnrageModifiers, type BossBehaviorState } from "../systems/BossBehaviorSystem";
import type { EnemyDefinition } from "../types";

export class BossPig extends Enemy {
  private behaviorState: BossBehaviorState = { elapsedMs: 0 };
  private chargeRemainingMs = 0;
  private readonly bossBaseScale: number;
  private readonly telegraphLeadMs = 650;
  private poseElapsedMs = 0;
  private telegraphRemainingMs = 0;
  private bossFacingDirection: EnemyFacingDirection = "left";
  private lastTargetDeltaX = 0;
  private lastTargetDeltaY = 0;
  private enraged = false;
  private bossAttackAnimationActive = false;
  private lockedChargeVector: BossChargeVector = { x: 1, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, definition: EnemyDefinition) {
    super(scene, x, y, definition);
    this.bossBaseScale = this.visualScale;
    this.playBossAnimation(false, false);
  }

  override update(deltaMs: number, target: Phaser.Math.Vector2, feedAuraMultiplier = 1): void {
    const modifiers = getBossEnrageModifiers(this.enraged);
    this.lastTargetDeltaX = target.x - this.x;
    this.lastTargetDeltaY = target.y - this.y;
    this.poseElapsedMs += deltaMs;
    super.update(deltaMs, target, feedAuraMultiplier * modifiers.speedMultiplier);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const behavior = this.definition.bossBehavior;
    const telegraphLeadMs = Math.floor(this.telegraphLeadMs * modifiers.telegraphLeadMultiplier);
    this.telegraphRemainingMs = Math.max(0, this.telegraphRemainingMs - deltaMs);
    this.bossFacingDirection = getEnemyMovementFacingDirection({
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      targetDeltaX: this.lastTargetDeltaX,
      targetDeltaY: this.lastTargetDeltaY,
      currentDirection: this.bossFacingDirection
    });
    this.applyBossPose(body.velocity.x, body.velocity.y, false);
    if (!behavior) return;

    if (this.chargeRemainingMs > 0) {
      this.telegraphRemainingMs = 0;
      this.chargeRemainingMs = Math.max(0, this.chargeRemainingMs - deltaMs);
      const chargeSpec = createBossChargeSpec({
        enemyId: this.definition.id,
        power: behavior.power,
        enraged: this.enraged
      });
      body.setVelocity(
        this.lockedChargeVector.x * this.definition.speed * chargeSpec.speedMultiplier * modifiers.speedMultiplier,
        this.lockedChargeVector.y * this.definition.speed * chargeSpec.speedMultiplier * modifiers.speedMultiplier
      );
      this.bossFacingDirection = getEnemyMovementFacingDirection({
        velocityX: body.velocity.x,
        velocityY: body.velocity.y,
        targetDeltaX: this.lastTargetDeltaX,
        targetDeltaY: this.lastTargetDeltaY,
        currentDirection: this.bossFacingDirection
      });
      this.setFlipX(getEnemyFacingFlip({
        velocityX: body.velocity.x,
        targetDeltaX: this.lastTargetDeltaX,
        currentFlipX: this.flipX
      }));
      this.applyBossPose(body.velocity.x, body.velocity.y, true);
      this.setTint(0xf1a15f);
      if (this.chargeRemainingMs === 0) {
        this.setTint(this.definition.tint);
        this.applyBossPose(body.velocity.x, body.velocity.y, false);
      }
    }

    const result = advanceBossBehavior(
      this.behaviorState,
      deltaMs,
      Math.floor(behavior.cooldownMs * modifiers.cooldownMultiplier),
      telegraphLeadMs
    );
    this.behaviorState = result.state;
    if (result.telegraphTriggered) {
      this.telegraphRemainingMs = telegraphLeadMs;
      this.lockedChargeVector = createLockedBossChargeVector({
        fromX: this.x,
        fromY: this.y,
        targetX: target.x,
        targetY: target.y
      });
      this.setTintFill(0xffd17a);
      this.playBossAnimation(true, false);
      this.scene.events.emit("boss:telegraph", this, behavior.type, behavior.power, telegraphLeadMs);
    }
    if (!result.triggered) return;

    if (behavior.type === "charge") {
      this.chargeRemainingMs = createBossChargeSpec({
        enemyId: this.definition.id,
        power: behavior.power,
        enraged: this.enraged
      }).durationMs;
      this.playBossAnimation(true, true);
      this.scene.events.emit("boss:charge", this, this.lockedChargeVector, behavior.power);
    }
    if (behavior.type === "slam") {
      this.playTimedBossAttackAnimation();
      this.scene.events.emit("boss:slam", this, behavior.power);
    }
    if (behavior.type === "summon") {
      this.playTimedBossAttackAnimation();
      this.scene.events.emit("boss:summon", this, Math.round(behavior.power));
    }
  }

  setEnraged(isEnraged = true): void {
    this.enraged = isEnraged;
    this.setData("enraged", isEnraged);
  }

  isEnraged(): boolean {
    return this.enraged;
  }

  override consumeContactDamage(): void {
    super.consumeContactDamage();
    const body = this.body as Phaser.Physics.Arcade.Body;
    const facingRight = getBossContactFacingFlip({
      velocityX: body.velocity.x,
      targetDeltaX: this.lastTargetDeltaX,
      currentFlipX: this.flipX
    });
    this.bossFacingDirection = getEnemyMovementFacingDirection({
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      targetDeltaX: this.lastTargetDeltaX,
      targetDeltaY: this.lastTargetDeltaY,
      currentDirection: this.bossFacingDirection
    });
    this.setFlipX(facingRight);
    const pose = getBossContactAttackPose({
      baseScale: this.bossBaseScale,
      facingRight,
      enemyId: this.definition.id,
      facingDirection: this.bossFacingDirection,
      enraged: this.enraged
    });
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
    this.setTintFill(this.enraged ? 0xff765c : 0xffc06d);
    this.playTimedBossAttackAnimation();
    this.scene.time.delayedCall(140, () => {
      if (!this.active) return;
      this.setTint(this.definition.tint);
    });
  }

  private applyBossPose(velocityX: number, velocityY: number, isCharging: boolean): void {
    const pose = this.telegraphRemainingMs > 0 && !isCharging
      ? getBossTelegraphPose({
        baseScale: this.bossBaseScale,
        velocityX,
        velocityY,
        elapsedMs: this.poseElapsedMs,
        enemyId: this.definition.id,
        facingDirection: this.bossFacingDirection
      })
      : getBossMovementPose({
      baseScale: this.bossBaseScale,
      velocityX,
      velocityY,
      elapsedMs: this.poseElapsedMs,
      isCharging,
      enemyId: this.definition.id,
      facingDirection: this.bossFacingDirection
    });
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
    this.playBossAnimation(this.telegraphRemainingMs > 0 || this.bossAttackAnimationActive, isCharging);
    if (!isCharging && this.telegraphRemainingMs === 0) this.setTint(this.definition.tint);
  }

  private playTimedBossAttackAnimation(): void {
    this.bossAttackAnimationActive = true;
    this.playBossAnimation(true, false);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.bossAttackAnimationActive = false;
      if (this.active) this.playBossAnimation(false, false);
    });
  }

  private playBossAnimation(isAttacking: boolean, isCharging: boolean): void {
    const key = getBossAnimationKey({ bossId: this.definition.id, isAttacking, isCharging });
    if (!this.scene.anims.exists(key)) return;
    if (this.anims.currentAnim?.key !== key || !this.anims.isPlaying) {
      this.play(key, true);
    }
    this.anims.timeScale = getBossAnimationTimeScale({ enraged: this.enraged, isCharging });
  }
}
