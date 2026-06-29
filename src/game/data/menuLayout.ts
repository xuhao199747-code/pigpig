export type MenuRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const menuModalLayout = {
  overlay: { x: 0, y: 0, width: 1600, height: 900 },
  settingsPanel: { x: 510, y: 180, width: 580, height: 540 },
  settingsCloseButton: { x: 1030, y: 202, width: 44, height: 38 },
  settingsFooterCloseButton: { x: 820, y: 654, width: 170, height: 48 },
  settingsClearButton: { x: 610, y: 654, width: 190, height: 48 }
} as const satisfies Record<string, MenuRect>;

export const menuHomeLayout = {
  heroPanel: { x: 310, y: 172, width: 980, height: 700 },
  subtitle: { x: 460, y: 390, width: 680, height: 30 },
  primaryActions: { x: 480, y: 488, width: 640, height: 76 },
  difficultyTitle: { x: 700, y: 572, width: 200, height: 34 },
  difficultyCards: { x: 424, y: 608, width: 752, height: 74 },
  utilityButtons: { x: 520, y: 714, width: 560, height: 46 },
  saveSummary: { x: 610, y: 776, width: 380, height: 22 },
  keyboardHint: { x: 580, y: 820, width: 440, height: 26 }
} as const satisfies Record<string, MenuRect>;

export function rectInside(inner: MenuRect, outer: MenuRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function hasVerticalGap(upper: MenuRect, lower: MenuRect, gap: number): boolean {
  return lower.y - (upper.y + upper.height) >= gap;
}
