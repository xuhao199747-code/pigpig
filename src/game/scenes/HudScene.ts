import Phaser from "phaser";

import {
  characterPanelLayout,
  commandPanelLayout,
  hudLayout,
  miniMapLayout,
  modalLayout,
  runPanelLayout,
  skillBarLayout,
  statusPanelLayout,
  upgradeModalLayout
} from "../data/hudLayout";
import {
  type CharacterStatsView,
  type SkillBadgeView,
  formatCharacterStatsBlock,
  formatRunResourceLine,
  formatSkillStatus,
  formatSkillUnlockToast,
  formatWaveObjectiveLine
} from "../data/hudText";
import { createHelpGuideSections, getHelpGuideSummary } from "../data/helpGuide";
import type { WaveBanner, WaveBannerTone, WaveBriefing } from "../data/waveBriefing";
import { controlHintCopy, hudCommandCopy, pauseCopy, resultCopy, skillButtonCopy } from "../data/uiCopy";
import type { BossHudPayload, BossTelegraphWarning } from "../systems/BossHudSystem";
import { playAudioCue } from "../systems/AudioFeedbackSystem";
import { loadSettings } from "../systems/SettingsSystem";
import type { MiniMapSnapshot } from "../systems/MiniMapSystem";
import type { UpgradeChoiceKind, UpgradeChoiceTone } from "../systems/UpgradeSystem";
import type { ActiveSkillId } from "../types";
import type { WaveProgressSnapshot } from "../systems/WaveDirector";

type HudPayload = {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  maxArmor: number;
  wave: number;
  waveBriefing: WaveBriefing;
  waveProgress: WaveProgressSnapshot;
  timeMs: number;
  coins: number;
  kills: number;
  level: number;
  exp: number;
  expNeeded: number;
  characterStats: CharacterStatsView;
  skillBadges: SkillBadgeView[];
  cooldowns: Record<string, number>;
  unlockedSkills: ActiveSkillId[];
  miniMap: MiniMapSnapshot;
  paused?: boolean;
};

type LevelUpPayload = {
  level: number;
  choices: Array<{
    id: string;
    label: string;
    description: string;
    kind: UpgradeChoiceKind;
    categoryLabel: string;
    effectLine: string;
    glyph: string;
    tone: UpgradeChoiceTone;
  }>;
  rerollCost: number;
  coins: number;
};

type BarWidgets = {
  fill: Phaser.GameObjects.Rectangle;
  value: Phaser.GameObjects.Text;
  maxWidth: number;
};

type SkillSlotWidgets = {
  background: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  cooldown: Phaser.GameObjects.Text;
};

type SkillBadgeWidgets = {
  background: Phaser.GameObjects.Rectangle;
  glyph: Phaser.GameObjects.Text;
  tier: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
};

const palette = {
  blackIron: 0x120c08,
  deepWood: 0x24130c,
  rustyPanel: 0x3b2115,
  brass: 0xb87432,
  brassLight: 0xe0a65a,
  parchment: 0xd5b987,
  parchmentDark: 0x8f5f2f,
  red: 0xb83025,
  green: 0x8fa83a,
  blue: 0x2f78aa,
  gold: 0xe0a33b
} as const;

export class HudScene extends Phaser.Scene {
  private hpBar!: BarWidgets;
  private staminaBar!: BarWidgets;
  private armorBar!: BarWidgets;
  private expBar!: BarWidgets;
  private waveText!: Phaser.GameObjects.Text;
  private waveObjectiveText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private characterStatsText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private pauseButtonLabel!: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private helpOverlay?: Phaser.GameObjects.Container;
  private upgradePanel?: Phaser.GameObjects.Container;
  private resultPanel?: Phaser.GameObjects.Container;
  private bossPanel?: Phaser.GameObjects.Container;
  private bossWarningBanner?: Phaser.GameObjects.Container;
  private skillUnlockToast?: Phaser.GameObjects.Container;
  private bossBar?: BarWidgets;
  private bossNameText?: Phaser.GameObjects.Text;
  private bossPhaseText?: Phaser.GameObjects.Text;
  private waveBanner?: Phaser.GameObjects.Container;
  private upgradeErrorText?: Phaser.GameObjects.Text;
  private miniMapDots: Phaser.GameObjects.Arc[] = [];
  private skillBadgeWidgets: SkillBadgeWidgets[] = [];
  private skillCooldownLabels = new Map<ActiveSkillId, Phaser.GameObjects.Text>();
  private skillSlotWidgets = new Map<ActiveSkillId, SkillSlotWidgets>();
  private knownUnlockedSkills?: Set<ActiveSkillId>;

  constructor() {
    super("hud");
  }

  create(): void {
    this.skillCooldownLabels.clear();
    this.skillSlotWidgets.clear();
    this.knownUnlockedSkills = undefined;
    this.createFrameVignette();
    this.createStatusPanel();
    this.createRunPanel();
    this.createMiniMapPanel();
    this.createCharacterPanel();
    this.createSkillBar();
    this.createCommandButtons();

    const hint = hudLayout.hintText;
    this.hintText = this.add.text(hint.x, hint.y, controlHintCopy, {
      color: "#d89b58",
      fontSize: "15px",
      stroke: "#160c08",
      strokeThickness: 4
    });
    this.hintText.setVisible(loadSettings().controlHintsEnabled);

    const arena = this.scene.get("arena");
    arena.events.on("hud:update", this.onHudUpdate, this);
    arena.events.on("hud:levelup", this.onLevelUp, this);
    arena.events.on("hud:result", this.onResult, this);
    arena.events.on("hud:pause", this.onPause, this);
    arena.events.on("hud:wave-banner", this.onWaveBanner, this);
    arena.events.on("hud:boss:show", this.onBossShow, this);
    arena.events.on("hud:boss:update", this.onBossUpdate, this);
    arena.events.on("hud:boss:hide", this.onBossHide, this);
    arena.events.on("hud:boss:warning", this.onBossWarning, this);
    arena.events.on("hud:levelup:error", this.onLevelUpError, this);
  }

