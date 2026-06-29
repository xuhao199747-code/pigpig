import { describe, expect, it, vi } from "vitest";

import { isFullscreenToggleKey, toggleBrowserFullscreen } from "../../src/game/systems/FullscreenSystem";

describe("FullscreenSystem", () => {
  it("uses F as the browser fullscreen toggle shortcut", () => {
    expect(isFullscreenToggleKey({ key: "f", code: "KeyF" })).toBe(true);
    expect(isFullscreenToggleKey({ key: "F", code: "KeyF" })).toBe(true);
    expect(isFullscreenToggleKey({ key: "w", code: "KeyW" })).toBe(false);
  });

  it("requests fullscreen on the game root and exits when already fullscreen", async () => {
    const root = { requestFullscreen: vi.fn().mockResolvedValue(undefined) };
    const doc = {
      fullscreenElement: null,
      exitFullscreen: vi.fn().mockResolvedValue(undefined)
    };

    await toggleBrowserFullscreen(root, doc);
    expect(root.requestFullscreen).toHaveBeenCalledTimes(1);

    doc.fullscreenElement = root;
    await toggleBrowserFullscreen(root, doc);
    expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
