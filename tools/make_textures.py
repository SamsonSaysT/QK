import os, glob
import numpy as np
from PIL import Image, ImageDraw, ImageSequence
import cairosvg

TEX = "site/assets/tex"
GIF = "site/assets/gifs"
os.makedirs(TEX, exist_ok=True)
rng = np.random.default_rng(13)

# ---- tiling monochrome noise (CRT grain)
n = 160
a = rng.integers(0, 255, (n, n), dtype=np.uint8)
alpha = (rng.integers(0, 46, (n, n))).astype(np.uint8)
img = Image.merge("RGBA", [Image.fromarray(a)] * 3 + [Image.fromarray(alpha)])
img.save(f"{TEX}/noise.png", optimize=True)

# ---- 4x4 bayer dither tile
bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16
d = (bayer * 90).astype(np.uint8)
dith = Image.merge("RGBA", [Image.fromarray(np.full((4, 4), 190, np.uint8))] * 3 +
                   [Image.fromarray(d)])
dith.resize((16, 16), Image.NEAREST).save(f"{TEX}/dither.png", optimize=True)

# ---- brushed chrome strip (for window title bars / player body)
h, w = 64, 64
base = np.linspace(0, 1, h)[:, None].repeat(w, 1)
prof = (np.interp(base, [0, .14, .33, .46, .58, .74, .88, 1],
                  [255, 201, 86, 242, 143, 51, 219, 118]))
prof += rng.normal(0, 5, (h, w))
prof += rng.normal(0, 9, (h, 1))
chrome = Image.fromarray(np.clip(prof, 0, 255).astype(np.uint8)).convert("RGB")
chrome.save(f"{TEX}/chrome-strip.png", optimize=True)

# ---- cursors
def cursor(name, draw_fn, size=26):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(im), size)
    im.save(f"{TEX}/{name}.png", optimize=True)

def dagger(d, s):
    # sharp chrome dagger pointing up-left, hotspot at (2,2)
    d.polygon([(2, 2), (16, 12), (11, 13), (13, 22), (10, 23), (8, 14), (4, 17)],
              fill=(226, 231, 240, 255), outline=(10, 10, 14, 255))
    d.line([(3, 4), (12, 11)], fill=(255, 255, 255, 255))
    d.line([(6, 14), (10, 20)], fill=(120, 126, 140, 255))

def crosshair(d, s):
    c = s // 2
    for r, col in ((9, (14, 14, 18, 255)), (8, (232, 236, 244, 255))):
        d.ellipse([c - r, c - r, c + r, c + r], outline=col)
    d.line([(c, 0), (c, 6)], fill=(255, 255, 255, 255))
    d.line([(c, s - 7), (c, s - 1)], fill=(255, 255, 255, 255))
    d.line([(0, c), (6, c)], fill=(255, 255, 255, 255))
    d.line([(s - 7, c), (s - 1, c)], fill=(255, 255, 255, 255))
    d.point((c, c), fill=(255, 60, 70, 255))

def grab(d, s):
    d.polygon([(4, 3), (13, 3), (13, 9), (18, 9), (18, 20), (5, 20), (5, 12)],
              fill=(214, 220, 230, 255), outline=(10, 10, 14, 255))
    d.line([(7, 12), (7, 17)], fill=(90, 95, 108, 255))
    d.line([(10, 12), (10, 17)], fill=(90, 95, 108, 255))
    d.line([(13, 12), (13, 17)], fill=(90, 95, 108, 255))

cursor("cur-dagger", dagger)
cursor("cur-cross", crosshair)
cursor("cur-grab", grab)

# ---- favicon + sigil svgs into the site
os.makedirs("site/assets", exist_ok=True)
for src, dst in (("sigil_full.svg", "site/assets/sigil.svg"),
                 ("sigil_mark.svg", "site/assets/sigil-mark.svg")):
    open(dst, "w").write(open(src).read())

mark = open("sigil_mark.svg").read()
for px in (32, 180):
    cairosvg.svg2png(bytestring=mark.encode(), write_to=f"site/assets/icon-{px}.png",
                     output_width=px, output_height=px)
open("site/assets/favicon.svg", "w").write(
    mark.replace('viewBox="0 0 260 260"',
                 'viewBox="0 0 260 260"><rect width="260" height="260" fill="#08080b"/><g transform="translate(0,0)"')
    .replace("</svg>", "</g></svg>"))

# ---- frozen first frames of every gif (used by REDUCE CHAOS)
for f in sorted(glob.glob(f"{GIF}/*.gif")):
    still = Image.open(f).convert("RGBA")
    still.save(f.replace(".gif", "-still.png"), optimize=True)

print("textures:")
for f in sorted(os.listdir(TEX)):
    print(f"  {os.path.getsize(f'{TEX}/{f}'):>6} B  {f}")
print("stills:", len(glob.glob(f"{GIF}/*-still.png")))
