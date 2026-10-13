"""Splash art: original icon on navy, with only the pale plate outline removed."""
from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / "assets" / "icon.png"
out = root / "assets" / "splash.png"

NAVY = (7, 30, 64)
icon = Image.open(src).convert("RGBA")
px = icon.load()
w, h = icon.size


def lum(r, g, b):
    return (r + g + b) / 3.0


def is_margin(r, g, b, a):
    """Flat outer margin only (not the slightly lighter icon plate)."""
    if a < 20:
        return True
    return abs(r - NAVY[0]) <= 10 and abs(g - NAVY[1]) <= 10 and abs(b - NAVY[2]) <= 10 and lum(r, g, b) < 45


def is_pale_outline(r, g, b, a):
    if a < 20:
        return False
    L = lum(r, g, b)
    sat = max(r, g, b) - min(r, g, b)
    return L >= 180 and sat < 40


changed = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if not is_pale_outline(r, g, b, a):
            continue
        touches_margin = False
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                nx, ny = x + dx, y + dy
                if nx < 0 or ny < 0 or nx >= w or ny >= h:
                    touches_margin = True
                    break
                nr, ng, nb, na = px[nx, ny]
                if is_margin(nr, ng, nb, na):
                    touches_margin = True
                    break
            if touches_margin:
                break
        if touches_margin:
            px[x, y] = (*NAVY, 255)
            changed += 1

pad = max(32, w // 8)
canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (*NAVY, 255))
canvas.paste(icon, (pad, pad), icon)
canvas.convert("RGB").save(out, "PNG")
print(f"saved {out} outline_pixels={changed}")
