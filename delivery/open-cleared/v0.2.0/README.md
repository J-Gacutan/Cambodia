# Open-cleared GO ± CAUTION bundle `v0.2.0`

**Status:** stub=False · completeness=`full_raster_vectorised` · **public_ready=false**

Physical / land-cover suitability proxy only. GO = worth a field look. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome.

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
- GO classes 6/8; CAUTION 4/5/7/9 included.
- public_ready remains false until khm-i6e.2.
