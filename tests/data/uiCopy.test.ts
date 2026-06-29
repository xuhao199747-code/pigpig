import { describe, expect, it } from "vitest";

import { getClearSaveButtonState, getContinueButtonState, hudCommandCopy, menuCopy, pauseCopy, resultCopy, skillButtonCopy } from "../../src/game/data/uiCopy";

describe("ui copy", () => {
  it("defines mouse-accessible start, pause, restart, and skill commands", () => {
    expect(menuCopy.primaryAction).toBe("开始");
    expect(hudCommandCopy.pause).toBe("暂停");
    expect(hudCommandCopy.restart).toBe("重开");
    expect(skillButtonCopy.map((skill) => skill.key)).toEqual(["Q", "W", "E"]);
  });

  it("requires confirmation before clearing a local save", () => {
    expect(getClearSaveButtonState(false, false)).toEqual({
      label: "无存档",
      enabled: false
    });
    expect(getClearSaveButtonState(true, false)).toEqual({
      label: "清空存档",
      enabled: true
    });
    expect(getClearSaveButtonState(true, true)).toEqual({
      label: "确认清空",
      enabled: true
    });
  });

  it("labels continue actions by the kind of local save available", () => {
    expect(getContinueButtonState(false, false)).toEqual({
      label: "无记录",
      enabled: false
    });
    expect(getContinueButtonState(true, false)).toEqual({
      label: "继续进度",
      enabled: true
    });
    expect(getContinueButtonState(false, true)).toEqual({
      label: "上次配置",
      enabled: true
    });
  });

  it("documents keyboard shortcuts on the result panel", () => {
    expect(resultCopy.keyboardHint).toBe("R / Enter 重开    Esc 返回主菜单");
  });

  it("documents pause menu controls and exit options", () => {
    expect(pauseCopy.keyboardHint).toBe("P / Esc 继续    可返回主菜单");
  });
});
