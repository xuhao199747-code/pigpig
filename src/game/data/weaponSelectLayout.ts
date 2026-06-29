import type { MenuRect } from "./menuLayout";

export const weaponSelectLayout = {
  cardGrid: { x: 48, y: 148, width: 590, height: 330 },
  cardGridStrokeAlpha: 0.18,
  cardWidth: 214,
  cardHeight: 160,
  cardColumnGap: 245,
  cardRowGap: 190,
  cardStartX: 165,
  cardStartY: 220,
  previewPanel: { x: 860, y: 120, width: 650, height: 560 },
  previewImage: { x: 1100, y: 250, width: 170, height: 170 },
  title: { x: 960, y: 382, width: 280, height: 44 },
  titleDivider: { x: 892, y: 438, width: 586, height: 2 },
  statsBox: { x: 914, y: 454, width: 540, height: 140 },
  stats: { x: 940, y: 470, width: 500, height: 110 },
  descriptionBox: { x: 914, y: 612, width: 540, height: 64 },
  description: { x: 940, y: 624, width: 500, height: 40 },
  confirmButton: { x: 1080, y: 724, width: 300, height: 64 },
  backButton: { x: 48, y: 792, width: 150, height: 48 },
  keyboardHint: { x: 530, y: 812, width: 540, height: 34 }
} as const satisfies Record<string, MenuRect | number>;

export function getWeaponCardLayout(index: number): {
  panel: MenuRect;
  art: MenuRect;
  titleBand: MenuRect;
  titleText: MenuRect;
} {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const centerX = weaponSelectLayout.cardStartX + column * weaponSelectLayout.cardColumnGap;
  const centerY = weaponSelectLayout.cardStartY + row * weaponSelectLayout.cardRowGap;
  return {
    panel: {
      x: centerX - weaponSelectLayout.cardWidth / 2,
      y: centerY - weaponSelectLayout.cardHeight / 2,
      width: weaponSelectLayout.cardWidth,
      height: weaponSelectLayout.cardHeight
    },
    art: { x: centerX - 50, y: centerY - 64, width: 100, height: 90 },
    titleBand: { x: centerX - 103, y: centerY + 34, width: 206, height: 42 },
    titleText: { x: centerX - 96, y: centerY + 45, width: 192, height: 26 }
  };
}
