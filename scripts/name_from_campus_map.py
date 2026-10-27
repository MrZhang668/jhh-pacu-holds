"""Name OSM building parts after the official JHM campus map.

The official map (vector PDF, kept outside the repo) is georeferenced against OSM buildings that
carry the same name; every OSM building / building part on campus is then assigned to the nearest
map label. Output: data-src/campus-registry.json (hand-correct mistakes in registry-overrides.json).

usage: python scripts/name_from_campus_map.py [debug.png]
"""
import json
import math
import re
import sys
from pathlib import Path

import pymupdf

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
MAP_PDF = SITE.parent / "JHH建筑与平面图" / "jhh-campus-map-english.pdf"
OSM = SITE / "data-src" / "osm-raw.json"
OUT = SITE / "data-src" / "campus-registry.json"

LAT0, LON0 = 39.2965, -76.5925
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110574

# key, display name, tier, map-label prefixes, OSM names
REGISTRY = [
    ("billings", "Billings Building", "A", ["BILLINGS"], []),
    ("zayed", "Sheikh Zayed Tower", "A", ["SHEIKH ZAYED"], ["Sheik Zayed Tower"]),
    ("bloomberg", "Charlotte R. Bloomberg Children's Center", "A", ["BLOOMBERG CHILDREN"], []),
    ("weinberg", "Weinberg Building", "A", ["WEINBERG"], ["Weinberg Building"]),
    ("welch", "Welch Medical Library", "A", ["WELCH"], []),
    ("park", "Park Building", "B", ["PARK BUILDING"], []),
    ("marburg", "Marburg Building", "B", ["MARBURG"], []),
    ("cmsc", "Children's Medical & Surgical Center", "B", ["CMSC"], ["Children's Medical Surgery Center"]),
    ("halsted", "Halsted Building", "B", ["HALSTED"], []),
    ("osler", "Osler Building", "B", ["OSLER"], []),
    ("blalock", "Blalock Building", "B", ["BLALOCK"], []),
    ("carnegie", "Carnegie Building", "B", ["CARNEGIE"], []),
    ("hurd", "Hurd Hall", "B", ["HURD HALL"], []),
    ("meyer", "Meyer Building", "B", ["MEYER"], []),
    ("nelson-harvey", "Nelson / Harvey Building", "B", ["NELSON"], []),
    ("phipps", "Phipps Building", "B", ["PHIPPS"], ["Phipps"]),
    ("mri", "MRI Building", "B", ["MRI BLDG"], ["MRI Building"]),
    ("wilmer", "Wilmer Eye Institute", "B", ["WILMER EYE"], []),
    ("hackerman-patz", "Hackerman-Patz Patient Family Pavilion", "B", ["HACKERMAN"], ["Hackerman-Patz Patient Family Pavilion"]),
    ("orleans-garage", "Orleans Street Garage", "B", ["ORLEANS STREET GARAGE"], ["Orleans Street Garage"]),
    ("rubenstein", "Rubenstein Child Health Building", "B", ["RUBENSTEIN"], ["Rubenstein Child Health Building"]),
    ("harriet-lane", "Harriet Lane Clinic", "B", ["HARRIET LANE"], []),
    ("viragh", "Skip Viragh Outpatient Cancer Center", "B", ["SKIP VIRAGH"], ["Skip Viragh Outpatient Cancer Building"]),
    ("jhoc", "Johns Hopkins Outpatient Center", "B", ["OUTPATIENT CENTER"], []),
    ("550", "550 Building", "B", ["550 BUILDING"], ["550 Building"]),
    ("smith", "Smith Building", "B", ["SMITH BUILDING"], ["Smith Building"]),
    ("armstrong", "Armstrong Medical Education Building", "B", ["ARMSTRONG"], ["Armstrong Medical Education Building"]),
    ("reed-hall", "Reed Hall", "B", ["REED HALL"], []),
    ("hampton-house", "Hampton House", "B", ["HAMPTON HOUSE"], []),
    ("bunting-blaustein", "Bunting Blaustein Cancer Research Building", "B", ["BUNTING"], []),
    ("koch", "Koch Cancer Research Building", "B", ["KOCH"], []),
    ("bond-street-annex", "Bond Street Annex", "B", ["BOND STREET"], []),
    ("mcelderry-garage", "McElderry Garage", "B", ["McELDERRY GARAGE"], ["McElderry Garage"]),
    ("caroline-garage", "Caroline Garage", "B", ["CAROLINE GARAGE"], ["Caroline Street Garage"]),
    ("cooley", "Cooley Center", "B", ["COOLEY"], []),
    ("miller", "Miller Research Building", "B", ["MILLER RESEARCH"], ["Miller Research Building"]),
    ("traylor", "Traylor Building", "B", ["TRAYLOR"], []),
    ("ross", "Ross Research Building", "B", ["ROSS RESEARCH"], ["Ross Research Building"]),
    ("rutland-garage", "Rutland Garage", "B", ["RUTLAND GARAGE"], ["Rutland Garage"]),
    ("1830", "1830 Building", "B", [], ["1830 Building"]),
    ("turner", "Turner Auditorium", "B", ["TURNER"], ["Turner Auditorium"]),
    ("kki", "Kennedy Krieger Institute", "B", ["KENNEDY KRIEGER INSTITUTE"], ["Kennedy Krieger Institute Inpatient Center"]),
    ("kki-research", "Kennedy Krieger Research Building", "B", ["KENNEDY KRIEGER RESEARCH"], []),
    ("kki-outpatient", "Kennedy Krieger Outpatient Center", "B", ["KRIEGER OUTPATIENT"], ["Kennedy Krieger Institute Outpatient Center"]),
    ("kki-garage", "Kennedy Krieger Garage", "B", ["KENNEDY KRIEGER GARAGE"], []),
    ("hunterian", "Hunterian Building", "B", ["HUNTERIAN"], []),
    ("wbsb", "Wood Basic Science Building", "B", ["WOOD BASIC"], []),
    ("pctb", "Preclinical Teaching Building", "B", ["PRECLINICAL"], []),
    ("physiology", "Physiology–Biophysics Building", "B", ["PHYSIOLOGY"], []),
    ("rangos", "Rangos Building", "B", ["RANGOS"], []),
    ("bsph", "Bloomberg School of Public Health", "B", ["BLOOMBERG SCHOOL"], ["Johns Hopkins Bloomberg School of Public Health"]),
    ("son", "School of Nursing", "B", ["SCHOOL OF NURSING"], ["School of Nursing"]),
    ("son-house", "School of Nursing House", "B", ["SON HOUSE"], ["School of Nursing House"]),
    ("son-student-house", "School of Nursing Student House", "B", ["SON STUDENT"], ["School of Nursing Student House"]),
    ("childrens-house", "Children's House", "B", ["CHILDREN’S HOUSE", "CHILDREN'S HOUSE"], []),
    ("wash-garage", "Washington Garage", "B", ["WASH. GARAGE"], ["Washington Garage"]),
]
MODULES = {"weinberg": "interviews", "zayed": "data", "welch": "thinking", "billings": "outcomes"}


