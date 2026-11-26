"""
Bake TFAM Illustrated Grand Campaign Atlas plates & SVG hit layers:
- 3 Theatres per Act: grand, europe, asia
- 3 Chronicle Acts:
    * act1: Canticle of Chaos (24 Sovereign Realms)
    * act2: Shattered Symphony (28 Realms: Wardenholf, Khorvait, Nhemora, Veldraine + frontier shifts)
    * act3: Draconic Apocalypse (Unfolding — reuses latest frontier plates until revealed)
- Pure Python + Pillow (no external GIS runtime required).
"""
from pathlib import Path
import gzip
import io
import json
import math
import re
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public/atlas-static"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_DISPLAY = str(ROOT / "public/fonts/Cinzel-Variable.ttf")
FONT_ITALIC = str(ROOT / "public/fonts/EBGaramond-Italic-Variable.ttf")

THEATRES = {
    "grand": {
        "id": "grand",
        "en": "Grand Campaign · Known World",
        "short": "Grand Campaign",
        "bounds": [-132, -52, 156, 73],
        "width": 2400,
    },
    "europe": {
        "id": "europe",
        "en": "Theatre of Europe & the Mediterranean",
        "short": "Europe & Mediterranean",
        "bounds": [-24, 18, 58, 72],
        "width": 1800,
    },
    "asia": {
        "id": "asia",
        "en": "Theatre of Asia & the Orient",
        "short": "Asia & the Orient",
        "bounds": [52, -14, 152, 58],
        "width": 1800,
    },
}

ACTS = [
    {
        "id": "act1",
        "roman": "I",
        "title": "CANTICLE OF CHAOS",
        "label": "Act I · Canticle of Chaos",
        "subtitle_grand": "The Twenty-Four Sovereign Realms",
        "subtitle_europe": "Theatre of Europe & the Mediterranean",
        "subtitle_asia": "Theatre of Asia & the Orient",
        "baked": True,
    },
    {
        "id": "act2",
        "roman": "II",
        "title": "SHATTERED SYMPHONY",
        "label": "Act II · Shattered Symphony",
        "subtitle_grand": "Grand Campaign · Twenty-Eight Realms",
        "subtitle_europe": "Theatre of Europe & the Mediterranean",
        "subtitle_asia": "Theatre of Asia & the Orient",
        "baked": True,
    },
    {
        "id": "act3",
        "roman": "III",
        "title": "DRACONIC APOCALYPSE",
        "label": "Act III · Draconic Apocalypse",
        "subtitle_grand": "Chronicle Unfolding",
        "subtitle_europe": "Chronicle Unfolding",
        "subtitle_asia": "Chronicle Unfolding",
        "baked": False,
        "fallbackAct": "act2",
    },
]

# Aristocratic Watercolor-Multiply Palette: (interior_multiply_rgb, border_multiply_rgb)
FACTION_PIGMENT = {
    "castilian_empire":           ((246, 174, 118), (206, 86, 30)),
    "holy_french_kingdom":        ((134, 172, 238), (44, 84, 182)),
    "england_ruins":              ((192, 198, 206), (104, 112, 124)),
    "scotland_ireland_union":     ((204, 152, 224), (128, 60, 162)),
    "danes_kingdom":              ((138, 214, 226), (44, 140, 166)),
    "habsburg_poland":            ((248, 220, 126), (202, 146, 26)),
    "western_roman_empire":       ((236, 128, 132), (176, 30, 44)),
    "novgorod_union":             ((220, 144, 174), (150, 46, 92)),
    "ottoman_empire":             ((142, 208, 144), (48, 134, 58)),
    "safavid_empire":             ((138, 162, 238), (56, 78, 184)),
    # Four Arc VI Purple Realms
    "wardenholf":                 ((186, 118, 242), (112, 28, 182)),
    "khorvait":                   ((176, 114, 236), (98, 26, 172)),
    "nhemora":                    ((196, 122, 234), (122, 32, 176)),
    "veldraine":                  ((184, 112, 240), (110, 24, 180)),
    # Africa
    "sultanate_of_morocco":       ((108, 202, 186), (26, 128, 112)),
    "songhai_empire":             ((242, 178, 128), (186, 94, 40)),
    "aksumite_empire":            ((248, 206, 114), (202, 128, 24)),
    "kongo_confederation":        ((174, 212, 122), (94, 144, 34)),
    "swahili_league":             ((112, 218, 222), (30, 148, 158)),
    "cape_republic":              ((142, 174, 228), (58, 92, 162)),
    "merina_empire":              ((240, 148, 186), (176, 52, 106)),
    # Asia & Americas
    "eternal_sky_khanate":        ((134, 210, 226), (44, 138, 164)),
    "british_east_india_company": ((238, 154, 126), (180, 68, 42)),
    "ming_celestial_empire":      ((250, 222, 118), (204, 148, 22)),
    "annam_empire":               ((238, 122, 130), (182, 28, 46)),
    "nusantara_sultanate":        ((118, 212, 174), (32, 138, 94)),
    "tokugawa_empire":            ((170, 154, 236), (86, 62, 178)),
    "new_portuguese_empire":      ((118, 208, 198), (30, 134, 124)),
}

FACTION_NAMES = {
    "castilian_empire":           "CASTILIAN\nEMPIRE",
    "holy_french_kingdom":        "HOLY FRENCH\nKINGDOM",
    "western_roman_empire":       "WESTERN ROMAN\nEMPIRE",
    "sultanate_of_morocco":       "MOORISH\nCALIPHATE",
    "habsburg_poland":            "HABSBURG–POLISH\nEMPIRE",
    "wardenholf":                 "WARDENHOLF",
    "khorvait":                   "KHORVAIT",
    "nhemora":                    "NHEMORA",
    "veldraine":                  "VELDRAINE",
    "novgorod_union":             "NOVGOROD\nUNION",
    "ottoman_empire":             "OTTOMAN\nEMPIRE",
    "danes_kingdom":              "KINGDOM OF\nDANES",
    "scotland_ireland_union":     "SCOTLAND–\nIRELAND",
    "england_ruins":              "RUINS OF\nENGLAND",
    "new_portuguese_empire":      "NEW PORTUGUESE\nEMPIRE",
    "british_east_india_company": "BRITISH EAST\nINDIA COMPANY",
    "annam_empire":               "AN NAM\nEMPIRE",
    "ming_celestial_empire":      "MING CELESTIAL\nEMPIRE",
    "nusantara_sultanate":        "NUSANTARA\nSULTANATE",
    "tokugawa_empire":            "TOKUGAWA\nSHOGUNATE",
    "eternal_sky_khanate":        "ETERNAL SKY\nKHANATE",
    "safavid_empire":             "SAFAVID\nPERSIA",
    "aksumite_empire":            "AKSUMITE\nEMPIRE",
    "songhai_empire":             "SONGHAI\nEMPIRE",
    "kongo_confederation":        "KONGO\nCONFEDERATION",
    "swahili_league":             "SWAHILI\nLEAGUE",
    "cape_republic":              "CAPE\nREPUBLIC",
    "merina_empire":              "MERINA\nEMPIRE",
}

