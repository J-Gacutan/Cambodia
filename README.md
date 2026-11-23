# Cambodia blue carbon — Seed Fund, REDD+ and restoration screen

Internal working package for CI Cambodia: programme and REDD+ scoping notes, a project-selection framework, and a four-province coastal mangrove restoration-potential screen (land-cover and permit eligibility filter; proxy for restoration potential) built from open and restricted-licence (FLAG) data. Engaged under Services Agreement 6012328, Amendment 002, Deliverable 11, task **T3** (verbal commissioning only; see Open gates).

This folder is the package root. Documentation links inside it are relative and survive a move. Data (~13 GB under `inputs/screen-layers/`), beads tracker, host claim rules and contract PDFs are **not** self-contained; see [docs/07-migration.md](docs/07-migration.md).

**Plan of record:** [prd-cambodia-blue-carbon-seed-fund-scoping.md](prd-cambodia-blue-carbon-seed-fund-scoping.md)  
**Contract stub:** [CONTRACT.md](CONTRACT.md)  
**Package docs:** [docs/](docs/README.md)  
**Beads:** parent `CI_Blue_Carbon_ASEAN-ywdp`; screen build `CI_Blue_Carbon_ASEAN-ywdp.8`; docs pack closed `CI_Blue_Carbon_ASEAN-ie5t`; docs red team `CI_Blue_Carbon_ASEAN-fet9`  
**Red team (docs):** [red-team/cambodia-product-docs-red-team-2026-11-23.md](red-team/cambodia-product-docs-red-team-2026-11-23.md) (verdict: revise; fixes applied once)

## Open gates

- No commissioning email on file. No CI-facing send of the notes until Jordan internal sign-off **and** email confirmation of scope and days.
- Note tasks: verbal allocation "at least 3 days per note-task" (floor, not a ceiling; at least 9 across three). Screen-build days are **unconfirmed** under that verbal deal.
- Screen outputs that include FLAG inputs stay INTERNAL until the licence register is cleared for the intended use (research, CI relay, grant-funded build, or credit design each differ).

## Status (23 Nov 2026)

Single status table for the package. Modules link here; they do not restate it. Live lock detail: [intermediate/screen-build/SESSION-LOCK.md](intermediate/screen-build/SESSION-LOCK.md).

| Module | Status | Entry |
| --- | --- | --- |
| Policy notes (1, 2, 3, 3b) | Four notes in `outputs/`; consistency pass done; awaiting Jordan internal sign-off. Nothing sent to CI. | [outputs/README.md](outputs/README.md) · [docs/02-policy-notes.md](docs/02-policy-notes.md) |
| Restoration-potential screen | Phase 0 staged (L19 digital GIS closed). Steps 1–3 closed: class raster at `inputs/screen-layers/L_class_10m/class_step3.tif`. Elevation-check closed. How-to-read and cases A–C in the screen module. **No active claim.** Next open: permit / STOP (legal) flags using L17 (and related). No final map published. | [docs/03-restoration-screen.md](docs/03-restoration-screen.md) |
| Data and licences | Living register; FLAG rows. `inputs/screen-layers/` ≈ **13 GB** on disk (23 Nov 2026). | [docs/04-data-and-licences.md](docs/04-data-and-licences.md) |
| Build pipeline | Scripts and session lock in `intermediate/screen-build/`. | [docs/05-build-pipeline.md](docs/05-build-pipeline.md) |

## Folder map

| Path | Role |
| --- | --- |
| [docs/](docs/) | Modular documentation (this pack) |
| [red-team/](red-team/) | Docs-pack red team (assembled draft, pack, note) |
| [prd-cambodia-blue-carbon-seed-fund-scoping.md](prd-cambodia-blue-carbon-seed-fund-scoping.md) | PRD / plan of record |
| [CONTRACT.md](CONTRACT.md) | Commissioning and day facts (migration stub) |
| [inputs/](inputs/) | Source PDFs, desk-checks, `screen-layers/` data (~13 GB) |
| [intermediate/](intermediate/) | Research, gates, discussion briefs; `screen-build/` scripts and registers |
| [outputs/](outputs/) | Four internal notes + cover README |

Standard deliverable subfolders (`RAG/`, `visualizations/`, `archive/`) are created only when a file needs them.

## Audience and sensitivity

Primary reader of the notes is Jordan Gacutan (working material). Content is relayed to CI Cambodia and CI Blue Climate, not forwarded verbatim. Build on CI Cambodia's June 2026 report; do not correct it in tone. Government ownership and split jurisdiction apply (working assumption from that report: mangroves in protected areas with MoE; ARR outside them with the General Directorate of Fisheries (GDF), formerly the Fisheries Administration (FiA), under MAFF). Full rules: PRD §2.0 and [docs/01-overview.md](docs/01-overview.md).

## Quick links

- Reading order for the four notes: [outputs/README.md](outputs/README.md)
- Screen method (Note 3b): [outputs/03b-restoration-potential-screen-method.md](outputs/03b-restoration-potential-screen-method.md)
- How to read the screen (cases A–C): [docs/03-restoration-screen.md](docs/03-restoration-screen.md)
- Licence register: [intermediate/screen-build/phase-0-licence-register.md](intermediate/screen-build/phase-0-licence-register.md)
- Session lock (screen build): [intermediate/screen-build/SESSION-LOCK.md](intermediate/screen-build/SESSION-LOCK.md)
- Adjacent Cambodia artifact outside this tree (MoE roadmap letter): [docs/06-related-artifacts.md](docs/06-related-artifacts.md)
- How to migrate this package: [docs/07-migration.md](docs/07-migration.md)

## Host context

This is the standalone Cambodia package root (moved 23 Nov 2026 from CI Engagement D11 T3). A stub remains at that host path. Beads may still use the `CI_Blue_Carbon_ASEAN-` prefix until a local tracker is initialised. See [docs/07-migration.md](docs/07-migration.md).
