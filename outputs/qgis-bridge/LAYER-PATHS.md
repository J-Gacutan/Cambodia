# Layer paths — Phase 0 QGIS bridge

All paths relative to the **Cambodia repo root**. CRS for rasters: **EPSG:32648**, 10 m. Vectors: WGS84 (EPSG:4326) unless noted.

## Required for interactive reproduce

| Role | Path | On this thin clone? | Git? |
| --- | --- | --- | --- |
| Class Step 3 | `inputs/screen-layers/L_class_10m/class_step3.tif` | **Missing** | gitignored (`*.tif`) |
| Elevation-check flag | `inputs/screen-layers/L13/elevation_check_flag_10m.tif` | **Missing** | gitignored |
| WDPA merged polygons | `inputs/screen-layers/L17/WDPA_KHM_polygons_merged_INTERNAL.gpkg` (layer `wdpa_khm`) | **Missing** | gitignored (`*.gpkg`) |
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

## Gap (documented for `khm-i6e.1`)

This Cloud Agent / thin clone has **no** GeoTIFF or WDPA GeoPackage on disk (~13 GB stack is workstation-local). Pack delivers everything that can be git-tracked: how-to, PNG cases A–C, QGIS project + styles pointing at the paths above, province GeoJSON, bookmarks.

**To finish interactive QGIS on a machine:** copy the three “Required” heavy layers into those paths (from the analyst workstation that closed `ywdp.8.5` / `ywdp.8.6` / `ywdp.8.8`), then open `cambodia-screen-phase0.qgs`. Tracked as follow-up **`khm-i6e.9`**.

## Rebuild pointers (if rasters must be remade)

| Product | Script |
| --- | --- |
| `class_step3.tif` | `intermediate/screen-build/process_step3_l8_l11.py` |
| Case PNGs | `intermediate/screen-build/process_step3_case_study_maps.py` |
| `elevation_check_flag_10m.tif` | `intermediate/screen-build/process_elevation_check_l12_l13.py` |
