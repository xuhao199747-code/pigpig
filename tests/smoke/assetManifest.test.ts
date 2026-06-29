import { existsSync, readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { getPlayerWeaponAppearance } from "../../src/game/data/playerWeaponAppearance";
import { weaponCatalog } from "../../src/game/data/weaponCatalog";

type PngInfo = {
  width: number;
  height: number;
  data: Buffer;
};

function readRgbaPng(path: string): PngInfo {
  const bytes = Buffer.from(readFileSync(path));
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      expect(chunk[8]).toBe(8);
      expect(chunk[9]).toBe(6);
    }
    if (type === "IDAT") idat.push(chunk);
    if (type === "IEND") break;
  }

  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const data = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source];
    source += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[source + x];
      const left = x >= 4 ? data[y * stride + x - 4] : 0;
      const up = y > 0 ? data[(y - 1) * stride + x] : 0;
      const upLeft = x >= 4 && y > 0 ? data[(y - 1) * stride + x - 4] : 0;
      data[y * stride + x] = (raw + pngFilter(filter, left, up, upLeft)) & 0xff;
    }
    source += stride;
  }
  return { width, height, data };
}

function pngFilter(filter: number, left: number, up: number, upLeft: number): number {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paeth(left, up, upLeft);
  throw new Error(`unsupported PNG filter ${filter}`);
}

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function alphaArea(image: PngInfo, frameX = 0, frameY = 0, frameSize = image.width): number {
  let area = 0;
  for (let y = frameY; y < frameY + frameSize; y += 1) {
    for (let x = frameX; x < frameX + frameSize; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] > 8) area += 1;
    }
  }
  return area;
}

function frameDifferenceScore(a: PngInfo, b: PngInfo, bFrameX = 0, bFrameY = 0, frameSize = a.width): number {
  let difference = 0;
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const aIndex = (y * a.width + x) * 4;
      const bIndex = ((bFrameY + y) * b.width + bFrameX + x) * 4;
      difference += Math.abs(a.data[aIndex] - b.data[bIndex]);
      difference += Math.abs(a.data[aIndex + 1] - b.data[bIndex + 1]);
      difference += Math.abs(a.data[aIndex + 2] - b.data[bIndex + 2]);
      difference += Math.abs(a.data[aIndex + 3] - b.data[bIndex + 3]);
    }
  }
  return difference / (frameSize * frameSize);
}

function sheetFrameDifferenceScore(image: PngInfo, firstFrame: number, secondFrame: number, frameSize = 256): number {
  const firstX = (firstFrame % 2) * frameSize;
  const firstY = Math.floor(firstFrame / 2) * frameSize;
  const secondX = (secondFrame % 2) * frameSize;
  const secondY = Math.floor(secondFrame / 2) * frameSize;
  let difference = 0;
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const firstIndex = ((firstY + y) * image.width + firstX + x) * 4;
      const secondIndex = ((secondY + y) * image.width + secondX + x) * 4;
      difference += Math.abs(image.data[firstIndex] - image.data[secondIndex]);
      difference += Math.abs(image.data[firstIndex + 1] - image.data[secondIndex + 1]);
      difference += Math.abs(image.data[firstIndex + 2] - image.data[secondIndex + 2]);
      difference += Math.abs(image.data[firstIndex + 3] - image.data[secondIndex + 3]);
    }
  }
  return difference / (frameSize * frameSize);
}

