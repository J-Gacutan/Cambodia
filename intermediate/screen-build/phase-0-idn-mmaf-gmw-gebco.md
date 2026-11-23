# Phase 0 — GMW and GEBCO records from idn-mmaf / IND-MSP

Checked 22 Nov 2026 against `idn-mmaf-reporting` and the IND-MSP carry-over (files moved 9 Oct 2026).

## GMW v4.1.12

| Record | Where |
| --- | --- |
| Zenodo 21346457, CC BY 4.0, README / API text | `IND-MSP/.../ref/txt/gmw-v4112-zenodo.txt`, `gmw-v4112-zenodo-api.txt` |
| Bundle citation (v3 URL; stack is v4.1.12 on disk) | `idn-mmaf-reporting/pipeline/build_bundle.py` (~line 1016, zenodo.org/records/6894273 for v3) |
| Full stack tar (1.3 GB) | `IND-MSP/.../ref/geo/gmw-v4112/gmw_mng_ext_v4112_stack.tar.gz` |
| STAC cache (v3) | `idn-mmaf-reporting/pipeline/.cache/gmw_v3_stac.parquet` |

**Reuse for Cambodia.** Five coastal tiles extracted into `inputs/screen-layers/L1/gmw_mng_ext_v4112_stack/`: N11E103, N11E104, N12E102, N12E103, N13E102. Metadata on N11E103: 41 bands (1985–2025), EPSG:4326, ~0.0002695° (~29 m at 11.5 N). Resolution U in Note 3b can be cleared to ~30 m for the annual stack.

Existing extracted Indonesia tiles in IND-MSP do not cover Cambodia; the tar does.

## GEBCO_2026

| Record | Where |
| --- | --- |
| Licence verified public domain | `idn-mmaf-reporting/docs/research/sasamba-data-sources-2026-09-24.md` (terms URL checked 24 Sep 2026) |
| Demak / Sasamba subsets only | `IND-MSP/.../ref/geo/gebco2026_*.tif`, `.../demak/gebco2026_download/` |
| Access note | `download.gebco.net` was down 23 Oct 2026; CEDA mirror used then. Site returned 200 on 22 Nov 2026 (JS app; no static form). Terms PDF staged to `inputs/screen-layers/L14/` |

**No Cambodia subset on disk.** Need a fresh subset from https://download.gebco.net/ for about W 102.5–E 105.2, S 9.8–N 12.3 (bathymetry + TID), or a window from a global CEDA GeoTIFF if the subsetter fails.

## Peng seagrass (added this session)

Not in idn-mmaf. Zenodo 18612240, CC BY 4.0. Cambodia coast is one tile `-0000851968-0003145728` for both periods, staged under `inputs/screen-layers/L_Peng/`. Use for the restricted seagrass analogue alongside L15/L16; CC BY so releasable (unlike UNEP-WCMC L15).
