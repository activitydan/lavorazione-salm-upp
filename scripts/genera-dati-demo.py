#!/usr/bin/env python3
"""
Genera il dataset DIMOSTRATIVO di SALM-APP per il Cimitero di Ragusa Centro.

Cosa è reale e cosa no:
- I perimetri dei cimiteri vengono da OpenStreetMap (© OpenStreetMap contributors, licenza ODbL):
  way 194940648 (Ragusa Centro), 191248759 (Ragusa Ibla), 246748400 (Marina di Ragusa).
- Campi, filari, colombari e viali sono tracciati a mano sull'ortofoto Esri World Imagery (z19);
  le cappelle stanno sui tetti rossi rilevati per colore (scripts/geo/tetti-cappelle.json).
- Tutto il resto è INVENTATO: nominativi, date, concessioni, stati, flag, manutenzioni, operatori.

Uso:  python scripts/genera-dati-demo.py
Esce: public/demo/salmup-demo.json
"""
import datetime as dt
import json
import math
import pathlib
import random

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "demo" / "salmup-demo.json"
TETTI = ROOT / "scripts" / "geo" / "tetti-cappelle.json"

OGGI = dt.date(2026, 10, 13)
rng = random.Random(20261013)

# ---------------------------------------------------------------------------
# Geometria: coordinate pixel dell'ortofoto z19 (ritaglio 2125x979) <-> lat/lng
# ---------------------------------------------------------------------------
Z = 19
NPX = 256 * 2 ** Z
K = 2125 / 2000  # le zone sono state disegnate su un'anteprima larga 2000 px


def merc(lat, lon):
    x = (lon + 180) / 360 * NPX
    s = math.radians(lat)
    y = (1 - math.log(math.tan(s) + 1 / math.cos(s)) / math.pi) / 2 * NPX
    return x, y


X0, Y0 = merc(36.93510, 14.71530)
M_PX = 156543.03392 * math.cos(math.radians(36.934)) / 2 ** Z  # metri per pixel


def to_ll(p):
    x, y = p
    lon = (X0 + x) / NPX * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (Y0 + y) / NPX))))
    return [round(lat, 7), round(lon, 7)]


def from_ll(lat, lon):
    x, y = merc(lat, lon)
    return (x - X0, y - Y0)


def D(x, y):
    """Coordinate disegnate sull'anteprima -> pixel originali."""
    return (x * K, y * K)


def m(px_meters):
    return px_meters / M_PX


PERIMETRO_RAGUSA = [[36.934233, 14.7157481], [36.934666, 14.7159997], [36.9347551, 14.7164987], [36.9347725, 14.717424], [36.9346747, 14.7174268], [36.9346434, 14.7174351], [36.9346456, 14.7175612], [36.9346799, 14.7175573], [36.9346735, 14.718035], [36.934722, 14.7180358], [36.934725, 14.719786], [36.9345953, 14.7206026], [36.9345449, 14.7206035], [36.9343936, 14.7206043], [36.9341539, 14.7206055], [36.9340755, 14.7206043], [36.9339869, 14.7206032], [36.933758, 14.7206073], [36.9335747, 14.720612], [36.9335565, 14.720435], [36.9333915, 14.7198436], [36.9333626, 14.7180693], [36.934233, 14.7157481]]
PERIMETRO_IBLA = [[36.9194357, 14.7457118], [36.9190649, 14.7454869], [36.9190182, 14.7456037], [36.9189414, 14.7457955], [36.9177827, 14.7450683], [36.9166292, 14.7443752], [36.91691, 14.7436823], [36.9169303, 14.7436951], [36.9169535, 14.743638], [36.9169332, 14.7436251], [36.9172218, 14.7429084], [36.9195179, 14.7444106], [36.9193958, 14.7447], [36.9197814, 14.7449462], [36.9197045, 14.7451342], [36.9196763, 14.7452047], [36.9197152, 14.7452291], [36.9196803, 14.7453162], [36.9196617, 14.7453046], [36.9196071, 14.7454409], [36.9196357, 14.7454587], [36.9196053, 14.7455347], [36.9196405, 14.7455568], [36.9196077, 14.7456388], [36.9195323, 14.7455916], [36.9194745, 14.7457361], [36.9194357, 14.7457118]]
PERIMETRO_MARINA = [[36.8009062, 14.5440799], [36.8003618, 14.5425184], [36.7999262, 14.5412721], [36.7994431, 14.5417188], [36.7990686, 14.5420866], [36.7996715, 14.543795], [36.7997969, 14.543735], [36.7998308, 14.5438337], [36.7997951, 14.5438549], [36.7998216, 14.5439276], [36.7998566, 14.5439085], [36.800014, 14.5443662], [36.7999542, 14.5444065], [36.8000174, 14.5445841], [36.8009062, 14.5440799]]

POLY = [from_ll(a, b) for a, b in PERIMETRO_RAGUSA[:-1]]


def inside(p, poly=POLY):
    x, y = p
    res = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            res = not res
        j = i
    return res


def dist_seg(p, a, b):
    px, py = p
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def dist_bordo(p, poly=POLY):
    return min(dist_seg(p, poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))


def dentro_con_margine(p, margine_m=1.6):
    return inside(p) and dist_bordo(p) > m(margine_m)


def clip(subject, rect):
    """Sutherland-Hodgman: ritaglia il poligono 'subject' con il rettangolo (convesso)."""
    x0, y0, x1, y1 = rect
    edges = [
        (lambda p: p[0] >= x0, lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0]))),
        (lambda p: p[0] <= x1, lambda a, b: (x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0]))),
        (lambda p: p[1] >= y0, lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0)),
        (lambda p: p[1] <= y1, lambda a, b: (a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1)),
    ]
    out = subject
    for ins, inter in edges:
        inp, out = out, []
        if not inp:
            break
        s = inp[-1]
        for e in inp:
            if ins(e):
                if not ins(s):
                    out.append(inter(s, e))
                out.append(e)
            elif ins(s):
                out.append(inter(s, e))
            s = e
    return out


def rect_poly(cx, cy, L, W, ang):
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    pts = []
    for sl, sw in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        pts.append((cx + ux * L / 2 * sl + vx * W / 2 * sw, cy + uy * L / 2 * sl + vy * W / 2 * sw))
    return pts


