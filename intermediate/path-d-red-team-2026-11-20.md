# Red team: Note 3b, Cambodia restoration-potential screen

Draft: `../outputs/03b-restoration-potential-screen-method.md`, pre-revision draft of 20 November 2026. Reader: Jordan Gacutan, then a seed-grant analyst who must build from it and a CI or Seed Fund technical reviewer. Reader inferred: yes (from the plan).
Lenses: A remote-sensing builder (strongest), B model logic and numbers (strongest), C data provenance and licences (mid), D client official reading it cold (mid). Rounds: 1. Quotes dropped at mechanical check: 0 of 24.
Pack: `path-d-red-team-pack.md`. Pack and note sit in `intermediate/` rather than a `red-team/` folder because this session owns only `intermediate/path-d-*`.

## Verdict

**Rebuild, scoped to the pond rules (section 4) and the validation design (section 6).** The fatal finding: the yearly wet/dry state that decides the main go class and the active-pond caution was never specified, and the validation labelled activity over a different window, so two analysts would build different maps and neither could be validated. The rest of the note stands. Under the skill's stop rule a rebuild does not trigger round 2 in this run; the director gate is the next check.

## Fatal findings

### F1. Pond activity is unspecified and not validated on the same rule
> H, pond in L6 or the L7 pond map, dry or vegetated two consecutive years

Section 4, rules 6-7; section 6. No index, threshold, season or window defines "pond", "flooded" or "dry". Rules 6 and 7 are not mutually exclusive or exhaustive (an intermittent pond falls through to STOP). Salt fields meet the pond rules first, so class 8 cannot be reached. The reference label (two dates in three years) does not test the map rule. The builder invents the algorithm; the reviewer rejects the validation. Raised by: A (A-1, A-2, A-6), B (B-1).
Direction: specify the pond and salt-field step with proposal thresholds, make the pond classes exhaustive over one two-year window, and label reference points per year on the same window.

## Major findings

| Id | Quote (short) | Defect | Reader action | Direction | Lenses |
| --- | --- | --- | --- | --- | --- |
| M1 | "C, canopy over 30 per cent" | No listed layer measures canopy | Builder picks an arbitrary proxy | Merge rules 3-4; disclose degradation not mapped | A-3 |
| M2 | "the latest GMW layer at build time" | "Current" mixes 2019-2025 layers; L9 continuous with no threshold; L13 may lack a flat-extent band | Post-2020 conversion missed; built STOP area not reproducible | Name the layer and year per rule; L12 as current; L9 threshold or corroboration only; use a flat-extent product | A-4, B-6 |
| M3 | "H (historic) is mangrove in L1 in 1996 or any later year" | No persistence rule; 1996 itself infilled; no L1/L2 disagreement rule | Inflated go area; untested baseline sensitivity | Persistence rule; use L2 1996 with L1 cross-check; disagreement goes to class 10; report go area both ways | A-5, B-4 |
| M4 | "about 800 in all"; "800 points at about 100 per day" | Allocation sums to 650; per-province intervals unsupportable; defeat test undefined (pooled or per class, point or bound); labelling rate implausible | Contest the defeat test and the budget | Class-by-class allocation and a buffer stratum; pooled intervals; exact test; stated time per point; recompute days | B-2, B-3, B-5 |
| M5 | "can be built from open data in about 52 person-days" | Headline hides the untested pond separation and the U layers | Funds it as a confirmed capability | Qualify the bottom line | D-4 |
| M6 | "CC BY-derived products can be released under CC BY 4.0." | No derivative rule for the non-CC BY layers; labelled points depend on unchecked imagery terms; WDPA-derived fields sit in the deliverable list | Licence reviewer holds back the package | One release rule for the whole stack; withhold WDPA-derived fields and imagery-dependent items | DP-1, DP-2, DP-3 |
| M7 | "## Gates ... GATES_PLACEHOLDER" | Placeholder; review status unknown | Treats note as unreviewed | Fill the gates | D-1 |
| M8 | "## 9. Build effort, skills and cost" | Heading promises cost; no money | Cannot defend a budget line | Say cost = person-days times grant rates, none assumed | D-2 |
| M9 | "CC BY 4.0 (site-wide statement)" | Marked V though layer metadata unread | Treats V as overstated | Mark U at layer level | DP-4 |
| M10 | "Their scores \"do not account for ...\"" | Quote and method lack version and locator | Discounts the anchors for rules 1-2 | Cite the 2018 report pages; separate from the 2024 dataset | DP-5 |

D-3 and D-5 (repository paths, "not for CI") are contested: the note is internal by decision of the plan (section 2.0) and the brief. Kept internal; companion notes are named once in the Status line.

## Minor findings

| Id | Location | Defect | Direction |
| --- | --- | --- | --- |
| N1 | Section 4, STOP (legal) | Reads as a legal conclusion | Label provisional |
| N2 | Sections 1, 6 | National figures reach the note through CI Cambodia 2026 only | Mark as secondary |

## Limits the draft must disclose

Pond activity and salt-field separation are untested on Cambodian imagery; no tidal datum; no canopy-cover layer; WDPA, seagrass, Ramsar and imagery terms unresolved; national boundaries and MFMA layers not obtained (no request made).
