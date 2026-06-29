import { weaponCatalog } from "./weaponCatalog";
import { getPlayerWeaponAppearance } from "./playerWeaponAppearance";

export type SpriteSheetDefinition = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  frameRate: number;
  repeat: number;
};

export const animationCatalog = {
  player: {
    walk: {
      key: "player.butcher.walk",
      path: "assets/sprites/player/butcher-walk-sheet.png",
      frameWidth: 128,
      frameHeight: 128,
      frames: 4,
      frameRate: 8,
      repeat: -1
    },
    attack: {
      key: "player.butcher.attack",
      path: "assets/sprites/player/butcher-attack-sheet.png",
      frameWidth: 128,
      frameHeight: 128,
      frames: 4,
      frameRate: 12,
      repeat: 0
    },
    shoot: {
      key: "player.butcher.shoot",
      path: "assets/sprites/player/butcher-shoot-sheet.png",
      frameWidth: 128,
      frameHeight: 128,
      frames: 4,
      frameRate: 12,
      repeat: 0
    }
  },
  enemy: {
    walk: {
      key: "enemy.pig.walk",
      path: "assets/sprites/enemies/pig-walk-sheet.png",
      frameWidth: 96,
      frameHeight: 96,
      frames: 4,
      frameRate: 8,
      repeat: -1
    },
    attack: {
      key: "enemy.pig.attack",
      path: "assets/sprites/enemies/pig-attack-sheet.png",
      frameWidth: 112,
      frameHeight: 112,
      frames: 4,
      frameRate: 10,
      repeat: 0
    }
  },
  skills: {
    spin: {
      key: "skill.spin.sheet",
      path: "assets/sprites/fx/spin-slash-sheet.png",
      frameWidth: 160,
      frameHeight: 160,
      frames: 4,
      frameRate: 16,
      repeat: 0
    },
    saltBurst: {
      key: "skill.saltBurst.sheet",
      path: "assets/sprites/fx/salt-burst-sheet.png",
      frameWidth: 176,
      frameHeight: 176,
      frames: 4,
      frameRate: 14,
      repeat: 0
    },
    trap: {
      key: "skill.trap.sheet",
      path: "assets/sprites/fx/trap-ring-sheet.png",
      frameWidth: 144,
      frameHeight: 144,
      frames: 4,
      frameRate: 10,
      repeat: -1
    }
  }
} as const;

export const playerWeaponSpriteSheets: readonly SpriteSheetDefinition[] = weaponCatalog.flatMap((weapon) => {
  const appearance = getPlayerWeaponAppearance(weapon.id);
  return [
    {
      key: appearance.walkKey,
      path: appearance.walkPath,
      frameWidth: appearance.walkFrameSize ?? 128,
      frameHeight: appearance.walkFrameSize ?? 128,
      frames: 4,
      frameRate: 8,
      repeat: -1
    },
    {
      key: appearance.attackKey,
      path: appearance.attackPath,
      frameWidth: appearance.attackFrameSize ?? 128,
      frameHeight: appearance.attackFrameSize ?? 128,
      frames: 4,
      frameRate: 12,
      repeat: 0
    }
  ];
});

const bossAnimationIds = [
  { id: "ironBarrelBoar", slug: "iron-barrel-boar" },
  { id: "feedMountain", slug: "feed-mountain" },
  { id: "forkliftHog", slug: "forklift-hog" },
  { id: "stitchedPenBeast", slug: "stitched-pen-beast" },
  { id: "pigKing", slug: "pig-king" }
] as const;

export const bossSpriteSheets: readonly SpriteSheetDefinition[] = bossAnimationIds.flatMap((boss) => [
  {
    key: `enemy.${boss.id}.walk`,
    path: `assets/sprites/boss/${boss.slug}-walk-sheet.png`,
    frameWidth: 256,
    frameHeight: 256,
    frames: 4,
    frameRate: 7,
    repeat: -1
  },
  {
    key: `enemy.${boss.id}.attack`,
    path: `assets/sprites/boss/${boss.slug}-attack-sheet.png`,
    frameWidth: 256,
    frameHeight: 256,
    frames: 4,
    frameRate: 10,
    repeat: 0
  }
]);

export const allSpriteSheetDefinitions: readonly SpriteSheetDefinition[] = [
  animationCatalog.player.walk,
  animationCatalog.player.attack,
  animationCatalog.player.shoot,
  ...playerWeaponSpriteSheets,
  ...bossSpriteSheets,
  animationCatalog.enemy.walk,
  animationCatalog.enemy.attack,
  animationCatalog.skills.spin,
  animationCatalog.skills.saltBurst,
  animationCatalog.skills.trap
];
