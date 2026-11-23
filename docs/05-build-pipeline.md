# Module — Build pipeline

Prerequisites: [01-overview.md](01-overview.md), [04-data-and-licences.md](04-data-and-licences.md), [../intermediate/screen-build/SESSION-LOCK.md](../intermediate/screen-build/SESSION-LOCK.md). Status: [../README.md](../README.md).

Implementation of Note 3b lives in [../intermediate/screen-build/](../intermediate/screen-build/). Scripts are local to that folder; outputs go to [../inputs/screen-layers/](../inputs/screen-layers/) (derived) or layer-specific `visualizations/`.

## Session discipline

Before editing screen scripts or class rasters:

1. Read [../intermediate/screen-build/SESSION-LOCK.md](../intermediate/screen-build/SESSION-LOCK.md).
2. Claim a beads issue (`bd update <id> --claim`). An `in_progress` claim blocks other sessions.
3. Leave progress on the issue with `bd update <id> --notes "…"`.

Host repo rule: `.cursor/rules/beads-claim-blocks-sessions.mdc` (rewrite or copy if this tree leaves CI Engagement).

## Next actions (plain)

As at SESSION-LOCK 23 Nov 2026 (confirm before starting):

1. Open a new beads issue under parent `CI_Blue_Carbon_ASEAN-ywdp.8` for permit and STOP (legal) flags using L17 (and related), then claim it.
2. Do not reopen closed Step 3 L8–L11 (`ywdp.8.6`) or elevation-check (`ywdp.8.5`) without a new decision.
3. Notes: Jordan internal sign-off on the four notes (parent `CI_Blue_Carbon_ASEAN-ywdp`) before any CI send.

## Script inventory (as staged)

| Script | Role |
| --- | --- |
| `fetch_l4_goldberg_khm.sh` | ORNL DAAC mangrove loss drivers (KHM) |
| `fetch_l13_fes2022_pytmd.py` / `fetch_l13_fes2022_curl_ftp.sh` | FES2022 tide heights |
| `fetch_l14_gebco_cambodia.py` | GEBCO coastal clip |
| `export_l8_l11_gee.py` | GEE export helper for built-up / intertidal family |
| `process_pond_layers_note3b.py` | Jiang + Clark → `L_ponds_10m` |
| `process_l6_pond_state_gee.py` | Wet / dry / intermittent pond state |
| `process_step1_mangrove_hc.py` | Historic / current mangrove |
| `process_step3_class_firstpass.py` | Early class mosaic |
| `process_step3_l8_l11.py` | Step 3 with L8/L11 inputs |
| `process_step3_case_study_maps.py` | Case-study / overview map figures for the user guide |
| `process_elevation_check_l12_l13.py` | Elevation vs tidal envelope check |
| `process_l13_hat_examples_map.py` | HAT example maps |
| `build_open_cleared_go_bundle.py` | Vectorise GO±CAUTION ≥ MMU → `delivery/open-cleared/<version>/` (MapLibre; `--sample-stub` if no class GeoTIFF) |

Also in the folder (not run scripts): `phase-0-*.md`, `prompt-*.md`, `websearch-*.md`, `SESSION-LOCK.md`. Re-list after adding files.

Prompts for parallel agent runs (`prompt-*.md`) sit beside the scripts. Prefer updating the prompt and the script together.

## Suggested phase order

Logical build order (not a live status table; see README + SESSION-LOCK):

| Phase | Intent | Primary docs |
| --- | --- | --- |
| 0 | Licence register + stage upstream layers | `phase-0-licence-register.md`, `phase-0-downloads.md` |
| 1 | Grid, habitat clip, mangrove H/C | `process_step1_mangrove_hc.py` |
| 2 | Ponds and water frequency | `process_pond_layers_note3b.py`, `process_l6_pond_state_gee.py` |
| 3 | Classification + flags | `process_step3_*.py` |
| 4 | Elevation / tidal checks, legal overlays | `process_elevation_check_*.py`, L17/L18 |
| 5 | QA, area tables, optional SEEA crosswalk export (separate derivation) | layer `*_qa.md` sidecars |

## Adding a step

1. Create or claim a beads issue; note the Note 3b section you implement.
2. Add `process_*.py` or `fetch_*.py` under `screen-build/` (no new top-level script dirs).
3. Write outputs only under `inputs/screen-layers/<layer>/` with QA markdown beside the raster.
4. Update the licence register if a new upstream product appears.
5. Update the status table in [../README.md](../README.md) when a phase completes (do not fork status into this module).

## Dependencies

Scripts assume a local Python with geospatial stack (GDAL/rasterio/geopandas as used per script), Earth Engine auth for GEE exports, and Homebrew paths where noted in script headers. Document any new binary dependency in the script docstring and here.
