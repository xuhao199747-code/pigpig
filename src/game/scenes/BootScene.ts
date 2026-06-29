import Phaser from "phaser";

import { allSpriteSheetDefinitions } from "../data/animationCatalog";
import { slaughterhouseMap } from "../data/mapScene";
import { getPlayerWeaponAppearance } from "../data/playerWeaponAppearance";
import { weaponCatalog } from "../data/weaponCatalog";

const weaponTexturePaths: Record<string, string> = {
  rustyCleaver: "assets/sprites/weapons/rusty-cleaver.png",
  saltFrostCleaver: "assets/sprites/weapons/salt-frost-cleaver.png",
  pigBoneChainsaw: "assets/sprites/weapons/pig-bone-chainsaw.png",
  duskHook: "assets/sprites/weapons/dusk-hook.png",
  dragonSlayer: "assets/sprites/weapons/dragon-slayer.png"
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.image(slaughterhouseMap.baseTextureKey, slaughterhouseMap.baseTexturePath);
    this.load.image("ui.logo.pigDusk", "assets/ui/logo/pig-dusk-logo.png");
    this.load.image("ui.menu.startBackground", "assets/ui/menu/start-background.png");
    this.load.image("ui.icon.skillSpin", "assets/ui/icons/skill-spin.png");
    this.load.image("ui.icon.skillSalt", "assets/ui/icons/skill-salt.png");
    this.load.image("ui.icon.skillTrap", "assets/ui/icons/skill-trap.png");
    this.load.image("ui.icon.itemHook", "assets/ui/icons/item-hook.png");
    this.load.image("ui.icon.itemDash", "assets/ui/icons/item-dash.png");
    this.load.image("ui.icon.itemTorch", "assets/ui/icons/item-torch.png");
    this.load.image("player.butcher.idle", "assets/sprites/player/butcher.png");
    this.load.image("skill.spin", "assets/sprites/fx/spin-slash.png");
    this.load.image("skill.saltBurst", "assets/sprites/fx/salt-burst.png");
    this.load.image("skill.trap", "assets/sprites/fx/trap-ring.png");
    this.load.image("pickup.health", "assets/sprites/pickups/health-pack.png");
    this.load.image("pickup.stamina", "assets/sprites/pickups/stamina-pack.png");
    this.load.image("pickup.armor", "assets/sprites/pickups/armor-pack.png");

    for (const weapon of weaponCatalog) {
      this.load.image(weapon.spriteKey, weaponTexturePaths[weapon.id]);
      const appearance = getPlayerWeaponAppearance(weapon.id);
      this.load.image(appearance.idleKey, appearance.idlePath);
    }

    for (const prop of slaughterhouseMap.props) {
      this.load.image(prop.textureKey, prop.texturePath);
    }

    this.load.image("enemy.fatPig", "assets/sprites/enemies/fat-pig.png");
    this.load.image("enemy.leanPig", "assets/sprites/enemies/lean-pig.png");
    this.load.image("enemy.forkPig", "assets/sprites/enemies/fork-pig.png");
    this.load.image("enemy.helmetPig", "assets/sprites/enemies/helmet-pig.png");
    this.load.image("enemy.chargePig", "assets/sprites/enemies/charge-pig.png");
    this.load.image("enemy.feedPig", "assets/sprites/enemies/feed-pig.png");
    this.load.image("enemy.elitePenPig", "assets/sprites/enemies/elite-pen-pig.png");
    this.load.image("enemy.pigKing", "assets/sprites/boss/pig-king.png");
    this.load.image("enemy.ironBarrelBoar", "assets/sprites/boss/iron-barrel-boar.png");
    this.load.image("enemy.feedMountain", "assets/sprites/boss/feed-mountain.png");
    this.load.image("enemy.forkliftHog", "assets/sprites/boss/forklift-hog.png");
    this.load.image("enemy.stitchedPenBeast", "assets/sprites/boss/stitched-pen-beast.png");

    for (const sheet of allSpriteSheetDefinitions) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        endFrame: sheet.frames - 1
      });
    }
  }

  create(): void {
    for (const sheet of allSpriteSheetDefinitions) {
      if (this.anims.exists(sheet.key)) continue;
      this.anims.create({
        key: sheet.key,
        frames: this.anims.generateFrameNumbers(sheet.key, { start: 0, end: sheet.frames - 1 }),
        frameRate: sheet.frameRate,
        repeat: sheet.repeat
      });
    }
    this.scene.start("menu");
  }
}
