import Phaser from "phaser";

import { getDifficultyConfig, type DifficultyId } from "../data/difficultyConfig";
import { getPlayerWeaponAppearance } from "../data/playerWeaponAppearance";
import { uiTheme } from "../data/uiTheme";
import { weaponCatalog, type WeaponDefinition } from "../data/weaponCatalog";
import { getWeaponCardLayout, weaponSelectLayout } from "../data/weaponSelectLayout";
import { playAudioCue } from "../systems/AudioFeedbackSystem";
import { saveSelectedWeapon } from "../systems/SaveSystem";
import { loadSettings, type GameSettings } from "../systems/SettingsSystem";
import {
  getNextWeaponSelectionIndex,
  getWeaponSelectionActionForKey,
  type WeaponSelectionDirection
} from "../systems/WeaponSelectionSystem";

type WeaponSelectData = { difficultyId?: DifficultyId };

const rarityColors: Record<WeaponDefinition["rarity"], number> = {
  common: 0xa87545,
  rare: 0x4f92a8,
  epic: 0xb06742,
  legendary: 0xe0a33b
};

const attackProfileLabels: Record<WeaponDefinition["attackProfile"], string> = {
  slash: "快速挥砍",
  heavy: "双手重劈",
  flail: "绕身甩链",
  shoot: "后坐射击"
};

export class WeaponSelectScene extends Phaser.Scene {
  private difficultyId: DifficultyId = "standard";
  private selectedWeapon: WeaponDefinition = weaponCatalog[0];
  private selectedWeaponIndex = 0;
  private preview!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private cardPanels = new Map<string, Phaser.GameObjects.Rectangle>();
  private settings: GameSettings = loadSettings();

  constructor() {
    super("weapon-select");
  }

  init(data: WeaponSelectData): void {
    this.difficultyId = getDifficultyConfig(data?.difficultyId).id;
    this.selectedWeapon = weaponCatalog[0];
    this.selectedWeaponIndex = 0;
  }

  create(): void {
    this.settings = loadSettings();
    this.focusCanvas();
    this.input.on("pointerdown", () => this.focusCanvas());
    this.add.image(800, 450, "ui.menu.startBackground").setDisplaySize(1600, 900);
    this.add.rectangle(800, 450, 1600, 900, 0x0b0604, 0.58);
    this.add.rectangle(800, 450, 1570, 870, 0x140a07, 0.22).setStrokeStyle(8, uiTheme.surface.panelStrokeDim, 0.9);
    this.add.rectangle(
      weaponSelectLayout.cardGrid.x + weaponSelectLayout.cardGrid.width / 2,
      weaponSelectLayout.cardGrid.y + weaponSelectLayout.cardGrid.height / 2,
      weaponSelectLayout.cardGrid.width + 40,
      weaponSelectLayout.cardGrid.height + 36,
      uiTheme.surface.panelFill,
      0.28
    )
      .setStrokeStyle(2, uiTheme.surface.panelStrokeDim, weaponSelectLayout.cardGridStrokeAlpha);

    this.add.text(70, 42, "开工前，挑一件趁手的", {
      color: uiTheme.text.title,
      fontSize: "44px",
      fontStyle: "bold",
      stroke: "#160a06",
      strokeThickness: 7
    });
    this.add.text(74, 98, `难度：${getDifficultyConfig(this.difficultyId).label} · 本局选定后不可更换`, {
      color: uiTheme.text.muted,
      fontSize: "20px",
      stroke: "#160a06",
      strokeThickness: 4
    });

    weaponCatalog.forEach((weapon, index) => this.createWeaponCard(weapon, index));
    this.createPreviewPanel();
    this.createButton(
      weaponSelectLayout.confirmButton.x + weaponSelectLayout.confirmButton.width / 2,
      weaponSelectLayout.confirmButton.y + weaponSelectLayout.confirmButton.height / 2,
      weaponSelectLayout.confirmButton.width,
      weaponSelectLayout.confirmButton.height,
      "携带此武器出战",
      () => this.confirmSelection()
    );
    this.createButton(
      weaponSelectLayout.backButton.x + weaponSelectLayout.backButton.width / 2,
      weaponSelectLayout.backButton.y + weaponSelectLayout.backButton.height / 2,
      weaponSelectLayout.backButton.width,
      weaponSelectLayout.backButton.height,
      "返回",
      () => this.scene.start("menu")
    );
    const hintX = weaponSelectLayout.keyboardHint.x + weaponSelectLayout.keyboardHint.width / 2;
    const hintY = weaponSelectLayout.keyboardHint.y + weaponSelectLayout.keyboardHint.height / 2;
    this.add.rectangle(hintX, hintY, weaponSelectLayout.keyboardHint.width, weaponSelectLayout.keyboardHint.height, 0x120805, 0.62)
      .setStrokeStyle(1, uiTheme.surface.panelStrokeDim, 0.54);
    this.add.text(
      hintX,
      hintY,
      "方向键选择    Enter / 空格 出战    Esc 返回",
      {
        color: uiTheme.text.body,
        fontSize: "20px",
        stroke: "#120805",
        strokeThickness: 4
      }
    ).setOrigin(0.5);

    this.registerKeyboardControls();
    this.refreshSelection();
  }

