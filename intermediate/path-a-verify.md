# Path A verify log: Note 1 (01-seed-fund-country-package-blue-carbon.md)

Verify pass, 20 November 2026. The note has 11 factual table rows carrying V/U marks (8 in section 4, 3 in section 6). Rule: at least 5 rows or 20 per cent, whichever is more, so 5. Traced: 9 rows, plus the section 2 Seed Fund bullets. Each was re-opened at source in this pass. No email address was sent to any service. Nobody was contacted.

CI Cambodia report pages are PRINTED pages, checked against the original PDF (`../../D6 - Pre-COP31 Negotiator Webinar/inputs/policy-finance-analysis-and-stakeholder-mapping-final-report-external-sharing.pdf.pdf`) with pdftotext page by page, reading the printed number at the page foot. The helper `path-a-pagegrep.py` maps lines of the `.txt` copy to printed pages and skips footnote markers.

| # | Note row | Source re-opened | What the source says | Verdict |
|---|---|---|---|---|
| 1 | S4 Mangroves are forest | CI report PDF p. 21 = printed p. 12 | "As mangroves are classified as a type of forest under the 2002 Forestry Law, they fall under the jurisdiction of RTF"; next page: RGC "transferred institutional responsibility for REDD+ to the MoE" | CONFIRMED |
| 2 | S4 Irrecoverable carbon | Noon et al. 2022, nature.com full text and Supplementary Information (MOESM1) | Methods p. 43: mangrove SOC 0-100 cm from Sanderman et al.; seagrass and salt marsh default 108 and 255 Mg C/ha. Table S12: Mangroves 0.15 / 3.01 / 3.15 Gt C, mean 217.87 Mg C/ha; Seagrass 0.00 / 1.53 / 1.53, mean 52.25; Tropical peat mean 192.73. Main text p. 39 "mangroves and tidal wetlands globally (4.8 Gt)" = 3.15 + 0.15 + 1.53 = 4.83. Licence CC BY 4.0 on the article page. Goldstein et al. 2020: see addendum rows G1-G5 | CONFIRMED (Noon). Goldstein: see addendum |
| 3 | S4 NDC 3.0 measure 40 | NDC 3.0 PDF p. 36 = printed p. 26 | Measure 40 ANR text: "sustainable management of forest and other resources including blue carbon habitats"; MoE with MAFF/FA/FiA | CONFIRMED |
| 4 | S4 NDC 3.0 measures 49 and 50 | NDC 3.0 PDF p. 51 = printed p. 41 | Measures 46-53 on page; "mangrove forests, seagrasses, coral reefs and oysters"; OECMs | CONFIRMED |
| 5 | S4 NDC 3.0 adaptation measure 8 | NDC 3.0 PDF pp. 105-106 = printed pp. 95-96 | "6,120 ha (30%)" (p. 95), "4,167 ha (30%)" (p. 96) | CONFIRMED (baseline reconciliation not re-checked; note keeps the caveat) |
| 6 | S4 NBSAP Target 3 | NBSAP 2026 executive summary PDF pp. 17, 24 | p. 17 Target 3: "at least 10% of marine and coastal areas are conserved by the PA system and other effective area-based conservation measures (OECMs)". The quote "coastal mangrove and seagrass restoration linked to livelihoods and emerging blue carbon opportunities" is at p. 24 under **Target 11**, not Target 3 | DIFFERS. Fixed in the note: row now reads "Targets 3 and 11" with both locators. The source table in `../../intermediate/ci-letter-moe-cambodia-blue-carbon-roadmap.md` (row at line 57) attributes the quote to Target 3; flagged for the coordinating session |
| 7 | S4 Koh Kapik Ramsar Site | CI report PDF p. 12 = printed p. 3 | Text names "the Koh Kapik Ramsar Site"; Table 2 (MoE 2024): "Koh Kapi Ramsar Site (the Ramsar Site overlaps with Peam Krasop Wildlife Sanctuary)", 14,029 ha, mangrove N/A, Koh Kong | CONFIRMED |
| 8 | S6 UNDP BioFin | CI report printed pp. 12 and 20 | p. 12: "assisting the Department of Biodiversity of MoE in integrating the development of a national blue carbon roadmap into the 2026 BioFin workplan". SWOT "plans to develop a Blue Carbon Roadmap" is on PDF p. 29 = printed p. 20 | CONFIRMED. The CI letter file cites the SWOT line as p. 19; it is p. 20 (flagged) |
| 9 | S6 Fauna & Flora and IBCI study; CI report recommendations | CI report printed pp. 12, VI-VII, 46, 48 | p. 12: "In early 2026, F&F is partnering with the International Blue Carbon Institute (IBCI) to carry out a blue carbon feasibility study that encompasses both mangroves and seagrasses". p. 46 (PDF 55): ToR revision of RTF, RTS and Technical Teams for seagrass. p. 48 (PDF 57): "Design a project to mobilize funding to support capacity building for a carbon stock assessment and the development of an integrated, centralized, and harmonized national blue carbon map" | CONFIRMED |
| S2 | Seed Fund bullets | seedfundfornature.org /our-work, /countries/cambodia, /grants, /about-the-seed-fund, TFFF insight (10 Nov 2026); CI launch release (11 Dec 2023); FCLP annex PDF pp. 5-6 | Phases, four Phase 2 areas, safeguards "stakeholder engagement, gender inclusion and grievance mechanisms", "up to € 8M", "Design phase", FCLP Cambodia sentence all as quoted | CONFIRMED. One correction: "government designed and led" (PRD, research file) is not on https://forestclimateleaders.org/news-and-resources/country-packages/ (read 20 Nov 2026); the annex wording "Country-Led ... full government ownership" (PDF p. 5) is used instead |

