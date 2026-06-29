# Weapon Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the flail and gun weapons, normalize the remaining weapons to believable hand-held proportions, and tighten their attack reach so visuals and gameplay feel aligned.

**Architecture:** Keep the current data-driven weapon system intact. Make the catalog the single source of truth for the selectable pool and loaded textures, then update the player presentation logic so each surviving attack profile uses smaller motion arcs and per-weapon hold offsets derived from the existing weapon definition.

**Tech Stack:** TypeScript, Phaser 3, Vitest, Vite

## Global Constraints

- Delete `pigHeadFlail` and `sausageCannon` from the selectable weapon pool.
- Keep the existing `weaponCatalog`-driven loading and selection flow intact.
- Normalize all remaining weapons to a conservative hand-held look; no giant outlier weapons remain.
- Tighten both `worldScale` and `range` for the surviving weapons so visible length and hit distance feel consistent.
- Keep existing rarity, descriptions, and attack-profile-based behavior for the remaining weapons.
- Do not introduce a new weapon system, new HUD flow, new map logic, or new enemy logic.

---

### Task 1: Shrink The Weapon Pool And Rebalance Catalog Data

**Files:**
- Modify: `src/game/data/weaponCatalog.ts`
- Modify: `src/game/scenes/BootScene.ts`
- Modify: `tests/data/weaponCatalog.test.ts`
- Modify: `tests/data/runStart.test.ts`

**Interfaces:**
- Consumes:
  - `getWeaponDefinition(id: string | undefined): WeaponDefinition`
  - `weaponCatalog: readonly WeaponDefinition[]`
- Produces:
  - `weaponCatalog` without `pigHeadFlail` and `sausageCannon`
  - `getWeaponDefinition(id)` still falling back to `"rustyCleaver"`
  - Boot-time texture loading that only references remaining weapon ids

- [ ] **Step 1: Write the failing tests**

Update `tests/data/weaponCatalog.test.ts` to assert the reduced weapon list and conservative scale/range envelope:

```ts
import { describe, expect, it } from "vitest";

import { getWeaponDefinition, weaponCatalog } from "../../src/game/data/weaponCatalog";

describe("weapon catalog", () => {
  it("defines the normalized melee-first weapon pool", () => {
    expect(weaponCatalog.map((weapon) => weapon.id)).toEqual([
      "rustyCleaver",
      "saltFrostCleaver",
      "pigBoneChainsaw",
      "duskHook",
      "dragonSlayer",
      "hydraulicBoneCrusher",
      "hundredMeterPigBlade"
    ]);
  });

  it("keeps every world weapon inside the conservative size envelope", () => {
    expect(weaponCatalog.every((weapon) => weapon.spriteKey.startsWith("weapon.world."))).toBe(true);
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.62);
    expect(Math.max(...weaponCatalog.map((weapon) => weapon.range))).toBeLessThanOrEqual(168);
  });

  it("keeps only the remaining special attack profiles", () => {
    expect(getWeaponDefinition("dragonSlayer").attackProfile).toBe("heavy");
    expect(getWeaponDefinition("hydraulicBoneCrusher").attackProfile).toBe("clamp");
    expect(weaponCatalog.some((weapon) => weapon.attackProfile === "flail")).toBe(false);
    expect(weaponCatalog.some((weapon) => weapon.attackProfile === "shoot")).toBe(false);
  });

  it("defines a normalized grip anchor for every weapon image", () => {
    for (const weapon of weaponCatalog) {
      expect(weapon.grip.x).toBeGreaterThanOrEqual(0);
      expect(weapon.grip.x).toBeLessThanOrEqual(1);
      expect(weapon.grip.y).toBeGreaterThanOrEqual(0);
      expect(weapon.grip.y).toBeLessThanOrEqual(1);
    }

    expect(getWeaponDefinition("dragonSlayer").grip).not.toEqual(getWeaponDefinition("rustyCleaver").grip);
    expect(getWeaponDefinition("hydraulicBoneCrusher").grip).not.toEqual(getWeaponDefinition("rustyCleaver").grip);
  });

  it("falls back to the starter cleaver for unknown weapon ids", () => {
    expect(getWeaponDefinition("missing").id).toBe("rustyCleaver");
  });
});
```

Update `tests/data/runStart.test.ts` so normalized run ids reject the deleted gun id:

