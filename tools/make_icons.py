import os
from PIL import Image

OUT = "site/assets/icons"
os.makedirs(OUT, exist_ok=True)

C = {
    '.': (0, 0, 0, 0),
    'k': (8, 8, 11, 255),      'n': (30, 31, 39, 255),
    's': (58, 62, 74, 255),    'm': (111, 116, 130, 255),
    'l': (185, 191, 203, 255), 'w': (255, 255, 255, 255),
    'r': (176, 18, 26, 255),   'R': (255, 58, 68, 255),
    'g': (108, 255, 63, 255),  'v': (123, 74, 178, 255),
    'y': (255, 212, 0, 255),   'b': (43, 82, 255, 255),
    'o': (255, 150, 20, 255),
}

ICONS = {
# coffin holding a photo -> PHOTOS
"photos": [
    "......llll......",
    ".....lnnnnl.....",
    "....lnwwwwnl....",
    "...lnwmmmmwnl...",
    "..lnwmbbbbmwnl..",
    ".lnwmbwbbwbmwnl.",
    "lnwmbbbbbbbbmwnl",
    "lnwmbbbwbbbbmwnl",
    "lnwmbbbbbbbbmwnl",
    ".lnwmbbbbbbmwnl.",
    "..lnwmbbbbmwnl..",
    "...lnwmbbmwnl...",
    "....lnwmmwnl....",
    ".....lnwwnl.....",
    "......lnnl......",
    ".......ll.......",
],
# CRT monitor with a sigil on screen -> SIGIL_SWARM.exe
"game": [
    "llllllllllllllll",
    "lnnnnnnnnnnnnnnl",
    "lnkkkkkkkkkkkknl",
    "lnkkkkkwkkkkkknl",
    "lnkkkkwlwkkkkknl",
    "lnkkkwlklwkkkknl",
    "lnkkwlkkklwkkknl",
    "lnkkkwlklwkgkknl",
    "lnkkkkwlwkkkkknl",
    "lnkkgkkwkkkkkknl",
    "lnkkkkkkkkkkrknl",
    "lnkkkkkkkkkkkknl",
    "lmmmmmmmmmmmmmml",
    "lssssssssssssssl",
    "..lllllllllll...",
    "...mmmmmmmmm....",
],
# open guestbook / BBS -> GUESTBOOK
"book": [
    "................",
    "..ll........ll..",
    ".lnnl......lnnl.",
    "lnwwnllllllnwwnl",
    "lnwkwnlllnwkwwnl",
    "lnwwwwnlnwwwwwnl",
    "lnwkkwwnwwkkkwnl",
    "lnwwwwwwnwwwwwnl",
    "lnwkkkwwnwwkkwnl",
    "lnwwwwwwnwwwwwnl",
    "lnwkkwwwnwwkwwnl",
    "lnwwwwwwnwwwwwnl",
    "lnnwwwwwnwwwwnnl",
    ".lnnnnnnnnnnnnl.",
    "..llllllllllll..",
    "................",
],
# winamp-ish box -> QK-AMP
"amp": [
    "................",
    "llllllllllllllll",
    "lwwwwwwwwwwwwwwl",
    "lmnnnnnnnnnnnnml",
    "lmnkkkkkkkkkknml",
    "lmnkRRkRkRRkkkml",
    "lmnkkkkkkkkkkkml",
    "lmnkgkgkgkgkkkml",
    "lmnnnnnnnnnnnnml",
    "lmlllllllllllllm",
    "lmlwlwlwlwlwlllm",
    "lmllllllllllllll",
    "lslmmmmmmmmmmlsl",
    "lssssssssssssssl",
    "llllllllllllllll",
    "................",
],
# document -> README.TXT
"txt": [
    "..lllllllllll...",
    "..lwwwwwwwwll...",
    "..lwkkkkkwwlll..",
    "..lwwwwwwwwwll..",
    "..lwkkkkkkkwwl..",
    "..lwwwwwwwwwwl..",
    "..lwkkkkkwwwwl..",
    "..lwwwwwwwwwwl..",
    "..lwkkkkkkkwwl..",
    "..lwwwwwwwwwwl..",
    "..lwkkkkkwwwwl..",
    "..lwwwwwwwwwwl..",
    "..lwkkkkkkwwwl..",
    "..lwwwwwwwwwwl..",
    "..lllllllllllll.",
    "................",
],
# terminal
"term": [
    "llllllllllllllll",
    "lnnnnnnnnnnnnnnl",
    "lnkkkkkkkkkkkknl",
    "lnkgkkkkkkkkkknl",
    "lnkggkkkkkkkkknl",
    "lnkgggkkkkkkkknl",
    "lnkggkkkkkkkkknl",
    "lnkgkkkkkkkkkknl",
    "lnkkkgggggkkkknl",
    "lnkkkkkkkkkkkknl",
    "lnkkkkkkkkkkkknl",
    "lnkkkkkkkkkkkknl",
    "lnnnnnnnnnnnnnnl",
    "llllllllllllllll",
    "..mmmmmmmmmmmm..",
    "................",
],
# skull -> hidden shrine
"skull": [
    "................",
    "....llllllll....",
    "..llllllllllll..",
    ".llllllllllllll.",
    ".llllllllllllll.",
    ".llkkllllllkkll.",
    ".lkkkkllllkkkkl.",
    ".lkkkkllllkkkkl.",
    ".llkkllllllkkll.",
    ".lllllkllkllllll",
    "..lllllkkllllll.",
    "..llllllllllll..",
    "...lklklklklk...",
    "...llllllllll...",
    "....llllllll....",
    "................",
],
}

for name, rows in ICONS.items():
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            px[x, y] = C[ch]
    im.save(f"{OUT}/{name}.png", optimize=True)

# preview
sheet = Image.new("RGBA", (len(ICONS) * 72, 72), (16, 16, 20, 255))
for i, name in enumerate(ICONS):
    sheet.alpha_composite(Image.open(f"{OUT}/{name}.png").resize((64, 64), Image.NEAREST), (i * 72 + 4, 4))
sheet.convert("RGB").save("peek/_icons.png")
print("icons:", ", ".join(ICONS))
