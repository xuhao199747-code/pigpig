export const upgradeCatalog = [
  {
    id: "cleaverTempering",
    label: "屠刀淬炼",
    description: "主武器攻击力 +6，清猪底盘更硬。",
    kind: "stat",
    attackDamageDelta: 6
  },
  {
    id: "openRibTechnique",
    label: "开膛熟练",
    description: "暴击率 +8%，刀刀都更像在找肋缝。",
    kind: "stat",
    critChanceDelta: 0.08
  },
  {
    id: "wideButcherSpin",
    label: "旋风大案板",
    description: "屠刀旋斩范围 +35，贴脸猪群会被一起卷进刀风。",
    kind: "skill",
    requiresSkillId: "spin",
    spinRadiusDelta: 35
  },
  {
    id: "backAlleyKnifeWind",
    label: "后巷刀风",
    description: "屠刀旋斩伤害 +18，清第一圈杂猪更爽。",
    kind: "skill",
    requiresSkillId: "spin",
    spinDamageDelta: 18
  },
  {
    id: "unlockSaltBurst",
    label: "盐袋开封",
    description: "解锁盐袋爆撒（W），向前方扇形撒出伤害粗盐。",
    kind: "unlock",
    unlocksSkillId: "saltBurst"
  },
  {
    id: "coarseSalt",
    label: "粗盐增量",
    description: "盐袋爆撒范围 +35，密集猪群更容易一起腌。",
    kind: "skill",
    requiresSkillId: "saltBurst",
    saltRadiusDelta: 35
  },
  {
    id: "saltedWound",
    label: "腌透伤口",
    description: "盐袋爆撒伤害 +16，撒出去不只是调味。",
    kind: "skill",
    requiresSkillId: "saltBurst",
    saltDamageDelta: 16
  },
  {
    id: "unlockPigPenTrap",
    label: "就地搭圈",
    description: "解锁猪圈陷阱（E），困住并持续伤害附近猪群。",
    kind: "unlock",
    unlocksSkillId: "pigPenTrap"
  },
  {
    id: "penReinforcement",
    label: "猪圈加固",
    description: "猪圈陷阱持续 +1.2 秒，控场时间更宽裕。",
    kind: "skill",
    requiresSkillId: "pigPenTrap",
    trapDurationMsDelta: 1200
  },
  {
    id: "widePigPen",
    label: "扩大猪圈",
    description: "猪圈陷阱半径 +26，拦猪的口子更宽。",
    kind: "skill",
    requiresSkillId: "pigPenTrap",
    trapRadiusDelta: 26
  },
  {
    id: "barbedFence",
    label: "带刺围栏",
    description: "猪圈陷阱持续伤害 +0.12，困住也要扎得疼。",
    kind: "skill",
    requiresSkillId: "pigPenTrap",
    trapDamageDelta: 0.12
  },
  {
    id: "perfectHeat",
    label: "火候正好",
    description: "解锁灼烧效果，技能命中后追加烤肉余温。",
    kind: "skill",
    requiresSkillId: "saltBurst",
    addsBurn: true
  },
  {
    id: "bloodRush",
    label: "血气上涌",
    description: "移动速度 +25，被猪群围住时更容易钻出去。",
    kind: "stat",
    moveSpeedDelta: 25
  },
  {
    id: "piggyBankRitual",
    label: "猪罐献祭",
    description: "金币收益 +25%，越清场越会叮当响。",
    kind: "stat",
    coinGainMultiplierDelta: 0.25
  },
  {
    id: "threePackButcher",
    label: "三包补给",
    description: "生命/体力/护甲包恢复 +35%，掉包更像救命。",
    kind: "stat",
    pickupPowerMultiplierDelta: 0.35
  }
] as const;