  private onHudUpdate(payload: HudPayload): void {
    const timeSeconds = Math.floor(payload.timeMs / 1000);
    const minutes = Math.floor(timeSeconds / 60).toString().padStart(2, "0");
    const seconds = (timeSeconds % 60).toString().padStart(2, "0");

    this.updateBar(this.hpBar, payload.hp, payload.maxHp);
    this.updateBar(this.staminaBar, payload.stamina, payload.maxStamina);
    this.updateBar(this.armorBar, payload.armor, payload.maxArmor);
    this.updateBar(this.expBar, payload.exp, payload.expNeeded);

    this.waveText.setText(`${payload.waveBriefing.title}  🐷  ${payload.wave}/10`);
    this.waveObjectiveText.setText(formatWaveObjectiveLine(payload.waveBriefing, payload.waveProgress));
    this.waveObjectiveText.setColor(payload.waveBriefing.isBossWave ? "#f0a15f" : "#c58b52");
    this.timeText.setText(`时间      ${minutes}:${seconds}`);
    this.coinsText.setText(formatRunResourceLine({ coins: payload.coins, kills: payload.kills }));
    this.levelText.setText(`屠夫阿黄\n等级 ${payload.level}`);
    this.characterStatsText.setText(formatCharacterStatsBlock(payload.characterStats));
    this.updateMiniMap(payload.miniMap);
    this.updateSkillBadges(payload.skillBadges);
    this.pauseButtonLabel.setText(payload.paused ? hudCommandCopy.resume : hudCommandCopy.pause);

    for (const skill of skillButtonCopy) {
      const remaining = payload.cooldowns[skill.id] ?? 0;
      const unlocked = payload.unlockedSkills.includes(skill.id);
      const widgets = this.skillSlotWidgets.get(skill.id);
      widgets?.cooldown.setText(formatSkillStatus(unlocked, remaining));
      widgets?.background.setFillStyle(unlocked ? 0x3a2015 : 0x17120e, unlocked ? 0.96 : 0.9);
      widgets?.background.setStrokeStyle(3, unlocked ? palette.brass : 0x544130);
      widgets?.icon.setAlpha(unlocked ? 1 : 0.24);
      widgets?.label.setColor(unlocked ? "#f2cf95" : "#806d55");
      widgets?.cooldown.setColor(unlocked ? "#f6c36f" : "#9c8468");
      if (unlocked && this.knownUnlockedSkills && !this.knownUnlockedSkills.has(skill.id) && widgets) {
        this.playSkillUnlockFeedback(skill.id, widgets);
      }
    }
    this.knownUnlockedSkills = new Set(payload.unlockedSkills);
  }

  private onLevelUp(payload: LevelUpPayload): void {
    this.upgradePanel?.destroy();
    this.upgradeErrorText = undefined;

    const shade = this.createModalShade();
    const panelRect = modalLayout.upgradePanel;
    const panel = this.createRivetedPanel(panelRect.x, panelRect.y, panelRect.width, panelRect.height, "升级选择", 40);
    const subtitleRect = upgradeModalLayout.subtitle;
    const subtitle = this.add.text(subtitleRect.x + subtitleRect.width / 2, subtitleRect.y + subtitleRect.height / 2, "三选一：新技能 / 技能强化 / 属性成长", {
      color: "#d9a15d",
      fontSize: "17px",
      stroke: "#20110b",
      strokeThickness: 3,
      fixedWidth: subtitleRect.width,
      align: "center"
    }).setOrigin(0.5);

    const entries = payload.choices.map((choice, index) => {
      const card = {
        ...upgradeModalLayout.firstCard,
        y: upgradeModalLayout.firstCard.y + index * (upgradeModalLayout.firstCard.height + upgradeModalLayout.cardGap)
      };
      const yOffset = card.y - upgradeModalLayout.firstCard.y;
      const centerX = card.x + card.width / 2;
      const centerY = card.y + card.height / 2;
      const tone = this.getUpgradeToneColors(choice.tone);
      const bg = this.add.rectangle(centerX, centerY, card.width, card.height, palette.parchment, 0.95)
        .setStrokeStyle(3, choice.kind === "unlock" ? palette.gold : index === 0 ? palette.brassLight : palette.parchmentDark);
      const iconRect = { ...upgradeModalLayout.icon, y: upgradeModalLayout.icon.y + yOffset };
      const icon = this.add.rectangle(iconRect.x + iconRect.width / 2, iconRect.y + iconRect.height / 2, iconRect.width, iconRect.height, tone.fill, 1)
        .setStrokeStyle(2, 0x26140d);
      const iconText = this.add.text(iconRect.x + iconRect.width / 2, iconRect.y + iconRect.height / 2, choice.glyph, {
        color: "#ffe2ad",
        fontSize: choice.kind === "unlock" ? "25px" : "28px",
        stroke: "#120805",
        strokeThickness: 4
      }).setOrigin(0.5);
      const textRect = { ...upgradeModalLayout.textColumn, y: upgradeModalLayout.textColumn.y + yOffset };
      const category = this.add.text(textRect.x, textRect.y, choice.categoryLabel, {
        color: tone.text,
        fontSize: "12px",
        fontStyle: "bold",
        fixedWidth: textRect.width
      });
      const label = this.add.text(textRect.x, textRect.y + 20, choice.label, {
        color: "#372012",
        fontSize: "20px",
        fontStyle: "bold",
        fixedWidth: textRect.width
      });
      const desc = this.add.text(textRect.x, textRect.y + 46, choice.description, {
        color: "#694326",
        fontSize: "12px",
        wordWrap: { width: textRect.width },
        fixedWidth: textRect.width
      });
      const effect = this.add.text(textRect.x, textRect.y + 78, choice.effectLine, {
        color: choice.kind === "unlock" ? "#7c3e18" : "#5b2d17",
        fontSize: "12px",
        fontStyle: "bold",
        fixedWidth: textRect.width
      });
      const metaRect = { ...upgradeModalLayout.metaColumn, y: upgradeModalLayout.metaColumn.y + yOffset };
      const stars = this.add.text(metaRect.x + metaRect.width, metaRect.y + 4, "★★★☆", {
        color: choice.kind === "unlock" ? "#8c541f" : "#49311c",
        fontSize: "18px"
      }).setOrigin(1, 0);
      const tagBg = this.add.rectangle(metaRect.x + metaRect.width - 36, metaRect.y + 48, 72, 26, 0x2d170e, 0.16)
        .setStrokeStyle(1, tone.fill, 0.44);
      const tag = this.add.text(metaRect.x + metaRect.width - 36, metaRect.y + 48, this.getUpgradeKindLabel(choice.kind), {
        color: tone.text,
        fontSize: "13px",
        fontStyle: "bold"
      }).setOrigin(0.5);
      const hit = this.add.zone(centerX, centerY, card.width, card.height).setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => bg.setFillStyle(0xead09a, 1));
      hit.on("pointerout", () => bg.setFillStyle(palette.parchment, 0.95));
      hit.on("pointerdown", () => this.selectUpgrade(choice.id));
      return [bg, icon, iconText, category, label, desc, effect, stars, tagBg, tag, hit];
    }).flat();

