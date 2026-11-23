# Module — Migration

Prerequisites: [01-overview.md](01-overview.md), [04-data-and-licences.md](04-data-and-licences.md).

How to lift this package out of CI Engagement (or any host) without breaking the documentation surface.

## What "self-contained" means here

**Docs links inside this tree** are relative and should keep working after a move.

**Not self-contained:** `inputs/screen-layers/` (~13 GB on 23 Nov 2026), host beads (`CI_Blue_Carbon_ASEAN-` prefix), `.cursor/rules/beads-claim-blocks-sessions.mdc`, contract PDFs, and host README pointers. Host paths inside [06-related-artifacts.md](06-related-artifacts.md) must be rewritten or inlined.

## Pre-move gates (do these first)

0. Read confidentiality and IP clauses of Services Agreement 6012328; record CI consent before the tree leaves the CI Engagement host (June 2026 report extract and any MoE-relayed content included).
1. Write `CONTRACT.md` at the new root **before** the move: agreement ID, D11/T3 basis, verbal day facts, open gates, contacts, date of move.
2. Decide data handling for ~13 GB and FLAG layers (private LFS, object storage, or disk-only). Never push FLAG / INTERNAL to a public remote.

## Cut list — documentation and code unit

```text
T3 - Cambodia blue carbon seed grant and REDD+ scoping/
  README.md
  docs/
  red-team/
  prd-cambodia-blue-carbon-seed-fund-scoping.md
  CONTRACT.md          # stub exists; refresh before move
  intermediate/        # scripts, research, gates (exclude huge accidental dumps)
  outputs/
```

### Data unit (separate decision)

```text
inputs/                # includes screen-layers/ ≈ 13 GB
```

Split if needed: re-fetchable upstream zips vs non-reproducible derived rasters vs FLAG. Keep QA markdown and `PROVENANCE.txt` with the git tree even if rasters stay out.

Suggested destination names (pick one):

- `Cambodia/` under an ASEAN or GOAP umbrella (mirror of how PHL sits under ASEAN engagement)
- Standalone private repo `cambodia-blue-carbon` / `cambodia-seed-fund-screen`

## Optional cargo (decide per move)

| Artifact | Default |
| --- | --- |
| MoE roadmap letter + compile script ([06-related-artifacts.md](06-related-artifacts.md)) | Leave in host D11, or copy to `related/moe-roadmap-letter/` |
| D6 MoE panelist slide plan | Leave in D6 |
| Host beads history for `ywdp*` | Export notes into a new tracker; do not assume Dolt remote sync |

## Do not move as Cambodia package

- Other D11 tasks (T1, T2)
- Contract PDFs and Amendment 002 (cite from host or summarise in `CONTRACT.md`)
- GOAP / CI Word templates used only for the letter compile
- ASEAN / D5 / COP31 deliverable folders

## Post-move checklist

1. Open [../README.md](../README.md) and confirm relative links resolve.
2. Walk [docs/README.md](README.md); rewrite host paths from [06-related-artifacts.md](06-related-artifacts.md).
3. Confirm `CONTRACT.md` is present and accurate.
4. Init or link a beads (or other) tracker; close or supersede host issues with a pointer to the new IDs.
5. Copy or rewrite session-lock and claim rules for the new repo.
6. Update host READMEs to a stub: "Cambodia package moved to \<path\> on \<date\>".
7. Update Documents / GitHub index READMEs if the umbrella index still points here.
8. Smoke-test one fetch or process script so paths in docstrings still match.
9. Confirm FLAG layers are absent from any public remote.

## Stub text for the host (after move)

```text
T3 Cambodia package moved on YYYY-MM-DD to <new-path>.
Package docs and working tree no longer live under CI Engagement.
```

## Modular growth after migration

Keep adding capability as new `docs/NN-*.md` modules and new folders under `inputs/` / `intermediate/` / `outputs/`. Do not fold unrelated country work into this root; start a sibling package instead.
