# Weapon Hold Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared weapon-centering logic with three weapon hold templates so all seven remaining weapons read as being held in the butcher's hand during idle, movement, and attacks.

**Architecture:** Keep the existing player and weapon catalog flow, but move hold behavior into a dedicated template catalog plus lightweight per-weapon overrides. The player presentation layer should resolve a weapon's template, compute a hand anchor for idle/move/attack states, and then apply only minimal per-weapon fine-tuning on top.

**Tech Stack:** TypeScript, Phaser 3, Vitest, Vite

## Global Constraints

- Make the butcher visibly hold weapons during idle, walk, and attack.
- Cover the current seven remaining weapons with exactly three hold templates: light blade, heavy blade, and hook/clamp.
- Keep limited per-weapon fine-tuning, but do not rely on one-off hardcoded placement as the primary solution.
- Make left/right facing, attack origin, and weapon orientation feel intuitive.
- Do not draw fully separate character animation sets per weapon.
- Do not reintroduce deleted flail/gun weapons, rework combat hit logic, or change map/HUD/enemy systems.

---

### Task 1: Add Hold Template Data And Resolution

**Files:**
- Create: `src/game/data/weaponHoldTemplates.ts`
- Modify: `src/game/data/weaponCatalog.ts`
- Create: `tests/data/weaponHoldTemplates.test.ts`

**Interfaces:**
- Consumes:
  - `weaponCatalog: readonly WeaponDefinition[]`
- Produces:
  - `type WeaponHoldTemplateId = "lightBlade" | "heavyBlade" | "hookClamp"`
  - `type WeaponHoldTemplate`
  - `getWeaponHoldTemplate(id: WeaponHoldTemplateId): WeaponHoldTemplate`
  - `getWeaponHoldOverride(weaponId: string): WeaponHoldOverride`

- [ ] **Step 1: Write the failing test**

Create `tests/data/weaponHoldTemplates.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { weaponCatalog } from "../../src/game/data/weaponCatalog";
import { getWeaponHoldOverride, getWeaponHoldTemplate } from "../../src/game/data/weaponHoldTemplates";

describe("weapon hold templates", () => {
  it("assigns every remaining weapon to one of the three hold templates", () => {
    const templateIds = weaponCatalog.map((weapon) => getWeaponHoldOverride(weapon.id).templateId);
    expect(templateIds).toEqual([
      "lightBlade",
      "lightBlade",
      "lightBlade",
      "hookClamp",
      "heavyBlade",
      "hookClamp",
      "heavyBlade"
    ]);
  });

  it("defines the expected stateful offsets for all templates", () => {
    const light = getWeaponHoldTemplate("lightBlade");
    const heavy = getWeaponHoldTemplate("heavyBlade");
    const hook = getWeaponHoldTemplate("hookClamp");

    expect(light.idleHandOffset.x).toBeGreaterThan(0);
    expect(heavy.attackReach).toBeGreaterThan(light.attackReach);
    expect(hook.attackEndRotation).toBeLessThan(heavy.attackEndRotation);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/data/weaponHoldTemplates.test.ts
```

Expected: FAIL because `src/game/data/weaponHoldTemplates.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/game/data/weaponHoldTemplates.ts`:

```ts
export type WeaponHoldTemplateId = "lightBlade" | "heavyBlade" | "hookClamp";

export type HoldOffset = { x: number; y: number };

export type WeaponHoldTemplate = {
  id: WeaponHoldTemplateId;
  idleHandOffset: HoldOffset;
  moveHandOffset: HoldOffset;
  attackHandOffset: HoldOffset;
  idleRotation: number;
  attackStartRotation: number;
  attackEndRotation: number;
  idleReach: number;
  attackReach: number;
  depthBias: number;
};

export type WeaponHoldOverride = {
  templateId: WeaponHoldTemplateId;
  fineTune: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  };
};

const templateCatalog: Record<WeaponHoldTemplateId, WeaponHoldTemplate> = {
  lightBlade: {
    id: "lightBlade",
    idleHandOffset: { x: 18, y: -3 },
    moveHandOffset: { x: 20, y: -1 },
    attackHandOffset: { x: 16, y: -5 },
    idleRotation: -0.25,
    attackStartRotation: -0.72,
    attackEndRotation: 0.48,
    idleReach: 8,
    attackReach: 16,
    depthBias: 10
  },
  heavyBlade: {
    id: "heavyBlade",
    idleHandOffset: { x: 12, y: 0 },
    moveHandOffset: { x: 14, y: 1 },
    attackHandOffset: { x: 10, y: -4 },
    idleRotation: -0.42,
    attackStartRotation: -0.92,
    attackEndRotation: 0.18,
    idleReach: 10,
    attackReach: 20,
    depthBias: 10
  },
  hookClamp: {
    id: "hookClamp",
    idleHandOffset: { x: 17, y: -2 },
    moveHandOffset: { x: 18, y: 0 },
    attackHandOffset: { x: 15, y: -4 },
    idleRotation: -0.1,
    attackStartRotation: -0.48,
    attackEndRotation: -0.08,
    idleReach: 7,
    attackReach: 14,
    depthBias: 10
  }
};

const holdOverrides: Record<string, WeaponHoldOverride> = {
  rustyCleaver: { templateId: "lightBlade", fineTune: { x: 0, y: 0, rotation: 0, scale: 1 } },
  saltFrostCleaver: { templateId: "lightBlade", fineTune: { x: 1, y: 0, rotation: 0.02, scale: 1 } },
  pigBoneChainsaw: { templateId: "lightBlade", fineTune: { x: 1, y: 1, rotation: 0.08, scale: 1.02 } },
  duskHook: { templateId: "hookClamp", fineTune: { x: -1, y: 0, rotation: -0.06, scale: 1 } },
  dragonSlayer: { templateId: "heavyBlade", fineTune: { x: 0, y: 1, rotation: -0.08, scale: 1 } },
  hydraulicBoneCrusher: { templateId: "hookClamp", fineTune: { x: 1, y: 1, rotation: 0.04, scale: 1 } },
  hundredMeterPigBlade: { templateId: "heavyBlade", fineTune: { x: 2, y: 0, rotation: -0.04, scale: 1 } }
};

export function getWeaponHoldTemplate(id: WeaponHoldTemplateId): WeaponHoldTemplate {
  return templateCatalog[id];
}

export function getWeaponHoldOverride(weaponId: string): WeaponHoldOverride {
  return holdOverrides[weaponId] ?? holdOverrides.rustyCleaver;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/data/weaponHoldTemplates.test.ts
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/game/data/weaponHoldTemplates.ts tests/data/weaponHoldTemplates.test.ts
git commit -m "feat: add weapon hold templates"
```

### Task 2: Rebuild Weapon Presentation Around Template States

**Files:**
- Modify: `src/game/entities/playerWeaponPresentation.ts`
- Modify: `src/game/entities/Player.ts`
- Modify: `tests/entities/playerWeaponPresentation.test.ts`

**Interfaces:**
- Consumes:
  - `getWeaponHoldTemplate(id: WeaponHoldTemplateId): WeaponHoldTemplate`
  - `getWeaponHoldOverride(weaponId: string): WeaponHoldOverride`
- Produces:
  - `getWeaponPresentationSnapshot(...)`
  - `getWeaponMotionPreset(...)`
  - player presentation driven by `idle`, `move`, and `attack` template states

- [ ] **Step 1: Write the failing tests**

