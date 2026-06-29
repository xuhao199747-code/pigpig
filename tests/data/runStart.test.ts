import { describe, expect, it } from "vitest";

import { normalizeRunWeaponId } from "../../src/game/data/runStart";

describe("run start data", () => {
  it("keeps a known weapon id", () => {
    expect(normalizeRunWeaponId("duskHook")).toBe("duskHook");
  });

  it("falls back to the starter cleaver for removed or unknown weapon ids", () => {
    expect(normalizeRunWeaponId("sausageCannon")).toBe("rustyCleaver");
    expect(normalizeRunWeaponId("missing")).toBe("rustyCleaver");
    expect(normalizeRunWeaponId()).toBe("rustyCleaver");
  });
});
