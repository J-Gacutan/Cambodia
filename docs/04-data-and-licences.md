# Module — Data and licences

Prerequisites: [01-overview.md](01-overview.md); living register below. Status: [../README.md](../README.md).

Authoritative living register: [../intermediate/screen-build/phase-0-licence-register.md](../intermediate/screen-build/phase-0-licence-register.md).  
Click-list of download links: [../intermediate/screen-build/phase-0-downloads.md](../intermediate/screen-build/phase-0-downloads.md).  
Method table (IDs **L1–L21**): [../outputs/03b-restoration-potential-screen-method.md](../outputs/03b-restoration-potential-screen-method.md) §3.  
**First public share go/no-go matrix:** [../intermediate/screen-build/first-public-share-gate.md](../intermediate/screen-build/first-public-share-gate.md) (`khm-i6e.2`).

This module does not duplicate the register. It states how to use it and where files live so a migrated tree remains operable.

## Staging root

`inputs/screen-layers/` held about **13 GB** on disk on 23 Nov 2026 (will grow). Layout:

```text
inputs/screen-layers/
  L1/ L2/ L3/ …          # upstream products (by Note 3b ID) when staged as files
  L_Jiang_ponds/         # alternate pond polygons
  L_Clark_aquaculture/   # Clark land-cover / change (FLAG)
  L_Peng/                # seagrass (Peng)
  L_ponds_10m/           # derived pond stack + QA
  L_mangrove_10m/        # Step 1 H/C + QA
  L_class_10m*/          # Step 3 class rasters + QA
  L8_L11_10m/            # GEE exports used in Step 3
```

**GEE-only / no staging folder (typical):** L6, L7, L9, L10, L11, L16 (and L21 as imagery labels only). Confirm against Note 3b §3 and the register before treating an ID as missing.

Keep new layers in a named subfolder with a short `PROVENANCE.txt` (URL, date, licence line, SHA if available). Point the licence register at that path.

## V / U / FLAG

| Mark | Meaning |
| --- | --- |
| V | Licence re-read at the source URL on the date in the register |
| U | Unconfirmed (do not treat as cleared) |
| FLAG | Redistribution or commercial use restricted |

**Inheritance.** Any raster, table or figure derived from a FLAG layer carries that restriction until cleared. "Open-only derivatives" means products built only from layers whose licences allow the intended release.

### Licence by use (short)

| Intended use | Rule |
| --- | --- |
| Internal research screen (this build) | FLAG layers OK only as the register allows for non-commercial research |
| Relay to CI Cambodia / CI Blue Climate | Clear FLAG rows for that share; prefer method + open-only tables; do not send FLAG geometries without clearance |
| Seed-grant / Phase 1 funded build | Re-check register; grant-funded work is not automatically "research" |
| Credit project design or revenue-linked screening | Different licence path (Note 3b §8); free Earth Engine tier excludes commercial work |

Earth Engine and Google Earth imagery have their own non-commercial / no-redistribute terms. Treat exports as INTERNAL unless the catalogue licence clearly allows the intended release.

FLAG examples to clear against the register before any share: Clark aquaculture (non-commercial rider), L15 UNEP-WCMC seagrass, L17 WDPA (research OK; commercial / revenue-linked restricted), L21 Google Earth labels.

Jiang pond polygons remain **U** (Zenodo licence null) — HOLD redistribute until authors confirm. `L_ponds_10m` and Step 3 classes **6–7** (and the salt limb of class 5) inherit Jiang HOLD + Clark FLAG.

### First public share (Pages / MVP)

| Channel | Gate (23 Nov 2026) |
| --- | --- |
| Public GitHub Pages | **NO-GO** until Jordan chooses an open-cleared path (**P2**) and an open-only bundle exists |
| Private host (Amplify / CF Access) or CI relay | **DECISION** — not a public bypass; FLAG still offline on public remotes |
| Full `class_step3` / pond GO GeoJSON | **NO-GO** on Pages (FLAG inheritance) |
| Open-only GO class 8 ± CAUTION class 4 (≥0.5 ha MMU) | **CONDITIONAL** — candidate after rebuild/extract; needs Jordan P2 |
| Case PNGs (overview + A–C) | **NO-GO** on Pages until licence-by-use or open-only re-render |
| Method notes (`outputs/03b`, how-to) | **DECISION** — INTERNAL until Jordan sign-off; no FLAG geometries in the text |

Do not invent clearances. Matrix, share-path IDs (P0–P4), and Jordan checklist: [../intermediate/screen-build/first-public-share-gate.md](../intermediate/screen-build/first-public-share-gate.md).

## Known closed doors

- **L19 MoE Forest Cover 2018 digital GIS:** will not be provided (23 Nov 2026). Booklet PDF may remain as reference only. Do not chase NFMS as a substitute without a new decision.
- **L5 CAP (Mendeley):** 1° grids only in the download used; unusable for pond footprints. Jiang / Clark paths replace for Step 2.

## Migration note

On move: separate the git-tracked tree from the ~13 GB data. Options: disk/object storage + fetch scripts; or Git LFS on a **private** remote that may hold FLAG layers. Never push FLAG / INTERNAL layers to a public remote. See [07-migration.md](07-migration.md).
