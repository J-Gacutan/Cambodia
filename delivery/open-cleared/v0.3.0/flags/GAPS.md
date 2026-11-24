# Phase 2 flag gaps (`khm-i6e.6`)

Built: 2026-11-24T00:53:20Z

## What shipped (without inventing clearances)

| Flag | Status in this bundle | Source used |
| --- | --- | --- |
| **permit_gate** | Partial — boolean when a known PA/Ramsar polygon hits; **null** when WDPA absent (do not invent “clear”) | L17 WDPA gpkg when present (yes, n≈128; bead `khm-i6e.6.1`); L18 Ramsar polygons (3 coastal-usable inland sites only) |
| **STOP (legal)** | **Unavailable** (`stop_legal=null`, `stop_legal_status=unavailable`) | MoE protected-area **core-zone** GIS not provided (`khm-i6e.6.2`). L19 Forest Cover digital GIS closed and is **not** a substitute. Instrument cited only: ENR Code Art. 364 |
| **project_overlap** | Partial — staged Verra boundaries joined on go-caution | Staged VCS 1748 / 5071 / 5584 overlays + attribute join. VCS 5071 Koh Kong ARR portion (if any) not in registry KML — not invented. Non-commercial research overlays (`redistributable=false`) |
| **elevation_check** | Live on go-caution — `elevation_fail` joined; GO demoted to CAUTION paint when flag=1 | `L13/elevation_check_flag_10m.tif` (DeltaDTM vs FES2022). Class 5 converted open limb also painted; class 7 ponds stay off public |

### Counts (this run)

```
{
  "features": 1491,
  "permit_gate_true": 805,
  "permit_gate_null": 0,
  "permit_gate_false": 686,
  "project_overlap_true": 0,
  "project_overlap_false": 0,
  "project_overlap_null": 1491,
  "stop_legal_null": 1491,
  "project_overlap_by_id": {}
}
```

## Explicit gaps (block full Note 3 gate-2)

1. **WDPA geometries** — coastal-clip overlay ships as non-commercial research (`redistributable=false`); full gpkg stays under inputs. Derived `permit_gate` attributes joined on the workstation (`khm-i6e.6.1`; n≈128 polygons). Thin/cloud clones without the gitignored gpkg still get `permit_gate=null` until re-run locally (or use `--preserve-permit-gate` on a bundle that already carries WDPA-joined attributes).
2. **Koh Kapik Ramsar (998)** — RSIS publishes centroid only; no polygon for coastal permit intersection.
3. **CFi / CPA / MFMA boundaries** — not staged; permit_gate cannot name GDF vs MoE completely.
4. **MoE protected-area core zones** (`khm-i6e.6.2`) — required for STOP (legal); blocked until MoE provides mapped core zones. Do **not** proxy with IUCN category or L19 Forest Cover.
5. **VCS 5071 Koh Kong ARR geometry** — registry document is `Kep, Kampot.kml` only; any Trend Tech Koh Kong ARR extent remains unstaged (do not invent).
6. **`public_ready`** — open-cleared v0.3.0 is true under `khm-i6e.2`. WDPA coastal + VERRA overlays ship as non-commercial research (`redistributable=false`); FLAG rasters and case PNGs stay off Pages.


7. **Locate condition** — no licence-clear mangrove condition / canopy / degradation product on the public console (Note 3b: degradation not mapped). Extent stock ships as GMW 2025 overlay (`mangrove-extent`).

## Product language (UI must keep)

Flags **cite instruments and overlaps**. They never mean a site is approved or refused for planting, tenure, or carbon.
