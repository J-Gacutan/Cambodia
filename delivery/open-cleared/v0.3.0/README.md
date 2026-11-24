# Open-cleared GO ± CAUTION bundle `v0.3.0`

**Status:** stub=False · completeness=`full_raster_vectorised` · **public_ready=true**

Physical / land-cover suitability proxy only (open-cleared class 8 ± 4). GO = worth a field look. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome. Non-commercial / research use. Attribution: GMW, Dynamic World, Murray Global Intertidal Change, geoBoundaries (see bundle README).

## Contents

| Path | Role |
| --- | --- |
| `manifest.json` | Version, licence gate, stats |
| `layers/go-caution.geojson` | MapLibre FeatureCollection (EPSG:4326) |
| `layers/index.json` | Layer catalogue (LKA-style fields) |
| `cases/cases.json` | Case A–C bookmarks (when present) |
| `schema/feature-properties.json` | Attribute contract for MVP |

## Build

```bash
# Full stack (host with class_step3.tif):
python3 intermediate/screen-build/build_open_cleared_go_bundle.py

# Thin clone / CI without raster:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub
```

## Licence

Do **not** mark public-ready or push to public Pages until bead `khm-i6e.2`
clears FLAG inheritance for this derivative. Bundle stays INTERNAL / gated.

## Notes

- Vectorised from inputs/screen-layers/L_class_10m/class_step3.tif with MMU 0.5 ha (50 px).
- Classes included: [4, 8].
- Clipped to L20 coastal four provinces (Cambodia only).
- P2 open-cleared (khm-i6e.2, 24 Nov 2026): class 8 ± 4 only; no pond/FLAG geometries.
- public_ready=true for public GitHub Pages (non-commercial / research).
- Cases A and C only (class 8 / 4). Case B omitted (class 2 / pond-shaped).
