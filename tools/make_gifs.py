"""Generates the site's tiny old-web animated GIFs from hand-drawn pixel sprites.
Nothing is downloaded; every frame is drawn here."""
import os, math
from PIL import Image, ImageDraw

OUT = "site/assets/gifs"
os.makedirs(OUT, exist_ok=True)

# index 0 is the transparent key colour
PAL = [
    (255, 0, 255),   # 0 transparent key
    (0, 0, 0),       # 1 black
    (26, 26, 33),    # 2 near black
    (58, 62, 74),    # 3 shadow silver
    (111, 116, 130), # 4 mid silver
    (185, 191, 203), # 5 light silver
    (255, 255, 255), # 6 white
    (176, 18, 26),   # 7 blood
    (255, 42, 53),   # 8 bright red
    (108, 255, 63),  # 9 radioactive green
    (107, 63, 160),  # 10 violet
    (255, 212, 0),   # 11 yellow
    (27, 63, 255),   # 12 electric blue
    (255, 150, 20),  # 13 orange
]
FLAT = [c for rgb in PAL for c in rgb] + [0] * (768 - len(PAL) * 3)

CH = {'.': 0, 'k': 1, 'n': 2, 's': 3, 'm': 4, 'l': 5, 'w': 6,
      'r': 7, 'R': 8, 'g': 9, 'v': 10, 'y': 11, 'b': 12, 'o': 13}


def blank(w, h):
    im = Image.new("P", (w, h), 0)
    im.putpalette(FLAT)
    return im


def sprite(rows):
    """ASCII art -> P-mode image."""
    h = len(rows)
    w = max(len(r) for r in rows)
    im = blank(w, h)
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            px[x, y] = CH[ch]
    return im


def save(name, frames, ms=120):
    frames[0].save(f"{OUT}/{name}.gif", save_all=True, append_images=frames[1:],
                   duration=ms, loop=0, transparency=0, disposal=2, optimize=False)


