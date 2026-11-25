# Module — Lessons from NSW LIIP for the screen console

**Date.** 24 Nov 2026. **Audience.** Jordan. **Status.** Advisory. This note does not change the screen, the pin, or the licence gate.

**Correction, 25 Nov 2026.** The pack table below says this pin is class 4 and class 8 only, and that elevation and converted cannot run. That is stale. `v0.3.0` includes class 5, and `elevation_fail` is filled. The panel assessment and the design to build are in [11-screen-panel-design.md](11-screen-panel-design.md). The structural lessons in this note still stand.

**Prerequisites.** [01-overview.md](01-overview.md), [03-restoration-screen.md](03-restoration-screen.md), [../app/README.md](../app/README.md). Bundle authority is [`../config/bundle-versions.json`](../config/bundle-versions.json) and [`../delivery/open-cleared/v0.3.0/README.md`](../delivery/open-cleared/v0.3.0/README.md), not the status table in the root README (that table still describes `v0.2.1`).

**Compared with.** NSW LIIP as built: `docs/reporting-user-journey.md`, `docs/filter-registry.md`, `app/src/liip/registry/doors.ts`, `app/src/liip/ui/headlineCopy.ts` in `nsw-dcceew-liip`.

The console already carries LIIP's honesty rules. What transfers is structure: one map, controls that match the open-cleared pack, and a sentence that travels with the number. PatternFly stays. The NSW visual system does not move.

## The pack is narrower than the shell

Open-cleared `v0.3.0` ships class 8 (GO: open or accreted land) and class 4 (CAUTION: tidal flat), with `public_ready=true`. Cases A and C are in the pack. Case B is omitted because class 2 is not in it.

The console still runs five hash pages and five hold-back drivers. On this pin, three of those drivers cannot change the map:

| Driver | Catalogue status | What `v0.3.0` can do |
| --- | --- | --- |
| Tidal / hydroperiod | live | Class 4 is in the pack. This filter can run. |
| Elevation / suitability | stub | `driversForFeature` never assigns it. DeltaDTM vs FES2022 is not vectorised here. |
| Converted / pressure | stub | Fires only for class 5 or 7. Those classes are not in this pack. |
| Tenure / legal | partial | Runs only when a permit-gate or legal-STOP hit is actually joined. Legal STOP stays unavailable until MoE core zones. |
| VERRA / project overlap | partial | Staged VCS 1748 / 5071 / 5584 overlays + attribute join; non-commercial research (`redistributable=false`). |

LIIP's rule: a control sits on the face only when the row is live or partial. A missing layer stays visible as not assessed, with the source that would make it run. It is not drawn as a selected filter.

## Where the shell sends the reader

From [`../app/src/flow/steps.ts`](../app/src/flow/steps.ts). Home says the steps are views, not gates. The rail still marks earlier steps done.

| Step | Route | What the reader is sent to do | LIIP equivalent |
| --- | --- | --- | --- |
| 1 Frame | `#home` | Read the product ceiling, then pick a step | Door arrival, one sentence |
| 2 Locate | `#change` | A second map: mangrove loss and an urban proxy | Context layers on the same map |
| 3 Read | `#map` | Filter, click, inspect, shortlist | The workspace itself |
| 4 Means | `#cases` | Case stories. A and C in this pack | A preset that lands the view |
| 5 Act | `#licence` | Licence and evidence register | Methods page, not the action |

## Bring across

### 1. One map workspace

Keep Frame as a short arrival. Put change overlays, the class map, case bookmarks, inspect and the shortlist on one canvas. About and Licence stay reference pages. They stop being steps 4 and 5.

The rail can remain as cues. Visiting a page is not the same as finishing a decision, so the check marks should go.

### 2. A face that matches `v0.3.0`

Working controls on this pin are class 8, class 4, and any permit context that is actually joined. Elevation, converted and VERRA stay in the panel as not assessed. Each row keeps the source sentence already written in `CAUTION_DRIVERS` (`app/src/lib/cautionDrivers.ts`).

When a later pack adds class 5, class 7, elevation or project boundaries, the same row moves from stub to live. The label does not get a second spelling in the legend.

### 3. One sentence for the settled view

The banner defines GO once. After that the map is colour and hectares, and the home lead still says "restoration potential". Note 3b and [03-restoration-screen.md](03-restoration-screen.md) already call the screen a land-cover proxy.

LIIP builds the headline from fixed phrases: place, what was applied, the count, and what the count is computed from. No score, no rank, no readiness label.

Shape to write under the map, from phrases a person has approved:

> Koh Kong. Class 8, historic mangrove now open cover. N hectares. Worth a field look. Elevation and legal STOP not assessed. Bundle v0.3.0.

Use the same sentence in the inspect drawer. Drop "restoration potential" from the home lead.

### 4. One membership in the map, the drawer and the file

Driver toggles live in page state. The shortlist is a separate list in local storage. A shared link reopens a case id only (`#map?case=`).

The CSV already keeps three states through `flagLabel`: `Known flag`, `No known flag`, `Not fully checked`. It does not carry the bundle version or the GO sentence. A file that leaves the console without those two lines will be read as a site list.

Put the version, the class rule and the claim ceiling in the CSV header and in the GeoJSON properties. Write province and driver state into the hash so a link reopens the same view.

### 5. Cases as presets

Case A and Case C should fly the map and open the rule sentence in the drawer. LIIP presets set filters, camera and caption together, and the map names the prepared view.

