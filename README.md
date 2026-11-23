# Cambodia blue carbon — Seed Fund, REDD+ and restoration screen

Internal CI Cambodia package: Seed Fund / REDD+ scoping notes, project-selection framework, and four-province coastal mangrove restoration-potential screen (land-cover + permit eligibility; proxy, not a hydrology/carbon model). Services Agreement 6012328, Amendment 002, D11 **T3** (verbal only; see Open gates).

**PRD:** [prd-cambodia-blue-carbon-seed-fund-scoping.md](prd-cambodia-blue-carbon-seed-fund-scoping.md) · **Contract:** [CONTRACT.md](CONTRACT.md) · **Docs:** [docs/](docs/README.md) · **Beads:** `bd ready` / claim before screen-build edits ([SESSION-LOCK](intermediate/screen-build/SESSION-LOCK.md))

Heavy rasters under `inputs/screen-layers/` are gitignored (~**13 GB** on a full workstation). Do **not** push FLAG / INTERNAL layers to a public remote. This clone may hold only provenance/QA stubs.

## Open gates

- No CI-facing send until Jordan internal sign-off **and** email confirmation of scope/days.
- Notes: verbal ≥3 days/note-task (≥9 across three). Screen-build days **unconfirmed**.
- FLAG-derived screen outputs stay INTERNAL until the licence register clears the intended use.

## Status (23 Nov 2026)

| Module | Status | Entry |
| --- | --- | --- |
| Policy notes (1–3, 3b) | In `outputs/`; consistency pass done; awaiting Jordan sign-off. Not sent to CI. | [outputs/](outputs/README.md) · [docs/02](docs/02-policy-notes.md) |
| Restoration screen | Phase 0 QGIS pack usable offline on workstation (`outputs/qgis-bridge/` + staged rasters). Steps 1–3 + elevation-check closed. Open-cleared GO±CAUTION `delivery/open-cleared/v0.2.0/` (`public_ready` false). Next: permit/STOP via L17; licence gate `khm-i6e.2`. | [docs/03](docs/03-restoration-screen.md) · [SESSION-LOCK](intermediate/screen-build/SESSION-LOCK.md) |
| Data / licences | Living register; FLAG rows. Full stack ≈13 GB when staged. | [docs/04](docs/04-data-and-licences.md) |
| Build pipeline | Scripts + lock in `intermediate/screen-build/`. | [docs/05](docs/05-build-pipeline.md) |
| Screen console (MVP) | React + PF6 + MapLibre on open-cleared `v0.2.0`; public Pages gated on `public_ready`. | [app/](app/README.md) |

## Map

### Root

| Path | Holds |
| --- | --- |
| [README.md](README.md) | Entry; only status table |
| [CONTRACT.md](CONTRACT.md) | Commissioning / day facts stub |
| [prd-cambodia-blue-carbon-seed-fund-scoping.md](prd-cambodia-blue-carbon-seed-fund-scoping.md) | Plan of record |
| [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) | Agent / beads workflow |
| [docs/](docs/) | Modular docs pack |
| [outputs/](outputs/) | Four internal notes + cover; [qgis-bridge/](outputs/qgis-bridge/) Phase 0 pack |
| [delivery/open-cleared/](delivery/open-cleared/) | Versioned GO±CAUTION GeoJSON for MapLibre (no FLAG rasters; `public_ready` gated) |
| [app/](app/README.md) | Phase 1 LKA-small console (Vite + PatternFly 6 + MapLibre) |
| [config/bundle-versions.json](config/bundle-versions.json) | Open-cleared bundle pin for the app |
| [inputs/](inputs/) | Source PDFs/txt, desk-checks, `screen-layers/` |
| [intermediate/](intermediate/) | Research, gates, red-team paths; `screen-build/` |
| [red-team/](red-team/) | Docs-pack red team (assembled + verdict) |
| [related/](related/) | Adjacent Cambodia artifacts (not T3 core) |

`RAG/`, `visualizations/`, `archive/` appear only when a file needs them.

### docs/

| Path | Holds |
| --- | --- |
| [docs/README.md](docs/README.md) | Index + read order |
| [01-overview.md](docs/01-overview.md) | Purpose, audience, contract, out of bounds |
| [02-policy-notes.md](docs/02-policy-notes.md) | Notes 1/2/3/3b gates and reading order |
| [03-restoration-screen.md](docs/03-restoration-screen.md) | How to read the screen; cases A–C |
| [04-data-and-licences.md](docs/04-data-and-licences.md) | Staging paths, V/U/FLAG rules |
| [05-build-pipeline.md](docs/05-build-pipeline.md) | Scripts, phases, session discipline |
| [06-related-artifacts.md](docs/06-related-artifacts.md) | Work outside / copied into `related/` |
| [07-migration.md](docs/07-migration.md) | Cut list; what lifts vs stays on disk |

### outputs/

| Path | Holds |
| --- | --- |
| [outputs/README.md](outputs/README.md) | Cover + reading order |
| [01-…](outputs/01-seed-fund-country-package-blue-carbon.md) | Note 1 — Seed Fund / blue carbon entry |
| [02-…](outputs/02-blue-carbon-in-redd-plus-two-tracks.md) | Note 2 — REDD+ two tracks |
| [03-…](outputs/03-blue-carbon-project-selection-feasibility-framework.md) | Note 3 — Selection / feasibility |
| [03b-…](outputs/03b-restoration-potential-screen-method.md) | Note 3b — Screen method + layer IDs |

