type FullscreenRoot = {
  requestFullscreen?: () => Promise<void>;
};

type FullscreenDocument = {
  fullscreenElement?: unknown;
  exitFullscreen?: () => Promise<void>;
};

export function isFullscreenToggleKey(input: { key: string; code?: string }): boolean {
  return input.code === "KeyF" || input.key.toLowerCase() === "f";
}

export async function toggleBrowserFullscreen(
  root: FullscreenRoot | null,
  doc: FullscreenDocument = document
): Promise<void> {
  if (doc.fullscreenElement) {
    await doc.exitFullscreen?.();
    return;
  }
  await root?.requestFullscreen?.();
}

export function installFullscreenControls(root: HTMLElement, doc: Document = document): void {
  root.addEventListener("dblclick", () => {
    void toggleBrowserFullscreen(root, doc);
  });
  window.addEventListener("keydown", (event) => {
    if (!isFullscreenToggleKey(event)) return;
    event.preventDefault();
    void toggleBrowserFullscreen(root, doc);
  });
}
