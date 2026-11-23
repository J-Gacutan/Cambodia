# Cambodia screen platform (Phase 1–2)

Thin **React 18 + Vite + PatternFly 6 + MapLibre** console modelled on [`lka-msp-platform`](https://github.com/J-Gacutan/lka-msp-platform): map, legend, click-inspect class meaning, Phase 2 flag filters, cases A–C, shortlist CSV/GeoJSON, persistent product-truth banner.

**Beads:** `khm-i6e.4` (MVP) · `khm-i6e.6` (Phase 2 flags)  
**Data:** `delivery/open-cleared/<version>/` (pin in `../config/bundle-versions.json` → **`v0.2.1`**)

## Run locally

```bash
# from repo root
cd app
npm install
npm run sync:bundle   # copies open-cleared → ../public/khm-bundle/<version>/
npm run dev           # http://127.0.0.1:5173/
```

Build:

```bash
cd app
npm run build         # sync + tsc + vite → app/dist/
npm run preview
```

Override the pin without editing JSON:

```bash
VITE_KHM_BUNDLE_VERSION=v0.1.0-stub npm run dev   # thin-clone fallback
VITE_KHM_BUNDLE_VERSION=v0.2.0 npm run dev        # geometry only
VITE_KHM_BUNDLE_VERSION=v0.2.1 npm run dev        # Phase 2 flags (default pin)
```

## Phase 2 flags

| Flag | UI | Data posture |
| --- | --- | --- |
| Permit gate | Filter + inspect; Ramsar context overlay | Partial — WDPA join when gpkg present on workstation; null on thin clones (no invented clearance) |
| STOP (legal) | Filter wired; always “unavailable” until MoE core zones | Not invented from IUCN category |
| Project overlap | Filter + VCS 1748 overlay | Southern Cardamom staged; Mangrove REDD+ / VCS 5071 gap |

Rebuild attributes:

```bash
python3 intermediate/screen-build/build_phase2_legal_flags.py \
  --source-version v0.2.0 --out-version v0.2.1
```

See `delivery/open-cleared/v0.2.1/flags/GAPS.md`. Do **not** copy WDPA geometries into open-cleared or a public remote.

## Bundle swap

Current pin is **`v0.2.1`** (`public_ready=false`). To point at another open-cleared folder:

1. Ensure `delivery/open-cleared/<version>/` exists.
2. Set `"current"` in `config/bundle-versions.json`.
3. `npm run sync:bundle`.
4. Do **not** set `public_ready` in the app (`khm-i6e.2`).

## Public GitHub Pages (Kenya-style)

Workflow: `.github/workflows/pages.yml`.

| Gate | Rule |
| --- | --- |
| `public_ready` | Deploy runs only when the synced bundle’s `manifest.json` has `public_ready: true` |
| FLAG / INTERNAL / WDPA | Never copy `inputs/screen-layers/` binaries, WDPA gpkg, or QGIS-bridge case PNGs into `public/khm-bundle/` |
| Today | `public_ready=false` — workflow builds and **skips** Pages publish |

## Routes

| Hash | Page |
| --- | --- |
| `#map` | GO±CAUTION map, Phase 2 filters, context overlays, shortlist export |
| `#cases` | Cases A–C text bookmarks (no INTERNAL PNGs) |
| `#about` | Product truth + flag posture |

## Out of scope

Indonesia national console; SDF/Next stack; inventing MoE clearances; public Pages while `public_ready=false`.
