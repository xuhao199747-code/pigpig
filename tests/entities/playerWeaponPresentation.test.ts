import { describe, expect, it } from "vitest";

import { getWeaponDefinition } from "../../src/game/data/weaponCatalog";
import {
  getWeaponAttackMotionAtProgress,
  getWeaponMotionPreset,
  getWeaponPresentationSnapshot
} from "../../src/game/entities/playerWeaponPresentation";

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

  it("offsets held weapons for mostly vertical attacks", () => {
    const weapon = getWeaponDefinition("rustyCleaver");
    const side = getWeaponPresentationSnapshot({
      weapon,
      playerX: 100,
      playerY: 100,
      facingRight: true,
      facingDirection: "right",
      state: "attack",
      weaponMotion: getWeaponMotionPreset("attack", weapon)
    });
    const upward = getWeaponPresentationSnapshot({
      weapon,
      playerX: 100,
      playerY: 100,
      facingRight: true,
      facingDirection: "up",
      state: "attack",
      weaponMotion: getWeaponMotionPreset("attack", weapon)
    });

    expect(upward.y).toBeLessThan(side.y);
    expect(upward.depthOffset).toBeLessThan(side.depthOffset);
    expect(Math.abs(upward.rotation)).toBeGreaterThan(Math.abs(side.rotation));
  });

  it("keeps hook weapons near the body front instead of swinging wide", () => {
    const snapshot = getWeaponPresentationSnapshot({
      weapon: getWeaponDefinition("duskHook"),
      playerX: 0,
      playerY: 0,
      facingRight: false,
      state: "idle",
      weaponMotion: getWeaponMotionPreset("idle", getWeaponDefinition("duskHook"))
    });

    expect(snapshot.x).toBeGreaterThan(18);
    expect(snapshot.rotation).toBeLessThan(0.2);
  });

  it("keeps hook attack motion compact", () => {
    const motion = getWeaponMotionPreset("attack", getWeaponDefinition("duskHook"));
    expect(motion.reach).toBeLessThanOrEqual(15);
  });

  it("gives heavy blade attacks more forward reach than light blades", () => {
    const light = getWeaponMotionPreset("attack", getWeaponDefinition("rustyCleaver"));
    const heavy = getWeaponMotionPreset("attack", getWeaponDefinition("dragonSlayer"));
    expect(heavy.reach).toBeGreaterThan(light.reach);
  });

  it("drives light blade attacks through a fast visible swing arc", () => {
    const start = getWeaponAttackMotionAtProgress(getWeaponDefinition("rustyCleaver"), 0);
    const middle = getWeaponAttackMotionAtProgress(getWeaponDefinition("rustyCleaver"), 0.5);
    const end = getWeaponAttackMotionAtProgress(getWeaponDefinition("rustyCleaver"), 1);

    expect(start.rotation).toBeLessThan(middle.rotation);
    expect(middle.rotation).toBeLessThan(end.rotation);
    expect(middle.reach).toBeGreaterThan(start.reach);
  });

  it("keeps heavy blade swings weighty by delaying the forward reach", () => {
    const middle = getWeaponAttackMotionAtProgress(getWeaponDefinition("dragonSlayer"), 0.5);
    const end = getWeaponAttackMotionAtProgress(getWeaponDefinition("dragonSlayer"), 1);

    expect(middle.rotation).toBeLessThan(end.rotation);
    expect(middle.reach).toBeLessThan(end.reach);
    expect(end.reach).toBeGreaterThanOrEqual(20);
  });

  it("keeps hook attacks compact across the whole animation", () => {
    const middle = getWeaponAttackMotionAtProgress(getWeaponDefinition("duskHook"), 0.5);
    const end = getWeaponAttackMotionAtProgress(getWeaponDefinition("duskHook"), 1);

    expect(middle.reach).toBeLessThanOrEqual(14);
    expect(end.reach).toBeLessThanOrEqual(15);
    expect(Math.abs(end.rotation - middle.rotation)).toBeLessThan(0.5);
  });
});
