#!/usr/bin/env python3
"""Genera le icone PNG dell'app installabile (public/icone) dal pittogramma di CimiTera.
Uso: python scripts/genera-icone.py   (serve Pillow)"""
import pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icone"
NAVY, VERDE, BIANCO = "#0A2F55", "#79AA4F", "#FFFFFF"


def disegna(lato, margine):
    """Griglia 3x3 di quadrati arrotondati, quello al centro verde; si disegna 4 volte più grande e poi si riduce."""
    k = 4
    img = Image.new("RGBA", (lato * k, lato * k), BIANCO)
    d = ImageDraw.Draw(img)
    scala = (lato * k) * (1 - 2 * margine) / 90
    o = (lato * k - 90 * scala) / 2
    for r in range(3):
        for c in range(3):
            x, y = o + c * 32 * scala, o + r * 32 * scala
            d.rounded_rectangle([x, y, x + 26 * scala, y + 26 * scala], radius=7 * scala, fill=VERDE if (r, c) == (1, 1) else NAVY)
    return img.resize((lato, lato), Image.LANCZOS).convert("RGB")


OUT.mkdir(parents=True, exist_ok=True)
disegna(192, 0.12).save(OUT / "icona-192.png")
disegna(512, 0.12).save(OUT / "icona-512.png")
# "maskable": più margine, perché il telefono ritaglia l'icona in un cerchio o in un quadrato arrotondato
disegna(512, 0.22).save(OUT / "icona-512-maskable.png")
disegna(180, 0.14).save(OUT / "icona-180.png")
print("icone scritte in", OUT)
