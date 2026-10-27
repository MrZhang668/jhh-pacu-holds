"""Build public/data/campus.json (buildings, roads, greens, trees in local metres) from the OSM export.

Inputs: data-src/osm-raw.json, data-src/campus-registry.json, data-src/registry-overrides.json
Coordinates: x = east, z = south (three.js convention, north is -z), origin at LAT0/LON0.
usage: python scripts/build_campus.py
"""
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parent.parent
SRC = SITE / "data-src"
OUT = SITE / "public" / "data" / "campus.json"  # fetched at runtime, keeps the JS bundle small

LAT0, LON0 = 39.2965, -76.5925
KX, KZ = math.cos(math.radians(LAT0)) * 111320, 110574
RADIUS = 800  # metres kept around the origin; the scene fades into fog beyond the core
LEVEL_H = 3.5

ROAD_WIDTH = {
    "primary": 15, "secondary": 13, "tertiary": 11, "primary_link": 7, "secondary_link": 7,
    "residential": 8, "unclassified": 7, "living_street": 6, "service": 4.5, "pedestrian": 5,
    "footway": 2.2, "path": 2, "cycleway": 2, "steps": 2.2,
}


def local(p):
    return [round((p["lon"] - LON0) * KX, 1), round(-(p["lat"] - LAT0) * KZ, 1)]


def num(v):
    if v is None:
        return None
    try:
        return float(str(v).replace("m", "").replace(",", ".").strip())
    except ValueError:
        return None


def signed_area(r):
    return sum(r[i - 1][0] * p[1] - p[0] * r[i - 1][1] for i, p in enumerate(r)) / 2


def centroid(r):
    a = signed_area(r)
    if abs(a) < 1e-6:
        return [sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)]
    cx = cz = 0.0
    for i, p in enumerate(r):
        q = r[i - 1]
        f = q[0] * p[1] - p[0] * q[1]
        cx += (q[0] + p[0]) * f
        cz += (q[1] + p[1]) * f
    return [cx / (6 * a), cz / (6 * a)]


