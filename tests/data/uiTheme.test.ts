import { describe, expect, it } from "vitest";

import { uiTheme } from "../../src/game/data/uiTheme";

describe("ui theme", () => {
  it("defines shared surface, button, and text tokens for menu-like screens", () => {
    expect(uiTheme.surface.panelFill).toBe(0x1d100b);
    expect(uiTheme.surface.panelStroke).toBe(0xb06d35);
    expect(uiTheme.button.primaryFill).toBe(0x5a2a17);
    expect(uiTheme.button.hoverFill).toBe(0x753819);
    expect(uiTheme.text.title).toBe("#f3c982");
    expect(uiTheme.text.muted).toBe("#b98758");
  });
});
