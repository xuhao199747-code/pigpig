import Phaser from "phaser";

import { Enemy } from "../entities/Enemy";
import { BossPig } from "../entities/BossPig";
import { Player } from "../entities/Player";
import { getDifficultyConfig, type DifficultyConfig, type DifficultyId } from "../data/difficultyConfig";
import { wavePlan } from "../data/wavePlan";
import { enemyCatalog } from "../data/enemyCatalog";
import { createWaveBanner, createWaveBriefing } from "../data/waveBriefing";
import { createCharacterStatsView, createSkillBadgeViews } from "../data/hudText";
import { getWeaponDefinition } from "../data/weaponCatalog";
import { normalizeRunWeaponId } from "../data/runStart";
import { slaughterhouseMap } from "../data/mapScene";
import { getDeathBurstPresentation, getHitReactionPresentation } from "../entities/enemyPresentation";
import { getPlayerDeathPresentation, getPlayerHitReactionPresentation } from "../entities/playerAnimationState";
import { createBurnTicks, resolveHit } from "../systems/CombatResolver";
import { createBossEnrageWarning, createBossHudPayload, createBossTelegraphWarning } from "../systems/BossHudSystem";
import {
  createBossChargeTrailPresentation,
  createBossSlamImpactPresentation,
  createBossSummonGatePresentation
} from "../systems/BossActionPresentationSystem";
import { createBossSpawnPresentation } from "../systems/BossSpawnPresentationSystem";
import { applyPickupEffect, expNeededForLevel, rollPickupDrop } from "../systems/DropSystem";
import { getFeedAuraPresentation, getFeedAuraSpeedMultiplier, hasFeedAura } from "../systems/EnemyBehaviorSystem";
import { createRunResultSummaryLines, saveActiveRun, saveRunResult, type ActiveRunRecord } from "../systems/SaveSystem";
import { createSaltBurstTargeting, isPointInSaltBurst } from "../systems/SkillTargetingSystem";
import { loadSettings, type GameSettings } from "../systems/SettingsSystem";
import { advanceStamina, getSprintMoveSpeedMultiplier } from "../systems/StaminaSystem";
import { playAudioCue, type AudioCueId } from "../systems/AudioFeedbackSystem";
import { getSkillForKey } from "../systems/InputMappingSystem";
import { createBossProjectilePattern } from "../systems/BossProjectileSystem";
import { createBossChargeSpec, type BossChargeVector } from "../systems/BossChargeSystem";
import { findSafeSpawnPoint } from "../systems/SpawnPointSystem";
import { createMiniMapSnapshot } from "../systems/MiniMapSystem";
import { shouldFreezeArenaSimulation } from "../systems/ModalSimulationSystem";
import { WaveDirector } from "../systems/WaveDirector";
import { applyUpgrade, rollUpgradeChoices, type UpgradeChoiceView } from "../systems/UpgradeSystem";
import { createWeaponImpactPresentation } from "../systems/WeaponImpactSystem";
import { shouldTriggerBossEnrage } from "../systems/BossBehaviorSystem";
import { miniMapLayout } from "../data/hudLayout";
import type { ActiveSkillId, EnemyDefinition, PickupDefinition } from "../types";

type ArenaStartData = {
  difficultyId?: DifficultyId;
  weaponId?: string;
  activeRun?: ActiveRunRecord | null;
};