def inside(pt, poly):
    x, z = pt
    c = False
    for i in range(len(poly)):
        x1, z1 = poly[i]
        x2, z2 = poly[i - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
            c = not c
    return c


def clean(ring):
    out = []
    for p in ring:
        if not out or out[-1] != p:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out if len(out) >= 3 and abs(signed_area(out)) > 1.0 else None


def assemble(ways):
    """Join open member ways of a multipolygon into closed rings."""
    rings, open_ = [], [list(w) for w in ways]
    while open_:
        cur = open_.pop()
        while cur[0] != cur[-1]:
            for i, w in enumerate(open_):
                if w[0] == cur[-1]:
                    cur += w[1:]
                elif w[-1] == cur[-1]:
                    cur += w[-2::-1]
                elif w[-1] == cur[0]:
                    cur = w[:-1] + cur
                elif w[0] == cur[0]:
                    cur = w[::-1][:-1] + cur
                else:
                    continue
                open_.pop(i)
                break
            else:
                break  # cannot close this ring
        if cur[0] == cur[-1]:
            rings.append(cur)
    return rings


def default_height(t, area):
    b = t.get("building", t.get("building:part", "yes"))
    if b in ("house", "residential", "terrace", "semidetached_house", "detached"):
        return 9.0 if area < 150 else 10.5
    if b == "apartments":
        return 10.5 if area < 400 else 14.0
    if b in ("church", "chapel", "synagogue"):
        return 16.0
    if b in ("school", "college"):
        return 12.0
    if b in ("parking",):
        return 14.0
    if b in ("commercial", "retail", "industrial", "warehouse", "service", "central_office"):
        return 7.0
    if b in ("university", "hospital", "office", "clinic"):
        return 18.0
    if b in ("shed", "garage", "garages", "roof", "kiosk"):
        return 3.5
    return 9.0


# ---------- load ----------
osm = json.loads((SRC / "osm-raw.json").read_text(encoding="utf-8"))["elements"]
registry = json.loads((SRC / "campus-registry.json").read_text(encoding="utf-8"))
ovr = json.loads((SRC / "registry-overrides.json").read_text(encoding="utf-8"))

meta = registry["buildings"]
for key, info in ovr.get("add", {}).items():
    meta[key] = info
for key, name in ovr.get("names", {}).items():
    meta[key]["name"] = name
for key in ovr.get("remove", []):
    meta.pop(key, None)
assign = {**registry["assign"], **ovr.get("assign", {})}
assign = {k: v for k, v in assign.items() if v in meta}

# ---------- buildings ----------
feats = []
for el in osm:
    t = el.get("tags", {})
    is_part = "building:part" in t
    if not (is_part or "building" in t):
        continue
    base_id = el["type"][0] + str(el["id"])
    if el["type"] == "way":
        outers, inners = [[local(p) for p in el.get("geometry", [])]], []
    else:
        members = [m for m in el.get("members", []) if m.get("geometry")]
        outers = assemble([[local(p) for p in m["geometry"]] for m in members if m.get("role") == "outer"])
        inners = assemble([[local(p) for p in m["geometry"]] for m in members if m.get("role") == "inner"])
    inners = [r for r in (clean(r) for r in inners) if r]
    for k, ring in enumerate(outers):
        ring = clean(ring)
        if not ring:
            continue
        c = centroid(ring)
        if math.hypot(*c) > RADIUS:
            continue
        fid = base_id if len(outers) == 1 else f"{base_id}#{k}"
        area = abs(signed_area(ring))
        h = num(t.get("height"))
        if h is None and num(t.get("building:levels")) is not None:
            h = num(t["building:levels"]) * LEVEL_H + (num(t.get("roof:levels")) or 0) * LEVEL_H * 0.8
        if h is None or h <= 0:
            h = default_height(t, area)
        b = num(t.get("min_height"))
        if b is None and num(t.get("building:min_level")) is not None:
            b = num(t["building:min_level"]) * LEVEL_H
        if t.get("building") == "roof" and b is None:
            b = max(h - 1.0, 0)
        feat = {"id": fid, "part": is_part, "ring": ring, "holes": [r for r in inners if inside(r[0], ring)],
                "h": round(h, 1), "b": round(b or 0, 1), "c": c, "area": area}
        shape = t.get("roof:shape")
        if shape and shape != "flat":
            roof = {"s": shape}
            if num(t.get("roof:height")) is not None:
                roof["h"] = num(t["roof:height"])
            if num(t.get("roof:direction")) is not None:
                roof["d"] = num(t["roof:direction"])
            if t.get("roof:orientation"):
                roof["o"] = t["roof:orientation"]
            feat["roof"] = roof
        feats.append(feat)

# hand split: carve a lobe of an outline into its own building
for fid, spec in ovr.get("splitLobe", {}).items():
    f = next(f for f in feats if f["id"] == fid)
    ring = f["ring"]
    i = min(range(len(ring)), key=lambda n: math.dist(ring[n], spec["from"]))
    j = min(range(len(ring)), key=lambda n: math.dist(ring[n], spec["to"]))
    lobe = ring[i:j + 1]
    f["ring"] = ring[:i + 1] + ring[j:]
    f["c"] = centroid(f["ring"])
    new_id = f"{fid}:{spec['key']}"
    feats.append({"id": new_id, "part": False, "ring": lobe, "holes": [], "h": spec["height"], "b": 0,
                  "c": centroid(lobe), "area": abs(signed_area(lobe))})
    assign[new_id] = spec["key"]

# buildings the official campus map still shows but OSM no longer has (see name_from_campus_map.py)
if ovr.get("includeMapOnly", True):
    for m in registry.get("mapOnly", []):
        dx, dz = ovr.get("mapOnlyShift", {}).get(m["key"], (0, 0))
        ring = clean([[round(p[0] + dx, 1), round(p[1] + dz, 1)] for p in m["poly"]])
        if ring and m["key"] in meta:
            fid = f"map:{m['key']}"
            feats.append({"id": fid, "part": False, "ring": ring, "holes": [], "h": m["h"], "b": 0,
                          "c": centroid(ring), "area": abs(signed_area(ring))})
            assign[fid] = m["key"]

# Outlines that contain building:parts are represented by their parts (Simple 3D Buildings rule).
# Some outlines are only partly covered by parts (e.g. the Hospital Bridge, Weinberg): those are kept
# too, capped at their lowest part so the parts still show above them. Overlapping walls belong to the
# same building and material, so they render identically.
parts = [f for f in feats if f["part"]]
for f in feats:
    if f["part"]:
        continue
    inner = [p for p in parts if f["area"] > p["area"] * 0.98 and inside(p["c"], f["ring"])]
    coverage = sum(p["area"] for p in inner) / f["area"]
    f["container"] = bool(inner) and coverage >= 0.7
    if inner and not f["container"]:
        f["h"] = min(f["h"], min(p["h"] for p in inner))

buildings, context = {}, []
for f in feats:
    if f.get("container"):
        continue
    key = assign.get(f["id"])
    if key is None and f["part"]:
        host = next((o for o in feats if not o["part"] and o.get("container") and inside(f["c"], o["ring"])), None)
        key = assign.get(host["id"]) if host else None
    out = {"p": f["ring"], "h": f["h"]}
    if f["holes"]:
        out["o"] = f["holes"]
    if f["b"]:
        out["b"] = f["b"]
    if "roof" in f:
        out["r"] = f["roof"]
    if key:
        buildings.setdefault(key, []).append((f, out))
    else:
        context.append(out)

jhh = []
for key, items in buildings.items():
    info = meta[key]
    total = sum(f["area"] for f, _ in items)
    cx = sum(f["c"][0] * f["area"] for f, _ in items) / total
    cz = sum(f["c"][1] * f["area"] for f, _ in items) / total
    top = max(o["h"] for _, o in items)
    entry = {"key": key, "name": info["name"], "tier": info["tier"], "top": top,
             "anchor": [round(cx, 1), round(cz, 1)], "parts": [o for _, o in items]}
    if info.get("module"):
        entry["module"] = info["module"]
    if info.get("note"):
        entry["note"] = info["note"]
    jhh.append(entry)
jhh.sort(key=lambda b: (b["tier"], b["key"]))

# ---------- roads, greens, trees ----------
roads, greens, trees = [], [], []
for el in osm:
    t = el.get("tags", {})
    if el["type"] == "way" and t.get("highway") in ROAD_WIDTH:
        pts = [local(p) for p in el.get("geometry", [])]
        if len(pts) < 2 or min(math.hypot(*p) for p in pts) > RADIUS:
            continue
        r = {"k": t["highway"], "w": ROAD_WIDTH[t["highway"]], "p": pts}
        if t.get("name"):
            r["n"] = t["name"]
        if t.get("oneway") in ("yes", "1", "true") or t.get("junction") == "roundabout":
            r["o"] = 1
        elif t.get("oneway") == "-1":
            r["p"], r["o"] = pts[::-1], 1
        roads.append(r)
    elif el["type"] == "way" and (t.get("leisure") in ("park", "garden", "pitch") or t.get("landuse") == "grass"):
        ring = clean([local(p) for p in el.get("geometry", [])])
        if ring and math.hypot(*centroid(ring)) < RADIUS:
            greens.append({"p": ring, "k": t.get("leisure", t.get("landuse"))})
    elif el["type"] == "node" and t.get("natural") == "tree":
        p = local(el)
        if math.hypot(*p) < RADIUS:
            trees.append(p)


# ---------- procedural trees: street trees and trees in green areas (deterministic) ----------
def generate_trees(rings, roads, greens, osm_trees):
    """Returns [x, z, scale, type]; type 0 = round crown, 1 = conifer."""
    rng = random.Random(7)
    cell_size = 25.0

    def cell(x, z):
        return int(math.floor(x / cell_size)), int(math.floor(z / cell_size))

    def cells(x0, z0, x1, z1):
        for gx in range(cell(x0, z0)[0], cell(x1, z1)[0] + 1):
            for gz in range(cell(x0, z0)[1], cell(x1, z1)[1] + 1):
                yield gx, gz

    bgrid, rgrid, tgrid = defaultdict(list), defaultdict(list), defaultdict(list)
    for ring in rings:
        xs, zs = [p[0] for p in ring], [p[1] for p in ring]
        for c in cells(min(xs), min(zs), max(xs), max(zs)):
            bgrid[c].append(ring)
    for r in roads:
        if r["k"] in ("footway", "path", "cycleway", "steps"):
            continue  # trees may stand beside footpaths
        half = r["w"] / 2
        for a, b in zip(r["p"], r["p"][1:]):
            for c in cells(min(a[0], b[0]) - half, min(a[1], b[1]) - half, max(a[0], b[0]) + half, max(a[1], b[1]) + half):
                rgrid[c].append((a, b, half))

    def in_building(x, z, m):
        return any(inside((px, pz), ring) for px, pz in ((x, z), (x + m, z), (x - m, z), (x, z + m), (x, z - m))
                   for ring in bgrid.get(cell(px, pz), ()))

    def seg_dist(x, z, a, b):
        dx, dz = b[0] - a[0], b[1] - a[1]
        ll = dx * dx + dz * dz
        t = 0.0 if ll == 0 else max(0.0, min(1.0, ((x - a[0]) * dx + (z - a[1]) * dz) / ll))
        return math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)

    def on_road(x, z, m):
        return any(seg_dist(x, z, a, b) < half + m for a, b, half in rgrid.get(cell(x, z), ()))

    def near_tree(x, z, d):
        gx, gz = cell(x, z)
        return any((tx - x) ** 2 + (tz - z) ** 2 < d * d
                   for i in (-1, 0, 1) for j in (-1, 0, 1) for tx, tz in tgrid.get((gx + i, gz + j), ()))

    out = []

    def add(x, z, s, kind):
        out.append([round(x, 1), round(z, 1), round(s, 2), kind])
        tgrid[cell(x, z)].append((x, z))

    for x, z in osm_trees:
        add(x, z, 1.1, 0)

    spacing = {"primary": 16, "secondary": 16, "tertiary": 18, "residential": 21, "unclassified": 22}
    for r in roads:
        sp = spacing.get(r["k"])
        if not sp:
            continue
        off = r["w"] / 2 + 2.4
        carry = rng.uniform(0, sp)
        for a, b in zip(r["p"], r["p"][1:]):
            seg = math.dist(a, b)
            if seg < 1e-6:
                continue
            ux, uz = (b[0] - a[0]) / seg, (b[1] - a[1]) / seg
            d = carry
            while d < seg:
                for side in (1, -1):
                    x = a[0] + ux * d - uz * off * side + rng.uniform(-0.8, 0.8)
                    z = a[1] + uz * d + ux * off * side + rng.uniform(-0.8, 0.8)
                    if math.hypot(x, z) > RADIUS - 60 or rng.random() < 0.18:
                        continue  # stay inside the scene, leave natural gaps
                    if in_building(x, z, 2.0) or on_road(x, z, 0.8) or near_tree(x, z, 6.0):
                        continue
                    add(x, z, rng.uniform(0.85, 1.2), 0)
                d += sp
            carry = d - seg

    for g in greens:
        if g["k"] == "pitch":
            continue
        ring = g["p"]
        area = abs(signed_area(ring))
        if area < 120:
            continue
        xs, zs = [p[0] for p in ring], [p[1] for p in ring]
        want, placed, tries = min(int(area / 260) + 1, 80), 0, 0
        while placed < want and tries < want * 12:
            tries += 1
            x, z = rng.uniform(min(xs), max(xs)), rng.uniform(min(zs), max(zs))
            if not inside((x, z), ring) or in_building(x, z, 2.5) or on_road(x, z, 1.0) or near_tree(x, z, 7.5):
                continue
            add(x, z, rng.uniform(0.9, 1.35), 1 if rng.random() < 0.3 else 0)
            placed += 1
    return out


