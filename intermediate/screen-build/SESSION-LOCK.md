# Session lock notice (25 Nov 2026)

**Rule.** A beads claim blocks every other session. Do not work an `in_progress` issue you did not claim.

## Active lock

- `CSR-38` GMW multi-year change for Locate loss — claimed by worker `bc-bb373802…`. Branch `cursor/gmw-locate-loss-f5a7` off `e6ec7f5` (#29 Streets dual-basemap). Includes cherry-picked GMW 2025 extent from `cursor/public-pack-extent-layers-2b85`. Shipping GMW 1996→2025 loss/gain (CC BY 4.0) into `public/change-stubs/` + open-cleared context; Goldberg L4 demoted. Do not restomp change-stubs or open-cleared pin without coordinating.

## Cleared / closed recently (do not reopen)

- Locate basemap-swap (`cursor/locate-basemap-swap-c0ec`) — PR #29 merged (`e6ec7f5`).
- Act report QR (`khm-e8c`) / Act-About plain-copy — merged via PR #25 / #26 (24 Nov 2026).
- Locate fitness (`cursor/locate-mangrove-state-c0ec`) — PR #27 merged; extent/condition were named gaps (extent filled by `khm-6bx` / this branch).
- Overlay toggle — PR #28 merged.
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
