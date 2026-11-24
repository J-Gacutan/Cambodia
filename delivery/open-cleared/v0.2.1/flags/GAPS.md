# Phase 2 flag gaps (`khm-i6e.6`)

Built: 2026-11-23T07:02:12Z

## What shipped (without inventing clearances)

| Flag | Status in this bundle | Source used |
| --- | --- | --- |
| **permit_gate** | Partial — boolean when a known PA/Ramsar polygon hits; **null** when WDPA absent (do not invent “clear”) | L17 WDPA gpkg when present (**absent on this host**); L18 Ramsar polygons (3 coastal-usable inland sites only) |
| **STOP (legal)** | **Unavailable** (`stop_legal=null`, `stop_legal_status=unavailable`) | MoE core-zone GIS not provided (L19 digital GIS closed). Instrument cited only: ENR Code Art. 364 |
| **project_overlap** | Partial — Southern Cardamom REDD+ (VCS 1748) when KML present (5544 rings parsed) | `inputs/vcs-1748-southern-cardamom-boundary.kml`. Mangrove REDD+ / VCS 5071 **not staged** |
| **elevation_check** | Not burned into GO attributes here | Raster already on disk (`L13/elevation_check_flag_10m.tif`); wire in a later pass if needed |

### Counts (this run)

```
{
  "features": 10503,
  "permit_gate_true": 0,
  "permit_gate_null": 10503,
  "permit_gate_false": 0,
  "project_overlap_true": 115,
  "project_overlap_false": 10388,
  "project_overlap_null": 0,
  "stop_legal_null": 10503
}
```

## Explicit gaps (block full Note 3 gate-2)

1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be pushed to a public remote. On thin/cloud clones the merged gpkg is gitignored/absent; re-run this script on the workstation with `WDPA_KHM_polygons_merged_INTERNAL.gpkg`.
2. **Koh Kapik Ramsar (998)** — RSIS publishes centroid only; no polygon for coastal permit intersection.
3. **CFi / CPA / MFMA boundaries** — not staged; permit_gate cannot name GDF vs MoE completely.
4. **MoE protected-area core zones** — required for STOP (legal); do **not** proxy with IUCN category alone.
5. **Mangrove REDD+ and VCS 5071** — named in Note 3b / CI Cambodia 2026; polygons not in-repo.
6. **`public_ready`** — remains false until `khm-i6e.2` (licence gate). Derived WDPA attributes stay research/INTERNAL.

## Product language (UI must keep)

Flags **cite instruments and overlaps**. They never mean a site is approved or refused for planting, tenure, or carbon.
