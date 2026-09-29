# Space Relics 3D — Solar System Explorer

An interactive 3D Solar System where every planet is surrounded by the real hardware sent to it:
rovers, landers, orbiters, satellites, space telescopes, probes, impactor craft, helicopters and
space stations. Click any object to read its record; ask the built-in guide about it.

**Stack:** React + Vite · Three.js / @react-three/fiber / drei · **static JSON data, no backend, no
auth, no API keys**. The whole catalogue is fetched from `client/public/data/` at runtime, so the
app builds to plain static files and hosts anywhere — Vercel, Netlify, GitHub Pages, an S3 bucket.

## Prerequisites
- Node.js 18+ and npm 9+
- Nothing else. No database, no server, no accounts, no secrets.

## Quick start
```bash
npm run install:client     # install the client dependencies
npm run dev                # http://localhost:5173
```
Or, equivalently:
```bash
cd client
npm install
npm run dev
```

## How it fits together
```
client/public/data/          the "database" — plain JSON, fetched at runtime
  ├── solar-system-dataset.json   bodies, moons, missions, stations, rockets + body index
  ├── coordinates.json            landing sites and orbital elements
  ├── media.json                  photographs resolved per object
  └── source/                     the original workbook (kept so it can be replaced)

client/src/lib/dataStore.js  reads the JSON and exposes catalogue lookups (bodies, search, …)
client/src/services/api.js   the old API surface, now implemented locally over dataStore
client/src/services/guide/   the chat guide (dataset → Wikipedia → keyless reword) — all in-browser
client/src/components/       the 3D scene and panels
tools/                       Python scripts that rebuild the JSON from the workbook
```
There is **no server directory** — it was removed when the app moved to a static build.

## Deploy to Vercel (recommended)
The repo ships a `vercel.json`, so it is a one-click deploy:

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo.
3. Leave **Root Directory** empty (the repository root) and the defaults otherwise — `vercel.json`
   supplies the rest and detects the layout automatically.
4. Deploy. No environment variables are required.

### Root Directory — read this
`vercel.json` sits at the repo root, so the standard deploy leaves **Root Directory** blank. The
build command detects whether `client/package.json` exists and handles either choice:

| Root Directory | What runs | Output |
|---|---|---|
| *(empty — recommended)* | `npm --prefix client install --include=dev && npm --prefix client run build`, then copies the result to `./dist` | `dist` |
| `client` | `npm install --include=dev && npm run build` (already inside the client) | `dist` under `client/` |

The client also carries its own `client/vercel.json`, so setting Root Directory to `client` works
on its own as well.

> **Seen before:** if the build fails with `ENOENT … /vercel/path0/client/client/package.json`, the
> Root Directory is set to `client` while the build command also says `--prefix client`. Setting
> Root Directory back to the repository root fixes it — or just use this build command, which
> already handles both.

Vercel checks the filesystem before applying the SPA rewrite, so `/data/*.json`, `/assets/*.js` and
the images are always served directly — only unknown routes fall back to `index.html`.

### Any other static host
```bash
npm run build          # → client/dist
```
Upload `client/dist` as-is. Everything it needs (including `dist/data/*.json`) is inside that
folder. To host the JSON somewhere else (e.g. a CDN), set `window.__SPACE_RELICS_DATA_BASE__ =
'https://cdn.example.com/space-relics/'` before the app boots.

## The guide (chat)
The AI Mission Guide answers in three layers, now entirely in the browser, and always tells you
which ones it used:

| Layer | What it does | Needs a key? |
|---|---|---|
| **Your database** | The bundled JSON answers first — status, achievements, positions, counts, "which rovers stopped working on Mars". Authoritative and always available, even offline. | no |
| **Internet** | When the dataset cannot answer (concepts like "what is a sky crane landing?"), the browser calls Wikipedia's public REST API and appends the background with links. Can be switched off in the chat header. | no |
| **Free AI model** | A keyless free endpoint (Pollinations, OpenAI-compatible) rewrites the retrieved material into fluent prose. It is only ever asked to *reword* — never to supply facts. If it rate-limits, the guide quietly answers from the data + Wikipedia instead. | no |

