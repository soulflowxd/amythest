"""Rasterize the transparent Amythest mark for the Windows title bar.

Requires Pillow only when regenerating the checked-in PNG. The app build does
not need Python.
"""

from pathlib import Path
from PIL import Image, ImageDraw


SCALE = 4
SIZE = 128 * SCALE


def bezier(start, c1, c2, end, steps=32):
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        points.append((
            u**3 * start[0] + 3 * u**2 * t * c1[0] + 3 * u * t**2 * c2[0] + t**3 * end[0],
            u**3 * start[1] + 3 * u**2 * t * c1[1] + 3 * u * t**2 * c2[1] + t**3 * end[1],
        ))
    return points


def curve(segments):
    points = []
    for segment in segments:
        points.extend(bezier(*segment)[1:])
    return [(round(x * SCALE), round(y * SCALE)) for x, y in points]


outer = curve([
    ((66, 15), (85, 13), (99, 27), (109, 48)),
    ((109, 48), (118, 67), (118, 86), (105, 100)),
    ((105, 100), (91, 115), (67, 116), (46, 113)),
    ((46, 113), (27, 110), (14, 97), (12, 81)),
    ((12, 81), (9, 65), (24, 46), (37, 31)),
    ((37, 31), (47, 20), (56, 16), (66, 15)),
])
inner = curve([
    ((67, 37), (79, 35), (89, 44), (95, 58)),
    ((95, 58), (99, 67), (105, 75), (101, 82)),
    ((101, 82), (99, 88), (92, 92), (86, 95)),
    ((86, 95), (78, 99), (70, 101), (63, 102)),
    ((63, 102), (52, 103), (38, 96), (33, 90)),
    ((33, 90), (28, 82), (32, 72), (41, 61)),
    ((41, 61), (48, 51), (55, 38), (67, 37)),
])

image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
ring = Image.new("L", (SIZE, SIZE), 0)
draw = ImageDraw.Draw(ring)
draw.polygon(outer, fill=255)
draw.polygon(inner, fill=0)

opal = Image.new("RGBA", (SIZE, SIZE))
opal_px = opal.load()
for y in range(SIZE):
    t = y / (SIZE - 1)
    for x in range(SIZE):
        opal_px[x, y] = tuple(round(255 + (b - 255) * t) for b in (171, 160, 207)) + (255,)
image.paste(opal, (0, 0), ring)

gem = Image.new("L", (SIZE, SIZE), 0)
ImageDraw.Draw(gem).polygon(inner, fill=255)
purple = Image.new("RGBA", (SIZE, SIZE))
purple_px = purple.load()
for y in range(SIZE):
    t = min(1, max(0, (y / SCALE - 36) / 70))
    for x in range(SIZE):
        purple_px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip((239, 211, 255), (80, 38, 154))) + (255,)
image.paste(purple, (0, 0), gem)

image.resize((48, 48), Image.Resampling.LANCZOS).save(Path(__file__).with_name("brand-icon48.png"))
