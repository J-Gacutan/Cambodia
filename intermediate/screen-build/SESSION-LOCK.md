# Session lock notice (23 Nov 2026)

**Rule.** A beads claim blocks every other session. Do not work an `in_progress` issue you did not claim.

## Active lock

None. (`khm-i6e.6.1` WDPA workstation join shipped on `cursor/wdpa-workstation-join-6b85` / PR #10 stacked on Phase 2 PR #9. Remaining Phase 2 data: `.6.2` MoE core zones, `.6.3` Mangrove REDD+/VCS 5071.)

## Cleared / closed recently (do not reopen)

- `khm-i6e.6` Phase 2 permit / STOP(legal) / overlap — max shippable without inventing clearances (pipeline + app + partial flags). Remaining data: `.6.1`–`.6.3`.
- `khm-i6e.3.1` Host-with-full-stack vectorise: closed 23 Nov 2026. Bundle `delivery/open-cleared/v0.2.0/` (10,503 features; `public_ready` false).
- `khm-i6e.9` Stage class+elev+WDPA for QGIS bridge: closed 23 Nov 2026. Required layers verified on workstation; `LAYER-PATHS.md` updated.
- `khm-i6e.1` Phase 0 QGIS bridge pack: closed 23 Nov 2026. Pack at `outputs/qgis-bridge/`.
- `khm-i6e.3` open-cleared GO±CAUTION bundle: stub + script shipped; full vectorise completed via `khm-i6e.3.1`.
- `ywdp.8.6` Step 3 L8-L11: closed 23 Nov 2026. Class raster `inputs/screen-layers/L_class_10m/class_step3.tif`.
- `ywdp.8.5` elevation-check: closed.
- `ywdp.8.8` L19 MoE digital GIS: closed (will not provide). WDPA at `inputs/screen-layers/L17/` OK for non-commercial research.

## What other sessions may do

- Claim `khm-i6e.6.2` / `.6.3` or Phase 3 on separate branches; do not restomp `v0.2.1` WDPA-joined attributes without a claim. Prefer stacking on PR #9/#10 until merged.
- `khm-i6e.2` licence gate remains open for Jordan decisions — do not mark the open-cleared bundle public-ready without it.
- Do not push FLAG rasters or WDPA geometries to a public remote.
- Read this file and `.cursor/rules/beads-claim-blocks-sessions.mdc` at session start.
