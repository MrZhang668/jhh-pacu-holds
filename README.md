# Reducing OR & PACU Holds — The Johns Hopkins Hospital

An interactive showcase of a JHU MSEM Team 6 (Fall 2025) project on post-operative patient flow
at The Johns Hopkins Hospital (Zayed & Weinberg). The homepage is a stylized 3D model of the East
Baltimore campus; four labelled buildings open the project modules: interviews, data analysis,
the mind map (issue tree and impact matrix) and the proposed solutions.

Independent student project, not an official Johns Hopkins Medicine website.

## Data and privacy

- Hospital operational data appear only as aggregated, normalized percentages and rounded
  findings. No raw dataset, record or screenshot is part of this repository or the site.
- Interviewees are identified by role only.
- Buildings, streets and trees: © OpenStreetMap contributors (ODbL). Building names were matched to
  the public JHH campus map.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Handy URL parameters: `?time=19` opens at 7 PM, `?webgl=0` shows the no-WebGL fallback,
`?quality=low|medium|high` pins the rendering quality.

## Regenerate the data and images

| Command | What it does |
| --- | --- |
| `npm run osm:fetch` | Downloads the campus area from OpenStreetMap into `data-src/osm-raw.json` |
| `npm run campus:name` | Names buildings from the official campus map PDF (kept outside this repository) |
| `npm run campus:build` | Builds `public/data/campus.json`: buildings, roads, trees, traffic and walking routes |
| `npm run world:build` | Builds the world outline used by the outcomes module |
| `python scripts/capture_stills.py` | Renders the no-WebGL still and the social card from a running dev server (needs Chrome and Pillow) |

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`
(set Settings → Pages → Source to "GitHub Actions" once).
