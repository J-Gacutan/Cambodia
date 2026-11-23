# Phase 0 — Download links (click list)

Public / government research screen. Not for a credit project. Full register: [`phase-0-licence-register.md`](phase-0-licence-register.md).

**Already on disk** under `inputs/screen-layers/`: L20 coastal clip, L19 booklet PDF, L1 tile index.

## Do next (manual)

| Priority | Layer | Link | Notes |
| --- | --- | --- | --- |
| — | L19 digital GIS | Closed | MoE will not provide (23 Nov 2026). Booklet remains at `inputs/screen-layers/L19/`. Do not chase NFMS. |
| 2 | L1 GMW v4.1.12 | **Staged** from IND-MSP tar (Zenodo <https://zenodo.org/records/21346457>) | Coastal tiles in `inputs/screen-layers/L1/gmw_mng_ext_v4112_stack/`; ~30 m |
| 3 | L2 GMW v3.0 | <https://zenodo.org/records/6894273> | **Staged** 1996 `gmw_v3_1996_vec.zip` + gtiff in `inputs/screen-layers/L2/` |
| 4 | L3 Habitat mask v28 | <https://zenodo.org/records/17989832> | **Staged** `gmw_hab_msk_v28.gpkg` in `inputs/screen-layers/L3/` |
| 5 | L5 CAP ponds | <https://data.mendeley.com/datasets/6p6ccgts6d/1> | **Downloaded** (`Data.7z` in zip). Only **1°** area grids, not pond footprints — unusable for Step 2. Staged in `inputs/screen-layers/L5/` |
| 5b | **L_Jiang_ponds** | <https://doi.org/10.5281/zenodo.8344132> · [Cambodia.rar](https://zenodo.org/api/records/8344132/files/Cambodia.rar/content) | **Downloaded** 22 Nov 2026. Cambodia polygons 1990–2020. Staged `inputs/screen-layers/L_Jiang_ponds/`. Licence U (no Zenodo licence field) |
| 5c | **L_Clark_aquaculture** | [Clark download page](https://www.clarku.edu/geospatial-analytics/aquaculture-data-download/) · [Cambodia zip](https://clarkcga-aquaculture.s3.amazonaws.com/data/v1.0/zip/cambodia/Cambodia_Landcover_Change_Maps_1999_2014_2018_2020_2022.zip) | **Staged** 22 Nov 2026 from `~/Downloads/`. 15 m land cover 1999–2022 + change layers in `inputs/screen-layers/L_Clark_aquaculture/`. FLAG: page says CC BY non-commercial |
| 5d | **L_ponds_10m** | Derived (script `process_pond_layers_note3b.py`) | **Built** 22 Nov 2026. Jiang + Clark on Note 3b 10 m UTM48N grid. QA: `L_ponds_10m/qa_summary.md`. Next: L6 wet/dry |
| 6 | L12 DeltaDTM | GEE `projects/sat-io/open-datasets/DELTARES/deltadtm_v1-1` · [catalogue](https://gee-community-catalog.org/projects/delta_dtm/) · 4TU <https://data.4tu.nl/datasets/1da2e70f-6c4d-4b03-86bd-b53e789cc629> | **Staged** six tiles + coastal clip in `inputs/screen-layers/L12/` (GEE export 22 Nov 2026) |
| 7 | L14 GEBCO_2026 | CEDA NetcdfSubset · script `fetch_l14_gebco_cambodia.py` | **Staged** elevation + TID NC/TIF in `L14/` (W102.5–E105.2, S9.8–N12.3) |
| — | **Peng seagrass** | <https://zenodo.org/records/18612240> | **Staged** both periods in `inputs/screen-layers/L_Peng/` |
| 8 | L4 Loss drivers | <https://doi.org/10.3334/ORNLDAAC/1768> · `fetch_l4_goldberg_khm.sh` | **DONE** (23 Nov): 3 KHM GeoTIFFs staged; SHA-256 matched ORNL sidecars |
| 9 | L13 FES2022 heights | [pyTMD AVISO registration](https://pytmd.readthedocs.io/en/latest/getting_started/AVISO-Registration.html) · product <https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html> | **Staged** — 35 nc in `L13/pytmd/fes2022b/ocean_tide_extrapolated/` (~5.3 GB; `FES2022_extrapolated`; no currents) |
| 10 | L17 WDPA | **Downloaded** `WDPA_WDOECM_Nov2026_Public_KHM_shp.zip` | Nov 2026 KHM; merged `WDPA_KHM_polygons_merged_INTERNAL.gpkg` (68). Research / non-commercial OK for this screen (23 Nov 2026) |
| 11 | L15 Seagrass v7.1 | UNEP-WCMC GIS FeatureServer | **Staged INTERNAL** 15 points in KH box; 0 polygons (VN Gulf REF only) |
| 12 | L18 Ramsar | RSIS WFS `features_published` / `features_centroid_published` | **Staged** in `L18/` (3 polygons + 5 centroids; Kapik polygon absent upstream) |

## Earth Engine (no file download)

| Layer | Catalog |
| --- | --- |
| L6 Sentinel-1 / Sentinel-2 | `COPERNICUS/S1_GRD`, `COPERNICUS/S2_SR_HARMONIZED` |
| L7 Landsat 5 | `LANDSAT/LT05/C02/T1_L2` |
| L8 GHS-BUILT-S | `JRC/GHSL/P2023A/GHS_BUILT_S` |
| L9 WorldCover v200 | `ESA/WorldCover/v200` |
| L10 Dynamic World | `GOOGLE/DYNAMICWORLD/V1` (modal over 2024–2025) |
| L11 Murray intertidal | `UQ/murray/Intertidal/v1_1/global_intertidal` |
| L16 Allen Coral Atlas v2 | `ACA/reef_habitat/v2_0` (check Cambodia coverage) |

Non-commercial EE: <https://earthengine.google.com/noncommercial/>

## Do not use as MoE Forest Cover 2018

- <https://data.opendevelopmentcambodia.net/en/dataset/forest-cover-in-cambodia-2015-2020> (SERVIR / GLAD)
- <https://data.opendevelopmentcambodia.net/dataset/the-cambodia-national-land-cover-data-from-2015-2020> (SERVIR-SEA RLCMS)
