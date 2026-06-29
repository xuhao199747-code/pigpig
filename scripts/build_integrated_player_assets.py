from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from shutil import copy2

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path("/Users/mac/.codex/generated_images/019f098a-ab24-7322-9b91-7972d79bf509")
ASSET_OUT = ROOT / "assets" / "sprites" / "player" / "held"
PUBLIC_OUT = ROOT / "public" / "assets" / "sprites" / "player" / "held"
FRAME = 128


@dataclass(frozen=True)
class SourceAsset:
    slug: str
    source: str
    fit: int = 116


SOURCES = [
    SourceAsset("rusty-cleaver", "ig_0c09bbde0cc93753016a412aa25c588198bc619373e03bb509.png"),
    SourceAsset("salt-frost-cleaver", "ig_0dabddf8c5a694e0016a412ca6abe4819a990c7e3af8704fc4.png"),
    SourceAsset("pig-bone-chainsaw", "ig_0dabddf8c5a694e0016a412cf5c9ac819a88932c749f9cf9c5.png"),
    SourceAsset("dusk-hook", "ig_0dabddf8c5a694e0016a412d3b283c819a826e9a66fb6bc00d.png"),
    SourceAsset("dragon-slayer", "ig_0dabddf8c5a694e0016a412d9a4d18819aa3a24f4ba6a86385.png"),
]


def remove_green_screen(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            is_green = g > 135 and g - r > 55 and g - b > 55
            if is_green:
                pixels[x, y] = (r, g, b, 0)
            elif a:
                # Despill green edges left by the chroma key.
                pixels[x, y] = (r, min(g, max(r, b) + 35), b, a)
    return rgba


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("source image became empty after chroma key")
    return image.crop(bbox)


def fit_subject(image: Image.Image, max_size: int) -> Image.Image:
    fitted = image.copy()
    scale = min(max_size / fitted.width, max_size / fitted.height)
    size = max(1, round(fitted.width * scale)), max(1, round(fitted.height * scale))
    return fitted.resize(size, Image.Resampling.LANCZOS)


def place_on_frame(
    subject: Image.Image,
    dx: int = 0,
    dy: int = 0,
    rotation: float = 0,
    scale_x: float = 1,
    scale_y: float = 1,
) -> Image.Image:
    current = subject
    if scale_x != 1 or scale_y != 1:
        size = max(1, round(current.width * scale_x)), max(1, round(current.height * scale_y))
        current = current.resize(size, Image.Resampling.LANCZOS)
    if rotation:
        current = current.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    x = (FRAME - current.width) // 2 + dx
    y = FRAME - current.height - 6 + dy
    frame.paste(current, (x, y), current)
    return frame


def merge_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME * 2, FRAME * 2), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, ((index % 2) * FRAME, (index // 2) * FRAME))
    return sheet


def alpha_area(image: Image.Image) -> int:
    histogram = image.getchannel("A").histogram()
    return sum(count for alpha, count in enumerate(histogram) if alpha > 8)


def assert_frame_set(slug: str, kind: str, frames: list[Image.Image]) -> None:
    areas = [alpha_area(frame) for frame in frames]
    if any(area < 600 for area in areas):
        raise ValueError(f"{slug} {kind} has an almost empty frame: {areas}")
    smallest = min(areas)
    largest = max(areas)
    if smallest / largest < 0.62:
        raise ValueError(f"{slug} {kind} has unstable frame coverage: {areas}")


def build_asset(source: SourceAsset) -> None:
    raw = Image.open(GENERATED / source.source)
    subject = fit_subject(trim_alpha(remove_green_screen(raw)), source.fit)

    idle = place_on_frame(subject)
    walk = [
        place_on_frame(subject, dx=-3, dy=1, rotation=-2.4, scale_x=0.99, scale_y=1.02),
        place_on_frame(subject, dx=-6, dy=-3, rotation=-4.2, scale_x=1.03, scale_y=0.98),
        place_on_frame(subject, dx=3, dy=2, rotation=2.2, scale_x=0.98, scale_y=1.03),
        place_on_frame(subject, dx=6, dy=-3, rotation=4.4, scale_x=1.03, scale_y=0.98),
    ]
    attack = [
        place_on_frame(subject, dx=-9, dy=2, rotation=-13, scale_x=1.02, scale_y=0.99),
        place_on_frame(subject, dx=-4, dy=-5, rotation=-5, scale_x=1.05, scale_y=0.97),
        place_on_frame(subject, dx=9, dy=-4, rotation=13, scale_x=1.07, scale_y=0.96),
        place_on_frame(subject, dx=5, dy=0, rotation=6, scale_x=1.03, scale_y=0.99),
    ]

    assert_frame_set(source.slug, "walk", walk)
    assert_frame_set(source.slug, "attack", attack)

    ASSET_OUT.mkdir(parents=True, exist_ok=True)
    idle.save(ASSET_OUT / f"{source.slug}-idle.png")
    merge_sheet(walk).save(ASSET_OUT / f"{source.slug}-walk-sheet.png")
    merge_sheet(attack).save(ASSET_OUT / f"{source.slug}-attack-sheet.png")


def sync_public() -> None:
    PUBLIC_OUT.mkdir(parents=True, exist_ok=True)
    for path in ASSET_OUT.glob("*.png"):
        copy2(path, PUBLIC_OUT / path.name)


def main() -> None:
    for source in SOURCES:
        build_asset(source)
    sync_public()
    print(f"built {len(SOURCES)} integrated player weapon asset sets")


if __name__ == "__main__":
    main()