trees = generate_trees([f["ring"] for f in feats], roads, greens, trees)


# ---------- routes for ambient traffic and pedestrians ----------
def chains(ways, same_name=True):
    """Join ways that share endpoints into long polylines (one-way ways only head to tail)."""
    key = lambda p: (round(p[0], 1), round(p[1], 1))  # noqa: E731
    pool = [dict(w) for w in ways]
    out = []
    while pool:
        cur = pool.pop()
        pts = list(cur["p"])
        grown = True
        while grown:
            grown = False
            for i, w in enumerate(pool):
                if same_name and w.get("n") != cur.get("n"):
                    continue
                if bool(w.get("o")) != bool(cur.get("o")):
                    continue
                wp = w["p"]
                if key(wp[0]) == key(pts[-1]):
                    pts += wp[1:]
                elif key(wp[-1]) == key(pts[0]):
                    pts = wp[:-1] + pts
                elif not cur.get("o") and key(wp[-1]) == key(pts[-1]):
                    pts += wp[-2::-1]
                elif not cur.get("o") and key(wp[0]) == key(pts[0]):
                    pts = wp[::-1][:-1] + pts
                else:
                    continue
                pool.pop(i)
                grown = True
                break
        length = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
        out.append({"p": pts, "o": cur.get("o", 0), "w": cur["w"], "n": cur.get("n"), "len": length})
    return out


