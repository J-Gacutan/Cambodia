# Phase 2 flag gaps (`khm-i6e.6`)

Built: 2026-11-24T00:44:46Z

## What shipped (without inventing clearances)

| Flag | Status in this bundle | Source used |
| --- | --- | --- |
| **permit_gate** | Partial — boolean when a known PA/Ramsar polygon hits; **null** when WDPA absent (do not invent “clear”) | L17 WDPA gpkg when present (yes, n≈128; bead `khm-i6e.6.1`); L18 Ramsar polygons (3 coastal-usable inland sites only) |
| **STOP (legal)** | **Unavailable** (`stop_legal=null`, `stop_legal_status=unavailable`) | MoE protected-area **core-zone** GIS not provided (`khm-i6e.6.2`). L19 Forest Cover digital GIS closed and is **not** a substitute. Instrument cited only: ENR Code Art. 364 |
| **project_overlap** | Partial — staged Verra boundaries (5621 rings across projects) | Staged: vcs-1748-southern-cardamom, vcs-5071-mangrove-arr, vcs-5584-krasop-mangrove-redd. See `inputs/vcs-5071-5584-PROVENANCE.txt`. VCS 5071 Koh Kong ARR portion (if any) not in registry KML — not invented |
| **elevation_check** | Not burned into GO attributes here | Raster already on disk (`L13/elevation_check_flag_10m.tif`); wire in a later pass if needed |

### Counts (this run)

```
{
  "features": 10158,
  "permit_gate_true": 4804,
  "permit_gate_null": 0,
  "permit_gate_false": 5354,
  "project_overlap_true": 1041,
  "project_overlap_false": 9117,
  "project_overlap_null": 0,
  "stop_legal_null": 10158,
  "project_overlap_by_id": {
    "vcs-1748-southern-cardamom": 115,
    "vcs-5071-mangrove-arr": 93,
    "vcs-5584-krasop-mangrove-redd": 833
  }
}
```

## Explicit gaps (block full Note 3 gate-2)

1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be pushed to a public remote. Derived `permit_gate` attributes joined on the workstation (`khm-i6e.6.1`; n≈128 polygons). Thin/cloud clones without the gitignored gpkg still get `permit_gate=null` until re-run locally (or use `--preserve-permit-gate` on a bundle that already carries WDPA-joined attributes).
2. **Koh Kapik Ramsar (998)** — RSIS publishes centroid only; no polygon for coastal permit intersection.
3. **CFi / CPA / MFMA boundaries** — not staged; permit_gate cannot name GDF vs MoE completely.
4. **MoE protected-area core zones** (`khm-i6e.6.2`) — required for STOP (legal); blocked until MoE provides mapped core zones. Do **not** proxy with IUCN category or L19 Forest Cover.
5. **VCS 5071 Koh Kong ARR geometry** — registry document is `Kep, Kampot.kml` only; any Trend Tech Koh Kong ARR extent remains unstaged (do not invent).
6. **`public_ready`** — remains false until `khm-i6e.2` (licence gate). Derived WDPA attributes and project-boundary overlays stay research/INTERNAL.

## Product language (UI must keep)

Flags **cite instruments and overlaps**. They never mean a site is approved or refused for planting, tenure, or carbon.
