# Red team: Cambodia product docs (T3 README + docs/)

Draft: `red-team/cambodia-product-docs.md` (assembled from `README.md` and `docs/*.md`), 23 November 2026. Reader: Jordan Gacutan and a cold later agent session that will continue the screen build or migrate the tree; they will treat the pack as operating instructions. Reader inferred: no.
Lenses: Concept validity (strongest); Planning and legal framework (strongest); Client official reading it cold (mid); Data provenance (mid). Rounds: 1. Quotes dropped at mechanical check: 0 of 24.

## Verdict

**Revise.** No fatal findings. Majors change scope and status claims a cold session would act on: "national" and "open data" overstate the screen; build status contradicts `SESSION-LOCK.md`; "self-contained" and "read one module alone" overstate portability and modularity; FLAG and GO/STOP language understate legal and licence limits; commissioning and day facts need an open-gate line.

## Fatal findings

None.

## Major findings

| Id | Quote (short) | Defect | Reader action | Direction | Lenses |
| --- | --- | --- | --- | --- | --- |
| M1 | "national … screen built from open data" / "10 m national (four coastal provinces) … from open data" | National coverage and open-data provenance overstated; FLAG / INTERNAL inputs sit only deeper in the pack | Relays a national open screen to CI or MoE; publishes derivatives | Drop "national"; lead with four coastal provinces; say open and restricted-licence (FLAG); put release constraint on the README | CV-5, CV-6, PL-5, CO-1, CO-5 |
| M2 | "Step 1–3 class build in progress" / "Step 3 class raster in progress" | Conflicts with SESSION-LOCK (23 Nov): no active lock; ywdp.8.5 and ywdp.8.6 closed; `class_step3.tif` named | Avoids open work or hunts a non-existent owner; misses next step (legal flags / L17) | Single dated status in README from the lock; modules link, do not restate | CO-2, DP-1, DP-2 |
| M3 | "self-contained" / "only host-repo pointers need rewriting" / "can be multi-GB" | Host D11 link, beads rules, and ~13 GB `screen-layers/` mean the cut list is not a runnable product; IP/consent for leaving CI host unstated | Moves the tree, then breaks links, loses contract basis, or pushes FLAG data | Define self-contained as docs links; split git tree vs data; state ~13 GB; CONTRACT.md and CI consent as pre-move; mark host links | CV-3, CO-3, DP-5, DP-6, PL-6 |
| M4 | "read one without the others when you only need that surface" | Modules defer to Note 3b, licence register, SESSION-LOCK; 01 lists four modules, index lists seven | Edits screen without lock or licence check | Dependency order in docs/README; prerequisites in module headers | CV-4 |
| M5 | "INTERNAL use for this research screen only unless cleared" | No licence-by-use path for CI relay, seed-grant build, or credit design; FLAG inheritance on derivatives unclear | Shares class raster as open derivative; breaches Clark / EE / imagery terms | Derivatives inherit FLAG; short licence-by-use lines; clearance before relay of rasters | PL-1, CO-5 |
| M6 | "GO / CAUTION / STOP logic" | Labels read as permissions; legal overlays optional / later; tenure absent | Treats GO as cleared for restoration or grant eligibility | Disclose: physical / land-cover suitability; legal status unverified until flags; no class implies tenure clearance | PL-2, CV-1 |
| M7 | "GDF / FiA under MAFF" vs README "MAFF–FiA" | Agency names inconsistent; split not cited to instruments in the docs pack | Addresses wrong ministry in a call | One naming line from PRD/CI report; label working assumption | PL-3 |
| M8 | "Day allocation: at least 3 days … verbal only" / "Engaged under" | Floor not ceiling; screen days unallocated; no email gate before CI send or further screen spend | Keeps building or invoicing without confirmation | Open-gate line: no CI-facing send; screen days unconfirmed; email confirmation needed | PL-4, CO-4 |
| M9 | "can later feed a provincial SEEA EA extent account" | Most classes are suitability partitions, not ecosystem extent; additive risk | Exports class tables as an extent account | Name which classes are extent inputs; mark SEEA export as a separate derivation | CV-2 |

## Minor findings

| Id | Location | Defect | Direction |
| --- | --- | --- | --- |
| N1 | docs/05 script inventory | Omits `process_step3_case_study_maps.py` | Add row |
| N2 | docs/03 vs docs/04 | L1…L20 vs L1–L21; GEE-only IDs not marked | One range from Note 3b; staged / GEE-only / not fetched |
| N3 | docs/05 phase order | Beads jargon; no plain next-actions list | Short next-actions with full IDs where known |
| N4 | docs/01 vs docs index | Four "product modules" vs seven docs modules | Align wording |

## Limits the draft must disclose

- Jurisdiction split is taken from the CI Cambodia June 2026 report / PRD, not re-checked against Forestry Law, Fisheries Law or Protected Areas Law text in this docs pack.
- Note 3b class names (GO / CAUTION / STOP) are inherited; renaming them is a Note 3b change, not a docs-only fix.
- Exact FLAG layer list and credit-project licence path need the living register, not a frozen docs copy.
- Screen-layer volume (~13 GB on 23 Nov 2026) will change as builds continue.

## Applied (round 1 fixes, once)

| Id | Applied | Where |
| --- | --- | --- |
| M1 | Yes | README opening; docs/03 opening; drop national / open-data lead |
| M2 | Yes | README status from SESSION-LOCK; modules defer status to README |
| M3 | Yes | README + docs/07: docs-only self-contained; ~13 GB; pre-move CONTRACT + CI consent |
| M4 | Yes | docs/README dependency order + prerequisites |
| M5 | Yes | docs/04 licence-by-use + FLAG inheritance; docs/03 release lines |
| M6 | Yes | docs/03: physical suitability; five flags named; GO not zoning |
| M7 | Yes | README + docs/01: GDF (formerly FiA) under MAFF; working assumption |
| M8 | Yes | README + docs/01 Open gates |
| M9 | Yes | docs/03 SEEA extent vs suitability |
| N1–N4 | Yes | script row; L1–L21 / GEE-only; next actions; seven modules |

**Concurrent edit during this red team:** another session expanded `docs/03` with a how-to-read user guide and cases A–C (and nudged README status). Fixes were applied on top of that expansion; the assembled draft in `cambodia-product-docs.md` is the pre-expansion snapshot used for quotes.

## Residual pass (jwx8)

After user "fix": cleared leftover "national" wording in docs/03 case guide; added [../CONTRACT.md](../CONTRACT.md); refreshed assembled draft. Note 3b / outputs left unchanged (method of record).

## Open after round 2

Not run. Round 1 revise; fixes applied once plus residual pass. Fresh round 2 only if majors remain after a cold re-read of the revised README and docs/01–07.