def squash_cycle(front, back, w, h, steps=(1.0, .72, .42, .14)):
    """Fake 3D spin: horizontally squash the front face, flip to the back face, repeat."""
    frames = []
    for face in (front, back):
        seq = list(steps) + list(reversed(steps))[1:]
        for i, s in enumerate(seq):
            src = face if i < len(steps) else face.transpose(Image.FLIP_LEFT_RIGHT)
            nw = max(1, int(round(face.width * s)))
            sq = src.resize((nw, face.height), Image.NEAREST)
            f = blank(w, h)
            f.paste(sq, ((w - nw) // 2, (h - face.height) // 2))
            frames.append(f)
    return frames


# ---------------------------------------------------------------- skull
SKULL_FRONT = [
    "....llllll....",
    "..llllllllll..",
    ".mllllllllllm.",
    ".llllllllllll.",
    ".llkkllllkkll.",
    ".lkkkkllkkkkl.",
    ".lkkkkllkkkkl.",
    ".llkkllllkkll.",
    ".llllllkllllm.",
    "..llllkkllll..",
    "..mllllllllm..",
    "...lklklklk...",
    "...llllllll...",
    "....mllllm....",
]
SKULL_BACK = [
    "....mmmmmm....",
    "..mmmmmmmmmm..",
    ".mmmmmlmmmmmm.",
    ".mmmmmlmmmmmm.",
    ".mmmmmlmmmmmm.",
    ".mmmslllsmmmm.",
    ".mmmmmlmmmmmm.",
    ".mmmmmlmmmmmm.",
    ".mmmmmlmmmmmm.",
    "..mmmmlmmmmm..",
    "..smmmmmmmms..",
    "...ssssssss...",
    "...mmmmmmmm...",
    "....smmmms....",
]
save("skull-spin", squash_cycle(sprite(SKULL_FRONT), sprite(SKULL_BACK), 16, 16), 110)

# ---------------------------------------------------------------- gothic cross
CROSS_F = [
    "....ll....",
    "...lwwl...",
    "...lwwl...",
    "lllwwwwlll",
    "lwwwwwwwwl",
    "lllwwwwlll",
    "...lwwl...",
    "...lwwl...",
    "...lwwl...",
    "...lwwl...",
    "..llwwll..",
    "..l.ll.l..",
]
CROSS_B = [
    "....mm....",
    "...mllm...",
    "...mllm...",
    "mmmllllmmm",
    "mllllllllm",
    "mmmllllmmm",
    "...mllm...",
    "...mllm...",
    "...mllm...",
    "...mllm...",
    "..mmllmm..",
    "..m.mm.m..",
]
save("cross-spin", squash_cycle(sprite(CROSS_F), sprite(CROSS_B), 12, 12), 100)

# ---------------------------------------------------------------- blinking eye
EYE = [
    "..kkkkkkkk..",
    ".kwwwwwwwwk.",
    "kwwlkkkklwwk",
    "kwwkrrrrkwwk",
    "kwwlkkkklwwk",
    ".kwwwwwwwwk.",
    "..kkkkkkkk..",
]
EYE_HALF = [
    "............",
    "..kkkkkkkk..",
    ".kwwwwwwwwk.",
    "kwwkrrrrkwwk",
    ".kwwwwwwwwk.",
    "..kkkkkkkk..",
    "............",
]
EYE_SHUT = [
    "............",
    "............",
    "..kkkkkkkk..",
    ".kmmmmmmmmk.",
    "..kkkkkkkk..",
    "............",
    "............",
]
_e, _h, _s = sprite(EYE), sprite(EYE_HALF), sprite(EYE_SHUT)
save("eye-blink", [_e, _e, _e, _e, _e, _e, _h, _s, _h, _e], 90)

# ---------------------------------------------------------------- bat
BAT_UP = [
    "l..........l",
    "ll...kk...ll",
    ".ll.kkkk.ll.",
    "..lkkkkkkl..",
    "...kkkkkk...",
    "....k..k....",
]
BAT_MID = [
    "............",
    "ll........ll",
    ".lll.kk.lll.",
    "..llkkkkll..",
    "...kkkkkk...",
    "....k..k....",
]
BAT_DN = [
    "............",
    "............",
    "l...kk...l..",
    "ll.kkkk.ll..",
    ".llkkkkkkl..",
    "..l.k..k.l..",
]
_b = [sprite(BAT_UP), sprite(BAT_MID), sprite(BAT_DN), sprite(BAT_MID)]
save("bat-flap", _b, 110)

# ---------------------------------------------------------------- chrome star
def star_frame(size, r, bright):
    im = blank(size, size)
    d = ImageDraw.Draw(im)
    c = size // 2
    col = 6 if bright else 5
    d.line([(c, c - r), (c, c + r)], fill=col)
    d.line([(c - r, c), (c + r, c)], fill=col)
    q = max(1, r // 3)
    d.line([(c - q, c - q), (c + q, c + q)], fill=4)
    d.line([(c - q, c + q), (c + q, c - q)], fill=4)
    if r > 2:
        im.load()[c, c] = 6
    return im
save("star-chrome", [star_frame(13, r, b) for r, b in
                     ((6, True), (5, True), (3, False), (2, False), (3, False), (5, True))], 110)

# ---------------------------------------------------------------- spinning CD
def cd_frame(a):
    s = 20
    im = blank(s, s)
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, s - 1, s - 1], fill=4, outline=3)
    for i, col in enumerate((6, 5, 10, 12, 9)):
        st = a + i * 62
        d.pieslice([2, 2, s - 3, s - 3], st, st + 26, fill=col)
    d.ellipse([6, 6, s - 7, s - 7], fill=3, outline=5)
    d.ellipse([8, 8, s - 9, s - 9], fill=0)
    return im
save("cd-spin", [cd_frame(a) for a in range(0, 360, 30)], 70)

# ---------------------------------------------------------------- under construction
def constr_frame(off):
    w, h = 52, 11
    im = blank(w, h)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], fill=1)
    for x in range(-h, w + h, 8):
        d.polygon([(x + off, h), (x + off + 4, h), (x + off + 4 + h, 0), (x + off + h, 0)], fill=11)
    d.rectangle([0, 0, w - 1, h - 1], outline=5)
    return im
save("construction", [constr_frame(o) for o in range(0, 8, 2)], 90)

# ---------------------------------------------------------------- fire divider
def fire_frame(t, w=64, h=13):
    im = blank(w, h)
    px = im.load()
    for x in range(w):
        fh = 4.5 + 3.2 * math.sin(x * 0.55 + t * 1.7) + 2.4 * math.sin(x * 0.21 - t * 1.1) \
             + 1.3 * math.sin(x * 1.31 + t * 2.6)
        fh = max(1, int(fh))
        for y in range(h - 1, h - 1 - fh, -1):
            depth = (h - 1 - y) / max(1, fh)
            px[x, y] = 6 if depth < .18 else 11 if depth < .42 else 13 if depth < .66 else 8 if depth < .86 else 7
    return im
save("fire-divider", [fire_frame(t * 0.9) for t in range(6)], 90)

