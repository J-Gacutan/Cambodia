# Step 3 class QA, L8-L11 (Note 3b)

Grid: class_firstpass, EPSG:32648, 10 m. Y1 and Y2 are calendar 2024 and 2025.
First matching rule wins. Classes 3, 5, 6 and 7 from the first pass are kept
unless class 1 (built-up) or class 2 (open water) matches.

Class 5 in the first pass is salt fields only. This pass also assigns class 5
where the cell was still unclassified, H is set, and L10 is crops, or L10 is
trees and C is not set. That is the rest of the Note 3b class 5 rule.

Class 4 overlap with kept 3, 5, 6 or 7 is reported and not reassigned.
No minimum-mapping-unit sieve on these classes. H and C were sieved in Step 1.
L8 percent is GHS-BUILT-S 2025, which is a modelled epoch. The 2020 observed
epoch is staged beside it and is not used in the flag.
L11 is the 2014-2016 epoch. A pixel is a flat where the classification value is 1.
Dynamic World ties take the lowest class code (Earth Engine mode).
Step 1 leftovers are L1 1996 and not H (`h_l1_only_1996_class9`). Mangrove
only before 1996 was not a separate Step 1 raster.

| Class | Name | ha |
| ---: | --- | ---: |
| 1 | stop_built_up | 151176.41 |
| 2 | stop_open_water | 744751.28 |
| 3 | existing_mangrove_conserve | 33372.31 |
| 4 | caution_tidal_flat | 8506.53 |
| 5 | caution_other_converted | 20992.61 |
| 6 | go_inactive_pond | 362.11 |
| 7 | caution_active_pond | 1484.87 |
| 8 | go_open_or_accreted | 3907.03 |
| 9 | caution_history_unproven | 58227.57 |
| 10 | stop_outside_tidal_frame | 2024380.05 |

## Overrides of the first pass

| First-pass class | Kept (ha) | Replaced by class 1 (ha) | Replaced by class 2 (ha) | Also matches class 4, kept (ha) |
| ---: | ---: | ---: | ---: | ---: |
| 3 | 33372.31 | 4.46 | 1144.30 | 62.45 |
| 5 | 25.00 | 8.06 | 0.00 | 0.24 |
| 6 | 362.11 | 5.38 | 0.00 | 5.59 |
| 7 | 1484.87 | 0.68 | 0.00 | 175.82 |

## Flags and residuals

| Metric | ha |
| --- | ---: |
| AOI | 3047160.77 |
| L10 no observation inside AOI | 0.00 |
| L11 flat inside AOI | 9610.68 |
| L3 inside AOI | 290782.75 |
| New class 5 from the L10 limb | 20967.61 |
| Class 5 and L10 crops | 355.38 |
| Class 5 and L10 trees | 20612.33 |
| Class 1 with neither L9 nor L8 | 130074.43 |
| Class 2 and WorldCover water (80) | 739019.28 |
| GHS 2025 at least 50 percent, whole AOI | 664.21 |
| Class 1 and WorldCover is not 50 | 130145.37 |
| Class 1 and GHS 2025 under 50% | 150550.75 |
| GHS or WorldCover built, L10 not built | 987.05 |
| Class 1 with L9 or L8 corroboration | 21101.98 |
| H and L10 flooded vegetation, class 10 | 4143.90 |
| H ending in class 10 | 6074.30 |
| L11 flat with no L10 observation | 0.00 |
| Step 1 leftover inside AOI | 11.25 |
| Step 1 leftover in class 9 | 9.19 |
| Step 1 leftover outside L3 | 0.00 |
| L10 count capped at 254 | 0.00 |

Built-up disagreement is a flag on `built_disagree.tif`. It does not change the class.
Class 1 is the Dynamic World modal call. Most of it has neither corroborator:
GHS-BUILT-S at the 50 percent proposal covers only a few hundred hectares on this
grid, and WorldCover class 50 is much smaller than the Dynamic World built area.
Class 2 replaces some first-pass existing mangrove where Dynamic World is water
in at least 90 percent of observations and the cell is not a flat or a pond.
Nearly all of the new class 5 is L10 trees outside C, not crops. Salt fields
remain the first-pass part of class 5, minus any class 1 override.
Class 10 is every AOI cell that matched no earlier rule, so most of the province
grid sits there. It is not a claim that those cells were assessed as tidal.
The pond-grid rectangle is fully inside the AOI, so the nodata area is zero.
