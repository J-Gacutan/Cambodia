# Open-cleared GO ± CAUTION bundle `v0.3.0`

**Status:** stub=False · completeness=`full_raster_vectorised` · **public_ready=true**

Land-cover screen for four coastal provinces. GO = worth a field look. CAUTION paints tide flats, converted land, active ponds, and height fails. Not ministry zoning, land rights, planting permission, or a carbon score. Non-commercial / research use.

## Contents

| Path | Role |
| --- | --- |
| `manifest.json` | Version, licence gate, stats |
| `layers/go-caution.geojson` | MapLibre FeatureCollection (EPSG:4326) |
| `layers/index.json` | Layer catalogue |
| `cases/cases.json` | Case A–C bookmarks (when present) |
| `schema/feature-properties.json` | Attribute contract for MVP |

## Build

```bash
# Full stack (host with class_step3.tif):
python3 intermediate/screen-build/build_open_cleared_go_bundle.py

# Add converted + elevation (then ponds):
python3 intermediate/screen-build/enrich_open_cleared_holdbacks.py
python3 intermediate/screen-build/enrich_open_cleared_ponds.py

# Thin clone / CI without raster:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub
```

## Licence

Research / non-commercial. Pond **source rasters** stay offline; screened class 7 polygons ship in `go-caution.geojson` only. Do not copy FLAG GeoTIFFs into this tree.

## Notes

- Vectorised from `inputs/screen-layers/L_class_10m/class_step3.tif` with MMU 0.5 ha (50 px).
- Classes included: **4, 5, 7, 8** (tide, converted, active pond, open land).
- Clipped to L20 coastal four provinces (Cambodia only).
- public_ready=true for public GitHub Pages (non-commercial / research).
- Cases A and C only (open land / tide). Case B omitted.
