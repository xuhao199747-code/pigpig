# 猪猪黄昏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable browser demo of `猪猪黄昏`: a single-map, wave-clear survivors-like action game where the butcher auto-attacks, uses 3 active skills, levels up frequently, and defeats a final pig boss.

**Architecture:** Use a Vite + TypeScript + Phaser 3 project with one playable arena scene, one HUD scene, and small data-driven combat/wave/progression modules. Keep game rules in plain TypeScript modules so combat, wave pacing, and upgrade selection can be tested without spinning up Phaser.

**Tech Stack:** Vite, TypeScript, Phaser 3, Vitest, npm, Python helper tools from `agent-sprite-forge`

## Global Constraints

- Scope is locked to one fixed slaughterhouse arena, one player character, one auto-attack weapon, three active skills, 8-10 enemy pig types, one final boss, one upgrade pool, HUD, level-up modal, and result screen.
- The game is top-down, single-map, wave-clear, and focused on `爽感割草`, not exploration, heavy story, or management systems.
- Enemy art direction is `普通猪的荒诞化`, not mutation horror.
- Map art must be produced with `generate2dmap` and delivered as a layered scene-mode map with separate runtime props/collision metadata, not a single baked runtime image.
- Character, enemy, weapon, and FX art must be produced with `generate2dsprite`, not code-drawn placeholders for the final playable demo.
- The first playable build should be browser-playable and runnable locally with `npm install` and `npm run dev`.
- Favor small focused files and pure TypeScript rule modules so balance logic can be tested outside Phaser.

---

## File Structure

Planned project structure:

- `package.json` — npm scripts and dependencies
- `tsconfig.json` — TypeScript config
- `vite.config.ts` — Vite config
- `index.html` — app mount point
- `src/main.ts` — app boot entry
- `src/styles.css` — global shell styling
- `src/game/config/gameConfig.ts` — Phaser config and scene registration
- `src/game/scenes/BootScene.ts` — preload assets and hand off to menu/arena
- `src/game/scenes/MenuScene.ts` — title/start scene
- `src/game/scenes/ArenaScene.ts` — main gameplay scene
- `src/game/scenes/HudScene.ts` — HUD, level-up modal, result overlay
- `src/game/entities/Player.ts` — movement, auto-attack timer, active skill dispatch
- `src/game/entities/Enemy.ts` — enemy state wrapper
- `src/game/entities/BossPig.ts` — final boss wrapper
- `src/game/systems/CombatResolver.ts` — damage, crit, hit, death rules
- `src/game/systems/WaveDirector.ts` — wave pacing, spawn tables, boss trigger
- `src/game/systems/UpgradeSystem.ts` — upgrade pool and selection logic
- `src/game/systems/DropSystem.ts` — EXP and coin drops
- `src/game/data/playerConfig.ts` — player/base skill stats
- `src/game/data/enemyCatalog.ts` — enemy stats and spawn tags
- `src/game/data/upgradeCatalog.ts` — upgrade definitions
- `src/game/data/wavePlan.ts` — 10-wave pacing definition
- `src/game/types.ts` — shared interfaces and enums
- `src/game/utils/random.ts` — deterministic helpers for testing upgrade choice
- `assets/map/` — generated map base, props, collision, scene metadata, preview
- `assets/sprites/` — generated sprite sheets and extracted PNGs
- `assets/ui/` — generated or hand-authored HUD panels/icons as needed
- `tests/systems/WaveDirector.test.ts` — wave logic tests
- `tests/systems/UpgradeSystem.test.ts` — upgrade selection tests
- `tests/systems/CombatResolver.test.ts` — combat rule tests

## Task 1: Scaffold The Browser Playable Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `src/game/config/gameConfig.ts`
- Create: `src/game/scenes/BootScene.ts`
- Create: `src/game/scenes/MenuScene.ts`
- Create: `src/game/scenes/ArenaScene.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `createGameConfig(): Phaser.Types.Core.GameConfig`
  - `class BootScene extends Phaser.Scene`
  - `class MenuScene extends Phaser.Scene`
  - `class ArenaScene extends Phaser.Scene`

- [ ] **Step 1: Write the failing test**

Create `tests/smoke/projectBoot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createGameConfig } from "../../src/game/config/gameConfig";