ANCHORS = {
    ("grand", "act1"): {
        "castilian_empire":           (-6.2, 39.2),
        "holy_french_kingdom":        (3.0, 46.6),
        "western_roman_empire":       (19.8, 41.0),
        "sultanate_of_morocco":       (-10.5, 28.8),
        "habsburg_poland":            (26.5, 52.8),
        "novgorod_union":             (64.0, 62.5),
        "ottoman_empire":             (42.0, 25.0),
        "danes_kingdom":              (16.8, 64.0),
        "scotland_ireland_union":     (-11.2, 58.6),
        "england_ruins":              (-1.4, 53.5),
        "new_portuguese_empire":      (-45.5, -8.0),
        "british_east_india_company": (79.5, 22.0),
        "annam_empire":               (106.2, 14.8),
        "ming_celestial_empire":      (108.5, 35.0),
        "nusantara_sultanate":        (114.2, -1.5),
        "tokugawa_empire":            (137.0, 36.5),
        "eternal_sky_khanate":        (86.0, 46.8),
        "safavid_empire":             (56.8, 32.5),
        "aksumite_empire":            (41.5, 9.5),
        "songhai_empire":             (2.5, 13.5),
        "kongo_confederation":        (20.5, -3.2),
        "swahili_league":             (36.4, -16.2),
        "cape_republic":              (23.5, -26.8),
        "merina_empire":              (47.2, -19.4),
    },
    ("europe", "act1"): {
        "castilian_empire":           (-5.3, 38.2),
        "holy_french_kingdom":        (3.4, 45.6),
        "western_roman_empire":       (20.0, 42.4),
        "sultanate_of_morocco":       (-9.0, 29.2),
        "habsburg_poland":            (24.5, 52.2),
        "novgorod_union":             (44.0, 62.0),
        "ottoman_empire":             (34.8, 37.6),
        "danes_kingdom":              (16.8, 63.0),
        "scotland_ireland_union":     (-8.0, 55.6),
        "england_ruins":              (-2.6, 53.8),
        "safavid_empire":             (53.0, 31.4),
    },
    ("asia", "act1"): {
        "safavid_empire":             (59.8, 30.2),
        "novgorod_union":             (114.0, 53.6),
        "eternal_sky_khanate":        (82.0, 46.5),
        "british_east_india_company": (79.5, 22.8),
        "ming_celestial_empire":      (108.5, 34.5),
        "annam_empire":               (105.6, 15.2),
        "nusantara_sultanate":        (114.2, -1.8),
        "tokugawa_empire":            (132.0, 39.2),
    },
}

ANCHORS[("grand", "act2")] = {
    **ANCHORS[("grand", "act1")],
    "wardenholf":                 (20.0, 48.4),
    "khorvait":                   (-11.6, 20.6),
    "nhemora":                    (28.0, 12.6),
    "veldraine":                  (48.0, 40.3),
    "habsburg_poland":            (17.8, 55.2),
    "sultanate_of_morocco":       (1.5, 29.5),
    "novgorod_union":             (49.5, 61.5),
    "british_east_india_company": (75.5, 21.5),
    "ming_celestial_empire":      (105.5, 34.5),
    "nusantara_sultanate":        (114.5, -4.5),
}

ANCHORS[("europe", "act2")] = {
    "castilian_empire":           (-5.3, 38.2),
    "holy_french_kingdom":        (3.4, 45.6),
    "western_roman_empire":       (20.0, 42.4),
    "sultanate_of_morocco":       (1.5, 28.6),
    "khorvait":                   (-11.2, 22.0),
    "nhemora":                    (28.2, 20.6),
    "veldraine":                  (48.2, 40.3),
    "habsburg_poland":            (18.5, 53.2),
    "wardenholf":                 (19.8, 48.6),
    "novgorod_union":             (41.5, 58.2),
    "ottoman_empire":             (34.8, 37.6),
    "danes_kingdom":              (16.8, 63.0),
    "scotland_ireland_union":     (-8.0, 55.6),
    "england_ruins":              (-2.6, 53.8),
    "safavid_empire":             (53.0, 31.4),
}

ANCHORS[("asia", "act2")] = {
    "safavid_empire":             (59.8, 29.8),
    "novgorod_union":             (114.0, 53.6),
    "eternal_sky_khanate":        (82.0, 46.5),
    "british_east_india_company": (75.8, 22.4),
    "ming_celestial_empire":      (108.0, 34.2),
    "annam_empire":               (105.6, 15.2),
    "nusantara_sultanate":        (114.2, -3.5),
    "tokugawa_empire":            (132.0, 39.2),
}

TINY_WORLD = {"wardenholf", "veldraine", "england_ruins", "scotland_ireland_union", "annam_empire", "merina_empire"}
SMALL_WORLD = {"castilian_empire", "holy_french_kingdom", "western_roman_empire", "habsburg_poland", "khorvait", "nhemora", "swahili_league", "tokugawa_empire", "cape_republic"}
COMPACT_REGIONAL = {"wardenholf", "veldraine", "england_ruins", "scotland_ireland_union", "nhemora", "khorvait", "annam_empire"}

CAPITALS = {
    "europe": [
        ("MADRID", -3.70, 40.42, "right"),
        ("PARIS", 2.35, 48.86, "right"),
        ("ROME", 12.50, 41.90, "left"),
        ("VIENNA", 16.37, 48.21, "left"),
        ("NOVGOROD", 31.27, 58.52, "right"),
        ("CONSTANTINOPLE", 28.98, 41.01, "right"),
        ("MARRAKESH", -7.98, 31.63, "right"),
        ("COPENHAGEN", 12.57, 55.68, "right"),
        ("EDINBURGH", -3.19, 55.95, "right"),
        ("LONDON", -0.13, 51.51, "right"),
    ],
    "asia": [
        ("BEIJING", 116.40, 39.90, "right"),
        ("THANG LONG", 105.85, 21.03, "right"),
        ("EDO", 139.69, 35.69, "left"),
        ("DELHI", 77.21, 28.61, "right"),
        ("ISFAHAN", 55.00, 34.20, "right"),
        ("SAMARKAND", 66.96, 39.65, "right"),
        ("PALEMBANG", 104.76, -2.99, "right"),
    ],
    "grand": [],
}

OCEAN_LABELS = {
    "grand": [
        (-38.0, 26.0, "M A R E   A T L A N T I C U M", 24),
        (-20.0, -23.0, "O C E A N U S   A E T H I O P I C U S", 19),
        (74.0, -18.0, "O C E A N U S   I N D I C U S", 24),
        (-104.0, 4.5, "M A R E   P A C I F I C U M", 23),
        (139.0, 17.5, "M A R E   O R I E N T A L E", 18),
        (-34.0, 62.5, "M A R E   G L A C I A L E", 18),
    ],
    "europe": [
        (-16.0, 54.5, "O C E A N U S\nA T L A N T I C U S", 21),
        (18.5, 34.4, "M A R E   M E D I T E R R A N E U M", 18),
        (34.0, 43.3, "P O N T U S   E U X I N U S", 14),
        (2.5, 57.5, "M A R E   G E R M A N I C U M", 15),
    ],
    "asia": [
        (86.0, -9.8, "O C E A N U S   I N D I C U S", 22),
        (89.0, 10.0, "S I N U S   B E N G A L I C U S", 16),
        (114.8, 12.8, "M A R E   S I N E N S E", 17),
        (139.5, 11.5, "M A R E   P A C I F I C U M", 20),
        (63.0, 12.0, "M A R E   A R A B I C U M", 16),
    ],
}


