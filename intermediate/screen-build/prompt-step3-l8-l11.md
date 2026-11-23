# Agent prompt — Step 3 complete (L8–L11 STOP / flat / open)

Copy everything below the line into a **fresh** agent session. Run this alone; do not also run the L12/L13 elevation-check in the same session (that is `ywdp.8.5`).

---

## Role

You are working in the CI Engagement repo on D11 T3 Cambodia restoration-potential screen (Note 3b). Claim beads `CI_Blue_Carbon_ASEAN-ywdp.8.6` before any edits. Use `bd` only (no TodoWrite). Project punctuation: no emojis; no em dashes in body prose.

## Goal

Complete Note 3b **Step 3** classes that need L8–L11: STOP built-up, STOP open water, CAUTION tidal flat, GO open/accreted, CAUTION history unproven, STOP outside tidal frame, merging with the existing first-pass class raster (classes 3/5/6/7 already assigned).

## Spec anchors

- Method: `CI Contract 2/D11 - Additional Associated Tasks/T3 - Cambodia blue carbon seed grant and REDD+ scoping/outputs/03b-restoration-potential-screen-method.md` (Step 3 table; Y1/Y2 = 2024/2025; first matching rule wins).
- First-pass already on disk: `.../inputs/screen-layers/L_class_10m_firstpass/` (`class_firstpass.tif`, `class_firstpass_qa.md`). Closed issue `ywdp.8.4` — extend, do not discard 3/5/6/7.
- Step 1: `.../inputs/screen-layers/L_mangrove_10m/`. Step 2 ponds: `.../inputs/screen-layers/L_ponds_10m/`.
- Licence register: `.../intermediate/screen-build/phase-0-licence-register.md`.
- EE (non-commercial): L8 `JRC/GHSL/P2023A/GHS_BUILT_S`; L9 `ESA/WorldCover/v200`; L10 `GOOGLE/DYNAMICWORLD/V1`; L11 `UQ/murray/Intertidal/v1_1/global_intertidal`. L16 ACA already coverage-checked if needed for context only.

## Class rules to implement (Note 3b order)

Apply **first matching rule** on the screen grid (fill only cells still unclassified / deferred from firstpass, then reconcile conflicts per Note 3b):

| Class | Name | Rule (summary) |
| ---: | --- | --- |
| 1 | STOP: built-up | L10 modal built over Y1–Y2; flag disagreement with L9 class 50 or L8 built fraction ≥50% (proposal) |
| 2 | STOP: open water | L10 water in ≥90% (proposal) of Y1–Y2 observations; not L11 flat; not Step 2 pond |
| 4 | CAUTION: tidal flat | L11 latest epoch flat; bare or water in L10 now |
| 8 | GO: open or accreted land | H and L10 bare, grass or shrub |
| 9 | CAUTION: history unproven | Not H; inside L3; pond or L10 bare/grass/shrub; Step 1 leftovers |
| 10 | STOP: outside tidal frame | All else |

Preserve first-pass **3, 5, 6, 7** unless a higher-priority STOP rule must override (document any override).

## Method (required)

1. Warp/export L8–L11 onto the same 10 m grid as `class_firstpass.tif` (UTM48N if that is the pond grid). Prefer GEE + local compile scripts under `intermediate/screen-build/`.
2. Y1/Y2 = **2024 and 2025** (frozen in the licence register).
3. Write updated class raster (new folder e.g. `L_class_10m/` or versioned under firstpass `archive/` + new outputs), QA ha table, short markdown.
4. Do not put UNEP-WCMC seagrass (L15) geometries in any release-marked folder. L17 WDPA is staged and cleared for non-commercial research use on this screen; permit/STOP legal flags are a separate step if touched at all.
5. Do not re-fetch FES/AVISO. Do not implement elevation-check here (`ywdp.8.5`). L19 MoE digital GIS is closed (will not be provided).

## Done when

- Class raster covering L8–L11 rules + QA ha table; register/log updated; beads `ywdp.8.6` closed.
- Commit/push only if the user asked or AGENTS session-close requires it in that session.

## Out of scope

- Elevation-check L12 vs L13 (`prompt-elevation-check-l12-l13.md`).
- MoE Forest Cover digital GIS (closed: will not be provided).
- Rebuilding Jiang/Clark pond footprints or Step 1 H/C from scratch.