def local(p):
    return ((p["lon"] - LON0) * KX, -(p["lat"] - LAT0) * KZ)


def inside(pt, poly):
    x, z = pt
    c = False
    for i in range(len(poly)):
        x1, z1 = poly[i]
        x2, z2 = poly[i - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
            c = not c
    return c


def area(poly):
    return abs(sum(poly[i - 1][0] * p[1] - p[0] * poly[i - 1][1] for i, p in enumerate(poly))) / 2


# ---------- map labels (PDF points) ----------
page = pymupdf.open(MAP_PDF)[0]
FRAME = pymupdf.Rect(60, 150, 1262, 1150)  # map area, without the legend column
spans = []
for b in page.get_text("dict")["blocks"]:
    for l in b.get("lines", []):
        for s in l["spans"]:
            t = s["text"].strip()
            r = pymupdf.Rect(s["bbox"])
            if not t or not r.intersects(FRAME) or not (7.0 <= s["size"] <= 10.0):
                continue
            if re.fullmatch(r"(\S\s)+\S", t) or (t != t.upper() and not t.startswith("Mc")):
                continue
            spans.append({"t": t, "r": r, "size": s["size"]})
spans.sort(key=lambda s: (s["r"].y0, s["r"].x0))
groups = []
for s in spans:
    cx = (s["r"].x0 + s["r"].x1) / 2
    for g in groups:
        if abs(cx - (g["r"].x0 + g["r"].x1) / 2) < 28 and -1 <= s["r"].y0 - g["last"].y1 < s["size"] * 0.9:
            g["t"].append(s["t"])
            g["r"] |= s["r"]
            g["last"] = s["r"]
            break
    else:
        groups.append({"t": [s["t"]], "r": pymupdf.Rect(s["r"]), "last": s["r"]})
labels = [{"text": re.sub(r"\s+", " ", " ".join(g["t"])), "p": ((g["r"].x0 + g["r"].x1) / 2, (g["r"].y0 + g["r"].y1) / 2)}
          for g in groups]

# ---------- OSM features ----------
feats = []
for el in json.loads(OSM.read_text(encoding="utf-8"))["elements"]:
    t = el.get("tags", {})
    if not (t.get("building") or t.get("building:part")):
        continue
    geom = el.get("geometry")
    if el["type"] == "relation":
        geom = [p for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry") for p in m["geometry"]]
    if not geom or len(geom) < 4:
        continue
    poly = [local(p) for p in geom]
    feats.append({
        "id": el["type"][0] + str(el["id"]),
        "name": t.get("name", ""),
        "part": bool(t.get("building:part")),
        "type": t.get("building", t.get("building:part")),
        "poly": poly,
        "c": (sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)),
        "area": area(poly),
    })
by_osm_name = {f["name"]: f for f in feats if f["name"] and not f["part"]}

# ---------- georeference: affine fit on buildings named in both ----------
key_of_label = {}
for lab in labels:
    for key, _, _, prefixes, _ in REGISTRY:
        if any(lab["text"].upper().startswith(p.upper()) for p in prefixes):
            key_of_label[id(lab)] = key
            break
pairs = []
for lab in labels:
    key = key_of_label.get(id(lab))
    osm_names = next((r[4] for r in REGISTRY if r[0] == key), [])
    f = next((by_osm_name[n] for n in osm_names if n in by_osm_name), None)
    if f is not None:
        pairs.append((lab["p"], f["c"]))


def fit(pairs):
    n = [[0.0] * 5 for _ in range(3)]
    for (px, py), (x, z) in pairs:
        row = (px, py, 1.0)
        for i in range(3):
            for j in range(3):
                n[i][j] += row[i] * row[j]
            n[i][3] += row[i] * x
            n[i][4] += row[i] * z
    for i in range(3):
        piv = max(range(i, 3), key=lambda r: abs(n[r][i]))
        n[i], n[piv] = n[piv], n[i]
        for r in range(3):
            if r != i:
                k = n[r][i] / n[i][i]
                n[r] = [a - k * b for a, b in zip(n[r], n[i])]
    return [[n[i][3] / n[i][i], n[i][4] / n[i][i]] for i in range(3)]


M = fit(pairs)


def to_local(p):
    return (p[0] * M[0][0] + p[1] * M[1][0] + M[2][0], p[0] * M[0][1] + p[1] * M[1][1] + M[2][1])


res = [math.dist(to_local(p), c) for p, c in pairs]
print(f"{len(labels)} map labels, {len(pairs)} anchors, median residual {sorted(res)[len(res) // 2]:.1f} m")

reg_labels = [(key_of_label[id(l)], to_local(l["p"])) for l in labels if id(l) in key_of_label]

# ---------- assignment ----------
outlines = [f for f in feats if not f["part"]]
assign = {}
for f in feats:
    if f["part"]:
        host = next((o for o in outlines if inside(f["c"], o["poly"])), None)
    else:
        host = f
    # 1) an OSM name we know (outline itself, or the outline hosting this part) wins
    key = None
    if host is not None and host["name"]:
        key = next((r[0] for r in REGISTRY if host["name"] in r[4]), None)
        if key and sum(inside(p, host["poly"]) for _, p in reg_labels) > 1:
            key = None  # multi-building outline: fall back to nearest label
    if f["part"] and f["name"]:
        key = next((r[0] for r in REGISTRY if f["name"] in r[4]), key)
    # 2) nearest map label, preferring labels inside the host outline
    if key is None:
        cands = [(k, p) for k, p in reg_labels if host is not None and inside(p, host["poly"])]
        limit = 90 if cands else (55 if f["part"] or f["area"] > 600 else 0)
        cands = cands or reg_labels
        k, p = min(cands, key=lambda kp: math.dist(kp[1], f["c"]))
        if math.dist(p, f["c"]) <= limit and f["type"] not in ("house", "residential", "apartments", "terrace", "church"):
            key = k
    if key:
        assign[f["id"]] = key

# ---------- buildings the official map still shows but current OSM no longer has ----------
# All three were cleared in 2024–25 for the Johns Hopkins Life Sciences Building (Monument St × Broadway);
# they are drawn from the March 2025 map on request. Turn off with "includeMapOnly": false in the overrides.
MAP_ONLY = {
    "reed-hall": ("REED HALL", 45.0, "14 storeys. Shown per the March 2025 campus map; demolished 2024–25 for the Life Sciences Building."),
    "hampton-house": ("HAMPTON HOUSE", 35.0, "10 storeys, opened 1926. Shown per the March 2025 campus map; demolished 2024 for the Life Sciences Building."),
    "cooley": ("COOLEY", 8.0, "Denton A. Cooley fitness center. Shown per the March 2025 campus map; closed Oct 2024 for the Life Sciences Building."),
}
BUILDING_GREY = "#E3E7E1"  # fill of "academic / research / other" buildings on the map


def drawing_ring(d):
    pts = []
    for it in d["items"]:
        if it[0] == "l":
            pts += [it[1], it[2]]
        elif it[0] == "c":
            pts += [it[1], it[4]]
        elif it[0] == "re":
            pts += [it[1].tl, it[1].tr, it[1].br, it[1].bl]
        elif it[0] == "qu":
            pts += [it[1].ul, it[1].ur, it[1].lr, it[1].ll]
    ring = []
    for p in pts:
        if not ring or math.dist(ring[-1], (p.x, p.y)) > 0.3:
            ring.append((p.x, p.y))
    if len(ring) > 1 and math.dist(ring[0], ring[-1]) <= 0.3:
        ring.pop()
    return ring


grey_polys = []
for d in page.get_drawings():
    r = d["rect"]
    fill = d.get("fill")
    if fill and r.intersects(FRAME) and 30 < r.width * r.height < 40000 and \
            "#%02X%02X%02X" % tuple(round(c * 255) for c in fill[:3]) == BUILDING_GREY:
        ring = drawing_ring(d)
        if len(ring) >= 3:
            grey_polys.append({"ring": ring, "area": r.width * r.height, "c": ((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)})

map_only = []
for key, (prefix, height, note) in MAP_ONLY.items():
    lab = next((l for l in labels if l["text"].upper().startswith(prefix)), None)
    if lab is None:
        print(f"map-only {key}: label not found")
        continue
    hits = [p for p in grey_polys if inside(lab["p"], p["ring"])]
    poly = min(hits, key=lambda p: p["area"]) if hits else min(grey_polys, key=lambda p: math.dist(p["c"], lab["p"]))
    map_only.append({"key": key, "h": height, "note": note,
                     "poly": [[round(v, 1) for v in to_local(p)] for p in poly["ring"]]})

registry = {
    "_note": "Generated by scripts/name_from_campus_map.py from the official JHM campus map + OSM. "
             "Fix mistakes in registry-overrides.json, not here.",
    "mapOnly": map_only,
    "buildings": {
        key: {"name": name, "tier": tier, **({"module": MODULES[key]} if key in MODULES else {}),
              **({"mapLabel": [round(v, 1) for v in next(p for k, p in reg_labels if k == key)]}
                 if any(k == key for k, _ in reg_labels) else {})}
        for key, name, tier, _, _ in REGISTRY
    },
    "assign": dict(sorted(assign.items())),
}
for m in map_only:
    registry["buildings"][m["key"]]["note"] = m["note"]
OUT.write_text(json.dumps(registry, ensure_ascii=False, indent=1), encoding="utf-8")
counts = {}
for k in assign.values():
    counts[k] = counts.get(k, 0) + 1
print(f"assigned {len(assign)} OSM features to {len(counts)} buildings")
print("missing:", [r[0] for r in REGISTRY if r[0] not in counts])

if len(sys.argv) > 1:  # colour-coded check image
    from PIL import Image, ImageDraw, ImageFont

    X0, X1, Z0, Z1, S = -460, 360, -580, 330, 2.2
    img = Image.new("RGB", (int((X1 - X0) * S), int((Z1 - Z0) * S)), "white")
    dr = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=12)
    keys = sorted(counts)
    col = {k: tuple(int(127 + 110 * math.sin(i * 2.4 + o)) for o in (0, 2.1, 4.2)) for i, k in enumerate(keys)}
    P = lambda x, z: ((x - X0) * S, (z - Z0) * S)  # noqa: E731
    for f in sorted(feats, key=lambda f: f["part"]):
        if X0 < f["c"][0] < X1 and Z0 < f["c"][1] < Z1 and len(f["poly"]) > 2:
            k = assign.get(f["id"])
            dr.polygon([P(*p) for p in f["poly"]], fill=col[k] if k else None, outline=(90, 90, 90))
    for k in keys:
        pts = [f["c"] for f in feats if assign.get(f["id"]) == k]
        cx, cz = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
        dr.text(P(cx, cz), k, fill=(0, 0, 0), font=font, anchor="mm", stroke_width=2, stroke_fill="white")
    img.save(sys.argv[1])