## Addendum, 20 November 2026: Goldstein et al. 2020 full text

The user downloaded the article; it is filed locally at `../inputs/goldstein-2020-irrecoverable-carbon.pdf` and is not committed (paywalled). Journal pages 287-295 = PDF pp. 1-9 (PDF p. 3 = p. 289, PDF p. 4 = p. 290, checked on the page headers).

| # | Note row | Location | What the source says | Verdict |
|---|---|---|---|---|
| G1 | S4 Irrecoverable carbon: ecosystems covered | p. 288 (PDF p. 2) text and Table 1 | Typology "adjusted to include all major marine, freshwater and coastal ecosystems"; data on "mangroves, seagrasses and tidal wetlands". Table 1 rows: Mangroves 145 / 502 / 7.3 / 0.13%; Seagrasses 450 / 111 / 5.0 / 0.95%; Marshes 210 / 265 / 5.6 / 0.25% | CONFIRMED: seagrass and marshes are covered. The earlier "seagrass not named" (abstract only) is withdrawn |
| G2 | S4 definition, three tests | p. 289 (PDF p. 3) | Irrecoverable carbon is carbon "that (1) can be influenced by direct and local human action, (2) is vulnerable to loss during a land-use conversion and (3), if lost, could not be recovered within specified timeframe (t)"; t = 30 years | CONFIRMED |
| G3 | S4 mangrove density | p. 290 (PDF p. 4) | "Aside from tropical peatlands, mangroves have the highest density of irrecoverable carbon (335 t C ha–1), more than 70% of which is in soils"; tropical peatlands "450 t C ha–1" | CONFIRMED |
| G4 | S4 recovery times | p. 290, Table 2 | "Estimated time to full carbon recovery following" conversion (years): Seagrasses 93; Mangroves 153; Marshes 64 | CONFIRMED |
| G5 | S4 mangrove vulnerability (shrimp ponds) | p. 289 (PDF p. 3) | "mangrove conversion to shrimp ponds leads to loss of about 80% of the SOC within 1 m" | CONFIRMED |

Not traced in this pass: S4 TFFF row beyond the Seed Fund post; Annex lines (GCF and GMA, carried from `research-programme-candidates.md` with their V/U marks).

## For the coordinating session (files Path A does not own)

1. `../../intermediate/ci-letter-moe-cambodia-blue-carbon-roadmap.md` line 57: the NBSAP blue carbon quote belongs to Target 11 (exec summary PDF p. 24), not Target 3. Line 18: the SWOT Blue Carbon Roadmap line is printed p. 20, not p. 19.
2. `prd-cambodia-blue-carbon-seed-fund-scoping.md` section 2.0 and `intermediate/research-programme-candidates.md` section 2.1: "government designed and led" is not on the cited FCLP page. Suggest the FCLP annex wording.
