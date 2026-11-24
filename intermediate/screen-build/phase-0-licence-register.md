# Phase 0 — Licence register and download staging

**Build.** ywdp.8 / ywdp.8.1. Spec: [`../../outputs/03b-restoration-potential-screen-method.md`](../../outputs/03b-restoration-potential-screen-method.md).

**Purpose (22 Nov 2026).** Research screen for **public and government** use (MoE and related agencies). Not for enabling any specific carbon-credit project. Not a private-sector screening product. Free Earth Engine non-commercial tier is the default platform.

**Freeze.** Grid 10 m, nearest neighbour, minimum mapping unit 0.5 ha. Extent: Koh Kong, Preah Sihanouk, Kampot, Kep, under 10 m elevation inside the habitat mask (plus sea to 10 m depth for the seagrass analogue only). **Y1 = 2024, Y2 = 2025** (two latest full calendar years as at 22 Nov 2026). Baseline year 1996 remains L2-anchored.

**Staging folder.** Raw downloads go in `../../inputs/screen-layers/` (not committed if large; record checksums here).

---

## 1. Release vs withhold (public / government package)

| Class | Layers | Rule |
| --- | --- | --- |
| **Release to MoE / public package** | L1–L14, L16 (if coverage), L18, L20; class raster and polygons that do not embed L15 geometries | CC BY 4.0 whole-stack rule as far as inputs allow; one attribution list |
| **Research / non-commercial OK** | **L17 WDPA** | This build is public/government research, not a credit project. Non-commercial use of the Protected Planet download is allowed for the permit and STOP (legal) flags. Cite Protected Planet; do not pass WDPA into a commercial or revenue-linked package without a fresh terms check. Filename `*_INTERNAL.gpkg` is historical. |
| **Booklet only (GIS closed)** | **L19 MoE Forest Cover 2018** | Public booklet staged. Digital GIS **will not be provided** (user, 23 Nov 2026). Do not chase NFMS. Do not substitute SERVIR/GLAD as MoE. |
| **Internal screening only** | L15 (UNEP-WCMC seagrass), L21 (Google Earth imagery) | May inform flags and labels. Do not redistribute geometries or imagery. |
| **HOLD / FLAG — do not release** | **L_Jiang_ponds** (U), **L_Clark_aquaculture** (FLAG non-commercial rider), **`L_ponds_10m`**, Step 3 **classes 6–7**, salt limb of class 5 | Combined `class_step3` product inherits these. Not for public Pages until cleared or replaced by an open-only rebuild. |

L15 commercial-use and redistribute bans still apply. L17 is usable in this research screen under non-commercial terms; credit-project or commercial redistribution remains barred.

**First client/Pages share.** Go/no-go matrix: [`first-public-share-gate.md`](first-public-share-gate.md) (`khm-i6e.2`). **Locked 24 Nov 2026 (AU/Sydney): P2** — public GitHub Pages for open-cleared **class 8 ± 4** only (`v0.3.0`, `public_ready=true`); non-commercial / research; **FLAG still NO-GO** on any public remote. Do not invent further clearances.

---

## 2. Download register

**Action.** `OPEN` = download or account step still needed. `HOLD` = blocked on a person (usually MoE or CI Cambodia). `GEE` = no file download; use Earth Engine catalog ID. `DONE` = file in `inputs/screen-layers/`.

### L1 — GMW Timeseries of Mangrove Extent v4.1.12

