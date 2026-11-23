# Module — Related artifacts (outside this tree)

Prerequisites: [01-overview.md](01-overview.md). **Host paths below break on migration**; rewrite or copy the files into `related/` and update this module ([07-migration.md](07-migration.md)).

Cambodia work that is **not** inside the T3 product root. Listed so a migration can choose to bring them, leave a stub, or drop them.

## MoE blue carbon roadmap letter

Copied into this repo under [../related/moe-roadmap-letter/](../related/moe-roadmap-letter/) on 23 Nov 2026. Host paths below remain the CI Engagement originals.

| Item | Host path (while nested in CI Engagement) |
| --- | --- |
| Markdown source | `CI Contract 2/D11 - Additional Associated Tasks/intermediate/ci-letter-moe-cambodia-blue-carbon-roadmap.md` |
| DOCX output | `CI Contract 2/D11 - Additional Associated Tasks/outputs/ci-letter-moe-cambodia-blue-carbon-roadmap.docx` |
| Compile script | `CI Contract 2/D11 - Additional Associated Tasks/intermediate/compile_d11_cambodia_letter_docx.py` |

Predates the T3 folder convention; no commissioning email on file. Uses the CI template via the D6 speaker-request compile walk. **Optional cargo** on migration: copy into `related/moe-roadmap-letter/` under the new root, or leave in the host D11 audit trail.

## D6 Cambodia MoE panelist slide plan

| Item | Host path |
| --- | --- |
| Slide plan | `CI Contract 2/D6 - Pre-COP31 Negotiator Webinar/intermediate/slide-plan-cambodia-moe-panelist.md` |

COP31 webinar material. Out of bounds for T3 substance (PRD), but useful as audience context. Do not merge into the note set. Migration: leave in D6 unless a Cambodia umbrella repo explicitly wants a `related/` copy.

## CI Cambodia June 2026 policy/finance report

Staged text extract used by Notes 1–2:

- `../inputs/ci-cambodia-2026-policy-finance-report.txt`

That file **is** inside the product tree. Keep it on any move; Notes 2 page citations depend on it.

## Host D11 bookkeeping

Day allocation and commissioning status for T3 remain recorded in the host [D11 README](../../README.md) while nested. After migration, copy the T3 row into a local `CONTRACT.md` (see [07-migration.md](07-migration.md)).
