# Cambodia package docs

Documentation for the Cambodia blue carbon package (Seed Fund scoping, REDD+ two tracks, project selection, restoration-potential screen). Eight modules under one index.

**Do not read a module in isolation for build or release decisions.** Dependency order:

1. [01-overview.md](01-overview.md) (always)
2. The module you need
3. Before any screen edit: [../intermediate/screen-build/SESSION-LOCK.md](../intermediate/screen-build/SESSION-LOCK.md) and [04-data-and-licences.md](04-data-and-licences.md)
4. Method changes: [../outputs/03b-restoration-potential-screen-method.md](../outputs/03b-restoration-potential-screen-method.md) (or a dated addendum), not docs alone

Status lives in [../README.md](../README.md) only. After a folder move, links **inside** this tree keep working; host links and data handling are in [07-migration.md](07-migration.md).

## Modules

| # | Module | Use when you need… | Hard prerequisites |
| --- | --- | --- | --- |
| 01 | [Overview](01-overview.md) | Purpose, audience, contract basis, open gates, out of bounds | none |
| 02 | [Policy notes](02-policy-notes.md) | Notes 1 / 2 / 3 / 3b reading order, gates, sign-off | 01 |
| 03 | [Restoration screen](03-restoration-screen.md) | Spatial filter; **how to read the map** (user-guide start); cases A–C; classes, flags, SEEA framing | 01; Note 3b for full rules |
| 04 | [Data and licences](04-data-and-licences.md) | Staging paths, FLAG rules, register pointer; first-public-share gate | 01; living licence register; [first-public-share-gate.md](../intermediate/screen-build/first-public-share-gate.md) |
| 05 | [Build pipeline](05-build-pipeline.md) | Scripts, phases, session lock, how to extend a step | 01, 04, SESSION-LOCK |
| 06 | [Related artifacts](06-related-artifacts.md) | Adjacent Cambodia work that is not inside this tree | 01 |
| 07 | [Migration](07-migration.md) | Cut list, what lifts, what stays, post-move checklist | 01, 04 |
| 08 | [Handoff](08-handoff.md) | Phase 3: contract pin, licence panel, Pages gate runbook | 01, 04, app README |
| 09 | [GitHub Pages](09-github-pages.md) | Public-repo Pages (Actions source); SPA 404; `public_ready` deploy gate | 01, 04, 08; do not invent clearances |

## Package root

- [../README.md](../README.md) — entry point, **only** status table, path map
- [../CONTRACT.md](../CONTRACT.md) — commissioning and day facts
- [../prd-cambodia-blue-carbon-seed-fund-scoping.md](../prd-cambodia-blue-carbon-seed-fund-scoping.md) — plan of record
- [../outputs/README.md](../outputs/README.md) — note cover sheet
- [../red-team/cambodia-product-docs-red-team-2026-11-23.md](../red-team/cambodia-product-docs-red-team-2026-11-23.md) — docs red team
- [../related/moe-roadmap-letter/](../related/moe-roadmap-letter/) — MoE roadmap letter (adjacent)
- [../contract/platform.json](../contract/platform.json) — LKA-style open-cleared sha256 pin
- [../app/](../app/README.md) — screening console