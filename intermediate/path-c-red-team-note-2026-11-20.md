# Red team: Note 3, blue carbon project selection and feasibility framework

**Draft:** `outputs/03-blue-carbon-project-selection-feasibility-framework.md`, 20 November 2026, uncommitted.

**Reader:** Jordan Gacutan. He relays the content to developers and to Ministry of Environment (MoE) officials, who would test each gate and threshold. The reader was not inferred: it was given in the task brief.

**Lens question (set by the user):** would a blue carbon project developer and an MoE official both find each gate usable and each threshold defensible?

**Lenses:**

| Lens | Model |
|---|---|
| Planning and legal framework (MoE legal officer) | opus |
| Concept validity (developer and standards expert) | opus |
| Model logic and numbers | opus |
| Client official reading it cold (MoE official) | sonnet |

**Rounds:** 1. Round 2 was not run; see "Open after round 1".

**Quotes dropped at the mechanical check:** 1 (CO-3, which splices two passages with an ellipsis). Its point survives under PL-4.

**Location:** the pack and this note are in `intermediate/path-c-*`, not `outputs/red-team/`, because this path owns only those files.

## Verdict

**Revise.** No finding survives as fatal. The reviewer who read cold graded CO-1 as fatal: the bottom-line ranking read as a finding. I downgraded it to major for three reasons:
- the sentence already said "stylised archetypes";
- the note is internal;
- the defect could be fixed in place.

Even so, CO-1, ML-1 and CV-1 together showed that the headline claim, "first under every weighting", was wrong under the note's own tie rule. That claim had to change, so the verdict is revise.

## Fatal findings

None after merge. CO-1 was downgraded to major (see M1).

## Major findings (all fixed in place unless marked)

| Id | Quote (short) | Defect | Direction applied | Lenses |
|---|---|---|---|---|
| M1 | "ranks first under every weighting tested" | False under the 0.10 tie rule. Carbon-heavy weights give a three-way tie. At a carbon weight of 40, (iv) also passes (ii). The ranking reads as a finding | Bottom line rewritten as illustrative. The note now says (ii) leads only under balanced and non-carbon-heavy weights, gives no leader under carbon-heavy weights, and names both (i) and (iv) at 40 | CO-1, ML-1, CV-1, ML-2 |
| M2 | "5 = go on every criterion" | Scale points 2 and 4 undefined; N = 5 unreachable because of N7; no perturbation test; F2 not testable | Every scale point defined; n/a and caution-by-default criteria excluded; one-point perturbation added to `path-c-rubric.py` and reported; F2 recast as median and mean thresholds | ML-3, ML-4, ML-6 |
| M3 | "Standing-mangrove conservation under VM0048..." | VM0048 marked go on Core Carbon Principles (CCP) status alone | VM0048 moved to caution until Cambodian baseline allocation and nesting are confirmed. **Contested in part:** VM0048 does require wetland soil unless de minimis (p. 9, V), so soil cover is not an open question | CV-2 |
| M4 | "Tier 1 ... 386 t C/ha" | Treats a stock as if it were a creditable flow | C2 now asks for an annual creditable flow net of buffer; stocks are labelled context only | CV-3 |
| M5 | "Active aquaculture ... displaced elsewhere" | Failing 3(b) is an applicability failure, not leakage | Displaced aquaculture that fails 3(b) is now a stop; the VM0048 leakage module is named (U) | CV-4 |
| M6 | "Non-permanence risk tool run; buffer..." | Modelling assumptions used as pass marks; tenure duration not tested; tidal stop duplicated | C4 recast around control of the area for the crediting period; duplicate stop dropped | CV-6, PL-6 |
| M7 | "GO: ... accreted or eroded land" | Puts sites that commonly fail at go | E1 aligned to Note 3b's classes; GO open or accreted land counts as caution at gate 2 until E2 is checked | CV-5 |
| M8 | "2008 Protected Areas Law Art. 11" | V mark on a law whose standing is unconfirmed | PA Law citations marked U for standing; the provisional stop is disclosed in the bottom line and in the cell | PL-1, CO-5 |
| M9 | "That is seagrass today" | Mixes the 2020 NDC with NDC 3.0 | Tied to the 2020 designations the manual cites, "until MoE confirms otherwise" | PL-2 |
| M10 | "The manual is written for Article 6 units" | Applies an Article 6 procedure to every project without saying so | Bottom line and section 2 now say the gates are a proposed screening aid. The manual governs Article 6 authorisation only; for other projects the Letter of No Objection (LoNO) and Letter of Authorisation (LoA) are recommended practice | PL-4, CO-3 (dropped quote) |
| M11 | "ownership passes at issuance ... 10 per cent" | Conflated with a statutory carbon right | Labelled an OM procedural term; L6 made consistent | PL-5 |
| M12 | "Tier 1 soil removal ... USD 4,300" | Not labelled as illustrative; mixes discounted and undiscounted bases | Labelled as an illustration; the bias is stated | CO-2, ML-5 |
| M13 | "Gates run: ... V = read at source" | Repository paths; "repo note" sources | **Partly accepted.** The note is internal to Jordan, so the `intermediate/` paths stay. "Research file s5.2" was removed. The NBSAP and NDC repo-note sources are kept and flagged here for the coordinating session | CO-4 |

**Contested:** PL-3, which says not every minus score is disqualifying. The OM states "Any minus score is disqualifying." (PDF p. 24, printed p. 13, traced in `path-c-verify.md` row 7). S3 was reworded so it no longer suggests that only criterion 1.8 disqualifies.

## Minor findings

| Id | Location | Defect | Direction |
|---|---|---|---|
| N1 | Tables | Acronym density | REDD+ Taskforce (RTF) and tCO2e now spelled out. Proposal labels kept per cell, because they mark specific cut-offs |

## Limits the draft must disclose (all now in the note)

The note now discloses all of these:
- the standing of the PA Law beside the ENR Code;
- NDC 3.0 designations;
- the Operations Manual's 2025 revision;
- VM0048 baseline allocation for Cambodia;
- whether projects on the voluntary market alone must register;
- the Ramsar text (403);
- Cambodian costs and Tier 2 factors.

## Open after round 1

Round 2 was not run. The red team accepted and fixed every major in place. The director gate, which runs next as a fresh independent read, stands in for round 2 under the task's "do not loop" rule. Any major the director raises is applied once and then recorded.
