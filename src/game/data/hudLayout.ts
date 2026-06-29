export type HudRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const hudSafeBounds: HudRect = {
  x: 20,
  y: 20,
  width: 1560,
  height: 840
} as const;

export const hudLayout = {
  statusPanel: { x: 28, y: 28, width: 360, height: 148 },
  characterPanel: { x: 28, y: 638, width: 430, height: 206 },
  skillBar: { x: 496, y: 668, width: 500, height: 174 },
  runPanel: { x: 1036, y: 28, width: 304, height: 184 },
  miniMapPanel: { x: 1360, y: 28, width: 204, height: 166 },
  commandPanel: { x: 1036, y: 222, width: 304, height: 38 },
  hintText: { x: 28, y: 848, width: 208, height: 12 }
} as const satisfies Record<string, HudRect>;

export const modalLayout = {
  overlay: { x: 0, y: 0, width: 1600, height: 900 },
  upgradePanel: { x: 470, y: 146, width: 660, height: 608 },
  resultPanel: { x: 440, y: 268, width: 720, height: 390 },
  pausePanel: { x: 438, y: 318, width: 724, height: 258 }
} as const satisfies Record<string, HudRect>;

export const upgradeModalLayout = {
  subtitle: { x: 560, y: 258, width: 480, height: 26 },
  firstCard: { x: 535, y: 292, width: 530, height: 112 },
  cardGap: 14,
  icon: { x: 556, y: 316, width: 58, height: 58 },
  textColumn: { x: 638, y: 306, width: 276, height: 82 },
  metaColumn: { x: 930, y: 316, width: 92, height: 58 },
  footer: { x: 604, y: 684, width: 392, height: 44 },
  error: { x: 640, y: 728, width: 320, height: 22 }
} as const satisfies Record<string, HudRect | number>;

export const characterPanelLayout = {
  expBar: { x: 148, y: 749, width: 108, height: 22 },
  skillTitle: { x: 304, y: 664, width: 92, height: 24 },
  skillGrid: { x: 328, y: 694, width: 112, height: 106 },
  statsBlock: { x: 56, y: 782, width: 190, height: 34 },
  skillCellSize: 52,
  skillCellStepX: 60,
  skillCellStepY: 54,
  skillCellFontSize: 20,
  skillCellStroke: 3,
  skillGlyphOffsetY: -2,
  skillTierBadge: { xOffset: 5, yOffset: -21, width: 20, height: 12 },
  skillTierFontSize: 8,
  skillTierStroke: 1
} as const satisfies Record<string, HudRect | number | { xOffset: number; yOffset: number; width: number; height: number }>;

export const statusPanelLayout = {
  labelX: 108,
  firstRowY: 62,
  rowGap: 40,
  barX: 172,
  barWidth: 176,
  barHeight: 18,
  panelInset: 24,
  valueInset: 18
} as const;

export const runPanelLayout = {
  textBlock: { x: 1064, y: 48, width: 248, height: 146 },
  titleLine: { x: 1064, y: 48, width: 248, height: 26 },
  objectiveBlock: { x: 1064, y: 80, width: 248, height: 56 },
  timeLine: { x: 1064, y: 146, width: 248, height: 24 },
  resourceLine: { x: 1064, y: 174, width: 248, height: 24 },
  inset: 28
} as const;

export const commandPanelLayout = {
  leftButton: { x: 1040, y: 223, width: 138, height: 36 },
  rightButton: { x: 1198, y: 223, width: 138, height: 36 },
  inset: 2
} as const satisfies Record<string, HudRect | number>;

export const miniMapLayout = {
  mapRect: { x: 1430, y: 68, width: 132, height: 92 },
  playerRadius: 6,
  enemyRadius: 3,
  bossRadius: 5
} as const satisfies Record<string, HudRect | number>;

export const skillBarLayout = {
  visibleSlotCount: 3,
  slotStartX: 650,
  slotSpacing: 118,
  slotWidth: 96,
  slotHeight: 126,
  slotCenterY: 744,
  keyCapY: 684,
  iconY: 738,
  labelBlock: { x: 604, y: 788, width: 92, height: 22 },
  cooldownBlock: { x: 604, y: 814, width: 92, height: 16 },
  labelFontSize: 14,
  labelStroke: 3,
  cooldownFontSize: 11,
  cooldownStroke: 2,
  pagerY: 836
} as const satisfies Record<string, HudRect | number>;

export function rectsOverlap(a: HudRect, b: HudRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectInside(inner: HudRect, outer: HudRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}
