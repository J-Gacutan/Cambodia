# Brief: Folding Goldstein et al. 2020 into Note 1 (2026-11-20)

**Goal:** Correct Note 1's irrecoverable-carbon entry point now that Goldstein et al. 2020 has been read in full, and close the Goldstein follow-up issue.
**Scope:** In: `outputs/01-seed-fund-country-package-blue-carbon.md` (section 4 irrecoverable-carbon row and paragraph, the bottom line where it touches seagrass, Gaps table, Status line); `intermediate/path-a-verify.md` (new Goldstein trace rows); bead `ywdp.6`. Out: the CI letter corrections (`ywdp.5`, owned by the coordinating session); a call script; Notes 2, 3, 3b.
**Constraints:** Path A file ownership only. House-style check must still pass (em-dash lines [], emoji 0, words 1,500-2,300, required headings, no tool names). Cite Goldstein by page, table and figure.
**Deliverable:** Revised Note 1 plus verify log, committed by pathspec and pushed on `d4-scope-refinement`.

## Decisions

- **Seagrass line: upgrade, keep the caveat.** Both papers include seagrass soil (Goldstein Table 1 and Table 2; Noon Table S12), so "weaker case" is dropped. Noon's point that seagrass soil loss after conversion is "uncertain" stays, and mangrove remains the stronger case (Goldstein: 335 t C/ha irrecoverable, more than 70 per cent in soil, second only to tropical peat at 450). User chose the recommended option.
- **Goldstein PDF stays local.** It is a paywalled article, so it is filed at `inputs/goldstein-2020-irrecoverable-carbon.pdf` but not staged or pushed. The note cites the DOI.
- **Re-gate: concept-validity lens plus one director pass**, on the revised section 4 only. No full red-team re-run.
- **Next: update the note, verify log and gaps table, close `ywdp.6`, commit only Path A files and push.**

## Defaults in effect

- Goldstein figures are cited as global averages, labelled global, alongside Noon's; no Cambodian figure is implied.
- The Peru application pack and the DCC consultant listing remain open gaps; neither is in Downloads.
- If the concept lens raises a major, it is fixed once, and the director pass follows. Nothing loops.
