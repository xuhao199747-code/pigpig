export const menuCopy = {
  title: "猪猪黄昏",
  subtitle: "屠夫黄昏守场，砍翻整座猪圈。",
  primaryAction: "开始",
  keyboardHint: "按空格或点击开始"
} as const;

export const hudCommandCopy = {
  pause: "暂停",
  resume: "继续",
  restart: "重开",
  menu: "主菜单"
} as const;

export const resultCopy = {
  keyboardHint: "R / Enter 重开    Esc 返回主菜单"
} as const;

export const pauseCopy = {
  keyboardHint: "P / Esc 继续    可返回主菜单"
} as const;

export const skillButtonCopy = [
  { key: "Q", label: "旋斩", id: "spin" },
  { key: "W", label: "撒盐", id: "saltBurst" },
  { key: "E", label: "陷阱", id: "pigPenTrap" }
] as const;

export const controlHintCopy = "方向键移动 · Q/W/E 技能";

export function getClearSaveButtonState(hasSave: boolean, confirmationArmed: boolean): {
  label: string;
  enabled: boolean;
} {
  if (!hasSave) return { label: "无存档", enabled: false };
  return {
    label: confirmationArmed ? "确认清空" : "清空存档",
    enabled: true
  };
}

export function getContinueButtonState(hasActiveRun: boolean, hasRunHistory: boolean): {
  label: string;
  enabled: boolean;
} {
  if (hasActiveRun) return { label: "继续进度", enabled: true };
  if (hasRunHistory) return { label: "上次配置", enabled: true };
  return { label: "无记录", enabled: false };
}