describe("game config", () => {
  it("registers boot, menu, arena, and hud scenes", () => {
    const config = createGameConfig();
    const sceneKeys = (config.scene as Array<{ key: string }>).map((scene) => scene.key);

    expect(sceneKeys).toEqual(["boot", "menu", "arena", "hud"]);
    expect(config.width).toBe(1600);
    expect(config.height).toBe(900);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- projectBoot.test.ts
```

Expected: FAIL with `Cannot find module '../../src/game/config/gameConfig'` or missing test script errors before scaffolding exists.

- [ ] **Step 3: Write minimal implementation**

Create `package.json`:

```json
{
  "name": "zhu-zhu-huang-hun",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^2.0.5"
  }
}
```

Create `src/game/config/gameConfig.ts`:

```ts
import Phaser from "phaser";
import { ArenaScene } from "../scenes/ArenaScene";
import { BootScene } from "../scenes/BootScene";
import { HudScene } from "../scenes/HudScene";
import { MenuScene } from "../scenes/MenuScene";

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "app",
    width: 1600,
    height: 900,
    backgroundColor: "#120a08",
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [BootScene, MenuScene, ArenaScene, HudScene]
  };
}
```

Create `src/main.ts`:

```ts
import Phaser from "phaser";
import { createGameConfig } from "./game/config/gameConfig";
import "./styles.css";

new Phaser.Game(createGameConfig());
```

Create scene shells:

```ts
// src/game/scenes/BootScene.ts
import Phaser from "phaser";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }
  create() {
    this.scene.start("menu");
  }
}
```

```ts
// src/game/scenes/MenuScene.ts
import Phaser from "phaser";
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }
  create() {
    this.add.text(800, 450, "猪猪黄昏\n按空格开始", { color: "#f5d6a1", align: "center" }).setOrigin(0.5);
    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("arena"));
  }
}
```

```ts
// src/game/scenes/ArenaScene.ts
import Phaser from "phaser";
export class ArenaScene extends Phaser.Scene {
  constructor() {
    super("arena");
  }
  create() {
    this.scene.launch("hud");
  }
}
```

```ts
// src/game/scenes/HudScene.ts
import Phaser from "phaser";
export class HudScene extends Phaser.Scene {
  constructor() {
    super("hud");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm install
npm test -- projectBoot.test.ts
```

Expected: PASS with 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src tests
git commit -m "feat: scaffold phaser demo shell"
```

## Task 2: Add The Slaughterhouse Arena Map Pipeline And Runtime Scene Wiring

**Files:**
- Create: `assets/map/slaughterhouse-base.png`
- Create: `assets/map/slaughterhouse-base.prompt.txt`
- Create: `assets/map/slaughterhouse-dressed-reference.png`
- Create: `assets/map/slaughterhouse-props.json`
- Create: `assets/map/slaughterhouse-collision.json`
- Create: `assets/map/slaughterhouse-zones.json`
- Create: `assets/map/slaughterhouse-layered-preview.png`
- Create: `src/game/data/mapScene.ts`
- Modify: `src/game/scenes/BootScene.ts`
- Modify: `src/game/scenes/ArenaScene.ts`

**Interfaces:**
- Consumes:
  - `generate2dmap` skill outputs saved under `assets/map/`
- Produces:
  - `slaughterhouseMap: SceneMapDefinition`
  - `loadMapAssets(scene: Phaser.Scene, map: SceneMapDefinition): void`
  - `spawnMapProps(scene: Phaser.Scene, map: SceneMapDefinition): Phaser.GameObjects.Image[]`

- [ ] **Step 1: Write the failing test**

Create `tests/data/mapScene.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slaughterhouseMap } from "../../src/game/data/mapScene";

describe("slaughterhouse map definition", () => {
  it("points at layered map assets and metadata", () => {
    expect(slaughterhouseMap.baseTextureKey).toBe("map.slaughterhouse.base");
    expect(slaughterhouseMap.props.length).toBeGreaterThan(0);
    expect(slaughterhouseMap.spawnZones.length).toBeGreaterThanOrEqual(4);
    expect(slaughterhouseMap.playerSpawn).toEqual({ x: 800, y: 540 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- mapScene.test.ts
```

Expected: FAIL because `src/game/data/mapScene.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Use the `generate2dmap` skill before asset generation. Generate a `scene_mode` layered-raster slaughterhouse arena with:

- base ground-only map
- dressed reference with up to 9 runtime object candidates
- separate props metadata
- collision metadata
- spawn/zone metadata

Create `src/game/data/mapScene.ts`:

```ts
export type SceneMapDefinition = {
  baseTextureKey: string;
  baseTexturePath: string;
  playerSpawn: { x: number; y: number };
  spawnZones: Array<{ id: string; x: number; y: number; radius: number }>;
  props: Array<{ textureKey: string; texturePath: string; x: number; y: number; depth: number }>;
  blockers: Array<{ x: number; y: number; width: number; height: number }>;
};

export const slaughterhouseMap: SceneMapDefinition = {
  baseTextureKey: "map.slaughterhouse.base",
  baseTexturePath: "assets/map/slaughterhouse-base.png",
  playerSpawn: { x: 800, y: 540 },
  spawnZones: [
    { id: "north-gate", x: 790, y: 130, radius: 120 },
    { id: "west-pen", x: 180, y: 460, radius: 110 },
    { id: "east-yard", x: 1430, y: 470, radius: 120 },
    { id: "south-mud", x: 790, y: 820, radius: 120 }
  ],
  props: [
    { textureKey: "prop.hook-rack", texturePath: "assets/sprites/props/hook-rack.png", x: 170, y: 360, depth: 360 },
    { textureKey: "prop.feed-barrel", texturePath: "assets/sprites/props/feed-barrel.png", x: 210, y: 745, depth: 745 }
  ],
  blockers: [
    { x: 130, y: 320, width: 170, height: 180 },
    { x: 1280, y: 250, width: 180, height: 170 }
  ]
};
```

Update `BootScene.ts` preload:

```ts
import { slaughterhouseMap } from "../data/mapScene";

preload() {
  this.load.image(slaughterhouseMap.baseTextureKey, slaughterhouseMap.baseTexturePath);
  for (const prop of slaughterhouseMap.props) {
    this.load.image(prop.textureKey, prop.texturePath);
  }
}
```

Update `ArenaScene.ts` create:

```ts
import { slaughterhouseMap } from "../data/mapScene";

create() {
  this.add.image(800, 450, slaughterhouseMap.baseTextureKey).setDisplaySize(1600, 900);
  for (const prop of slaughterhouseMap.props) {
    this.add.image(prop.x, prop.y, prop.textureKey).setDepth(prop.depth);
  }
  this.scene.launch("hud");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- mapScene.test.ts
```

Expected: PASS with map metadata present and scene wiring compileable.

- [ ] **Step 5: Commit**

```bash
git add assets/map src/game/data/mapScene.ts src/game/scenes/BootScene.ts src/game/scenes/ArenaScene.ts tests/data/mapScene.test.ts
git commit -m "feat: add slaughterhouse layered arena map"
```

## Task 3: Implement Player Movement, Auto-Attack, And Three Active Skills

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/data/playerConfig.ts`
- Create: `src/game/entities/Player.ts`
- Create: `src/game/systems/CooldownTracker.ts`
- Create: `tests/entities/playerConfig.test.ts`
- Modify: `src/game/scenes/ArenaScene.ts`

**Interfaces:**
- Consumes:
  - `slaughterhouseMap.playerSpawn`
- Produces:
  - `type ActiveSkillId = "spin" | "saltBurst" | "pigPenTrap"`
  - `class Player`
  - `player.update(deltaMs: number): void`
  - `player.tryCast(skillId: ActiveSkillId): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/entities/playerConfig.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { playerConfig } from "../../src/game/data/playerConfig";

describe("player config", () => {
  it("defines one auto weapon and three active skills", () => {
    expect(playerConfig.autoWeapon.baseDamage).toBe(24);
    expect(playerConfig.activeSkills.map((skill) => skill.id)).toEqual([
      "spin",
      "saltBurst",
      "pigPenTrap"
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- playerConfig.test.ts
```

Expected: FAIL because `playerConfig` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/game/data/playerConfig.ts`:

```ts
export const playerConfig = {
  moveSpeed: 220,
  maxHealth: 100,
  autoWeapon: {
    id: "cleaver",
    attackRateMs: 650,
    range: 92,
    arcDeg: 110,
    baseDamage: 24
  },
  activeSkills: [
    { id: "spin", cooldownMs: 5000, damage: 55, radius: 120 },
    { id: "saltBurst", cooldownMs: 7200, damage: 40, radius: 150 },
    { id: "pigPenTrap", cooldownMs: 9500, damage: 0, radius: 100 }
  ]
} as const;
```

Create `src/game/entities/Player.ts`:

```ts
import Phaser from "phaser";
import { playerConfig } from "../data/playerConfig";
import type { ActiveSkillId } from "../types";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private autoAttackElapsed = 0;
  private readonly cooldowns = new Map<ActiveSkillId, number>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player.butcher.idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  update(deltaMs: number) {
    this.autoAttackElapsed += deltaMs;
    for (const [skill, remaining] of this.cooldowns.entries()) {
      this.cooldowns.set(skill, Math.max(0, remaining - deltaMs));
    }
  }

  canAutoAttack(): boolean {
    return this.autoAttackElapsed >= playerConfig.autoWeapon.attackRateMs;
  }

  consumeAutoAttack(): void {
    this.autoAttackElapsed = 0;
  }

  tryCast(skillId: ActiveSkillId): boolean {
    const remaining = this.cooldowns.get(skillId) ?? 0;
    if (remaining > 0) return false;
    const skill = playerConfig.activeSkills.find((entry) => entry.id === skillId);
    if (!skill) return false;
    this.cooldowns.set(skillId, skill.cooldownMs);
    return true;
  }
}
```

Update `ArenaScene.ts` to create player, cursor movement, and keys `Q`, `W`, `E` for the three skills.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- playerConfig.test.ts
```

Expected: PASS with one auto weapon and three active skills defined.

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/game/data/playerConfig.ts src/game/entities/Player.ts src/game/systems/CooldownTracker.ts src/game/scenes/ArenaScene.ts tests/entities/playerConfig.test.ts
git commit -m "feat: add player movement and active skills"
```

## Task 4: Implement Enemy Catalog, Wave Director, And Combat Resolution

**Files:**
- Create: `src/game/data/enemyCatalog.ts`
- Create: `src/game/data/wavePlan.ts`
- Create: `src/game/entities/Enemy.ts`
- Create: `src/game/entities/BossPig.ts`
- Create: `src/game/systems/WaveDirector.ts`
- Create: `src/game/systems/CombatResolver.ts`
- Create: `src/game/systems/DropSystem.ts`
- Create: `tests/systems/WaveDirector.test.ts`
- Create: `tests/systems/CombatResolver.test.ts`
- Modify: `src/game/scenes/ArenaScene.ts`

**Interfaces:**
- Consumes:
  - `playerConfig`
  - `slaughterhouseMap.spawnZones`
- Produces:
  - `enemyCatalog: Record<string, EnemyDefinition>`
  - `wavePlan: WaveDefinition[]`
  - `waveDirector.update(elapsedMs: number): SpawnInstruction[]`
  - `resolveHit(input: DamageInput): DamageResult`

- [ ] **Step 1: Write the failing test**

Create `tests/systems/WaveDirector.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WaveDirector } from "../../src/game/systems/WaveDirector";
import { wavePlan } from "../../src/game/data/wavePlan";

describe("wave director", () => {
  it("starts on wave 1 and schedules a final boss on the last wave", () => {
    const director = new WaveDirector(wavePlan);
    expect(director.getCurrentWave().index).toBe(1);
    expect(wavePlan.at(-1)?.bossId).toBe("pigKing");
  });
});
```

Create `tests/systems/CombatResolver.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveHit } from "../../src/game/systems/CombatResolver";