The dataset is authoritative: questions that match a record (or a subset such as "Mars rovers")
are answered from the data and the web is only added as background, while conceptual questions lead
with the web. Every bubble carries source badges (Your database · Internet · Free AI model) and the
links used.

> **No paid model key.** A browser cannot keep a secret, so the static build deliberately has no
> `AI_API_KEY` support — only the keyless endpoint. The facts always come from the bundled data and
> Wikipedia; the model only rephrases them.

### Tuning the guide
Set a runtime override before the app loads (no rebuild required):

```html
<script>
  window.__SPACE_RELICS_CONFIG__ = { webKnowledge: false, freeModel: false };
</script>
```
or build-time Vite variables: `VITE_WEB_KNOWLEDGE`, `VITE_FREE_MODEL`, `VITE_FREE_MODEL_URL`,
`VITE_FREE_MODEL_NAME`, `VITE_FREE_MODEL_COOLDOWN_MS`.

## Logo
The emblem lives in `client/public/logo.png` and is rendered in the top-left corner of the bar
(`.brand__logo` in `app.css`), at 36px on desktop and 32px on phones. The same file is the
favicon (`favicon.png`) and appears on the error screen.

The supplied source is a JPEG with the transparency checkerboard baked into the pixels, so it
is presented as a **circular seal**: the emblem's own pixels cropped to a circle, tinted into the
app palette and vignetted, with a dark rim. Nothing is keyed, so there are no halos or holes, and
at the size it is actually used the fine grid reads as badge texture.

`tools/make-logo.py` regenerates the asset. If you have a **PNG or SVG with real transparency**,
just drop it in as `client/public/logo.png` — the app needs nothing else.

## The data file
Everything the app knows comes from `client/public/data/solar-system-dataset.json`:

| Sheet in your workbook | Records in the file |
|---|---|
| Planets & Dwarf Planets | 16 bodies (+ the Sun and a small-bodies anchor added for the 3D scene) |
| Moons (all 460) | 460 moons |
| Missions | 211 missions |
| Space Stations | 19 stations |
| Launch Vehicles | 41 rockets |

To change the data you have two options:

1. **Edit the JSON directly** — every record keeps the same shape, then reload the page (or rebuild).
2. **Rebuild from a workbook** — drop a workbook with the same five sheets into
   `client/public/data/source/` and run `npm run dataset` (needs `pandas` + `openpyxl`). The script
   rewrites `client/public/data/solar-system-dataset.json` and prints the new counts.
   `npm run media` refreshes the per-object photographs in `media.json`.

Extra fields in the JSON are ignored; missing fields render as "—" in the UI.

### Dataset analysis
`docs/DATASET-ANALYSIS.md` is generated from the workbook and summarises what is actually in the
catalogue — volumes per sheet, missions by agency / type / status / decade, the busiest bodies,
tallest rockets, moons per planet, and the data-quality gaps. Current headline: **211 missions,
460 moons, 19 stations, 41 launch vehicles**, a photograph for every mission, and a published
position for 88% of them.

## Positions — measured, not guessed
`client/public/data/coordinates.json` carries the positions, separate from the workbook and editable:

* **57 landing sites** at published latitude/longitude (Apollo 11–17 from LROC's 2016 survey, the Mars rovers and landers from NASA/JPL, Chang'e, Surveyor, Luna, Chandrayaan-3, Venera and Vega).
* **162 orbital element sets** — altitude and inclination — covering all 19 space stations and 64 missions, from the ISS at 408 km / 51.64° to MRO at 300 km / 93°.
* **88% of all 211 missions** therefore have a published position. The rest are flybys and deep-space craft whose positions are inherently trajectory-dependent; they are drawn on a labelled shell, and every surface record without a survey is drawn on a band **and flagged as unpublished** — the app never presents a guessed coordinate as a measured one.

The details panel shows the position with its precision code (◎ measured, ◉ reported, ◍ approximate, ≈ unpublished), the decimal latitude/longitude, the site name and the source. Published orbit altitudes are also drawn as labelled rings around the body.

## Photographs
Clicking any rover, lander, orbiter, satellite, telescope, probe, impactor, helicopter or station
opens its details panel with a picture **of that object**:

1. the record's own `imageUrl` from the workbook (credited to Wikimedia Commons),
2. else its resolved Wikipedia/Wikimedia photograph from `media.json`,
3. else its destination body's photograph, captioned as such,
4. else a **generated SVG card** with the object's name and type.

The panel walks this list on the fly: if a photograph fails to load (offline, blocked, dead link)
the next candidate is tried, so the picture area is never blank. All 211 missions resolve to a real
photograph.

One known data error is handled explicitly: the workbook illustrates ESA's Rosalind Franklin rover
with a portrait of the **chemist** Rosalind Franklin. A `media.json` entry with `"override": true`
wins over the workbook image, and the panel credits the replacement and prints the reason.

## Realism
The Solar System is rendered physically rather than decoratively:

| Element | How it is done |
|---|---|
| Planet surfaces | Generated at load time — value-noise fBm with per-world profiles (cratered, ocean/land with polar ice, rust with polar caps, banded gas giants with a warped flow field) painted into an equirectangular map plus a matching bump map |
| Lighting | One light source (the Sun), low blue ambient, ACES Filmic tone mapping, sRGB output |
| Atmospheres | A fresnel shader shell gives Earth, Venus, Mars and the giants a real limb glow; Earth and Venus also get a separate cloud layer |
| Rings | Saturn, Uranus, Neptune and Jupiter draw their ring systems at the correct inner/outer radius multiples |
| Axial tilt | Every body is tilted by the workbook's own `axialTiltDeg` (Uranus at 98°, Venus at 177°) |
| Orbital inclination | Orbits are inclined by their real inclination to the ecliptic (Mercury 7°, Pluto 17.16°, Eris 44°) |
| Orbit spacing | `layoutOrbits()` in `lib/scale.js` is the single source of truth: a linear inner zone and a logarithmic outer zone, with the Sun's radius capped and a guaranteed gap between neighbours |
| Starfield | Shader point cloud (drei `<Stars>`) plus a faint procedural Milky Way band |
| Sun | Emissive surface plus three additive corona shells |
| Asteroid belt | Instanced rocks between 2.15 and 3.3 AU |

### Scene clutter rules
* At most **three** published-orbit shells are drawn at a body, chosen by how many objects use them (the selected object's shell is always included).
* Every object at a body is drawn — silhouette detail adapts above 18 objects instead of hiding any; the rail's chip forces full detail on all of them.
* The hint bar and the render-all control hide as soon as a panel is open.

### What the chat guide can answer
Grounded entirely in the data file: status and "is it still working", why a mission ended,
what a mission achieved, where it is now, launch date and launch vehicle, which missions went to
a body, which rocket launched a mission, moons of a body, counts and totals, "tallest rocket",
and "compare A and B". It resolves pronouns from the object you have selected ("why did it stop?").

## Run commands
| Command | Purpose |
|---|---|
| `npm run install:client` | install client dependencies |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | production build → `client/dist` |
| `npm run preview` | serve the production build locally |
| `npm run smoke` | renders **every** UI component on the server — catches render-time crashes the build cannot see |
| `npm run test:local` | serves `public/` and drives the real data + guide functions end-to-end |
| `npm run verify:all` | build + render smoke + local-data smoke |
| `npm run dataset` / `npm run media` | rebuild the JSON from the workbook / refresh photographs |

## 3D controls
| Input | Action |
|---|---|
| Drag | orbit the camera |
| Scroll / pinch | zoom |
| Click a planet or hardware cluster | travel to that body |
| Click a hardware object | open its record and set the chat context |
| `Esc` / ← Back | return to the system view |
| `F` | toggle the "show only working hardware" filter |
| `D` | toggle dwarf planets |

## Why the two smoke tests exist
The Vite build only parses; it cannot see a runtime throw. A hook dependency array that references a
`const` declared later in the same component throws *"Cannot access 'x' before initialization"*
during render, which blanks the whole app behind the error boundary. `npm run smoke` renders the
explorer shell plus every panel, overlay and chat bubble on the server, so that class of bug fails a
check instead of reaching a browser.

`npm run test:local` is the second half: it starts a tiny static server for `public/`, points the
data store at it, and calls the same functions the UI calls — catalog, a body's hardware, search,
a single mission and the chat guide — asserting they return real records. With no API to health
check, this is what proves the bundled data is complete and the browser logic works.
