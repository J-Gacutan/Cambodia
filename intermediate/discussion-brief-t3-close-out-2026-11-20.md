# Brief: D11 T3 close-out (2026-11-20)

**Goal:** Bring T3 to a state ready for Jordan's internal sign-off (PRD 9.0 step 5): four reconciled notes, a cover README, triaged follow-ups and committed working files.
**Scope:** In: cross-note consistency pass on Notes 1, 2, 3 and 3b; `outputs/README.md`; D11 README update for T3; desk fixes ywdp.10 and ywdp.5; fold Note 2 findings into ywdp.7; triage of the other open T3 issues; committing the untracked T3 working files except `inputs/`. Out: talking points or any CI-facing material; Word compile; manual browser checks (ywdp.11, ywdp.6); the screen build (ywdp.8); licence research (ywdp.9); outreach of any kind.
**Constraints:** Desk-based. Project house style (UK spelling, em dashes only in headings and bullet labels, no icons, plain markdown). Settled PRD decisions and each note's gated positions are not relitigated; the pass reconciles, it does not redesign. Stage files by name only.
**Deliverable:** Edited notes in `T3/outputs/`, `outputs/README.md` (two or three lines per note, reading order, gates run), `intermediate/consistency-log.md`, an updated D11 README, and one commit pushed to `d4-scope-refinement`.

## Decisions

- **Next steps = close out T3**, because the user chose close-out over call preparation or Note 2 follow-ups alone.
- **This session is the coordinator** and may edit the D11 README, `outputs/README.md`, the PRD, `intermediate/*` and the notes. The user ruled this; collision checks below still apply.
- **Commit the PRD, research files, verify log and discussion briefs; keep `inputs/` uncommitted**, because the CI report extract is CI's document and its PDF already sits in D6 inputs.
- **Leave the pushed `.beads/issues.jsonl` as is** and note it in the close-out record; bd syncs overwrite it.
- **Consistency pass fixes in place**, logging every change (note, line, before, after, source) in `intermediate/consistency-log.md`.
- **Follow-ups:** fix ywdp.10 and ywdp.5; update ywdp.7 with Note 2's findings (Operations Manual not revised; NDC 3.0 labels U, C and U/C; adaptation measure 8 question); leave ywdp.6, .8, .9 and .11 open with notes.
- **Gates:** a verify pass on every fact changed in the consistency pass, then one director gate on the four notes as a set. No new red team, because each note already passed its own.
- **D11 README updated** with T3 outputs, gates and open follow-ups.

- **Supersedes `discussion-brief-t3-next-steps-2026-11-20.md`**, because the user ruled this session runs the pass. That brief's decisions carry over:
  - Soften Note 2's seagrass link to Note 3b: Note 3b's seagrass analogue is restricted (flags known meadows and documented loss only, never go), and a seagrass baseline map needs its own survey-based work under Track B. Note 3b is not expanded.
  - Note 3's screen summary must match Note 3b's ten classes and five flags as committed in `62c4a67`; where they differ, Note 3 changes, not Note 3b.
  - Per-note word ceilings from PRD 8.0 apply; Note 3b is at about 2,996 of 3,000 and cannot grow.
  - The screen build (ywdp.8) stays parked as a candidate Seed Fund Phase 1 activity.
  - Each note's Status line must name its gates, and the README's gate line reports them as recorded in each note.
- **Other T3 sessions may still be live** (Path A Goldstein brief, Path C commit `5199efd`). Before editing each note, check `git status` and the file's last commit; if it has uncommitted changes from another session, log it and skip that note.

## Defaults in effect

- The consistency pass checks shared facts (FRL scope and period, Operations Manual wording and dates, NDC 3.0 labels, extents such as 58,852 ha mangrove and 13,890 ha seagrass, Seed Fund phases), terminology against `UBIQUITOUS_LANGUAGE.md`, cross-note links and filenames, and CI report printed-page cites. Where two notes disagree, the version traced at source wins; if neither has been traced, the pass traces it.
- Where a reconciliation would change a gated position rather than a fact or term, the pass logs it as an open item for Jordan instead of editing.
- The director gate returns SHIP, REVISE (at most five fixes, applied once) or STOP, and does not loop.
- Model per phase: cheapest tier for mechanical extraction of shared facts, mid tier for tracing, the session model for the director gate.
