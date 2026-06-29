import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("browser fullscreen chrome", () => {
  it("lets the Phaser canvas fill the viewport without browser focus chrome", () => {
    expect(styles).toContain("overflow: hidden");
    expect(styles).toContain("height: 100vh");
    expect(styles).toContain("position: fixed");
    expect(styles).toContain("inset: 0");
    expect(styles).toContain("justify-content: center");
    expect(styles).toContain("align-items: center");
    expect(styles).toContain("border: 0");
    expect(styles).toContain("outline: none");
    expect(styles).toContain("canvas:focus");
  });
});
