# Session lock notice (23 Nov 2026)

**Rule.** A beads claim blocks every other session. Do not work an `in_progress` issue you did not claim.

## Active lock

None. (`khm-i6e.6.2` / `.6.3` finished on `cursor/phase2-moe-vcs-flags-0eb0` stacked after PR #10. MoE core zones remain blocked with evidence; VCS 5071 + Krasop 5584 staged.)

## Cleared / closed recently (do not reopen)

- `khm-i6e.6.3` Stage Mangrove REDD+ / VCS 5071 overlap — closed 23 Nov 2026. Staged Verra KMLs `inputs/vcs-5071-kep-kampot-boundary.kml` + `inputs/vcs-5584-krasop-blue-carbon-boundary.kml`; `v0.2.1` project_overlap refreshed (1085 hits). Koh Kong ARR portion of 5071 still unstaged (registry KML is Kep/Kampot only).
- `khm-i6e.6.2` MoE core zones for STOP(legal) — closed **blocked** 23 Nov 2026. Evidence: `intermediate/screen-build/moe-core-zones-blocker.md`. `stop_legal` stays unavailable; do not invent from IUCN/L19.
- `khm-i6e.6.1` WDPA workstation join — shipped on `cursor/wdpa-workstation-join-6b85` / PR #10.
- `khm-i6e.6` Phase 2 permit / STOP(legal) / overlap — max shippable without inventing clearances (pipeline + app + partial flags).
- `khm-i6e.3.1` Host-with-full-stack vectorise: closed 23 Nov 2026. Bundle `delivery/open-cleared/v0.2.0/` (10,503 features; `public_ready` false).
- `khm-i6e.9` Stage class+elev+WDPA for QGIS bridge: closed 23 Nov 2026. Required layers verified on workstation; `LAYER-PATHS.md` updated.
- `khm-i6e.1` Phase 0 QGIS bridge pack: closed 23 Nov 2026. Pack at `outputs/qgis-bridge/`.
- `khm-i6e.3` open-cleared GO±CAUTION bundle: stub + script shipped; full vectorise completed via `khm-i6e.3.1`.
- `ywdp.8.6` Step 3 L8-L11: closed 23 Nov 2026. Class raster `inputs/screen-layers/L_class_10m/class_step3.tif`.
- `ywdp.8.5` elevation-check: closed.
- `ywdp.8.8` L19 MoE digital GIS: closed (will not provide). WDPA at `inputs/screen-layers/L17/` OK for non-commercial research.

## What other sessions may do

- Prefer stacking on PR #9/#10/#12 until merged; do not restomp `v0.2.1` flag attributes without a claim.
- `khm-i6e.2` licence gate remains open for Jordan decisions — do not mark the open-cleared bundle public-ready without it.
- Do not push FLAG rasters or WDPA geometries to a public remote.
- Do not invent MoE core zones or missing Koh Kong VCS 5071 ARR geometry.
- Read this file and `.cursor/rules/beads-claim-blocks-sessions.mdc` at session start.
