# Open-cleared delivery bundles

Versioned **GO ± CAUTION** GeoJSON (and companions) for the MapLibre MVP.
Separate from `inputs/screen-layers/` so FLAG / INTERNAL rasters are never
copied into a shippable tree.

| Rule | Detail |
| --- | --- |
| Path | `delivery/open-cleared/<version>/` only |
| Public Pages | **P2** class **8 ± 4** only (`v0.3.0`, `public_ready=true`) |
| Nation-scale GeoTIFF | Never; vectorise ≥ MMU (0.5 ha) only |
| Product truth | Physical / land-cover proxy — GO ≠ planting permission |
| Geography | Clip to Cambodia L20 coastal provinces — no Viet Nam spill |
| FLAG | **NO-GO** on any public remote |

## Current

- [`v0.3.0/`](v0.3.0/) — **pinned for Pages**. Open-cleared class 8 ± 4; L20 clip; Ramsar context; **no** pond/VERRA geometries; `public_ready: true` (khm-i6e.2 P2, 24 Nov 2026).
- [`v0.2.2/`](v0.2.2/) — full GO±CAUTION + Phase 2 flags (INTERNAL research; `public_ready: false`).
- [`v0.2.1/`](v0.2.1/) — Phase 2 flags pre-clip.
- [`v0.2.0/`](v0.2.0/) — full vectorise from `class_step3.tif`.
- [`v0.1.0-stub/`](v0.1.0-stub/) — sample stub (thin clone fallback).

## Build

```bash
# P2 Pages package (class 8 ± 4, public_ready=true):
python3 intermediate/screen-build/build_open_cleared_go_bundle.py \
  --version v0.3.0 --open-cleared --classes 8,4
python3 intermediate/screen-build/build_phase2_legal_flags.py \
  --source-version v0.3.0 --out-version v0.3.0 --skip-project-kml
# Then restore public_ready=true if phase2 rewrote the gate (see gate log).
node scripts/write-contract.mjs v0.3.0
```

Beads: `khm-i6e.2` (P2 gate) · `khm-i6e.3` (vectorise) · `khm-i6e.5` (Pages) · `khm-i6e.6` (flags).
