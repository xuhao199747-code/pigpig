export type WeaponSelectionDirection = "left" | "right" | "up" | "down";
export type WeaponSelectionAction = WeaponSelectionDirection | "confirm" | "back";

export function getNextWeaponSelectionIndex(input: {
  currentIndex: number;
  direction: WeaponSelectionDirection;
  itemCount: number;
  columns: number;
}): number {
  if (input.itemCount <= 0 || input.columns <= 0) return 0;

  const currentIndex = clampIndex(input.currentIndex, input.itemCount);
  const rowStart = Math.floor(currentIndex / input.columns) * input.columns;
  const rowEnd = Math.min(rowStart + input.columns - 1, input.itemCount - 1);

  if (input.direction === "left") {
    return currentIndex <= rowStart ? rowEnd : currentIndex - 1;
  }
  if (input.direction === "right") {
    return currentIndex >= rowEnd ? rowStart : currentIndex + 1;
  }

  if (input.direction === "down") {
    const nextIndex = currentIndex + input.columns;
    return nextIndex < input.itemCount ? nextIndex : input.itemCount - 1;
  }

  const nextIndex = currentIndex - input.columns;
  if (nextIndex >= 0) return nextIndex;

  const column = currentIndex % input.columns;
  const lastRowStart = Math.floor((input.itemCount - 1) / input.columns) * input.columns;
  return Math.min(lastRowStart + column, input.itemCount - 1);
}

function clampIndex(index: number, itemCount: number): number {
  return Math.max(0, Math.min(itemCount - 1, index));
}

export function getWeaponSelectionActionForKey(input: { key?: string; code?: string }): WeaponSelectionAction | null {
  const key = input.key?.toLowerCase();
  const code = input.code?.toLowerCase();
  if (key === "arrowleft" || key === "a" || code === "keya") return "left";
  if (key === "arrowright" || key === "d" || code === "keyd") return "right";
  if (key === "arrowup" || key === "w" || code === "keyw") return "up";
  if (key === "arrowdown" || key === "s" || code === "keys") return "down";
  if (key === "enter" || code === "enter" || key === " " || code === "space") return "confirm";
  if (key === "escape" || code === "escape") return "back";
  return null;
}
