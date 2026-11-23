# Red-team commission pack: Note 3, blue carbon project selection and feasibility framework (Cambodia)

**Draft:** `/Users/z5238824/Documents/GitHub/CI Engagement/CI Contract 2/D11 - Additional Associated Tasks/T3 - Cambodia blue carbon seed grant and REDD+ scoping/outputs/03-blue-carbon-project-selection-feasibility-framework.md`

## Reader statement

**Direct reader.** The note is an internal working note for Jordan Gacutan, a blue carbon and policy consultant. He will use it on calls with:
- CI Cambodia's Country Director and its Policy and Partnership Manager;
- CI's blue carbon team.

**Secondary readers.** Its content will be relayed, not forwarded, to two kinds of reader:
- blue carbon project developers, who will use the gates to decide whether to spend money on a site;
- Cambodian Ministry of Environment officials, who will judge whether each gate matches Cambodian law and institutions.

The note supports the CI-hosted Seed Fund for Country Packages, Cambodia's package (Phase 1, design).

**Overarching lens question, set by the user.** Every reviewer applies it through their own lens: *would a blue carbon project developer and an MoE official both find each gate usable and each threshold defensible?*

## Standing terms and settled decisions

Do not attack these decisions. You may attack how the note executes them.

**Planning brief (PRD).** `../prd-cambodia-blue-carbon-seed-fund-scoping.md`. The relevant parts are §3.0 Claim 3, §4.1 Note 3 and §7.0.

**Settled by the user:**
- The framework is a stage-gate plus a rubric.
- No named site is scored. Four stylised archetypes are scored instead.
- The note is desk-based only. It makes no outreach and no data requests.
- Non-carbon outcomes are criteria with thresholds, and a no-credit route is allowed.
- Thresholds marked "proposal" are the author's own. Labelling them as proposals is required. A proposal is not a defect in itself. Attack it only if it is indefensible or mislabelled.

**Research and verification behind the note:**
- `research-scoping-frameworks.md`
- `verify-log-research-files.md`
- `path-c-verify.md`

**Main local source.** The CI Cambodia June 2026 report, cited by printed page: `../inputs/ci-cambodia-2026-policy-finance-report.txt`. Page numbers appear as bare numbers at each page foot. **Article 6 Operations Manual:** cited by printed page, where PDF page = printed page + 11.

## Finding schema

Each reviewer returns only a JSON object with these fields:
- `lens`;
- `verdict_from_this_lens`: ship, revise or rebuild;
- `findings`: at most six, most severe first. Each finding carries:
  - `id`;
  - `severity`: fatal, major or minor;
  - `quote`: verbatim from the draft, at most 300 characters;
  - `location`;
  - `defect`: one sentence;
  - `reader_action`;
  - `fix_direction`: one sentence.

**Severity:**
- **fatal**: one competent reader would refuse the draft on this ground alone.
- **major**: a claim, a number or a scope statement must change.
- **minor**: wording only.

Record a missing input as a limit the note must disclose, not as work to commission.

## Lens briefs

### 1. Planning and legal framework (MoE legal officer)

You are the legal officer of the authority that would adopt or contest this draft. Test every term of art against its statutory definition. Test every cited instrument for currency: is it in force, superseded or revoked? Ask who has the mandate to set what the draft sets, and whether the draft claims a power its author or client does not hold. Check that plan boundaries are treated as overlays, not as the units the analysis rests on, unless the law says otherwise. Fatal: the output is labelled as a legal quantity it does not satisfy, or rests on a revoked instrument.

Context: you are a legal officer of Cambodia's Ministry of Environment. Check each of these:
- whether each gate names the right responsible body;
- whether the Article 6 Operations Manual process is described correctly;
- whether permits, LoNO and LoA, MNP zoning, MFMA classes, NCCMD/PCCMD and the Ramsar site are handled defensibly.

### 2. Concept validity (blue carbon project developer and standards expert)

You are a senior scientist in the field the draft claims. Ask whether the thing measured is the thing named. Separate a property of the system (what the environment can sustain) from a choice about it (how a total is shared among users). Check that intermediate and final quantities are not added together, that stocks and flows are not confused, and that a proxy is declared as a proxy. Fatal: the headline output measures a different concept from the one in its title.

Context: you are an experienced blue carbon project developer who has taken VM0033 and REDD projects to validation. Ask:
- Are the carbon criteria right about method eligibility, additionality, permanence and leakage?
- Are the go/caution/stop thresholds ones you would act on?
- Would the gates actually stop the projects that fail in practice?

### 3. Model logic and numbers

You are the reviewer who will rerun the model. Trace each headline number to its inputs and check the arithmetic on at most five figures. Look for:
- circularity (an output used to calibrate itself);
- double counting;
- unit errors;
- a parameter outside its plausible range;
- a printed value that differs from the derived one;
- sensitivity hidden behind a single point estimate.

Check that limits are expressed in physical units per stated area, and that money is reported rather than used as the test. Fatal: the headline number cannot be reproduced or changes sign under a plausible input.

Context: the rubric scores and weights are the headline. The script is `path-c-rubric.py` in the same folder as this pack.

### 4. Client official reading it cold (MoE official)

You are a senior official who receives this with no briefing and ten minutes. Ask: what is this asking me to do, and can I defend it to my minister? Flag:
- repository paths;
- internal jargon;
- "the research says" without a source;
- foreign terms where a national term exists;
- illustrative figures not labelled as such;
- any sentence a journalist could lift as "the capacity of X is N".

Check that an illustrative label appears once per table, not in every cell. Fatal: the official would take an illustrative or provisional figure as a confirmed one.

Context: you are a senior MoE official in the Department of Climate Change. You would see this content relayed by CI.
