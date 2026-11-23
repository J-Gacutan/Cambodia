# Path C verify log: Note 3 (project selection and feasibility framework)

Verify pass, 20 November 2026, on `outputs/03-blue-carbon-project-selection-feasibility-framework.md`. No email address was sent to any service. Nobody was contacted.

Sources re-opened in this session:
- **Article 6 Operations Manual (OM).** A fresh download from https://moe.gov.kh/wp-content/uploads/2024/01/Article-6-OM_EN.pdf returned HTTP 200 and was read as pdftotext. PDF page = printed page + 11; this held on every page checked.
- **CI Cambodia June 2026 report.** Read from the repo text `inputs/ci-cambodia-2026-policy-finance-report.txt`, with printed page numbers taken from the page-foot numbers.
- **Seed Fund grants page.** Read live by a fetch agent (HTTP 200).

## 1. Rows traced (14 of 47 factual rows sampled, 30 per cent)

| # | Note row | Claim | Source text found | Verdict |
|---|---|---|---|---|
| 1 | Section 2 intro | The OM has three stages: pre-implementation, implementation, issuance and transfer/cancellation | OM PDF p.28 (printed 17): "divided into three discrete stages: project pre-implementation; project implementation; and issuance and transfer/cancellation" | CONFIRMED |
| 2 | Gate 2 | The LoNO is optional and is requested with a concept note | OM PDF p.30 (printed 19): "Requesting a Letter of No Objection is an optional step for all GHG ER projects"; "Project proponents will submit a GHG ER project concept note together with the request" | CONFIRMED |
| 3 | Gate 4 | An authorisation request includes a validation report and takes 60 working days to decision | OM PDF p.32 (printed 21), Table 5: input "Validation report"; steps 3.2 to 3.6 allow 5, 10, 30, 5 and 10 working days. Recomputed: 5 + 10 + 30 + 5 + 10 = 60 | CONFIRMED. These are the maximum step times; the clock for any wait between steps is not stated |
| 4 | Gate 4 | RGC may claim up to 10 per cent; removals can be authorised for 15 years, renewable twice | OM PDF p.16 (printed 5): "claim ownership up to a maximum of 10% of those GHG ER units". PDF p.22 (printed 11): "15 years, renewable a maximum of twice, for a total of 45 years (only applicable for GHG ER projects involving removals)" | CONFIRMED |
| 5 | After gate 4 | A Letter of Positive Examination is mandatory | OM PDF p.34 (printed 23): "Requesting a Letter of Positive Examination is a mandatory step for all project proponents seeking..." | CONFIRMED |
| 6 | L1 | The positive list is "conditional" NDC activities | OM PDF p.22 (printed 11): "The positive list encompasses all activities designated as 'conditional' in the RGC's updated NDC" | CONFIRMED |
| 7 | S2, S3, N2 | Table 2 criteria: 1.3 consultation, 1.4 access to community assets, 1.8 gender equity; any minus score disqualifies | OM PDF p.24 (printed 13): "Any minus score is disqualifying." PDF p.25 (printed 14): 1.3 minus covers "No consultation of stakeholders" and "Consultation of stakeholders only at the end of the project design"; 1.8 minus is "Reduction in gender equity, discrimination against women"; 1.4 is "Access to community assets" | CONFIRMED |
| 8 | C3 | Baselines must be conservative (OM criterion 7) | OM PDF p.24 (printed 13): "Setting baselines conservatively and below 'business-as-usual' emission projections" | CONFIRMED |
| 9 | Gates 3-4, L2, L3 | MNP permits come from MoE (GDNPA, GDLC); MFMA permits from FiA/GDF; NCCMD/PCCMD are consulted | CI report p.11: "proposed activities within MNPs and MFMAs require permits from MoE (GDNPA, GDLC) and MAFF (GDF), as well as consultation with NCCMD and PCCMD". p.13 repeats this and adds "The NCCMD reviews proposed project sites" | CONFIRMED |
| 10 | Section 2, Assumption 1 | Non-forest projects go to CCS and forest projects to RTS; mangroves are forest | CI report p.16: "in practice, proposed non-forest carbon projects are administered by CCS, while forest carbon projects are undertaken through RTS". p.12: "mangroves are classified as a type of forest under the 2002 Forestry Law" | CONFIRMED |
| 11 | L3 | 2025 Law on Fisheries Art. 13 sets four MFMA classes; the identifying Prakas is pending | CI report p.10: "Article 13 of the 2025 Law on Fisheries classifies the Marine Fisheries Management Areas into four types: public fishing areas, community fisheries areas, aquaculture development areas, and fisheries conservation areas ... shall be regulated by an additional Prakas" | CONFIRMED (secondary source; the law text itself was not read) |
| 12 | L7 | Koh Kapik Ramsar Site is 14,029 ha, under MoE management | CI report p.3, Table 2 "Coastal Protected Areas System under MoE Management (MoE 2024)": "Koh Kapi Ramsar Site (the Ramsar Site overlaps with Peam Krasop Wildlife Sanctuary) 14,029" | CONFIRMED. The table spells the name "Koh Kapi" |
| 13 | S1 | CFis are legal entities (Arts 66-69) | CI report Annex 3, p.61: "Articles 66–69 recognize Community Fisheries (CFis) as legal entities" | CONFIRMED (secondary source) |
| 14 | S3, source key | Seed Fund safeguards include gender inclusion | https://seedfundfornature.org/grants: "Applicants must comply with Seed Fund safeguards, including requirements on stakeholder engagement, gender inclusion and grievance mechanisms." | CONFIRMED |