def get_flag_path(fid: str) -> Path:
    p_v2 = ROOT / "public/heraldry/painted-v2" / f"{fid}.webp"
    if p_v2.exists():
        return p_v2
    p_u210 = ROOT / "public/heraldry/update210" / f"{fid}.webp"
    if p_u210.exists():
        return p_u210
    raise FileNotFoundError(f"Missing flag for {fid}")


def load_gz_json(path: Path):
    return json.loads(gzip.decompress(path.read_bytes()))


def project_pt(lon, lat, bounds, size):
    w, s, e, n = bounds
    W, H = size
    return ((lon - w) / (e - w) * W, (n - lat) / (n - s) * H)


def decode_coords(seq):
    if not seq:
        return []
    if isinstance(seq[0], (int, float)):
        pts = []
        x = y = 0
        for i in range(0, len(seq) - 1, 2):
            x += seq[i]
            y += seq[i + 1]
            pts.append((x / 1e5, y / 1e5))
        return pts
    return seq


def iter_polygons(geom):
    t = geom["type"]
    if t == "Polygon":
        yield [decode_coords(r) for r in geom["coordinates"]]
    elif t == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield [decode_coords(r) for r in poly]


def iter_lines(geom):
    t = geom["type"]
    if t == "LineString":
        yield decode_coords(geom["coordinates"])
    elif t == "MultiLineString":
        for line in geom["coordinates"]:
            yield decode_coords(line)


def simplify_rdp(points, epsilon=0.16):
    if len(points) < 4:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    den = dx * dx + dy * dy
    best, index = 0.0, 0
    for i, p in enumerate(points[1:-1], 1):
        t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den)) if den else 0.0
        d = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2
        if d > best:
            best, index = d, i
    if best > epsilon * epsilon:
        return simplify_rdp(points[: index + 1], epsilon)[:-1] + simplify_rdp(points[index:], epsilon)
    return [a, b]


def smooth_polyline_chaikin(pts, iterations=2):
    if len(pts) < 3:
        return pts
    out = pts
    for _ in range(iterations):
        nxt = [out[0]]
        for i in range(len(out) - 1):
            x0, y0 = out[i]
            x1, y1 = out[i + 1]
            if i > 0:
                nxt.append((0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1))
            if i < len(out) - 2:
                nxt.append((0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1))
        nxt.append(out[-1])
        out = nxt
    return out


def parse_province_rings(path_str: str):
    rings = []
    for part in re.split(r"Z\s*", path_str, flags=re.I):
        vals = list(map(float, re.findall(r"-?\d+(?:\.\d+)?", part)))
        if len(vals) < 6:
            continue
        ring = [(vals[i] / 12.0 - 25.0, 73.0 - vals[i + 1] / 12.0) for i in range(0, len(vals) - 1, 2)]
        if len(ring) >= 3:
            rings.append(ring)
    return rings


def signed_area(ring):
    a = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i - 1]
        x1, y1 = ring[i]
        a += x0 * y1 - x1 * y0
    return a


def build_act2_ownership(own_p1: dict, provs_list: list) -> dict:
    """Act II: Shattered Symphony territorial ownership across all 28 realms."""
    own2 = dict(own_p1)
    east_europe = {"UKR", "BLR", "MDA", "LTU", "LVA", "EST", "RUS"}
    north_africa = {"DZA", "TUN"}
    ming_takeover = {"MMR", "BGD", "BTN", "NPL", "THA", "MYS", "SGP", "BRN"}
    ming_unowned = {"PHL", "HKG", "MAC+00?", "TJK", "KAS+00?", "PNG", "MDV", "PLW", "IOA", "IOT+00?", "PGA+00?", "ATC+00?"}

    for p in provs_list:
        pid = p["id"]
        pref = pid.split("-")[0]
        cur = own2.get(pid, "")

        # 1. All 4 Purple Arc VI Realms awaken
        if pref == "SVK":
            own2[pid] = "wardenholf"
            continue
        if not cur and pref == "MRT":
            own2[pid] = "khorvait"
            continue
        if not cur and pref in {"SDN", "SDS", "TCD"}:
            own2[pid] = "nhemora"
            continue
        if not cur and pref == "AZE":
            own2[pid] = "veldraine"
            continue

        # 2. Western Rome loses North Africa to Moorish Caliphate
        if cur == "western_roman_empire" and pref in north_africa:
            own2[pid] = "sultanate_of_morocco"
            continue

        # 3. Habsburg-Poland loses Eastern Europe to Novgorod Union
        if cur == "habsburg_poland" and pref in east_europe:
            own2[pid] = "novgorod_union"
            continue

        # 4. Ming Celestial Empire Asian expansion (An Nam Empire remains unbroken)
        if cur == "annam_empire":
            continue
        if pref in ming_takeover:
            own2[pid] = "ming_celestial_empire"
            continue
        if not cur and pref in ming_unowned:
            own2[pid] = "ming_celestial_empire"
            continue
        if cur == "british_east_india_company" and pref == "IND":
            vals = list(map(float, re.findall(r"-?\d+(?:\.\d+)?", p["path"])))
            lons = [vals[i] / 12.0 - 25.0 for i in range(0, len(vals) - 1, 2)]
            if lons and (sum(lons) / len(lons)) >= 84.0:
                own2[pid] = "ming_celestial_empire"

    return own2


def tile_texture(tex: Image.Image, size):
    W, H = size
    out = Image.new("RGB", (W, H))
    tw, th = tex.size
    for y in range(0, H, th):
        for x in range(0, W, tw):
            out.paste(tex, (x, y))
    return out


