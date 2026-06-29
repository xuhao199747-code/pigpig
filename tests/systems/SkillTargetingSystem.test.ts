import { describe, expect, it } from "vitest";

import { createSaltBurstTargeting, isPointInSaltBurst } from "../../src/game/systems/SkillTargetingSystem";

describe("skill targeting system", () => {
  it("places salt burst in front of the butcher instead of on the body center", () => {
    expect(createSaltBurstTargeting({ originX: 400, originY: 300, facingDirection: "right", radius: 150 })).toMatchObject({
      centerX: 475,
      centerY: 300,
      directionX: 1,
      directionY: 0
    });
    expect(createSaltBurstTargeting({ originX: 400, originY: 300, facingDirection: "up", radius: 150 })).toMatchObject({
      centerX: 400,
      centerY: 225,
      directionX: 0,
      directionY: -1
    });
  });

  it("hits enemies in a forward salt cone while ignoring pigs behind the butcher", () => {
    const target = createSaltBurstTargeting({ originX: 400, originY: 300, facingDirection: "right", radius: 150 });

    expect(isPointInSaltBurst(target, { x: 430, y: 300 })).toBe(true);
    expect(isPointInSaltBurst(target, { x: 510, y: 300 })).toBe(true);
    expect(isPointInSaltBurst(target, { x: 492, y: 372 })).toBe(true);
    expect(isPointInSaltBurst(target, { x: 310, y: 300 })).toBe(false);
    expect(isPointInSaltBurst(target, { x: 440, y: 452 })).toBe(false);
  });
});
