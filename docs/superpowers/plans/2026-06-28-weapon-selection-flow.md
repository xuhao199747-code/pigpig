# Weapon Selection Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated pre-run weapon selection screen and remove inventory, in-run swapping, and weapon persistence.

**Architecture:** Route menu starts through a new `WeaponSelectScene`, then pass validated `difficultyId` and `weaponId` to `ArenaScene`. Keep the weapon catalog and layered weapon rendering, but remove inventory state and HUD controls.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

## Global Constraints

- A selected weapon remains locked for the complete run.
- Start and Continue both open weapon selection.
- Restart preserves the current run weapon.
- No enemy or boss drops weapons.

---

### Task 1: Selection Contract And Scene Registration

**Files:**
- Create: `src/game/scenes/WeaponSelectScene.ts`
- Modify: `src/game/config/gameConfig.ts`
- Create: `src/game/data/runStart.ts`
- Test: `tests/data/runStart.test.ts`

**Interfaces:**
- Produces: `normalizeRunWeaponId(id?: string): string`
- Produces: Phaser scene key `weapon-select`

- [ ] Write a failing test proving unknown weapon IDs fall back to `rustyCleaver`.
- [ ] Run `npm test -- tests/data/runStart.test.ts` and confirm the missing module failure.
- [ ] Implement `normalizeRunWeaponId` using the weapon catalog and register `WeaponSelectScene`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Weapon Selection UI And Routing

**Files:**
- Modify: `src/game/scenes/MenuScene.ts`
- Modify: `src/game/scenes/WeaponSelectScene.ts`

**Interfaces:**
- Consumes: `{ difficultyId: DifficultyId }`
- Produces: arena start data `{ difficultyId: DifficultyId; weaponId: string }`

- [ ] Route both menu start paths to `weapon-select` instead of `arena`.
- [ ] Render nine selectable weapon cards, a large weapon preview, complete stats, confirm, and back controls.
- [ ] Start `arena` only after confirmation with the selected weapon ID.
- [ ] Check desktop canvas bounds at 1600x900.

### Task 3: Arena Lock And Inventory Removal

**Files:**
- Modify: `src/game/scenes/ArenaScene.ts`
- Modify: `src/game/scenes/HudScene.ts`
- Modify: `src/game/systems/SaveSystem.ts`
- Delete: `src/game/systems/InventorySystem.ts`
- Delete: `tests/systems/InventorySystem.test.ts`
- Modify: `tests/systems/SaveSystem.test.ts`

**Interfaces:**
- Arena consumes `weaponId` once in `init`/`create`.
- Restart reuses the current `weaponId`.

- [ ] Write failing save tests showing default saves no longer contain inventory fields.
- [ ] Remove inventory fields/functions and make old saves normalize without exposing weapon inventory.
- [ ] Remove `B`, inventory events, HUD panel, and equip handler.
- [ ] Equip the selected run weapon once and preserve it on restart.
- [ ] Run all tests and confirm zero failures.

### Task 4: End-To-End Verification

**Files:**
- Modify: `tests/smoke/projectBoot.test.ts` if scene expectations require it.

**Interfaces:**
- No new interfaces.

- [ ] Run `npm test` and require all tests to pass.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Run `git diff --check` and require no whitespace errors.
- [ ] Browser-check menu to weapon selection to arena, selected weapon display, restart persistence, and absence of backpack UI.
