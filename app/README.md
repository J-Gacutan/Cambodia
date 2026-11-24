# Cambodia screen platform (Phase 1–3)

Thin **React 18 + Vite + PatternFly 6 + MapLibre** console modelled on [`lka-msp-platform`](https://github.com/J-Gacutan/lka-msp-platform): map, legend, click-inspect class meaning, Phase 2 flag filters, cases A–C, shortlist CSV/GeoJSON, licence/evidence panel, persistent product-truth banner.

**Beads:** `khm-i6e.4` (MVP) · `khm-i6e.6` (flags) · `khm-i6e.7` (harden) · `khm-i6e.10` (polish / Pages docs)  
**Data:** `delivery/open-cleared/<version>/` (pin in `../config/bundle-versions.json` → **`v0.3.0`**)

## Run locally

```bash
# from repo root
cd app
npm install
npm run sync:bundle   # verifies contract → public/khm-bundle/<version>/
npm run check:bundle
npm run dev           # http://127.0.0.1:5173/
```

Build:

```bash
cd app
npm run build         # sync + tsc + vite + check:bundle → app/dist/
npm run preview
```

Override the pin without editing JSON:

```bash
VITE_KHM_BUNDLE_VERSION=v0.1.0-stub npm run dev   # thin-clone fallback (no contract)
VITE_KHM_BUNDLE_VERSION=v0.2.0 npm run dev        # geometry only — needs its own contract if non-stub
VITE_KHM_BUNDLE_VERSION=v0.2.1 npm run dev        # Phase 2 flags (pre-clip)
VITE_KHM_BUNDLE_VERSION=v0.2.2 npm run dev        # Cambodia-clipped + Phase 2 (default pin)
```

## Phase 2 flags

| Flag | UI | Data posture |
| --- | --- | --- |
| Permit gate | Filter + inspect; Ramsar context overlay | Partial — WDPA join when gpkg present on workstation; null on thin clones (no invented clearance) |
| STOP (legal) | Filter wired; always “unavailable” until MoE core zones | Not invented from IUCN category |
| VERRA (project overlap) | Filter + VCS 1748 / 5071 / 5584 overlays | Southern Cardamom, Mangrove ARR, Krasop Blue Carbon |

Rebuild attributes:

```bash
python3 intermediate/screen-build/build_phase2_legal_flags.py \
  --source-version v0.2.0 --out-version v0.2.1
# Viet Nam spill clip (L20 coastal provinces) → v0.2.2
python3 intermediate/screen-build/clip_go_caution_to_cambodia.py \
  --source-version v0.2.1 --out-version v0.2.2
python3 intermediate/screen-build/build_phase2_legal_flags.py \
  --source-version v0.2.2 --out-version v0.2.2
```

See `delivery/open-cleared/v0.2.1/flags/GAPS.md`. Do **not** copy WDPA geometries into open-cleared or a public remote.

## Bundle swap + contract pin (LKA-style)

Current pin is **`v0.3.0`** (`public_ready=true`, P2 class 8±4). To point at another open-cleared folder:

1. Ensure `delivery/open-cleared/<version>/` exists.
2. Set `"current"` in `config/bundle-versions.json`.
3. Non-stub: `node ../scripts/write-contract.mjs` → refresh `contract/platform.json`.
4. `npm run sync:bundle` — verifies sha256 list, writes `config/contract-pin.json`.
5. `npm run check:bundle` — re-hashes the public copy (also runs after `build`).
6. Do **not** set `public_ready` in the app (`khm-i6e.2`).

## Public GitHub Pages (Kenya-style)

Workflow: `.github/workflows/pages.yml`. Enablement checklist: [`docs/09-github-pages.md`](../docs/09-github-pages.md).

| Gate | Rule |
| --- | --- |
| `public_ready` | Deploy runs only when the synced bundle’s `manifest.json` has `public_ready: true` |
| FLAG / INTERNAL / WDPA | Never copy `inputs/screen-layers/` binaries, WDPA gpkg, or QGIS-bridge case PNGs into `public/khm-bundle/` |
| Today | `public_ready=false` — workflow builds and **skips** Pages publish |
| SPA fallback | Workflow copies `dist/index.html` → `dist/404.html` |
| Host preference | **Public Pages only** — no Amplify / CF Access unless Jordan revises |

## Routes

| Hash | Page |
| --- | --- |
| `#home` | Decision-flow landing → Locate, then Means / Read |
| `#change` | Locate — current state (extent/condition gaps + open change samples); overlays fade past ~z11.5 |
| `#map` | GO±CAUTION by hold-back driver, Phase 2 filters, shortlist export |
| `#cases` | Cases A–C text bookmarks (no INTERNAL PNGs) |
| `#licence` | Act — shortlist decision report (HTML/MD + CSV/GeoJSON + LIIP-style report QR) / licence panel |
| `#about` | Product truth + contract pin + flag posture |

Change stubs (`public/change-stubs/`) are open CC BY samples **outside** the open-cleared contract pin. Rebuild: `python3 intermediate/screen-build/build_change_stubs.py`.

## Handoff

See [`../docs/08-handoff.md`](../docs/08-handoff.md).

## Out of scope

Indonesia national console; SDF/Next stack; inventing MoE clearances; public Pages while `public_ready=false`; Amplify/CF Access unless preference changes.
