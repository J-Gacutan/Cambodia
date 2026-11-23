# Phase 0 — QGIS bridge pack

**Audience:** CI GIS (offline). **Status:** INTERNAL until licence-by-use clears ([docs/04](../../docs/04-data-and-licences.md)).  
**Bead:** `khm-i6e.1`. **Goal:** Reproduce Step 3 cases A–C without the React app.

## What’s in this pack

| Path | Role |
| --- | --- |
| [HOW-TO.md](HOW-TO.md) | Open the project, read GO / CAUTION / STOP, walk cases A–C |
| [LAYER-PATHS.md](LAYER-PATHS.md) | Expected layer paths on a full workstation + thin-clone gap |
| [cambodia-screen-phase0.qgs](cambodia-screen-phase0.qgs) | QGIS 3 project (relative paths from repo root) |
| [styles/](styles/) | Class + elevation-flag QML |
| [cases.geojson](cases.geojson) | Bookmarks A–C (WGS84 points) |
| [visualizations/](visualizations/) | Overview + cases A–C PNGs + hectare tables |

Canonical narrative (same content, product docs): [docs/03-restoration-screen.md](../../docs/03-restoration-screen.md). Method of record: [../03b-restoration-potential-screen-method.md](../03b-restoration-potential-screen-method.md).

## Product truth (do not drop)

- Class map = **physical / land-cover filter** and restoration **proxy**. Not planting permission, MoE zoning, or carbon outcome.
- **GO** = worth a field look. Never “approved.”
- Elevation-check is a **flag** (does not rewrite class). WDPA is context for later permit / STOP (legal) flags — research / non-commercial only.

## FLAG / INTERNAL

| May go in an INTERNAL CI-relay zip of this folder | Must stay off public remotes / public zips |
| --- | --- |
| This pack’s markdown, `.qgs`, `.qml`, `cases.geojson`, case PNGs | `class_step3.tif`, `elevation_check_flag_10m.tif`, other FLAG GeoTIFFs, full `inputs/screen-layers/` (~13 GB) |
| Open vectors already tracked (e.g. `L20` GeoJSON) | WDPA GeoPackage / shapefiles if terms require non-commercial / non-redistribute packaging |

Do **not** `git add` `*.tif` / `*.gpkg` / WDPA zips. Gitignore already blocks them.

## Thin clone gap (this VM / CI image)

`class_step3.tif`, `elevation_check_flag_10m.tif`, and `L17/WDPA_KHM_polygons_merged_INTERNAL.gpkg` are **absent** here (gitignored heavy stack). On a full build machine they live under `inputs/screen-layers/` as listed in [LAYER-PATHS.md](LAYER-PATHS.md). Until then:

1. Use the PNGs in [visualizations/](visualizations/) to walk cases A–C.
2. Open the `.qgs` only after staging those three layers locally — broken links are expected on a thin clone.

Follow-up bead: **`khm-i6e.9`** — stage class + elevation flag + WDPA on a full workstation (or INTERNAL zip with private raster share).

## Quick start (full stack)

1. Clone / sync Cambodia; confirm the three paths in [LAYER-PATHS.md](LAYER-PATHS.md) exist.
2. QGIS 3.28+ → Open `outputs/qgis-bridge/cambodia-screen-phase0.qgs`.
3. If styles did not load: Layer properties → Style → Load from `styles/class_step3.qml` / `styles/elevation_check_flag.qml`.
4. Zoom to bookmarks A–C (or load `cases.geojson`) and follow [HOW-TO.md](HOW-TO.md).