Rows taken from the coordinating session's verify log and not re-traced here (all CONFIRMED there):
- C1: VM0033 REDD exclusion (row 13).
- C2: IPCC 386 and 108 (row 3).
- C3: VM0033 3(a) and 3(b), with correction 10 applied.
- F2 and F3: BCCT costs and the 12 per cent figure (rows 9-10).
- C2: Krause 122 ± 52 (row 11).
- C1: ICVCM statuses (row 14).
- Section 5: KLHK 756,183 and 631,802 (row 5).

Corrections from that log applied in the note:
- 10: VM0033 3(b) carries a second condition; 3(a)(iii) concerns new agricultural sites in the country, not this site; the water-table exception is stated.
- 11: ICVCM. The note does not list the eligible programmes and cites the 19 November methodology table.
- 13: OM locators are printed pages, and the offset is stated.
- 14: VM0033 v3.0 consultation marked U.
- 9: HQBC is cited as the 2026 second edition.

## 2. Arithmetic recomputed

Script: `intermediate/path-c-rubric.py`. Output matches the note's tables.

| Weight set | (i) | (ii) | (iii) | (iv) |
|---|---|---|---|---|
| Carbon-heavy (35/15/15/10/10/15) | 3.20 | 3.25 | 2.65 | 3.20 |
| Balanced (20/15/20/15/15/15) | 3.05 | 3.55 | 3.10 | 3.25 |
| Non-carbon-heavy (10/15/15/20/30/10) | 3.00 | 3.95 | 3.55 | 3.60 |

Hand check: (ii) under carbon-heavy weights is (2x35 + 4x15 + 3x15 + 4x10 + 5x10 + 4x15) / 100 = (70 + 60 + 45 + 40 + 50 + 60) / 100 = 3.25.

Carbon-weight sweep (other weights scaled from the balanced set):
- (i) first passes (ii) at a carbon weight of 40: 3.29 against 3.16.
- At 35, (ii) leads 3.26 against 3.23.
- (iii) is third at 15-20 and second at 10 or below.

Worked revenue check (section 3.6): 1.62 x 44/12 = 5.94 tCO2e/ha/yr; 5.94 x 0.8 x 30 = 142.6 USD/ha/yr; 142.6 x 30 = 4,277, about 4,300.