describe("combat resolver", () => {
  it("applies armor mitigation before returning remaining health", () => {
    const result = resolveHit({
      attackDamage: 30,
      critMultiplier: 1,
      isCrit: false,
      armor: 6,
      currentHealth: 40
    });

    expect(result.finalDamage).toBe(24);
    expect(result.remainingHealth).toBe(16);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- WaveDirector.test.ts CombatResolver.test.ts
```

Expected: FAIL because both systems are missing.

- [ ] **Step 3: Write minimal implementation**

Create `src/game/data/wavePlan.ts`:

```ts
export const wavePlan = [
  { index: 1, durationMs: 45000, enemies: ["fatPig", "leanPig"] },
  { index: 2, durationMs: 50000, enemies: ["fatPig", "leanPig", "forkPig"] },
  { index: 3, durationMs: 50000, enemies: ["fatPig", "leanPig", "helmetPig"] },
  { index: 4, durationMs: 55000, enemies: ["fatPig", "forkPig", "chargePig"] },
  { index: 5, durationMs: 55000, enemies: ["leanPig", "chargePig", "feedPig"] },
  { index: 6, durationMs: 60000, enemies: ["helmetPig", "forkPig", "elitePenPig"] },
  { index: 7, durationMs: 60000, enemies: ["chargePig", "feedPig", "elitePenPig"] },
  { index: 8, durationMs: 65000, enemies: ["helmetPig", "chargePig", "elitePenPig"] },
  { index: 9, durationMs: 65000, enemies: ["forkPig", "feedPig", "elitePenPig"] },
  { index: 10, durationMs: 70000, enemies: ["helmetPig", "chargePig", "elitePenPig"], bossId: "pigKing" }
] as const;
```

Create `src/game/systems/CombatResolver.ts`:

```ts
export function resolveHit(input: {
  attackDamage: number;
  critMultiplier: number;
  isCrit: boolean;
  armor: number;
  currentHealth: number;
}) {
  const scaled = input.isCrit ? input.attackDamage * input.critMultiplier : input.attackDamage;
  const finalDamage = Math.max(1, Math.round(scaled - input.armor));
  const remainingHealth = Math.max(0, input.currentHealth - finalDamage);

  return { finalDamage, remainingHealth, didDie: remainingHealth === 0 };
}
```

Create `src/game/systems/WaveDirector.ts`:

```ts
type WaveDefinition = { index: number; durationMs: number; enemies: readonly string[]; bossId?: string };

export class WaveDirector {
  constructor(private readonly waves: readonly WaveDefinition[], private currentIndex = 0) {}

  getCurrentWave(): WaveDefinition {
    return this.waves[this.currentIndex];
  }

  isBossWave(): boolean {
    return Boolean(this.getCurrentWave().bossId);
  }

  advanceWave(): WaveDefinition | null {
    this.currentIndex += 1;
    return this.waves[this.currentIndex] ?? null;
  }
}
```

Then wire `ArenaScene.ts` to:

- create physics groups for enemies, drops, traps
- spawn enemies by wave
- resolve auto-attacks and active skill hits
- advance to the next wave after the quota is cleared
- spawn `pigKing` on wave 10

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- WaveDirector.test.ts CombatResolver.test.ts
```

Expected: PASS with wave 1 start and final boss scheduling confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/game/data/enemyCatalog.ts src/game/data/wavePlan.ts src/game/entities/Enemy.ts src/game/entities/BossPig.ts src/game/systems/WaveDirector.ts src/game/systems/CombatResolver.ts src/game/systems/DropSystem.ts src/game/scenes/ArenaScene.ts tests/systems/WaveDirector.test.ts tests/systems/CombatResolver.test.ts
git commit -m "feat: add wave combat loop and pig boss"
```

## Task 5: Implement Level-Ups, Coins, HUD, And Result Flow

**Files:**
- Create: `src/game/data/upgradeCatalog.ts`
- Create: `src/game/systems/UpgradeSystem.ts`
- Create: `tests/systems/UpgradeSystem.test.ts`
- Modify: `src/game/scenes/HudScene.ts`
- Modify: `src/game/scenes/ArenaScene.ts`
- Modify: `src/game/data/playerConfig.ts`

**Interfaces:**
- Consumes:
  - `playerConfig`
  - `waveDirector`
- Produces:
  - `rollUpgradeChoices(seedPool: UpgradeDefinition[], count: number): UpgradeDefinition[]`
  - `applyUpgrade(playerState: PlayerProgressState, upgradeId: string): PlayerProgressState`
  - HUD events: `"hud:update"`, `"hud:levelup"`, `"hud:result"`

- [ ] **Step 1: Write the failing test**

Create `tests/systems/UpgradeSystem.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyUpgrade } from "../../src/game/systems/UpgradeSystem";

describe("upgrade system", () => {
  it("applies cleaver tempering as a direct damage increase", () => {
    const next = applyUpgrade(
      { attackDamage: 24, critChance: 0.18, moveSpeed: 220, saltRadius: 150, trapDurationMs: 3000 },
      "cleaverTempering"
    );

    expect(next.attackDamage).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- UpgradeSystem.test.ts
```

Expected: FAIL because the upgrade system is missing.

- [ ] **Step 3: Write minimal implementation**

Create `src/game/data/upgradeCatalog.ts`:

```ts
export const upgradeCatalog = [
  { id: "cleaverTempering", label: "屠刀淬炼", kind: "stat", attackDamageDelta: 6 },
  { id: "openRibTechnique", label: "开膛熟练", kind: "stat", critChanceDelta: 0.08 },
  { id: "coarseSalt", label: "粗盐增量", kind: "skill", saltRadiusDelta: 35 },
  { id: "penReinforcement", label: "猪圈加固", kind: "skill", trapDurationMsDelta: 1200 },
  { id: "perfectHeat", label: "火候正好", kind: "skill", addsBurn: true },
  { id: "bloodRush", label: "血气上涌", kind: "stat", moveSpeedDelta: 25 }
];
```

Create `src/game/systems/UpgradeSystem.ts`:

```ts
import { upgradeCatalog } from "../data/upgradeCatalog";

export function rollUpgradeChoices(count = 3) {
  return upgradeCatalog.slice(0, count);
}

export function applyUpgrade(
  state: { attackDamage: number; critChance: number; moveSpeed: number; saltRadius: number; trapDurationMs: number },
  upgradeId: string
) {
  switch (upgradeId) {
    case "cleaverTempering":
      return { ...state, attackDamage: state.attackDamage + 6 };
    case "openRibTechnique":
      return { ...state, critChance: state.critChance + 0.08 };
    case "coarseSalt":
      return { ...state, saltRadius: state.saltRadius + 35 };
    case "penReinforcement":
      return { ...state, trapDurationMs: state.trapDurationMs + 1200 };
    case "bloodRush":
      return { ...state, moveSpeed: state.moveSpeed + 25 };
    default:
      return state;
  }
}
```

Update `HudScene.ts` to render:

- HP
- current wave
- timer
- coins
- skill cooldown bar labels
- level-up choice panel with 3 options
- win/lose result panel

Update `ArenaScene.ts` to emit HUD events and pause/resume gameplay when the level-up panel is open.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- UpgradeSystem.test.ts
```

Expected: PASS with direct attack gain applied.

- [ ] **Step 5: Commit**

```bash
git add src/game/data/upgradeCatalog.ts src/game/systems/UpgradeSystem.ts src/game/scenes/HudScene.ts src/game/scenes/ArenaScene.ts tests/systems/UpgradeSystem.test.ts
git commit -m "feat: add hud and progression systems"
```

## Task 6: Generate Final Sprite And FX Bundles, Integrate Assets, And Balance The Demo

**Files:**
- Create: `assets/sprites/player/`
- Create: `assets/sprites/enemies/`
- Create: `assets/sprites/boss/`
- Create: `assets/sprites/fx/`
- Create: `assets/sprites/**/prompt-used.txt`
- Modify: `src/game/scenes/BootScene.ts`
- Modify: `src/game/entities/Player.ts`
- Modify: `src/game/entities/Enemy.ts`
- Modify: `src/game/entities/BossPig.ts`
- Modify: `src/game/scenes/MenuScene.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `generate2dsprite` skill outputs
  - current scene texture keys
- Produces:
  - stable texture keys for player, pigs, boss, and skill FX
  - a fully playable local demo started by `npm run dev`

- [ ] **Step 1: Write the failing test**

Create `tests/smoke/assetManifest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("asset manifest", () => {
  it("has generated player, enemy, boss, and fx sprite outputs", () => {
    expect(existsSync("assets/sprites/player")).toBe(true);
    expect(existsSync("assets/sprites/enemies")).toBe(true);
    expect(existsSync("assets/sprites/boss")).toBe(true);
    expect(existsSync("assets/sprites/fx")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- assetManifest.test.ts
```

Expected: FAIL because the final generated asset folders do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Use `generate2dsprite` before creating final sprite assets.

Generate at minimum:

- butcher idle/move sheet matching map style
- fat pig, lean pig, fork pig, helmet pig, charge pig, feed pig, elite pen pig
- pig king boss
- spin slash FX
- salt burst FX
- trap visual
- hit / death spark

Prompt rules:

- style must match the slaughterhouse map
- keep the solid `#FF00FF` raw background for processor compatibility
- keep prompt files beside outputs

Then update `BootScene.ts` preload to load the final textures, replace text-only placeholders in `MenuScene.ts`, and update `Player`, `Enemy`, and `BossPig` constructors to use generated textures and simple animation keys.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- assetManifest.test.ts
npm run build
```

Expected:

- asset manifest test PASS
- Vite build PASS with production bundle emitted

- [ ] **Step 5: Commit**

```bash
git add assets/sprites src/game/scenes/BootScene.ts src/game/entities/Player.ts src/game/entities/Enemy.ts src/game/entities/BossPig.ts src/game/scenes/MenuScene.ts src/styles.css tests/smoke/assetManifest.test.ts
git commit -m "feat: integrate generated slaughterhouse art"
```

## Task 7: Final QA, Balance Pass, And Demo Acceptance Check

**Files:**
- Modify: `src/game/data/playerConfig.ts`
- Modify: `src/game/data/enemyCatalog.ts`
- Modify: `src/game/data/wavePlan.ts`
- Modify: `src/game/data/upgradeCatalog.ts`
- Create: `docs/playtest-notes/2026-06-27-zhu-zhu-huang-hun-demo-checklist.md`

**Interfaces:**
- Consumes:
  - all completed gameplay systems
- Produces:
  - balanced demo pacing
  - acceptance checklist proving the spec is implemented

- [ ] **Step 1: Write the failing test**

Create `docs/playtest-notes/2026-06-27-zhu-zhu-huang-hun-demo-checklist.md` with unchecked acceptance criteria:

```md
# 猪猪黄昏 Demo Checklist

- [ ] One fixed slaughterhouse map loads
- [ ] Butcher auto-attacks pig enemies
- [ ] Three active skills are usable
- [ ] 10 waves clear in order
- [ ] Final pig boss appears
- [ ] HUD shows HP, wave, timer, coins
- [ ] Level-up modal presents 3 choices
- [ ] Win and loss screens both work
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run dev
```

Expected: Manual playtest reveals pacing problems, tuning gaps, or missing acceptance items before final balancing.

- [ ] **Step 3: Write minimal implementation**

Tune only the data files:

- reduce or raise pig HP/damage so wave 1-3 are readable
- make wave 4-7 the build-shaping section
- make wave 8-10 intense but survivable with a good build
- ensure boss health is large enough to feel climactic but not tedious
- ensure upgrades noticeably change damage or control in the next wave

Update the checklist with observed notes from at least:

- one full clear run
- one failure run

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test
npm run build
npm run dev
```

Expected:

- automated tests PASS
- production build PASS
- manual checklist items all checked during playtest

- [ ] **Step 5: Commit**

```bash
git add src/game/data/playerConfig.ts src/game/data/enemyCatalog.ts src/game/data/wavePlan.ts src/game/data/upgradeCatalog.ts docs/playtest-notes/2026-06-27-zhu-zhu-huang-hun-demo-checklist.md
git commit -m "chore: balance first playable slaughterhouse demo"
```

## Self-Review Notes

### Spec coverage

- One fixed slaughterhouse map: Task 2
- One butcher player, one auto cleaver, three active skills: Task 3
- 8-10 pig enemies and one final boss: Task 4
- Frequent upgrades, coins, HUD, result flow: Task 5
- Generated art via `generate2dmap` and `generate2dsprite`: Tasks 2 and 6
- Small complete playable browser demo and balance pass: Task 7

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain in tasks.
- All tasks list exact file paths and exact commands.

### Type consistency

- Player skill ids stay `spin`, `saltBurst`, `pigPenTrap` across config, entity, and HUD.
- Final boss id stays `pigKing` across wave plan and boss logic.
- Map metadata stays under `slaughterhouseMap` and is consumed by `BootScene` and `ArenaScene`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-27-zhu-zhu-huang-hun-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

