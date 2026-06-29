import Phaser from "phaser";

import { createGameConfig } from "./game/config/gameConfig";
import { installFullscreenControls } from "./game/systems/FullscreenSystem";
import "./styles.css";

new Phaser.Game(createGameConfig());

const gameRoot = document.getElementById("app");
if (gameRoot) installFullscreenControls(gameRoot);
