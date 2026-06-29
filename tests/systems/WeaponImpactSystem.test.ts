import { describe, expect, it } from "vitest";

import { getWeaponDefinition } from "../../src/game/data/weaponCatalog";
import { createWeaponImpactPresentation } from "../../src/game/systems/WeaponImpactSystem";

describe("weapon impact system", () => {
  it("makes heavy weapons feel larger than light blades", () => {
    const light = createWeaponImpactPresentation(getWeaponDefinition("rustyCleaver"));
    const heavy = createWeaponImpactPresentation(getWeaponDefinition("dragonSlayer"));

    expect(heavy.radius).toBeGreaterThan(light.radius);
    expect(heavy.durationMs).toBeGreaterThan(light.durationMs);
    expect(heavy.strokeWidth).toBeGreaterThan(light.strokeWidth);
    expect(heavy.aftershock).toEqual({
      color: 0x8f3f24,
      radiusMultiplier: 0.62,
      durationMs: 320
    });
    expect(heavy.cameraShakeMs).toBe(70);
  });

  it("gives hook weapons a wider sweeping arc", () => {
    const hook = createWeaponImpactPresentation(getWeaponDefinition("duskHook"));

    expect(hook.shape).toBe("arc");
    expect(hook.radius).toBeGreaterThanOrEqual(88);
    expect(hook.color).toBe(0xd97b43);
    expect(hook.fragmentCount).toBe(4);
  });

  it("gives light blades a short readable trail without screen shake", () => {
    const light = createWeaponImpactPresentation(getWeaponDefinition("rustyCleaver"));

    expect(light.trailCount).toBe(2);
    expect(light.cameraShakeMs).toBe(0);
    expect(light.aftershock).toBeUndefined();
  });
});