| | |
| --- | --- |
| Record | <https://zenodo.org/records/21346457> (DOI 10.5281/zenodo.21346457) |
| Licence | CC BY 4.0 |
| Prefer | Cambodia year vectors: `gmw_v4112_1996_…gpkg.gz` and `gmw_v4112_2024_…`, `gmw_v4112_2025_…` (and intervening years for the three-year persistence rule). Or full stack `gmw_mng_ext_v4112_stack.tar.gz` (1.4 GB, 41 bands 1985–2025) |
| Tile index | <https://zenodo.org/records/21346457/files/gmw_v4112_tiles.geojson?download=1> — staged; coastal 1° tiles: N11E103, N11E104, N12E102, N12E103, N13E102 (see `inputs/screen-layers/L1/coastal-cambodia-tiles.json`) |
| README | <https://zenodo.org/records/21346457/files/README.txt?download=1> (staged; does **not** state pixel size; resolution still U until geotiff metadata is read) |
| Prefer download | Year vectors for KHM, or stack then clip to L20. Direct file URLs follow `https://zenodo.org/records/21346457/files/<name>?download=1` |
| Resolution | **~30 m** (~0.0002695°, ~29 m at 11.5 N) on annual stack tiles; read from N11E103 geotiff (clears Note 3b U) |
| Staged | Five coastal tiles extracted from IND-MSP `gmw_mng_ext_v4112_stack.tar.gz` (Zenodo 21346457) into `inputs/screen-layers/L1/gmw_mng_ext_v4112_stack/` — see `phase-0-idn-mmaf-gmw-gebco.md` |
| Action | DONE for coastal Cambodia extent stack; L2 (v3 1996) and L3 habitat mask still OPEN |

### L2 — GMW v3.0 (1996 baseline)

| | |
| --- | --- |
| Record | <https://zenodo.org/records/6894273> |
| Licence | CC BY 4.0 |
| Prefer | 1996 epoch layer for Cambodia |
| Staged | `inputs/screen-layers/L2/` — `gmw_v3_1996_vec.zip` (194 MB) + `gmw_v3_1996_gtiff.zip` (65 MB) + README + tiles geojson |
| Action | DONE (22 Nov 2026) |

### L3 — GMW Mangrove Habitat Mask v28

| | |
| --- | --- |
| Record | <https://zenodo.org/records/17989832> |
| Licence | CC BY 4.0 |
| Staged | `inputs/screen-layers/L3/` — `gmw_hab_msk_v28.gpkg` (from `.gpkg.gz`) |
| Action | DONE (22 Nov 2026) |

### L4 — Goldberg et al. Mangrove Loss Drivers v1 (ORNL DAAC 1768)

| | |
| --- | --- |
| DOI | <https://doi.org/10.3334/ORNLDAAC/1768> |
| Catalogue | NASA Earthdata (login required). CMR `C2389103604-ORNL_CLOUD` — **Cambodia covered** (3 granules: `loss_driver_class_KHM.tif`, `land_cover_change_class_KHM.tif`, `loss_epoch_KHM.tif`) |
| Staged | All three KHM GeoTIFFs plus public docs in `inputs/screen-layers/L4/` (23 Nov 2026). SHA-256 match ORNL `.sha256` sidecars. GEE asset not loadable from `gee-gmw-lka-extract` |
| Fetch | `intermediate/screen-build/fetch_l4_goldberg_khm.sh` (`curl -n --location-trusted` + `~/.urs_cookies`; needs `urs.earthdata.nasa.gov` in `~/.netrc`) |
| Licence | Authors CC BY 4.0; US government works on portal |
| Action | **DONE** (23 Nov 2026) |

### L5 — Global coastal aquaculture pond (CAP) v1

| | |
| --- | --- |
| Record | <https://data.mendeley.com/datasets/6p6ccgts6d/1> (DOI 10.17632/6p6ccgts6d.1) |
| Licence | CC BY 4.0 |
| Years | 1990, 2000, 2010, 2020 |
| Download | `~/Downloads/Global coastal aquaculture pond (CAP) dataset (199.zip` → `Data.7z` (16,282 bytes). Staged and extracted in `inputs/screen-layers/L5/` |
| What it is | Four global GeoTIFFs `World_YYYY_merge1.tif`, **1°** (360×180, EPSG:4326, float32, nodata −999). Values look like pond area (ha) per cell, not footprints. Cambodia coast has a few non-null cells (e.g. 2020: 104–105°E / 10–11°N ≈ 1,089) |
| Screen use | **Not usable for Step 2 pond polygons.** Keep as coarse corroboration only. Footprints: use L_Jiang_ponds (below); L6 water-frequency still tests active vs abandoned |
| Action | DONE (download); FAIL for Note 3b footprint role |

### L_Jiang_ponds — Jiang coastal aquaculture ponds, Cambodia (candidate Step 2)

