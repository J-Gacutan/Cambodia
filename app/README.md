# Cambodia screen platform (Phase 1 MVP)

Thin **React 18 + Vite + PatternFly 6 + MapLibre** console modelled on [`lka-msp-platform`](https://github.com/J-Gacutan/lka-msp-platform): map, legend, click-inspect class meaning, cases A–C, shortlist CSV/GeoJSON, persistent product-truth banner.

**Bead:** `khm-i6e.4` · **Data:** `delivery/open-cleared/<version>/` (pin in `../config/bundle-versions.json` → **`v0.2.0`**)

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
VITE_KHM_BUNDLE_VERSION=v0.2.0 npm run dev        # full vectorise (default pin)
```

## Bundle swap

Current pin is **`v0.2.0`** (full `class_step3` vectorise; `stub=false`; **`public_ready=false`**). To point at another open-cleared folder:

1. Ensure `delivery/open-cleared/<version>/` exists (same schema: `manifest.json`, `layers/`, `cases/`).
2. Set `"current"` in `config/bundle-versions.json`.
3. `npm run sync:bundle` — no app rewrite if the schema matches.
4. Do **not** set `public_ready` in the app; that flag lives only in the delivery manifest (`khm-i6e.2`).

## Public GitHub Pages (Kenya-style)

Workflow: `.github/workflows/pages.yml`.

| Gate | Rule |
| --- | --- |
| `public_ready` | Deploy runs only when the synced bundle’s `manifest.json` has `public_ready: true` |
| FLAG / INTERNAL | Never copy `inputs/screen-layers/` or QGIS-bridge case PNGs into `public/khm-bundle/` |
| Today (`v0.1.0-stub`) | `public_ready=false` — workflow builds and **skips** Pages publish |

Local preview of a non-public stub is fine; do not flip the Pages environment live until `khm-i6e.2` clears the licence gate and an open-cleared bundle ships with `public_ready=true`.

## Routes

| Hash | Page |
| --- | --- |
| `#map` | GO±CAUTION map, legend, inspect, shortlist export |
| `#cases` | Cases A–C text bookmarks (no INTERNAL PNGs) |
| `#about` | Product truth + swap path |

## Out of scope (MVP)

Indonesia national console surfaces; SDF/Next stack; FLAG rasters; public Pages while `public_ready=false`; inventing clearances.
