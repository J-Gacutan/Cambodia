# Handoff — Cambodia screen console (Phase 3)

**Bead.** `khm-i6e.7`. **Date.** 23 Nov 2026.  
**Audience.** Next agent / CI GIS / Jordan.  
**Stack.** React + Vite + PatternFly 6 + MapLibre (`app/`) · open-cleared bundle · Kenya-style Pages.

---

## What you are handing off

| Piece | Path | Notes |
| --- | --- | --- |
| App | [`app/`](../app/README.md) | Map, cases, **licence panel** (`#licence`), about |
| Pinned bundle | `delivery/open-cleared/v0.2.1/` | Phase 2 flags on full GO±CAUTION; **`public_ready=false`** |
| Contract pin | [`contract/platform.json`](../contract/platform.json) | LKA-style sha256 list |
| Runtime pin | `config/contract-pin.json` | Written by `npm run sync:bundle` |
| Bundle version | [`config/bundle-versions.json`](../config/bundle-versions.json) | `"current": "v0.2.1"` |
| Pages workflow | [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) | Builds always; **deploy only if `public_ready=true`** |
| Licence register | [`intermediate/screen-build/phase-0-licence-register.md`](../intermediate/screen-build/phase-0-licence-register.md) | Living V/U/FLAG |
| First-share gate | [`intermediate/screen-build/first-public-share-gate.md`](../intermediate/screen-build/first-public-share-gate.md) | `khm-i6e.2` decisions |
| QGIS bridge | [`outputs/qgis-bridge/`](../outputs/qgis-bridge/) | Phase 0 offline pack |

---

## Licence / host matrix (locked preference)

| Channel | Status | Rule |
| --- | --- | --- |
| **Public GitHub Pages** | **NO-GO** until `khm-i6e.2` + `public_ready=true` | Only host for the console (no Amplify / CF Access unless Jordan revises) |
| Local / INTERNAL preview | GO for research | `cd app && npm run dev` |
| FLAG rasters / WDPA / INTERNAL case PNGs | **NO-GO** on any public remote | Stay gitignored / offline |

Do **not** invent clearances. Do **not** flip `public_ready` in the app or contract scripts.

---

## Runbook

### Local console

```bash
cd app
npm install
npm run sync:bundle    # verifies contract/platform.json → writes config/contract-pin.json
npm run check:bundle
npm run dev            # http://127.0.0.1:5173/  routes: #map #cases #licence #about
```

### After editing an open-cleared bundle

```bash
node scripts/write-contract.mjs          # refresh sha256 list for current pin
cd app && npm run sync:bundle && npm run check:bundle && npm run build
```

A non-stub bundle with a drifted file **fails sync** (nothing copied). Stub (`v0.1.0-stub`) may omit the contract.

### Public Pages

Full enablement checklist: [09-github-pages.md](09-github-pages.md).

1. Jordan closes `khm-i6e.2` with an open-cleared path (P2).
2. Rebuild / ship a bundle with `public_ready: true` and update the contract.
3. Repo Settings → Pages → Source: **GitHub Actions** (private repo needs a plan that includes private Pages).
4. Merge to `main`. Workflow deploy job runs only when `public/khm-bundle/public-ready.json` says ready. SPA `404.html` is copied from `index.html` in the workflow.
5. Confirm FLAG / WDPA / case PNGs are absent from `app/dist` and `public/khm-bundle/`.

### Degrade if a family is withheld

| Missing family | Behaviour |
| --- | --- |
| `layers` | Map has no GO geometry; licence panel says degraded |
| `cases` | Cases page empty / null |
| `flags` | Phase 2 filters show incomplete coverage (nulls) |

---

## Open beads (do not reopen closed Phase 0–2)

| ID | Role |
| --- | --- |
| `khm-i6e.2` | Licence/FLAG gate — blocks `public_ready` |
| `khm-i6e.5` | Pages pipe (scaffold on main; live deploy waits on `.2`) |
| `khm-i6e.10` | Console polish + Pages readiness docs (MapLibre UX, bookmarks, export) |
| `khm-i6e.8` | Optional deferred App grants (not critical path) |

---

## Product truth (must stay in UI)

Physical / land-cover suitability proxy only. GO = worth a field look. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome. Permit / STOP / overlap flags cite instruments — never approved/refused.