## 3. Access failures

| Item | Result | Action |
|---|---|---|
| Ramsar Convention text (ramsar.org PDF and document page) | HTTP 403, then 403 on retry | Art. 3.2 marked U in L7. Manual steps: open https://www.ramsar.org/document/the-convention-on-wetlands-text-as-amended-in-1982-and-1987 in a browser, download the convention text PDF, and save it to `T3 .../inputs/ramsar-convention-text.pdf` |

## 4. Check script output (final)

em-dash lines: [] | emoji: 0 | words: 4496 | missing headings: [] | tool names: [] | site mentions (check none are scored): ['Koh Kapik']

The only site mention is Koh Kapik, in L7 as the Ramsar gate. It is context, not a score. No ASEAN, D5, Singapore or COP31 mention (grep count 0).

One-point perturbation (added after the red team; `path-c-rubric.py`):
- Balanced weights: no single score move of plus or minus 1 displaces (ii).
- Non-carbon-heavy weights: one move leaves (ii) ahead by only 0.05.
- Carbon-heavy weights: 39 of 44 moves reorder the top or leave it within 0.10.

## 5. Red team

Record: `path-c-red-team-note-2026-11-20.md`. The commission pack is `path-c-red-team-pack.md`, and the quotes are in `path-c-red-team-quotes.json`.

Lenses and model per lens:
- legal: opus
- concept validity (developer): opus
- model logic and numbers: opus
- official reading cold: sonnet

Results:
- **Quote check:** 24 quotes checked, 1 dropped (CO-3, spliced).
- **Verdict:** revise.
- **Severity:** 0 fatal after the director downgraded CO-1; 13 merged majors, all fixed in place except M13, which was partly accepted; 1 minor.
- **Contested:** PL-3. The OM says "Any minus score is disqualifying" (row 7 above).
- **Round 2:** not run. The director gate below served as the final independent read.

## 6. Gate record

| Gate | Ran | Verdict | Action |
|---|---|---|---|
| Verify pass | Yes | 14 rows traced, all CONFIRMED; arithmetic recomputed | None needed |
| Hostile red team | Yes, 1 round | Revise | 13 majors applied (see the red-team note) |
| Director gate | Yes, once (fresh agent, session model) | REVISE, 5 fixes | All 5 applied once, as listed below. No further loop |

Director gate fixes applied:
1. **Acronyms spelled out at first use:** REDD, CI, FiA, ICVCM, IPCC, KLHK, PA Law, IUCN/NbS and OPIS.
2. **Every n/a cell now gives its reason:** N5, N6, N7 and F5.
3. **Section order:** the Source key moved above Gaps and the "Gates run" section was deleted, so the note now ends on Gaps and desk stand-ins, then Assumptions.
4. **Gate record:** this log has been completed.
5. **Section 5 and labels:**
   - section 5 now lists all five Note 3b flags;
   - the F2 cut-offs are labelled Proposal;
   - archetype (ii) now cites "BCCT 2025, V".

## 7. Addendum, 20 November 2026: Ramsar sources downloaded by the user

The user downloaded the Ramsar files to `~/Downloads`. I read them as text and did not copy them into the repo. Two downloads of the convention text are byte-identical.

