# Agent prompt — L13 FES2022 HAT examples and coastal map

Copy everything below the line into a fresh agent session. Do not invent chart-datum HAT; use the amplitude-sum proxy unless CI asks for a multi-year predicted HAT.

---

## Role

You are working in the CI Engagement repo on D11 T3 Cambodia restoration-potential screen (Note 3b). Claim beads issue `CI_Blue_Carbon_ASEAN-ywdp.8.1.4` if it is open; if closed, create a child under `CI_Blue_Carbon_ASEAN-ywdp.8.1` only for genuine follow-on (e.g. elevation-check flag), then claim it. Do not use TodoWrite.

## Goal

Produce Cambodia coastal **HAT screening products** from staged FES2022 extrapolated heights for the Note 3b elevation-check flag: site examples, a coastal GeoTIFF, map PNG, short method note.

## Spec anchors

- Method note: `CI Contract 2/D11 - Additional Associated Tasks/T3 - Cambodia blue carbon seed grant and REDD+ scoping/outputs/03b-restoration-potential-screen-method.md` (L13 row; elevation-check flag: go drops to caution where L12 exceeds HAT by more than L12 vertical error).
- Licence register: `.../intermediate/screen-build/phase-0-licence-register.md` (L13).
- Existing processor (prefer extend, do not rewrite cold): `.../intermediate/screen-build/process_l13_hat_examples_map.py`.
- Raw model tree: `.../inputs/screen-layers/L13/pytmd/fes2022b/ocean_tide_extrapolated/*.nc` (heights only; no currents).
- AVISO Licence Issue 20: heights/loading OK for this research use; do not download currents.

## Method (required)

1. Confirm raw nc only before processing; do not treat amplitude-sum as chart HAT.
2. **HAT amplitude-sum proxy:** sum of all FES2022 constituent amplitudes (metres) over box **W 102.5–E 105.2, S 9.8–N 12.3**. Conservative screening ceiling (coincident peaks); say so in the note.
3. Also report **mean spring range proxy** `2 × (M2 + S2)` at example sites.
4. Example sites (lon, lat): Koh Kong / Peam Krasop (103.05, 11.45); Sihanoukville Bay (103.55, 10.62); Kep (104.32, 10.48); Koh Rong approaches (103.30, 10.70); Kampot coast (104.18, 10.60).
5. Optional short illustrative time series at Sihanoukville from major constituents only; label as illustrative, no nodal corrections.
6. Writing style: no emojis; no em dashes in body prose (project punctuation rules).

## Outputs (paths)

Under `.../inputs/screen-layers/L13/`:

- `hat_amplitude_sum_proxy_kh.tif`
- `visualizations/hat_proxy_map.png`
- `visualizations/examples_timeseries.png` (if built)
- `visualizations/l13-hat-examples.md` (method, site table, figure paths, grid range)
- Update `PROVENANCE.txt` Action / staged products; log a line in the licence register.

## Done when

- Site table + HAT proxy GeoTIFF + map PNG on disk.
- Method note states amplitude-sum is a proxy, not chart-datum HAT.
- Beads issue closed with paths and one-line ha/range summary; `git` commit/push only if the user asked (user commit rule) or repo AGENTS session-close applies in that session.

## Already on disk (23 Nov 2026)

If these exist and match the method above, **do not rebuild**; verify then move to optional follow-on:

- `hat_amplitude_sum_proxy_kh.tif`
- `visualizations/l13-hat-examples.md` (sites ~0.70–1.03 m; box 0.00–1.26 m, median 0.73 m)
- Script `process_l13_hat_examples_map.py`

## Optional follow-on (separate issues / prompts)

- Elevation-check: beads `CI_Blue_Carbon_ASEAN-ywdp.8.5` — prompt `prompt-elevation-check-l12-l13.md`.
- Step 3 L8–L11: beads `CI_Blue_Carbon_ASEAN-ywdp.8.6` — prompt `prompt-step3-l8-l11.md`.

## Out of scope

- L19 MoE digital GIS (closed: will not be provided).
- Re-downloading FES currents.
- Replacing Step 1 H/C (`L_mangrove_10m/`, already built) or Step 3 firstpass unless asked.
