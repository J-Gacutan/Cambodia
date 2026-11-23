# Note 3b — Cambodia restoration-potential screen: method spec and data list

**Bottom line.** A restoration-potential screen for Cambodia's four coastal provinces can be built from open data in about 59 person-days (estimate), as Seed Fund Phase 1. It overlays Global Mangrove Watch (GMW) change since 1996 with pond, built-up, land-cover, tidal-flat, elevation and protected-area layers into go, caution or stop classes with a permit-gate flag. Class areas and loss years are structured so they can feed a provincial System of Environmental-Economic Accounting (SEEA) Ecosystem Accounting (EA) extent account and a GOAP-style ocean account later; the screen itself is not a compiled account. Whether open imagery can tell active from abandoned ponds here is untested; the build tests it first, with a reduced fallback. One input unconfirmed; licence terms limit release.

**Status.** Evidence 22 November 2026. Internal note; companion to Notes 2 and 3. Gates: verify, red team, director; licences under ywdp.9. Conservation International (CI) Cambodia June 2026 report (printed pages). No map built. SEEA EA / ocean-accounts framing added 22 November 2026 (consultation edition of GOAP Technical Guidance closed 13 November 2026; not adopted guidance).

## 1. Purpose and precedents

The screen is the first pre-feasibility filter in [Note 3](03-blue-carbon-project-selection-feasibility-framework.md): where is restorable former mangrove, and what on the map blocks it?

