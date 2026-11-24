#!/usr/bin/env python3
"""Ritar appikoner, favicon, og-bild och manifest för Kotten snickrar.
Ingen tredjepart. Ikonen: en bräda över en linjal med ett guldstreck där sågen
ska gå – appens mekanik – ritad med få, tjocka former så att den överlever 48 px."""
import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

P = pathlib.Path(__file__).parent / "public"
P.mkdir(exist_ok=True)
ACCENT = (47, 125, 90, 255)
GULD = (232, 163, 61, 255)
VIT = (255, 255, 255, 255)
PAPPER = (250, 247, 242, 255)
BLACK = (20, 24, 31, 255)


def motiv(d, N):
    """Bräda överst, linjal under, guldstreck = var sågen ska gå."""
    # bräda
    bx0, bx1 = N * 0.16, N * 0.84
    by0, by1 = N * 0.20, N * 0.44
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=N * 0.05, fill=GULD)
    # linjal
    ly0, ly1 = N * 0.60, N * 0.80
    d.rounded_rectangle([bx0, ly0, bx1, ly1], radius=N * 0.04, fill=VIT)
    # streck på linjalen
    steg = (bx1 - bx0) / 6.0
    for i in range(7):
        x = bx0 + i * steg
        h = N * 0.14 if i % 3 == 0 else N * 0.09
        d.rounded_rectangle([x - N * 0.012, ly0, x + N * 0.012, ly0 + h],
                            radius=N * 0.012, fill=ACCENT)
    # sågstrecket: går genom brädan, ned mot linjalen
    sx = bx0 + 4 * steg
    d.rounded_rectangle([sx - N * 0.018, by0 - N * 0.05, sx + N * 0.018, ly1],
                        radius=N * 0.018, fill=VIT)


def ikon(N):
    ss = 4
    im = Image.new("RGBA", (N * ss, N * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, N * ss - 1, N * ss - 1], radius=N * ss * 0.23, fill=ACCENT)
    motiv(d, N * ss)
    return im.resize((N, N), Image.LANCZOS)


def favicon():
    N = 512
    im = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, N - 1, N - 1], radius=N * 0.23, fill=ACCENT)
    motiv(d, N)
    im.save(P / "favicon.png")
    (P / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<rect width="100" height="100" rx="23" fill="#2f7d5a"/>'
        '<rect x="16" y="20" width="68" height="24" rx="5" fill="#e8a33d"/>'
        '<rect x="16" y="60" width="68" height="20" rx="4" fill="#fff"/>'
        '<rect x="16" y="60" width="3.2" height="14" rx="1.6" fill="#2f7d5a"/>'
        '<rect x="38.9" y="60" width="3.2" height="14" rx="1.6" fill="#2f7d5a"/>'
        '<rect x="61.8" y="60" width="3.2" height="14" rx="1.6" fill="#2f7d5a"/>'
        '<rect x="78.8" y="60" width="3.2" height="14" rx="1.6" fill="#2f7d5a"/>'
        '<rect x="61.1" y="15" width="3.6" height="65" fill="#fff"/></svg>',
        encoding="utf-8")


def og():
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPPER)
    d = ImageDraw.Draw(im)
    ico = ikon(160)
    im.paste(ico, (int(W / 2 - 80), 56), ico)
    font = small = None
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if pathlib.Path(path).exists():
            font = ImageFont.truetype(path, 88)
            small = ImageFont.truetype(path, 36)
            break
    if font:
        for t, y, f, col in (
            ("Kotten snickrar", 250, font, BLACK),
            ("Mät med linjalen · såga rätt längd · åk 1–3", 368, small, (74, 82, 96)),
            ("Gratis · ingen inloggning · skolappar.com", 448, small, (120, 126, 136)),
        ):
            d.text((W / 2 - d.textlength(t, font=f) / 2, y), t, fill=col, font=f)
    im.save(P / "og.png")


def main():
    favicon()
    ikon(192).save(P / "icon-192.png")
    ikon(512).save(P / "icon-512.png")
    ikon(512).convert("RGB").resize((512, 512), Image.LANCZOS).save(P / "icon-maskable-512.png")
    ikon(180).save(P / "apple-touch-icon.png")
    og()
    (P / "site.webmanifest").write_text(json.dumps({
        "name": "Kotten snickrar – såga rätt längd",
        "short_name": "Snickrar",
        "lang": "sv",
        "start_url": "/",
        "display": "standalone",
        "orientation": "any",
        "background_color": "#faf7f2",
        "theme_color": "#2f7d5a",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (P / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: https://kottensnickrar.skolappar.com/sitemap.xml\n", encoding="utf-8")
    (P / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '<url><loc>https://kottensnickrar.skolappar.com/</loc></url>\n</urlset>\n', encoding="utf-8")
    ikon(48).save(P.parent / "render48.png")
    print("skrev ikoner, favicon, og.png, manifest, robots, sitemap till", P)


if __name__ == "__main__":
    main()