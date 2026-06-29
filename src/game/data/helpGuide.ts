export type HelpGuideSection = {
  id: "goal" | "controls" | "combat" | "upgrades" | "bosses" | "persistence";
  title: string;
  lines: string[];
};

export function getHelpGuideSummary(): string {
  return "清空 10 波猪潮，2 波一个 Boss，升级时获得技能和被动强化。";
}

export function createHelpGuideSections(): HelpGuideSection[] {
  return [
    {
      id: "goal",
      title: "目标",
      lines: [
        "固定屠宰场地图，清空每一波猪潮即可推进。",
        "总共 10 波，打倒最终猪王后本局胜利。"
      ]
    },
    {
      id: "controls",
      title: "操作",
      lines: [
        "方向键移动，按住 Shift 消耗体力冲刺，P 或 ESC 暂停。",
        "Q 旋斩，W 撒盐，E 猪圈陷阱；未解锁技能会显示为灰色。"
      ]
    },
    {
      id: "combat",
      title: "战斗",
      lines: [
        "屠夫会自动攻击范围内最近的猪，玩家负责走位和主动技能。",
        "不同武器有不同攻击力、攻速、范围和夸张挥舞动作。"
      ]
    },
    {
      id: "upgrades",
      title: "升级",
      lines: [
        "杀猪获得经验，升级三选一，可以花金币刷新。",
        "升级会给属性、技能强化、技能解锁；没有遗物和背包负担。"
      ]
    },
    {
      id: "bosses",
      title: "Boss",
      lines: [
        "每 2 波一个 Boss，Boss 更大、更夸张，会提前给出危险预警。",
        "冲锋、震地、召唤三类机制需要用走位和技能处理。"
      ]
    },
    {
      id: "persistence",
      title: "本地记录",
      lines: [
        "游戏会在本地保存难度、武器、最好成绩和设置。",
        "生命包、体力包、护甲包会少量掉落，靠近即可拾取。"
      ]
    }
  ];
}