def draw_compass_rose(draw: ImageDraw.ImageDraw, cx, cy, radius, font_sm):
    for r, col, wd in [
        (radius * 1.12, (214, 184, 122, 65), 1),
        (radius * 1.04, (14, 10, 14, 210), 3),
        (radius * 1.00, (226, 194, 126, 225), 2),
        (radius * 0.86, (192, 160, 98, 165), 1),
        (radius * 0.28, (226, 194, 126, 200), 2),
    ]:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=col, width=wd)

    for deg in range(0, 360, 10):
        ang = math.radians(deg - 90)
        r0 = radius * (0.86 if deg % 30 == 0 else 0.93)
        r1 = radius * 1.00
        draw.line(
            [(cx + math.cos(ang) * r0, cy + math.sin(ang) * r0),
             (cx + math.cos(ang) * r1, cy + math.sin(ang) * r1)],
            fill=(226, 194, 126, 175),
            width=1,
        )

    for start, step, tip_r, base_r in [
        (22.5, 45, radius * 0.56, radius * 0.11),
        (45, 90, radius * 0.78, radius * 0.15),
        (0, 90, radius * 1.14, radius * 0.19),
    ]:
        for k in range(int(360 / step)):
            deg = start + k * step
            a = math.radians(deg - 90)
            a_l = math.radians(deg - 90 - 20)
            a_r = math.radians(deg - 90 + 20)
            tip = (cx + math.cos(a) * tip_r, cy + math.sin(a) * tip_r)
            left = (cx + math.cos(a_l) * base_r, cy + math.sin(a_l) * base_r)
            right = (cx + math.cos(a_r) * base_r, cy + math.sin(a_r) * base_r)
            draw.polygon([(cx, cy), tip, right], fill=(236, 204, 134, 242), outline=(36, 24, 18, 210))
            draw.polygon([(cx, cy), tip, left], fill=(38, 26, 28, 242), outline=(208, 174, 110, 205))

    jr = radius * 0.11
    draw.ellipse((cx - jr, cy - jr, cx + jr, cy + jr), fill=(172, 34, 52, 255), outline=(248, 224, 166, 255), width=2)

    for label, deg in [("N", 0), ("E", 90), ("S", 180), ("W", 270)]:
        a = math.radians(deg - 90)
        lx = cx + math.cos(a) * (radius * 1.30)
        ly = cy + math.sin(a) * (radius * 1.30)
        bb = draw.textbbox((0, 0), label, font=font_sm)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        draw.text((lx - tw / 2 + 1, ly - th / 2 + 1), label, font=font_sm, fill=(8, 6, 12, 230))
        draw.text((lx - tw / 2, ly - th / 2), label, font=font_sm, fill=(246, 220, 158, 248))


def draw_clean_legend(overlay, x0, y0, box_w, roman, title, subtitle, theatre):
    is_grand = (theatre == "grand")
    draw = ImageDraw.Draw(overlay)
    f_kicker = ImageFont.truetype(FONT_DISPLAY, 13 if is_grand else 12)
    f_title = ImageFont.truetype(FONT_DISPLAY, 24 if is_grand else 20)
    f_sub = ImageFont.truetype(FONT_ITALIC, 18 if is_grand else 16)
    f_item = ImageFont.truetype(FONT_DISPLAY, 15 if is_grand else 13)
    f_scale = ImageFont.truetype(FONT_DISPLAY, 13 if is_grand else 12)

    items = [
        ("frontier",  "IMPERIAL FRONTIER"),
        ("banner",    "SOVEREIGN REALM & BANNER"),
        ("unclaimed", "UNCHARTED LANDS"),
    ]
    if not is_grand:
        items.insert(2, ("capital", "IMPERIAL CAPITAL"))

    row_h = 31 if is_grand else 27
    head_h = 114 if is_grand else 102
    foot_h = 56 if is_grand else 50
    box_h = head_h + len(items) * row_h + foot_h
    x1, y1 = x0 + box_w, y0 + box_h

    shadow = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rectangle((x0 + 6, y0 + 6, x1 + 7, y1 + 7), fill=(6, 4, 10, 185))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    overlay.alpha_composite(shadow)

    draw.rectangle((x0, y0, x1, y1), fill=(22, 16, 20, 232), outline=(228, 194, 126, 240), width=2)
    draw.rectangle((x0 + 7, y0 + 7, x1 - 7, y1 - 7), outline=(182, 148, 90, 165), width=1)
    for rx, ry in [(x0 + 7, y0 + 7), (x1 - 7, y0 + 7), (x0 + 7, y1 - 7), (x1 - 7, y1 - 7)]:
        draw.ellipse((rx - 3, ry - 3, rx + 3, ry + 3), fill=(240, 208, 138, 245))

    cx = (x0 + x1) / 2
    kicker = f"CHRONICLE ACT {roman} · CARTOGRAPHIC KEY"
    bb = draw.textbbox((0, 0), kicker, font=f_kicker)
    draw.text((cx - (bb[2] - bb[0]) / 2, y0 + 16), kicker, font=f_kicker, fill=(220, 184, 118, 238))

    bb2 = draw.textbbox((0, 0), title, font=f_title)
    draw.text((cx - (bb2[2] - bb2[0]) / 2, y0 + (36 if is_grand else 33)), title, font=f_title, fill=(252, 242, 212, 255))

    bb3 = draw.textbbox((0, 0), subtitle, font=f_sub)
    draw.text((cx - (bb3[2] - bb3[0]) / 2, y0 + (68 if is_grand else 60)), subtitle, font=f_sub, fill=(218, 202, 174, 238))

    dy = y0 + (98 if is_grand else 86)
    draw.line([(x0 + 26, dy), (cx - 12, dy)], fill=(204, 170, 108, 180), width=1)
    draw.line([(cx + 12, dy), (x1 - 26, dy)], fill=(204, 170, 108, 180), width=1)
    draw.polygon([(cx, dy - 5), (cx + 6, dy), (cx, dy + 5), (cx - 6, dy)], fill=(238, 204, 134, 235))

    iy = y0 + head_h
    sx0 = x0 + 24
    sx1 = x0 + (64 if is_grand else 56)
    tx = sx1 + 14
    for kind, label in items:
        ym = iy + row_h // 2 - 2
        mx = (sx0 + sx1) / 2
        if kind == "frontier":
            draw.line([(sx0, ym), (sx1, ym)], fill=(20, 13, 12, 210), width=4)
            draw.line([(sx0, ym), (sx1, ym)], fill=(234, 202, 140, 210), width=2)
        elif kind == "banner":
            draw.rectangle((sx0 + 6, ym - 8, sx1 - 6, ym + 8), fill=(168, 42, 56, 245), outline=(242, 208, 134, 250), width=1)
            draw.line([(mx, ym - 6), (mx, ym + 6)], fill=(248, 228, 172, 240), width=2)
            draw.line([(sx0 + 10, ym), (sx1 - 10, ym)], fill=(248, 228, 172, 240), width=2)
        elif kind == "capital":
            draw.ellipse((mx - 7, ym - 7, mx + 7, ym + 7), fill=(224, 56, 74, 125))
            draw.ellipse((mx - 4, ym - 4, mx + 4, ym + 4), fill=(252, 236, 178, 255), outline=(20, 10, 14, 255), width=1)
        elif kind == "unclaimed":
            draw.rectangle((sx0 + 4, ym - 7, sx1 - 4, ym + 7), fill=(190, 174, 142, 240), outline=(108, 92, 68, 230), width=1)

        draw.text((tx, iy + (4 if is_grand else 3)), label, font=f_item, fill=(244, 234, 210, 245))
        iy += row_h

    sy = iy + 12
    sb_w = box_w - 52
    sb_x0 = x0 + 26
    segs = 4
    seg_w = sb_w / segs
    bar_h = 9 if is_grand else 8
    for s_i in range(segs):
        a0 = sb_x0 + s_i * seg_w
        a1 = a0 + seg_w
        fill = (238, 204, 134, 238) if s_i % 2 == 0 else (38, 28, 32, 240)
        draw.rectangle((a0, sy, a1, sy + bar_h), fill=fill, outline=(228, 194, 126, 230), width=1)
    ticks = ["0", "500", "1000", "2000 LEAGUES"] if is_grand else ["0", "200", "400", "800 LEAGUES"]
    tick_pos = [0, 1, 2, 4]
    for lbl, tp in zip(ticks, tick_pos):
        px = sb_x0 + tp * seg_w
        tbb = draw.textbbox((0, 0), lbl, font=f_scale)
        tw = tbb[2] - tbb[0]
        tx_pos = px - tw if tp == 4 else (px - tw / 2 if tp > 0 else px)
        draw.text((tx_pos, sy + bar_h + 6), lbl, font=f_scale, fill=(224, 206, 170, 235))


