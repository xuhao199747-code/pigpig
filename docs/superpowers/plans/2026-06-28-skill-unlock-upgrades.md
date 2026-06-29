# Skill Unlock Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start each run with Spin Slash only, then unlock Salt Burst and Pig Pen Trap through level-up choices before their upgrades can appear.

**Architecture:** Store unlocked skill IDs in `PlayerProgressState`. Let `UpgradeSystem` derive a state-aware eligible catalog and apply unlock cards, while `Player` enforces casting permission and `ArenaScene` forwards authoritative state to the HUD.

**Tech Stack:** TypeScript, Phaser 3, Vitest

## Global Constraints

- `Q` Spin Slash is unlocked at run start; `E` Salt Burst and `R` Pig Pen Trap are locked.
- Skill unlocks are run-local and are not stored in local save data.
- Locked-skill upgrades must never appear, including after rerolls.
- Existing weapon selection, difficulty, and save flows remain unchanged.

---

### Task 1: State-Aware Upgrade Pool

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/data/upgradeCatalog.ts`
- Modify: `src/game/systems/UpgradeSystem.ts`
- Test: `tests/systems/UpgradeSystem.test.ts`

**Interfaces:**
- Consumes: `PlayerProgressState`
- Produces: `getEligibleUpgrades(state)`, `rollUpgradeChoices(count, cursor, state)`, unlock handling in `applyUpgrade`

- [ ] **Step 1: Write failing tests** proving the initial pool contains both unlock cards, excludes Salt/Trap enhancements, and changes after applying each unlock.
- [ ] **Step 2: Run `npm test -- tests/systems/UpgradeSystem.test.ts`** and confirm failures are caused by missing unlock state and filtering.
- [ ] **Step 3: Add `unlockedSkillIds: ActiveSkillId[]` to progress state**, initialize it with `spin`, add `unlockSaltBurst` and `unlockPigPenTrap` catalog entries, and implement state-aware eligibility.
- [ ] **Step 4: Make choice rolling select three unique eligible entries** and preserve cursor-based rerolls.
- [ ] **Step 5: Run `npm test -- tests/systems/UpgradeSystem.test.ts`** and confirm all upgrade tests pass.

### Task 2: Casting Permission

**Files:**
- Modify: `src/game/entities/Player.ts`
- Modify: `src/game/entities/playerConfig.ts` if initialization is centralized there
- Test: `tests/entities/playerSkillUnlock.test.ts`

**Interfaces:**
- Consumes: `Player.progress.unlockedSkillIds`
- Produces: `Player.isSkillUnlocked(skillId)` and a guarded `Player.tryCast(skillId)`

- [ ] **Step 1: Write a failing player skill-state test** proving Spin is initially available while Salt and Trap are rejected.
- [ ] **Step 2: Run the targeted test** and confirm it fails because casting currently ignores unlock state.
- [ ] **Step 3: Implement `isSkillUnlocked` and guard `tryCast` before cooldown mutation.**
- [ ] **Step 4: Apply an unlock upgrade and prove the corresponding skill becomes castable with zero initial cooldown.**
- [ ] **Step 5: Run the targeted test and existing player tests.**

### Task 3: Arena Upgrade And HUD Data Flow

**Files:**
- Modify: `src/game/scenes/ArenaScene.ts`
- Modify: `src/game/scenes/HudScene.ts`
- Modify: `src/game/data/hudText.ts`
- Test: `tests/data/hudText.test.ts`

**Interfaces:**
- Consumes: `rollUpgradeChoices(..., player.progress)` and `player.isSkillUnlocked(id)`
- Produces: HUD payload `unlockedSkills: ActiveSkillId[]`

- [ ] **Step 1: Write failing HUD-copy tests** for locked and ready skill labels.
- [ ] **Step 2: Run the targeted test and confirm the locked copy is absent.**
- [ ] **Step 3: Pass player progress into initial rolls and rerolls**, and emit unlocked skill IDs in regular HUD updates.
- [ ] **Step 4: Render locked E/R slots dimmed with `升级时获得`**, suppress ready/cooldown text for locked skills, and ignore locked pointer input through the Arena guard.
- [ ] **Step 5: Add a short highlight tween when a skill changes from locked to unlocked.**
- [ ] **Step 6: Run HUD and upgrade tests.**

### Task 4: Regression Verification

**Files:**
- Verify all modified source and test files

**Interfaces:**
- Consumes: completed Tasks 1-3
- Produces: verified playable build

- [ ] **Step 1: Run `npm test`** and require zero failures.
- [ ] **Step 2: Run `npm run build`** and require a successful Vite production build.
- [ ] **Step 3: Run `git diff --check`** and require no whitespace errors.
- [ ] **Step 4: Inspect the local game** to confirm Q starts ready, E/R start locked, unlock cards appear, and unlocking immediately activates the slot.