| | |
| --- | --- |
| Record | <https://doi.org/10.5281/zenodo.8344132> (Zenodo v1, 14 Sep 2023); method paper DOI 10.1016/j.jag.2024.103654; cited as pond input in One Earth 8:101149 |
| Download | `Cambodia.rar` (3.0 MB, md5 `99457631a3a1c90d787dcdedd50f9284`) from the Zenodo files list |
| Staged | `inputs/screen-layers/L_Jiang_ponds/A_Cambodia/{90,00,10,20}/` — years 1990, 2000, 2010, 2020 |
| What it is | Pond **polygons** at ~30 m mapping scale (EPSG:4326). Counts: 910 / 1,907 / 1,984 / 2,754. Bounds cover the four coastal provinces. No active/abandoned/salt class |
| Licence | **U.** Record is open; Zenodo API `license` is null (22 Nov 2026). Ask authors before redistribution. Companion feasibility product zenodo.11206627 is CC BY 4.0 (different deposit) |
| Action | DONE (download + extract); HOLD on release until licence confirmed |
| Search log | `websearch-cambodia-aquaculture-pond-maps-2026-11-22.md` |

### L_Clark_aquaculture — Clark Labs Cambodia land cover and change (15 m)

| | |
| --- | --- |
| Source | <https://www.clarku.edu/geospatial-analytics/aquaculture-data-download/> · zip <https://clarkcga-aquaculture.s3.amazonaws.com/data/v1.0/zip/cambodia/Cambodia_Landcover_Change_Maps_1999_2014_2018_2020_2022.zip> |
| Staged | `inputs/screen-layers/L_Clark_aquaculture/` from `~/Downloads/` 22 Nov 2026 (md5 `9c4ef9d40701886ecc66401243bd7a12`) |
| What it is | 15 m thematic GeoTIFFs: land cover 1999 / 2014 / 2018 / 2020 / 2022 (class 3 = Pond Aquaculture); change persistence 1999–2022 and 2020–2022. CRS cylindrical equal area (std parallel 15°). Pond class 2022 ≈ 1,844 ha |
| Licence | README in zip: CC BY 4.0. Download page adds "**non-commercial purposes only**". FLAG until Clark confirms |
| Screen use | Cross-check / alternate Step 2 pond mask vs L_Jiang_ponds; mangrove↔pond change classes. Reproject before 10 m overlay |
| Action | DONE (staged + inspected); processed to `L_ponds_10m/` |

### L_ponds_10m — Note 3b Step 2 pond stack (derived)

| | |
| --- | --- |
| Built by | `intermediate/screen-build/process_pond_layers_note3b.py` (22 Nov 2026) |
| Grid | EPSG:32648, 10 m, nearest neighbour; AOI = 5 km buffer of Jiang∪Clark ponds ∩ L20; MMU 0.5 ha |
| Key layers | `jiang_pond_YYYY`, `clark_pond_YYYY`, `clark_landcover_YYYY`, `clark_change_*`, `step2_pond_{jiang2020,clark2022,union,agree}` |
| Step 2 areas | Jiang 2020 5,359 ha; Clark 2022 1,831 ha; union 6,918 ha; **agree only 269 ha** (products diverge) |
| L6 on stack | wet/dry/salt DONE (`l6_pond_state_*.tif`, `l6_pond_activity_y1y2.tif`, `l6_salt_field.tif`; QA `l6_pond_state_qa.md`) |
| Licence | Inherits Jiang HOLD + Clark FLAG — do not release |
| Action | DONE for footprint prep + L6 state |

### L_mangrove_10m — Note 3b Step 1 historic/current mangrove (derived)

| | |
| --- | --- |
| Built by | `intermediate/screen-build/process_step1_mangrove_hc.py` (23 Nov 2026) |
| Grid | EPSG:32648, 10 m; L20 coastal four ∩ L1 v4.1.12 coastal-tile mosaic bbox; MMU 0.5 ha |
| Key layers | `h_historic.tif` (L2 1996 OR L1 ≥3 consecutive years from 1996), `c_current.tif` (L1 2025), sensitivity `h_l2_1996`, `h_l1_1996`, `h_l1_persist3`, `h_l1_only_1996_class9` |
| QA | `step1_mangrove_hc_qa.md` — H 70,087 ha; C 34,525 ha; H not C 35,649 ha |
| Action | DONE for Step 1 |

