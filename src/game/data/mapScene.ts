import collisionData from "../../../assets/map/slaughterhouse-collision.json";
import propsData from "../../../assets/map/slaughterhouse-props.json";
import zonesData from "../../../assets/map/slaughterhouse-zones.json";
import type { HudRect } from "./hudLayout";

export type SceneMapDefinition = {
  baseTextureKey: string;
  baseTexturePath: string;
  playerSpawn: { x: number; y: number };
  spawnZones: Array<{ id: string; x: number; y: number; radius: number }>;
  props: Array<{ id: string; textureKey: string; texturePath: string; x: number; y: number; depth: number; width: number; height: number }>;
  blockers: Array<{ x: number; y: number; width: number; height: number }>;
};

const propDimensions: Record<string, { width: number; height: number }> = {
  "hook-rack": { width: 256, height: 256 },
  "warning-board": { width: 176, height: 176 },
  "feed-barrel": { width: 180, height: 180 },
  "neon-sign": { width: 256, height: 256 },
  "rust-barrel": { width: 180, height: 180 }
};

export const slaughterhouseMap: SceneMapDefinition = {
  baseTextureKey: "map.slaughterhouse.base",
  baseTexturePath: "assets/map/slaughterhouse-base.png",
  playerSpawn: zonesData.playerSpawn,
  spawnZones: zonesData.spawnZones,
  props: propsData.map((prop) => ({
    ...prop,
    ...propDimensions[prop.id]
  })),
  blockers: collisionData
};

export function getPropBounds(prop: SceneMapDefinition["props"][number]): HudRect {
  return {
    x: prop.x - prop.width / 2,
    y: prop.y - prop.height / 2,
    width: prop.width,
    height: prop.height
  };
}
