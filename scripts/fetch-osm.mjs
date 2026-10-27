// One-off export of OpenStreetMap buildings, streets and greenery around the
// Johns Hopkins East Baltimore campus. Output: data-src/osm-raw.json
// Data © OpenStreetMap contributors, ODbL — keep the attribution on the site.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'data-src', 'osm-raw.json')

// south, west, north, east — roughly Caroline St → Castle St, Fayette St → Madison St, plus margin
const BBOX = [39.2905, -76.602, 39.3035, -76.584].join(',')

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

const query = `[out:json][timeout:120];
(
  way["building"](${BBOX});
  relation["building"](${BBOX});
  way["building:part"](${BBOX});
  way["highway"](${BBOX});
  way["leisure"~"^(park|garden|pitch)$"](${BBOX});
  way["landuse"="grass"](${BBOX});
  node["natural"="tree"](${BBOX});
);
out body geom qt;`

for (const endpoint of ENDPOINTS) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'jhh-pacu-holds-site/0.1 (student project; one-off campus export)',
        accept: 'application/json',
      },
      body: 'data=' + encodeURIComponent(query),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, JSON.stringify(json))
    const kinds = {}
    for (const el of json.elements) {
      const t = el.tags ?? {}
      const k = t.building ? 'building' : t['building:part'] ? 'building:part' : t.highway ? 'highway' : t.natural ? 'tree' : 'green'
      kinds[k] = (kinds[k] ?? 0) + 1
    }
    console.log(`saved ${json.elements.length} elements from ${endpoint}`, kinds)
    process.exit(0)
  } catch (err) {
    console.warn(`${endpoint} failed: ${err.message}`)
  }
}
console.error('all Overpass endpoints failed')
process.exit(1)