# ---------------------------------------------------------------------------
# Zone (coordinate sull'anteprima 2000 px)
# ---------------------------------------------------------------------------
CAMPI = [
    ("Campo 1", 665, 357, 790, 440), ("Campo 2", 858, 374, 945, 445), ("Campo 3", 990, 312, 1065, 418),
    ("Campo 4", 1117, 336, 1180, 413), ("Campo 5", 842, 499, 955, 584), ("Campo 6", 1007, 546, 1073, 598),
    ("Campo 7", 1115, 494, 1176, 598), ("Campo 8", 1355, 522, 1534, 588), ("Campo 9", 1007, 626, 1087, 715),
    ("Campo 10", 1106, 616, 1205, 715), ("Campo 11", 1238, 616, 1304, 696), ("Campo 12", 1355, 612, 1421, 696),
    ("Campo 13", 1473, 607, 1544, 687), ("Campo 14", 842, 612, 950, 690), ("Campo 15", 1655, 324, 1782, 438),
    ("Campo 16", 1660, 470, 1782, 588),
]
EDICOLE_EST = [200, 232, 264, 294]  # y dei filari di edicole a nord-est, da x 1662 a 1832
FILARI_NORD = [216, 249, 282, 317]  # y dei filari di tombe a nord, da x 668 a 955
PRATO = [D(405, 262), D(612, 259), D(612, 372)]  # area di ampliamento (lotti liberi)

VIALI = [
    ("Viale Centrale", [(645, 455), (1838, 455)]),
    ("Viale Sud", [(700, 602), (1620, 602)]),
    ("Viale Nord", [(650, 205), (1570, 200)]),
    ("Viale Ovest", [(642, 215), (642, 600)]),
    ("Viale dei Cipressi", [(972, 205), (972, 755)]),
    ("Viale San Giovanni", [(1090, 205), (1090, 755)]),
    ("Viale della Pace", [(1327, 455), (1327, 755)]),
    ("Viale degli Angeli", [(1574, 200), (1574, 750)]),
    ("Viale Est", [(1838, 215), (1838, 672)]),
    ("Viale del Ricordo", [(215, 300), (630, 515)]),
    ("Viale delle Cappelle", [(1100, 305), (1330, 300), (1560, 282)]),
]
VIALI_PX = [(n, [D(*p) for p in pts]) for n, pts in VIALI]

QUADRANTI = [
    ("A", "Quadrante A · Ovest", "#2F6FB3", (100, 100, 642, 800)),
    ("B", "Quadrante B · Nord", "#8E5BB5", (642, 100, 972, 455)),
    ("C", "Quadrante C · Centro", "#1E8C8C", (642, 455, 972, 800)),
    ("D", "Quadrante D · Cappelle", "#C0487A", (972, 100, 1574, 455)),
    ("E", "Quadrante E · Campi Sud", "#5E9A3A", (972, 455, 1327, 800)),
    ("F", "Quadrante F · Sud-Est", "#E07B22", (1327, 455, 1900, 800)),
    ("G", "Quadrante G · Est", "#4F5FB8", (1574, 100, 1900, 455)),
]


def quadrante_di(p):
    x, y = p[0] / K, p[1] / K
    for qid, _, _, (x0, y0, x1, y1) in QUADRANTI:
        if x0 <= x < x1 and y0 <= y < y1:
            return qid
    return "A"


def viale_di(p):
    best, bd = None, 1e9
    for nome, pts in VIALI_PX:
        for i in range(len(pts) - 1):
            d = dist_seg(p, pts[i], pts[i + 1])
            if d < bd:
                best, bd = nome, d
    return best


COLOMBARI = [
    dict(nome="Colombario Monumentale", c=(580, 176), L=331, W=44, ang=-1,
         facce=[("Galleria · lato nord", 5, 30), ("Galleria · lato sud", 5, 30)], era=(1958, 2006), occ=0.96),
    dict(nome="Colombario Ovest", c=(355, 205), L=100, W=36, ang=0,
         facce=[("Fronte", 4, 14), ("Retro", 4, 14)], era=(1950, 1995), occ=0.97),
    dict(nome="Colombario Centrale", c=(908, 351), L=94, W=34, ang=0,
         facce=[("Fronte nord", 5, 16), ("Fronte sud", 5, 16)], era=(1975, 2016), occ=0.93),
    dict(nome="Colombario Perimetrale Sud", c=(830, 678.5), L=300, W=14, ang=26.2,
         facce=[("Lato interno", 4, 36)], era=(2008, 2026), occ=0.62),
    dict(nome="Colombario Est", c=(1845, 531), L=122, W=18, ang=90,
         facce=[("Lato ovest", 5, 18)], era=(1990, 2024), occ=0.88),
    dict(nome="Ossario comunale", tipo="ossario", c=(1263, 484), L=60, W=14, ang=0,
         facce=[("Fronte", 6, 20)], era=(1948, 2012), occ=0.74),
    dict(nome="Cinerario", tipo="cinerario", c=(1032, 484), L=60, W=14, ang=0,
         facce=[("Fronte", 5, 16)], era=(2004, 2026), occ=0.55),
]
for c in COLOMBARI:
    cx, cy = D(*c["c"])
    c["cpx"] = (cx, cy)
    c["poly"] = rect_poly(cx, cy, c["L"] * K, c["W"] * K, c["ang"])

# ---------------------------------------------------------------------------
# Anagrafiche inventate
# ---------------------------------------------------------------------------
COGNOMI = """Occhipinti Iacono Cascone Distefano Battaglia Licitra Giaquinta Criscione Schembari Cannizzaro
Arezzo Cilia Leggio Dipasquale Guastella Cappello Ottaviano Nicosia Tumino Firrincieli Gurrieri Sortino
Iurato Assenza Bocchieri Raniolo Mezzasalma Brugaletta Campo Carfì Cintolo Giummarra Lauretta Mallia
Migliore Floridia Barone Chessari Cultrera Dimartino Frasca Garofalo Padua Scrofani Spadola Vitale Zisa
Baglieri Blandino Cabibbo Calabrese Carbone Cavallo Ferraro Galfo Ingallina Lissandrello Malandrino
Massari Muriana Nobile Pluchino Rizza Ruta Sammito Scollo Stracquadanio Tidona Trovato Vindigni Arestia
Bellio Buscema Canzonieri Cerruto Cosentini Dierna Fidone Gulino Lo Presti Morana Paolino Poidomani
Ragusa Sallemi Tasca Terranova Giunta Puglisi Lo Monaco Rosso Russo Belluardo Interlandi Tomasi""".split()
COGNOMI = [c.replace("_", " ") for c in COGNOMI]
COGNOMI = [c for c in COGNOMI if c not in ("Lo", "Presti", "Monaco")] + ["Lo Presti", "Lo Monaco"]
NOMI_M = """Giuseppe Giovanni Salvatore Carmelo Giorgio Vincenzo Angelo Francesco Antonino Rosario Emanuele
Biagio Corrado Raffaele Orazio Paolo Sebastiano Gaetano Michele Pietro Luigi Domenico Mario Saverio
Ignazio Filippo Gianni Battista Sergio Massimo Andrea Marco Fabio Enzo Turi Nunzio Santo""".split()
NOMI_F = """Maria Giuseppa Carmela Concetta Rosa Giovanna Angela Grazia Lucia Anna Rosaria Vincenza Salvatrice
Margherita Teresa Agata Emanuela Giorgia Francesca Antonina Rosalia Caterina Paola Gaetana Michela
Nunzia Lina Sebastiana Graziella Elena Silvana Pina Carmen Rita Santa""".split()

