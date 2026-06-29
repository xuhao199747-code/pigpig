import Phaser from "phaser";

import { playerConfig } from "../data/playerConfig";
import { getPlayerWeaponAppearance, type PlayerWeaponAppearance } from "../data/playerWeaponAppearance";
import { getWeaponDefinition, type WeaponDefinition } from "../data/weaponCatalog";
import { playerVisualScale } from "../systems/ActorScaleSystem";
import { applyWeaponToProgress } from "../systems/WeaponSystem";
import type { ActiveSkillId, PlayerProgressState } from "../types";
import {
  getPlayerAttackBodyPose,
  getPlayerAttackFacingDirection,
  getPlayerAttackFacingFlip,
  getPlayerAnimationTimeScale,
  getPlayerMovementFacingDirection,
  getPlayerMovementFacingFlip,
  getPlayerVisualState,
  getPlayerWalkPose,
  type PlayerFacingDirection,
  shouldStartWalkAnimation
} from "./playerAnimationState";
import { canCastUnlockedSkill } from "./playerSkillState";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly baseScale = playerVisualScale;
  private autoAttackElapsed = 0;
  private readonly cooldowns = new Map<ActiveSkillId, number>();
  private attackAnimationActive = false;
  private attackElapsedMs = 0;
  private attackDurationMs = 260;
  private walkElapsedMs = 0;
  private facingDirection: PlayerFacingDirection = "left";
  currentWeapon: WeaponDefinition = getWeaponDefinition("rustyCleaver");
  progress: PlayerProgressState = {
    attackDamage: getWeaponDefinition("rustyCleaver").attackDamage,
    critChance: playerConfig.critChance,
    moveSpeed: playerConfig.moveSpeed,
    spinRadius: 125,
    spinDamage: 55,
    saltRadius: 150,
    saltDamage: 40,
    trapRadius: 56,
    trapDamage: 0.2,
    trapDurationMs: 3000,
    coinGainMultiplier: 1,
    pickupPowerMultiplier: 1,
    unlockedSkillIds: ["spin"]
  };
  currentHealth = playerConfig.maxHealth;
  maxHealth = playerConfig.maxHealth;
  currentStamina = Math.round(playerConfig.maxStamina * 0.72);
  maxStamina = playerConfig.maxStamina;
  currentArmor = Math.round(playerConfig.maxArmor * 0.5);
  maxArmor = playerConfig.maxArmor;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getPlayerWeaponAppearance("rustyCleaver").idleKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setScale(this.baseScale);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.width * 0.34, this.height * 0.3, true);
    body.setOffset(this.width * 0.33, this.height * 0.54);
    this.setDepth(y);
  }

  update(deltaMs: number): void {
    this.autoAttackElapsed += deltaMs;
    if (this.attackAnimationActive) this.attackElapsedMs = Math.min(this.attackDurationMs, this.attackElapsedMs + deltaMs);
    for (const [skill, remaining] of this.cooldowns.entries()) {
      this.cooldowns.set(skill, Math.max(0, remaining - deltaMs));
    }
    this.setDepth(this.y + 8);
    if (this.attackAnimationActive) {
      this.updateAttackBodyPresentation();
    } else {
      this.updateWalkPresentation(deltaMs);
    }
  }

  playAttackAnimation(targetX: number, targetY: number): void {
    this.attackAnimationActive = true;
    this.attackElapsedMs = 0;
    this.attackDurationMs = Math.max(180, Math.min(420, this.currentWeapon.attackRateMs * 0.42));
    this.facingDirection = getPlayerAttackFacingDirection({
      playerX: this.x,
      playerY: this.y,
      targetX,
      targetY,
      currentDirection: this.facingDirection
    });
    this.setFlipX(getPlayerAttackFacingFlip({ playerX: this.x, targetX, currentFlipX: this.flipX }));
    this.resetMovementPose();
    this.play(this.getAttackAnimationKey(), true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.attackAnimationActive = false;
      this.attackElapsedMs = 0;
      if (!this.active) return;

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 0) {
        this.facingDirection = getPlayerMovementFacingDirection({
          velocityX: body.velocity.x,
          velocityY: body.velocity.y,
          currentDirection: this.facingDirection
        });
        this.setFlipX(getPlayerMovementFacingFlip({
          velocityX: body.velocity.x,
          currentFlipX: this.flipX,
          isAttackAnimationActive: false
        }));
        this.play(this.getCurrentAppearance().walkKey, true);
      } else {
        this.resetMovementPose();
        this.setTexture(this.getCurrentAppearance().idleKey);
      }
    });
  }

  setMovement(velocityX: number, velocityY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(velocityX, velocityY);
    if (!this.attackAnimationActive) {
      this.facingDirection = getPlayerMovementFacingDirection({
        velocityX,
        velocityY,
        currentDirection: this.facingDirection
      });
    }
    this.setFlipX(getPlayerMovementFacingFlip({
      velocityX,
      currentFlipX: this.flipX,
      isAttackAnimationActive: this.attackAnimationActive
    }));
    if (this.attackAnimationActive) return;

    const visualState = getPlayerVisualState({
      velocityX,
      velocityY,
      isAttackAnimationActive: this.attackAnimationActive
    });
    this.anims.timeScale = getPlayerAnimationTimeScale({
      velocityX,
      velocityY,
      isAttackAnimationActive: this.attackAnimationActive
    });
    if (
      shouldStartWalkAnimation({
        isMoving: visualState === "move",
        currentAnimationKey: this.anims.currentAnim?.key,
        isAnimationPlaying: this.anims.isPlaying,
        walkAnimationKey: this.getCurrentAppearance().walkKey
      })
    ) {
      this.play(this.getCurrentAppearance().walkKey, true);
    }
    if (visualState === "idle" && this.anims.currentAnim?.key === this.getCurrentAppearance().walkKey) {
      this.stop();
      this.anims.timeScale = 1;
      this.resetMovementPose();
      this.setTexture(this.getCurrentAppearance().idleKey);
    }
  }

  private updateWalkPresentation(deltaMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const visualState = getPlayerVisualState({
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      isAttackAnimationActive: this.attackAnimationActive
    });
    if (visualState !== "move") {
      if (!this.attackAnimationActive) this.resetMovementPose();
      if (visualState === "idle") this.anims.timeScale = 1;
      return;
    }

    this.walkElapsedMs += deltaMs;
    const pose = getPlayerWalkPose({
      elapsedMs: this.walkElapsedMs,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      baseScale: this.baseScale,
      facingDirection: this.facingDirection,
      attackProfile: this.currentWeapon.attackProfile
    });
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
  }

  private updateAttackBodyPresentation(): void {
    const progress = this.attackDurationMs > 0 ? this.attackElapsedMs / this.attackDurationMs : 1;
    const pose = getPlayerAttackBodyPose({
      attackProfile: this.currentWeapon.attackProfile,
      progress,
      facingRight: this.flipX,
      baseScale: this.baseScale,
      facingDirection: this.facingDirection
    });
    this.setAngle(pose.angle);
    this.setScale(pose.scaleX, pose.scaleY);
  }

  private resetMovementPose(): void {
    this.walkElapsedMs = 0;
    this.setAngle(0);
    this.setScale(this.baseScale);
  }

  canAutoAttack(): boolean {
    return this.autoAttackElapsed >= this.currentWeapon.attackRateMs;
  }

  consumeAutoAttack(): void {
    this.autoAttackElapsed = 0;
  }

  tryCast(skillId: ActiveSkillId): boolean {
    const remaining = this.cooldowns.get(skillId) ?? 0;
    if (!canCastUnlockedSkill(this.progress.unlockedSkillIds, skillId, remaining)) return false;
    const skill = playerConfig.activeSkills.find((entry) => entry.id === skillId);
    if (!skill) return false;
    this.cooldowns.set(skillId, skill.cooldownMs);
    return true;
  }

  isSkillUnlocked(skillId: ActiveSkillId): boolean {
    return this.progress.unlockedSkillIds.includes(skillId);
  }

  getCooldownRemaining(skillId: ActiveSkillId): number {
    return this.cooldowns.get(skillId) ?? 0;
  }

  getAutoAttackRange(): number {
    return this.currentWeapon.range;
  }

  getFacingDirection(): PlayerFacingDirection {
    return this.facingDirection;
  }

  equipWeapon(weapon: WeaponDefinition): void {
    this.currentWeapon = weapon;
    this.progress = applyWeaponToProgress(this.progress, weapon, playerConfig.critChance);
    this.setTexture(this.getCurrentAppearance().idleKey);
  }

  override destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }

  private getAttackAnimationKey(): string {
    return this.getCurrentAppearance().attackKey;
  }

  private getCurrentAppearance(): PlayerWeaponAppearance {
    return getPlayerWeaponAppearance(this.currentWeapon.id);
  }
}