| # | Note row | Claim | Source text found | Verdict |
|---|---|---|---|---|
| 15 | L7 | Art. 3.1 wise use; Art. 3.2 duty to be informed of changes in ecological character | `current_convention_text_e.pdf` (as amended 1987), Art. 3.1: "promote the conservation of the wetlands included in the List, and as far as possible the wise use of wetlands". Art. 3.2: "shall arrange to be informed at the earliest possible time if the ecological character of any wetland ... included in the List has changed, is changing or is likely to change" | CONFIRMED. Replaces the earlier U mark |
| 16 | L7 | GDNPA is Cambodia's Ramsar Administrative Authority, and an Art. 3.2 reporting route exists | `COP15NR_Cambodia_e.pdf` p. 2: "Name of Administrative Authority ››› General Directorate of Natural Protected Area, Ministry of Environment". p. 11, 7.1: "Rangers and site managers are reporting to their line department of environment in the provincial level and process the report to national level and (AA)". p. 11, 7.2 answers "No" (not all Art. 3.2 cases have been reported to the Secretariat) | CONFIRMED |
| 17 | 3.5 | The Nagao Wetland Fund gives up to USD 30,000 per project, and Cambodia is eligible | `nwf_guidelines_2026.pdf` p. 3: "The NWF offers a maximum of 30,000 USD per project (per country per year)". The target countries include "Cambodia". p. 4: the Secretariat notifies "the Administrative Authority of the eligible Contracting Parties" | CONFIRMED |

The access-failure row in section 3 is now resolved: the Ramsar text was supplied by hand. The Ramsar row was removed from the note's gaps table.

Re-check after the edits: em-dash lines [], emoji 0, words 4,497, missing headings [], tool names []. The only site mention is Koh Kapik, at L7.

These edits are factual updates to one row and one sentence. They did not change the rubric or any gate logic, so the red team and the director gate were not re-run.

The other downloads were not used:
- `s41558-020-0738-8.pdf` (Goldstein et al. 2020, irrecoverable carbon) belongs to Path A.
- `RRI_indoburma_2025_26_e.pdf` holds no Cambodia blue carbon detail relevant here.

## 8. Addendum, 22 November 2026: ywdp.7 residual desk checks

Desk-only; no outreach. Sources saved under `inputs/desk-checks/`.

| # | Note row | Claim / question | Source text found | Verdict |
|---|---|---|---|---|
| 18 | L2, bottom line, S1 | Standing of 2008 PA Law beside ENR Code; core-zone stop; CPA term | MoE ENR Code English PDF (Royal Kram NS/RKM/0623/007): Art. 864(1)(b) abrogates "Law on Protected Areas, promulgated by the Royal Kram No. NS/RKM/0208/007, dated 15 February 2008" from the date of application of the Code; Art. 865: Code applicable one year after entry into force (promulgated 29 June 2023). Art. 364(1)(a): Core Zone access "shall be prohibited except for officials ... and natural scientific researchers ... with prior authorization". Art. 371(4): CPA agreement validity "shall not exceed 25 years"; Art. 371(5)-(6) suspension/revocation; Art. 372 transfer prohibition. Corroboration: ClientEarth PA/CPA analysis (Aug 2024) states ENR Code repeals and replaces the 2008 PA Law (citing Art. 864) and records the 25-year CPA term. | CONFIRMED. 2008 PA Law has no effect for new application; cite ENR Arts 364, 371-372, 864. CPA max term is 25 years (was 15 under PA Law Art. 25). Core-zone STOP remains, no longer provisional |
| 19 | C1 | VM0048 baseline allocation for Cambodia | Verra announcement 1 May 2026: released "unplanned deforestation allocated risk maps" for Colombia, Cambodia, and Mai Ndombe (DRC); "proponents can now proceed with project development and registration"; data enable requests for activity data under VM0048 / VMD0055 v1.1. VMD0055 Jurisdictional Data Table (page text, bands defined 5 Nov 2026; table last updated 6 Nov 2026): Band 1 = "VMD0055-compliant data and final open-access data available"; Final Data Available step means "activity data can now be allocated to projects" via Project Hub PADA request. | CONFIRMED for allocation availability. Nesting with Cambodia's national FRL / nesting prakas remains U (out of this bead's resolved pair; still in gaps) |

Note 3 edits applied (facts only): bottom line stop 2; Status date; C1 caution/basis; L2 caution/stop/basis (15→25 years); S1 basis; s5 core-zone flag wording; Source key; Gaps rows. Note 3b left unchanged (out of ywdp.7 scope). Red team / director gate not re-run: no rubric or weight change.
