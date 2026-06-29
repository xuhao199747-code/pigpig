import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceDir = resolve(projectRoot, "assets");
const publicDir = resolve(projectRoot, "public");
const runtimeDir = resolve(publicDir, "assets");

mkdirSync(publicDir, { recursive: true });

if (!existsSync(sourceDir)) {
  throw new Error(`Missing source assets directory: ${sourceDir}`);
}

rmSync(runtimeDir, { recursive: true, force: true });
cpSync(sourceDir, runtimeDir, { recursive: true });

console.log(`Synced runtime assets to ${runtimeDir}`);