usati_codici_utenza = set()


def persona(cognome=None, era=(1950, 2026), sesso=None, recente=False):
    sesso = sesso or rng.choice("MF")
    nome = rng.choice(NOMI_M if sesso == "M" else NOMI_F)
    if rng.random() < 0.08:
        nome = nome + " " + rng.choice(NOMI_M if sesso == "M" else NOMI_F)
    cognome = cognome or rng.choice(COGNOMI)
    a, b = era
    if recente:
        anno = int(a + (b - a) * (rng.random() ** 0.55))
    else:
        anno = rng.randint(a, b)
    morte = dt.date(anno, 1, 1) + dt.timedelta(days=rng.randint(0, 364))
    if morte > OGGI - dt.timedelta(days=10):
        morte = OGGI - dt.timedelta(days=rng.randint(10, 200))
    eta = int(max(24, min(103, rng.gauss(79, 11))))
    if rng.random() < 0.03:
        eta = rng.randint(24, 45)
    nascita = morte - dt.timedelta(days=eta * 365 + rng.randint(0, 364))
    return {"nome": nome, "cognome": cognome, "sesso": sesso,
            "dataNascita": nascita.isoformat(), "dataMorte": morte.isoformat()}


def intestatario(cognome):
    sesso = rng.choice("MF")
    return f"{rng.choice(NOMI_M if sesso == 'M' else NOMI_F)} {cognome}"


# ---------------------------------------------------------------------------
# Posizioni
# ---------------------------------------------------------------------------
posizioni = []  # ogni posizione = un manufatto da censire (le strutture portano con sé i loculi)


def aggiungi(kind, p, **kw):
    d = dict(kind=kind, p=p, q=quadrante_di(p), viale=viale_di(p))
    d.update(kw)
    posizioni.append(d)
    return d


def in_colombario(p, margine_m=1.5):
    for c in COLOMBARI:
        cx, cy = c["cpx"]
        a = math.radians(c["ang"])
        dx, dy = p[0] - cx, p[1] - cy
        u = dx * math.cos(a) + dy * math.sin(a)
        v = -dx * math.sin(a) + dy * math.cos(a)
        if abs(u) < c["L"] * K / 2 + m(margine_m) and abs(v) < c["W"] * K / 2 + m(margine_m):
            return True
    return False