Update `tests/entities/playerWeaponPresentation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getWeaponDefinition } from "../../src/game/data/weaponCatalog";
import { getWeaponMotionPreset, getWeaponPresentationSnapshot } from "../../src/game/entities/playerWeaponPresentation";

describe("player weapon presentation", () => {
  it("keeps light blades on the visible hand during idle", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("rustyCleaver"),
      playerX: 0,
      playerY: 0,
      facingRight: false,
      state: "idle",
      weaponMotion: getWeaponMotionPreset("idle", getWeaponDefinition("rustyCleaver"))
    });

    expect(snapshot.x).toBe(26);
    expect(snapshot.y).toBeCloseTo(5, 5);
  });

  it("pushes heavy blade attacks forward from the hand anchor, not the body center", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("dragonSlayer"),
      playerX: 100,
      playerY: 80,
      facingRight: true,
      state: "attack",
      weaponMotion: getWeaponMotionPreset("attack", getWeaponDefinition("dragonSlayer"))
    });

    expect(snapshot.x).toBeGreaterThanOrEqual(72);
    expect(snapshot.x).toBeLessThanOrEqual(90);
  });

  it("keeps hook/clamp weapons near the body front instead of swinging wide", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("hydraulicBoneCrusher"),
      playerX: 0,
      playerY: 0,
      facingRight: false,
      state: "idle",
      weaponMotion: getWeaponMotionPreset("idle", getWeaponDefinition("hydraulicBoneCrusher"))
    });

    expect(snapshot.x).toBeGreaterThan(18);
    expect(snapshot.rotation).toBeLessThan(0.2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts
```

Expected: FAIL because `playerWeaponPresentation.ts` still uses the older `flipX` + generic reach math and does not expose `getWeaponMotionPreset`.

- [ ] **Step 3: Write minimal implementation**

Update `src/game/entities/playerWeaponPresentation.ts`:

```ts
import type { WeaponDefinition } from "../data/weaponCatalog";
import { getWeaponHoldOverride, getWeaponHoldTemplate } from "../data/weaponHoldTemplates";

export type WeaponMotionState = {
  rotation: number;
  reach: number;
  scale: number;
};

export type WeaponVisualState = "idle" | "move" | "attack";

export function getWeaponMotionPreset(state: WeaponVisualState, weapon: WeaponDefinition): WeaponMotionState {
  const override = getWeaponHoldOverride(weapon.id);
  const template = getWeaponHoldTemplate(override.templateId);

  if (state === "attack") {
    return {
      rotation: template.attackEndRotation + override.fineTune.rotation,
      reach: template.attackReach + override.fineTune.x,
      scale: override.fineTune.scale
    };
  }

  return {
    rotation: template.idleRotation + override.fineTune.rotation,
    reach: template.idleReach + override.fineTune.x,
    scale: override.fineTune.scale
  };
}

export function getWeaponPresentationSnapshot(input: {
  weapon: WeaponDefinition;
  playerX: number;
  playerY: number;
  facingRight: boolean;
  state: WeaponVisualState;
  weaponMotion: WeaponMotionState;
}): { x: number; y: number; rotation: number; scale: number; depthOffset: number } {
  const override = getWeaponHoldOverride(input.weapon.id);
  const template = getWeaponHoldTemplate(override.templateId);
  const handOffset =
    input.state === "attack"
      ? template.attackHandOffset
      : input.state === "move"
        ? template.moveHandOffset
        : template.idleHandOffset;
  const direction = input.facingRight ? -1 : 1;
  const rotationBase =
    input.state === "attack"
      ? template.attackEndRotation
      : template.idleRotation;

  return {
    x: input.playerX + handOffset.x * direction + input.weaponMotion.reach * direction,
    y: input.playerY + handOffset.y + override.fineTune.y,
    rotation: rotationBase * direction + override.fineTune.rotation,
    scale: input.weapon.worldScale * input.weaponMotion.scale,
    depthOffset: template.depthBias
  };
}
```

Update `src/game/entities/Player.ts` to resolve `facingRight` and visual state when rendering:

```ts
import { getWeaponMotionPreset, getWeaponPresentationSnapshot, type WeaponVisualState } from "./playerWeaponPresentation";

// ...

  private getWeaponVisualState(): WeaponVisualState {
    if (this.attackAnimationActive) return "attack";
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isMoving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 0;
    return isMoving ? "move" : "idle";
  }

  private updateWeaponPresentation(): void {
    if (!this.weaponSprite?.active) return;

    const state = this.getWeaponVisualState();
    const snapshot = getWeaponPresentationSnapshot({
      weapon: this.currentWeapon,
      playerX: this.x,
      playerY: this.y,
      facingRight: this.flipX,
      state,
      weaponMotion: state === "attack" ? this.weaponMotion : getWeaponMotionPreset(state, this.currentWeapon)
    });

    this.weaponSprite
      .setPosition(snapshot.x, snapshot.y)
      .setRotation(snapshot.rotation)
      .setScale(snapshot.scale)
      .setDepth(this.y + snapshot.depthOffset);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts
```

Expected: PASS with 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/playerWeaponPresentation.ts src/game/entities/Player.ts tests/entities/playerWeaponPresentation.test.ts
git commit -m "fix: drive weapon holds from templates"
```

### Task 3: Retune Attack Motion To Match Template Categories

**Files:**
- Modify: `src/game/entities/Player.ts`
- Modify: `tests/entities/playerWeaponPresentation.test.ts`
- Modify: `tests/data/weaponCatalog.test.ts`

**Interfaces:**
- Consumes:
  - `WeaponHoldTemplate.attackStartRotation`
  - `WeaponHoldTemplate.attackEndRotation`
  - `WeaponHoldTemplate.attackReach`
- Produces:
  - `playWeaponMotion()` aligned with light/heavy/hookClamp classes
  - stable tests for light/heavy/hook attack envelopes

- [ ] **Step 1: Write the failing tests**

Extend `tests/entities/playerWeaponPresentation.test.ts`:

```ts
it("keeps hook clamp attack motion compact", () => {
  const motion = getWeaponMotionPreset("attack", getWeaponDefinition("hydraulicBoneCrusher"));
  expect(motion.reach).toBeLessThanOrEqual(15);
});

it("gives heavy blade attacks more forward reach than light blades", () => {
  const light = getWeaponMotionPreset("attack", getWeaponDefinition("rustyCleaver"));
  const heavy = getWeaponMotionPreset("attack", getWeaponDefinition("dragonSlayer"));
  expect(heavy.reach).toBeGreaterThan(light.reach);
});
```

Add one catalog assertion in `tests/data/weaponCatalog.test.ts`:

```ts
it("keeps all surviving weapons in the normalized hold-scale band", () => {
  expect(Math.max(...weaponCatalog.map((weapon) => weapon.worldScale))).toBeLessThanOrEqual(0.58);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
```

Expected: FAIL until attack motion presets and the live player tween logic align with template values.

- [ ] **Step 3: Write minimal implementation**

Update `src/game/entities/Player.ts` so `playWeaponMotion()` uses resolved template classes:

```ts
import { getWeaponHoldOverride, getWeaponHoldTemplate } from "../data/weaponHoldTemplates";

// ...

  private playWeaponMotion(): void {
    this.scene.tweens.killTweensOf(this.weaponMotion);
    this.weaponMotion.rotation = 0;
    this.weaponMotion.reach = 0;
    this.weaponMotion.scale = 1;

    const hold = getWeaponHoldTemplate(getWeaponHoldOverride(this.currentWeapon.id).templateId);
    this.weaponMotion.rotation = hold.attackStartRotation;

    this.scene.tweens.add({
      targets: this.weaponMotion,
      rotation: hold.attackEndRotation,
      reach: hold.attackReach,
      duration: hold.id === "heavyBlade" ? 320 : hold.id === "hookClamp" ? 190 : 170,
      ease: hold.id === "heavyBlade" ? "Cubic.easeInOut" : "Quad.easeOut"
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
```

Expected: PASS with all focused tests green.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: PASS for the full suite and a successful build.

- [ ] **Step 6: Commit**

```bash
git add src/game/entities/Player.ts tests/entities/playerWeaponPresentation.test.ts tests/data/weaponCatalog.test.ts
git commit -m "fix: align attack motion with hold templates"
```