- **Indonesia's national mangrove map** — the Peta Mangrove Nasional 2021 of the Ministry of Environment and Forestry (KLHK), visually interpreted from SPOT 6/7 and Sentinel imagery at 1:25,000 to 1:50,000 under standard SNI 7717-2020. Beside 3,364,080 ha of mangrove it mapped 756,183 ha of potential habitat (suited to mangrove, none now), typed by current cover; ponds were 631,802 ha, 83.55 per cent (KLHK launch page, archive copy of 6 August 2025). Cambodia takes the typing.
- **The Mangrove Restoration Potential (MRP) Map** — Worthington and Spalding (2018 report, pp.4-6) took GMW loss since 1996 minus urban and non-tidal open water; its scores "do not account for ... physical modification of the site, or legal and land tenure challenges". Cambodia takes the subtraction and the limit.
- **The GMW restoration-potential layer** — "not currently available" (Global Mangrove Alliance GMW 4.1 launch page); a cross-check if released.
- **SEEA EA and ocean accounts** — Note 2 already points to SEEA EA extent, condition and services accounts for non-carbon finance where carbon volumes are small, and to a Track B provincial SEEA pilot. This screen is the spatial stock-and-change input for that pilot's mangrove (and, later, seagrass) extent tables: opening stock (class 3), reductions to converted uses (classes 1, 5–7), potential additions through restoration (classes 6, 8, 9), and exclusions outside the tidal frame (class 10). It does not compile physical or monetary services, nor a condition account beyond the elevation and tidal-frame flags. Ocean accounts, as set out in the Global Ocean Accounts Partnership (GOAP) Technical Guidance on Ocean Accounting (consultation edition; [about](https://guidance.oceanaccounts.org/technical-guidance/about/)), interpret the 2025 System of National Accounts, the SEEA Central Framework and SEEA EA for the ocean; nothing on that site is adopted GOAP guidance. GOAP's Spatial Data Framework ([SDF resources](https://oceanaccounts.org/sdf/#resources)) is optional later infrastructure for provenance-traced reporting that already lists GMW and similar global layers as inputs; Phase 0 here stages the same family of layers without adopting the SDF stack.

Jiang et al. (2025, *One Earth* 8:101149) supply the pond logic (coastal plain under 10 m; inundation above 25 per cent).

### 1.1 SEEA EA crosswalk (extent only)

| Screen class (section 4) | SEEA EA extent reading (proposal) | Ocean-accounts use |
| --- | --- | --- |
| 3 Existing mangrove: conserve | Opening mangrove extent (stock) | Mangrove extent indicator; conservation priority |
| 1 STOP: built-up; 2 STOP: open water | Reductions / conversions out of mangrove ecosystem type | Explain why restoration is blocked |
| 6 GO: inactive pond; 8 GO: open or accreted land | Potential additions to mangrove extent if restored | Shortlist for restoration and seed-grant sites |
| 5 CAUTION: other converted; 7 CAUTION: active pond; 9 CAUTION: history unproven | Contested or incomplete transitions; need field or tenure check before booking a change | Caution in any account or finance claim |
| 4 CAUTION: tidal flat | Adjacent intertidal ecosystem, not planting target | Separate extent type; hydrology check first |
| 10 STOP: outside tidal frame | Outside mangrove ecosystem accounting area | Boundary of the coastal account |
| Permit / STOP (legal) / project-overlap flags | Institutional overlays, not ecosystem types | Access and double-counting controls |
| Section 5 seagrass analogue | Incomplete seagrass extent (known / documented loss / no data) | Data-gap row until a survey baseline exists (Note 2 Track B) |

## 2. Extent, grid and dates

- **Land** — Koh Kong, Preah Sihanouk, Kampot and Kep (L20), under 10 m elevation, within the habitat mask, mangrove in any year, ponds and flats.
- **Sea** — to the 10 m depth contour (L14; proposal), for the seagrass analogue only.
- **Grid** — 10 m, nearest-neighbour resampling. Minimum mapping unit 0.5 ha, from Cambodia's forest definition (second Forest Reference Level, 2021, PDF p.15).
- **Y1 and Y2** — the two latest full calendar years. "Now" means L10 over Y1-Y2; L8 and L9 only corroborate.
- **Baseline 1996** — the first GMW v3 epoch and the MRP Map's base year. GMW v4.1.12 starts in 1985, but its pre-2000 layers are infilled, "particularly in the 1990s and 1980s", so v3 anchors 1996.

## 3. Data list

V = licence re-read at the URL (20 or 22 November 2026; verify log `../intermediate/path-d-verify.md`); U = not confirmed. **FLAG** = licence restricts redistribution or commercial use.

| ID | Layer | Product and version | Resolution | Time span | Licence and URL | Flag | V/U |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | Mangrove change | GMW Timeseries of Mangrove Extent v4.1.12 (13 Jul 2026) | Not stated | Annual 1985-2025 | CC BY 4.0, <https://zenodo.org/records/21346457> | None | V (resolution U) |
| L2 | 1996 baseline | GMW v3.0 (2022) | Not stated | 11 epochs, 1996-2020 | CC BY 4.0, <https://zenodo.org/records/6894273> | Superseded by v4.1 | V |
| L3 | Habitat envelope | GMW Mangrove Habitat Mask v28 (Dec 2025) | Vector | Static | CC BY 4.0, <https://zenodo.org/records/17989832> | None | V |
| L4 | Loss drivers | Goldberg et al. Mangrove Loss Drivers v1, ORNL DAAC 1768 | About 30 m | 2000-2016 | CC BY 4.0 (authors); US government works, <https://doi.org/10.3334/ORNLDAAC/1768> | None | V |
| L5 | Aquaculture ponds over time | Global coastal aquaculture pond (CAP) dataset v1, Mendeley (Sep 2026) | Not stated | 1990, 2000, 2010, 2020 | CC BY 4.0, <https://data.mendeley.com/datasets/6p6ccgts6d/1> | None | V |
| L6 | Water frequency, pond state | Copernicus Sentinel-1 GRD and Sentinel-2 L2A | 10 m | Sentinel-2 L2A from 2017 | Free, full and open licence, <https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice> | None | V |
| L7 | Historic labels | Landsat 5 TM Collection 2 Level 2 | 30 m | 1984-2012 | Public domain, <https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LT05_C02_T1_L2> | None | V |
| L8 | Built-up over time | GHS-BUILT-S R2023A | 100 m | 1975-2030; after 2020 modelled | JRC licence: reuse with acknowledgement, <https://developers.google.com/earth-engine/datasets/catalog/JRC_GHSL_P2023A_GHS_BUILT_S> | None | V |
| L9 | Land cover, 2021 | ESA WorldCover v200 | 10 m | 2021 | CC BY 4.0, <https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200> | None | V |
| L10 | Land cover, now | Dynamic World V1 | 10 m | 2015-present | CC BY 4.0, <https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1> | None | V |
| L11 | Tidal flats | Murray Global Intertidal Change v1.1 | 30 m | 1984-2016; latest epoch 2014-2016 | CC BY 4.0, cite paper, <https://developers.google.com/earth-engine/datasets/catalog/UQ_murray_Intertidal_v1_1_global_intertidal> | None | V |
| L12 | Elevation, bare earth | DeltaDTM v1.1 (Dec 2024), from Copernicus DEM GLO-30 | 30 m | GLO-30 data 2010-2015 | CC BY 4.0, <https://data.4tu.nl/datasets/1da2e70f-6c4d-4b03-86bd-b53e789cc629>; GLO-30 notice also applies | None | V |
| L13 | Tidal range | FES2022 tide model (AVISO) | 1/30° | n/a | AVISO Licence Issue 20: heights/loading all uses; currents non-commercial, <https://www.aviso.altimetry.fr/en/data/products/auxiliary-products/global-tide-fes.html>; TPXO non-commercial | None | V |
| L14 | Bathymetry | GEBCO_2026 Grid | 15 arc-seconds | n/a | Public domain, <https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use> | None | V |
| L15 | Seagrass distribution | UNEP-WCMC Global Distribution of Seagrasses v7.1 (2021) | Vector | Mixed dates to 2021 | UNEP-WCMC General Data License, <https://www.unep-wcmc.org/en/general-data-license> | FLAG: commercial use and redistribute need permission | V |
| L16 | Benthic habitat incl. seagrass | Allen Coral Atlas v2.0 | 5 m | 2018-2021 | CC BY 4.0 with copyright notice, <https://developers.google.com/earth-engine/datasets/catalog/ACA_reef_habitat_v2_0> | Cambodia coastal coverage confirmed (GEE, 22 Nov 2026; Kep–Kampot sparse) | V |
| L17 | Protected areas | World Database on Protected Areas (WDPA), latest release | Vector | Monthly | Terms, <https://www.protectedplanet.net/en/legal> | Non-commercial research OK for this screen; commercial / revenue-linked use restricted (section 8) | V |
| L18 | Ramsar sites | Ramsar Sites Information Service | Vector | n/a | CC BY 4.0 (data/downloads; photos CC BY-NC 4.0), <https://www.ramsar.org/licence-information> | None | V |
| L19 | National land cover | Ministry of Environment (MoE) Cambodia Forest Cover 2018 | Booklet only | 2018 | Booklet public; digital GIS will not be provided (23 Nov 2026) | Digital map unavailable; booklet reference only | U |
| L20 | Province boundaries | geoBoundaries Cambodia ADM1 (gbOpen, 2017) | Vector | n/a | gbOpen CC BY 4.0; source ODbL 1.0, <https://www.geoboundaries.org/api/current/gbOpen/KHM/ADM1/> | None | V |
| L21 | Validation imagery | Google Earth historical very-high-resolution imagery | Under 1 m to a few m | Dates vary | Research/nonprofit viewing OK; no redistribute or commercial use, <https://www.google.com/help/terms_maps-earth/> | FLAG: no redistribute; no commercial | V |

## 4. Classification rules

Sources: the MRP Map, KLHK's classes, the Global Mangrove Alliance (GMA) tidal-frame test (guidelines pp.47-48) and VM0033 v2.1 applicability. "Proposal" cut-offs are the author's, to be tuned.

**Step 1, historic (H) and current (C).** H is mangrove in L2 1996, or in L1 for three or more consecutive years from 1996 (proposal; drops one-year errors). Mangrove in L1 1996 alone, or only before 1996, goes to class 9. C is mangrove in the latest L1 year. Go area is also reported with H from each 1996 layer alone.

**Step 2, ponds and salt fields.** Yearly water frequency from 2017 is the share of valid Sentinel-2 observations with a positive modified normalised difference water index, or Sentinel-1 VV backscatter below -18 dB (proposal) when cloudy. Ponds are L5 2020 ponds plus dyke-bounded Sentinel-2 segments above 25 per cent water frequency in any year. Ponds bright and unvegetated through the December-April dry season (threshold set on training points) are salt fields, checked by eye. Each pond is wet (50 per cent or more), dry (10 per cent or less) or intermittent in each of Y1 and Y2 (proposal).

**Step 3, classes.** The first matching rule sets the class.

| Order | Class | Rule on layers | Anchor (V/U) |
| --- | --- | --- | --- |
| 1 | STOP: built-up | L10 modal "built" over Y1-Y2 (core case: historic mangrove now built-up). Disagreement with L9 class 50 or L8 built fraction of 50 per cent or more (proposal) is flagged | MRP Map (V) |
| 2 | STOP: open water | L10 water in 90 per cent or more (proposal) of Y1-Y2 observations, not an L11 flat or step 2 pond | MRP Map (V) |
| 3 | Existing mangrove: conserve | C (degradation not mapped: no canopy layer) | Reducing emissions from deforestation and forest degradation (REDD+) route: VM0033 excludes REDD (PDF p.12, V) |
| 4 | CAUTION: tidal flat | Flat in L11's latest epoch, bare or water in L10 now. No planting on mudflats; natural recruitment after a hydrology check | GMA tidal frame (V) |
| 5 | CAUTION: other converted use | H and salt field, L10 crops, or L10 trees outside C | VM0033 3(a)-(b) (V); 3,987 ha of coastal salt fields (CI Cambodia 2026, printed p.1) |
| 6 | GO: inactive pond | H, pond, dry in Y1 and Y2 | KLHK pond class (V); VM0033 3(a)(i), abandoned two years or more (PDF p.11, V) |
| 7 | CAUTION: active pond | H, pond, wet or intermittent in Y1 or Y2 | VM0033 3(b): displaced use only if its baseline emissions are uncounted and no new wetland nationally is degraded for farms or ponds, or law bars it (PDF p.11, V) |
| 8 | GO: open or accreted land | H and L10 bare, grass or shrub | KLHK open and accreted classes (V) |
| 9 | CAUTION: history unproven | Not H, inside L3, pond or L10 bare, grass or shrub; includes step 1 leftovers | KLHK potential habitat (V) |
| 10 | STOP: outside the tidal frame | All else | GMA p.47 (V); L3 (V) |

Flags attach to any class without changing it.

- **Permit gate** — inside a Marine National Park (MNP), Marine Fisheries Management Area (MFMA), other protected area, Ramsar site, or Community Fisheries (CFi) or Community Protected Area boundary; it names MoE or the General Directorate of Fisheries (GDF). CI Cambodia 2026 lists two MNPs, four other coastal protected areas and seven MFMAs or refugia (printed p.3).
- **STOP (legal)** — a mapped protected-area core zone (Environment and Natural Resources Code Art. 364; 2008 Protected Areas Law abrogated by Art. 864).
- **Project overlap** — inside Southern Cardamom REDD+, Mangrove REDD+ or Verified Carbon Standard 5071 areas (CI Cambodia 2026, printed pp.31-32).
- **Elevation check** — go drops to caution where L12 exceeds highest astronomical tide (L13) by more than L12's vertical error.
- **Small** — under 100 ha contiguous, the Blue Carbon Cost Tool's smallest restoration scenario (proposal).

Tenure, owner willingness and opportunity cost stay in Note 3.

**Defeat test.** Claim 3 fails if open data cannot separate ponds from other loss. Classes 6 and 7 pool as "pond"; if user's accuracy (lower 95% bound) or producer's accuracy (point estimate) is under 70% (proposal), classes 5 to 8 merge into "CAUTION: converted, use unknown", with conversion type read by eye at feasibility.

## 5. Seagrass analogue, restricted

Cambodia has no seagrass time series or restoration precedent; mapping is incomplete outside Kep, Kampot and Koh Rong (CI Cambodia 2026, printed p.33). Three classes: **known meadow, protect** (seagrass in a dated source: L15, L16, surveys); **CAUTION: documented loss** (in an older dated source, absent from a later one of comparable method, inside 10 m depth); **no data** (all else).

It never returns go and is not sampled: optical mapping fails in turbid water and at depth, and sources differ in method. Seagrass is outside Nationally Determined Contribution (NDC) 3.0 mitigation and has no methodology approved by the Integrity Council for the Voluntary Carbon Market (19 November 2026), so carbon routes are for [Note 2](02-blue-carbon-in-redd-plus-two-tracks.md).

## 6. Validation

National data cannot be the reference: no official land-cover maps since 2018 (CI Cambodia 2026, printed p.36), and habitat classes differ across MoE, the Ministry of Agriculture, Forestry and Fisheries (MAFF) and coastal datasets (printed p.33).

- **Design** — stratified random sampling, the ten classes as strata plus a buffer stratum (classes 3 and 10 within 500 m of go, carved from those strata, to catch omission), after Olofsson et al. (2014, *Remote Sensing of Environment* 148:42-57). Allocation (proposal): 100 each for classes 6, 7, 8 and the buffer; 75 each for 4, 5, 9; 50 each for 1, 2, 3, 10; 825 in all. At 100 points and 80 per cent accuracy, the 95 per cent interval is about 8 points either side.
- **Labels** — an interpreter blind to the map class labels each point from L21: cover now; pond state in each of Y1 and Y2 on the map's definitions; earliest visible cover; confidence. With under two L21 dates in a year, Sentinel-2 is used and flagged partly dependent; points with no usable date are non-response.
- **Second interpreter** — relabels a random 20 per cent (proposal).
- **Historic labels** — fine imagery rarely reaches 1996, so H is checked on Landsat 5 (L7), which GMW also uses, and reported as partly dependent.
- **National data, secondary** — Fisheries Administration 2023 and Sokha 2024 mangrove areas via CI Cambodia 2026 (58,852 ha, printed p.2; primaries not opened).

## 7. Accuracy reporting

- Error matrix in area proportions; overall, user's and producer's accuracy with 95 per cent intervals.
- Area-adjusted class areas with intervals, pooled; provincial areas as point estimates.
- Pond-state and historic accuracy apart; non-response; interpreter agreement.

Go shortlists only if the lower bound of its user's accuracy is 70 per cent or more (proposal); otherwise go reads as caution.

## 8. Outputs and licence handling

Outputs: a 10 m class raster; candidate polygons with class, flags, loss year, pond state and confidence; a class-area table; an accuracy report; a data register and scripts.

- **SEEA EA / ocean-accounts hand-off** — the class-area table reports opening mangrove stock (class 3), conversions and potential restoration additions by province, with loss year where known, so a Track B provincial SEEA EA extent account can take the numbers without re-deriving them from raw imagery. Condition and services accounts stay out of scope here (Note 2). If GOAP's SDF is used later, each table value should carry the same layer IDs, product versions and licence flags as the data register (provenance passport idea on the [SDF resources page](https://oceanaccounts.org/sdf/#resources)); this build's register and scripts are the minimum equivalent.
- **Whole stack** — CC BY 4.0 only so far as every input allows, with one attribution list: CC BY credits, JRC acknowledgement, Copernicus Sentinel and DEM notices, Allen Coral Atlas copyright, GEBCO credit.
- **Licence by use** — This build is public/government research under the free Earth Engine non-commercial tier. **WDPA (L17)** may be used for permit and STOP (legal) flags in that research screen (staged at `inputs/screen-layers/L17/`; Protected Planet non-commercial terms). Do not move WDPA into a commercial or revenue-linked package without a fresh terms check. **L15** seagrass geometries stay internal (commercial use and redistribute need UNEP-WCMC permission). **L21** imagery is labels only (no redistribute or commercial use). Screening that informs a credit project counts as revenue generation and needs a different licence path.
- **Platform** — the free Earth Engine tier excludes commercial work (<https://earthengine.google.com/noncommercial/>); a revenue-linked build needs a paid licence or open stack.

## 9. Build effort, skills and cost

All figures are the author's **estimates**, built up from sections 2 to 8. Cost is person-days times the Seed Fund's day rates; none is assumed.

| Task | Person-days (estimate) | Skills | Basis |
| --- | --- | --- | --- |
| Data assembly, licence register | 4 | GIS analyst | 21 inputs |
| Step 1, historic and current mangrove | 3 | Remote-sensing analyst | One product family, sensitivity runs |
| Step 2, ponds, pond state, salt fields | 7 | Remote-sensing analyst (radar, optical) | Tuned on a few hundred training points |
| Built-up, land cover, flat, elevation, tide | 4 | GIS analyst | Prepared products |
| Class rules, flags, polygons | 3 | Remote-sensing analyst | Coding, cut-off sensitivity |
| Permit, project, tenure overlays | 2 | GIS analyst | Few layers |
| Section 5 analogue | 3 | Marine spatial ecologist | Three or four sources |
| Validation | 17 | Two interpreters; sampling statistician | 5 minutes a point, 70 a day: 825 points (12); second pass (3); design (2) |
| Reporting, data package | 5 | Analyst, writer | One report, one package |
| Senior review | 3 | Senior remote-sensing scientist | Two review points |
| Contingency, incl. reduced screen | 8 | Remote-sensing analyst | About 15 per cent |
| **Total** | **59** | | |

## 10. Gaps and desk stand-ins

The build needs national data not requested here.

| National holder (CI Cambodia 2026, printed p.32, V) | Needed for | Desk stand-in |
| --- | --- | --- |
| MoE Department of Geographic Information Management | Official mangrove extent | L1, L2; L19 booklet only (digital GIS will not be provided) |
| MoE Department of Biodiversity | Section 5 habitat records | L15, L16, surveys |
| MoE Department of Conservation of Wetlands, Freshwater, Coasts and Seas | Zoning for permit and legal flags | L17, internal only; Table 2, printed p.3 |
| MAFF GDF Department of Aquatic Resource Management | MFMA and CFi boundaries | Table 3, printed p.3; no boundary layer found |
| Ministry of Land Management, Urban Planning and Construction | Cadastre, tenure | None; a Note 3 criterion |

Also missing: a tidal datum, canopy cover, a seagrass inventory, project boundaries. A compiled provincial SEEA EA or ocean account (extent plus condition and services) is Note 2 Track B work, not this screen; section 1.1 only keeps the raster and area table account-ready.

## 11. Assumptions

1. 1996 baseline, anchored on L2.
2. Two dry years stand in for VM0033's two-year abandonment.
3. An experienced analyst builds it.
4. Core-zone STOP uses ENR Code Art. 364 (Art. 864 abrogates the 2008 Protected Areas Law).

## Gates

- **Verify pass** — dataset licences re-read; Indonesia and CI Cambodia figures traced.
- **Hostile red team** — four lenses; verdict rebuild of the pond rules and validation; one fatal and ten major findings applied, two audience points contested (`../intermediate/path-d-red-team-2026-11-20.md`).
- **Director gate** — revise; five fixes applied once.
