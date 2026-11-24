# MoE core zones — STOP(legal) blocker (`khm-i6e.6.2`)

**Date.** 23 Nov 2026.  
**Bead.** `khm-i6e.6.2` — MoE core zones for STOP(legal).  
**Verdict.** **Blocked.** Do not invent STOP(legal) geometries or clearances.

## What STOP(legal) needs

Note 3b / Note 3 gate-2: a mapped **protected-area core zone** under Environment and Natural Resources Code **Art. 364** (2008 PA Law abrogated by Art. 864). The attribute must be:

- `true` only when a feature intersects a **MoE-mapped core zone**;
- `null` / `stop_legal_status=unavailable` when that GIS is absent;
- never `false` as a fake “clear” from missing data;
- never inferred from WDPA IUCN category alone.

## Evidence that source data is missing

| Sought | Status |
| --- | --- |
| MoE protected-area **core-zone** GIS | **Not in-repo.** No MoE zoning polygons staged under `inputs/screen-layers/` or elsewhere. |
| L19 MoE Forest Cover 2018 digital GIS | **Closed 23 Nov 2026** (`ywdp.8.8`): MoE will not provide. Booklet only at `inputs/screen-layers/L19/Cambodia_Forest_Cover_2018_En.pdf`. |
| L19 as substitute for core zones | **Forbidden.** Forest cover ≠ PA core-zone zoning. Licence register: do not label SERVIR/GLAD as MoE. |
| WDPA (L17) as STOP proxy | **Forbidden.** WDPA supports `permit_gate` only (`khm-i6e.6.1`). IUCN category ≠ ENR Art. 364 core zone. |

Register / lock cross-refs:

- `intermediate/screen-build/phase-0-licence-register.md` § L19
- `intermediate/screen-build/SESSION-LOCK.md` (ywdp.8.8 closed)
- Bundle: `delivery/open-cleared/v0.2.1/flags/GAPS.md` gap 4

## Bundle posture (unchanged)

In `delivery/open-cleared/v0.2.1/`:

- all features: `stop_legal=null`, `stop_legal_status=unavailable`
- `public_ready=false` (also blocked on `khm-i6e.2`)
- instrument citation only: ENR Code Art. 364

## Unblock criteria

Provide MoE (or MoE-authorised) **mapped protected-area core-zone** polygons with a usable research licence path. Then re-run `build_phase2_legal_flags.py` with that layer wired — still without inventing clearances — and refresh GAPS / coverage.

Until then: leave `khm-i6e.6.2` closed as **blocked with evidence**; do not ship synthetic STOP(legal).
