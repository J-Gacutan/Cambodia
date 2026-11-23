# Websearch — Cambodia coastal aquaculture pond footprint maps

**Date.** 22 November 2026. Beads `CI_Blue_Carbon_ASEAN-ku7d`.
**Need.** Pond polygons or ≤30 m rasters for Koh Kong, Preah Sihanouk, Kampot, Kep. CAP v1 (1° area grids) already held and unusable for Note 3b Step 2.

## Ranked hits

### 1. Jiang et al. Cambodia pond shapefiles (primary find)

| | |
| --- | --- |
| Product | Fine-detailed coastal aquaculture pond dataset in China and Southeast Asia from 1990 to 2020 at a 30 m resolution |
| Citation | Jiang Y, Li J, Zhang Z, Li Y. Zenodo, 14 Sep 2023, v1. DOI [10.5281/zenodo.8344132](https://doi.org/10.5281/zenodo.8344132). Method paper: *Int. J. Appl. Earth Obs. Geoinf.* 127:103654 (2024) |
| One Earth link | Jiang et al. 2025 *One Earth* 8:101149 data statement: "Coastal aquaculture ponds cover data in this study have been deposited at Zenodo (https://doi.org/10.5281/zenodo.8344132)" |
| Download | Country RAR files; Cambodia: [Cambodia.rar](https://zenodo.org/api/records/8344132/files/Cambodia.rar/content) (3.0 MB; md5 `99457631a3a1c90d787dcdedd50f9284`) |
| Geometry | Polygon shapefiles (EPSG:4326), also Albers and Web Mercator copies |
| Years | 1990, 2000, 2010, 2020 (`A_Cambodia/90|00|10|20/`) |
| Counts | 910 / 1,907 / 1,984 / 2,754 polygons |
| Bounds (2020) | 102.62–104.64 E, 10.43–12.30 N — Cambodia coast covered |
| Classes | No active / abandoned / salt-field attribute (ID only; 2020 adds GRIDCODE) |
| Licence | **U.** Zenodo record is open but has **no licence field** (API `license: null`, 22 Nov 2026). Companion feasibility layer [zenodo.11206627](https://zenodo.org/records/11206627) is CC BY 4.0; do not assume it covers the pond deposit |
| Staged | `inputs/screen-layers/L_Jiang_ponds/` |

### 2. Clark Labs / Moore Foundation Cambodia aquaculture land-cover (15 m)

| | |
| --- | --- |
| Product | Land cover and change maps, Cambodia coastal zone |
| URL | [clarku.edu aquaculture data download](https://www.clarku.edu/geospatial-analytics/aquaculture-data-download/) |
| Download | [Cambodia_Landcover_Change_Maps_1999_2014_2018_2020_2022.zip](https://clarkcga-aquaculture.s3.amazonaws.com/data/v1.0/zip/cambodia/Cambodia_Landcover_Change_Maps_1999_2014_2018_2020_2022.zip) |
| Geometry | Compressed GeoTIFF, **15 m**; classes include pond aquaculture, mangroves, other coastal wetlands, open water, other |
| Years | 1999, 2014, 2018, 2020, 2022 (versions July 2023) |
| Licence | Page text: "copyright © 2024 by Clark Labs, Clark University and is licensed under a Creative Commons Attribution 4.0 International License. You are free to use these data for **non-commercial purposes only**. All other applications require permission." |
| Status | **Staged** 22 Nov 2026 in `inputs/screen-layers/L_Clark_aquaculture/` (from `~/Downloads/`). Class 3 pond 2022 ≈ 1,844 ha. README says CC BY 4.0; page adds non-commercial. See `PROVENANCE.txt` |

### 3. Jiang feasibility / priority map (not a pond layer)

| | |
| --- | --- |
| Product | Distribution of Biophysical Feasibility of Mangrove Reforestation in China and Southeast Asia |
| DOI | [10.5281/zenodo.11206627](https://doi.org/10.5281/zenodo.11206627) |
| Licence | CC BY 4.0 (stated on record) |
| GEE viewer | https://ee-zq970919.projects.earthengine.app/view/mangrove-reforestation-priority |
| Use | Suitability scores on ponds already converted from mangrove — corroboration for GO priority, not the Step 2 pond mask |

### 4. Wang et al. global LCAP clusters (2020)

| | |
| --- | --- |
| Product | Global Landside Clustering of Aquaculture Ponds (Sentinel-2 2020) |
| DOI | [10.5281/zenodo.5643036](https://doi.org/10.5281/zenodo.5643036) |
| Geometry | ESRI shapefile by continent (`aqu_AS_ds.shp` Asia, 83 MB) |
| Licence | Zenodo open; **licence field null** (API, 22 Nov 2026) |
| Note | Cluster polygons, not single-pond footprints. Asia extract would need Cambodia clip. Lower priority than Jiang country file |

### 5. Ottinger et al. (known lead — no public file)

| | |
| --- | --- |
| Papers | Ottinger et al. 2022 *Remote Sens.* 14:153; 2025 dynamics paper; 2026 mangrove-loss driver paper |
| Data statement | 2025: "Data will be made available on request" / contact `marco.ottinger@dlr.de`. 2026: "Please contact the authors upon request about the pond data" |
| Verdict | **No data released.** Article is CC BY; that does not publish the GeoJSON |

### 6. Non-hits for footprints

| Source | Why it fails |
| --- | --- |
| CAP v1 Mendeley 10.17632/6p6ccgts6d.1 | Already held; 1° area grids only |
| ODC "Aquaculture production and consumption in Cambodia (2011)" | Province polygons with tonne attributes, not ponds. Licence unspecified |
| ODC Fisheries resource management | CFi / sanctuary / flooded forest boundaries, not ponds |
| Figshare Xu "Global Reclamation-based Aquaculture Pond Cluster Datasets" | Page states available only to manuscript editors/reviewers |

## Recommendation

1. Use **Jiang Cambodia 2020 polygons** (`L_Jiang_ponds/A_Cambodia/20/cambodia_20.shp`) as the Step 2 pond footprint layer; earlier epochs for change.
2. Ask Jiang / Yi Li (`yili@xmu.edu.cn` per One Earth lead contact) to confirm a licence in writing, or treat redistribution as blocked until then.
3. Optionally download Clark Labs Cambodia zip as a 15 m cross-check if non-commercial use is acceptable for the screen build.
4. Do not wait on Ottinger for a public download.