# 1) Campi di inumazione
aree = []
for nome, x0, y0, x1, y1 in CAMPI:
    a0, a1 = D(x0, y0), D(x1, y1)
    aree.append(dict(nome=nome, tipo="campo", poly=[a0, (a1[0], a0[1]), a1, (a0[0], a1[1])]))
    sx, sy = m(3.2), m(3.6)
    nx = max(1, int((a1[0] - a0[0] - m(1.2)) // sx))
    ny = max(1, int((a1[1] - a0[1] - m(1.2)) // sy))
    ox = a0[0] + (a1[0] - a0[0] - (nx - 1) * sx) / 2
    oy = a0[1] + (a1[1] - a0[1] - (ny - 1) * sy) / 2
    for j in range(ny):
        for i in range(nx):
            p = (ox + i * sx, oy + j * sy)
            if dentro_con_margine(p, 1.2):
                aggiungi("tomba_campo", p, area=nome, fila=j + 1, num=i + 1)

# 2) Filari di tombe a nord
for k, y in enumerate(FILARI_NORD):
    a0, a1 = D(668, y), D(955, y)
    n = int((a1[0] - a0[0]) // m(3.0))
    for i in range(n + 1):
        p = (a0[0] + i * m(3.0), a0[1])
        if dentro_con_margine(p) and not in_colombario(p):
            aggiungi("tomba_filare", p, area=f"Filare Nord {k + 1}", fila=k + 1, num=i + 1)

# 2b) Edicole di famiglia nel settore est
for k, y in enumerate(EDICOLE_EST):
    a0, a1 = D(1662, y), D(1832, y)
    n = int((a1[0] - a0[0]) // m(4.5))
    for i in range(n + 1):
        p = (a0[0] + i * m(4.5), a0[1])
        if dentro_con_margine(p, 1.8):
            aggiungi("tomba_famiglia", p, area=f"Edicole Est {k + 1}", fila=k + 1, num=i + 1)

# 3) Filari diagonali di tombe di famiglia (settore ovest)
ANG = math.radians(27.5)
ux, uy = math.cos(ANG), math.sin(ANG)
for k, (sx_, sy_, L) in enumerate([(118, 128, 440), (100, 160, 460), (84, 192, 470), (68, 224, 460), (52, 256, 420)]):
    sx0, sy0 = sx_ + 150, sy_ + 130  # coordinate del ritaglio -> pixel originali
    n = int(L // m(3.6))
    for i in range(n + 1):
        p = (sx0 + ux * i * m(3.6), sy0 + uy * i * m(3.6))
        if dentro_con_margine(p, 1.8) and not in_colombario(p, 2.0) and not inside(p, PRATO):
            aggiungi("tomba_famiglia", p, area=f"Filare Ovest {k + 1}", fila=k + 1, num=i + 1)

# 4) Area di ampliamento: lotti
aree.append(dict(nome="Area di ampliamento", tipo="prato", poly=PRATO))
xs = [p[0] for p in PRATO]
ys = [p[1] for p in PRATO]
lotto = 0
yy = min(ys) + m(2.5)
while yy < max(ys):
    xx = min(xs) + m(2.5)
    while xx < max(xs):
        p = (xx, yy)
        if inside(p, PRATO) and all(dist_seg(p, PRATO[i], PRATO[(i + 1) % 3]) > m(1.8) for i in range(3)):
            lotto += 1
            aggiungi("lotto", p, area="Area di ampliamento", num=lotto)
        xx += m(4.2)
    yy += m(4.6)

# 5) Colombari
for idx, c in enumerate(COLOMBARI):
    aggiungi("colombaio", c["cpx"], col=c, idx=idx)

# 6) Cappelle sui tetti rilevati
tetti = json.load(open(TETTI, encoding="utf-8"))
cappelle = []
for x, y, area, bw, bh in sorted(tetti, key=lambda t: (t[1], t[0])):
    p = (x, y)
    if not dentro_con_margine(p, 1.0) or in_colombario(p, 2.5):
        continue
    if any(math.hypot(x - q[0], y - q[1]) < 13 for q in cappelle):
        continue
    if any(inside(p, a["poly"]) for a in aree):
        continue
    cappelle.append((x, y, area, bw, bh))
for x, y, area, bw, bh in cappelle:
    r = 2 if area < 350 else 3
    cc = 1 if area < 700 else 2
    facce = [("Parete sinistra", r, cc), ("Parete destra", r, cc)]
    if area > 900:
        facce.append(("Parete di fondo", r, 2))
    aggiungi("cappella", (x, y), area_px=area, bw=bw, bh=bh, facce=facce)


def schede_attese(pos):
    if pos["kind"] == "colombaio":
        return 1 + sum(r * c for _, r, c in pos["col"]["facce"])
    if pos["kind"] == "cappella":
        return 1 + sum(r * c for _, r, c in pos["facce"])
    return 1

# ---------------------------------------------------------------------------
# Simulazione del censimento: si parte dalla punta sud
# ---------------------------------------------------------------------------
PUNTA_SUD = from_ll(36.9333626, 14.7180693)
PIANO = {  # operatore -> sequenza di (quadrante, quota censita)
    "op-1": [("E", 1.0), ("C", 1.0), ("B", 0.68)],
    "op-2": [("F", 1.0), ("G", 0.42)],
    "op-3": [("A", 1.0), ("D", 0.63)],
}
INIZIO = {"op-1": dt.date(2026, 6, 3), "op-2": dt.date(2026, 6, 8), "op-3": dt.date(2026, 6, 15)}
FERIE = (dt.date(2026, 8, 10), dt.date(2026, 8, 21))
FESTIVI = {dt.date(2026, 6, 2), dt.date(2026, 8, 15)}

PESO = {"tomba_campo": 1.0, "tomba_filare": 1.1, "tomba_famiglia": 1.4, "lotto": 0.5, "cappella": 1.0, "colombaio": 2.0}
PESO_POSTO = 0.3  # ogni loculo di una struttura


def giorni_lavorativi(da, a):
    g = []
    d = da
    while d < a:
        if d.weekday() < 5 and d not in FESTIVI and not (FERIE[0] <= d <= FERIE[1]):
            g.append(d)
        d += dt.timedelta(days=1)
    return g


def ordine_serpentina(lista):
    """Righe di ~12 m partendo da sud; ogni riga alterna il verso, come sul campo."""
    righe = {}
    for pos in lista:
        r = int((PUNTA_SUD[1] - pos["p"][1]) // m(12))
        righe.setdefault(r, []).append(pos)
    out = []
    for r in sorted(righe):
        riga = sorted(righe[r], key=lambda q: q["p"][0], reverse=(r % 2 == 1))
        out.extend(riga)
    return out


stima_per_quadrante = {}
for pos in posizioni:
    stima_per_quadrante[pos["q"]] = stima_per_quadrante.get(pos["q"], 0) + schede_attese(pos)

censiti = []  # (data, ora_min, operatore, posizione)
for op, piano in PIANO.items():
    sequenza = []
    for q, quota in piano:
        lista = ordine_serpentina([p for p in posizioni if p["q"] == q])
        n = round(len(lista) * quota)
        sequenza.extend(lista[:n])
    giorni = giorni_lavorativi(INIZIO[op], OGGI)
    peso = lambda p: PESO[p["kind"]] + PESO_POSTO * (schede_attese(p) - 1)
    tot = sum(peso(p) for p in sequenza)
    per_giorno = tot / (len(giorni) + 0.5)  # l'ultimo mezzo giorno e' oggi
    acc = 0.0
    for p in sequenza:
        gi = min(int(acc / per_giorno), len(giorni))
        giorno = giorni[gi] if gi < len(giorni) else OGGI
        frazione = (acc / per_giorno) - gi
        minuti = int(8 * 60 + frazione * 5.5 * 60) + rng.randint(0, 6)
        censiti.append((giorno, minuti, op, p))
        acc += peso(p)

censiti.sort(key=lambda t: (t[0], t[1], t[2]))

# ---------------------------------------------------------------------------
# Costruzione schede
# ---------------------------------------------------------------------------
OPERATORI = [
    dict(id="op-1", nome="Giorgio Licitra", ruolo="Operatore", telefono="+39 333 000 1101", email="g.licitra@esempio.it", colore="#2F6FB3", attivo=True),
    dict(id="op-2", nome="Martina Cascone", ruolo="Operatore", telefono="+39 333 000 1102", email="m.cascone@esempio.it", colore="#E07B22", attivo=True),
    dict(id="op-3", nome="Salvatore Occhipinti", ruolo="Operatore", telefono="+39 333 000 1103", email="s.occhipinti@esempio.it", colore="#1E8C8C", attivo=True),
    dict(id="op-4", nome="Elena Distefano", ruolo="Operatore", telefono="+39 333 000 1104", email="e.distefano@esempio.it", colore="#8E5BB5", attivo=True),
]
NOME_OP = {o["id"]: o["nome"] for o in OPERATORI}

schede = []
strutture = []
seq = 0
conc_seq = {}


def nuovo_id():
    global seq
    seq += 1
    return f"CIM-RAG-{seq:06d}"


def numero_concessione(anno):
    conc_seq[anno] = conc_seq.get(anno, 0) + 1
    return f"CON-{anno}/{conc_seq[anno]:04d}"


def concessione(inizio, durata, cognome, intest=None):
    scad = inizio.replace(year=inizio.year + durata) if not (inizio.month == 2 and inizio.day == 29) else dt.date(inizio.year + durata, 2, 28)
    rinnovi = 0
    while scad < OGGI - dt.timedelta(days=365):
        scad = scad.replace(year=scad.year + durata) if not (scad.month == 2 and scad.day == 29) else dt.date(scad.year + durata, 2, 28)
        rinnovi += 1
    return dict(numero=numero_concessione(inizio.year), intestatario=intest or intestatario(cognome),
                dataInizio=inizio.isoformat(), dataScadenza=scad.isoformat(), durataAnni=durata, rinnovi=rinnovi)


def scegli(pesi):
    r = rng.random() * sum(pesi.values())
    for k, w in pesi.items():
        r -= w
        if r <= 0:
            return k
    return k


def stato_occupato():
    return scegli({"occupato": 86, "da_manutenzionare": 6, "da_verificare": 6, "inaccessibile": 2})


def stato_libero():
    return scegli({"libero": 95, "da_verificare": 5})


MATERIALI = {"marmo_carrara": 34, "calcare_ibleo": 24, "granito": 20, "pietra_pece": 14, "travertino": 8}
NOTE = ["Foto ceramica presente sulla lapide", "Vaso portafiori in bronzo", "Epigrafe in latino",
        "Lapide restaurata di recente", "Fiori artificiali", "Iscrizione parzialmente consumata",
        "Presenza di cornice in ottone", "Lumino a batteria non collegato alla rete"]


def campi_dinamici(kind, stato, defunti, conc, in_cappella=False, in_colombario=False):
    occupato = len(defunti) > 0
    p_lampada = {"tomba_campo": 0.45, "tomba_filare": 0.5, "tomba_famiglia": 0.55, "loculo": 0.62, "cappella": 0.7,
                 "celletta_ossario": 0.22, "nicchia_cineraria": 0.3}.get(kind, 0)
    lampada = (occupato or kind == "cappella") and rng.random() < p_lampada and stato != "inaccessibile"
    c = {"lampada_votiva": lampada}
    if conc or lampada:
        c["stato_pagamenti"] = scegli({"regolare": 85, "moroso": 10, "in_verifica": 5})
    if lampada:
        c["canone_lampada"] = {"cappella": 48.0, "tomba_famiglia": 30.0}.get(kind, 24.0)
        while True:
            cod = f"LV-{rng.randint(1000, 39999):05d}"
            if cod not in usati_codici_utenza:
                usati_codici_utenza.add(cod)
                break
        c["codice_utenza"] = cod
        c["intestatario_utenza"] = conc["intestatario"] if conc else intestatario(defunti[0]["cognome"] if defunti else rng.choice(COGNOMI))
    if kind in ("tomba_campo", "tomba_filare", "tomba_famiglia", "loculo", "cappella", "celletta_ossario", "nicchia_cineraria"):
        c["materiale"] = scegli(MATERIALI)
        if stato == "da_manutenzionare":
            c["condizione_lapide"] = scegli({"danneggiata": 70, "discreta": 30})
        else:
            c["condizione_lapide"] = scegli({"buona": 74, "discreta": 21, "danneggiata": 5})
    return c


def nuova_scheda(kind_tip, p, pos, giorno, minuti, op, stato, defunti, conc, campi, **extra):
    ll = to_ll(p)
    ts = dt.datetime.combine(giorno, dt.time(minuti // 60 % 24, minuti % 60))
    s = dict(id=nuovo_id(), cimiteroId="ragusa-centro", tipologia=kind_tip, stato=stato,
             lat=ll[0], lng=ll[1], viale=pos["viale"], quadranteId=f"q-{pos['q']}",
             defunti=defunti, concessione=conc, campi=campi,
             rilevatoDa=op, rilevatoIl=ts.isoformat(timespec="minutes"), aggiornatoIl=ts.isoformat(timespec="minutes"))
    if rng.random() < 0.07:
        s["note"] = rng.choice(NOTE)
    s.update(extra)
    if stato == "da_verificare" and defunti and rng.random() < 0.45:
        d0 = defunti[0]
        if rng.random() < 0.6:
            d0["dataMorte"] = None
            d0["dataNascita"] = None
            s["note"] = "Lapide illeggibile: date da recuperare dal registro cartaceo"
        else:
            d0["nome"] = ""
            s["note"] = "Nome non leggibile sulla lapide"
    schede.append(s)
    return s


def anno(d):
    return dt.date.fromisoformat(d).year if d else None


for giorno, minuti, op, pos in censiti:
    k = pos["kind"]
    p = pos["p"]
    if k in ("tomba_campo", "tomba_filare", "tomba_famiglia"):
        era = {"tomba_campo": (2011, 2026), "tomba_filare": (1955, 2018), "tomba_famiglia": (1935, 2024)}[k]
        occ = {"tomba_campo": 0.92, "tomba_filare": 0.97, "tomba_famiglia": 0.98}[k]
        if rng.random() < occ:
            cog = rng.choice(COGNOMI)
            n = 1 if k == "tomba_campo" else (rng.randint(1, 3) if k == "tomba_filare" else rng.randint(2, 5))
            defunti = sorted([persona(cog if (i == 0 or rng.random() < 0.7) else None, era, recente=(k == "tomba_campo")) for i in range(n)], key=lambda d: d["dataMorte"])
            # la fossa in campo comune non ha concessione: ha il turno
            conc = None if k == "tomba_campo" else concessione(dt.date.fromisoformat(defunti[0]["dataMorte"]), 99, cog)
            stato = stato_occupato()
        else:
            defunti, conc, stato = [], None, stato_libero()
        nuova_scheda("fossa" if k == "tomba_campo" else "tomba_famiglia", p, pos, giorno, minuti, op, stato, defunti, conc,
                     campi_dinamici(k, stato, defunti, conc), area=pos["area"], numeroPosto=f"Fila {pos['fila']} · n. {pos['num']}")
    elif k == "lotto":
        in_costruzione = rng.random() < 0.09
        tip = "tomba_famiglia" if in_costruzione else "fossa"
        stato = "inaccessibile" if in_costruzione else ("libero" if rng.random() < 0.94 else "da_verificare")
        nuova_scheda(tip, p, pos, giorno, minuti, op, stato, [], None, {"lampada_votiva": False},
                     area=pos["area"], numeroPosto=f"Lotto {pos['num']}")
    elif k in ("colombaio", "cappella"):
        if k == "colombaio":
            c = pos["col"]
            nome = c["nome"]
            facce = c["facce"]
            era, occ = c["era"], c["occ"]
            footprint = c["poly"]
            centro, L, W, ang = c["cpx"], c["L"] * K, c["W"] * K, c["ang"]
        else:
            cog_fam = rng.choice(COGNOMI)
            nome = f"Cappella Fam. {cog_fam}"
            facce = pos["facce"]
            era, occ = (1922, 2026), 0.62
            centro = p
            L, W, ang = max(pos["bw"], 12), max(pos["bh"], 12), 0
            footprint = rect_poly(p[0], p[1], L, W, 0)
        sid = f"STR-{len(strutture) + 1:03d}"
        tipo_str = pos["col"].get("tipo", "colombaio") if k == "colombaio" else "cappella"
        stato_c = "occupato"
        # scheda contenitore
        if k == "cappella":
            fondazione = dt.date(rng.randint(1905, 1985), rng.randint(1, 12), rng.randint(1, 28))
            conc_c = concessione(fondazione, 99, cog_fam, intest=f"Eredi {cog_fam}")
        else:
            conc_c = None
        # la cappella è una tomba di famiglia; colombaio, ossario e cinerario sono solo strutture
        tip_posto = {"colombaio": "loculo", "cappella": "loculo", "ossario": "celletta_ossario", "cinerario": "nicchia_cineraria"}[tipo_str]
        contenitore = nuova_scheda("tomba_famiglia" if k == "cappella" else "struttura", centro, pos, giorno, minuti, op, "occupato", [], conc_c, {}, nomeManufatto=nome, strutturaId=sid)
        loculi = []
        totale_posti = sum(r * cc for _, r, cc in facce)
        for fi, (fnome, righe, colonne) in enumerate(facce):
            for fila in range(1, righe + 1):
                for col in range(1, colonne + 1):
                    # posizione del loculo lungo la parete
                    if k == "colombaio":
                        t = (col - 0.5) / colonne - 0.5
                        side = 0 if len(facce) == 1 else (-0.25 if fi == 0 else 0.25)
                    else:
                        t = (col - 0.5) / colonne * 0.6 - 0.3
                        side = (-0.3, 0.3, 0.0)[fi % 3]
                    a = math.radians(ang)
                    lp = (centro[0] + math.cos(a) * t * L - math.sin(a) * side * W,
                          centro[1] + math.sin(a) * t * L + math.cos(a) * side * W)
                    if rng.random() < occ:
                        cog = cog_fam if (k == "cappella" and rng.random() < 0.72) else None
                        d = persona(cog, era)
                        if rng.random() < (0.35 if tipo_str == "ossario" else 0.05) and k == "colombaio":
                            defs = sorted([d, persona(d["cognome"], (anno(d["dataMorte"]), min(2026, anno(d["dataMorte"]) + 25)))], key=lambda x: x["dataMorte"])
                        else:
                            defs = [d]
                        durata_posto = 30 if tipo_str in ("ossario", "cinerario") else 60
                        conc = None if k == "cappella" else concessione(dt.date.fromisoformat(defs[0]["dataMorte"]), durata_posto, defs[0]["cognome"])
                        st = stato_occupato()
                    else:
                        defs, conc, st = [], None, stato_libero()
                    campi = campi_dinamici(tip_posto, st, defs, conc)
                    s = nuova_scheda(tip_posto, lp, pos, giorno, minuti, op, st, defs, conc, campi,
                                     posizione=dict(strutturaId=sid, faccia=fi, fila=fila, colonna=col))
                    if k == "cappella":
                        s["note"] = "Posto incluso nella concessione della cappella"
                    loculi.append(s)
        occupati = sum(1 for s in loculi if s["defunti"])
        if occupati == 0:
            stato_c = "libero"
        else:
            stato_c = scegli({"occupato": 88, "da_manutenzionare": 7, "da_verificare": 3, "inaccessibile": 2})
        if nome == "Colombario Ovest":
            stato_c = "da_manutenzionare"
        contenitore["stato"] = stato_c
        contenitore["campi"] = campi_dinamici(k, stato_c, [1] if occupati else [], conc_c)
        contenitore["campi"].pop("stato_pagamenti", None) if k == "colombaio" else None
        if k == "colombaio":
            contenitore["campi"]["lampada_votiva"] = False
            for key in ("canone_lampada", "codice_utenza", "intestatario_utenza"):
                contenitore["campi"].pop(key, None)
        strutture.append(dict(id=sid, cimiteroId="ragusa-centro", tipo=tipo_str, nome=nome, schedaId=contenitore["id"],
                              lat=to_ll(centro)[0], lng=to_ll(centro)[1], angolo=ang,
                              lunghezzaM=round(L * M_PX, 1), larghezzaM=round(W * M_PX, 1),
                              impronta=[to_ll(q) for q in footprint],
                              facce=[dict(nome=f, righe=r, colonne=cc) for f, r, cc in facce],
                              viale=pos["viale"], quadranteId=f"q-{pos['q']}"))

# ---------------------------------------------------------------------------
# Concessioni in scadenza: ne garantiamo un numero realistico nei prossimi 6 mesi
# ---------------------------------------------------------------------------
con_conc = [s for s in schede if s.get("concessione") and s["defunti"]]
in_scadenza = [s for s in con_conc if OGGI <= dt.date.fromisoformat(s["concessione"]["dataScadenza"]) <= OGGI + dt.timedelta(days=183)]
for s in rng.sample(con_conc, max(0, 46 - len(in_scadenza))):
    c = s["concessione"]
    nuova = OGGI + dt.timedelta(days=rng.randint(5, 182))
    inizio = dt.date.fromisoformat(c["dataInizio"])
    c["dataScadenza"] = nuova.isoformat()
    c["rinnovi"] = max(0, (nuova.year - inizio.year) // c["durataAnni"] - 1)

# ---------------------------------------------------------------------------
# Manutenzioni e verifiche
# ---------------------------------------------------------------------------
CAT_PER = {
    "loculo": {"lapide_danneggiata": 35, "infiltrazioni": 20, "lampada_guasta": 30, "pulizia": 15},
    "tomba": {"lapide_danneggiata": 30, "vegetazione": 30, "cedimento": 20, "lampada_guasta": 20},
    "fossa": {"lapide_danneggiata": 30, "vegetazione": 40, "cedimento": 10, "lampada_guasta": 20},
    "tomba_famiglia": {"infiltrazioni": 30, "cedimento": 25, "pulizia": 15, "vegetazione": 15, "lapide_danneggiata": 15},
    "celletta_ossario": {"lapide_danneggiata": 60, "pulizia": 40},
    "nicchia_cineraria": {"lapide_danneggiata": 60, "pulizia": 40},
    "struttura": {"infiltrazioni": 60, "cedimento": 40},
}
DESCR = {
    "lapide_danneggiata": ["Lastra di marmo incrinata nell'angolo inferiore", "Lapide con frattura verticale, rischio distacco", "Cornice della lapide scheggiata"],
    "infiltrazioni": ["Macchie di umidità e infiltrazioni dalla copertura", "Efflorescenze saline sulla parete, probabile infiltrazione", "Gocciolamento dal solaio dopo le ultime piogge"],
    "lampada_guasta": ["Lampada votiva spenta, possibile guasto al portalampada", "Lampada votiva intermittente", "Cavo di alimentazione della lampada scoperto"],
    "vegetazione": ["Vegetazione infestante sulla postazione", "Radici che sollevano la pavimentazione vicina", "Erbacce tra le lastre del basamento"],
    "cedimento": ["Cedimento del basamento lato viale", "Fessurazione strutturale da monitorare", "Avvallamento del terreno davanti alla postazione"],
    "pulizia": ["Pulizia straordinaria del prospetto", "Rimozione depositi e guano dalla copertura", "Pulizia dei vasi e del ripiano"],
}
manutenzioni = []
man_seq = 0


def nuova_manutenzione(s, stato, data_segn):
    global man_seq
    man_seq += 1
    cat = scegli(CAT_PER.get(s["tipologia"], CAT_PER["tomba"]))
    if cat == "lampada_guasta" and not s["campi"].get("lampada_votiva"):
        cat = "lapide_danneggiata" if s["tipologia"] in ("loculo", "fossa", "celletta_ossario", "nicchia_cineraria") else "pulizia"
    prio = scegli({"bassa": 22, "media": 42, "alta": 26, "urgente": 10})
    if cat == "cedimento":
        prio = rng.choice(["alta", "urgente"])
    # chi l'ha registrata: l'operatore del rilievo oppure l'ufficio (anche quando telefona un cittadino)
    segnalata_da = s["rilevatoDa"] if rng.random() < 0.7 else "ufficio"
    mm = dict(id=f"MAN-2026-{man_seq:04d}", schedaId=s["id"], cimiteroId="ragusa-centro", categoria=cat, priorita=prio, stato=stato,
              descrizione=rng.choice(DESCR[cat]), segnalataDa=segnalata_da, segnalataIl=data_segn.isoformat())
    if stato in ("programmata", "risolta"):
        mm["operatoriIds"] = rng.sample(OP_IDS, rng.choice([1, 1, 2]))
    if stato == "programmata":
        mm["dataProgrammata"] = (OGGI + dt.timedelta(days=rng.randint(0, 24))).isoformat()
    if stato == "risolta":
        risolta = min(OGGI - dt.timedelta(days=1), data_segn + dt.timedelta(days=rng.randint(3, 30)))
        mm["dataProgrammata"] = (risolta - dt.timedelta(days=rng.randint(0, 2))).isoformat()
        mm["risoltaIl"] = risolta.isoformat()
        mm["noteRisoluzione"] = rng.choice(["Intervento completato, postazione ripristinata", "Sostituito il componente danneggiato", "Pulizia e messa in sicurezza eseguite", "Ripristino eseguito"])
        mm["fotoRisoluzione"] = "demo"
    if stato == "annullata":
        mm["annullataIl"] = min(OGGI, data_segn + dt.timedelta(days=rng.randint(1, 9))).isoformat()
        mm["motivoAnnullamento"] = rng.choice(["Doppione", "Segnalazione sbagliata"])
    manutenzioni.append(mm)
    return mm


OP_IDS = [o["id"] for o in OPERATORI]
for s in schede:
    if s["stato"] == "da_manutenzionare":
        st = scegli({"aperta": 48, "programmata": 52})
        rilevato = dt.date.fromisoformat(s["rilevatoIl"][:10])
        segn = rilevato if st == "aperta" and rng.random() < 0.6 else min(OGGI, rilevato + dt.timedelta(days=rng.randint(0, 20)))
        nuova_manutenzione(s, st, segn)
vecchie = [s for s in schede if s["stato"] == "occupato" and s["rilevatoIl"] < "2026-09-01"]
for s in rng.sample(vecchie, 28):
    rilevato = dt.date.fromisoformat(s["rilevatoIl"][:10])
    nuova_manutenzione(s, "risolta", rilevato + dt.timedelta(days=rng.randint(0, 10)))
for s in rng.sample(vecchie, 5):
    rilevato = dt.date.fromisoformat(s["rilevatoIl"][:10])
    nuova_manutenzione(s, "annullata", rilevato + dt.timedelta(days=rng.randint(0, 10)))
# ogni operatore ha almeno 3 manutenzioni programmate; qualcuna oggi e domani, per gli alert della campanella
programmate = [mm for mm in manutenzioni if mm["stato"] == "programmata"]
for i, oid in enumerate(OP_IDS):
    sue = [mm for mm in programmate if oid in mm["operatoriIds"]]
    for mm in rng.sample([x for x in programmate if oid not in x["operatoriIds"]], max(0, 3 - len(sue))):
        mm["operatoriIds"].append(oid)
    sue = [mm for mm in programmate if oid in mm["operatoriIds"]]
    sue[0]["dataProgrammata"] = OGGI.isoformat()
    sue[1]["dataProgrammata"] = (OGGI + dt.timedelta(days=1)).isoformat()
manutenzioni.sort(key=lambda x: x["segnalataIl"])

MOTIVI = {"lapide_illeggibile": 30, "dati_incompleti": 25, "gps_da_confermare": 20, "foto_non_nitida": 10, "discordanza_registro": 15}
verifiche = []
ver_seq = 0
for s in schede:
    if s["stato"] == "da_verificare":
        ver_seq += 1
        motivo = "lapide_illeggibile" if s.get("note", "").startswith(("Lapide illeggibile", "Nome non leggibile")) else scegli(MOTIVI)
        ass = min(OGGI, dt.date.fromisoformat(s["rilevatoIl"][:10]) + dt.timedelta(days=rng.randint(1, 6)))
        verifiche.append(dict(id=f"VER-{ver_seq:04d}", schedaId=s["id"], operatoreId=rng.choice(["op-4", "op-4", "op-1", "op-3"]), motivo=motivo,
                              assegnataIl=ass.isoformat(), scadenza=(ass + dt.timedelta(days=rng.randint(10, 35))).isoformat(), stato="aperta"))
for s in rng.sample([s for s in schede if s["stato"] == "occupato" and s["rilevatoIl"] < "2026-09-15"], 32):
    ver_seq += 1
    ass = dt.date.fromisoformat(s["rilevatoIl"][:10]) + dt.timedelta(days=rng.randint(1, 5))
    chiusa = ass + dt.timedelta(days=rng.randint(2, 14))
    verifiche.append(dict(id=f"VER-{ver_seq:04d}", schedaId=s["id"], operatoreId="op-4", motivo=scegli(MOTIVI),
                          assegnataIl=ass.isoformat(), scadenza=(ass + dt.timedelta(days=20)).isoformat(), stato="completata",
                          completataIl=min(chiusa, OGGI).isoformat(), esito=scegli({"confermata": 60, "corretta": 40}),
                          noteEsito=rng.choice(["Dati confermati con il registro", "Corretta la data di morte", "Corretto il viale di appartenenza", "Posizione GPS aggiustata"])))
verifiche.sort(key=lambda v: v["assegnataIl"])

# Alert personali: ognuno riceve solo ciò che ha aperto o che gli è assegnato
alert = []
def nuovo_alert(dest, titolo, messaggio, link, giorni_fa=0, livello="info"):
    alert.append(dict(id=f"AL-{len(alert) + 1:04d}", destinatario=dest, data=f"{(OGGI - dt.timedelta(days=giorni_fa)).isoformat()}T{8 + len(alert) % 9:02d}:{(len(alert) * 7) % 60:02d}",
                      livello=livello, titolo=titolo, messaggio=messaggio, link=link))

CAT_LABEL = {"lapide_danneggiata": "Lapide danneggiata", "infiltrazioni": "Infiltrazioni d'acqua", "lampada_guasta": "Lampada votiva guasta",
             "vegetazione": "Vegetazione infestante", "cedimento": "Cedimento strutturale", "pulizia": "Pulizia straordinaria"}
def data_it(iso):
    return f"{iso[8:10]}/{iso[5:7]}/{iso[0:4]}"
for oid in OP_IDS:
    for k, mm in enumerate([x for x in manutenzioni if x["stato"] == "programmata" and oid in x["operatoriIds"]][:3]):
        nuovo_alert(oid, "Manutenzione assegnata a te", f"{CAT_LABEL[mm['categoria']]} · {mm['schedaId']}, il {data_it(mm['dataProgrammata'])}", f"/manutenzioni?id={mm['id']}", giorni_fa=k + 1)
for dest in OP_IDS + ["ufficio"]:
    for k, mm in enumerate([x for x in manutenzioni if x["stato"] == "risolta" and x["segnalataDa"] == dest][-2:]):
        nuovo_alert(dest, "Manutenzione risolta", f"{CAT_LABEL[mm['categoria']]} · {mm['schedaId']}", f"/manutenzioni?id={mm['id']}", giorni_fa=k + 2)
    for mm in [x for x in manutenzioni if x["stato"] == "annullata" and x["segnalataDa"] == dest][-1:]:
        nuovo_alert(dest, "Manutenzione annullata", f"{CAT_LABEL[mm['categoria']]} · {mm['schedaId']} · {mm['motivoAnnullamento']}", f"/manutenzioni?id={mm['id']}", giorni_fa=4, livello="attenzione")

# ---------------------------------------------------------------------------
# Uscita
# ---------------------------------------------------------------------------
cimiteri = [
    dict(id="ragusa-centro", nome="Cimitero di Ragusa Centro", breve="Ragusa Centro", codice="RAG", comune="Ragusa",
         perimetro=PERIMETRO_RAGUSA, centro=to_ll(D(1000, 455)), zoom=18,
         puntoPartenza=[36.9333626, 14.7180693], fonteGeometria="OpenStreetMap way 194940648 (ODbL)",
         censimento=dict(inizio="2026-06-03", stato="in_corso")),
    dict(id="ragusa-ibla", nome="Cimitero di Ragusa Ibla", breve="Ragusa Ibla", codice="IBL", comune="Ragusa",
         perimetro=PERIMETRO_IBLA, centro=[36.91822, 14.74445], zoom=18, puntoPartenza=[36.9166292, 14.7443752],
         fonteGeometria="OpenStreetMap way 191248759 (ODbL)", censimento=dict(stato="da_avviare")),
    dict(id="marina-di-ragusa", nome="Cimitero di Marina di Ragusa", breve="Marina di Ragusa", codice="MAR", comune="Ragusa",
         perimetro=PERIMETRO_MARINA, centro=[36.79999, 14.54287], zoom=19, puntoPartenza=[36.7990686, 14.5420866],
         fonteGeometria="OpenStreetMap way 246748400 (ODbL)", censimento=dict(stato="da_avviare")),
]
quadranti = []
for qid, nome, colore, rect in QUADRANTI:
    poly = clip(POLY, tuple(v * K for v in rect))
    op = next((o for o, piano in PIANO.items() if any(q == qid for q, _ in piano)), None)
    quota = next((quota for piano in PIANO.values() for q, quota in piano if q == qid), 0)
    quadranti.append(dict(id=f"q-{qid}", cimiteroId="ragusa-centro", codice=qid, nome=nome, colore=colore,
                          poligono=[to_ll(p) for p in poly], operatoreId=op,
                          stato="completato" if quota >= 1 else "in_corso",
                          stimaManufatti=stima_per_quadrante.get(qid, 0)))
viali = [dict(id=f"v-{i + 1}", cimiteroId="ragusa-centro", nome=n, tracciato=[to_ll(p) for p in pts]) for i, (n, pts) in enumerate(VIALI_PX)]
aree_out = [dict(id=f"a-{i + 1}", cimiteroId="ragusa-centro", nome=a["nome"], tipo=a["tipo"], poligono=[to_ll(p) for p in a["poly"]]) for i, a in enumerate(aree)]

dataset = dict(
    versione=1, generatoIl=OGGI.isoformat(), avviso="Dati dimostrativi: nominativi, date e stati sono inventati.",
    cimiteri=cimiteri, quadranti=quadranti, viali=viali, aree=aree_out, strutture=strutture, operatori=OPERATORI,
    schede=schede, manutenzioni=manutenzioni, verifiche=verifiche, alert=alert,
)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(dataset, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

# Riepilogo
from collections import Counter
print(f"posizioni stimate: {len(posizioni)} | schede: {len(schede)} | strutture: {len(strutture)} | file: {OUT.stat().st_size / 1024:.0f} KB")
print("tipologie:", dict(Counter(s["tipologia"] for s in schede)))
print("stati:", dict(Counter(s["stato"] for s in schede)))
print("per quadrante (censite/stimate):", {q["codice"]: (sum(1 for s in schede if s["quadranteId"] == q["id"]), q["stimaManufatti"]) for q in quadranti})
print("defunti:", sum(len(s["defunti"]) for s in schede))
print("concessioni in scadenza 6 mesi:", sum(1 for s in schede if s.get("concessione") and OGGI <= dt.date.fromisoformat(s["concessione"]["dataScadenza"]) <= OGGI + dt.timedelta(days=183)))
print("concessioni scadute:", sum(1 for s in schede if s.get("concessione") and dt.date.fromisoformat(s["concessione"]["dataScadenza"]) < OGGI))
print("lampade votive:", sum(1 for s in schede if s["campi"].get("lampada_votiva")))
print("manutenzioni:", dict(Counter(mm["stato"] for mm in manutenzioni)), "| verifiche:", dict(Counter(v["stato"] for v in verifiche)))
print("ultima scheda:", schede[-1]["id"], schede[-1]["rilevatoIl"])
