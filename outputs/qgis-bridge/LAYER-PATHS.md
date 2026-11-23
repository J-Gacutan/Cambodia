# Layer paths — Phase 0 QGIS bridge

All paths relative to the **Cambodia repo root**. CRS for rasters: **EPSG:32648**, 10 m. Vectors: WGS84 (EPSG:4326) unless noted.

## Required for interactive reproduce

Verified **23 Nov 2026** on Jordan’s Mac (`~/Documents/GitHub/Cambodia`): all five required layers present; QGIS relative paths from `outputs/qgis-bridge/` resolve. No copy/link from CI Engagement D11 T3 needed — stack already lives under `inputs/screen-layers/` (~13 GB, gitignored).

| Role | Path | On this workstation? | Git? |
| --- | --- | --- | --- |
| Class Step 3 | `inputs/screen-layers/L_class_10m/class_step3.tif` | **Present** (EPSG:32648, 10 m, 19457×15661; class 1 ≈ 151,176 ha) | gitignored (`*.tif`) |
| Elevation-check flag | `inputs/screen-layers/L13/elevation_check_flag_10m.tif` | **Present** (same grid; values 0 / 1 / 255) | gitignored |
| WDPA merged polygons | `inputs/screen-layers/L17/WDPA_KHM_polygons_merged_INTERNAL.gpkg` (layer `wdpa_khm`) | **Present** (68 polygons; research / non-commercial — see L17 `PROVENANCE.txt`) | gitignored (`*.gpkg`) |
| Coastal four provinces | `inputs/screen-layers/L20/coastal-four-provinces.geojson` | Present | tracked |
| Case bookmarks | `outputs/qgis-bridge/cases.geojson` | Present (this pack) | tracked |

## Supporting (optional)

| Role | Path | Notes |
| --- | --- | --- |
| Class QA | `inputs/screen-layers/L_class_10m/class_step3_qa.md` | Screen-wide ha |
| Case ha tables | `inputs/screen-layers/L_class_10m/visualizations/step3-case-studies.md` | Canonical; pack copies under `visualizations/` |
| Elevation QA | `inputs/screen-layers/L13/visualizations/l13-elevation-check.md` | Flag codes 0 / 1 / 255 |
| HAT proxy | `inputs/screen-layers/L13/hat_amplitude_sum_proxy_kh.tif` | Upstream of flag; not required in project |
| WDPA zip / shp | `inputs/screen-layers/L17/` | Research / non-commercial; do not push to public remote |
| First-pass class | `inputs/screen-layers/L_class_10m_firstpass/class_firstpass.tif` | Build artefact |

## Thin-clone / Cloud Agent note

Cloud / thin clones still lack the three heavy layers (gitignored). Pack delivers how-to, PNG cases A–C, QGIS project + styles, province GeoJSON, bookmarks. On a full workstation, open `cambodia-screen-phase0.qgs` once the paths above exist — **`khm-i6e.9`** closed when verified here.

**Do not** push FLAG / INTERNAL GeoTIFFs or the WDPA GeoPackage to a public remote. Licence terms stay as in `docs/04-data-and-licences.md` and L17 `PROVENANCE.txt` (no invented licences).

## Rebuild pointers (if rasters must be remade)

| Product | Script |
| --- | --- |
| `class_step3.tif` | `intermediate/screen-build/process_step3_l8_l11.py` |
| Case PNGs | `intermediate/screen-build/process_step3_case_study_maps.py` |
| `elevation_check_flag_10m.tif` | `intermediate/screen-build/process_elevation_check_l12_l13.py` |
