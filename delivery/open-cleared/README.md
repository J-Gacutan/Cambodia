# Open-cleared delivery bundles

Versioned **GO ± CAUTION** GeoJSON (and companions) for the MapLibre MVP.
Separate from `inputs/screen-layers/` so FLAG / INTERNAL rasters are never
copied into a shippable tree.

| Rule | Detail |
| --- | --- |
| Path | `delivery/open-cleared/<version>/` only |
| Public Pages | **Not** until bead `khm-i6e.2` clears FLAG inheritance |
| Nation-scale GeoTIFF | Never; vectorise ≥ MMU (0.5 ha) only |
| Product truth | Physical / land-cover proxy — GO ≠ planting permission |

## Current

- [`v0.1.0-stub/`](v0.1.0-stub/) — sample FeatureCollection + schema (thin clone; no `class_step3.tif`).

## Build

```bash
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub
# host with full stack:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --version v0.2.0
```

Beads: `khm-i6e.3` (this bundle) · `khm-i6e.2` (licence gate) · follow-up for full-stack host run.
