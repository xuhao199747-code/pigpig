import Phaser from "phaser";

import { ArenaScene } from "../scenes/ArenaScene";
import { gameFrameConfig } from "./gameConstants";
import { BootScene } from "../scenes/BootScene";
import { HudScene } from "../scenes/HudScene";
import { MenuScene } from "../scenes/MenuScene";
import { WeaponSelectScene } from "../scenes/WeaponSelectScene";

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "app",
    width: gameFrameConfig.width,
    height: gameFrameConfig.height,
    backgroundColor: "#120a08",
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [BootScene, MenuScene, WeaponSelectScene, ArenaScene, HudScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };
}