def make_framed_flag(flag_path: Path, fw: int, fh: int) -> Image.Image:
    pad = 6
    card = Image.new("RGBA", (fw + pad * 2, fh + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rectangle((pad - 1, pad, pad + fw + 2, pad + fh + 3), fill=(8, 5, 10, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    card = Image.alpha_composite(card, shadow)

    img = Image.open(flag_path).convert("RGBA").resize((fw, fh), Image.Resampling.LANCZOS)
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Sharpness(img).enhance(1.30)
    card.paste(img, (pad, pad), img)

    cdraw = ImageDraw.Draw(card)
    cdraw.rectangle((pad - 2, pad - 2, pad + fw + 1, pad + fh + 1), outline=(18, 11, 14, 248), width=2)
    cdraw.rectangle((pad - 1, pad - 1, pad + fw, pad + fh), outline=(242, 210, 138, 250), width=1)
    return card


def draw_ornate_frame_and_ticks(draw, bounds, size, is_grand: bool):
    w, s, e, n = bounds
    width, height = size
    m = 16
    f_deg = ImageFont.truetype(FONT_DISPLAY, 14 if is_grand else 13)

    draw.rectangle((m, m, width - m, height - m), outline=(232, 198, 130, 238), width=2)
    draw.rectangle((m + 8, m + 8, width - m - 8, height - m - 8), outline=(188, 154, 94, 200), width=1)

    step = 10 if is_grand else 5
    lon_ticks = list(range(math.ceil(w / step) * step, math.floor(e / step) * step + 1, step))
    xs = [m + 8] + sorted(x for x in (project_pt(lon, s, bounds, size)[0] for lon in lon_ticks) if m + 8 < x < width - m - 8) + [width - m - 8]
    for i in range(len(xs) - 1):
        col = (222, 188, 120, 198) if i % 2 == 0 else (20, 14, 22, 210)
        draw.rectangle((xs[i], m + 1, xs[i + 1], m + 7), fill=col)
        draw.rectangle((xs[i], height - m - 7, xs[i + 1], height - m - 1), fill=col)

    lat_ticks = list(range(math.ceil(s / step) * step, math.floor(n / step) * step + 1, step))
    ys = [m + 8] + sorted(y for y in (project_pt(w, lat, bounds, size)[1] for lat in lat_ticks) if m + 8 < y < height - m - 8) + [height - m - 8]
    for i in range(len(ys) - 1):
        col = (222, 188, 120, 198) if i % 2 == 0 else (20, 14, 22, 210)
        draw.rectangle((m + 1, ys[i], m + 7, ys[i + 1]), fill=col)
        draw.rectangle((width - m - 7, ys[i], width - m - 1, ys[i + 1]), fill=col)

    lbl_step = 30 if is_grand else 10
    for lon in range(math.ceil(w / lbl_step) * lbl_step, math.floor(e / lbl_step) * lbl_step + 1, lbl_step):
        x, _ = project_pt(lon, n, bounds, size)
        if x < m + 46 or x > width - m - 46:
            continue
        txt = f"{abs(lon)}°{'E' if lon > 0 else ('W' if lon < 0 else '')}"
        bb = draw.textbbox((0, 0), txt, font=f_deg)
        tw = bb[2] - bb[0]
        draw.text((x - tw / 2 + 1, m + 13), txt, font=f_deg, fill=(10, 8, 12, 210))
        draw.text((x - tw / 2, m + 12), txt, font=f_deg, fill=(240, 218, 166, 215))
    for lat in range(math.ceil(s / lbl_step) * lbl_step, math.floor(n / lbl_step) * lbl_step + 1, lbl_step):
        _, y = project_pt(w, lat, bounds, size)
        if y < m + 40 or y > height - m - 40:
            continue
        txt = f"{abs(lat)}°{'N' if lat > 0 else ('S' if lat < 0 else '')}"
        draw.text((m + 13, y - 7), txt, font=f_deg, fill=(10, 8, 12, 210))
        draw.text((m + 12, y - 8), txt, font=f_deg, fill=(240, 218, 166, 215))

    for cx, cy in [(m + 4, m + 4), (width - m - 4, m + 4), (m + 4, height - m - 4), (width - m - 4, height - m - 4)]:
        draw.rectangle((cx - 7, cy - 7, cx + 7, cy + 7), fill=(32, 22, 24, 248), outline=(242, 208, 138, 248), width=2)
        draw.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=(248, 220, 156, 255))


def bake_plate(theatre_id: str, act: dict, ownership: dict, provs_parsed: dict, shared: dict):
    cfg = THEATRES[theatre_id]
    bounds = cfg["bounds"]
    w, s, e, n = bounds
    width = cfg["width"]
    height = round(width * (n - s) / (e - w))
    size = (width, height)
    is_grand = (theatre_id == "grand")
    act_id = act["id"]
    print(f"Baking {theatre_id}-{act_id} ({width}x{height})...")

    terrain = shared["terrain"]
    paper = shared["paper"]
    land_gj = shared["land_gj"]
    lakes_gj = shared["lakes_gj"]
    rivers_gj = shared["rivers_gj"]
    topology = shared["topology"]

    # 1. Crop & sculpt topographic relief
    box = ((w + 180) / 360 * terrain.width, (90 - n) / 180 * terrain.height,
           (e + 180) / 360 * terrain.width, (90 - s) / 180 * terrain.height)
    crop = terrain.crop(tuple(round(v) for v in box)).resize(size, Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(crop)
    relief = ImageEnhance.Contrast(gray).enhance(1.65)
    emboss = relief.filter(ImageFilter.EMBOSS)
    relief_sculpt = Image.blend(relief, emboss, 0.36)
    relief_sculpt = ImageEnhance.Contrast(relief_sculpt).enhance(1.30)
    peak_mask = relief_sculpt.point(lambda v: max(0, int((v - 165) * 1.45)))

    # 2. Exact vector land mask
    land_mask = Image.new("L", size, 0)
    lm_draw = ImageDraw.Draw(land_mask)
    for feat in land_gj["features"]:
        for poly in iter_polygons(feat["geometry"]):
            if not poly:
                continue
            outer = [project_pt(p[0], p[1], bounds, size) for p in poly[0]]
            if len(outer) >= 3:
                lm_draw.polygon(outer, fill=255)
            for hole in poly[1:]:
                hpts = [project_pt(p[0], p[1], bounds, size) for p in hole]
                if len(hpts) >= 3:
                    lm_draw.polygon(hpts, fill=0)

    lake_mask = Image.new("L", size, 0)
    lk_draw = ImageDraw.Draw(lake_mask)
    for feat in lakes_gj["features"]:
        for poly in iter_polygons(feat["geometry"]):
            if not poly:
                continue
            outer = [project_pt(p[0], p[1], bounds, size) for p in poly[0]]
            if len(outer) >= 3:
                lk_draw.polygon(outer, fill=255)
    land_mask = ImageChops.subtract(land_mask, lake_mask)
    water_mask = ImageOps.invert(land_mask)

    # 3. Illuminated Prussian-Teal Antique Ocean
    paper_tiled = tile_texture(paper, size)
    paper_gray = ImageOps.grayscale(paper_tiled)

    ocean_base = ImageOps.colorize(
        ImageEnhance.Contrast(gray).enhance(1.20),
        black=(14, 24, 36),
        mid=(24, 40, 56),
        white=(42, 62, 82),
    )
    ocean_base = ImageChops.multiply(ocean_base, ImageOps.colorize(paper_gray, black=(176, 182, 190), white=(255, 252, 245)))
    ocean_rgba = ocean_base.convert("RGBA")

    shelf = ImageChops.multiply(land_mask.filter(ImageFilter.GaussianBlur(18 if is_grand else 24)), water_mask)
    shelf_layer = Image.new("RGBA", size, (68, 98, 118, 0))
    shelf_layer.putalpha(shelf.point(lambda v: int(v * 0.50)))
    ocean_rgba = Image.alpha_composite(ocean_rgba, shelf_layer)

    blur_dist = land_mask.filter(ImageFilter.GaussianBlur(14 if is_grand else 18))
    for lo, hi, alpha in [(88, 104, 102), (44, 56, 64), (18, 26, 38)]:
        ring = ImageChops.multiply(blur_dist.point(lambda v, a=lo, b=hi: 255 if a <= v <= b else 0), water_mask)
        rlayer = Image.new("RGBA", size, (218, 198, 156, 0))
        rlayer.putalpha(ring.point(lambda v, al=alpha: int(v * al / 255)))
        ocean_rgba = Image.alpha_composite(ocean_rgba, rlayer)

    rhumb = Image.new("RGBA", size, (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rhumb)
    rhumb_centers = {
        "grand":  [(-38, 22), (76, -16)],
        "europe": [(-16, 40), (14, 35)],
        "asia":   [(78, 0), (132, 18)],
    }[theatre_id]
    for lon_c, lat_c in rhumb_centers:
        cx, cy = project_pt(lon_c, lat_c, bounds, size)
        for deg in range(0, 360, 15):
            ang = math.radians(deg)
            rdraw.line([(cx, cy), (cx + math.cos(ang) * width * 1.4, cy + math.sin(ang) * width * 1.4)],
                       fill=(218, 190, 134, 24), width=1)
    rhumb.putalpha(ImageChops.multiply(rhumb.getchannel("A"), water_mask))
    ocean_rgba = Image.alpha_composite(ocean_rgba, rhumb)

    sea_txt = Image.new("RGBA", size, (0, 0, 0, 0))
    st_draw = ImageDraw.Draw(sea_txt)
    for lon, lat, label, fsz in OCEAN_LABELS[theatre_id]:
        if not (w + 2 <= lon <= e - 2 and s + 2 <= lat <= n - 2):
            continue
        f_sea = ImageFont.truetype(FONT_ITALIC, fsz)
        cx, cy = project_pt(lon, lat, bounds, size)
        bb = st_draw.multiline_textbbox((0, 0), label, font=f_sea, align="center", spacing=4)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        st_draw.multiline_text((cx - tw / 2 + 1, cy - th / 2 + 1), label, font=f_sea, fill=(8, 14, 22, 175), align="center", spacing=4)
        st_draw.multiline_text((cx - tw / 2, cy - th / 2), label, font=f_sea, fill=(214, 200, 166, 168), align="center", spacing=4)
    sea_txt.putalpha(ImageChops.multiply(sea_txt.getchannel("A"), water_mask))
    ocean_rgba = Image.alpha_composite(ocean_rgba, sea_txt)

    # 4. Illuminated Antique Vellum Land Base
    land_vellum = ImageOps.colorize(
        relief_sculpt,
        black=(74, 58, 42),
        mid=(176, 158, 126),
        white=(242, 230, 202),
    )
    vellum_grain = ImageOps.colorize(paper_gray, black=(204, 192, 170), white=(255, 250, 238))
    land_vellum = ImageChops.multiply(land_vellum, vellum_grain)

    # 5. Watercolor-Multiply Faction Staining + Exact SVG Hit Areas (viewBox 0 0 1000 svgHeight)
    faction_provs = {}
    for pid, owner in ownership.items():
        if owner and pid in provs_parsed:
            faction_provs.setdefault(owner, []).append(pid)

    border_px = 12 if is_grand else 18
    stained_land = land_vellum.copy()
    hit_areas = []
    svg_eps = 0.24 if is_grand else 0.12

    for owner, pid_list in sorted(faction_provs.items()):
        if owner not in FACTION_PIGMENT:
            continue
        inner_rgb, rim_rgb = FACTION_PIGMENT[owner]

        fmask = Image.new("L", size, 0)
        fm_draw = ImageDraw.Draw(fmask)
        svg_cmds = []
        any_drawn = False

        for pid in pid_list:
            rings, bbox = provs_parsed[pid]
            if bbox[2] < w - 1 or bbox[0] > e + 1 or bbox[3] < s - 1 or bbox[1] > n + 1:
                continue
            outer_sign = signed_area(rings[0]) >= 0
            for idx_r, ring in enumerate(rings):
                pts = [project_pt(p[0], p[1], bounds, size) for p in ring]
                if len(pts) < 3:
                    continue
                is_outer = (idx_r == 0) or ((signed_area(ring) >= 0) == outer_sign)
                fm_draw.polygon(pts, fill=255 if is_outer else 0)
                any_drawn = True
                if is_outer:
                    simp = simplify_rdp(ring, svg_eps)
                    if len(simp) >= 3:
                        cmd = "M" + "L".join(
                            f"{(p[0] - w) / (e - w) * 1000:.2f},{(n - p[1]) / (e - w) * 1000:.2f}"
                            for p in simp
                        ) + "Z"
                        svg_cmds.append(cmd)

        if not any_drawn:
            continue

        fmask = ImageChops.multiply(fmask, land_mask)
        if fmask.getbbox() is None:
            continue

        if svg_cmds:
            hit_areas.append({"id": owner, "path": " ".join(svg_cmds)})

        exterior = ImageOps.invert(fmask)
        inner_rim = ImageChops.multiply(exterior.filter(ImageFilter.GaussianBlur(border_px)), fmask)
        inner_rim = inner_rim.point(lambda v: min(255, int(v * 1.45)))

        inner_stained = ImageChops.multiply(land_vellum, Image.new("RGB", size, inner_rgb))
        rim_stained = ImageChops.multiply(land_vellum, Image.new("RGB", size, rim_rgb))
        faction_art = Image.composite(rim_stained, inner_stained, inner_rim)
        fmask_soft = fmask.filter(ImageFilter.GaussianBlur(0.7))
        stained_land = Image.composite(faction_art, stained_land, fmask_soft)

    peak_clipped = ImageChops.multiply(peak_mask, land_mask)
    stained_land = Image.composite(Image.blend(stained_land, Image.new("RGB", size, (252, 242, 218)), 0.34), stained_land, peak_clipped)

    frost_mask = Image.new("L", size, 0)
    fdraw = ImageDraw.Draw(frost_mask)
    for y in range(height):
        lat = n - (y / height) * (n - s)
        if lat > 55:
            t = min(1.0, (lat - 55) / 17.0)
            fdraw.line([(0, y), (width, y)], fill=int((t ** 1.5) * 95))
    frost_mask = ImageChops.multiply(frost_mask, land_mask)
    stained_land = Image.composite(Image.blend(stained_land, Image.new("RGB", size, (214, 232, 244)), 0.38), stained_land, frost_mask)

    land_mask_aa = land_mask.filter(ImageFilter.GaussianBlur(0.6))
    canvas = Image.composite(stained_land, ocean_rgba.convert("RGB"), land_mask_aa).convert("RGBA")

    # 6. Etch Major Rivers
    river_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    riv_draw = ImageDraw.Draw(river_layer)
    for feat in rivers_gj["features"]:
        for line in iter_lines(feat["geometry"]):
            if not any(w - 1 <= p[0] <= e + 1 and s - 1 <= p[1] <= n + 1 for p in line):
                continue
            pts = [project_pt(p[0], p[1], bounds, size) for p in line]
            if len(pts) >= 2:
                riv_draw.line(pts, fill=(28, 46, 62, 118), width=1 if is_grand else 2, joint="curve")
    river_layer = river_layer.filter(ImageFilter.GaussianBlur(0.4))
    river_layer.putalpha(ImageChops.multiply(river_layer.getchannel("A"), land_mask))
    canvas = Image.alpha_composite(canvas, river_layer)

    # 7. Silky Anti-Aliased Coastlines + Chaikin-Smoothed 2x Supersampled Frontiers + SVG Outlines
    coast_blur = land_mask.filter(ImageFilter.GaussianBlur(1.2))
    coast_band = coast_blur.point(lambda v: int(max(0, 255 - abs(v - 128) * 3.2)))
    coast_layer = Image.new("RGBA", size, (26, 18, 14, 0))
    coast_layer.putalpha(coast_band.point(lambda v: int(v * 0.62)))
    canvas = Image.alpha_composite(canvas, coast_layer)

    ss_size = (width * 2, height * 2)
    ink_ss = Image.new("RGBA", ss_size, (0, 0, 0, 0))
    idraw = ImageDraw.Draw(ink_ss)
    frontiers = {}
    out_eps = 0.14 if is_grand else 0.06

    for a, b, lines in topology["arcs"]:
        left = ownership.get(topology["provinceIds"][a], "")
        right = ownership.get(topology["provinceIds"][b], "") if b >= 0 else ""
        if left == right:
            continue
        is_land_frontier = bool(left and right)
        for line in lines:
            if not any(w - 1 <= p[0] <= e + 1 and s - 1 <= p[1] <= n + 1 for p in line):
                continue
            pts_ss = [project_pt(p[0], p[1], bounds, ss_size) for p in line]
            if len(pts_ss) < 2:
                continue
            pts_smooth = smooth_polyline_chaikin(pts_ss, iterations=2)
            if is_land_frontier:
                idraw.line(pts_smooth, fill=(26, 17, 14, 175), width=6 if not is_grand else 5, joint="curve")
                idraw.line(pts_smooth, fill=(232, 200, 140, 175), width=3 if not is_grand else 2, joint="curve")
            else:
                idraw.line(pts_smooth, fill=(28, 19, 16, 128), width=4, joint="curve")
                idraw.line(pts_smooth, fill=(216, 186, 132, 118), width=2, joint="curve")

            simp = simplify_rdp(line, out_eps)
            if len(simp) >= 2:
                cmd = "M" + "L".join(
                    f"{(p[0] - w) / (e - w) * 1000:.2f},{(n - p[1]) / (e - w) * 1000:.2f}"
                    for p in simp
                )
                for owner in (left, right):
                    if owner:
                        frontiers.setdefault(owner, []).append(cmd)

    for area in hit_areas:
        area["outline"] = " ".join(frontiers.get(area["id"], []))

    ink = ink_ss.filter(ImageFilter.GaussianBlur(0.8)).resize(size, Image.Resampling.LANCZOS)
    canvas = Image.alpha_composite(canvas, ink)

    # 8. Gentle War-Table Edge Vignette
    vig = Image.new("L", size, 0)
    vdraw = ImageDraw.Draw(vig)
    margin = int(min(width, height) * 0.06)
    vdraw.rectangle((margin, margin, width - margin, height - margin), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(int(min(width, height) * 0.08)))
    vig_layer = Image.new("RGBA", size, (10, 7, 12, 0))
    vig_layer.putalpha(ImageOps.invert(vig).point(lambda v: int(v * 0.28)))
    canvas = Image.alpha_composite(canvas, vig_layer)

    # 9. Graticule, Capitals, Gilded Flags + Large Crisp Names, Compass Rose, Clean Legend & Frame
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    step_deg = 20 if is_grand else 10
    for lon in range(math.ceil(w / step_deg) * step_deg, math.ceil(e), step_deg):
        x, _ = project_pt(lon, s, bounds, size)
        odraw.line([(x, 24), (x, height - 24)], fill=(224, 196, 138, 24), width=1)
    for lat in range(math.ceil(s / step_deg) * step_deg, math.ceil(n), step_deg):
        _, y = project_pt(w, lat, bounds, size)
        odraw.line([(24, y), (width - 24, y)], fill=(224, 196, 138, 24), width=1)

    caps = CAPITALS.get(theatre_id, [])
    if caps:
        f_cap = ImageFont.truetype(FONT_DISPLAY, 16)
        for cname, clon, clat, side in caps:
            if not (w + 1 <= clon <= e - 1 and s + 1 <= clat <= n - 1):
                continue
            cx, cy = project_pt(clon, clat, bounds, size)
            odraw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=(218, 52, 68, 125))
            odraw.ellipse((cx - 4.5, cy - 4.5, cx + 4.5, cy + 4.5), fill=(252, 236, 178, 255), outline=(22, 12, 16, 255), width=1)
            cbb = odraw.textbbox((0, 0), cname, font=f_cap)
            ctw = cbb[2] - cbb[0]
            ctx = (cx - 10 - ctw) if side == "left" else (cx + 10)
            cty = cy - 9
            for ox, oy in [(-2, -1), (2, -1), (-2, 1), (2, 1), (0, 2), (0, -2)]:
                odraw.text((ctx + ox, cty + oy), cname, font=f_cap, fill=(10, 6, 12, 238))
            odraw.text((ctx, cty), cname, font=f_cap, fill=(254, 244, 214, 252))

    f_lg = ImageFont.truetype(FONT_DISPLAY, 20 if is_grand else 24)
    f_md = ImageFont.truetype(FONT_DISPLAY, 15 if is_grand else 20)
    f_sm = ImageFont.truetype(FONT_DISPLAY, 12 if is_grand else 16)

    for fid, (lon, lat) in ANCHORS[(theatre_id, act_id)].items():
        if fid not in faction_provs:
            continue
        if not (w + 1.2 <= lon <= e - 1.2 and s + 1.2 <= lat <= n - 1.2):
            continue
        label = FACTION_NAMES[fid]
        if is_grand:
            if fid in TINY_WORLD:
                font, fw, fh = f_sm, 30, 20
            elif fid in SMALL_WORLD:
                font, fw, fh = f_md, 42, 28
            else:
                font, fw, fh = f_lg, 54, 36
        else:
            if fid in COMPACT_REGIONAL:
                font, fw, fh = f_sm, 44, 29
            else:
                font, fw, fh = f_lg, 64, 43

        cx, cy = project_pt(lon, lat, bounds, size)
        bb = odraw.multiline_textbbox((0, 0), label, font=font, align="center", spacing=3)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        gap = 5 if is_grand else 7
        total_h = fh + gap + th
        top_y = cy - total_h / 2

        flag_card = make_framed_flag(get_flag_path(fid), fw, fh)
        overlay.alpha_composite(flag_card, (int(round(cx - flag_card.width / 2)), int(round(top_y - 6))))

        tx, ty = cx - tw / 2, top_y + fh + gap
        for ox, oy in [(-2, -2), (2, -2), (-2, 2), (2, 2), (0, 2), (2, 0), (-2, 0), (0, -2), (0, 3)]:
            odraw.multiline_text((tx + ox, ty + oy), label, font=font, fill=(10, 6, 12, 240), align="center", spacing=3)
        odraw.multiline_text((tx, ty), label, font=font, fill=(254, 246, 222, 255), align="center", spacing=3)

    f_comp = ImageFont.truetype(FONT_DISPLAY, 18 if is_grand else 17)
    if theatre_id == "grand":
        draw_compass_rose(odraw, width - 154, height - 152, 68, f_comp)
    elif theatre_id == "europe":
        draw_compass_rose(odraw, 128, 138, 56, f_comp)
    else:
        draw_compass_rose(odraw, width - 140, 148, 56, f_comp)

    sub = act[f"subtitle_{theatre_id}"]
    if theatre_id == "grand":
        leg_h = 114 + 3 * 31 + 56
        draw_clean_legend(overlay, 40, height - leg_h - 38, 420, act["roman"], act["title"], sub, "grand")
    elif theatre_id == "europe":
        draw_clean_legend(overlay, 32, 520, 306, act["roman"], act["title"], sub, "europe")
    else:
        leg_h = 102 + 4 * 27 + 50
        draw_clean_legend(overlay, 42, height - leg_h - 40, 336, act["roman"], act["title"], sub, "asia")

    draw_ornate_frame_and_ticks(odraw, bounds, size, is_grand=is_grand)
    canvas = Image.alpha_composite(canvas, overlay)

    webp_name = f"{theatre_id}-{act_id}.webp"
    json_name = f"{theatre_id}-{act_id}.json"

    encoded = io.BytesIO()
    canvas.convert("RGB").save(encoded, format="WEBP", quality=88, method=6)
    assert encoded.tell() > 1000
    tmp = OUT_DIR / (webp_name + ".tmp")
    tmp.write_bytes(encoded.getvalue())
    tmp.replace(OUT_DIR / webp_name)

    (OUT_DIR / json_name).write_text(json.dumps(hit_areas, separators=(",", ":")))
    print(f"  -> {webp_name} ({(OUT_DIR / webp_name).stat().st_size // 1024} KB), {json_name} ({(OUT_DIR / json_name).stat().st_size // 1024} KB, {len(hit_areas)} realms)")
    return {
        "image": f"/atlas-static/{webp_name}",
        "hitLayer": f"/atlas-static/{json_name}",
        "width": width,
        "height": height,
        "realmCount": len(hit_areas),
    }


def main():
    provs_raw = json.loads((ROOT / "public/provinces.json").read_text())["features"]
    provs_parsed = {}
    for p in provs_raw:
        rings = parse_province_rings(p["path"])
        if not rings:
            continue
        xs = [pt[0] for r in rings for pt in r]
        ys = [pt[1] for r in rings for pt in r]
        provs_parsed[p["id"]] = (rings, (min(xs), min(ys), max(xs), max(ys)))

    shared = {
        "terrain": Image.open(ROOT / "public/map-art/natural-earth/terrain-equirectangular.webp").convert("RGB"),
        "paper": Image.open(ROOT / "public/atlas-static/manuscript-paper.webp").convert("RGB"),
        "land_gj": load_gz_json(ROOT / "public/map-art/natural-earth/land.json.gz"),
        "lakes_gj": load_gz_json(ROOT / "public/map-art/natural-earth/lakes.json.gz"),
        "rivers_gj": load_gz_json(ROOT / "public/map-art/natural-earth/rivers_lake_centerlines.json.gz"),
        "topology": json.loads((ROOT / "public/map-art/faction-topology-v2.json").read_text()),
    }

    own_act1 = json.loads((ROOT / "lib/map-ownership-snapshot.json").read_text())["1715"]
    own_act2 = build_act2_ownership(own_act1, provs_raw)
    ownerships = {"act1": own_act1, "act2": own_act2}

    manifest = {
        "version": "20261126-v6",
        "source": "Natural Earth",
        "license": "Public Domain",
        "terms": "https://www.naturalearthdata.com/about/terms-of-use/",
        "theatres": {
            tid: {
                "id": t["id"],
                "en": t["en"],
                "short": t["short"],
                "bounds": t["bounds"],
                "viewBox": [0, 0, 1000, round(1000 * (t["bounds"][3] - t["bounds"][1]) / (t["bounds"][2] - t["bounds"][0]), 3)],
            }
            for tid, t in THEATRES.items()
        },
        "acts": {},
    }

    for act in ACTS:
        aid = act["id"]
        if act["baked"]:
            plates = {}
            for tid in ["grand", "europe", "asia"]:
                plates[tid] = bake_plate(tid, act, ownerships[aid], provs_parsed, shared)
            manifest["acts"][aid] = {
                "id": aid,
                "roman": act["roman"],
                "title": act["title"],
                "label": act["label"],
                "pendingReveal": False,
                "plates": plates,
            }
        else:
            fb = act["fallbackAct"]
            manifest["acts"][aid] = {
                "id": aid,
                "roman": act["roman"],
                "title": act["title"],
                "label": act["label"],
                "pendingReveal": True,
                "plates": manifest["acts"][fb]["plates"],
            }

    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))
    total_kb = sum(p.stat().st_size for p in OUT_DIR.glob("*-act*.webp")) // 1024
    print(f"Baked 6 illustrated atlas plates ({total_kb} KB WebP total) + manifest.json.")


if __name__ == "__main__":
    main()
