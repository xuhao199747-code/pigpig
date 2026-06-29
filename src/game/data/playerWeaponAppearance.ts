export type PlayerWeaponAppearance = {
  idleKey: string;
  idlePath: string;
  walkKey: string;
  walkPath: string;
  walkFrameSize?: number;
  attackKey: string;
  attackPath: string;
  attackFrameSize?: number;
};

const appearanceCatalog: Record<string, PlayerWeaponAppearance> = {
  rustyCleaver: {
    idleKey: "player.held.rustyCleaver.idle",
    idlePath: "assets/sprites/player/held/rusty-cleaver-idle.png",
    walkKey: "player.held.rustyCleaver.walk",
    walkPath: "assets/sprites/player/held/rusty-cleaver-walk-sheet.png",
    attackKey: "player.held.rustyCleaver.attack",
    attackPath: "assets/sprites/player/held/rusty-cleaver-attack-sheet.png"
  },
  saltFrostCleaver: {
    idleKey: "player.held.saltFrostCleaver.idle",
    idlePath: "assets/sprites/player/held/salt-frost-cleaver-idle.png",
    walkKey: "player.held.saltFrostCleaver.walk",
    walkPath: "assets/sprites/player/held/salt-frost-cleaver-walk-sheet.png",
    attackKey: "player.held.saltFrostCleaver.attack",
    attackPath: "assets/sprites/player/held/salt-frost-cleaver-attack-sheet.png"
  },
  pigBoneChainsaw: {
    idleKey: "player.held.pigBoneChainsaw.idle",
    idlePath: "assets/sprites/player/held/pig-bone-chainsaw-idle.png",
    walkKey: "player.held.pigBoneChainsaw.walk",
    walkPath: "assets/sprites/player/held/pig-bone-chainsaw-walk-sheet.png",
    attackKey: "player.held.pigBoneChainsaw.attack",
    attackPath: "assets/sprites/player/held/pig-bone-chainsaw-attack-sheet.png"
  },
  duskHook: {
    idleKey: "player.held.duskHook.idle",
    idlePath: "assets/sprites/player/held/dusk-hook-idle.png",
    walkKey: "player.held.duskHook.walk",
    walkPath: "assets/sprites/player/held/dusk-hook-walk-sheet.png",
    attackKey: "player.held.duskHook.attack",
    attackPath: "assets/sprites/player/held/dusk-hook-attack-sheet.png"
  },
  dragonSlayer: {
    idleKey: "player.held.dragonSlayer.idle",
    idlePath: "assets/sprites/player/held/dragon-slayer-idle.png",
    walkKey: "player.held.dragonSlayer.walk",
    walkPath: "assets/sprites/player/held/dragon-slayer-walk-sheet.png",
    attackKey: "player.held.dragonSlayer.attack",
    attackPath: "assets/sprites/player/held/dragon-slayer-attack-sheet.png"
  }
};

export function getPlayerWeaponAppearance(weaponId: string): PlayerWeaponAppearance {
  return appearanceCatalog[weaponId] ?? appearanceCatalog.rustyCleaver;
}
