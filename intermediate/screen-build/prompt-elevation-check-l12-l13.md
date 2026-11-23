# Agent prompt — elevation-check flag (L12 vs L13)

Copy everything below the line into a **fresh** agent session. Run this alone; do not also run Step 3 L8–L11 in the same session.

---

## Role

You are working in the CI Engagement repo on D11 T3 Cambodia restoration-potential screen (Note 3b). Claim beads `CI_Blue_Carbon_ASEAN-ywdp.8.5` before any edits. Use `bd` only (no TodoWrite). Project punctuation: no emojis; no em dashes in body prose.

## Goal

Implement the Note 3b **elevation-check** flag: go drops to caution where L12 surface elevation exceeds L13 highest-astronomical-tide proxy by more than L12’s vertical error. Attach as a flag layer (and optionally demote go cells on the class raster to caution) without inventing new class codes beyond Note 3b.

## Spec anchors

- Method: `CI Contract 2/D11 - Additional Associated Tasks/T3 - Cambodia blue carbon seed grant and REDD+ scoping/outputs/03b-restoration-potential-screen-method.md` (elevation-check bullet under flags; L12/L13 rows).
- Licence register: `.../intermediate/screen-build/phase-0-licence-register.md`.
- L12: `.../inputs/screen-layers/L12/` — prefer `DeltaDTM_v1_1_cambodia_coastal_clip.tif` (int16 **decimetres**, nodata -32768). PROVENANCE.txt for export notes.
- L13 HAT proxy: `.../inputs/screen-layers/L13/hat_amplitude_sum_proxy_kh.tif` (metres; amplitude-sum screening proxy, phases ignored). Method note: `L13/visualizations/l13-hat-examples.md`.
- First-pass classes (context only): `.../inputs/screen-layers/L_class_10m_firstpass/` (do not rebuild Step 1/2).
- HAT processor reference: `.../intermediate/screen-build/process_l13_hat_examples_map.py`.

## Method (required)

1. Confirm L12 units (dm → m by /10) and L13 units (m). Reproject/warp both onto one common grid (prefer the existing pond/mangrove 10 m screen grid if that is what firstpass uses; otherwise document the grid chosen).
2. State **L12 vertical error** explicitly (cite Pronk et al. 2024 / DeltaDTM docs or a documented assumption). Call it `E_L12` in metres.
3. Flag where `elev_m > hat_proxy_m + E_L12` (and elev is valid). Treat HAT proxy as MSL-relative screening ceiling; say it is not chart-datum HAT.
4. Outputs: flag GeoTIFF (byte or uint8), QA ha table (flagged vs not; intersect with class 6 GO if present), short markdown under `L13/visualizations/` or a new `intermediate/screen-build/` note, optional PNG.
5. Do not download AVISO again. Do not pull L8–L11. L19 MoE digital GIS is closed (will not be provided).

## Done when

- Flag raster + QA on disk; register/log one line; beads `ywdp.8.5` closed with paths and ha summary.
- Commit/push only if the user asked or AGENTS session-close requires it in that session.

## Out of scope

- Step 3 L8–L11 classes (`ywdp.8.6` / separate prompt).
- Replacing HAT amp-sum with multi-year predicted HAT unless CI asks.
- L15 in any release folder. L17 WDPA is cleared for non-commercial research use on this screen.