### L6 — Sentinel-1 GRD and Sentinel-2 L2A

| | |
| --- | --- |
| Access | GEE project **`gee-gmw-lka-extract`**: `COPERNICUS/S1_GRD`, `COPERNICUS/S2_SR_HARMONIZED` |
| Licence | Free, full and open (Sentinel Legal Notice) <https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice> |
| Processed | `process_l6_pond_state_gee.py` → `L_ponds_10m/l6_pond_state_{2024,2025}.tif`, `l6_pond_activity_y1y2.tif`, `l6_salt_field.tif` (22 Nov 2026). QA: `l6_pond_state_qa.md`. Salt thresholds are PROPOSAL (eye-check) |
| Action | DONE for Step 2 wet/dry/salt on pond union |

### L7 — Landsat 5 TM Collection 2 Level 2

| | |
| --- | --- |
| Access | GEE: `LANDSAT/LT05/C02/T1_L2` |
| Licence | Public domain (USGS) |
| Action | GEE |

### L8 — GHS-BUILT-S R2023A

| | |
| --- | --- |
| Access | GEE: `JRC/GHSL/P2023A/GHS_BUILT_S` |
| Licence | JRC: reuse with acknowledgement |
| Staged | `inputs/screen-layers/L8_L11_10m/l8_2025_pct.tif` and `l8_2020_pct.tif` (percent of the 100 m cell). The 2025 epoch is modelled and is the one used in the built-up flag |
| Action | DONE (GEE, 23 Nov 2026, `ywdp.8.6`) |

### L9 — ESA WorldCover v200 (2021)

| | |
| --- | --- |
| Access | GEE: `ESA/WorldCover/v200` |
| Licence | CC BY 4.0 |
| Staged | `inputs/screen-layers/L8_L11_10m/l9_map.tif` (2021 Map; class 50 is built-up) |
| Action | DONE (GEE, 23 Nov 2026, `ywdp.8.6`) |

### L10 — Dynamic World V1 (“now” over Y1–Y2)

| | |
| --- | --- |
| Access | GEE: `GOOGLE/DYNAMICWORLD/V1` |
| Licence | CC BY 4.0 |
| Window | Modal / frequency over calendar 2024 and 2025 |
| Staged | `inputs/screen-layers/L8_L11_10m/l10_modal.tif`, `l10_water_pct.tif`, `l10_n.tif` |
| Action | DONE (GEE, 23 Nov 2026, `ywdp.8.6`) |

### L11 — Murray Global Intertidal Change v1.1

| | |
| --- | --- |
| Access | GEE: `UQ/murray/Intertidal/v1_1/global_intertidal` |
| Licence | CC BY 4.0 (cite paper) |
| Staged | `inputs/screen-layers/L8_L11_10m/l11_flat.tif` (epoch 2014-2016; value 1 is tidal flat) |
| Action | DONE (GEE, 23 Nov 2026, `ywdp.8.6`) |

### L12 — DeltaDTM v1.1

| | |
| --- | --- |
| Record | <https://data.4tu.nl/datasets/1da2e70f-6c4d-4b03-86bd-b53e789cc629> |
| GEE asset | `projects/sat-io/open-datasets/DELTARES/deltadtm_v1-1` (band `b1`; mask `≠30`) via <https://gee-community-catalog.org/projects/delta_dtm/> |
| Licence | CC BY 4.0; Copernicus DEM GLO-30 / WorldDEM-30 notice also applies |
| Staged | `inputs/screen-layers/L12/` — six 1° tiles (N10E103–104, N11E102–105) as int16 decimetres + `DeltaDTM_v1_1_cambodia_coastal_clip.tif` (L20 bbox). EE project `gee-gmw-lka-extract`; export via `computePixels` 0.5° quarters. See `L12/PROVENANCE.txt` and `tile-stats.json` |
| Action | DONE (GEE export 22 Nov 2026) |

### L13 — FES2022 (AVISO)

