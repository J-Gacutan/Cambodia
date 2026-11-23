# Red-team commission pack: Note 2, blue carbon in Cambodia's REDD+ (two tracks)

Draft: `CI Contract 2/D11 - Additional Associated Tasks/T3 - Cambodia blue carbon seed grant and REDD+ scoping/outputs/02-blue-carbon-in-redd-plus-two-tracks.md` (repo root: /Users/z5238824/Documents/GitHub/CI Engagement).

## Reader

Primary: Jordan Gacutan, consultant, who will carry the note's positions into calls with CI Cambodia (Country Director, Policy and Partnership Manager) and CI Blue Climate. Content is relayed to them, not forwarded verbatim. The governing test (user's lens): **would CI Cambodia read this as fair to its own June 2026 report, and would a UNFCCC REDD+ technical assessor accept every rule stated?**

## Standing terms and settled decisions (do not attack these as choices)

- Two tracks are a settled user decision. Track A: mangroves inside REDD+. Track B: seagrass and other non-forest coastal wetlands on their own track, sharing REDD+ institutions, safeguards, registry and benefit sharing, but not REDD+ accounting or results-based payments.
- The note deliberately differs from the CI report on exactly two points: (1) mangrove soil carbon into the next FRL, not a separate coastal reference level; (2) seagrass Article 6 ineligibility is a national rule MoE can change. Attack how these are argued and stated, not whether they were chosen.
- Internal working note; desk-based only. Missing inputs are disclosures, not work to commission.
- Plan: `.../T3 .../prd-cambodia-blue-carbon-seed-fund-scoping.md` (sections 3.0, 4.1 Note 2).

## Sources reviewers may open (only if a finding turns on them)

- CI report text: `.../T3 .../inputs/ci-cambodia-2026-policy-finance-report.txt`. Printed page numbers are bare numbers on their own line at each page foot (roman numerals for the front matter).
- UNFCCC decision texts (extracted): `/private/tmp/claude-502/-Users-z5238824-Documents-GitHub-ASEAN-engagement/2ec6fb70-8f41-47f7-af38-d99e19ec420e/scratchpad/dl-decisions/` (cp16.txt = 1/CP.16; cp17.txt = 12/CP.17; cp19.txt = Warsaw decisions 9-15/CP.19; cma3.txt = 2/CMA.3).
- Other extracts in the same scratchpad: `om.txt` (Article 6 Operations Manual), `ndc3.txt` (NDC 3.0), `frl2.txt` (second FRL), `tar2021.txt` (FCCC/TAR/2021/KHM), `btr1.txt`, `dl-ipcc/ws4.txt` (IPCC Wetlands Supplement Ch 4), `dl-inv/au-vol2.txt`, `dl-inv/us-final-ch6.txt`.
- Research and verification: `.../T3 .../intermediate/research-redd-plus-blue-carbon.md`, `.../T3 .../intermediate/verify-log-research-files.md`.

## Finding schema

Return only JSON:

```json
{
  "lens": "<lens name>",
  "verdict_from_this_lens": "ship | revise | rebuild",
  "findings": [
    {
      "id": "<lens initials>-1",
      "severity": "fatal | major | minor",
      "quote": "<verbatim from draft, max 300 chars>",
      "location": "<heading or paragraph>",
      "defect": "<one sentence>",
      "reader_action": "<what the hostile reader does>",
      "fix_direction": "<one sentence; direction, not rewritten text>"
    }
  ]
}
```

At most six findings, most severe first. Fatal: one competent reader would refuse the draft on this ground alone. Major: a claim, number or scope statement must change. Minor: wording only.

## Lens briefs

### A. UNFCCC REDD+ technical assessor (adapted from lens 1, Planning and legal framework)

You are a member of a UNFCCC LULUCF expert assessment team under decision 13/CP.19, and you also know the Article 6.2 guidance (2/CMA.3) and the IPCC 2006 Guidelines and 2013 Wetlands Supplement. Test every rule the note states about REDD+, FRLs, results-based payments, inventory consistency, IPCC tiers, and Article 6 against the decision texts. Ask whether each claimed requirement actually exists, whether the note claims a constraint stronger or weaker than the text, and whether it confuses an assessment criterion with a precondition. Check any statement about what assessors "said". Fatal: the note states as a UNFCCC or IPCC rule something the texts do not say, on a point the two-track argument depends on.

### B. CI Cambodia report author (adapted from lens 5, Client official reading it cold)

You are the lead author of CI Cambodia's June 2026 report, reading this note when Jordan relays it. You want a reason to feel misrepresented. Check every report position the note attributes to you against the report text at the page cited: is it quoted accurately and in context, is a nuance dropped, is a "difference" overstated, is an option the report raised described as a strawman, and is credit given where your report already said the thing? Flag tone that reads as correcting rather than building on. Fatal: the note misstates the report's position on one of the two points where it claims to differ.

### C. Carbon accounting concept validity (adapted from lens 2)

You are a senior blue carbon accounting scientist. Ask whether the accounting concepts are right: Forest Land versus Wetlands classification of mangroves, soil pools under Tier 1 versus higher tiers, extraction versus clearance versus drainage, stocks versus flows (stock in t C/ha versus emission per year), allochthonous carbon and creditability, conversion-emission versus stock-change accounting (the Indonesia model), double counting between a national reference level and nested projects, and whether a reference level for seagrass at Tier 1 is meaningful. Fatal: the note's case for putting mangrove soil in the FRL, or its interim method, rests on an accounting error.

### D. Data provenance (lens 6, mid tier)

You are the data custodian's auditor. For up to five figures, check that the cited source says what the draft claims, at the page or layer cited. Flag figures from news reports where a primary or official source exists, a global product used where a national government source covers the area, a source that is superseded, a licence that forbids the use, and a figure that originates from the draft's own earlier output. Report the figures you did not check as unchecked. Fatal: a headline figure comes from a revoked or misattributed source.
