#!/usr/bin/env python3
"""Genera le icone PNG dell'app installabile (public/icone) dal pittogramma di CimiTera.
Uso: python scripts/genera-icone.py   (serve Pillow)"""
import math
import pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icone"
NAVY, BLU, VERDE, BIANCO, BASE = "#0A2F55", "#165A92", "#79AA4F", "#FFFFFF", "#D3DAE3"


def disegna(lato, margine):
    """Il pittogramma sta nel riquadro 2..118 x 8..104; lo si disegna 4 volte più grande e poi si riduce."""
    k = 4
    img = Image.new("RGBA", (lato * k, lato * k), BIANCO)
    d = ImageDraw.Draw(img)
    scala = (lato * k) * (1 - 2 * margine) / 116
    ox = (lato * k - 116 * scala) / 2 - 2 * scala
    oy = (lato * k - 96 * scala) / 2 - 8 * scala
    P = lambda x, y: (ox + x * scala, oy + y * scala)

    def rombo(cx, cy, colore, w=36, h=18, kk=0.84):
        a, b = w / 2 * kk, h / 2 * kk
        d.polygon([P(cx - a, cy), P(cx, cy - b), P(cx + a, cy), P(cx, cy + b)], fill=colore)

    T = (60, 74)
    for colore, i, j in [(VERDE, -1, 1), (VERDE, 1, -1), (BLU, 0, 0), (BLU, 1, 0), (BLU, 0, 1), (BLU, 1, 1)]:
        rombo(T[0] + (i - j) * 18, T[1] + (i + j) * 9, colore)
    # segnaposto: cerchio con la punta in basso
    cx, cy, r = 60, 40, 29
    d.ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], fill=NAVY)
    d.polygon([P(44.85, 64.73), P(75.15, 64.73), P(60, 74)], fill=NAVY)
    # base chiara dentro il segnaposto
    maschera = Image.new("L", img.size, 0)
    ImageDraw.Draw(maschera).ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], fill=255)
    strato = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(strato).rectangle([P(20, 58.5), P(100, 88.5)], fill=BASE)
    img.paste(strato, (0, 0), Image.composite(strato.split()[3], Image.new("L", img.size, 0), maschera))
    d = ImageDraw.Draw(img)
    # cappella
    d.rectangle([P(47.5, 37), P(72.5, 58.5)], fill=BIANCO)
    d.polygon([P(44.5, 38.5), P(60, 25.5), P(75.5, 38.5)], fill=BIANCO)
    d.rectangle([P(59, 28.2), P(61, 35.8)], fill=NAVY)
    d.rectangle([P(56.6, 30.3), P(63.4, 32.2)], fill=NAVY)
    d.rectangle([P(55.2, 48.2), P(64.8, 58.5)], fill=NAVY)
    d.ellipse([P(55.2, 43.4), P(64.8, 53.0)], fill=NAVY)
    return img.resize((lato, lato), Image.LANCZOS).convert("RGB")


OUT.mkdir(parents=True, exist_ok=True)
disegna(192, 0.12).save(OUT / "icona-192.png")
disegna(512, 0.12).save(OUT / "icona-512.png")
# "maskable": più margine, perché il telefono ritaglia l'icona in un cerchio o in un quadrato arrotondato
disegna(512, 0.22).save(OUT / "icona-512-maskable.png")
disegna(180, 0.14).save(OUT / "icona-180.png")
print("icone scritte in", OUT)