    const canReroll = payload.coins >= payload.rerollCost;
    const footer = upgradeModalLayout.footer;
    const reroll = this.createButton(footer.x + 94, footer.y + footer.height / 2, 188, footer.height, `重置 (${payload.rerollCost})`, () => {
      this.scene.get("arena").events.emit("upgrade:reroll");
    });
    reroll.setAlpha(canReroll ? 1 : 0.52);
    const coinText = this.add.text(footer.x + footer.width - 94, footer.y + footer.height / 2, `金币 ${payload.coins}`, {
      color: canReroll ? "#f3b64b" : "#8b7259",
      fontSize: "18px",
      stroke: "#120805",
      strokeThickness: 3
    }).setOrigin(0.5);
    const error = upgradeModalLayout.error;
    this.upgradeErrorText = this.add.text(error.x + error.width / 2, error.y + error.height / 2, "", {
      color: "#ffad86",
      fontSize: "15px",
      stroke: "#120805",
      strokeThickness: 3,
      fixedWidth: error.width,
      align: "center"
    }).setOrigin(0.5);
    this.upgradePanel = this.add.container(0, 0, [shade, panel, subtitle, ...entries, reroll, coinText, this.upgradeErrorText]).setDepth(80);

    const keys = ["ONE", "TWO", "THREE"] as const;
    keys.forEach((code, index) => {
      this.input.keyboard?.off(`keydown-${code}`);
      this.input.keyboard?.once(`keydown-${code}`, () => this.selectUpgrade(payload.choices[index].id));
    });
  }

  private onLevelUpError(payload: { message: string }): void {
    if (!this.upgradeErrorText) return;
    this.upgradeErrorText.setText(payload.message);
    this.tweens.killTweensOf(this.upgradeErrorText);
    this.upgradeErrorText.setAlpha(1);
    this.tweens.add({ targets: this.upgradeErrorText, alpha: 0.4, yoyo: true, duration: 160, repeat: 2 });
  }

  private onResult(payload: { victory: boolean; wave: number; coins: number; level: number; summaryLines?: string[] }): void {
    this.resultPanel?.destroy();
    this.waveBanner?.destroy();
    this.waveBanner = undefined;
    this.onBossHide();

    const shade = this.createModalShade();
    const panelRect = modalLayout.resultPanel;
    const panel = this.createRivetedPanel(panelRect.x, panelRect.y, panelRect.width, panelRect.height, payload.victory ? "猪王已宰" : "屠夫倒下了", 56);
    const fallbackLines = [`本局：${payload.victory ? "通关" : "战败"}`, `进度：第 ${payload.wave} 波 · 等级 ${payload.level} · ${payload.coins} 金币`];
    const resultLines = payload.summaryLines?.length ? payload.summaryLines : fallbackLines;
    const body = this.add.text(800, 408, resultLines.join("\n"), {
      color: "#f1d39b",
      fontSize: "22px",
      align: "center",
      lineSpacing: 9,
      stroke: "#140905",
      strokeThickness: 4
    }).setOrigin(0.5);
    const restart = this.createButton(710, 566, 160, 48, hudCommandCopy.restart, () => {
      this.resultPanel?.destroy();
      this.resultPanel = undefined;
      this.scene.get("arena").events.emit("game:restart");
    });
    const menu = this.createButton(890, 566, 160, 48, hudCommandCopy.menu, () => {
      this.resultPanel?.destroy();
      this.resultPanel = undefined;
      this.scene.get("arena").events.emit("game:menu");
    });
    const hint = this.add.text(800, 620, resultCopy.keyboardHint, {
      color: "#d59a5a",
      fontSize: "17px",
      stroke: "#140905",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.resultPanel = this.add.container(0, 0, [shade, panel, body, restart, menu, hint]).setDepth(100);

    this.input.keyboard?.off("keydown-R");
    this.input.keyboard?.off("keydown-ENTER");
    this.input.keyboard?.off("keydown-ESC");
    this.input.keyboard?.once("keydown-R", () => restart.emit("pointerdown"));
    this.input.keyboard?.once("keydown-ENTER", () => restart.emit("pointerdown"));
    this.input.keyboard?.once("keydown-ESC", () => menu.emit("pointerdown"));
  }

  private onWaveBanner(payload: WaveBanner): void {
    this.waveBanner?.destroy();
    const tone = this.getWaveBannerTone(payload.tone);
    const panel = this.add.rectangle(800, 180, 600, 118, 0x140a07, 0.9).setStrokeStyle(5, tone.stroke);
    const shine = this.add.rectangle(800, 130, 520, 5, tone.fill, 0.58);
    const title = this.add.text(800, 158, payload.title, {
      color: tone.title,
      fontSize: "42px",
      fontStyle: "bold",
      stroke: "#170905",
      strokeThickness: 6
    }).setOrigin(0.5);
    const subtitle = this.add.text(800, 204, payload.subtitle, {
      color: "#f1c982",
      fontSize: "21px",
      stroke: "#170905",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.waveBanner = this.add.container(0, -24, [panel, shine, title, subtitle]).setDepth(78).setAlpha(0);
    this.tweens.add({
      targets: this.waveBanner,
      alpha: 1,
      y: 0,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!this.waveBanner) return;
        this.tweens.add({
          targets: this.waveBanner,
          alpha: 0,
          y: -18,
          delay: 1300,
          duration: 360,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.waveBanner?.destroy();
            this.waveBanner = undefined;
          }
        });
      }
    });
  }

  private onBossShow(payload: BossHudPayload): void {
    this.bossPanel?.destroy();

    const panel = this.createRivetedPanel(486, 42, 628, 82).setDepth(72);
    const warning = this.add.text(800, 62, `警告：${payload.warningText}`, {
      color: "#ffd18a",
      fontSize: "24px",
      fontStyle: "bold",
      stroke: "#220b06",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.bossNameText = this.add.text(536, 98, payload.label, {
      color: "#f0c982",
      fontSize: "19px",
      fontStyle: "bold",
      stroke: "#160905",
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.bossPhaseText = this.add.text(1050, 98, payload.phaseLabel, {
      color: payload.isEnraged ? "#ffb06a" : "#c58b52",
      fontSize: "17px",
      fontStyle: "bold",
      stroke: "#160905",
      strokeThickness: 4
    }).setOrigin(1, 0.5);
    this.bossBar = this.createThinBar(668, 98, 384, 18, palette.red);
    this.bossPanel = this.add.container(0, 0, [panel, warning, this.bossNameText, this.bossPhaseText]).setDepth(72);
    this.bossPanel.add([this.bossBar.fill, this.bossBar.value]);
    this.bossPanel.setAlpha(0);
    this.tweens.add({ targets: this.bossPanel, alpha: 1, y: 8, duration: 260, ease: "Back.easeOut" });
    this.onBossUpdate(payload);
  }

  private onBossWarning(payload: BossTelegraphWarning): void {
    this.bossWarningBanner?.destroy();

    const panel = this.add.rectangle(800, 154, 440, 76, 0x190906, 0.9)
      .setStrokeStyle(4, 0xf08a45, 0.92);
    const title = this.add.text(800, 138, payload.title, {
      color: "#ffd08a",
      fontSize: "27px",
      fontStyle: "bold",
      stroke: "#180704",
      strokeThickness: 5
    }).setOrigin(0.5);
    const hint = this.add.text(800, 170, payload.hint, {
      color: "#f4b36b",
      fontSize: "18px",
      stroke: "#180704",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.bossWarningBanner = this.add.container(0, -14, [panel, title, hint]).setDepth(86).setAlpha(0);
    this.tweens.add({
      targets: this.bossWarningBanner,
      alpha: 1,
      y: 0,
      duration: 120,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (!this.bossWarningBanner) return;
        this.tweens.add({
          targets: this.bossWarningBanner,
          alpha: 0,
          y: -12,
          delay: 660,
          duration: 220,
          ease: "Cubic.easeIn",
          onComplete: () => {
            this.bossWarningBanner?.destroy();
            this.bossWarningBanner = undefined;
          }
        });
      }
    });
  }

  private getWaveBannerTone(tone: WaveBannerTone): { fill: number; stroke: number; title: string } {
    if (tone === "final") return { fill: 0xc83a24, stroke: 0xf0a15f, title: "#ffdf9a" };
    if (tone === "boss") return { fill: 0xb83025, stroke: 0xe05f32, title: "#ffd08a" };
    return { fill: palette.gold, stroke: palette.brassLight, title: "#ffe2ad" };
  }

  private onBossUpdate(payload: BossHudPayload): void {
    if (!this.bossBar || !this.bossNameText) return;
    this.bossNameText.setText(payload.label);
    this.bossNameText.setColor(payload.isEnraged ? "#ffcf8a" : "#f0c982");
    this.bossPhaseText?.setText(payload.phaseLabel);
    this.bossPhaseText?.setColor(payload.isEnraged ? "#ff8f58" : "#c58b52");
    this.bossBar.fill.setFillStyle(payload.barColor);
    this.updateBar(this.bossBar, payload.currentHealth, payload.maxHealth);
    if (payload.isEnraged && this.bossPanel) {
      this.tweens.killTweensOf(this.bossPanel);
      this.tweens.add({
        targets: this.bossPanel,
        alpha: 0.82,
        duration: 120,
        yoyo: true,
        repeat: 1,
        ease: "Sine.easeInOut"
      });
    }
  }

  private onBossHide(): void {
    this.bossWarningBanner?.destroy();
    this.bossWarningBanner = undefined;
    if (!this.bossPanel) return;
    const panel = this.bossPanel;
    this.bossPanel = undefined;
    this.bossBar = undefined;
    this.bossNameText = undefined;
    this.bossPhaseText = undefined;
    this.tweens.add({
      targets: panel,
      alpha: 0,
      y: -12,
      duration: 260,
      ease: "Cubic.easeIn",
      onComplete: () => panel.destroy()
    });
  }

  private createFrameVignette(): void {
    this.add.rectangle(800, 10, 1588, 20, 0x0d0805, 0.85).setStrokeStyle(2, 0x4c2b18);
    this.add.rectangle(800, 890, 1588, 20, 0x0d0805, 0.85).setStrokeStyle(2, 0x4c2b18);
    this.add.rectangle(10, 450, 20, 880, 0x0d0805, 0.85).setStrokeStyle(2, 0x4c2b18);
    this.add.rectangle(1590, 450, 20, 880, 0x0d0805, 0.85).setStrokeStyle(2, 0x4c2b18);
  }

  private createStatusPanel(): void {
    const panel = hudLayout.statusPanel;
    this.createRivetedPanel(panel.x, panel.y, panel.width, panel.height);
    this.hpBar = this.createStatBar(statusPanelLayout.labelX, statusPanelLayout.firstRowY, "❤", "生命", palette.red, statusPanelLayout.barWidth);
    this.staminaBar = this.createStatBar(
      statusPanelLayout.labelX,
      statusPanelLayout.firstRowY + statusPanelLayout.rowGap,
      "⚡",
      "体力",
      palette.green,
      statusPanelLayout.barWidth
    );
    this.armorBar = this.createStatBar(
      statusPanelLayout.labelX,
      statusPanelLayout.firstRowY + statusPanelLayout.rowGap * 2,
      "◆",
      "护甲",
      palette.blue,
      statusPanelLayout.barWidth
    );
  }

  private createRunPanel(): void {
    const panel = hudLayout.runPanel;
    this.createRivetedPanel(panel.x, panel.y, panel.width, panel.height);
    this.waveText = this.add.text(runPanelLayout.titleLine.x, runPanelLayout.titleLine.y, "", {
      color: "#f1c982",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#130905",
      strokeThickness: 3,
      fixedWidth: runPanelLayout.titleLine.width
    });
    this.waveObjectiveText = this.add.text(runPanelLayout.objectiveBlock.x, runPanelLayout.objectiveBlock.y, "", {
      color: "#c58b52",
      fontSize: "12px",
      stroke: "#160905",
      strokeThickness: 2,
      lineSpacing: 5,
      wordWrap: { width: runPanelLayout.objectiveBlock.width }
    });
    this.timeText = this.add.text(runPanelLayout.timeLine.x, runPanelLayout.timeLine.y, "", {
      ...this.smallHudText(),
      fontSize: "19px",
      fixedWidth: runPanelLayout.timeLine.width
    });
    this.coinsText = this.add.text(runPanelLayout.resourceLine.x, runPanelLayout.resourceLine.y, "", {
      ...this.smallHudText(),
      color: "#f4b23e",
      fontSize: "18px",
      fixedWidth: runPanelLayout.resourceLine.width
    });
  }

  private createMiniMapPanel(): void {
    const panel = hudLayout.miniMapPanel;
    const centerX = panel.x + panel.width / 2;
    const mapCenterY = panel.y + panel.height / 2 + 2;

    this.createRivetedPanel(panel.x, panel.y, panel.width, panel.height);
    this.add.text(centerX, panel.y + 18, "N", {
      color: "#d7b777",
      fontSize: "18px",
      stroke: "#0f0805",
      strokeThickness: 3
    }).setOrigin(0.5);
    const mapRect = miniMapLayout.mapRect;
    this.add.rectangle(centerX, mapCenterY, mapRect.width, mapRect.height, 0x2c261c, 0.85).setStrokeStyle(2, 0x6a5131);
    this.add.text(panel.x + panel.width - 18, mapCenterY + 4, "+\n−", {
      color: "#f0d099",
      fontSize: "24px",
      align: "center",
      stroke: "#120805",
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  private updateMiniMap(snapshot: MiniMapSnapshot): void {
    for (const dot of this.miniMapDots) dot.destroy();
    this.miniMapDots = [];

    for (const enemy of snapshot.enemies) {
      const isBoss = enemy.kind === "boss";
      const dot = this.add.circle(
        enemy.x,
        enemy.y,
        isBoss ? miniMapLayout.bossRadius : miniMapLayout.enemyRadius,
        isBoss ? 0xff5a35 : 0xde3328,
        isBoss ? 1 : 0.95
      ).setDepth(30);
      if (isBoss) dot.setStrokeStyle(2, 0xffd08a, 0.9);
      this.miniMapDots.push(dot);
    }

    this.miniMapDots.push(
      this.add.circle(snapshot.player.x, snapshot.player.y, miniMapLayout.playerRadius, 0xf0e3c2, 0.95)
        .setStrokeStyle(2, 0x24140d)
        .setDepth(31)
    );
  }

  private createCharacterPanel(): void {
    const panel = hudLayout.characterPanel;
    const internals = characterPanelLayout;
    this.createRivetedPanel(panel.x, panel.y, panel.width, panel.height);
    const portraitCenterX = panel.x + 60;
    const portraitCenterY = panel.y + 82;
    const bodyTextX = panel.x + 120;

    this.add.rectangle(portraitCenterX, portraitCenterY, 92, 92, 0x17100b, 0.95).setStrokeStyle(2, 0x8f552b);
    this.add.image(portraitCenterX, portraitCenterY, "player.butcher.idle").setDisplaySize(74, 74);
    this.levelText = this.add.text(bodyTextX, panel.y + 24, "", {
      color: "#f0c982",
      fontSize: "22px",
      lineSpacing: 8,
      stroke: "#150a06",
      strokeThickness: 4
    });
    this.expBar = this.createThinBar(internals.expBar.x, internals.expBar.y, internals.expBar.width, 14, palette.gold, "EXP");
    this.characterStatsText = this.add.text(internals.statsBlock.x, internals.statsBlock.y, "", {
      color: "#d8b179",
      fontSize: "13px",
      lineSpacing: 4,
      stroke: "#130905",
      strokeThickness: 3
    });
    this.add.text(internals.skillTitle.x, internals.skillTitle.y, "技能强化", {
      color: "#e3bd7a",
      fontSize: "17px",
      stroke: "#130905",
      strokeThickness: 3
    });
    this.skillBadgeWidgets = [];
    ["旋", "盐", "圈", "火"].forEach((label, index) => {
      const x = internals.skillGrid.x + (index % 2) * internals.skillCellStepX;
      const y = internals.skillGrid.y + Math.floor(index / 2) * internals.skillCellStepY;
      const background = this.add
        .rectangle(x, y, internals.skillCellSize, internals.skillCellSize, index === 3 ? 0x5c2018 : 0x2a2117, 0.96)
        .setStrokeStyle(2, 0x9a632e);
      const glyph = this.add.text(x, y + internals.skillGlyphOffsetY, label, {
        color: "#e8c18b",
        fontSize: `${internals.skillCellFontSize}px`,
        fontStyle: "bold",
        stroke: "#120805",
        strokeThickness: internals.skillCellStroke
      }).setOrigin(0.5);
      const tierBadge = internals.skillTierBadge;
      this.add.rectangle(
        x + tierBadge.xOffset + tierBadge.width / 2,
        y + tierBadge.yOffset + tierBadge.height / 2,
        tierBadge.width,
        tierBadge.height,
        0x120805,
        0.86
      ).setStrokeStyle(1, 0x9a632e, 0.72);
      const tier = this.add.text(x + tierBadge.xOffset + tierBadge.width / 2, y + tierBadge.yOffset + tierBadge.height / 2, "", {
        color: "#f1b554",
        fontSize: `${internals.skillTierFontSize}px`,
        fontStyle: "bold",
        stroke: "#120805",
        strokeThickness: internals.skillTierStroke
      }).setOrigin(0.5);
      const badgeLabel = this.add.text(x, y + 17, "", {
        color: "#b99262",
        fontSize: "9px",
        stroke: "#120805",
        strokeThickness: 2
      }).setOrigin(0.5);
      this.skillBadgeWidgets.push({ background, glyph, tier, label: badgeLabel });
    });
  }

  private updateSkillBadges(badges: SkillBadgeView[]): void {
    badges.forEach((badge, index) => {
      const widgets = this.skillBadgeWidgets[index];
      if (!widgets) return;
      const unlocked = badge.unlocked;
      widgets.background.setFillStyle(unlocked ? (badge.id === "burn" ? 0x5c2018 : 0x2a2117) : 0x17120e, unlocked ? 0.96 : 0.78);
      widgets.background.setStrokeStyle(2, unlocked ? 0x9a632e : 0x544130);
      widgets.glyph.setText(badge.glyph);
      widgets.glyph.setColor(unlocked ? "#e8c18b" : "#6f5e4a");
      widgets.tier.setText(unlocked && badge.tier > 0 ? `+${badge.tier}` : "");
      widgets.label.setText(badge.label);
      widgets.label.setColor(unlocked ? "#b99262" : "#6f5e4a");
    });
  }

  private createSkillBar(): void {
    const iconKeys: Record<ActiveSkillId, string> = {
      spin: "ui.icon.skillSpin",
      saltBurst: "ui.icon.skillSalt",
      pigPenTrap: "ui.icon.skillTrap"
    };
    const labels = skillButtonCopy.map((skill) => ({ ...skill, iconKey: iconKeys[skill.id] }));

    labels.forEach((slot, index) => {
      const x = skillBarLayout.slotStartX + index * skillBarLayout.slotSpacing;
      const skillId = slot.id;
      const bg = this.add
        .rectangle(x, skillBarLayout.slotCenterY, skillBarLayout.slotWidth, skillBarLayout.slotHeight, 0x3a2015, 0.96)
        .setStrokeStyle(3, palette.brass);
      this.add.rectangle(x, skillBarLayout.keyCapY, 40, 24, 0x18100b, 0.98).setStrokeStyle(2, 0xa05e2e);
      this.add.text(x, skillBarLayout.keyCapY, slot.key, {
        color: "#ffe0a4",
        fontSize: "16px",
        stroke: "#120805",
        strokeThickness: 3
      }).setOrigin(0.5);
      const icon = this.add.image(x, skillBarLayout.iconY, slot.iconKey).setDisplaySize(56, 56);
      const slotLabel = this.add
        .text(
          skillBarLayout.labelBlock.x + index * skillBarLayout.slotSpacing + skillBarLayout.labelBlock.width / 2,
          skillBarLayout.labelBlock.y,
          slot.label,
          {
            color: "#f2cf95",
            fontSize: `${skillBarLayout.labelFontSize}px`,
            fixedWidth: skillBarLayout.labelBlock.width,
            align: "center",
            stroke: "#120805",
            strokeThickness: skillBarLayout.labelStroke
          }
        )
        .setOrigin(0.5, 0.5);
      const hit = this.add.zone(x, skillBarLayout.slotCenterY, skillBarLayout.slotWidth, skillBarLayout.slotHeight).setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => bg.setFillStyle(0x5a2f18, 1));
      hit.on("pointerout", () => bg.setFillStyle(0x3a2015, 0.96));
      hit.on("pointerdown", () => this.scene.get("arena").events.emit("game:cast-skill", skillId));
      const cooldown = this.add
        .text(
          skillBarLayout.cooldownBlock.x + index * skillBarLayout.slotSpacing + skillBarLayout.cooldownBlock.width / 2,
          skillBarLayout.cooldownBlock.y,
          "就绪",
          {
            color: "#f6c36f",
            fontSize: `${skillBarLayout.cooldownFontSize}px`,
            fixedWidth: skillBarLayout.cooldownBlock.width,
            align: "center",
            stroke: "#120805",
            strokeThickness: skillBarLayout.cooldownStroke
          }
        )
        .setOrigin(0.5, 0.5);
      this.skillCooldownLabels.set(skillId, cooldown);
      this.skillSlotWidgets.set(skillId, { background: bg, icon, label: slotLabel, cooldown });
    });
  }

  private playSkillUnlockFeedback(skillId: ActiveSkillId, widgets: SkillSlotWidgets): void {
    this.tweens.add({ targets: [widgets.background, widgets.icon], alpha: 0.35, yoyo: true, repeat: 3, duration: 115 });
    this.tweens.add({
      targets: widgets.background,
      scaleX: 1.08,
      scaleY: 1.08,
      yoyo: true,
      repeat: 2,
      duration: 130,
      onComplete: () => widgets.background.setScale(1)
    });
    this.showSkillUnlockToast(skillId);
  }

  private showSkillUnlockToast(skillId: ActiveSkillId): void {
    this.skillUnlockToast?.destroy();
    const panel = this.add.rectangle(800, 650, 360, 46, 0x2b160d, 0.94)
      .setStrokeStyle(3, palette.gold, 0.95);
    const text = this.add.text(800, 650, formatSkillUnlockToast(skillId), {
      color: "#ffe0a4",
      fontSize: "20px",
      fontStyle: "bold",
      stroke: "#120805",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.skillUnlockToast = this.add.container(0, 0, [panel, text]).setDepth(90).setAlpha(0);
    this.tweens.add({
      targets: this.skillUnlockToast,
      alpha: 1,
      y: -18,
      duration: 180,
      ease: "Back.easeOut",
      onComplete: () => {
        if (!this.skillUnlockToast) return;
        this.tweens.add({
          targets: this.skillUnlockToast,
          alpha: 0,
          delay: 950,
          duration: 260,
          onComplete: () => {
            this.skillUnlockToast?.destroy();
            this.skillUnlockToast = undefined;
          }
        });
      }
    });
  }

  private createCommandButtons(): void {
    const pauseRect = commandPanelLayout.leftButton;
    const restartRect = commandPanelLayout.rightButton;
    const pause = this.createButton(
      pauseRect.x + pauseRect.width / 2,
      pauseRect.y + pauseRect.height / 2,
      pauseRect.width,
      pauseRect.height,
      hudCommandCopy.pause,
      () => {
        this.scene.get("arena").events.emit("game:toggle-pause");
      }
    );
    this.pauseButtonLabel = pause.getData("label") as Phaser.GameObjects.Text;
    this.createButton(
      restartRect.x + restartRect.width / 2,
      restartRect.y + restartRect.height / 2,
      restartRect.width,
      restartRect.height,
      hudCommandCopy.restart,
      () => {
        this.pauseOverlay?.destroy();
        this.pauseOverlay = undefined;
        this.scene.get("arena").events.emit("game:restart");
      }
    );
  }

  private onPause(payload: { paused: boolean }): void {
    this.pauseOverlay?.destroy();
    this.helpOverlay?.destroy();
    if (!payload.paused) {
      this.pauseOverlay = undefined;
      this.helpOverlay = undefined;
      return;
    }

    const shade = this.createModalShade();
    const panelRect = modalLayout.pausePanel;
    const panel = this.createRivetedPanel(panelRect.x, panelRect.y, panelRect.width, panelRect.height, "已暂停", 50);
    const resume = this.createButton(575, 478, 140, 48, hudCommandCopy.resume, () => {
      this.scene.get("arena").events.emit("game:toggle-pause");
    });
    const help = this.createButton(725, 478, 140, 48, "说明", () => this.openPauseHelp());
    const restart = this.createButton(875, 478, 140, 48, hudCommandCopy.restart, () => {
      this.pauseOverlay?.destroy();
      this.helpOverlay?.destroy();
      this.pauseOverlay = undefined;
      this.helpOverlay = undefined;
      this.scene.get("arena").events.emit("game:restart");
    });
    const menu = this.createButton(1025, 478, 140, 48, hudCommandCopy.menu, () => {
      this.pauseOverlay?.destroy();
      this.helpOverlay?.destroy();
      this.pauseOverlay = undefined;
      this.helpOverlay = undefined;
      this.scene.get("arena").events.emit("game:menu");
    });
    const hint = this.add.text(800, 536, pauseCopy.keyboardHint, {
      color: "#d59a5a",
      fontSize: "17px",
      stroke: "#120805",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.pauseOverlay = this.add.container(0, 0, [shade, panel, resume, help, restart, menu, hint]).setDepth(100);
  }

  private openPauseHelp(): void {
    this.helpOverlay?.destroy();

    const shade = this.add.rectangle(800, 450, 1600, 900, 0x050302, 0.48).setInteractive();
    const panel = this.createRivetedPanel(390, 146, 820, 608, "玩法说明", 40);
    const summary = this.add.text(800, 224, getHelpGuideSummary(), {
      color: "#d9a15d",
      fontSize: "18px",
      stroke: "#120805",
      strokeThickness: 3
    }).setOrigin(0.5);
    const sections = createHelpGuideSections().map((section, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 460 + column * 390;
      const y = 282 + row * 126;
      const bg = this.add.rectangle(x, y, 340, 94, 0x2a1710, 0.96).setStrokeStyle(2, 0x80502a);
      const title = this.add.text(x - 148, y - 35, section.title, {
        color: "#ffe0a5",
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#120805",
        strokeThickness: 4
      });
      const body = this.add.text(x - 148, y - 6, section.lines.join("\n"), {
        color: "#d8b179",
        fontSize: "13px",
        lineSpacing: 5,
        wordWrap: { width: 292 },
        stroke: "#120805",
        strokeThickness: 2
      });
      return [bg, title, body];
    }).flat();
    const close = this.createButton(800, 700, 160, 48, "关闭", () => {
      this.helpOverlay?.destroy();
      this.helpOverlay = undefined;
    });

    this.helpOverlay = this.add.container(0, 0, [shade, panel, summary, ...sections, close]).setDepth(120);
  }

  private createStatBar(
    x: number,
    y: number,
    icon: string,
    label: string,
    color: number,
    width: number
  ): BarWidgets {
    this.add.text(x - 60, y - 14, icon, {
      color: "#f2c47d",
      fontSize: "24px",
      stroke: "#120805",
      strokeThickness: 4
    });
    this.add.text(x - 24, y - 10, label, {
      color: "#e6be7d",
      fontSize: "20px",
      stroke: "#120805",
      strokeThickness: 4
    });
    return this.createThinBar(x + 64, y, width, 18, color, undefined, statusPanelLayout.valueInset);
  }

  private createThinBar(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    label?: string,
    valueInset = 8
  ): BarWidgets {
    if (label) {
      this.add.text(x - 46, y - 9, label, {
        color: "#d9a15d",
        fontSize: "15px",
        stroke: "#120805",
        strokeThickness: 3
      });
    }
    this.add.rectangle(x, y, width, height, 0x15100d, 0.95).setOrigin(0, 0.5).setStrokeStyle(2, 0x5d3b21);
    const fill = this.add.rectangle(x + 3, y, width - 6, height - 6, color, 0.95).setOrigin(0, 0.5);
    const value = this.add.text(x + width - valueInset, y, "", {
      color: "#f5d9a5",
      fontSize: `${Math.max(12, height)}px`,
      stroke: "#120805",
      strokeThickness: 3
    }).setOrigin(1, 0.5);
    return { fill, value, maxWidth: width - 6 };
  }

  private updateBar(bar: BarWidgets, value: number, max: number): void {
    const safeMax = Math.max(1, max);
    const ratio = Phaser.Math.Clamp(value / safeMax, 0, 1);
    bar.fill.width = Math.max(2, bar.maxWidth * ratio);
    bar.value.setText(`${Math.round(value)}/${Math.round(max)}`);
  }

  private createModalShade(): Phaser.GameObjects.Rectangle {
    const overlay = modalLayout.overlay;
    return this.add
      .rectangle(
        overlay.x + overlay.width / 2,
        overlay.y + overlay.height / 2,
        overlay.width,
        overlay.height,
        0x030201,
        0.62
      )
      .setInteractive();
  }

  private createRivetedPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string,
    titleSize = 24
  ): Phaser.GameObjects.Container {
    const shadow = this.add.rectangle(x + 6, y + 8, width, height, 0x050302, 0.42).setOrigin(0);
    const outer = this.add.rectangle(x, y, width, height, palette.blackIron, 0.9).setOrigin(0).setStrokeStyle(4, 0x5a3720);
    const inner = this.add.rectangle(x + 8, y + 8, width - 16, height - 16, palette.deepWood, 0.82)
      .setOrigin(0)
      .setStrokeStyle(2, palette.brass);
    const rivets = [
      this.add.circle(x + 14, y + 14, 4, 0x2b1a12, 1).setStrokeStyle(1, 0x9b6939),
      this.add.circle(x + width - 14, y + 14, 4, 0x2b1a12, 1).setStrokeStyle(1, 0x9b6939),
      this.add.circle(x + 14, y + height - 14, 4, 0x2b1a12, 1).setStrokeStyle(1, 0x9b6939),
      this.add.circle(x + width - 14, y + height - 14, 4, 0x2b1a12, 1).setStrokeStyle(1, 0x9b6939)
    ];
    const children: Phaser.GameObjects.GameObject[] = [shadow, outer, inner, ...rivets];
    if (title) {
      const plate = this.add.rectangle(x + width / 2, y + 30, Math.min(width - 44, 210), 42, 0x2f1a11, 0.95)
        .setStrokeStyle(2, palette.brass);
      const text = this.add.text(x + width / 2, y + 29, title, {
        color: "#f1c982",
        fontSize: `${titleSize}px`,
        fontStyle: "bold",
        stroke: "#130905",
        strokeThickness: 5
      }).setOrigin(0.5);
      children.push(plate, text);
    }
    return this.add.container(0, 0, children);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, width, height, 0x3b1c10, 0.96).setStrokeStyle(2, palette.brass);
    const shine = this.add.rectangle(0, -height * 0.24, width - 10, 3, 0xd28a42, 0.36);
    const buttonFontSize = Math.max(16, Math.min(20, Math.floor(height * 0.46)));
    const text = this.add.text(0, 0, label, {
      color: "#ffe2ad",
      fontSize: `${buttonFontSize}px`,
      fontStyle: "bold",
      stroke: "#1e100b",
      strokeThickness: 3
    }).setOrigin(0.5);
    const button = this.add.container(x, y, [bg, shine, text]).setSize(width, height).setInteractive({ useHandCursor: true });
    button.setData("label", text);
    button.on("pointerover", () => bg.setFillStyle(0x603018, 1));
    button.on("pointerout", () => bg.setFillStyle(0x3b1c10, 0.96));
    button.on("pointerdown", () => {
      playAudioCue(loadSettings(), "menuClick");
      onClick();
    });
    return button;
  }

  private selectUpgrade(choiceId: string): void {
    this.scene.get("arena").events.emit("upgrade:selected", choiceId);
    this.upgradePanel?.destroy();
    this.upgradePanel = undefined;
  }

  private getUpgradeToneColors(tone: UpgradeChoiceTone): { fill: number; text: string } {
    switch (tone) {
      case "blood":
        return { fill: 0x6d231d, text: "#7f2b1c" };
      case "salt":
        return { fill: 0x335345, text: "#27523c" };
      case "trap":
        return { fill: 0x3f3422, text: "#5a3d19" };
      case "blade":
      default:
        return { fill: 0x5e2d1d, text: "#6e321d" };
    }
  }

  private getUpgradeKindLabel(kind: UpgradeChoiceKind): string {
    switch (kind) {
      case "unlock":
        return "新技能";
      case "skill":
        return "技能";
      case "stat":
      default:
        return "属性";
    }
  }

  private smallHudText(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: "#f1c982",
      fontSize: "20px",
      fontStyle: "bold",
      stroke: "#130905",
      strokeThickness: 3
    };
  }
}
