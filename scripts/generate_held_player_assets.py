from __future__ import annotations

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PLAYER_DIR = ROOT / "assets" / "sprites" / "player"
WEAPON_DIR = ROOT / "assets" / "sprites" / "weapons"
OUT_DIR = PLAYER_DIR / "held"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FRAME = 128

WEAPONS = {
    "rusty-cleaver": {
        "weapon": "rusty-cleaver.png",
        "scale": 0.34,
        "attack_base": "butcher-attack-sheet.png",
        "grip": (0.22, 0.80),
        "idle": (73, 62, -24),
        "walk": [(73, 62, -22), (75, 64, -18), (71, 63, -28), (74, 61, -20)],
        "attack": [(67, 58, -52), (73, 54, -26), (81, 51, 0), (87, 54, 18)],
    },
    "salt-frost-cleaver": {
        "weapon": "salt-frost-cleaver.png",
        "scale": 0.35,
        "attack_base": "butcher-attack-sheet.png",
        "grip": (0.22, 0.80),
        "idle": (73, 62, -20),
        "walk": [(73, 62, -18), (75, 64, -14), (71, 63, -24), (74, 61, -16)],
        "attack": [(67, 57, -48), (74, 53, -22), (82, 50, 4), (88, 54, 22)],
    },
    "pig-bone-chainsaw": {
        "weapon": "pig-bone-chainsaw.png",
        "scale": 0.40,
        "attack_base": "butcher-attack-sheet.png",
        "grip": (0.24, 0.82),
        "idle": (70, 63, -6),
        "walk": [(70, 63, -4), (72, 65, 0), (69, 64, -8), (71, 62, -2)],
        "attack": [(68, 58, -18), (74, 56, -8), (80, 55, 6), (86, 56, 18)],
    },
    "dusk-hook": {
        "weapon": "dusk-hook.png",
        "scale": 0.38,
        "attack_base": "butcher-attack-sheet.png",
        "grip": (0.30, 0.82),
        "idle": (71, 59, 18),
        "walk": [(71, 59, 16), (73, 60, 20), (70, 59, 12), (72, 58, 18)],
        "attack": [(69, 57, -10), (75, 55, 4), (82, 54, 18), (88, 55, 30)],
    },
    "dragon-slayer": {
        "weapon": "dragon-slayer.png",
        "scale": 0.50,
        "attack_base": "butcher-attack-sheet.png",
        "grip": (0.24, 0.88),
        "idle": (78, 56, -108),
        "walk": [(78, 56, -104), (80, 58, -100), (76, 57, -110), (79, 55, -102)],
        "attack": [(72, 58, -126), (74, 54, -88), (80, 50, -42), (88, 48, -4)],
    },
}


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def resize_weapon(img: Image.Image, scale: float) -> Image.Image:
    size = max(24, round(img.width * scale)), max(24, round(img.height * scale))
    return img.resize(size, Image.Resampling.LANCZOS)


def rotate_weapon_at_grip(img: Image.Image, grip: tuple[float, float], angle: float) -> tuple[Image.Image, tuple[int, int]]:
    grip_x = round(img.width * grip[0])
    grip_y = round(img.height * grip[1])
    margin = max(img.width, img.height)
    canvas = Image.new("RGBA", (img.width + margin * 2, img.height + margin * 2), (0, 0, 0, 0))
    canvas.alpha_composite(img, (margin, margin))
    grip_abs = (margin + grip_x, margin + grip_y)
    rotated = canvas.rotate(angle, resample=Image.Resampling.BICUBIC, center=grip_abs, expand=False)
    return rotated, grip_abs


def paste_by_grip(frame: Image.Image, weapon: Image.Image, grip: tuple[float, float], x: int, y: int, angle: float) -> None:
    rotated, grip_abs = rotate_weapon_at_grip(weapon, grip, angle)
    left = round(x - grip_abs[0])
    top = round(y - grip_abs[1])
    frame.alpha_composite(rotated, (left, top))


def split_sheet(sheet: Image.Image) -> list[Image.Image]:
    frames = []
    for row in range(2):
      for col in range(2):
        frames.append(sheet.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME)))
    return frames


def merge_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME * 2, FRAME * 2), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        x = (index % 2) * FRAME
        y = (index // 2) * FRAME
        sheet.alpha_composite(frame, (x, y))
    return sheet


def render_idle(base: Image.Image, weapon: Image.Image, anchor: tuple[int, int, int], grip: tuple[float, float]) -> Image.Image:
    frame = base.copy()
    x, y, angle = anchor
    paste_by_grip(frame, weapon, grip, x, y, angle)
    return frame


def render_sheet(base_sheet: Image.Image, weapon: Image.Image, grip: tuple[float, float], anchors: list[tuple[int, int, int]]) -> Image.Image:
    frames = split_sheet(base_sheet)
    rendered = []
    for frame, (x, y, angle) in zip(frames, anchors):
        composed = frame.copy()
        paste_by_grip(composed, weapon, grip, x, y, angle)
        rendered.append(composed)
    return merge_sheet(rendered)


def main() -> None:
    idle_base = load(PLAYER_DIR / "butcher.png")
    walk_base = load(PLAYER_DIR / "butcher-walk-sheet.png")

    for slug, config in WEAPONS.items():
        weapon = resize_weapon(load(WEAPON_DIR / config["weapon"]), config["scale"])
        grip = config["grip"]
        attack_base = load(PLAYER_DIR / config["attack_base"])

        render_idle(idle_base, weapon, config["idle"], grip).save(OUT_DIR / f"{slug}-idle.png")
        render_sheet(walk_base, weapon, grip, config["walk"]).save(OUT_DIR / f"{slug}-walk-sheet.png")
        render_sheet(attack_base, weapon, grip, config["attack"]).save(OUT_DIR / f"{slug}-attack-sheet.png")


if __name__ == "__main__":
    main()