  private createWeaponCard(weapon: WeaponDefinition, index: number): void {
    const layout = getWeaponCardLayout(index);
    const x = layout.panel.x + layout.panel.width / 2;
    const y = layout.panel.y + layout.panel.height / 2;
    const panel = this.add.rectangle(x, y, layout.panel.width, layout.panel.height, uiTheme.button.disabledFill, 0.96)
      .setStrokeStyle(3, rarityColors[weapon.rarity], 0.9);
    this.cardPanels.set(weapon.id, panel);
    this.add.rectangle(
      layout.art.x + layout.art.width / 2,
      layout.art.y + layout.art.height / 2,
      layout.art.width + 34,
      layout.art.height + 12,
      0x120b08,
      0.18
    );
    this.add.image(layout.art.x + layout.art.width / 2, layout.art.y + layout.art.height / 2, weapon.spriteKey).setDisplaySize(100, 90);
    this.add.rectangle(
      layout.titleBand.x + layout.titleBand.width / 2,
      layout.titleBand.y + layout.titleBand.height / 2,
      layout.titleBand.width,
      layout.titleBand.height,
      0x120b08,
      0.94
    );
    this.add.text(layout.titleText.x + layout.titleText.width / 2, layout.titleText.y + layout.titleText.height / 2, weapon.label, {
      color: uiTheme.text.primary,
      fontSize: weapon.label.length > 7 ? "16px" : "19px",
      fontStyle: "bold",
      stroke: "#120805",
      strokeThickness: 4
    }).setOrigin(0.5);
    const hit = this.add.zone(x, y, layout.panel.width, layout.panel.height).setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => panel.setFillStyle(0x472517, 1));
    hit.on("pointerout", () => this.refreshSelection());
    hit.on("pointerdown", () => {
      this.playMenuClick();
      this.selectWeapon(index);
    });
  }

  private createPreviewPanel(): void {
    const panel = weaponSelectLayout.previewPanel;
    const panelCenterX = panel.x + panel.width / 2;
    const panelCenterY = panel.y + panel.height / 2;
    this.add.rectangle(panelCenterX + 10, panelCenterY + 12, panel.width, panel.height, 0x050302, 0.36);
    this.add.rectangle(panelCenterX, panelCenterY, panel.width, panel.height, uiTheme.surface.panelFill, 0.96).setStrokeStyle(5, uiTheme.surface.panelStroke);
    this.add.rectangle(
      weaponSelectLayout.titleDivider.x + weaponSelectLayout.titleDivider.width / 2,
      weaponSelectLayout.titleDivider.y + weaponSelectLayout.titleDivider.height / 2,
      weaponSelectLayout.titleDivider.width,
      weaponSelectLayout.titleDivider.height,
      uiTheme.surface.panelStroke,
      0.28
    );
    this.add.rectangle(
      weaponSelectLayout.statsBox.x + weaponSelectLayout.statsBox.width / 2,
      weaponSelectLayout.statsBox.y + weaponSelectLayout.statsBox.height / 2,
      weaponSelectLayout.statsBox.width,
      weaponSelectLayout.statsBox.height,
      0x120805,
      0.36
    ).setStrokeStyle(1, uiTheme.surface.panelStrokeDim, 0.28);
    this.add.rectangle(
      weaponSelectLayout.descriptionBox.x + weaponSelectLayout.descriptionBox.width / 2,
      weaponSelectLayout.descriptionBox.y + weaponSelectLayout.descriptionBox.height / 2,
      weaponSelectLayout.descriptionBox.width,
      weaponSelectLayout.descriptionBox.height,
      0x120805,
      0.24
    ).setStrokeStyle(1, uiTheme.surface.panelStrokeDim, 0.18);
    this.add.text(panelCenterX, panel.y + 46, "本局武器", {
      color: uiTheme.text.title,
      fontSize: "25px",
      stroke: "#120805",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.preview = this.add.image(
      weaponSelectLayout.previewImage.x + weaponSelectLayout.previewImage.width / 2,
      weaponSelectLayout.previewImage.y + weaponSelectLayout.previewImage.height / 2,
      getPlayerWeaponAppearance(this.selectedWeapon.id).idleKey
    ).setDisplaySize(170, 170);
    this.titleText = this.add.text(
      weaponSelectLayout.title.x + weaponSelectLayout.title.width / 2,
      weaponSelectLayout.title.y + weaponSelectLayout.title.height / 2,
      "",
      {
        color: "#ffd58b",
        fontSize: "34px",
        fontStyle: "bold",
        stroke: "#120805",
        strokeThickness: 5
      }
    ).setOrigin(0.5);
    this.statsText = this.add.text(weaponSelectLayout.stats.x, weaponSelectLayout.stats.y, "", {
      color: uiTheme.text.body,
      fontSize: "18px",
      lineSpacing: 5,
      stroke: "#120805",
      strokeThickness: 3
    });
    this.descriptionText = this.add.text(weaponSelectLayout.description.x, weaponSelectLayout.description.y, "", {
      color: uiTheme.text.muted,
      fontSize: "18px",
      wordWrap: { width: weaponSelectLayout.description.width },
      stroke: "#120805",
      strokeThickness: 3
    });
  }

  private refreshSelection(): void {
    for (const weapon of weaponCatalog) {
      const selected = weapon.id === this.selectedWeapon.id;
      this.cardPanels.get(weapon.id)?.setFillStyle(selected ? 0x5a2d18 : 0x24150f, selected ? 1 : 0.96)
        .setStrokeStyle(selected ? 6 : 3, selected ? 0xf0b354 : rarityColors[weapon.rarity], 1);
    }
    if (!this.preview) return;
    this.preview.setTexture(getPlayerWeaponAppearance(this.selectedWeapon.id).idleKey).setDisplaySize(170, 170);
    this.titleText.setText(this.selectedWeapon.label);
    this.statsText.setText([
      `攻击力       ${this.selectedWeapon.attackDamage}`,
      `攻击速度     ${(1000 / this.selectedWeapon.attackRateMs).toFixed(2)} 次/秒`,
      `攻击范围     ${this.selectedWeapon.range}`,
      `暴击加成     ${Math.round(this.selectedWeapon.critChanceBonus * 100)}%`,
      `攻击方式     ${attackProfileLabels[this.selectedWeapon.attackProfile]}`
    ]);
    this.descriptionText.setText(this.selectedWeapon.description);
  }

  private createButton(x: number, y: number, width: number, height: number, label: string, action: () => void): void {
    const shadow = this.add.rectangle(x + 4, y + 6, width, height, 0x050302, 0.38);
    const bg = this.add.rectangle(x, y, width, height, uiTheme.button.primaryFill, 0.98).setStrokeStyle(4, uiTheme.button.stroke);
    this.add.rectangle(x, y - height * 0.25, width - 20, 7, 0xf0b354, 0.16);
    this.add.text(x, y, label, {
      color: uiTheme.text.primary,
      fontSize: "25px",
      fontStyle: "bold",
      stroke: "#1b0d08",
      strokeThickness: 5
    }).setOrigin(0.5);
    const hit = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => {
      bg.setFillStyle(uiTheme.button.hoverFill, 1);
      shadow.setAlpha(0.5);
    });
    hit.on("pointerout", () => {
      bg.setFillStyle(uiTheme.button.primaryFill, 0.98);
      shadow.setAlpha(1);
    });
    hit.on("pointerdown", () => {
      this.playMenuClick();
      action();
    });
  }

  private playMenuClick(): void {
    playAudioCue(this.settings, "menuClick");
  }

  private selectWeapon(index: number): void {
    const safeIndex = Math.max(0, Math.min(weaponCatalog.length - 1, index));
    this.selectedWeaponIndex = safeIndex;
    this.selectedWeapon = weaponCatalog[safeIndex];
    this.refreshSelection();
  }

  private moveSelection(direction: WeaponSelectionDirection): void {
    this.playMenuClick();
    this.selectWeapon(getNextWeaponSelectionIndex({
      currentIndex: this.selectedWeaponIndex,
      direction,
      itemCount: weaponCatalog.length,
      columns: 3
    }));
  }

  private confirmSelection(): void {
    saveSelectedWeapon(globalThis.localStorage, this.selectedWeapon.id);
    this.scene.start("arena", { difficultyId: this.difficultyId, weaponId: this.selectedWeapon.id });
  }

  private registerKeyboardControls(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const action = getWeaponSelectionActionForKey({ key: event.key, code: event.code });
      if (!action) return;
      event.preventDefault();
      if (action === "confirm") {
        this.confirmSelection();
        return;
      }
      if (action === "back") {
        this.scene.start("menu");
        return;
      }
      this.moveSelection(action);
    });
  }

  private focusCanvas(): void {
    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    canvas.focus();
  }
}