| | |
| --- | --- |
| Product page | <https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html> |
| Licence | AVISO Licence Issue 20: heights/loading all uses; currents non-commercial |
| Need | Registration; use **heights** (not currents) for highest astronomical tide |
| Fetch | Prefer disk-streaming FTP: `intermediate/screen-build/fetch_l13_fes2022_curl_ftp.sh` (extrapolated heights only → pyTMD model `FES2022_extrapolated`). Alt: pyTMD wrapper `fetch_l13_fes2022_pytmd.py` ([AVISO-Registration](https://pytmd.readthedocs.io/en/latest/getting_started/AVISO-Registration.html); buffers each ~150 MB .xz). Credentials: `AVISO_USERNAME` / `AVISO_PASSWORD` (do not commit). HTTPS TDS also works but was slower from this host |
| Staged | `inputs/screen-layers/L13/pytmd/fes2022b/ocean_tide_extrapolated/` — 34 constituents + `mask_fes2022B.nc` (35 nc; fetch.log Done fail=0). No currents |
| Action | DONE (heights staged 22–23 Nov 2026). HAT amplitude-sum proxy GeoTIFF + examples/map: `L13/hat_amplitude_sum_proxy_kh.tif`, `L13/visualizations/` (`ywdp.8.1.4`). Elevation-check flag: `L13/elevation_check_flag_10m.tif` (`ywdp.8.5`) |

### L14 — GEBCO_2026 Grid

| | |
| --- | --- |
| Terms | <https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use> — PDF staged in `inputs/screen-layers/L14/` |
| Download | CEDA NetcdfSubset (LKA-MSP pattern): script `intermediate/screen-build/fetch_l14_gebco_cambodia.py`. Elevation + TID for W 102.5–E 105.2, S 9.8–N 12.3 |
| Staged | `GEBCO_2026_KH_elevation.nc/.tif`, `GEBCO_2026_KH_tid.nc/.tif` (601×649, elev −72..1739 m) |
| Licence | Public domain |
| Action | DONE |

### L15 — UNEP-WCMC Global Distribution of Seagrasses v7.1

| | |
| --- | --- |
| Dataset | Old URL <https://data.unep-wcmc.org/datasets/7> → Ocean+ FAQ. GIS Portal item <https://data-gis.unep-wcmc.org/portal/home/item.html?id=aaa46cd3d3d640b2916b8f0a0ffe07cb> · FeatureServer `HabitatsAndBiotopes/Global_Distribution_of_Seagrasses` |
| Licence | <https://www.unep-wcmc.org/en/general-data-license> (no commercial use / redistribute without permission) |
| Staged | **INTERNAL** `inputs/screen-layers/L15/`: 15 points in coastal box W102.5–E105.2 / S9.8–N12.3; **0 polygons** in that box (Gulf polygons are Vietnam ~106.5 E / 8.7 N — REF file only). El Nido REST pattern |
| Package | Internal only — do not release geometries; prefer L_Peng for published maps |
| Action | DONE (points); polygon gap for KH coast is upstream |

### L_Peng — Peng et al. 2026 global 10 m seagrass (analogue input; not in Note 3b table)

| | |
| --- | --- |
| Record | <https://zenodo.org/records/18612240> (DOI 10.5281/zenodo.18612240) |
| Licence | CC BY 4.0 — releasable (prefer over L15 for any published map) |
| Periods | 2019–2020 and 2023–2024 |
| Staged | `inputs/screen-layers/L_Peng/peng_seagrass_*_tile_0000851968_0003145728.tif` (one tile covers Cambodia coast; bounds ~102.6–108.5 E, 7.6–13.5 N; ~10 m; value 1 = seagrass). 2019–20: 707,515 seagrass pixels in tile; 2023–24: 805,250 |
| Action | DONE |

### L16 — Allen Coral Atlas v2.0

| | |
| --- | --- |
| Access | GEE: `ACA/reef_habitat/v2_0` (bands `geomorphic`, `benthic`, `reef_mask`) |
| Licence | CC BY 4.0 with copyright notice |
| Coverage | **Confirmed** 22 Nov 2026 over coastal box W102.5–E105.2 / S9.8–N12.3 (`gee-gmw-lka-extract`): ~180k geomorphic / ~178k benthic / ~257k reef_mask valid 30 m cells. Sub-boxes: Koh Rong and Koh Kong bay have substantial reef_mask; Kep–Kampot near-shore is sparse (~100 cells). Clears Note 3b “Cambodia coverage unconfirmed” |
| Screen use | Section 5 seagrass / benthic analogue cross-check only; not a mangrove restoration class |
| Action | GEE (coverage DONE) |

### L17 — WDPA (latest)

| | |
| --- | --- |
| Portal | <https://www.protectedplanet.net/en/country/KHM> |
| Download | `WDPA_WDOECM_Nov2026_Public_KHM_shp.zip` (14.4 MB, 22 Nov 18:46) — staged `inputs/screen-layers/L17/` |
| Contents | Nested parts 0–2: merge polygon SHPs (23+23+22 = **68** polygons) + 1 point (UNESCO-MAB). November 2026 Public KHM |
| Merged | `inputs/screen-layers/L17/WDPA_KHM_polygons_merged_INTERNAL.gpkg` (layer `wdpa_khm`, EPSG:4326, **68** polygons). Filename keeps `_INTERNAL` from Phase 0; use is research/non-commercial for this screen |
| Coastal bbox | Peam Krasop WS, Kep/Preah Sihanouk/Bokor NPs, Koh Kapik Ramsar, Koh Rong NP, Dong Peng MUA, among others (Khmer NAME field) |
| Terms | <https://www.protectedplanet.net/en/legal> — non-commercial research OK for this public/government screen; commercial / revenue-linked use and wholesale redistribution remain restricted |
| Action | DONE. **Research use confirmed 23 Nov 2026** (user: non-commercial research project). Ready for permit / STOP (legal) flags when that step runs |

### L18 — Ramsar Sites Information Service

| | |
| --- | --- |
| Licence | <https://www.ramsar.org/licence-information> (data/downloads CC BY 4.0) |
| Staged | `inputs/screen-layers/L18/` — WFS `features_published` iso3=KHM polygons (3: Boeng Chhmar, Prek Toal, Stung Sen) + `features_centroid_published` (all 5, including Koh Kapik 998 and Mekong 999) |
| Gap | Koh Kapik / Mekong polygons not in `features_published` as of 22 Nov 2026 — centroids only |
| Action | DONE (polygons where published; coastal Kapik centroid stand-in) |

### L19 — MoE Cambodia Forest Cover 2018 (booklet only)

| | |
| --- | --- |
| What was sought | MoE’s official **land use / forest cover 2018** digital map used in the FRL / BUR REDD technical annex, stored in the **NFMS** database. Booklet published Dec 2020 / NCSD Jan 2023 reprint |
| Booklet (public PDF) | **Staged:** `inputs/screen-layers/L19/Cambodia_Forest_Cover_2018_En.pdf` from <https://cambodia-redd.org/wp-content/uploads/2021/03/Cambodia_Forest_Cover_2018_En.pdf>. NCSD page: <https://ncsd.moe.gov.kh/dcc/resource/Cambodia/Forest/Cover/2018>. ODC mirror also listed in earlier logs |
| Digital GIS | **CLOSED 23 Nov 2026.** MoE will not provide the digital GIS (user). No further request to `nfms@moe.gov.kh` or CI Cambodia for this layer |
| Not a substitute | ODC / SERVIR “Forest cover 2018” and “Annual land cover 2018” GeoTIFFs are **SERVIR-SEA / GLAD**, not MoE Forest Cover 2018. Do not label them as MoE |
| Licence | Booklet is public. Digital map has no public licence and is not available to this build |
| Action | **DONE (booklet only).** Digital GIS will not be provided |

### L20 — geoBoundaries Cambodia ADM1 (gbOpen)

| | |
| --- | --- |
| API | <https://www.geoboundaries.org/api/current/gbOpen/KHM/ADM1/> |
| GeoJSON | <https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/KHM/ADM1/geoBoundaries-KHM-ADM1.geojson> |
| Licence | Source ODbL 1.0 (API `boundaryLicense`); gbOpen release described as CC BY 4.0 compliant |
| Filter | **Staged:** `inputs/screen-layers/L20/coastal-four-provinces.geojson` (Koh Kong, Preah Sihanouk, Kampot, Kep) |
| Action | DONE |

### L21 — Google Earth historical VHR imagery

| | |
| --- | --- |
| Terms | <https://www.google.com/help/terms_maps-earth/> |
| Use | Validation labelling only; no redistribute; no commercial use |
| Action | Viewing account; no bulk download |

---

## 3. Immediate downloads (do these first)

Manual browser or `curl` where the host allows. Save under `inputs/screen-layers/<ID>/`.

1. **L20** — geoBoundaries KHM ADM1 (small; unlocks the coastal clip).
2. **L19 booklet** — NCSD or Cambodia REDD+ PDF (class legend and provincial forest figures; not the GIS).
3. **L1** — at least `gmw_v4112_1996`, `2024`, `2025` country vectors, or the stack if disk allows; plus `gmw_v4112_tiles.geojson`.
4. **L2** — GMW v3 1996.
5. **L3** — habitat mask.
6. **L5** — CAP v1 from Mendeley.
7. **L12** — DONE via GEE (six tiles + coastal clip in `L12/`).
8. **L14** — DONE (GEBCO_2026 KH elevation + TID).
9. **Accounts** — Earthdata (L4) used 23 Nov 2026. UNEP-WCMC/Ocean+ (L15), AVISO (L13) and Protected Planet (L17) already used.

**L19 digital GIS:** closed. MoE will not provide (23 Nov 2026). No CI Cambodia chase.

---

## 4. Phase 0 exit criteria

- [x] Y1/Y2 frozen as 2024/2025 in this register.
- [x] Purpose recorded as public/government research.
- [x] L19 booklet on disk; digital GIS **closed** (will not be provided, 23 Nov 2026).
- [x] L20 coastal provinces clipped.
- [x] L1 resolution read from geotiff metadata (~30 m; clears U).
- [x] L1 coastal extent stack staged (from IND-MSP tar).
- [x] Peng seagrass tile staged (both periods); restaged to `L_Peng/` after nested-cwd misplace.
- [x] L12 DeltaDTM coastal tiles + clip staged via GEE.
- [x] L16 Cambodia coverage checked in GEE (present; Koh Rong / Koh Kong strong; Kep–Kampot sparse).
- [x] L2 GMW v3 1996 vec + gtiff staged.
- [x] L3 habitat mask v28 gpkg staged.
- [x] L13 FES2022 extrapolated heights staged (35 nc) + HAT amp-sum proxy map/examples (`L13/visualizations/`).
- [x] L6 pond wet/dry/salt on union DONE (`L_ponds_10m/`).
- [x] L4 Goldberg KHM GeoTIFFs staged via Earthdata (23 Nov 2026).
- [x] Step 1 H/C DONE (`L_mangrove_10m/`); Step 3 first-pass classes 3/5/6/7 DONE (`L_class_10m_firstpass/`).
- [x] Phase 0 downloads complete. L19 digital GIS closed (will not provide). L4 DONE 23 Nov.
- [x] Elevation-check flag (L12 vs L13) on the 10 m grid: `L13/elevation_check_flag_10m.tif` (`ywdp.8.5`). Class 6: 13.09 ha caution, 65.49 ha within allowance, 288.91 ha not tested (243.56 ha no L12 elevation).
- [x] Full Step 3 L8-L11 (`ywdp.8.6`): `L_class_10m/class_step3.tif` and `class_step3_qa.md`. Class 1 is 151,176 ha, of which 130,074 ha have neither WorldCover class 50 nor GHS 2025 at 50 percent. Class 2 replaces 1,144 ha of first-pass existing mangrove.
- [x] Checksums refreshed for stable staged layers (exclude L13 `.partial` and `l6_gee_scratch`): `inputs/screen-layers/CHECKSUMS-phase0-partial.txt`.
- [x] L17 WDPA staged and cleared for **non-commercial research** use on this screen (`L17/WDPA_KHM_polygons_merged_INTERNAL.gpkg`, 68 polygons).
- [ ] No L15 geometry in any folder marked for release.

---

## 5. Log

| Date | Event |
| --- | --- |
| 22 Nov 2026 | ywdp.8 claimed; purpose set to public/government research; L19 preferred; Phase 0 register opened; Y1/Y2 = 2024/2025 |
| 22 Nov 2026 | Staged L20 (full + coastal four), L19 booklet PDF, L1 tile index + README; listed five coastal GMW 1° tiles |
| 22 Nov 2026 | idn-mmaf/IND-MSP: GMW stack reused (5 Cambodia tiles); GEBCO terms only (no KH subset); Peng 18612240 tile fetched both periods |
| 22 Nov 2026 | L12: DeltaDTM v1.1 exported from GEE Community Catalog (six 1° tiles + L20 coastal clip) under `inputs/screen-layers/L12/`; closed ywdp.8.1.1. Restaged `L_Peng/` and `L14/` terms PDF out of nested path under `L1/` |
| 22 Nov 2026 | L2 + L3 staged from Zenodo (1996 vec/gtiff; habitat mask v28 gpkg). AVISO Keycloak login opened for L13 FES2022 heights |
| 22 Nov 2026 | L14 DONE: GEBCO_2026 KH elevation+TID via CEDA (`fetch_l14_gebco_cambodia.py`). L18 DONE: RSIS WFS KHM polygons (3) + centroids (5; Kapik/Mekong centroid-only). L13: AVISO FTP credentials used; switched to `fetch_l13_fes2022_curl_ftp.sh` (extrapolated heights, no currents; ~5 GB; in progress) |
| 22 Nov 2026 | L15: UNEP-WCMC FeatureServer extract — 15 points in KH coastal box, 0 polygons (Gulf polys are VN REF). L4: CMR confirms 3 KHM granules; public PDFs staged; GeoTIFF download blocked without Earthdata (`fetch_l4_goldberg_khm.sh` ready) |
| 22 Nov 2026 | Parallel pass (dryseason/L6 left alone; L4 HOLD): L16 ACA coverage confirmed in GEE; licence register + stable-layer checksums refreshed; L6 waterfreq 2024/2025 noted on disk |
| 23 Nov 2026 | L4 DONE: Earthdata `~/.netrc` + cookie jar; three KHM GeoTIFFs staged with ORNL sha256 match; fetch script switched to `--location-trusted` |
| 23 Nov 2026 | Phase 0 housekeeping: closed ywdp.8.1.3; only L19 MoE Forest Cover digital GIS remains HOLD. Prompts filed for elevation-check (L12 vs L13) and Step 3 L8–L11 |
| 23 Nov 2026 | Elevation-check flag (`ywdp.8.5`): L12 vs L13 on the 10 m grid, `E_L12` = 0.74 m (Pronk et al. 2024 Table 6 RMSE). Class 6: 13.09 ha caution, 65.49 ha within allowance, 288.91 ha not tested |
| 23 Nov 2026 | L19 digital GIS closed: MoE will not provide. L17 WDPA confirmed for non-commercial research use; staged at `L17/` (zip + merged gpkg, 68 polygons). `ywdp.8.8` |
| 23 Nov 2026 | Step 3 L8-L11 (`ywdp.8.6`): L8, L9, L10 (2024 and 2025) and L11 (2014-2016) on the pond grid in `L8_L11_10m/`. Classes in `L_class_10m/class_step3.tif`. Class 1 is 151,176 ha, 130,074 ha with neither corroborator. Class 2 replaces 1,144 ha of first-pass existing mangrove. |
| 23 Nov 2026 | `khm-i6e.2` first-public-share gate: matrix in `first-public-share-gate.md`. Pages NO-GO; full class/pond GO NO-GO on public remote; class 8 ± 4 open-only CONDITIONAL; case PNGs INTERNAL/DECISION; no new clearances. |
| 24 Nov 2026 | Jordan locked **P2**: public Pages; class **8 ± 4** open-cleared (`delivery/open-cleared/v0.3.0/`, `public_ready=true`); non-commercial / research confirmed (no credit/revenue-linked use); FLAG / pond / INTERNAL PNGs remain NO-GO on public remote. |
| 24 Nov 2026 | **Locate extent stock:** GMW v4.1.12 2025 coastal clip shipped to `public/change-stubs/mangrove-extent.geojson` + open-cleared `v0.3.0` context overlay (`khm-6bx`). CC BY 4.0. Condition still missing. |
| 25 Nov 2026 | Locate loss: GMW v4.1.12 1996→2025 extent differencing (Source Cooperative mirror of Zenodo 21346457, CC BY 4.0) via `build_locate_gmw_change.py`; Goldberg L4 stub demoted on Locate |
