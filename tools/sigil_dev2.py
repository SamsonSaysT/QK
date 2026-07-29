import cairosvg

# Q = vesica "eye" bowl + slashing tail.  K = tapered spine + two blades meeting at a sharp vertex.
FULL = [
 # --- Q bowl (eye / vesica ring)
 "M94 58 C 120 90, 124 152, 94 198 C 66 152, 70 90, 94 58 Z M94 94 C 108 114, 110 150, 94 168 C 79 150, 81 114, 94 94 Z",
 # --- Q tail: crosses out of the ring, sweeps down-right, tapers to a point
 "M104 148 C 118 164, 134 180, 152 204 C 162 216, 168 224, 174 234 C 164 220, 152 206, 138 192 C 122 176, 108 164, 96 156 Z",
 # tail back-barb
 "M108 152 C 100 147, 93 143, 84 139 C 94 145, 102 150, 112 157 Z",
 # --- upper antlers
 "M86 70 C 72 48, 52 32, 20 16 C 46 36, 68 55, 82 80 Z",
 "M58 44 C 50 32, 42 23, 30 10 C 43 25, 51 36, 62 51 Z",
 "M102 70 C 111 52, 122 40, 138 26 C 125 46, 114 62, 106 80 Z",
 # --- lower spike
 "M90 190 C 90 210, 87 226, 80 246 C 90 228, 97 211, 99 192 Z",
 # --- K spine (tapered blade, sharp both ends)
 "M172 46 C 179 76, 181 118, 180 148 C 179 184, 175 208, 170 232 C 166 206, 164 178, 164 146 C 164 110, 167 76, 172 46 Z",
 # --- K upper blade: meets spine at y~140, sweeps up-right, thorn hook
 "M180 144 C 192 122, 208 96, 232 58 C 219 98, 203 128, 189 154 Z",
 "M232 58 C 226 68, 222 75, 216 83 C 225 79, 231 75, 238 69 Z",
 # --- K lower blade: same vertex, sweeps down-right, barb
 "M180 148 C 194 168, 210 194, 226 232 C 208 200, 192 174, 177 157 Z",
 "M226 232 C 222 223, 219 217, 214 210 C 222 214, 227 218, 233 224 Z",
 # --- crossbar thorn through K spine top (locks Q and K together)
 "M126 96 C 144 92, 162 90, 186 90 C 162 96, 144 99, 128 102 Z",
 # --- sparks
 "M148 122 L 154 133 L 148 144 L 142 133 Z",
 "M56 178 L 61 187 L 56 196 L 51 187 Z",
 "M206 176 L 210 184 L 206 192 L 202 184 Z",
]

# reduced glyph for favicon / small sizes
MARK = [FULL[0], FULL[1], FULL[3], FULL[7], FULL[8], FULL[10]]

GRAD = '''<linearGradient id="ch" x1="0" y1="0" x2="0.3" y2="1">
<stop offset="0%" stop-color="#ffffff"/><stop offset="16%" stop-color="#c9ced9"/>
<stop offset="33%" stop-color="#565b6b"/><stop offset="45%" stop-color="#f2f5fa"/>
<stop offset="57%" stop-color="#8f95a4"/><stop offset="72%" stop-color="#33374４"/>
<stop offset="86%" stop-color="#dbe0ea"/><stop offset="100%" stop-color="#767c8d"/>
</linearGradient>'''.replace("#33374４", "#333744")

def build(paths, stroke=0.7):
    body = "\n".join(f'<path d="{d}"/>' for d in paths)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260">
<defs>{GRAD}</defs>
<g fill="url(#ch)" fill-rule="evenodd" stroke="#eaeef6" stroke-width="{stroke}" stroke-linejoin="round">
{body}
</g></svg>'''

for name, paths, w in (("full", FULL, 560), ("mark", MARK, 240)):
    svg = build(paths)
    open(f"sigil_{name}.svg", "w").write(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=f"peek/sigil_{name}.png",
                     output_width=w, output_height=w, background_color="#0a0a0d")
print("ok")
