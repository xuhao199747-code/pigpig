import Phaser from "phaser";

import type { EnemyDefinition } from "../types";
import { getEnemyVisualScale } from "../systems/ActorScaleSystem";
import { advanceEnemyBehavior, type EnemyBehaviorState } from "../systems/EnemyBehaviorSystem";
import { createUnstuckVelocity } from "../systems/EnemyUnstuckSystem";
import {
  getEnemyAnimationTimeScale,
  getEnemyAttackFacingDirection,
  getEnemyAttackPose,
  getEnemyMovementFacingDirection,
  getEnemyFacingFlip,
  getEnemyVisualState,
  getEnemyWalkPose,
  getSharedPigAnimationKey,
  type EnemyFacingDirection,
  usesSharedPigAnimation
} from "./enemyPresentation";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly definition: EnemyDefinition;
  currentHealth: number;
  protected readonly visualScale: number;
  private contactCooldownMs = 600;
  private contactElapsed = 0;
  private attackAnimationActive = false;
  private walkElapsedMs = 0;
  private lastTargetDeltaX = 0;
  private lastTargetDeltaY = 0;
  private facingDirection: EnemyFacingDirection = "left";
  private behaviorState: EnemyBehaviorState = { elapsedMs: 0, burstRemainingMs: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, definition: EnemyDefinition) {
    super(scene, x, y, definition.textureKey);
    this.definition = definition;
    this.visualScale = getEnemyVisualScale(definition);
    this.currentHealth = definition.maxHealth;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(this.visualScale);
    this.setTint(definition.tint);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.width * 0.48, this.height * 0.3, true);
    body.setOffset(this.width * 0.26, this.height * 0.56);
    this.setDepth(y);
    if (usesSharedPigAnimation(definition)) this.play("enemy.pig.walk");
  }

  update(deltaMs: number, target: Phaser.Math.Vector2, feedAuraMultiplier = 1): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const direction = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y).normalize();
    this.lastTargetDeltaX = target.x - this.x;
    this.lastTargetDeltaY = target.y - this.y;
    const behavior = advanceEnemyBehavior({
      definition: this.definition,
      state: this.behaviorState,
      deltaMs,
      feedAuraMultiplier
    });
    this.behaviorState = behavior.state;
    if (behavior.telegraphTriggered) this.playVariantTelegraph();
    const desiredVelocity = {
      x: direction.x * this.definition.speed * behavior.speedMultiplier,
      y: direction.y * this.definition.speed * behavior.speedMultiplier
    };
    const velocity = createUnstuckVelocity({
      velocityX: desiredVelocity.x,
      velocityY: desiredVelocity.y,
      targetDeltaX: this.lastTargetDeltaX,
      targetDeltaY: this.lastTargetDeltaY,
      blockedLeft: body.blocked.left || body.touching.left,
      blockedRight: body.blocked.right || body.touching.right,
      blockedUp: body.blocked.up || body.touching.up,
      blockedDown: body.blocked.down || body.touching.down
    });
    body.setVelocity(velocity.x, velocity.y);
    this.updateMovementPresentation(deltaMs, body.velocity.x, body.velocity.y, behavior.speedMultiplier, target.x - this.x);
    this.contactElapsed += deltaMs;
    this.setDepth(this.y + 4);
  }

  canDealContactDamage(): boolean {
    return this.contactElapsed >= this.contactCooldownMs;
  }

  consumeContactDamage(): void {
    this.contactElapsed = 0;
    if (!usesSharedPigAnimation(this.definition)) return;
    this.attackAnimationActive = true;
    this.resetMovementPose();
    this.facingDirection = getEnemyAttackFacingDirection({
      targetDeltaX: this.lastTargetDeltaX,
      targetDeltaY: this.lastTargetDeltaY,
      currentDirection: this.facingDirection
    });
    const facingRight = getEnemyFacingFlip({
      velocityX: (this.body as Phaser.Physics.Arcade.Body).velocity.x,
      targetDeltaX: this.lastTargetDeltaX,
      currentFlipX: this.flipX
    });
    const pose = getEnemyAttackPose({
      baseScale: this.visualScale,
      facingRight,
      approachVelocityY: (this.body as Phaser.Physics.Arcade.Body).velocity.y,
      enemyId: this.definition.id,
      facingDirection: this.facingDirection
    });
    this.setFlipX(facingRight);
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
    this.play(getSharedPigAnimationKey({ isAttacking: true }), true);
    this.anims.timeScale = 1;
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.attackAnimationActive = false;
      if (this.active) {
        this.resetMovementPose();
        this.play(getSharedPigAnimationKey({ isAttacking: false }), true);
      }
    });
  }

  protected updateMovementPresentation(
    deltaMs: number,
    velocityX: number,
    velocityY: number,
    speedMultiplier = 1,
    targetDeltaX?: number
  ): void {
    this.facingDirection = getEnemyMovementFacingDirection({
      velocityX,
      velocityY,
      targetDeltaX,
      targetDeltaY: this.lastTargetDeltaY,
      currentDirection: this.facingDirection
    });
    this.setFlipX(getEnemyFacingFlip({ velocityX, targetDeltaX, currentFlipX: this.flipX }));
    const visualState = getEnemyVisualState({ velocityX, velocityY, isAttacking: this.attackAnimationActive });
    if (!usesSharedPigAnimation(this.definition) || visualState === "attack") return;
    if (visualState === "idle") {
      this.resetMovementPose();
      this.anims.timeScale = 1;
      return;
    }
    if (this.anims.currentAnim?.key !== "enemy.pig.walk" || !this.anims.isPlaying) {
      this.play(getSharedPigAnimationKey({ isAttacking: false }), true);
    }
    this.anims.timeScale = getEnemyAnimationTimeScale({
      enemyId: this.definition.id,
      speedMultiplier,
      isAttacking: this.attackAnimationActive
    });
    this.walkElapsedMs += deltaMs;
    const pose = getEnemyWalkPose({
      elapsedMs: this.walkElapsedMs,
      velocityX,
      velocityY,
      baseScale: this.visualScale,
      enemyId: this.definition.id,
      facingDirection: this.facingDirection
    });
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
  }

  protected resetMovementPose(): void {
    this.walkElapsedMs = 0;
    this.setAngle(0);
    this.setScale(this.visualScale);
  }

  private playVariantTelegraph(): void {
    if (this.definition.id !== "chargePig") return;
    this.setTintFill(0xffc76a);
    this.scene.time.delayedCall(120, () => this.active && this.setTint(this.definition.tint));
  }
}
