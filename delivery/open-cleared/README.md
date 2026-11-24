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
| Geography | Clip to Cambodia L20 coastal provinces — no Viet Nam spill |

## Current

- [`v0.2.2/`](v0.2.2/) — **pinned**. v0.2.1 Phase 2 flags with GO±CAUTION clipped to L20 coastal four provinces (Viet Nam spill removed). `public_ready: false`.
- [`v0.2.1/`](v0.2.1/) — Phase 2 flags on full vectorise (pre-clip; kept for audit).
- [`v0.2.0/`](v0.2.0/) — full GO±CAUTION vectorise from `class_step3.tif` (≥ MMU 0.5 ha).
- [`v0.1.0-stub/`](v0.1.0-stub/) — sample FeatureCollection + schema (thin clone fallback).

## Build

```bash
# host with full stack:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --version v0.2.0
# thin clone / CI without raster:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub
# Phase 2 flags:
python3 intermediate/screen-build/build_phase2_legal_flags.py --source-version v0.2.0 --out-version v0.2.1
# Cambodia clip (drops Viet Nam spill near Hà Tiên):
python3 intermediate/screen-build/clip_go_caution_to_cambodia.py --source-version v0.2.1 --out-version v0.2.2
python3 intermediate/screen-build/build_phase2_legal_flags.py --source-version v0.2.2 --out-version v0.2.2
```

Beads: `khm-i6e.3.1` (full vectorise) · `khm-i6e.3` (stub + script) · `khm-i6e.2` (licence gate) · `khm-i6e.6` (Phase 2 flags).
