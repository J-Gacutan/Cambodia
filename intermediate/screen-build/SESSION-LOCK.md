# Session lock notice (25 Nov 2026)

**Rule.** A beads claim blocks every other session. Do not work an `in_progress` issue you did not claim.

## Active lock

- `CSR-39` Means page presentation — claimed by worker `bc-8f762fe2…`. Branch `cursor/means-presentation-8bb9` off `a3d5e39` (main after #31 GMW loss). UI-only on `CasesPage` / Means copy + CSS; do not restomp change-stubs or open-cleared pin.

## Cleared / closed recently (do not reopen)

- `CSR-38` GMW Locate loss — PR #31 merged (`a3d5e39`).
- Locate basemap-swap (`cursor/locate-basemap-swap-c0ec`) — PR #29 merged (`e6ec7f5`).
- Act report QR (`khm-e8c`) / Act-About plain-copy — merged via PR #25 / #26 (24 Nov 2026).
- Locate fitness (`cursor/locate-mangrove-state-c0ec`) — PR #27 merged; extent/condition were named gaps (extent filled by `khm-6bx` / #30).
- Overlay toggle — PR #28 merged.
- Public pack GMW extent — PR #30 merged.
- `khm-i6e.10` Console polish + Pages readiness — closed 24 Nov 2026. PR #16 merged; `docs/09-github-pages.md` + MapLibre UX polish. `public_ready` unchanged.
- `khm-i6e.7` Phase 3 harden — contract pins, licence panel, handoff pack. `public_ready` unchanged.
- `khm-i6e.5` Kenya-style Pages workflow scaffold + `public_ready` gate (live deploy waits on `khm-i6e.2`).
- `khm-i6e.6.3` Stage Mangrove REDD+ / VCS 5071 overlap — closed 23 Nov 2026. Staged Verra KMLs; `v0.2.1` project_overlap refreshed. Koh Kong ARR portion of 5071 still unstaged.
- `khm-i6e.6.2` MoE core zones for STOP(legal) — closed **blocked** 23 Nov 2026. Evidence: `intermediate/screen-build/moe-core-zones-blocker.md`. `stop_legal` stays unavailable.
- `khm-i6e.6.1` WDPA workstation join — shipped (PR #15 / related).
- `khm-i6e.6` Phase 2 permit / STOP(legal) / overlap — max shippable without inventing clearances.
- `khm-i6e.3.1` Host-with-full-stack vectorise: closed 23 Nov 2026. Bundle `delivery/open-cleared/v0.2.0/` (10,503 features; `public_ready` false).
- `khm-i6e.9` Stage class+elev+WDPA for QGIS bridge: closed 23 Nov 2026.
- `khm-i6e.1` Phase 0 QGIS bridge pack: closed 23 Nov 2026.
- `khm-i6e.3` open-cleared GO±CAUTION bundle: stub + script; full vectorise via `khm-i6e.3.1`.
- `ywdp.8.6` / `ywdp.8.5` / `ywdp.8.8` screen steps closed.

## What other sessions may do

- Do not restomp `v0.3.0` flag attributes or `contract/platform.json` without a claim.
- `khm-i6e.2` licence gate remains open for formal close — P2 path already locked; do not invent further clearances.
- Do not push FLAG rasters or WDPA geometries to a public remote.
- Do not invent MoE core zones or missing Koh Kong VCS 5071 ARR geometry.
- Read this file and `.cursor/rules/beads-claim-blocks-sessions.mdc` at session start.