Case B (open water overriding first-pass mangrove) is the rule-order lesson in [03-restoration-screen.md](03-restoration-screen.md). This pack leaves it out. Say that in the drawer, in the same place as A and C, so the omission is part of the reading.

### 6. Act is the next check. Licence is methods.

Step 5 currently opens the licence panel. The export stays on the map, so the reader leaves the patches at the moment of action.

LIIP next actions name the check. They do not change which records are in the result. Methods are a separate page.

Beside the shortlist, keep a fixed list of what this screen does not hold, each with its custodian:

| Check | Custodian / source | On `v0.3.0` |
| --- | --- | --- |
| Hydrology and natural recruitment on flats | Note 3b class 4; Murray Global Intertidal Change | The CAUTION reading. Not a planting clearance. |
| Elevation against highest astronomical tide | L12 DeltaDTM vs L13 FES2022 | Not vectorised. Not assessed. |
| MoE core zone | MoE protected-area core zones | Unavailable. Do not infer from IUCN category. |
| Tenure willingness | Outside this screen | Not held. |
| Carbon outcome | Outside this screen | Not held. Do not report tonnes. |

The licence register stays one click away. It is no longer step 5.

## Already in place

Keep these. They are the LIIP pattern in this console.

| Piece | Where | What it already does |
| --- | --- | --- |
| Product banner | `app/src/App.tsx` | GO means worth a field look. Physical / land-cover only. |
| Class meanings | `app/src/lib/classMeaning.ts` | Each class restates the ceiling in the inspect text. |
| Evidence and illustrative badges | `app/src/common/Evidence.tsx` | A figure wears its evidence class. `public_ready=false` stays labelled illustrative. |
| Three-state flags | `flagLabel` in `app/src/lib/bundle.ts` | Null is `Not fully checked`, not a pass. |
| Driver catalogue | `app/src/lib/cautionDrivers.ts` | One row: id, label, holds-back sentence, source, live / partial / stub. |
| Public artifact boundary | open-cleared bundle, Pages workflow | FLAG rasters, WDPA geometries and INTERNAL case PNGs stay out. |

Read the legend, the inspect drawer and the CSV from the driver row. Do not grow a second vocabulary beside it.

## Leave in NSW

| LIIP piece | Why it stays there |
| --- | --- |
| Four doors (government, investor, landholder, atlas) | Cambodia has one reader task: a physical screen for seed-fund scoping, relayed to CI. The MoE / GDF split is context. If a second reader needs a view, give that view a claim ceiling on the same class map. Do not add an investor door or a readiness label. |
| Parcel bitsets and statewide scale | This screen is four coastal provinces and a class raster. |
| NSW tokens, masthead and component JavaScript | PatternFly 6 is the right shell for this console. Take the habits only: sentence case, one noun, a skip link, a live region when the count changes, and errors that say what failed and how to fix it. |
| Seven-module evidence report | The artefact people will forward is a shortlist plus a method note. Four blocks are enough: what was screened, what the screen shows, what it does not hold, what to check next, with the version pin. Same blocks in the drawer and the file. |

## Nouns

LIIP found one count named three ways and kept a single word. This console mixes patch, cell, site, polygon and class.

| Use | For |
| --- | --- |
| Patch | The polygon a person clicks, shorts and exports. |
| Class | The Note 3b rule (class 8, class 4), and only then. |
| GO | Worth a field look. Same words in the banner, the drawer, the headline and the file header. |

## Order of work

1. Match the map face to `v0.3.0`. Stub drivers stay visible as not assessed. They do not look selected.
2. Collapse Locate, Read and Means onto the map. Keep the rail as cues.
3. Write the settled sentence under the map, then copy it into the CSV header and the GeoJSON.
4. Put the next-check list beside the shortlist. Leave the licence register as a register.

## Sources

| Fact | File |
| --- | --- |
| Pin `v0.3.0`, `public_ready=true`, class 8 and 4 | [`../config/bundle-versions.json`](../config/bundle-versions.json), [`../delivery/open-cleared/v0.3.0/README.md`](../delivery/open-cleared/v0.3.0/README.md) |
| Five steps and their routes | [`../app/src/flow/steps.ts`](../app/src/flow/steps.ts), [`../app/src/pages/HomePage.tsx`](../app/src/pages/HomePage.tsx) |
| Driver status and the elevation gap | [`../app/src/lib/cautionDrivers.ts`](../app/src/lib/cautionDrivers.ts) |
| Shortlist columns and three-state export | [`../app/src/lib/shortlist.ts`](../app/src/lib/shortlist.ts), `flagLabel` in [`../app/src/lib/bundle.ts`](../app/src/lib/bundle.ts) |
| Case B omitted from this pack | [`../delivery/open-cleared/v0.3.0/README.md`](../delivery/open-cleared/v0.3.0/README.md) |
| How to read A, B and C | [03-restoration-screen.md](03-restoration-screen.md) |
| LIIP: views, not a wizard; no score or readiness label | `nsw-dcceew-liip` `docs/reporting-user-journey.md` |
| LIIP: one catalogue row; face only if live or partial | `nsw-dcceew-liip` `docs/filter-registry.md`, `app/src/liip/registry/doors.ts` |
| LIIP: headline from authored fragments | `nsw-dcceew-liip` `app/src/liip/ui/headlineCopy.ts` |