describe("asset manifest", () => {
  it("has generated player, enemy, boss, and fx sprite outputs", () => {
    expect(existsSync("assets/sprites/player")).toBe(true);
    expect(existsSync("assets/sprites/player/held")).toBe(true);
    expect(existsSync("assets/sprites/enemies")).toBe(true);
    expect(existsSync("assets/sprites/boss")).toBe(true);
    expect(existsSync("assets/sprites/fx")).toBe(true);
  });

  it("has generated menu and hud ui assets", () => {
    expect(existsSync("assets/ui/logo/pig-dusk-logo.png")).toBe(true);
    expect(existsSync("assets/ui/menu/start-background.png")).toBe(true);
    expect(existsSync("assets/ui/icons/skill-spin.png")).toBe(true);
    expect(existsSync("assets/ui/icons/skill-salt.png")).toBe(true);
    expect(existsSync("assets/ui/icons/skill-trap.png")).toBe(true);
  });

  it("has every even-wave boss sprite", () => {
    expect(existsSync("assets/sprites/boss/iron-barrel-boar.png")).toBe(true);
    expect(existsSync("assets/sprites/boss/feed-mountain.png")).toBe(true);
    expect(existsSync("assets/sprites/boss/forklift-hog.png")).toBe(true);
    expect(existsSync("assets/sprites/boss/stitched-pen-beast.png")).toBe(true);
    expect(existsSync("assets/sprites/boss/pig-king.png")).toBe(true);
  });

  it("has real walk and attack sheets for every boss", () => {
    for (const boss of ["iron-barrel-boar", "feed-mountain", "forklift-hog", "stitched-pen-beast", "pig-king"]) {
      const walk = readRgbaPng(`assets/sprites/boss/${boss}-walk-sheet.png`);
      const attack = readRgbaPng(`assets/sprites/boss/${boss}-attack-sheet.png`);
      expect(walk.width).toBe(512);
      expect(walk.height).toBe(512);
      expect(attack.width).toBe(512);
      expect(attack.height).toBe(512);

      for (const sheet of [walk, attack]) {
        const frameAreas = [
          alphaArea(sheet, 0, 0, 256),
          alphaArea(sheet, 256, 0, 256),
          alphaArea(sheet, 0, 256, 256),
          alphaArea(sheet, 256, 256, 256)
        ];
        expect(Math.min(...frameAreas)).toBeGreaterThan(2200);
        expect(Math.min(...frameAreas) / Math.max(...frameAreas)).toBeGreaterThan(0.45);
      }
    }
  });

  it("keeps boss walk and attack sheet frames visibly animated instead of near-static", () => {
    for (const boss of ["iron-barrel-boar", "feed-mountain", "forklift-hog", "stitched-pen-beast", "pig-king"]) {
      for (const action of ["walk", "attack"]) {
        const sheet = readRgbaPng(`assets/sprites/boss/${boss}-${action}-sheet.png`);
        const frameScores = [
          sheetFrameDifferenceScore(sheet, 0, 1),
          sheetFrameDifferenceScore(sheet, 1, 2),
          sheetFrameDifferenceScore(sheet, 2, 3),
          sheetFrameDifferenceScore(sheet, 3, 0)
        ];
        expect(Math.min(...frameScores)).toBeGreaterThan(25);
      }
    }
  });

  it("has generated pickup sprites", () => {
    expect(existsSync("assets/sprites/pickups/health-pack.png")).toBe(true);
    expect(existsSync("assets/sprites/pickups/stamina-pack.png")).toBe(true);
    expect(existsSync("assets/sprites/pickups/armor-pack.png")).toBe(true);
  });

  it("has integrated held-player assets for the starter weapon", () => {
    expect(existsSync("assets/sprites/player/held/rusty-cleaver-idle.png")).toBe(true);
    expect(existsSync("assets/sprites/player/held/rusty-cleaver-walk-sheet.png")).toBe(true);
    expect(existsSync("assets/sprites/player/held/rusty-cleaver-attack-sheet.png")).toBe(true);
  });

  it("keeps every integrated held-player frame non-empty and transparent", () => {
    for (const weapon of weaponCatalog) {
      const appearance = getPlayerWeaponAppearance(weapon.id);
      const idle = readRgbaPng(appearance.idlePath);
      expect(idle.width).toBe(128);
      expect(idle.height).toBe(128);
      expect(alphaArea(idle)).toBeGreaterThan(1000);

      for (const [path, frameSize] of [
        [appearance.walkPath, appearance.walkFrameSize ?? 128],
        [appearance.attackPath, appearance.attackFrameSize ?? 128]
      ] as const) {
        const sheet = readRgbaPng(path);
        expect(sheet.width).toBe(frameSize * 2);
        expect(sheet.height).toBe(frameSize * 2);
        const frameAreas = [
          alphaArea(sheet, 0, 0, frameSize),
          alphaArea(sheet, frameSize, 0, frameSize),
          alphaArea(sheet, 0, frameSize, frameSize),
          alphaArea(sheet, frameSize, frameSize, frameSize)
        ];
        expect(Math.min(...frameAreas)).toBeGreaterThan(900);
        expect(Math.min(...frameAreas) / Math.max(...frameAreas)).toBeGreaterThan(0.58);
      }
    }
  });

  it("keeps integrated held-player movement and attack frames visually distinct from idle", () => {
    for (const weapon of weaponCatalog) {
      const appearance = getPlayerWeaponAppearance(weapon.id);
      const idle = readRgbaPng(appearance.idlePath);

      for (const [path, frameSize] of [
        [appearance.walkPath, appearance.walkFrameSize ?? 128],
        [appearance.attackPath, appearance.attackFrameSize ?? 128]
      ] as const) {
        const sheet = readRgbaPng(path);
        const frameScores = [
          frameDifferenceScore(idle, sheet, 0, 0, Math.min(128, frameSize)),
          frameDifferenceScore(idle, sheet, frameSize, 0, Math.min(128, frameSize)),
          frameDifferenceScore(idle, sheet, 0, frameSize, Math.min(128, frameSize)),
          frameDifferenceScore(idle, sheet, frameSize, frameSize, Math.min(128, frameSize))
        ];
        expect(Math.min(...frameScores)).toBeGreaterThan(1.2);
      }
    }
  });
});
