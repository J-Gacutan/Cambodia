# Red-team commission pack: Note 3b, Cambodia restoration-potential screen

Draft: `../outputs/03b-restoration-potential-screen-method.md` (20 November 2026).

## Reader

Primary: Jordan Gacutan, consultant, who will use the note on calls with CI Cambodia and as the spec for a Seed Fund Phase 1 budget line. Secondary (later): a remote-sensing analyst hired under the seed grant who must build the screen from this note alone, and a technical reviewer at CI or the Seed Fund who decides whether the validation and licence handling are acceptable. Reader inferred from the plan: yes.

Run lens (set by the user): "Could a remote-sensing analyst build this from the note alone, and would a reviewer accept the validation and licence handling?"

## Standing terms (decided; do not contest)

- Desk-based only: no map is built, no named sites scored, no outreach or data requests. Missing national data is recorded as a gap with a desk stand-in. Findings asking for outreach are limits to disclose, not work to commission.
- The note is a method spec plus data list, 1,500-2,500 words plus the data table; it cannot grow much.
- Baseline year 1996 unless better supported. Validation must use a stratified random sample checked against independent very-high-resolution imagery, national data secondary.
- Classes must cover: historic mangrove now pond = restorable candidate, caution if pond still active; now built-up = stop; inside an MNP or MFMA = permit gate; tidal flat = caution.
- Plan and decisions: `../prd-cambodia-blue-carbon-seed-fund-scoping.md` sections 3.0 (Claim 3), 4.1 (Note 3b). Verify log: `path-d-verify.md`.

## Finding schema

Return only JSON:

```json
{
  "lens": "<lens name>",
  "verdict_from_this_lens": "ship | revise | rebuild",
  "findings": [
    {"id": "<lens initials>-1", "severity": "fatal | major | minor", "quote": "<verbatim from draft, max 300 chars>", "location": "<heading>", "defect": "<one sentence>", "reader_action": "<what the hostile reader does>", "fix_direction": "<one sentence>"}
  ]
}
```

At most six findings, most severe first. Fatal: one competent reader would refuse the draft on this ground alone. Major: a claim, number or scope statement must change. Minor: wording.

## Lens briefs

### A. Remote-sensing builder (custom lens for this run)

You are the remote-sensing analyst hired to build this screen from the note alone, with no access to its author. Walk the build step by step: can you assemble each layer, put it on one grid, and code each class rule unambiguously? Look for undefined terms (how is "pond map" from L7 made, how is canopy cover measured, which epoch is "latest"), rules that overlap or leave gaps in the precedence order, layers that do not exist at the stated resolution or date, temporal mismatches between layers (for example a 2021 land-cover map used for "current"), and steps whose effort is badly underestimated. Fatal: a core class (go, or the active-pond caution) cannot be computed from the layers listed.

### B. Model logic and numbers (validation and accuracy)

You are the reviewer who will rerun the model. Trace each headline number to its inputs and check the arithmetic on at most five figures. Look for circularity (an output used to calibrate itself), double counting, unit errors, a parameter outside its plausible range, a printed value that differs from the derived one, and sensitivity hidden behind a single point estimate. For this draft, focus on the validation: is the sampling and estimation design sound for area-adjusted accuracy, is the reference data independent of the inputs, is the sample size workable for rare classes, and are the effort figures internally consistent. Fatal: the headline number cannot be reproduced or changes sign under a plausible input.

### C. Data provenance and licences

You are the data custodian's auditor. For up to five figures or dataset rows, check that the cited source says what the draft claims, at the page or layer cited (the verify log `path-d-verify.md` records what was re-read). Flag figures from news reports where a primary or official source exists, a global product used where a national government source covers the area, a source that is superseded, a licence that forbids the use, and a figure that originates from the draft's own earlier output. For this draft, test whether the licence handling would survive a reviewer: every restrictive licence flagged, the handling rule for derivatives clear, nothing published that a licence forbids. Report the figures you did not check as unchecked. Fatal: a headline figure comes from a revoked or misattributed source, or the plan publishes something a licence forbids.

### D. Client official reading it cold

You are a senior official (a CI Cambodia programme lead or a Seed Fund reviewer) who receives this with no briefing and ten minutes. Ask: what is this asking me to fund, and can I defend it? Flag repository paths, internal jargon, "the research says" without a source, illustrative figures not labelled as such, and any sentence someone could lift as a confirmed fact when it is an estimate or proposal. Fatal: the official would take an illustrative or provisional figure as a confirmed one.