def flame_frame(t, w=11, h=15):
    im = blank(w, h)
    px = im.load()
    cx = w / 2
    for y in range(h):
        prog = (h - 1 - y) / (h - 1)
        half = (1 - prog) * (w / 2 - .4) * (1 + .22 * math.sin(prog * 7 + t * 2.1))
        wob = 1.5 * prog * math.sin(prog * 4 + t * 1.9)
        for x in range(w):
            if abs(x - cx - wob) <= half:
                px[x, y] = 6 if prog < .16 else 11 if prog < .40 else 13 if prog < .64 else 8 if prog < .85 else 7
    return im
save("flame", [flame_frame(t) for t in range(6)], 85)

# ---------------------------------------------------------------- broken heart
HEART = [
    ".RR..RR.",
    "RRRRRRRR",
    "RRRRRRRR",
    ".RRRRRR.",
    "..RRRR..",
    "...RR...",
]
HEART_CRACK = [
    ".RR..RR.",
    "RRRkRRRR",
    "RRkRRRRR",
    ".RRkRRR.",
    "..RkRR..",
    "...R....",
]
HEART_SPLIT = [
    ".RR...RR",
    "RRR...RR",
    "RR.....R",
    ".RR...R.",
    "..R...R.",
    "...R.R..",
]
_hh = [sprite(HEART), sprite(HEART), sprite(HEART_CRACK), sprite(HEART_SPLIT), sprite(HEART_SPLIT)]
save("heart-broken", _hh, 200)

# ---------------------------------------------------------------- mail
MAIL_SHUT = [
    "llllllllllll",
    "lkllllllllkl",
    "lkkllllllkkl",
    "lkkkllllkkkl",
    "lkkkkkkkkkkl",
    "llllllllllll",
]
MAIL_OPEN = [
    "l..........l",
    "lkkkkkkkkkkl",
    "lwwwwwwwwwwl",
    "lwwwwwwwwwwl",
    "lwwwwwwwwwwl",
    "llllllllllll",
]
save("mail", [sprite(MAIL_SHUT)] * 5 + [sprite(MAIL_OPEN)] * 3, 180)

# ---------------------------------------------------------------- dancing skeleton
SKEL_A = [
    "..lll..",
    ".lklkl.",
    "..lll..",
    "...l...",
    "l.lll.l",
    ".lllll.",
    "..lll..",
    "..l.l..",
    ".l...l.",
    ".l...l.",
    "l.....l",
]
SKEL_B = [
    "..lll..",
    ".lklkl.",
    "..lll..",
    "...l...",
    ".lllll.",
    "l.lll.l",
    "..lll..",
    "..l.l..",
    "..l.l..",
    ".l...l.",
    ".l...l.",
]
SKEL_C = [
    "..lll..",
    ".lklkl.",
    "..lll..",
    "...l...",
    "l.lll..",
    ".lllll.",
    "..llll.",
    "..l.l..",
    ".l...l.",
    "l.....l",
    "l.....l",
]
save("skeleton-dance", [sprite(SKEL_A), sprite(SKEL_B), sprite(SKEL_C), sprite(SKEL_B)], 150)

# ---------------------------------------------------------------- NEW! badge
NEW_ON = [
    "w...w.wwww.w...w..w..",
    "ww..w.w....w...w..w..",
    "w.w.w.www..w.w.w..w..",
    "w..ww.w....ww.ww.....",
    "w...w.wwww.w...w..w..",
]
NEW_OFF = [
    "R...R.RRRR.R...R..R..",
    "RR..R.R....R...R..R..",
    "R.R.R.RRR..R.R.R..R..",
    "R..RR.R....RR.RR.....",
    "R...R.RRRR.R...R..R..",
]
save("new-badge", [sprite(NEW_ON), sprite(NEW_OFF)], 380)

# ---------------------------------------------------------------- thorn divider (static-ish shimmer)
def thorn_frame(sh):
    w, h = 60, 9
    im = blank(w, h)
    d = ImageDraw.Draw(im)
    d.line([(0, h // 2), (w - 1, h // 2)], fill=4)
    for i, x in enumerate(range(3, w, 9)):
        up = i % 2 == 0
        tip = 0 if up else h - 1
        col = 6 if (i + sh) % 4 == 0 else 5
        d.line([(x, h // 2), (x + 4, tip)], fill=col)
        d.line([(x + 4, tip), (x + 5, h // 2)], fill=4)
    return im
save("thorn-divider", [thorn_frame(s) for s in range(4)], 200)

print("gifs:")
for f in sorted(os.listdir(OUT)):
    print(f"  {os.path.getsize(f'{OUT}/{f}'):>6} B  {f}")
