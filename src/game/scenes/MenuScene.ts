import Phaser from "phaser";

import {
  createBossCodexEntries,
  createEnemyCodexEntries,
  createWeaponCodexEntries,
  getCodexCategorySummary,
  type CodexCategory,
  type CodexEntry
} from "../data/codexCatalog";
import { difficultyCatalog, type DifficultyId } from "../data/difficultyConfig";
import { createHelpGuideSections, getHelpGuideSummary, type HelpGuideSection } from "../data/helpGuide";
import { menuHomeLayout, menuModalLayout } from "../data/menuLayout";
import { uiTheme } from "../data/uiTheme";
import { getClearSaveButtonState, getContinueButtonState, menuCopy } from "../data/uiCopy";
import { playAudioCue } from "../systems/AudioFeedbackSystem";
import { flattenModalChildren } from "../systems/ModalSimulationSystem";
import { loadSettings, toggleSetting, type GameSettingKey, type GameSettings } from "../systems/SettingsSystem";
import { clearSave, createContinueRunData, createSaveSummaryText, hasClearableSaveData, loadSave, saveSelectedDifficulty, type GameSave } from "../systems/SaveSystem";

export class MenuScene extends Phaser.Scene {
  private selectedDifficultyId: DifficultyId = "standard";
  private save!: GameSave;
  private settings!: GameSettings;
  private difficultyLabels: Phaser.GameObjects.Text[] = [];
  private settingsPanel?: Phaser.GameObjects.Container;
  private codexPanel?: Phaser.GameObjects.Container;
  private helpPanel?: Phaser.GameObjects.Container;
  private codexCategory: CodexCategory = "enemies";
  private clearSaveConfirmationArmed = false;

  constructor() {
    super("menu");
  }

  create(): void {
    this.save = loadSave();
    this.settings = loadSettings();
    this.selectedDifficultyId = this.save.lastDifficultyId;
    this.focusCanvas();
    this.input.on("pointerdown", () => this.focusCanvas());

    this.add.image(800, 450, "ui.menu.startBackground").setDisplaySize(1600, 900);
    this.add.rectangle(800, 450, 1600, 900, uiTheme.surface.screenVignette, 0.22);
    this.add.rectangle(210, 450, 420, 900, 0x050302, 0.24);
    this.add.rectangle(1390, 450, 420, 900, 0x050302, 0.24);
    this.add.rectangle(800, 450, 1600, 900, 0x000000, 0)
      .setStrokeStyle(22, 0x0d0805, 0.78);
    const hero = menuHomeLayout.heroPanel;
    this.add.rectangle(hero.x + hero.width / 2, hero.y + hero.height / 2 + 10, hero.width + 26, hero.height + 26, 0x050302, 0.36)
      .setStrokeStyle(2, 0x2b160d, 0.78);
    this.add.rectangle(hero.x + hero.width / 2, hero.y + hero.height / 2, hero.width, hero.height, uiTheme.surface.panelFill, 0.48)
      .setStrokeStyle(5, uiTheme.surface.panelStrokeDim, 0.86);
    this.add.rectangle(hero.x + hero.width / 2, hero.y + hero.height - 100, hero.width - 92, 152, 0x100704, 0.22)
      .setStrokeStyle(1, 0x6f4022, 0.34);

    const logo = this.add.image(800, 248, "ui.logo.pigDusk").setDisplaySize(760, 324);

    const subtitleRect = menuHomeLayout.subtitle;
    const subtitle = this.add.text(subtitleRect.x + subtitleRect.width / 2, subtitleRect.y + subtitleRect.height / 2, menuCopy.subtitle, {
      color: uiTheme.text.primary,
      fontSize: "24px",
      stroke: "#1b0d08",
      strokeThickness: 4,
      fixedWidth: subtitleRect.width,
      align: "center"
    });
    subtitle.setOrigin(0.5);

    const startButton = this.createButton(710, 520, 220, 66, menuCopy.primaryAction, () => this.startRun());
    const continueState = getContinueButtonState(Boolean(this.save.activeRun), this.save.runCount > 0);
    const continueButton = this.createButton(950, 520, 220, 66, continueState.label, () => {
      if (continueState.enabled) this.continueRun();
    });
    continueButton.setAlpha(continueState.enabled ? 1 : 0.44);
    this.createDifficultySelector();
    this.createSaveSummary();
    this.createButton(600, menuHomeLayout.utilityButtons.y + menuHomeLayout.utilityButtons.height / 2, 156, 46, "图鉴", () => this.openCodexPanel());
    this.createButton(800, menuHomeLayout.utilityButtons.y + menuHomeLayout.utilityButtons.height / 2, 156, 46, "说明", () => this.openHelpPanel());
    this.createButton(1000, menuHomeLayout.utilityButtons.y + menuHomeLayout.utilityButtons.height / 2, 156, 46, "设置", () => this.openSettingsPanel());

    const hint = this.add.text(800, menuHomeLayout.keyboardHint.y + menuHomeLayout.keyboardHint.height / 2, menuCopy.keyboardHint, {
      color: "#d98b4b",
      fontSize: "24px",
      stroke: "#1e100b",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 700
    });
    this.tweens.add({
      targets: [logo, subtitle],
      y: "-=6",
      yoyo: true,
      repeat: -1,
      duration: 1900,
      ease: "Sine.easeInOut"
    });

    this.input.keyboard?.once("keydown-SPACE", () => this.startRun());
    this.input.keyboard?.once("keydown-ENTER", () => this.startRun());
    this.input.keyboard?.once("keydown-W", () => this.startRun());
    startButton.setData("menu-action", "start");
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const shadow = this.add.rectangle(4, 6, width, height, 0x060302, 0.38);
    const bg = this.add.rectangle(0, 0, width, height, uiTheme.button.primaryFill, 0.96).setStrokeStyle(4, uiTheme.button.stroke);
    const shine = this.add.rectangle(0, -height * 0.26, width - 16, 8, 0xf0b354, 0.18);
    const text = this.add.text(0, 0, label, {
      color: uiTheme.text.primary,
      fontSize: "34px",
      stroke: "#1b0d08",
      strokeThickness: 5
    }).setOrigin(0.5);
    const button = this.add.container(x, y, [shadow, bg, shine, text]).setSize(width, height).setInteractive({ useHandCursor: true });
    button.setData("label", text);

    button.on("pointerover", () => {
      bg.setFillStyle(uiTheme.button.hoverFill, 1);
      button.setScale(1.025);
    });
    button.on("pointerout", () => {
      bg.setFillStyle(uiTheme.button.primaryFill, 0.96);
      button.setScale(1);
    });
    button.on("pointerdown", () => {
      this.focusCanvas();
      this.playMenuClick();
      onClick();
    });

    return button;
  }

