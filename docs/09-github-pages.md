# GitHub Pages readiness — Cambodia screen console

**Bead.** `khm-i6e.10` (polish) · `khm-i6e.5` (workflow scaffold) · **blocked live by** `khm-i6e.2`.  
**Date.** 24 Nov 2026.  
**Workflow.** [`.github/workflows/pages.yml`](../.github/workflows/pages.yml).

This page is the enablement checklist for **when** the licence gate clears. Do **not** flip `public_ready` or enable a public site until Jordan closes `khm-i6e.2` with an open-cleared path.

---

## What already exists on `main`

| Piece | Behaviour today |
| --- | --- |
| Build job | Always runs on `push` to `main` and on `workflow_dispatch` |
| `npm run build` + `check:bundle` | Must pass; contract pin verified |
| SPA fallback | `cp -f app/dist/index.html app/dist/404.html` after build |
| Upload / deploy | **Only if** `public/khm-bundle/public-ready.json` has `public_ready: true` |
| Manual dispatch default | `force_check_only=true` — build + gate check, **never** deploy |
| Bundle today | `v0.3.0` · `public_ready=true` (P2 class 8±4) · deploy runs on push to `main` when gate passes |

Confirm the gate without flipping anything:

```bash
cd app && npm run sync:bundle && npm run check:bundle
# Expect: PASS … public_ready=false
node -e "console.log(require('../public/khm-bundle/public-ready.json'))"
```

---

## Enable Pages (public repo)

Free-plan Pages needs a **public** repository. Project preference is **public GitHub Pages** for the console host — not Amplify / CF Access. (Private Pages needs Pro / Team / Enterprise.)

1. Repo visibility **public** (Jordan A, 24 Nov 2026).
2. Repo **Settings → Pages** → **Build and deployment → Source:** GitHub Actions (not “Deploy from a branch”).
3. Leave the environment as `github-pages` (matches the workflow `environment:` block).
4. Do **not** point Pages at `/docs` or a branch — the workflow uploads `app/dist`.
5. Ensure Actions are allowed for the repo (Settings → Actions → General).
6. After `khm-i6e.2` and a bundle with `public_ready: true` lands on `main`, the next green `pages` workflow run deploys.
7. Site URL: `https://j-gacutan.github.io/Cambodia/` (`VITE_BASE=/Cambodia/` in the workflow). Hash routes: `#home`, `#map`, `#cases`, `#licence`, `#about`, `#map?case=A`.

INTERNAL case PNGs / VERRA project-overlap geojson are removed from **tip** before public flip; **git history may still retain** those blobs unless a history rewrite is requested.

### SPA 404 fallback

Hash routing normally stays on `index.html`, but deep links and refresh on some hosts still request a path. The workflow copies `index.html` → `404.html` so GitHub Pages serves the SPA shell. Keep that step; do not remove it when editing the workflow.

### Deploy gate (must stay)

```yaml
# upload-pages-artifact and deploy jobs:
if: steps.gate.outputs.public_ready == 'true' && …
```

While `public_ready=false`, CI still builds (smoke) and prints the gate note. That is intentional. **Never** weaken the `if:` to force a public publish around `khm-i6e.2`.

---

## Pre-flight before first live deploy

1. Jordan closes `khm-i6e.2` with an open-cleared redistribution path.
2. Ship a bundle with `public_ready: true`; refresh `contract/platform.json` via `node scripts/write-contract.mjs`.
3. Confirm FLAG rasters, WDPA gpkg, and INTERNAL case PNGs are **absent** from `public/khm-bundle/` and `app/dist`.
4. Merge to `main`; watch the `pages` workflow: build green → artifact upload → deploy → Pages URL.
5. Spot-check: product banner, `#licence` host matrix, case bookmark `#map?case=A`, shortlist export.

---

## Local preview (no Pages)

```bash
cd app
npm install
npm run sync:bundle && npm run check:bundle
npm run dev          # http://127.0.0.1:5173/
# or: npm run build && npm run preview
```

---

## Related

- [08-handoff.md](08-handoff.md) — Phase 3 pin / licence panel / gate runbook  
- [04-data-and-licences.md](04-data-and-licences.md) · [first-public-share-gate.md](../intermediate/screen-build/first-public-share-gate.md)  
- [app/README.md](../app/README.md)