### inputs/

| Path | Holds |
| --- | --- |
| `ci-cambodia-2026-policy-finance-report.txt` | June 2026 CI report extract (Notes 1–2) |
| `goldstein-2020-irrecoverable-carbon.pdf` | Irrecoverable carbon paper |
| `cambodia-article-6-2-initial-report-*.pdf` | Art. 6.2 initial report |
| `vcs-1748-*` | Southern Cardamom VCS boundary + progress ack |
| [desk-checks/](inputs/desk-checks/) | ENR Code, PA Law, ClientEarth, Verra announce |
| [screen-layers/](inputs/screen-layers/) | Layer staging (gitignored binaries; see below) |

#### inputs/screen-layers/ (by Note 3b ID)

Upstream / stage folders (rasters usually gitignored):

| Path | Holds |
| --- | --- |
| `L1/` | GMW v4.1.12 coastal tiles |
| `L2/` | GMW v3.0 1996 baseline |
| `L3/` | GMW habitat mask v28 |
| `L4/` | Goldberg mangrove loss drivers (KHM) |
| `L5/` | Global coastal aquaculture ponds |
| `L12/` | DeltaDTM coastal elevation |
| `L13/` | FES2022 tide heights + elevation-check viz |
| `L14/` | GEBCO coastal subset |
| `L15/` | UNEP-WCMC seagrass (INTERNAL) |
| `L17/` | WDPA/WDOECM Cambodia (permit/STOP next) |
| `L18/` | Ramsar Cambodia extract |
| `L19/` | MoE forest-cover materials (digital GIS closed) |
| `L20/` | Admin / four coastal provinces |
| `L8_L11_10m/` | GEE built-up / intertidal exports |
| `L_Jiang_ponds/` | Jiang aquaculture pond polygons |
| `L_Clark_aquaculture/` | Clark land-cover / ponds (**FLAG**) |
| `L_Peng/` | Peng 10 m seagrass tile |
| `L_ponds_10m/` | Step 2 derived ponds + QA |
| `L_mangrove_10m/` | Step 1 historic/current mangrove + QA |
| `L_class_10m_firstpass/` | Step 3 first-pass class |
| `L_class_10m/` | Step 3 class raster + case A–C viz |
| `CHECKSUMS-phase0-partial.txt` | Partial Phase 0 checksums |

GEE-only / often no folder: L6, L7, L9, L10, L11, L16 (see Note 3b §3 + licence register).

### intermediate/

| Path | Holds |
| --- | --- |
| `research-*.md` | Programme, REDD+, scoping-framework desk research |
| `discussion-brief-*.md` | Session briefs / close-out |
| `path-{a–d}-*` | Per-note red-team packs, verify logs, helpers |
| `consistency-log.md` | Cross-note consistency pass |
| `verify-log-research-files.md` | Research-file verify log |
| [screen-build/](intermediate/screen-build/) | Fetch/process scripts, licence register, SESSION-LOCK |

#### intermediate/screen-build/ (primary)

| Path | Holds |
| --- | --- |
| [SESSION-LOCK.md](intermediate/screen-build/SESSION-LOCK.md) | Active claim / closed steps |
| [phase-0-licence-register.md](intermediate/screen-build/phase-0-licence-register.md) | Living V/U/FLAG register |
| [phase-0-downloads.md](intermediate/screen-build/phase-0-downloads.md) | Download click-list |
| `phase-0-idn-mmaf-gmw-gebco.md` | IDN/GMW/GEBCO staging notes |
| `fetch_*` / `export_*` / `process_*` | Layer fetch and Step 1–3 processors |
| `prompt-*.md` | Operator prompts for build steps |
| `websearch-*-aquaculture-pond-maps-*.md` | Pond-map source search notes |

### red-team/ · related/

| Path | Holds |
| --- | --- |
| [red-team/cambodia-product-docs.md](red-team/cambodia-product-docs.md) | Assembled docs draft |
| [red-team/cambodia-product-docs-pack.md](red-team/cambodia-product-docs-pack.md) | Pack brief |
| [red-team/…-red-team-2026-11-23.md](red-team/cambodia-product-docs-red-team-2026-11-23.md) | Verdict (revise; fixes applied once) |
| [related/moe-roadmap-letter/](related/moe-roadmap-letter/) | MoE blue carbon roadmap letter (md/docx + compile) |

## Quick links

- Notes reading order → [outputs/README.md](outputs/README.md)
- Screen how-to-read (A–C) → [docs/03-restoration-screen.md](docs/03-restoration-screen.md)
- Licence register → [phase-0-licence-register.md](intermediate/screen-build/phase-0-licence-register.md)
- Migration / data handling → [docs/07-migration.md](docs/07-migration.md)

## Audience

Primary reader: Jordan Gacutan (working material). Relay to CI Cambodia / CI Blue Climate; do not forward verbatim. Build on CI Cambodia June 2026 report; do not correct its tone. Jurisdiction working assumption: mangroves in PAs → MoE; ARR outside → GDF (ex-FiA) under MAFF. Rules: PRD §2.0 · [docs/01-overview.md](docs/01-overview.md).

Standalone root since 23 Nov 2026 (from CI Engagement D11 T3). Former host stub may still point here; beads may retain `CI_Blue_Carbon_ASEAN-` IDs until fully local.