```ts
import { describe, expect, it } from "vitest";

import { normalizeRunWeaponId } from "../../src/game/data/runStart";

describe("run start weapon normalization", () => {
  it("keeps a known weapon id", () => {
    expect(normalizeRunWeaponId("duskHook")).toBe("duskHook");
  });

  it("falls back to the starter cleaver for removed or unknown weapon ids", () => {
    expect(normalizeRunWeaponId("sausageCannon")).toBe("rustyCleaver");
    expect(normalizeRunWeaponId("missing")).toBe("rustyCleaver");
    expect(normalizeRunWeaponId()).toBe("rustyCleaver");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/data/weaponCatalog.test.ts tests/data/runStart.test.ts
```

Expected: FAIL because the current catalog still contains `pigHeadFlail` and `sausageCannon`, and the current max scale/range exceed the new conservative limits.

- [ ] **Step 3: Write the minimal implementation**

Update `src/game/data/weaponCatalog.ts` to remove the deleted weapons and shrink the remaining values:

```ts
export type WeaponRarity = "common" | "rare" | "epic" | "legendary";
export type WeaponAttackProfile = "slash" | "heavy" | "flail" | "shoot" | "clamp";

export type WeaponDefinition = {
  id: string;
  label: string;
  rarity: WeaponRarity;
  description: string;
  attackDamage: number;
  attackRateMs: number;
  range: number;
  critChanceBonus: number;
  iconKey: string;
  spriteKey: string;
  worldScale: number;
  attackProfile: WeaponAttackProfile;
  grip: { x: number; y: number };
};

export const weaponCatalog: readonly WeaponDefinition[] = [
  {
    id: "rustyCleaver",
    label: "生锈的屠刀",
    rarity: "common",
    description: "稳定、趁手，适合开局清猪。",
    attackDamage: 24,
    attackRateMs: 650,
    range: 88,
    critChanceBonus: 0,
    iconKey: "ui.icon.skillSpin",
    spriteKey: "weapon.world.rustyCleaver",
    worldScale: 0.34,
    attackProfile: "slash",
    grip: { x: 0.22, y: 0.8 }
  },
  {
    id: "saltFrostCleaver",
    label: "盐霜砍刀",
    rarity: "rare",
    description: "刀口结盐，暴击更狠。",
    attackDamage: 32,
    attackRateMs: 620,
    range: 94,
    critChanceBonus: 0.04,
    iconKey: "ui.icon.skillSalt",
    spriteKey: "weapon.world.saltFrostCleaver",
    worldScale: 0.35,
    attackProfile: "slash",
    grip: { x: 0.22, y: 0.8 }
  },
  {
    id: "pigBoneChainsaw",
    label: "猪骨电锯",
    rarity: "epic",
    description: "用猪骨拼出的荒诞电锯。",
    attackDamage: 42,
    attackRateMs: 560,
    range: 104,
    critChanceBonus: 0.07,
    iconKey: "ui.icon.itemTorch",
    spriteKey: "weapon.world.pigBoneChainsaw",
    worldScale: 0.4,
    attackProfile: "slash",
    grip: { x: 0.24, y: 0.82 }
  },
  {
    id: "duskHook",
    label: "黄昏链钩",
    rarity: "legendary",
    description: "钩影绕场，越浮夸越可靠。",
    attackDamage: 56,
    attackRateMs: 720,
    range: 118,
    critChanceBonus: 0.12,
    iconKey: "ui.icon.itemHook",
    spriteKey: "weapon.world.duskHook",
    worldScale: 0.38,
    attackProfile: "slash",
    grip: { x: 0.3, y: 0.82 }
  },
  {
    id: "dragonSlayer",
    label: "杀猪屠龙刀",
    rarity: "epic",
    description: "刀比屠夫高，挥一下半个猪圈都安静。",
    attackDamage: 68,
    attackRateMs: 1080,
    range: 132,
    critChanceBonus: 0.08,
    iconKey: "ui.icon.skillSpin",
    spriteKey: "weapon.world.dragonSlayer",
    worldScale: 0.5,
    attackProfile: "heavy",
    grip: { x: 0.24, y: 0.88 }
  },
  {
    id: "hydraulicBoneCrusher",
    label: "液压碎骨钳",
    rarity: "legendary",
    description: "贴脸合拢，骨头和护甲一起算账。",
    attackDamage: 92,
    attackRateMs: 1260,
    range: 106,
    critChanceBonus: 0.18,
    iconKey: "ui.icon.skillTrap",
    spriteKey: "weapon.world.hydraulicBoneCrusher",
    worldScale: 0.44,
    attackProfile: "clamp",
    grip: { x: 0.34, y: 0.84 }
  },
  {
    id: "hundredMeterPigBlade",
    label: "黄昏百米杀猪刀",
    rarity: "legendary",
    description: "刀光先到，刀身稍后。屠宰场装不下它。",
    attackDamage: 128,
    attackRateMs: 1580,
    range: 158,
    critChanceBonus: 0.15,
    iconKey: "ui.icon.skillSpin",
    spriteKey: "weapon.world.hundredMeterPigBlade",
    worldScale: 0.58,
    attackProfile: "heavy",
    grip: { x: 0.18, y: 0.9 }
  }
] as const;

export function getWeaponDefinition(id: string | undefined): WeaponDefinition {
  return weaponCatalog.find((weapon) => weapon.id === id) ?? weaponCatalog[0];
}
```