  private createDifficultySelector(): void {
    this.add.text(800, menuHomeLayout.difficultyTitle.y + menuHomeLayout.difficultyTitle.height / 2, "难度选择", {
      color: uiTheme.text.title,
      fontSize: "24px",
      fontStyle: "bold",
      stroke: "#150905",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.difficultyLabels = difficultyCatalog.map((difficulty, index) => {
      const x = 518 + index * 188;
      const y = menuHomeLayout.difficultyCards.y + menuHomeLayout.difficultyCards.height / 2;
      const bg = this.add.rectangle(x, y, 168, 70, uiTheme.button.secondaryFill, 0.94).setStrokeStyle(2, 0x8f552b);
      this.add.rectangle(x, y - 25, 142, 3, 0xf0b354, 0.16);
      const label = this.add.text(x, y - 17, difficulty.label, {
        color: uiTheme.text.primary,
        fontSize: "22px",
        fontStyle: "bold",
        stroke: "#160905",
        strokeThickness: 4
      }).setOrigin(0.5);
      this.add.text(x, y + 16, difficulty.description, {
        color: uiTheme.text.muted,
        fontSize: "13px",
        align: "center",
        wordWrap: { width: 142 },
        stroke: "#160905",
        strokeThickness: 2
      }).setOrigin(0.5);
      const hit = this.add.zone(x, y, 168, 70).setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => bg.setFillStyle(uiTheme.button.hoverFill, 0.96));
      hit.on("pointerout", () => this.refreshDifficultySelector());
      hit.on("pointerdown", () => {
        this.selectedDifficultyId = difficulty.id;
        this.refreshDifficultySelector();
      });
      label.setData("panel", bg);
      return label;
    });
    this.refreshDifficultySelector();
  }

  private refreshDifficultySelector(): void {
    this.difficultyLabels.forEach((label, index) => {
      const difficulty = difficultyCatalog[index];
      const isSelected = difficulty.id === this.selectedDifficultyId;
      const panel = label.getData("panel") as Phaser.GameObjects.Rectangle;
      panel.setStrokeStyle(isSelected ? 4 : 2, isSelected ? uiTheme.button.selectedStroke : 0x8f552b);
      panel.setFillStyle(isSelected ? uiTheme.button.primaryFill : uiTheme.button.secondaryFill, isSelected ? 1 : 0.94);
      label.setColor(isSelected ? "#fff0bd" : uiTheme.text.primary);
    });
  }

  private createSaveSummary(): void {
    const summary = createSaveSummaryText(this.save);
    const y = menuHomeLayout.saveSummary.y + menuHomeLayout.saveSummary.height / 2;
    this.add.rectangle(800, y, 520, 30, 0x120805, 0.62).setStrokeStyle(1, 0x6f4022, 0.44);
    this.add.text(800, y, summary, {
      color: uiTheme.text.muted,
      fontSize: "18px",
      stroke: "#150905",
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  private openCodexPanel(category: CodexCategory = this.codexCategory): void {
    this.codexCategory = category;
    this.codexPanel?.destroy();
    this.helpPanel?.destroy();
    this.settingsPanel?.destroy();

    const entries = this.getCodexEntries(category);
    const shade = this.add.rectangle(800, 450, 1600, 900, 0x050302, 0.62).setInteractive();
    const panel = this.add.rectangle(800, 456, 1040, 650, 0x1b0f0a, 0.98).setStrokeStyle(5, 0xb06d35);
    const titlePlate = this.add.rectangle(800, 172, 300, 54, 0x321a10, 0.98).setStrokeStyle(2, 0xd08b44);
    const title = this.add.text(800, 170, "屠宰场图鉴", {
      color: "#f3c982",
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 5
    }).setOrigin(0.5);
    const summary = this.add.text(800, 218, getCodexCategorySummary(category), {
      color: "#c58b52",
      fontSize: "18px",
      stroke: "#130805",
      strokeThickness: 3
    }).setOrigin(0.5);

    const tabs = [
      this.createCodexTab(580, 272, "小猪", "enemies"),
      this.createCodexTab(800, 272, "Boss", "bosses"),
      this.createCodexTab(1020, 272, "武器", "weapons")
    ];
    const cards = entries.map((entry, index) => this.createCodexCard(entry, index)).flat();
    const close = this.createButton(800, 740, 170, 52, "关闭", () => {
      this.codexPanel?.destroy();
      this.codexPanel = undefined;
      this.focusCanvas();
    });

    this.codexPanel = this.add.container(0, 0, [shade, panel, titlePlate, title, summary, ...tabs, ...cards, close]).setDepth(190);
  }

  private createCodexTab(x: number, y: number, label: string, category: CodexCategory): Phaser.GameObjects.GameObject[] {
    const selected = category === this.codexCategory;
    const bg = this.add.rectangle(x, y, 166, 42, selected ? 0x6a3219 : 0x2a1710, 0.98)
      .setStrokeStyle(selected ? 4 : 2, selected ? 0xf0b354 : 0x80502a);
    const text = this.add.text(x, y, label, {
      color: selected ? "#fff0bd" : "#d8ad74",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 4
    }).setOrigin(0.5);
    const hit = this.add.zone(x, y, 166, 42).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => {
      this.playMenuClick();
      this.openCodexPanel(category);
    });
    return [bg, text, hit];
  }

  private createCodexCard(entry: CodexEntry, index: number): Phaser.GameObjects.GameObject[] {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 400 + column * 300;
    const y = 360 + row * 136;
    const bg = this.add.rectangle(x, y, 270, 112, 0x2a1710, 0.95).setStrokeStyle(2, 0x80502a);
    const iconFrame = this.add.rectangle(x - 96, y - 12, 70, 70, 0x140b08, 0.98).setStrokeStyle(2, 0xb06d35);
    const icon = this.add.image(x - 96, y - 12, entry.textureKey).setDisplaySize(58, 58);
    const title = this.add.text(x - 48, y - 48, entry.title, {
      color: "#ffe0a5",
      fontSize: entry.title.length > 6 ? "17px" : "20px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 4
    });
    const subtitle = this.add.text(x - 48, y - 22, entry.subtitle, {
      color: "#d49a5e",
      fontSize: "13px",
      stroke: "#130805",
      strokeThickness: 2
    });
    const stats = this.add.text(x - 48, y + 2, entry.stats, {
      color: "#e5c088",
      fontSize: "12px",
      stroke: "#130805",
      strokeThickness: 2
    });
    const trait = this.add.text(x - 126, y + 32, entry.trait, {
      color: "#b98758",
      fontSize: "12px",
      wordWrap: { width: 242 },
      stroke: "#130805",
      strokeThickness: 2
    });
    return [bg, iconFrame, icon, title, subtitle, stats, trait];
  }

  private getCodexEntries(category: CodexCategory): CodexEntry[] {
    if (category === "bosses") return createBossCodexEntries();
    if (category === "weapons") return createWeaponCodexEntries();
    return createEnemyCodexEntries();
  }

  private openHelpPanel(): void {
    this.helpPanel?.destroy();
    this.settingsPanel?.destroy();
    this.codexPanel?.destroy();

    const shade = this.add.rectangle(800, 450, 1600, 900, 0x050302, 0.62).setInteractive();
    const panel = this.add.rectangle(800, 456, 980, 620, 0x1b0f0a, 0.98).setStrokeStyle(5, 0xb06d35);
    const titlePlate = this.add.rectangle(800, 172, 300, 54, 0x321a10, 0.98).setStrokeStyle(2, 0xd08b44);
    const title = this.add.text(800, 170, "玩法说明", {
      color: "#f3c982",
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 5
    }).setOrigin(0.5);
    const summary = this.add.text(800, 222, getHelpGuideSummary(), {
      color: "#d59a5a",
      fontSize: "19px",
      stroke: "#130805",
      strokeThickness: 3
    }).setOrigin(0.5);

    const cards = createHelpGuideSections().map((section, index) => this.createHelpCard(section, index)).flat();
    const close = this.createButton(800, 736, 170, 52, "关闭", () => {
      this.helpPanel?.destroy();
      this.helpPanel = undefined;
      this.focusCanvas();
    });

    this.helpPanel = this.add.container(0, 0, [shade, panel, titlePlate, title, summary, ...cards, close]).setDepth(195);
  }

  private createHelpCard(section: HelpGuideSection, index: number): Phaser.GameObjects.GameObject[] {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 560 + column * 480;
    const y = 318 + row * 128;
    const bg = this.add.rectangle(x, y, 430, 100, 0x2a1710, 0.95).setStrokeStyle(2, 0x80502a);
    const title = this.add.text(x - 188, y - 38, section.title, {
      color: "#ffe0a5",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 4
    });
    const body = this.add.text(x - 188, y - 6, section.lines.join("\n"), {
      color: "#d9ad72",
      fontSize: "14px",
      lineSpacing: 6,
      wordWrap: { width: 372 },
      stroke: "#130805",
      strokeThickness: 2
    });
    return [bg, title, body];
  }

  private openSettingsPanel(): void {
    this.settingsPanel?.destroy();
    this.helpPanel?.destroy();
    this.codexPanel?.destroy();
    this.clearSaveConfirmationArmed = false;

    const overlay = menuModalLayout.overlay;
    const panelRect = menuModalLayout.settingsPanel;
    const shade = this.add
      .rectangle(overlay.x + overlay.width / 2, overlay.y + overlay.height / 2, overlay.width, overlay.height, 0x050302, 0.66)
      .setInteractive();
    shade.on("pointerdown", () => this.closeSettingsPanel());

    const panelCenterX = panelRect.x + panelRect.width / 2;
    const panelCenterY = panelRect.y + panelRect.height / 2;
    const panel = this.add.rectangle(panelCenterX, panelCenterY, panelRect.width, panelRect.height, 0x1c100b, 0.98).setStrokeStyle(5, 0xb06d35);
    const innerPanel = this.add.rectangle(panelCenterX, panelCenterY + 6, panelRect.width - 28, panelRect.height - 28, 0x24130c, 0.72)
      .setStrokeStyle(2, 0x7d4b27);
    const panelBlocker = this.add.zone(panelCenterX, panelCenterY, panelRect.width, panelRect.height).setInteractive();
    const titlePlate = this.add.rectangle(800, 226, 250, 54, 0x321a10, 0.98).setStrokeStyle(2, 0xd08b44);
    const title = this.add.text(800, 224, "设置", {
      color: "#f3c982",
      fontSize: "34px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 5
    }).setOrigin(0.5);
    const closeRect = menuModalLayout.settingsCloseButton;
    const topClose = this.createButton(
      closeRect.x + closeRect.width / 2,
      closeRect.y + closeRect.height / 2,
      closeRect.width,
      closeRect.height,
      "X",
      () => this.closeSettingsPanel()
    );
    const rows = [
      this.createSettingRow(800, 340, "音效", "按钮、挥砍、拾取、升级都会有短促反馈", "soundEnabled"),
      this.createSettingRow(800, 425, "震屏", "受击、Boss 落地和死亡爆裂时增强冲击", "screenShakeEnabled"),
      this.createSettingRow(800, 510, "操作提示", "显示方向键 / QWE 技能提示", "controlHintsEnabled")
    ];
    const hasSaveData = hasClearableSaveData(this.save);
    const clearState = getClearSaveButtonState(hasSaveData, this.clearSaveConfirmationArmed);
    const clearRect = menuModalLayout.settingsClearButton;
    const clear = this.createButton(
      clearRect.x + clearRect.width / 2,
      clearRect.y + clearRect.height / 2,
      clearRect.width,
      clearRect.height,
      clearState.label,
      () => this.onClearSaveClicked(clear)
    );
    clear.setAlpha(clearState.enabled ? 1 : 0.5);
    const closeRectBottom = menuModalLayout.settingsFooterCloseButton;
    const close = this.createButton(
      closeRectBottom.x + closeRectBottom.width / 2,
      closeRectBottom.y + closeRectBottom.height / 2,
      closeRectBottom.width,
      closeRectBottom.height,
      "关闭",
      () => this.closeSettingsPanel()
    );

    this.input.keyboard?.off("keydown-ESC");
    this.input.keyboard?.once("keydown-ESC", () => this.closeSettingsPanel());
    this.settingsPanel = this.add.container(0, 0, flattenModalChildren([
      shade,
      panel,
      innerPanel,
      panelBlocker,
      titlePlate,
      title,
      topClose,
      ...rows,
      clear,
      close
    ])).setDepth(200);
  }

  private closeSettingsPanel(): void {
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.focusCanvas();
  }

  private onClearSaveClicked(button: Phaser.GameObjects.Container): void {
    if (!hasClearableSaveData(this.save)) return;
    if (!this.clearSaveConfirmationArmed) {
      this.clearSaveConfirmationArmed = true;
      const state = getClearSaveButtonState(true, true);
      const label = button.getData("label") as Phaser.GameObjects.Text;
      label.setText(state.label);
      return;
    }

    clearSave(globalThis.localStorage);
    this.scene.restart();
  }

  private createSettingRow(
    x: number,
    y: number,
    label: string,
    description: string,
    key: GameSettingKey
  ): Phaser.GameObjects.GameObject[] {
    const bg = this.add.rectangle(x, y, 468, 64, 0x2a1710, 0.96).setStrokeStyle(2, 0x80502a);
    const labelText = this.add.text(x - 210, y - 15, label, {
      color: "#ffe0a5",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 4
    });
    const descText = this.add.text(x - 210, y + 13, description, {
      color: "#c58b52",
      fontSize: "13px",
      stroke: "#130805",
      strokeThickness: 2
    });
    const switchBg = this.add.rectangle(x + 172, y, 92, 36, this.settings[key] ? 0x71411d : 0x231813, 1)
      .setStrokeStyle(2, this.settings[key] ? 0xe0a45a : 0x705138);
    const switchText = this.add.text(x + 172, y, this.settings[key] ? "开启" : "关闭", {
      color: this.settings[key] ? "#ffe7b0" : "#a58a6c",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#130805",
      strokeThickness: 3
    }).setOrigin(0.5);
    const hit = this.add.zone(x, y, 468, 64).setInteractive({ useHandCursor: true });
    hit.on("pointerdown", () => {
      this.playMenuClick();
      this.settings = toggleSetting(globalThis.localStorage, key);
      switchBg.setFillStyle(this.settings[key] ? 0x71411d : 0x231813, 1)
        .setStrokeStyle(2, this.settings[key] ? 0xe0a45a : 0x705138);
      switchText.setText(this.settings[key] ? "开启" : "关闭")
        .setColor(this.settings[key] ? "#ffe7b0" : "#a58a6c");
    });
    return [bg, labelText, descText, switchBg, switchText, hit];
  }

  private focusCanvas(): void {
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus();
  }

  private playMenuClick(): void {
    playAudioCue(this.settings, "menuClick");
  }

  private startRun(): void {
    saveSelectedDifficulty(globalThis.localStorage, this.selectedDifficultyId);
    this.scene.stop("hud");
    this.scene.start("weapon-select", { difficultyId: this.selectedDifficultyId });
  }

  private continueRun(): void {
    const runData = createContinueRunData(this.save);
    this.selectedDifficultyId = runData.difficultyId;
    this.scene.stop("hud");
    this.scene.start("arena", runData);
  }
}