export class ArenaScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private skillKeys!: Record<"Q" | "W" | "E", Phaser.Input.Keyboard.Key>;
  private systemKeys!: Record<"P" | "ESC" | "SHIFT", Phaser.Input.Keyboard.Key>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private traps!: Phaser.GameObjects.Zone[];
  private activeBoss?: BossPig;
  private waveDirector = new WaveDirector(wavePlan);
  private level = 1;
  private exp = 0;
  private coins = 0;
  private kills = 0;
  private elapsedMs = 0;
  private gameEnded = false;
  private isLeveling = false;
  private isPaused = false;
  private runWeaponId = "rustyCleaver";
  private activeRunToRestore?: ActiveRunRecord | null;
  private activeSaveElapsedMs = 0;
  private lastChoices: UpgradeChoiceView[] = [];
  private upgradeChoiceCursor = 0;
  private difficulty: DifficultyConfig = getDifficultyConfig("standard");
  private settings: GameSettings = loadSettings();

  constructor() {
    super("arena");
  }

  init(data: ArenaStartData): void {
    this.difficulty = getDifficultyConfig(data?.difficultyId);
    this.runWeaponId = normalizeRunWeaponId(data?.weaponId);
    this.activeRunToRestore = data?.activeRun;
  }

  create(): void {
    this.resetRunState();
    this.settings = loadSettings();
    this.focusCanvas();
    this.input.on("pointerdown", () => this.focusCanvas());

    this.add.image(800, 450, slaughterhouseMap.baseTextureKey).setDisplaySize(1600, 900);

    for (const prop of slaughterhouseMap.props) {
      this.add.image(prop.x, prop.y, prop.textureKey).setDepth(prop.depth);
    }

    this.physics.world.setBounds(0, 0, 1600, 900);
    this.player = new Player(this, slaughterhouseMap.playerSpawn.x, slaughterhouseMap.playerSpawn.y);
    this.player.equipWeapon(getWeaponDefinition(this.runWeaponId));
    this.restoreActiveRunIfPresent();
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.pickups = this.physics.add.group({ runChildUpdate: false });
    this.traps = [];

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.skillKeys = this.input.keyboard!.addKeys("Q,W,E") as Record<"Q" | "W" | "E", Phaser.Input.Keyboard.Key>;
    this.systemKeys = this.input.keyboard!.addKeys("P,ESC,SHIFT") as Record<"P" | "ESC" | "SHIFT", Phaser.Input.Keyboard.Key>;

    for (const blocker of slaughterhouseMap.blockers) {
      const zone = this.add.zone(blocker.x + blocker.width / 2, blocker.y + blocker.height / 2, blocker.width, blocker.height);
      this.physics.add.existing(zone, true);
      this.physics.add.collider(this.player, zone);
      this.physics.add.collider(this.enemies, zone);
    }

    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      const pig = enemy as Enemy;
      if (!pig.canDealContactDamage() || this.gameEnded || this.isLeveling) return;
      pig.consumeContactDamage();
      this.damagePlayer(pig.definition.damage);
    });
    this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
      this.collectPickup(pickup as Phaser.Physics.Arcade.Image);
    });

    this.events.on("upgrade:selected", this.onUpgradeSelected, this);
    this.events.on("upgrade:reroll", this.onUpgradeReroll, this);
    this.events.on("game:toggle-pause", this.togglePause, this);
    this.events.on("game:restart", this.restartRun, this);
    this.events.on("game:menu", this.returnToMenu, this);
    this.events.on("game:cast-skill", this.castSkill, this);
    this.events.on("boss:telegraph", this.onBossTelegraph, this);
    this.events.on("boss:charge", this.onBossCharge, this);
    this.events.on("boss:slam", this.onBossSlam, this);
    this.events.on("boss:summon", this.onBossSummon, this);
    this.scene.launch("hud");
    this.emitHudUpdate();
    this.emitWaveBanner();
  }

  update(_: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.systemKeys.P) || Phaser.Input.Keyboard.JustDown(this.systemKeys.ESC)) {
      this.togglePause();
    }
    if (shouldFreezeArenaSimulation({ gameEnded: this.gameEnded, isLeveling: this.isLeveling, isPaused: this.isPaused })) {
      this.freezeGameplayMotion();
      return;
    }

    this.elapsedMs += delta;
    this.handleMovement(delta);
    this.player.update(delta);
    this.updateEnemies(delta);
    this.updateTraps(delta);
    this.runWaveSpawns(delta);
    this.tryAutoAttack();
    this.handleSkills();
    this.checkWaveAdvance();
    this.emitHudUpdate();
    this.maybeSaveActiveRun(delta);
  }

  private handleMovement(deltaMs: number): void {
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown) dx -= 1;
    if (this.cursors.right.isDown) dx += 1;
    if (this.cursors.up.isDown) dy -= 1;
    if (this.cursors.down.isDown) dy += 1;

    const isMoving = dx !== 0 || dy !== 0;
    const stamina = advanceStamina({
      currentStamina: this.player.currentStamina,
      maxStamina: this.player.maxStamina,
      deltaMs,
      wantsSprint: this.systemKeys.SHIFT.isDown,
      isMoving
    });
    this.player.currentStamina = stamina.currentStamina;

    const movement = new Phaser.Math.Vector2(dx, dy)
      .normalize()
      .scale(this.player.progress.moveSpeed * getSprintMoveSpeedMultiplier(stamina.isSprinting));
    this.player.setMovement(movement.x || 0, movement.y || 0);
  }

  private updateEnemies(delta: number): void {
    const target = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const feedAuraSources = this.enemies.getChildren().filter((child) => {
      const enemy = child as Enemy;
      return enemy.active && hasFeedAura(enemy.definition);
    }) as Enemy[];

    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      if (this.isEnemySpawnLocked(enemy)) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        enemy.setDepth(enemy.y + 4);
        continue;
      }
      enemy.update(delta, target, this.getEnemyFeedAuraMultiplier(enemy, feedAuraSources));
      this.syncEnemyAttachedEffects(enemy);
    }
  }

  private freezeGameplayMotion(): void {
    this.player.setMovement(0, 0);
    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
  }

  private isEnemySpawnLocked(enemy: Enemy): boolean {
    const lockedUntilMs = enemy.getData("spawnLockedUntilMs") as number | undefined;
    return lockedUntilMs !== undefined && this.elapsedMs < lockedUntilMs;
  }

  private getEnemyFeedAuraMultiplier(enemy: Enemy, feedAuraSources: Enemy[]): number {
    if (feedAuraSources.length === 0 || hasFeedAura(enemy.definition)) return 1;
    return feedAuraSources.reduce((highest, source) => {
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, source.x, source.y);
      return Math.max(highest, getFeedAuraSpeedMultiplier({ distance }));
    }, 1);
  }

  private runWaveSpawns(delta: number): void {
    const instructions = this.waveDirector.update(delta, this.enemies.countActive(true));

    for (const instruction of instructions) {
      const zone = Phaser.Utils.Array.GetRandom(slaughterhouseMap.spawnZones);
      const spawnPoint = findSafeSpawnPoint({
        zone,
        blockers: slaughterhouseMap.blockers,
        world: { width: 1600, height: 900 },
        padding: instruction.isBoss ? 76 : 46
      });
      const def = this.applyDifficultyToEnemy(enemyCatalog[instruction.enemyId]);
      const enemy = instruction.isBoss
        ? new BossPig(this, spawnPoint.x, spawnPoint.y, def)
        : new Enemy(this, spawnPoint.x, spawnPoint.y, def);
      this.enemies.add(enemy);
      if (!instruction.isBoss && hasFeedAura(def)) this.attachFeedAura(enemy);
      if (instruction.isBoss) {
        this.activeBoss = enemy as BossPig;
        this.events.emit("hud:boss:show", createBossHudPayload(def, enemy.currentHealth, this.activeBoss.isEnraged()));
        this.playBossSpawnPresentation(this.activeBoss);
      }
    }
  }

  private attachFeedAura(enemy: Enemy): void {
    const aura = getFeedAuraPresentation();
    const ring = this.add.circle(enemy.x, enemy.y, aura.radius, aura.tint, aura.alpha)
      .setStrokeStyle(3, aura.tint, 0.34)
      .setDepth(enemy.y - 6);
    enemy.setData("feedAuraRing", ring);
    this.tweens.add({
      targets: ring,
      alpha: aura.alpha * 1.6,
      scale: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private syncEnemyAttachedEffects(enemy: Enemy): void {
    const ring = enemy.getData("feedAuraRing") as Phaser.GameObjects.Arc | undefined;
    if (!ring || !ring.active) return;
    ring.setPosition(enemy.x, enemy.y);
    ring.setDepth(enemy.y - 6);
  }

  private tryAutoAttack(): void {
    if (!this.player.canAutoAttack()) return;

    const nearest = this.findNearestEnemy(this.player.getAutoAttackRange());
    if (!nearest) return;

    this.player.consumeAutoAttack();
    this.playAudio("weaponSwing");
    this.player.playAttackAnimation(nearest.x, nearest.y);
    this.playWeaponImpact(nearest);
    this.hitEnemy(nearest, this.player.progress.attackDamage);
  }

  private handleSkills(): void {
    for (const key of ["Q", "W", "E"] as const) {
      const skillId = getSkillForKey(key);
      if (skillId && Phaser.Input.Keyboard.JustDown(this.skillKeys[key])) this.castSkill(skillId);
    }
  }

  private castSkill(skillId: ActiveSkillId): void {
    if (this.gameEnded || this.isPaused || this.isLeveling || !this.player.tryCast(skillId)) return;
    this.playAudio("menuClick");

    if (skillId === "spin") {
      this.playEffect("skill.spin.sheet", this.player.x, this.player.y, 1.1, this.player.y + 18);
      this.damageEnemiesInRadius(this.player.progress.spinRadius, this.player.progress.spinDamage, true);
    }

    if (skillId === "saltBurst") {
      const targeting = createSaltBurstTargeting({
        originX: this.player.x,
        originY: this.player.y,
        facingDirection: this.player.getFacingDirection(),
        radius: this.player.progress.saltRadius
      });
      this.playEffect("skill.saltBurst.sheet", targeting.centerX, targeting.centerY, 1.1, targeting.centerY + 18);
      this.damageEnemiesInSaltBurst(targeting, this.player.progress.saltDamage, true);
    }

    if (skillId === "pigPenTrap") {
      const trapRadius = this.player.progress.trapRadius;
      const trap = this.add.zone(this.player.x, this.player.y, trapRadius * 2, trapRadius * 2);
      trap.setData("radius", trapRadius);
      const trapSprite = this.add.sprite(this.player.x, this.player.y, "skill.trap.sheet").setAlpha(0.78).setDepth(this.player.y - 1);
      trapSprite.play("skill.trap.sheet");
      this.traps.push(trap);
      this.time.delayedCall(this.player.progress.trapDurationMs, () => {
        trap.destroy();
        trapSprite.destroy();
        this.traps = this.traps.filter((entry) => entry !== trap);
      });
    }
  }

  private updateTraps(delta: number): void {
    void delta;
    for (const trap of this.traps) {
      const trapRadius = (trap.getData("radius") as number | undefined) ?? 56;
      for (const child of this.enemies.getChildren()) {
        const enemy = child as Enemy;
        if (Phaser.Math.Distance.Between(trap.x, trap.y, enemy.x, enemy.y) <= trapRadius) {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          body.velocity.scale(0.92);
          this.hitEnemy(enemy, this.player.progress.trapDamage);
        }
      }
    }
  }

  private findNearestEnemy(maxRange: number): Enemy | null {
    let nearest: Enemy | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < bestDistance && distance <= maxRange) {
        bestDistance = distance;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private damageEnemiesInRadius(radius: number, damage: number, canBurn = false): void {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) <= radius) {
        this.hitEnemy(enemy, damage, canBurn);
      }
    }
  }

  private damageEnemiesInSaltBurst(
    targeting: ReturnType<typeof createSaltBurstTargeting>,
    damage: number,
    canBurn = false
  ): void {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      if (isPointInSaltBurst(targeting, { x: enemy.x, y: enemy.y })) {
        this.hitEnemy(enemy, damage, canBurn);
      }
    }
  }

  private hitEnemy(enemy: Enemy, attackDamage: number, canBurn = false): void {
    const isCrit = Math.random() < this.player.progress.critChance;
    const result = resolveHit({
      attackDamage,
      critMultiplier: 1.65,
      isCrit,
      armor: enemy.definition.armor,
      currentHealth: enemy.currentHealth
    });
    enemy.currentHealth = result.remainingHealth;
    this.playAudio("attackHit");
    this.playEnemyHitReaction(enemy);
    this.showDamageText(enemy.x, enemy.y - 24, result.finalDamage, isCrit);
    if (enemy === this.activeBoss) {
      this.events.emit("hud:boss:update", createBossHudPayload(enemy.definition, enemy.currentHealth, this.activeBoss.isEnraged()));
      this.maybeTriggerBossEnrage(this.activeBoss);
    }

    if (result.didDie) {
      this.onEnemyKilled(enemy);
      return;
    }

    if (canBurn && this.player.progress.burnEnabled) {
      this.queueBurnTicks(enemy);
    }
  }

  private maybeTriggerBossEnrage(boss: BossPig): void {
    if (!shouldTriggerBossEnrage({
      currentHealth: boss.currentHealth,
      maxHealth: boss.definition.maxHealth,
      alreadyEnraged: boss.isEnraged()
    })) {
      return;
    }

    boss.setEnraged(true);
    this.playBossEnragePresentation(boss);
    this.events.emit("hud:boss:update", createBossHudPayload(boss.definition, boss.currentHealth, true));
    this.events.emit("hud:boss:warning", createBossEnrageWarning(boss.definition));
  }

  private playBossEnragePresentation(boss: BossPig): void {
    this.playAudio("bossWarning");
    this.shakeCamera(220, 0.006);
    boss.setTintFill(0xff6d39);
    this.time.delayedCall(220, () => boss.active && boss.setTint(boss.definition.tint));

    const aura = this.add.circle(boss.x, boss.y, Math.max(58, boss.displayWidth * 0.42), 0xc84f2c, 0.12)
      .setStrokeStyle(6, 0xffd08a, 0.72)
      .setScale(0.36, 0.18)
      .setDepth(boss.y + 8);
    this.tweens.add({
      targets: aura,
      alpha: 0,
      scaleX: 2.1,
      scaleY: 0.62,
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => aura.destroy()
    });

    for (let index = 0; index < 9; index += 1) {
      const angle = (Math.PI * 2 * index) / 9;
      const spark = this.add.rectangle(boss.x, boss.y - 18, 8, 3, index % 2 === 0 ? 0xffd08a : 0xf05f3b, 0.9)
        .setRotation(angle)
        .setDepth(boss.y + 40 + index);
      this.tweens.add({
        targets: spark,
        x: boss.x + Math.cos(angle) * Phaser.Math.Between(44, 82),
        y: boss.y - 18 + Math.sin(angle) * Phaser.Math.Between(24, 54),
        alpha: 0,
        scaleX: 0.3,
        duration: 380,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  private playBossSpawnPresentation(boss: BossPig): void {
    const presentation = createBossSpawnPresentation({
      bossId: boss.definition.id,
      label: boss.definition.label,
      wave: this.waveDirector.getWaveNumber()
    });
    boss.setData("spawnLockedUntilMs", this.elapsedMs + presentation.spawnLockMs);
    boss.setAlpha(0.28);
    boss.setTintFill(presentation.tint);
    this.playAudio("bossWarning");
    this.shakeCamera(presentation.cameraShakeMs, 0.006);
    this.events.emit("hud:boss:warning", {
      title: presentation.title,
      hint: presentation.hint
    });

    this.tweens.add({
      targets: boss,
      alpha: 1,
      scaleX: boss.scaleX * 1.08,
      scaleY: boss.scaleY * 1.08,
      duration: presentation.spawnLockMs,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!boss.active) return;
        boss.clearTint();
        boss.setTint(boss.definition.tint);
      }
    });

    for (let index = 0; index < presentation.ringCount; index += 1) {
      const ring = this.add.circle(boss.x, boss.y, 38 + index * 18, 0x7f2332, 0.1)
        .setStrokeStyle(7 - index, presentation.tint, 0.82 - index * 0.12)
        .setScale(0.22)
        .setDepth(boss.y + 1 + index * 0.01);
      this.tweens.add({
        targets: ring,
        alpha: 0,
        scale: 2.2 + index * 0.42,
        delay: index * 90,
        duration: presentation.warningDurationMs,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy()
      });
    }

    for (let index = 0; index < presentation.sparkCount; index += 1) {
      const angle = (Math.PI * 2 * index) / presentation.sparkCount + Phaser.Math.FloatBetween(-0.1, 0.1);
      const distance = Phaser.Math.Between(36, 118);
      const spark = this.add.rectangle(
        boss.x,
        boss.y - Phaser.Math.Between(8, 28),
        Phaser.Math.Between(5, 12),
        Phaser.Math.Between(3, 7),
        index % 3 === 0 ? 0xffd08a : presentation.tint,
        0.88
      )
        .setRotation(angle)
        .setDepth(boss.y + 30 + index * 0.01);
      this.tweens.add({
        targets: spark,
        x: boss.x + Math.cos(angle) * distance,
        y: boss.y + Math.sin(angle) * distance * 0.55,
        alpha: 0,
        rotation: angle + Phaser.Math.FloatBetween(1, 3),
        duration: Math.floor(presentation.warningDurationMs * 0.62),
        delay: index * 16,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  private playWeaponImpact(enemy: Enemy): void {
    const impact = createWeaponImpactPresentation(this.player.currentWeapon);
    const x = (this.player.x + enemy.x) / 2;
    const y = (this.player.y + enemy.y) / 2 - 8;
    if (impact.cameraShakeMs > 0) {
      this.cameras.main.shake(impact.cameraShakeMs, 0.0025);
    }
    this.playImpactFragments(enemy.x, enemy.y - 12, impact.fragmentCount, impact.color, impact.durationMs);

    if (impact.shape === "crush") {
      const ring = this.add.circle(enemy.x, enemy.y - 8, impact.radius * 0.45, impact.color, 0.08)
        .setStrokeStyle(impact.strokeWidth, impact.color, 0.82)
        .setDepth(enemy.y + 18);
      this.tweens.add({
        targets: ring,
        alpha: 0,
        scaleX: 0.72,
        scaleY: 1.18,
        duration: impact.durationMs,
        ease: "Cubic.easeIn",
        onComplete: () => ring.destroy()
      });
      return;
    }

    if (impact.shape === "spark") {
      const spark = this.add.star(enemy.x, enemy.y - 14, 7, 4, impact.radius * 0.45, impact.color, 0.32)
        .setStrokeStyle(impact.strokeWidth, impact.color, 0.85)
        .setDepth(enemy.y + 18);
      this.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 1.5,
        duration: impact.durationMs,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
      return;
    }

    const facingRight = enemy.x >= this.player.x;
    this.playImpactTrails(x, y, impact.trailCount, impact.radius, impact.color, facingRight);
    const slash = this.add.arc(x, y, impact.radius, 215, 325, false, impact.color, 0.1)
      .setStrokeStyle(impact.strokeWidth, impact.color, 0.85)
      .setRotation(facingRight ? -0.22 : Math.PI + 0.22)
      .setScale(1, impact.shape === "arc" ? 0.52 : 0.36)
      .setDepth(Math.max(enemy.y, this.player.y) + 20);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: impact.shape === "arc" ? 0.7 : 0.52,
      duration: impact.durationMs,
      ease: "Cubic.easeOut",
      onComplete: () => slash.destroy()
    });
    if (impact.aftershock) this.playImpactAftershock(enemy.x, enemy.y + 4, impact.radius, impact.aftershock);
  }

  private playImpactTrails(
    x: number,
    y: number,
    trailCount: number,
    radius: number,
    color: number,
    facingRight: boolean
  ): void {
    for (let index = 0; index < trailCount; index += 1) {
      const trail = this.add.arc(x, y + index * 5, radius * (0.72 - index * 0.16), 220, 310, false, color, 0.06)
        .setStrokeStyle(Math.max(2, 4 - index), color, 0.38)
        .setRotation(facingRight ? -0.32 - index * 0.08 : Math.PI + 0.32 + index * 0.08)
        .setScale(1, 0.28 + index * 0.06)
        .setDepth(y + 22 - index);
      this.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 1.15,
        duration: 120 + index * 35,
        ease: "Sine.easeOut",
        onComplete: () => trail.destroy()
      });
    }
  }

  private playImpactAftershock(
    x: number,
    y: number,
    radius: number,
    aftershock: { color: number; radiusMultiplier: number; durationMs: number }
  ): void {
    const ring = this.add.circle(x, y, radius * aftershock.radiusMultiplier, aftershock.color, 0.07)
      .setStrokeStyle(4, aftershock.color, 0.34)
      .setScale(0.4, 0.18)
      .setDepth(y + 8);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 0.42,
      duration: aftershock.durationMs,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });
  }

  private playImpactFragments(
    x: number,
    y: number,
    fragmentCount: number,
    color: number,
    durationMs: number
  ): void {
    for (let index = 0; index < fragmentCount; index += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, fragmentCount);
      const distance = 12 + (index % 3) * 8;
      const fragment = this.add.rectangle(x, y, 4, 2, color, 0.85)
        .setRotation(angle)
        .setDepth(y + 26);
      this.tweens.add({
        targets: fragment,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.58,
        alpha: 0,
        duration: Math.max(120, durationMs * 0.72),
        ease: "Quad.easeOut",
        onComplete: () => fragment.destroy()
      });
    }
  }

  private queueBurnTicks(enemy: Enemy): void {
    const burnTicks = createBurnTicks({
      enabled: true,
      tickDamage: 8,
      tickCount: 2,
      intervalMs: 450
    });
    for (const tick of burnTicks) {
      this.time.delayedCall(tick.delayMs, () => {
        if (!enemy.active || enemy.currentHealth <= 0) return;
        this.hitEnemy(enemy, tick.damage, false);
      });
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    const deathX = enemy.x;
    const deathY = enemy.y;
    const definition = enemy.definition;
    this.kills += 1;
    this.exp += enemy.definition.expDrop;
    this.coins += Math.max(1, Math.round(enemy.definition.coinDrop * this.player.progress.coinGainMultiplier));
    this.maybeSpawnPickup(enemy.x, enemy.y, enemy.definition);
    if (enemy === this.activeBoss) {
      this.events.emit("hud:boss:hide");
      this.activeBoss = undefined;
    }
    this.destroyEnemyAttachedEffects(enemy);
    enemy.destroy();
    this.playAudio("pigDeath");
    this.playEnemyDeathBurst(deathX, deathY, definition);
    this.maybeLevelUp();
  }

  private destroyEnemyAttachedEffects(enemy: Enemy): void {
    const ring = enemy.getData("feedAuraRing") as Phaser.GameObjects.Arc | undefined;
    if (!ring) return;
    this.tweens.killTweensOf(ring);
    ring.destroy();
  }

  private playEnemyHitReaction(enemy: Enemy): void {
    const reaction = getHitReactionPresentation(enemy.definition);
    const originalScaleX = Math.abs(enemy.scaleX);
    const originalScaleY = Math.abs(enemy.scaleY);
    const signX = enemy.scaleX < 0 ? -1 : 1;
    const hitAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    enemy.setTintFill(reaction.tint);
    this.tweens.killTweensOf(enemy);
    this.tweens.add({
      targets: enemy,
      scaleX: signX * originalScaleX * reaction.scaleBump,
      scaleY: originalScaleY * reaction.scaleBump,
      x: enemy.x + Math.cos(hitAngle) * reaction.recoilDistance,
      y: enemy.y + Math.sin(hitAngle) * reaction.recoilDistance * 0.42,
      yoyo: true,
      duration: Math.max(50, Math.floor(reaction.flashMs / 2)),
      onComplete: () => {
        if (!enemy.active) return;
        enemy.setScale(signX * originalScaleX, originalScaleY);
      }
    });
    if (reaction.cameraShakeMs > 0) this.shakeCamera(reaction.cameraShakeMs, 0.0025);
    this.playEnemyHitSparks(enemy.x, enemy.y - 14, reaction.sparkCount, enemy.definition.isBoss);
    this.time.delayedCall(reaction.flashMs, () => enemy.active && enemy.setTint(enemy.definition.tint));
  }

  private playEnemyHitSparks(x: number, y: number, sparkCount: number, isBoss: boolean): void {
    for (let index = 0; index < sparkCount; index += 1) {
      const angle = -Math.PI / 2 + (index - (sparkCount - 1) / 2) * 0.38 + Phaser.Math.FloatBetween(-0.16, 0.16);
      const distance = Phaser.Math.Between(isBoss ? 24 : 12, isBoss ? 48 : 26);
      const spark = this.add.rectangle(x, y, isBoss ? 8 : 5, 2, index % 2 === 0 ? 0xffd08a : 0xf05f3b, 0.92)
        .setRotation(angle)
        .setDepth(y + 70 + index);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.66,
        alpha: 0,
        scaleX: 0.35,
        duration: isBoss ? 230 : 150,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  private playEnemyDeathBurst(x: number, y: number, definition: EnemyDefinition): void {
    const burst = getDeathBurstPresentation(definition);
    const stain = this.add.ellipse(x, y + 10, burst.stainRadius * 1.8, burst.stainRadius * 0.58, 0x46130d, definition.isBoss ? 0.42 : 0.28)
      .setDepth(y - 2)
      .setScale(0.35, 0.2);
    this.tweens.add({
      targets: stain,
      scaleX: 1,
      scaleY: 1,
      alpha: definition.isBoss ? 0.22 : 0.16,
      duration: Math.floor(burst.durationMs * 0.7),
      ease: "Cubic.easeOut"
    });
    this.time.delayedCall(definition.isBoss ? 2200 : 1200, () => {
      if (!stain.active) return;
      this.tweens.add({
        targets: stain,
        alpha: 0,
        duration: 520,
        onComplete: () => stain.destroy()
      });
    });

    for (let wave = 0; wave < burst.shockwaveCount; wave += 1) {
      const shockwave = this.add.circle(x, y + 4, burst.radius * (0.24 + wave * 0.08), 0xf08a45, definition.isBoss ? 0.1 : 0.06)
        .setStrokeStyle(definition.isBoss ? 5 : 3, wave % 2 === 0 ? 0xffd08a : 0xc84f2c, 0.54)
        .setScale(0.5, 0.18)
        .setDepth(y + 12 + wave);
      this.tweens.add({
        targets: shockwave,
        alpha: 0,
        scaleX: 1.8 + wave * 0.34,
        scaleY: 0.42 + wave * 0.08,
        duration: burst.durationMs + wave * 110,
        delay: wave * 70,
        ease: "Cubic.easeOut",
        onComplete: () => shockwave.destroy()
      });
    }

    const ring = this.add.circle(x, y, burst.radius * 0.45, 0xc84f2c, definition.isBoss ? 0.2 : 0.14)
      .setStrokeStyle(definition.isBoss ? 5 : 3, 0xf4a45f, 0.78)
      .setDepth(y + 16);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.75,
      duration: burst.durationMs,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });

    for (let index = 0; index < burst.particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / burst.particleCount + Phaser.Math.FloatBetween(-0.24, 0.24);
      const distance = Phaser.Math.Between(Math.floor(burst.radius * 0.3), burst.radius);
      const particle = this.add.circle(x, y, definition.isBoss ? 5 : 3, index % 2 === 0 ? 0xe0a33b : 0xbb3f2a, 0.9)
        .setDepth(y + 18);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: burst.durationMs,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy()
      });
    }
  }

  private maybeLevelUp(): void {
    const needed = expNeededForLevel(this.level);
    if (this.exp < needed) return;

    this.exp -= needed;
    this.level += 1;
    this.isLeveling = true;
    this.playAudio("levelUp");
    this.lastChoices = rollUpgradeChoices(3, this.upgradeChoiceCursor, this.player.progress);
    this.upgradeChoiceCursor += 1;
    this.emitLevelUpChoices();
  }

  private onUpgradeSelected(choiceId: string): void {
    this.playAudio("menuClick");
    this.player.progress = applyUpgrade(this.player.progress, choiceId);
    this.isLeveling = false;
    this.emitHudUpdate();
    this.saveActiveRunCheckpoint();
  }

  private onUpgradeReroll(): void {
    if (!this.isLeveling || this.coins < 1) {
      this.events.emit("hud:levelup:error", { message: "金币不足，先多宰几只。" });
      return;
    }

    this.coins -= 1;
    this.playAudio("menuClick");
    this.lastChoices = rollUpgradeChoices(3, this.upgradeChoiceCursor, this.player.progress);
    this.upgradeChoiceCursor += 2;
    this.emitLevelUpChoices();
    this.emitHudUpdate();
    this.saveActiveRunCheckpoint();
  }

  private emitLevelUpChoices(): void {
    this.events.emit("hud:levelup", {
      level: this.level,
      choices: this.lastChoices,
      rerollCost: 1,
      coins: this.coins
    });
  }

  private checkWaveAdvance(): void {
    const livingCount = this.enemies.countActive(true);

    if (this.waveDirector.isFinalWaveComplete(livingCount)) {
      this.endRun(true);
      return;
    }

    if (this.waveDirector.canAdvance(livingCount)) {
      const nextWave = this.waveDirector.advanceWave();
      if (nextWave) {
        this.emitHudUpdate();
        this.emitWaveBanner();
        this.saveActiveRunCheckpoint();
      }
    }
  }

  private emitWaveBanner(): void {
    this.events.emit("hud:wave-banner", createWaveBanner(this.waveDirector.getCurrentWave(), wavePlan.length));
  }

  private damagePlayer(amount: number): void {
    const absorbed = Math.min(this.player.currentArmor, Math.round(amount * 0.55));
    this.player.currentArmor = Math.max(0, this.player.currentArmor - absorbed);
    this.player.currentHealth = Math.max(0, this.player.currentHealth - (amount - absorbed));
    this.playPlayerHitReaction();
    this.shakeCamera(100, 0.004);
    if (this.player.currentHealth <= 0) {
      this.endRun(false);
    }
  }

  private playPlayerHitReaction(): void {
    const reaction = getPlayerHitReactionPresentation();
    const originalScaleX = Math.abs(this.player.scaleX);
    const originalScaleY = Math.abs(this.player.scaleY);
    const signX = this.player.scaleX < 0 ? -1 : 1;
    this.player.setTintFill(reaction.tint);
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      scaleX: signX * originalScaleX * reaction.scaleBump,
      scaleY: originalScaleY * reaction.scaleBump,
      yoyo: true,
      duration: Math.floor(reaction.flashMs / 2),
      onComplete: () => {
        if (!this.player.active) return;
        this.player.setScale(signX * originalScaleX, originalScaleY);
      }
    });
    this.time.delayedCall(reaction.flashMs, () => this.player.active && this.player.clearTint());
  }

  private onBossTelegraph(
    boss: BossPig,
    type: NonNullable<EnemyDefinition["bossBehavior"]>["type"],
    power: number,
    leadMs: number
  ): void {
    if (!boss.active) return;
    boss.setTintFill(0xffd08a);
    this.playAudio("bossWarning");
    this.events.emit("hud:boss:warning", createBossTelegraphWarning(boss.definition, type));
    this.time.delayedCall(Math.floor(leadMs * 0.55), () => boss.active && boss.setTint(boss.definition.tint));

    if (type === "charge") {
      this.playBossChargeTelegraph(boss, power, leadMs);
      return;
    }
    if (type === "slam") {
      this.playBossSlamTelegraph(boss, power, leadMs);
      return;
    }
    this.playBossSummonTelegraph(boss, Math.round(power), leadMs);
  }

  private playBossChargeTelegraph(boss: BossPig, power: number, leadMs: number): void {
    const presentation = createBossChargeTrailPresentation({
      enemyId: boss.definition.id,
      power,
      enraged: boss.isEnraged()
    });
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
    const length = presentation.trailLength;
    const warningGlow = this.add.line(
      boss.x + Math.cos(angle) * length * 0.5,
      boss.y + Math.sin(angle) * length * 0.5,
      -length * 0.5,
      0,
      length * 0.5,
      0,
      presentation.tint,
      presentation.glowAlpha
    )
      .setOrigin(0.5)
      .setLineWidth(presentation.trailWidth * 3.2)
      .setRotation(angle)
      .setDepth(boss.y - 5);
    const warningLine = this.add.line(
      boss.x + Math.cos(angle) * length * 0.48,
      boss.y + Math.sin(angle) * length * 0.48,
      -length * 0.48,
      0,
      length * 0.52,
      0,
      presentation.tint,
      presentation.strokeAlpha
    )
      .setOrigin(0.5)
      .setLineWidth(presentation.trailWidth * 1.45)
      .setRotation(angle)
      .setDepth(boss.y - 4);
    const warningCore = this.add.line(
      boss.x + Math.cos(angle) * length * 0.5,
      boss.y + Math.sin(angle) * length * 0.5,
      -length * 0.5,
      0,
      length * 0.5,
      0,
      0xff2a1f,
      presentation.coreAlpha
    )
      .setOrigin(0.5)
      .setLineWidth(Math.max(3, presentation.trailWidth * 0.42))
      .setRotation(angle)
      .setDepth(boss.y - 3);

    for (let index = 0; index < presentation.afterimageCount; index += 1) {
      const progress = (index + 1) / (presentation.afterimageCount + 1);
      const ghost = this.add.line(
        boss.x + Math.cos(angle) * length * progress,
        boss.y + Math.sin(angle) * length * progress,
        -Math.max(20, boss.displayWidth * 0.18),
        0,
        Math.max(20, boss.displayWidth * 0.18),
        0,
        presentation.tint,
        Math.max(0.04, presentation.glowAlpha * (1.08 - index * 0.12))
      )
        .setOrigin(0.5)
        .setLineWidth(Math.max(3, presentation.trailWidth * 0.55))
        .setRotation(angle)
        .setDepth(boss.y + 1 + index * 0.01);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        scale: 1.45,
        delay: index * 28,
        duration: presentation.durationMs,
        ease: "Cubic.easeOut",
        onComplete: () => ghost.destroy()
      });
    }

    for (let index = 0; index < presentation.dustCount; index += 1) {
      const offset = Phaser.Math.Between(-24, 24);
      const progress = Phaser.Math.FloatBetween(0.1, 0.92);
      const dust = this.add.circle(
        boss.x + Math.cos(angle) * length * progress + Math.cos(angle + Math.PI / 2) * offset,
        boss.y + Math.sin(angle) * length * progress + Math.sin(angle + Math.PI / 2) * offset,
        Phaser.Math.Between(5, 12),
        0x6b3a22,
        0.28
      ).setDepth(boss.y);
      this.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 1.8,
        delay: index * 18,
        duration: Math.floor(presentation.durationMs * 0.8),
        ease: "Sine.easeOut",
        onComplete: () => dust.destroy()
      });
    }

    this.tweens.add({
      targets: [warningGlow, warningLine, warningCore],
      alpha: 0.02,
      scaleX: 1.08,
      scaleY: 1,
      duration: Math.floor(leadMs / 2),
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        warningGlow.destroy();
        warningLine.destroy();
        warningCore.destroy();
      }
    });
  }

  private playBossSlamTelegraph(boss: BossPig, radius: number, leadMs: number): void {
    const presentation = createBossSlamImpactPresentation({
      enemyId: boss.definition.id,
      radius,
      enraged: boss.isEnraged()
    });
    const warning = this.add.circle(boss.x, boss.y, radius, 0x7f2332, 0.08)
      .setStrokeStyle(5, presentation.tint, 0.72)
      .setDepth(boss.y + 1);
    this.tweens.add({
      targets: warning,
      alpha: 0.36,
      scale: 1.08,
      duration: leadMs,
      ease: "Cubic.easeOut",
      onComplete: () => warning.destroy()
    });
  }

  private playBossSummonTelegraph(boss: BossPig, count: number, leadMs: number): void {
    const presentation = createBossSummonGatePresentation({
      enemyId: boss.definition.id,
      count,
      enraged: boss.isEnraged()
    });
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const x = boss.x + Math.cos(angle) * 110;
      const y = boss.y + Math.sin(angle) * 110;
      const mark = this.add.circle(x, y, presentation.radius, presentation.tint, 0.12)
        .setStrokeStyle(4, 0xffd08a, 0.76)
        .setDepth(y + 3);
      const pen = this.add.rectangle(x, y, presentation.radius * 1.8, presentation.radius * 1.2, 0x2a160e, 0)
        .setStrokeStyle(3, presentation.tint, 0.62)
        .setRotation(angle + Math.PI / 5)
        .setDepth(y + 4);
      for (let sparkIndex = 0; sparkIndex < presentation.sparkCountPerGate; sparkIndex += 1) {
        const sparkAngle = angle + (Math.PI * 2 * sparkIndex) / presentation.sparkCountPerGate;
        const spark = this.add.circle(
          x + Math.cos(sparkAngle) * presentation.radius,
          y + Math.sin(sparkAngle) * presentation.radius,
          3,
          0xfff0b0,
          0.78
        ).setDepth(y + 5);
        this.tweens.add({
          targets: spark,
          x: x + Math.cos(sparkAngle) * presentation.radius * 1.7,
          y: y + Math.sin(sparkAngle) * presentation.radius * 1.7,
          alpha: 0,
          duration: Math.floor(presentation.durationMs * 0.65),
          delay: sparkIndex * 24,
          ease: "Sine.easeOut",
          onComplete: () => spark.destroy()
        });
      }
      this.tweens.add({
        targets: [mark, pen],
        alpha: 0.52,
        scale: 1.45,
        duration: leadMs,
        ease: "Sine.easeInOut",
        onComplete: () => {
          mark.destroy();
          pen.destroy();
        }
      });
    }
  }

  private onBossCharge(boss: BossPig, direction: BossChargeVector, power: number): void {
    if (!boss.active) return;
    const spec = createBossChargeSpec({
      enemyId: boss.definition.id,
      power,
      enraged: boss.isEnraged()
    });
    const length = spec.trailLength;
    const angle = Math.atan2(direction.y, direction.x);
    const chargeGlow = this.add.line(
      boss.x + direction.x * length * 0.42,
      boss.y + direction.y * length * 0.42,
      -length * 0.5,
      0,
      length * 0.5,
      0,
      boss.isEnraged() ? 0xff3328 : 0xd9281f,
      0.34
    )
      .setOrigin(0.5)
      .setLineWidth(spec.telegraphWidth * 3)
      .setRotation(angle)
      .setDepth(boss.y + 8);
    const chargeCore = this.add.line(
      boss.x + direction.x * length * 0.5,
      boss.y + direction.y * length * 0.5,
      -length * 0.5,
      0,
      length * 0.5,
      0,
      0xff2a1f,
      0.92
    )
      .setOrigin(0.5)
      .setLineWidth(Math.max(4, spec.telegraphWidth * 0.7))
      .setRotation(angle)
      .setDepth(boss.y + 9);
    this.tweens.add({
      targets: [chargeGlow, chargeCore],
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => {
        chargeGlow.destroy();
        chargeCore.destroy();
      }
    });

    for (let index = 0; index < 7; index += 1) {
      const afterimage = this.add.line(
        boss.x - direction.x * index * 18,
        boss.y - direction.y * index * 18,
        -Math.max(12, boss.displayWidth * 0.12),
        0,
        Math.max(12, boss.displayWidth * 0.12),
        0,
        boss.isEnraged() ? 0xff3328 : 0xd9281f,
        0.24 - index * 0.024
      )
        .setOrigin(0.5)
        .setLineWidth(Math.max(3, spec.telegraphWidth * 0.5))
        .setRotation(angle)
        .setDepth(boss.y - 2 - index);
      this.tweens.add({
        targets: afterimage,
        alpha: 0,
        x: afterimage.x - direction.x * 42,
        y: afterimage.y - direction.y * 42,
        duration: 280 + index * 24,
        ease: "Sine.easeOut",
        onComplete: () => afterimage.destroy()
      });
    }
    this.trackBossChargeDamage(boss, spec);
    this.shakeCamera(spec.impactShakeMs, 0.0062);
  }

  private trackBossChargeDamage(boss: BossPig, spec: ReturnType<typeof createBossChargeSpec>): void {
    let didHit = false;
    const tickMs = 34;
    const ticks = Math.ceil(spec.durationMs / tickMs);
    for (let index = 0; index <= ticks; index += 1) {
      this.time.delayedCall(index * tickMs, () => {
        if (didHit || this.gameEnded || !boss.active || !this.player.active) return;
        if (Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y) > spec.hitRadius + 20) return;
        didHit = true;
        this.damagePlayer(boss.definition.damage * spec.damageMultiplier);
        const hit = this.add.circle(this.player.x, this.player.y, 54, 0xffd08a, 0.24)
          .setStrokeStyle(5, 0xfff0b0, 0.82)
          .setDepth(this.player.y + 20);
        this.tweens.add({
          targets: hit,
          alpha: 0,
          scale: 1.55,
          duration: 240,
          ease: "Cubic.easeOut",
          onComplete: () => hit.destroy()
        });
      });
    }
  }

  private onBossSlam(boss: BossPig, radius: number): void {
    const presentation = createBossSlamImpactPresentation({
      enemyId: boss.definition.id,
      radius,
      enraged: boss.isEnraged()
    });
    for (let index = 0; index < presentation.ringCount; index += 1) {
      const ring = this.add.circle(boss.x, boss.y, radius * (0.55 + index * 0.22), 0xc84f2c, 0.1)
        .setStrokeStyle(7 - index, presentation.tint, 0.82 - index * 0.14)
        .setDepth(boss.y + 1 + index * 0.01);
      this.tweens.add({
        targets: ring,
        alpha: 0,
        scale: 1.2 + index * 0.08,
        delay: index * 60,
        duration: presentation.durationMs,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy()
      });
    }
    for (let index = 0; index < presentation.debrisCount; index += 1) {
      const angle = (Math.PI * 2 * index) / presentation.debrisCount + Phaser.Math.FloatBetween(-0.08, 0.08);
      const distance = Phaser.Math.FloatBetween(radius * 0.18, radius * 0.86);
      const debris = this.add.rectangle(boss.x, boss.y, Phaser.Math.Between(5, 12), Phaser.Math.Between(3, 8), 0x3f2418, 0.72)
        .setRotation(angle)
        .setDepth(boss.y + 3);
      this.tweens.add({
        targets: debris,
        x: boss.x + Math.cos(angle) * distance,
        y: boss.y + Math.sin(angle) * distance,
        alpha: 0,
        rotation: angle + Phaser.Math.FloatBetween(1.2, 2.6),
        duration: presentation.durationMs,
        ease: "Cubic.easeOut",
        onComplete: () => debris.destroy()
      });
    }
    for (let index = 0; index < presentation.crackCount; index += 1) {
      const angle = (Math.PI * 2 * index) / presentation.crackCount + Phaser.Math.FloatBetween(-0.14, 0.14);
      const length = Phaser.Math.FloatBetween(radius * 0.36, radius * 0.78);
      const crack = this.add.line(
        boss.x,
        boss.y,
        0,
        0,
        Math.cos(angle) * length,
        Math.sin(angle) * length,
        0x170b07,
        0.72
      )
        .setOrigin(0, 0)
        .setLineWidth(3)
        .setDepth(boss.y + 0.5);
      this.tweens.add({
        targets: crack,
        alpha: 0,
        delay: 120,
        duration: presentation.durationMs,
        ease: "Sine.easeOut",
        onComplete: () => crack.destroy()
      });
    }
    this.shakeCamera(160, 0.006);
    if (Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y) <= radius) {
      this.damagePlayer(boss.definition.damage * 1.35);
    }
    this.fireBossProjectiles(boss, -Math.PI / 2);
  }

  private onBossSummon(boss: BossPig, count: number): void {
    const presentation = createBossSummonGatePresentation({
      enemyId: boss.definition.id,
      count,
      enraged: boss.isEnraged()
    });
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const definition = this.applyDifficultyToEnemy(enemyCatalog[index % 2 === 0 ? "leanPig" : "fatPig"]);
      const x = boss.x + Math.cos(angle) * 110;
      const y = boss.y + Math.sin(angle) * 110;
      const burst = this.add.circle(x, y, presentation.radius * 0.8, presentation.tint, 0.32)
        .setStrokeStyle(3, 0xffe0a3, 0.76)
        .setDepth(y + 4);
      this.tweens.add({
        targets: burst,
        alpha: 0,
        scale: 1.75,
        duration: Math.floor(presentation.durationMs * 0.5),
        ease: "Cubic.easeOut",
        onComplete: () => burst.destroy()
      });
      const minion = new Enemy(this, x, y, definition);
      this.enemies.add(minion);
    }
    this.fireBossProjectiles(boss, 0.18);
  }

  private fireBossProjectiles(boss: BossPig, angleOffset: number): void {
    const pattern = createBossProjectilePattern({
      bossId: boss.definition.id,
      enraged: boss.isEnraged()
    });
    for (let index = 0; index < pattern.count; index += 1) {
      const angle = angleOffset + (Math.PI * 2 * index) / pattern.count;
      const projectile = this.createBossProjectileVisual(boss.x, boss.y - 8, pattern, angle)
        .setDepth(boss.y + 18 + index * 0.01);
      const targetX = boss.x + Math.cos(angle) * pattern.speed;
      const targetY = boss.y + Math.sin(angle) * pattern.speed;
      this.tweens.add({
        targets: projectile,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.62,
        delay: index * pattern.burstDelayMs,
        duration: pattern.travelDurationMs,
        ease: "Sine.easeOut",
        onUpdate: () => {
          if (!projectile.active || this.gameEnded) return;
          if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) <= pattern.radius + 18) {
            projectile.destroy();
            this.damagePlayer(boss.definition.damage * pattern.damageMultiplier);
          }
        },
        onComplete: () => projectile.destroy()
      });
    }
  }

  private createBossProjectileVisual(
    x: number,
    y: number,
    pattern: ReturnType<typeof createBossProjectilePattern>,
    angle: number
  ): Phaser.GameObjects.Arc | Phaser.GameObjects.Ellipse {
    if (pattern.shape === "nail") {
      return this.add.ellipse(x, y, pattern.radius * 1.25, pattern.radius * 3.1, pattern.tint, 0.9)
        .setRotation(angle + Math.PI / 2)
        .setStrokeStyle(2, pattern.strokeTint, 0.78);
    }
    if (pattern.shape === "crown") {
      return this.add.circle(x, y, pattern.radius, pattern.tint, 0.92)
        .setStrokeStyle(3, pattern.strokeTint, 0.9)
        .setScale(1.18, 0.9)
        .setRotation(angle);
    }
    if (pattern.shape === "meatball") {
      return this.add.circle(x, y, pattern.radius, pattern.tint, 0.88)
        .setStrokeStyle(3, pattern.strokeTint, 0.74)
        .setScale(1.16, 0.92);
    }
    return this.add.circle(x, y, pattern.radius, pattern.tint, 0.88)
      .setStrokeStyle(2, pattern.strokeTint, 0.72);
  }

  private endRun(victory: boolean): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.player.setMovement(0, 0);
    this.events.emit("hud:boss:hide");
    if (!victory) this.playPlayerDeathBurst();
    this.playAudio("result");
    const save = saveRunResult(globalThis.localStorage, {
      difficultyId: this.difficulty.id,
      weaponId: this.runWeaponId,
      wave: this.waveDirector.getWaveNumber(),
      coins: this.coins,
      level: this.level,
      kills: this.kills,
      victory
    });
    this.events.emit("hud:result", {
      victory,
      wave: this.waveDirector.getWaveNumber(),
      coins: this.coins,
      level: this.level,
      summaryLines: createRunResultSummaryLines(save)
    });
  }

  private playPlayerDeathBurst(): void {
    const death = getPlayerDeathPresentation();
    const x = this.player.x;
    const y = this.player.y;
    this.player.setTint(death.tint);
    this.shakeCamera(260, 0.008);
    this.player.setAngle(-12);
    this.player.setAlpha(0.72);
    const ring = this.add.circle(x, y, death.burstRadius * 0.36, 0x7f2332, 0.2)
      .setStrokeStyle(5, 0xf0a15f, 0.82)
      .setDepth(y + 20);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.9,
      duration: death.durationMs,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });

    for (let index = 0; index < death.particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / death.particleCount + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distance = Phaser.Math.Between(Math.floor(death.burstRadius * 0.25), death.burstRadius);
      const particle = this.add.circle(x, y, 4, index % 3 === 0 ? 0xe0a33b : 0xb83025, 0.92).setDepth(y + 24);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: death.durationMs,
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy()
      });
    }
  }

  private emitHudUpdate(): void {
    this.events.emit("hud:update", {
      hp: this.player.currentHealth,
      maxHp: this.player.maxHealth,
      stamina: this.player.currentStamina,
      maxStamina: this.player.maxStamina,
      armor: this.player.currentArmor,
      maxArmor: this.player.maxArmor,
      wave: this.waveDirector.getWaveNumber(),
      waveBriefing: createWaveBriefing(this.waveDirector.getCurrentWave(), wavePlan.length),
      waveProgress: this.waveDirector.getWaveProgress(this.enemies.countActive(true)),
      timeMs: this.elapsedMs,
      coins: this.coins,
      kills: this.kills,
      level: this.level,
      exp: this.exp,
      expNeeded: expNeededForLevel(this.level),
      characterStats: createCharacterStatsView(this.player.progress),
      skillBadges: createSkillBadgeViews(this.player.progress),
      cooldowns: {
        spin: this.player.getCooldownRemaining("spin"),
        saltBurst: this.player.getCooldownRemaining("saltBurst"),
        pigPenTrap: this.player.getCooldownRemaining("pigPenTrap")
      },
      unlockedSkills: [...this.player.progress.unlockedSkillIds],
      weapon: this.player.currentWeapon,
      miniMap: createMiniMapSnapshot({
        world: { width: 1600, height: 900 },
        miniMap: miniMapLayout.mapRect,
        player: { x: this.player.x, y: this.player.y },
        enemies: this.enemies.getChildren()
          .filter((child) => (child as Enemy).active)
          .map((child) => {
            const enemy = child as Enemy;
            return { x: enemy.x, y: enemy.y, isBoss: Boolean(enemy.definition.isBoss) };
          })
      }),
      paused: this.isPaused
    });
  }

  private togglePause(): void {
    if (this.gameEnded || this.isLeveling) return;
    this.isPaused = !this.isPaused;
    this.player.setMovement(0, 0);
    this.events.emit("hud:pause", { paused: this.isPaused });
    this.emitHudUpdate();
  }

  private restartRun(): void {
    this.scene.stop("hud");
    this.scene.restart({ difficultyId: this.difficulty.id, weaponId: this.runWeaponId });
  }

  private returnToMenu(): void {
    this.scene.stop("hud");
    this.scene.start("menu");
  }

  private resetRunState(): void {
    this.waveDirector = new WaveDirector(wavePlan);
    this.level = 1;
    this.exp = 0;
    this.coins = 0;
    this.kills = 0;
    this.elapsedMs = 0;
    this.gameEnded = false;
    this.isLeveling = false;
    this.isPaused = false;
    this.lastChoices = [];
    this.upgradeChoiceCursor = 0;
    this.activeSaveElapsedMs = 0;
  }

  private restoreActiveRunIfPresent(): void {
    const activeRun = this.activeRunToRestore;
    if (!activeRun) return;
    this.difficulty = getDifficultyConfig(activeRun.difficultyId);
    this.runWeaponId = getWeaponDefinition(activeRun.weaponId).id;
    this.player.equipWeapon(getWeaponDefinition(this.runWeaponId));
    this.waveDirector.restoreWaveNumber(activeRun.wave);
    this.level = activeRun.level;
    this.exp = activeRun.exp;
    this.coins = activeRun.coins;
    this.kills = activeRun.kills;
    this.elapsedMs = activeRun.elapsedMs;
    this.player.currentHealth = activeRun.health;
    this.player.currentStamina = activeRun.stamina;
    this.player.currentArmor = activeRun.armor;
    this.player.progress = { ...activeRun.progress, unlockedSkillIds: [...activeRun.progress.unlockedSkillIds] };
  }

  private maybeSaveActiveRun(deltaMs: number): void {
    this.activeSaveElapsedMs += deltaMs;
    if (this.activeSaveElapsedMs < 1200) return;
    this.activeSaveElapsedMs = 0;
    this.saveActiveRunCheckpoint();
  }

  private saveActiveRunCheckpoint(): void {
    if (this.gameEnded) return;
    saveActiveRun(globalThis.localStorage, {
      difficultyId: this.difficulty.id,
      weaponId: this.runWeaponId,
      wave: this.waveDirector.getWaveNumber(),
      coins: this.coins,
      level: this.level,
      exp: this.exp,
      kills: this.kills,
      elapsedMs: this.elapsedMs,
      health: this.player.currentHealth,
      stamina: this.player.currentStamina,
      armor: this.player.currentArmor,
      unlockedSkillIds: [...this.player.progress.unlockedSkillIds],
      progress: { ...this.player.progress, unlockedSkillIds: [...this.player.progress.unlockedSkillIds] }
    });
  }

  private applyDifficultyToEnemy(definition: EnemyDefinition): EnemyDefinition {
    return {
      ...definition,
      maxHealth: Math.round(definition.maxHealth * this.difficulty.enemyHealthMultiplier),
      speed: Math.round(definition.speed * this.difficulty.enemySpeedMultiplier),
      damage: Math.round(definition.damage * this.difficulty.enemyDamageMultiplier),
      coinDrop: Math.max(1, Math.round(definition.coinDrop * this.difficulty.coinMultiplier))
    };
  }

  private focusCanvas(): void {
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus();
  }

  private fadeAndDestroy(target: Phaser.GameObjects.Image, duration: number): void {
    this.tweens.add({
      targets: target,
      alpha: 0,
      scale: target.scale * 1.18,
      duration,
      onComplete: () => target.destroy()
    });
  }

  private playEffect(key: string, x: number, y: number, scale: number, depth: number): void {
    const fx = this.add.sprite(x, y, key).setScale(scale).setAlpha(0.9).setDepth(depth);
    fx.play(key);
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  private shakeCamera(durationMs: number, intensity: number): void {
    if (!this.settings.screenShakeEnabled) return;
    this.cameras.main.shake(durationMs, intensity);
  }

  private showDamageText(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.add.text(x, y, `${Math.round(damage)}`, {
      color: isCrit ? "#ffd76a" : "#fff0d0",
      fontSize: isCrit ? "24px" : "18px",
      stroke: "#210d08",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(y + 120);

    this.tweens.add({
      targets: text,
      y: y - 28,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy()
    });
  }

  private maybeSpawnPickup(x: number, y: number, enemyDefinition: EnemyDefinition): void {
    const pickup = rollPickupDrop({ enemyIsBoss: enemyDefinition.isBoss });
    if (!pickup) return;

    const sprite = this.physics.add.image(x, y, pickup.textureKey)
      .setDisplaySize(42, 42)
      .setDepth(y + 6)
      .setData("pickup", pickup);
    sprite.body?.setSize(40, 40, true);
    this.pickups.add(sprite);

    this.tweens.add({
      targets: sprite,
      y: y - 8,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.time.delayedCall(12000, () => {
      if (!sprite.active) return;
      this.tweens.killTweensOf(sprite);
      this.fadeAndDestroy(sprite, 260);
    });
  }

  private collectPickup(sprite: Phaser.Physics.Arcade.Image): void {
    const pickup = sprite.getData("pickup") as PickupDefinition | undefined;
    if (!pickup || !sprite.active) return;

    const next = applyPickupEffect({
      type: pickup.type,
      health: this.player.currentHealth,
      maxHealth: this.player.maxHealth,
      stamina: this.player.currentStamina,
      maxStamina: this.player.maxStamina,
      armor: this.player.currentArmor,
      maxArmor: this.player.maxArmor,
      pickupPowerMultiplier: this.player.progress.pickupPowerMultiplier
    });
    this.player.currentHealth = next.health;
    this.player.currentStamina = next.stamina;
    this.player.currentArmor = next.armor;
    this.playAudio("pickup");
    this.showPickupText(sprite.x, sprite.y - 22, pickup);
    this.tweens.killTweensOf(sprite);
    sprite.destroy();
    this.emitHudUpdate();
  }

  private showPickupText(x: number, y: number, pickup: PickupDefinition): void {
    const colors = {
      health: "#ff8f78",
      stamina: "#d8e66a",
      armor: "#9ec8ff"
    } as const;
    const text = this.add.text(x, y, `+${pickup.amount} ${pickup.label}`, {
      color: colors[pickup.type],
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#180a06",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(y + 160);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy()
    });
  }

  private playAudio(cue: AudioCueId): void {
    playAudioCue(this.settings, cue);
  }
}
