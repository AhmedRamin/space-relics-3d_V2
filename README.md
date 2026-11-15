# Space Relics 3D — Solar System Explorer

> *Abandoned, but Not Forgotten.* 🚀

An interactive 3D Solar System where every planet is surrounded by the real hardware sent to explore it — rovers, landers, orbiters, satellites, probes, space telescopes, helicopters, and space stations.

Built for **NASA Space Apps Challenge 2026**. The challenge was abandoned, but the project wasn't forgotten.

## Tech Stack

Next.js 14 · React 18 · Three.js · React Three Fiber · Drei

- No backend, authentication, or API keys.
- Static JSON dataset loaded at runtime.
- Exports as plain static files.

## Features

- **NASA-filtered dataset:** 127 missions, 3 space stations, 16 launch vehicles, 19 planetary bodies, and 460 moons.
- **Interactive 3D exploration:** Explore planets and discover the hardware associated with them.
- **Year timeline:** Travel through 1962–2031 and see missions, launches, and discoveries unfold.
- **Detailed 3D hardware:** Procedurally modelled rovers, landers, orbiters, stations, and more.
- **Realistic planetary surfaces:** NASA-derived imagery, day/night maps, clouds, normal maps, and Saturn's rings.
- **Mission information:** Click objects to explore their records, stories, and source citations.
- **Built-in guide:** Ask questions about the Solar System and its missions.
- **Guided tour:** An interactive 8-step introduction for new visitors.
- **Responsive interface:** Desktop explorer rail and mobile-friendly navigation.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
npm run build
```

Exports a static website to `./out`.

Deploy on Vercel, Netlify, GitHub Pages, or any static file host.

## Project Structure

```text
app/          Next.js application and entry points
src/
  components/  3D scenes, hardware, panels, chat and tour
  lib/         Dataset, timeline, textures and utilities
  services/    Local data API and guide engine
  styles/      Application styles
public/
  data/        Solar System dataset and source workbook
  textures/    Planetary surface maps
tools/         Dataset builder and analysis scripts
```

## Dataset

The catalogue is built from:

`public/data/source/Space_Relics_3D_Dataset.xlsx`

To rebuild the dataset:

```bash
python3 tools/build-dataset.py
python3 tools/analyze-dataset.py > docs/DATASET-ANALYSIS.md
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `M` | Toggle explorer rail |
| `Y` | Open year review |
| `F` | Working-now filter |
| `D` | Dwarf planets |
| `←` / `→` | Step through years |
| `Esc` | Close / go back |

## Credits

Planetary surface textures: [Solar System Scope](https://www.solarsystemscope.com/textures/) — CC BY 4.0, built from NASA imagery.

Mission records include source citations in the dataset.

---

**Made for NASA Space Apps Challenge 2026.**

*The challenge may have been abandoned, but exploration never ends.*