traffic = [
    {"p": c["p"], "o": c["o"], "w": c["w"]}
    for c in chains([r for r in roads if r["k"] in ("primary", "secondary", "tertiary") and r.get("n")])
    if c["len"] > 250
]
CORE = (10, -40)
walks = [
    {"p": c["p"]}
    for c in chains([r for r in roads if r["k"] in ("footway", "pedestrian", "path")
                     and min(math.dist(p, CORE) for p in r["p"]) < 380], same_name=False)
    if c["len"] > 60
]

data = {
    "_note": "Generated by scripts/build_campus.py. Map data © OpenStreetMap contributors (ODbL).",
    "origin": [LAT0, LON0],
    "radius": RADIUS,
    "buildings": jhh,
    "context": context,
    "roads": roads,
    "greens": greens,
    "trees": trees,
    "traffic": traffic,
    "walks": walks,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
print(f"{len(jhh)} JHH buildings ({sum(len(b['parts']) for b in jhh)} parts), {len(context)} context buildings, "
      f"{len(roads)} roads, {len(greens)} greens, {len(trees)} trees -> {OUT.relative_to(SITE)} "
      f"({OUT.stat().st_size / 1024:.0f} KB)")
for b in jhh:
    print(f"  {b['tier']} {b['key']:<20} top {b['top']:>5} m  parts {len(b['parts']):>3}  {b['name']}")
