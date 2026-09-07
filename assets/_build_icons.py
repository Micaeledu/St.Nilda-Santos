"""One-off asset build script. Generates favicons, OG image, and optimizes the
PNG service photo down to JPG. Safe to delete after running once."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
ICONS = os.path.join(ROOT, "assets", "icons")
os.makedirs(ICONS, exist_ok=True)

WINE = (110, 42, 52)        # #6E2A34
CREAM = (250, 245, 239)     # #FAF5EF
INK = (42, 33, 27)          # #2A211B

FONT_BOLD = "C:/Windows/Fonts/cambriab.ttf"
FONT_SERIF = "C:/Windows/Fonts/georgia.ttf"
FONT_SANS = "C:/Windows/Fonts/segoeui.ttf"
FONT_SANS_L = "C:/Windows/Fonts/segoeuil.ttf"

# ---------- 1) Convert the oversized PNG service photo to a lean JPG ----------
png_path = os.path.join(IMG, "servico-drenagem-linfatica.png")
if os.path.exists(png_path):
    im = Image.open(png_path).convert("RGB")
    jpg_path = os.path.join(IMG, "servico-drenagem-linfatica.jpg")
    im.save(jpg_path, "JPEG", quality=82, optimize=True)
    os.remove(png_path)
    print("converted", jpg_path, im.size)

# ---------- 2) Monogram icon (circle + serif "N") ----------
def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, size - 1, size - 1], fill=WINE)
    ring_w = max(2, size // 40)
    d.ellipse([ring_w, ring_w, size - 1 - ring_w, size - 1 - ring_w], outline=CREAM, width=max(1, size // 90))
    font = ImageFont.truetype(FONT_BOLD, int(size * 0.52))
    txt = "N"
    bbox = d.textbbox((0, 0), txt, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1] - size * 0.02), txt, font=font, fill=CREAM)
    return img

sizes = {
    "icon-16.png": 16,
    "icon-32.png": 32,
    "icon-48.png": 48,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
}
imgs = {}
for name, s in sizes.items():
    icon = make_icon(s)
    icon.save(os.path.join(ICONS, name))
    imgs[s] = icon
    print("saved", name)

# favicon.ico with multiple embedded sizes
ico_path = os.path.join(ICONS, "favicon.ico")
imgs[256] = make_icon(256)
imgs[256].save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("saved favicon.ico")

# also drop a copy of favicon.ico at project root (browsers look there by default)
imgs[256].save(os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

# ---------- 3) Social share / OG image (1200x630) ----------
src = Image.open(os.path.join(IMG, "hero-massagem-spa.jpg")).convert("RGB")
# cover-crop to 1200x630
target_w, target_h = 1200, 630
src_ratio = src.width / src.height
target_ratio = target_w / target_h
if src_ratio > target_ratio:
    new_h = src.height
    new_w = int(new_h * target_ratio)
else:
    new_w = src.width
    new_h = int(new_w / target_ratio)
left = (src.width - new_w) // 2
top = (src.height - new_h) // 3  # bias toward upper portion (faces are near top)
crop = src.crop((left, top, left + new_w, top + new_h)).resize((target_w, target_h), Image.LANCZOS)

overlay = Image.new("RGB", (target_w, target_h))
od = ImageDraw.Draw(overlay)
for y in range(target_h):
    t = y / target_h
    r = int(INK[0] * (0.15 + 0.55 * t))
    g = int(INK[1] * (0.15 + 0.55 * t))
    b = int(INK[2] * (0.15 + 0.55 * t))
    od.line([(0, y), (target_w, y)], fill=(r, g, b))
og = Image.blend(crop, overlay, 0.55)

d = ImageDraw.Draw(og)
title_font = ImageFont.truetype(FONT_SERIF, 64)
sub_font = ImageFont.truetype(FONT_SANS_L, 28)
d.text((64, 430), "Studio Nilda Santos", font=title_font, fill=CREAM)
d.text((64, 505), "Massoterapia & Estética Facial e Corporal  •  Salvador, BA", font=sub_font, fill=CREAM)

og.save(os.path.join(IMG, "og-image.jpg"), "JPEG", quality=88, optimize=True)
print("saved og-image.jpg")

print("done")
