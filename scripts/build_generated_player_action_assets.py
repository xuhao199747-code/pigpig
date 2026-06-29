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
FIT = 118


@dataclass(frozen=True)
class ActionSource:
    slug: str
    walk: str
    attack: str
    attack_frame_size: int = FRAME


SOURCES = [
    ActionSource(
        "rusty-cleaver",
        "ig_057b48efd5367bce016a41d05898248198a79ece757ec5e387.png",
        "ig_017794bd30f048b4016a41ef856148819996435397190dc2ce.png",
    ),
    ActionSource(
        "salt-frost-cleaver",
        "ig_054b6dd74c886430016a41d11e405c819bb1c8cbfe91a88a98.png",
        "ig_017794bd30f048b4016a41eff589e481999b6920e643861e89.png",
    ),
    ActionSource(
        "pig-bone-chainsaw",
        "ig_054b6dd74c886430016a41d1acd580819b924f72299026632b.png",
        "ig_0f2b1b7ba24ddb8c016a41ec7d3500819b9c61f7689eaba207.png",
    ),
    ActionSource(
        "dusk-hook",
        "ig_054b6dd74c886430016a41d24c9bd0819b88c054a5b7373304.png",
        "ig_0f2b1b7ba24ddb8c016a41ece48dd0819bb117b13fb83f4d27.png",
    ),
    ActionSource(
        "dragon-slayer",
        "ig_054b6dd74c886430016a41d2e715a8819bb0934146f6655ad2.png",
        "ig_054b6dd74c886430016a41d3391234819b9cf6724006591d91.png",
    ),
]


def remove_green_screen(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            is_green = g > 125 and g - r > 45 and g - b > 45
            if is_green:
                pixels[x, y] = (r, g, b, 0)
            elif a:
                pixels[x, y] = (r, min(g, max(r, b) + 30), b, a)
    return rgba


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    width, height = image.size
    visited = bytearray(width * height)
    pixels = alpha.load()
    components: list[list[tuple[int, int]]] = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or pixels[start_x, start_y] <= 8:
                visited[start_index] = 1
                continue
            stack = [(start_x, start_y)]
            visited[start_index] = 1
            component: list[tuple[int, int]] = []
            while stack:
                x, y = stack.pop()
                component.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    index = ny * width + nx
                    if visited[index]:
                        continue
                    visited[index] = 1
                    if pixels[nx, ny] > 8:
                        stack.append((nx, ny))
            components.append(component)

    if not components:
        return image

    largest = max(components, key=len)
    mask = Image.new("L", image.size, 0)
    mask_pixels = mask.load()
    for x, y in largest:
        mask_pixels[x, y] = alpha.getpixel((x, y))

    cleaned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    cleaned.paste(image, (0, 0), mask)
    return cleaned


def split_sheet(path: Path) -> list[Image.Image]:
    sheet = remove_green_screen(Image.open(path))
    cell_w = sheet.width // 2
    cell_h = sheet.height // 2
    frames: list[Image.Image] = []
    for index in range(4):
        x = (index % 2) * cell_w
        y = (index // 2) * cell_h
        cell = keep_largest_alpha_component(sheet.crop((x, y, x + cell_w, y + cell_h)))
        bbox = cell.getbbox()
        if bbox is None:
            raise ValueError(f"{path.name} frame {index} is empty after chroma key")
        frames.append(cell.crop(bbox))
    return frames


def fit_frames(frames: list[Image.Image], frame_size: int) -> list[Image.Image]:
    widest = max(frame.width for frame in frames)
    tallest = max(frame.height for frame in frames)
    fit_size = frame_size - 10
    scale = min(fit_size / widest, fit_size / tallest)
    fitted: list[Image.Image] = []
    for frame in frames:
        size = max(1, round(frame.width * scale)), max(1, round(frame.height * scale))
        fitted.append(frame.resize(size, Image.Resampling.LANCZOS))
    return fitted


def place_frame(frame: Image.Image, frame_size: int) -> Image.Image:
    canvas = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
    x = (frame_size - frame.width) // 2
    y = frame_size - frame.height - 5
    canvas.paste(frame, (x, y), frame)
    return canvas


def merge_sheet(frames: list[Image.Image], frame_size: int) -> Image.Image:
    sheet = Image.new("RGBA", (frame_size * 2, frame_size * 2), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame, ((index % 2) * frame_size, (index // 2) * frame_size), frame)
    return sheet


def alpha_area(image: Image.Image) -> int:
    histogram = image.getchannel("A").histogram()
    return sum(count for alpha, count in enumerate(histogram) if alpha > 8)


def assert_frames(slug: str, action: str, frames: list[Image.Image]) -> None:
    areas = [alpha_area(frame) for frame in frames]
    if any(area < 900 for area in areas):
        raise ValueError(f"{slug} {action} has a tiny/empty frame: {areas}")
    if min(areas) / max(areas) < 0.5:
        raise ValueError(f"{slug} {action} has unstable visible area: {areas}")


def build_action(slug: str, action: str, source_name: str, frame_size: int = FRAME) -> None:
    raw_frames = split_sheet(GENERATED / source_name)
    frames = [place_frame(frame, frame_size) for frame in fit_frames(raw_frames, frame_size)]
    assert_frames(slug, action, frames)
    merge_sheet(frames, frame_size).save(ASSET_OUT / f"{slug}-{action}-sheet.png")


def sync_public() -> None:
    PUBLIC_OUT.mkdir(parents=True, exist_ok=True)
    for path in ASSET_OUT.glob("*.png"):
        copy2(path, PUBLIC_OUT / path.name)


def main() -> None:
    ASSET_OUT.mkdir(parents=True, exist_ok=True)
    for source in SOURCES:
        build_action(source.slug, "walk", source.walk)
        build_action(source.slug, "attack", source.attack, source.attack_frame_size)
    sync_public()
    print(f"built generated walk/attack sheets for {len(SOURCES)} held-player weapons")


if __name__ == "__main__":
    main()
