# Five Boss Waves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add distinct bosses to every even wave with normal-enemies-first wave flow and three reusable boss behaviors.

**Architecture:** Extend enemy definitions with an optional boss behavior profile. Keep wave scheduling in `WaveDirector`, boss movement in `BossPig`, and reinforcement spawning in `ArenaScene` through a small callback boundary.

**Tech Stack:** Phaser 3, TypeScript, Vitest, generated transparent PNG sprites

## Global Constraints

- Bosses appear on waves 2, 4, 6, 8, and 10.
- Normal enemies are cleared before the boss appears.
- Bosses never drop weapons.
- Existing difficulty multipliers apply to all bosses.

---

### Task 1: Wave Scheduling

- [ ] Add failing tests for even-wave boss IDs and normal-enemies-before-boss scheduling.
- [ ] Update `wavePlan` and `WaveDirector` minimally until tests pass.

### Task 2: Boss Catalog And Assets

- [ ] Generate four transparent, oversized boss sprites matching the project style.
- [ ] Add four enemy definitions plus behavior metadata and preload all textures.
- [ ] Add asset manifest coverage.

### Task 3: Boss Behavior

- [ ] Add pure timing/state tests for charge, slam, and summon behavior triggers.
- [ ] Implement `BossPig` behavior and integrate its damage/summon events in `ArenaScene`.

### Task 4: Verification

- [ ] Run all tests, build, and whitespace checks.
- [ ] Browser-check an even-wave boss spawn, oversized rendering, and absence of weapon rewards.