Update `src/game/scenes/BootScene.ts` so the load map only includes surviving texture ids:

```ts
const weaponTexturePaths: Record<string, string> = {
  rustyCleaver: "assets/sprites/weapons/rusty-cleaver.png",
  saltFrostCleaver: "assets/sprites/weapons/salt-frost-cleaver.png",
  pigBoneChainsaw: "assets/sprites/weapons/pig-bone-chainsaw.png",
  duskHook: "assets/sprites/weapons/dusk-hook.png",
  dragonSlayer: "assets/sprites/weapons/dragon-slayer.png",
  hydraulicBoneCrusher: "assets/sprites/weapons/hydraulic-bone-crusher.png",
  hundredMeterPigBlade: "assets/sprites/weapons/hundred-meter-pig-blade.png"
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/data/weaponCatalog.test.ts tests/data/runStart.test.ts
```

Expected: PASS with both files green.

- [ ] **Step 5: Commit**

```bash
git add src/game/data/weaponCatalog.ts src/game/scenes/BootScene.ts tests/data/weaponCatalog.test.ts tests/data/runStart.test.ts
git commit -m "feat: normalize weapon catalog"
```

### Task 2: Tighten Hand Grip And Attack Motion Presentation

**Files:**
- Modify: `src/game/entities/Player.ts`
- Create: `tests/entities/playerWeaponPresentation.test.ts`
- Modify: `tests/data/weaponCatalog.test.ts`

**Interfaces:**
- Consumes:
  - `Player.equipWeapon(weapon: WeaponDefinition): void`
  - `Player.playAttackAnimation(targetX: number, targetY: number): void`
  - `weaponCatalog: readonly WeaponDefinition[]`
- Produces:
  - Smaller weapon hold offsets during idle and attack
  - Attack-profile-specific motion amplitudes without `shoot` or `flail` special cases
  - A pure helper exported from `src/game/entities/Player.ts` for verifying weapon presentation math

- [ ] **Step 1: Write the failing test**

Create `tests/entities/playerWeaponPresentation.test.ts` to pin the new hold-position math:

```ts
import { describe, expect, it } from "vitest";

import { getWeaponDefinition } from "../../src/game/data/weaponCatalog";
import { getWeaponPresentationSnapshot } from "../../src/game/entities/Player";

describe("player weapon presentation", () => {
  it("keeps idle weapons close to the hand with conservative reach", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("rustyCleaver"),
      playerX: 0,
      playerY: 0,
      flipX: false,
      attackAnimationActive: false,
      weaponAimAngle: Math.PI,
      weaponMotion: { rotation: 0, reach: 0, scale: 1 }
    });

    expect(snapshot.x).toBeLessThanOrEqual(-8);
    expect(snapshot.x).toBeGreaterThanOrEqual(-18);
    expect(snapshot.scale).toBeCloseTo(getWeaponDefinition("rustyCleaver").worldScale, 5);
  });

  it("keeps heavy attacks tighter than the old oversized sweep", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("dragonSlayer"),
      playerX: 100,
      playerY: 80,
      flipX: true,
      attackAnimationActive: true,
      weaponAimAngle: 0,
      weaponMotion: { rotation: 0.45, reach: 14, scale: 1.04 }
    });

    expect(snapshot.x).toBeLessThanOrEqual(126);
    expect(snapshot.x).toBeGreaterThanOrEqual(110);
    expect(snapshot.scale).toBeLessThanOrEqual(0.55);
  });
});
```

Then extend `tests/data/weaponCatalog.test.ts` with one more assertion to keep the whole pool inside the new grip-friendly scale band:

```ts
it("keeps all surviving weapons within the grip-friendly scale band", () => {
  expect(Math.min(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeGreaterThanOrEqual(0.34);
  expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.58);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
```

Expected: FAIL because `getWeaponPresentationSnapshot` does not exist yet and the current presentation math still uses the oversized shared reach/rotation tuning.

- [ ] **Step 3: Write the minimal implementation**

Update `src/game/entities/Player.ts` by extracting a pure presentation helper and tightening motion amplitudes:

```ts
import Phaser from "phaser";

import { playerConfig } from "../data/playerConfig";
import { getWeaponDefinition, type WeaponDefinition } from "../data/weaponCatalog";
import { applyWeaponToProgress } from "../systems/WeaponSystem";
import type { ActiveSkillId, PlayerProgressState } from "../types";
import { shouldFlipPlayerForHorizontalVelocity, shouldStartWalkAnimation } from "./playerAnimationState";

export function getWeaponPresentationSnapshot(input: {
  weapon: WeaponDefinition;
  playerX: number;
  playerY: number;
  flipX: boolean;
  attackAnimationActive: boolean;
  weaponAimAngle: number;
  weaponMotion: { rotation: number; reach: number; scale: number };
}): { x: number; y: number; rotation: number; scale: number; depthOffset: number } {
  const idleAngle = input.flipX ? 0 : Math.PI;
  const angle = input.attackAnimationActive ? input.weaponAimAngle : idleAngle;
  const baseReach = input.weapon.attackProfile === "heavy" ? 14 : input.weapon.attackProfile === "clamp" ? 10 : 12;
  const reach = baseReach + input.weaponMotion.reach;
  const handY = input.attackAnimationActive ? -2 : 4;

  return {
    x: input.playerX + Math.cos(angle) * reach,
    y: input.playerY + handY + Math.sin(angle) * 4,
    rotation: angle + Math.PI / 5 + input.weaponMotion.rotation,
    scale: input.weapon.worldScale * input.weaponMotion.scale,
    depthOffset: Math.sin(angle) >= 0 ? 10 : -2
  };
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly baseScale = 0.5;
  private autoAttackElapsed = 0;
  private readonly cooldowns = new Map<ActiveSkillId, number>();
  private attackAnimationActive = false;
  private walkElapsedMs = 0;
  private readonly weaponSprite: Phaser.GameObjects.Image;
  private weaponAimAngle = Math.PI;
  private weaponMotion = { rotation: 0, reach: 0, scale: 1 };
  currentWeapon: WeaponDefinition = getWeaponDefinition("rustyCleaver");
  progress: PlayerProgressState = {
    attackDamage: getWeaponDefinition("rustyCleaver").attackDamage,
    critChance: playerConfig.critChance,
    moveSpeed: playerConfig.moveSpeed,
    saltRadius: 150,
    trapDurationMs: 3000
  };
  currentHealth = playerConfig.maxHealth;
  maxHealth = playerConfig.maxHealth;

  // existing constructor and lifecycle methods unchanged

  private getAttackAnimationKey(): string {
    if (this.currentWeapon.attackProfile === "clamp") return "player.butcher.clamp";
    return "player.butcher.attack";
  }

  private playWeaponMotion(): void {
    this.scene.tweens.killTweensOf(this.weaponMotion);
    this.weaponMotion.rotation = 0;
    this.weaponMotion.reach = 0;
    this.weaponMotion.scale = 1;

    const profile = this.currentWeapon.attackProfile;
    if (profile === "clamp") {
      this.scene.tweens.add({ targets: this.weaponMotion, reach: 10, scale: 1.06, duration: 170, yoyo: true });
      return;
    }

    const startRotation = profile === "heavy" ? -0.72 : -0.5;
    const endRotation = profile === "heavy" ? 0.42 : 0.62;
    this.weaponMotion.rotation = startRotation;
    this.scene.tweens.add({
      targets: this.weaponMotion,
      rotation: endRotation,
      reach: profile === "heavy" ? 14 : 8,
      duration: profile === "heavy" ? 320 : 180,
      ease: profile === "heavy" ? "Cubic.easeInOut" : "Quad.easeOut"
    });
  }

  private updateWeaponPresentation(): void {
    if (!this.weaponSprite?.active) return;

    const snapshot = getWeaponPresentationSnapshot({
      weapon: this.currentWeapon,
      playerX: this.x,
      playerY: this.y,
      flipX: this.flipX,
      attackAnimationActive: this.attackAnimationActive,
      weaponAimAngle: this.weaponAimAngle,
      weaponMotion: this.weaponMotion
    });

    this.weaponSprite
      .setPosition(snapshot.x, snapshot.y)
      .setRotation(snapshot.rotation)
      .setScale(snapshot.scale)
      .setDepth(this.y + snapshot.depthOffset);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
```

Expected: PASS with both files green.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: PASS for all tests and a successful production build.

- [ ] **Step 6: Commit**

```bash
git add src/game/entities/Player.ts tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
git commit -m "fix: normalize weapon presentation"
```
