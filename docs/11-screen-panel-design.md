# Module — Screen panel design

**Date.** 25 Nov 2026. **Audience.** Jordan. **Status.** Advisory. This note does not change the screen, the pin, or the licence gate.

**Prerequisites.** [01-overview.md](01-overview.md), [03-restoration-screen.md](03-restoration-screen.md), [10-lessons-from-nsw-liip.md](10-lessons-from-nsw-liip.md), [../app/README.md](../app/README.md).

**Authority for what the pack holds.** `delivery/open-cleared/v0.3.0/manifest.json` and a direct count of `delivery/open-cleared/v0.3.0/layers/go-caution.geojson` on 25 Nov 2026 (5,165 features). The bundle README and the pack table in module 10 both say classes 4 and 8 only. That is stale. The manifest and the file include class 5, and `elevation_fail` is filled on every feature.

**Compared with.** NSW LIIP as built: one catalogue row, a face only when the row can run, a headline with nothing live above it, presets that set the view together. PatternFly stays. The NSW masthead, tokens, and four doors do not move.

## What the panel does today

The layers drawer in `app/src/pages/MapPage.tsx` is open by default, inline, on the start edge, about 20rem wide. To its right is the map (`min(70dvh, 40rem)`). To the right of that is a second column, Click inspect. Above all three sit a title, the GO banner, a helper line, the first-visit coach, and the case toggles. The step rail sits above the page.

Inside the drawer, top to bottom:

1. Legend (GO, five CAUTION drivers, Ramsar/WDPA, VERRA).
2. Drawn layer, with Show GO and Show CAUTION.
3. Hold-back drivers: five checkboxes, all checked on arrival, each labelled with `driverStatusLabel`.
4. Phase 2 flag filters: hide permit hits, hide STOP (legal) hits, hide VERRA hits, and Shortlist-ready.
5. Flag overlays: show VERRA boundaries, show Ramsar context, per-layer toggles.
6. Shortlist, with CSV and GeoJSON export.

The on-canvas key repeats GO, tidal, elevation, and converted, and is `aria-hidden`. Tenure and VERRA are not on that key.

`app/src/lib/cautionDrivers.ts` marks tidal, elevation, and converted as `live`, and tenure and VERRA as `partial`. The checkbox label adds "On map · painted" for live and partial. The info popover says a live driver is painted when it is the primary hold-back.

## Assessment against the file

Counted from `go-caution.geojson`. Hectares rounded to the nearest hectare.

| Class | Patches | Hectares | Suitability in the file |
| --- | ---: | ---: | --- |
| 4 tidal flat | 261 | 2,548 | All CAUTION |
| 5 converted | 3,674 | 19,767 | All CAUTION |
| 8 open or accreted | 1,230 | 3,405 | 1,038 GO (3,022 ha). 192 CAUTION (384 ha), every one with `elevation_fail` true |
| Total | 5,165 | 25,721 | 1,038 GO, 4,127 CAUTION |

Provinces: Koh Kong 3,890, Preah Sihanouk 919, Kampot 228, Kep 128.

| Attribute | True | False | Null |
| --- | ---: | ---: | ---: |
| `elevation_fail` | 1,007 | 4,158 | 0 |
| `permit_gate` | 2,831 | 2,334 | 0 |
| `project_overlap` | 608 | 4,557 | 0 |
| `stop_legal` | 0 | 0 | 5,165 |
| `primary_driver` | absent on every feature | | |

`elevation_fail` true is not only the 192 demoted class 8 patches. It is also true on 790 class 5 patches and 25 class 4 patches. Those stay CAUTION because the class already held them.

The manifest agrees: `classes_included` is GO `[8]` and CAUTION `[4, 5]`, `elevation_fail_features` is 1,007, `public_ready` is true. Cases A and C are in `cases/cases.json`. Case B is absent.

### The driver checkboxes do not filter the pack

Fill, line, and the driver checkboxes all read `primary_driver` (`app/src/map/mapTheme.ts`, and the `setFilter` effect in `MapPage.tsx`). The property is not on the FeatureCollection.

On arrival every driver checkbox is checked, and Show CAUTION is on. The filter keeps a CAUTION patch only when `primary_driver` is one of the five ids. A missing value fails that test. Every CAUTION patch is hidden. The map shows the 1,038 GO patches. Unchecking every driver does the same thing by a second branch: it drops CAUTION outright.

So the panel says tidal, elevation, and converted are painted, the key draws three CAUTION colours, and the coast the reader sees is GO only. Class 4 and class 5 never appear until that filter is removed or the attribute is written.

Paint has the same hole. `driverColorExpr` falls through to the generic CAUTION gold (`#C4A35A`) when `primary_driver` is missing. That gold is also the tidal swatch. Elevation (`#7A8F6A`) and converted (`#A67C52`) are in the key and never used on a fill.

### Three controls for two flags

Tenure and VERRA each appear as a driver checkbox, a hide-hits checkbox, and an overlay button. The driver checkbox cannot match anything. The hide-hits checkboxes can: they test `permit_gate` and `project_overlap`, which are filled. STOP (legal) is a checked-looking checkbox that hides nothing, because `stop_legal` is null on every patch.

Shortlist-ready forces Show GO, clears Show CAUTION, and forces the three hide-hits boxes on, then disables them. It is a mode switch wearing the same checkbox as the rows it overrides.

### What the inspect column gets right

`driversForFeature` does not use `primary_driver`. It assigns tidal from class 4, elevation from `elevation_fail === true`, converted from class 5 or 7, tenure from `permit_gate` or `stop_legal`, and VERRA from `project_overlap`. A click can tell the truth the map cannot paint. The column is easy to miss because the map is short and the drawer is long. Empty state copy still says the details are "not buried in the layers drawer", which is an apology for the split.

### What module 10 got wrong about this pin

Module 10 is right about the shell: one map, stub rows that do not look selected, one sentence, cases as presets, licence as methods. Its pack table is wrong for `v0.3.0` as built. Elevation and converted are not stubs. Class 5 is the largest class in the file. Legal STOP is the row that cannot run. Treat this module as the correction.

## Design

One workspace. The map is the page. The panel is the only column of controls. PatternFly stays. Sentence case. No parenthetical dash. One noun: a **patch** is what a person clicks, keeps, and exports. **Class** is the Note 3b rule. **GO** means worth a field look, and those words are used in the banner, the headline, the drawer, and the file header.

### Frame

| Region | Contents | Height |
| --- | --- | --- |
| Masthead | "Cambodia restoration screen", and one label: Open-cleared or INTERNAL | One compact row |
| Links | About, Licence. Text links, not steps | In the masthead, end side |
| Workspace | Panel and map as two grid columns | The rest of the viewport |

Remove from this page: the step rail, Back and Next, the done ticks and strikethrough, the H1 "Screen map", the helper line, `MapGuide`, and the footer. Frame stays a short arrival at `#home`. Change overlays become layers on this map, not a second map at `#change`. `#cases` and `#licence` stop being steps. `#about` and `#licence` stay as pages.

The map column's top is fixed by the grid. Text in the panel must not change the map's height. Minimum panel width 16rem, default 20rem, resizable. Below 48rem the panel is a drawer over the map, closed until the reader opens Layers.

### Headline

First thing in the panel. Nothing live above it: no eyebrow, no second count, no "Screen map".

The sentence is assembled from fixed phrases, in this order, and only these clauses:

1. Place. "Four coastal provinces", or one province name when a province is selected.
2. What is drawn. The classes and flags actually on.
3. The count. Patches, then hectares, tabular numerals.
4. What the count is. "Counted from bundle v0.3.0. GO means worth a field look."
5. What was not assessed. Only rows whose attribute is null. On this pin that clause is "Legal STOP not assessed."

Arrival, all live rows on, no hides:

> Four coastal provinces. Class 8, class 5, and class 4. 5,165 patches, 25,721 hectares. Counted from bundle v0.3.0. GO means worth a field look. Legal STOP not assessed.

Koh Kong, class 8 only, a shape to approve before it is coded:

> Koh Kong. Class 8, historic mangrove now open cover. N patches, N hectares. Counted from bundle v0.3.0. GO means worth a field look. Legal STOP not assessed.

The same sentence is the first line of the inspect block and the first lines of the CSV and the GeoJSON. A screen reader hears it from one live region, debounced about half a second. The visible sentence is not itself a live region.

Drop "restoration potential" from the home lead. The banner defines GO once, then this sentence carries it.

### Panel order

1. Headline.
2. Place: Four coastal provinces, Koh Kong, Preah Sihanouk, Kampot, Kep. One selection. Default is the four provinces. Choosing a province fits the camera to those patches and narrows every count.
3. Drawn class, the pick-many.
4. Elevation, one narrowing row.
5. Permit and VERRA, narrowing rows.
6. Legal STOP, visible, not a control.
7. Context overlays.
8. Presets.
9. Shortlist and the next checks.

A running total sits in the headline, not as a second "results" strip. Do not repeat the legend as a block of swatches above the rows. Each live row carries its own swatch.

### Row grammar

One catalogue. The row in `CAUTION_DRIVERS` is the only spelling of the label, the holds-back sentence, the source, and the colour. Legend, inspect, popover, and export read that row. They do not grow a second phrase.

Two kinds of row:

| Kind | Combination | Control |
| --- | --- | --- |
| Drawn class | Pick-many. Any selected class is drawn. Empty means no class patches. | Checkbox, default on |
| Narrowing flag | AND. Turning it on removes patches. | Checkbox, default off |
| Not assessed | Shown so the gap is visible. Does not look selected. Does not enter the filter. | Text row, no checkbox |

LIIP's rule, applied here: a control is on the face only when this pack can change the map. A missing layer stays visible as not assessed, with the source that would make it run.

Status text is one of three, and it replaces "On map · painted":

| Status | Words on the row | When |
| --- | --- | --- |
| Live | no status word; the count is the proof | The predicate matches features in this file |
| Partial | "Partial" plus the source that is filled and the source that is not | Some attributes run, one does not |
| Not assessed | "Not assessed" | The attribute is null on every feature, or the class is not in the file |

Counts on a live row are patches and hectares for that predicate inside the current place, before the other narrowing rows. The headline count is after every row. The two numbers answer different questions. The row says how big that hold-back is. The headline says what is drawn now.

### Rows for v0.3.0

Predicates are derived in the client from attributes the file has. Do not filter or paint on `primary_driver` until the bundle writes it. If a later pack writes it, it must use the same predicates, or the panel and the file will disagree.

| Row | Kind | Predicate | On this file | Face |
| --- | --- | --- | --- | --- |
| Tidal flat | Drawn class | `class_id` 4 | 261 patches, 2,548 ha | On. Swatch `#C4A35A` |
| Converted | Drawn class | `class_id` 5 | 3,674 patches, 19,767 ha | On. Swatch `#A67C52` |
| Open or accreted | Drawn class | `class_id` 8 and `elevation_fail` is not true | 1,038 patches, 3,022 ha | On. Swatch `#0099AA`. Label "Open or accreted". The word GO is in the headline, not repeated as a second checkbox called Show GO |
| Elevation | Narrowing | `elevation_fail` is true | 1,007 patches. Of those, 192 are class 8 (384 ha) and are the only class 8 patches that are CAUTION | Off on arrival, so class 8 GO stays visible. Turning it on keeps only elevation failures. Source line: "L12 DeltaDTM against L13 FES2022. Filled on this pack." |
| Permit gate | Narrowing | `permit_gate` is true | 2,831 true, 2,334 false, no nulls | Off on arrival. Label "Hide patches inside a permit gate". Source: "Ramsar and WDPA attributes. A known flag is not a clearance." |
| VERRA overlap | Narrowing | `project_overlap` is true | 608 true, 4,557 false, no nulls | Off on arrival. Label "Hide patches inside a VERRA project". Name the staged ids in the source line: VCS 1748, 5071, 5584. Non-commercial research. |
| Legal STOP | Not assessed | `stop_legal` is true | Null on all 5,165 | No checkbox. "Not assessed. MoE protected-area core zones. Do not infer from an IUCN category." |
| Class 7 ponds | Not assessed | `class_id` 7 | Not in the file | No checkbox. "Not in this pack. Pond geometries stay off the public bundle." |
| Case B | Not assessed | class 2 | Not in the file | Named in the preset list, not as a filter. See Presets. |

Remove these controls. Their jobs move into the rows above.

| Remove | Why |
| --- | --- |
| Show GO / Show CAUTION | Replaced by the class rows. CAUTION is not one bucket. |
| Five driver checkboxes that all start checked | They query an attribute the file does not have, and they hide every CAUTION patch. |
| "Shortlist-ready: GO ∩ no known flag hits" | Becomes the preset "Field look, no known flag hit". A preset sets rows. It does not disable them. |
| Separate "Phase 2 flag filters" heading | Permit, VERRA, and legal STOP are rows in the same list. |

Class 8 with `elevation_fail` true is not in the Open or accreted row. It is drawn only when Elevation is on, and it uses the elevation swatch (`#7A8F6A`). A reader who wants "all historic mangrove that is now open, including sites above the tidal frame" turns on both Open or accreted and Elevation. The headline then says both.

Fill colour, one per patch, in this order: class 4 tidal, class 5 converted, class 8 with elevation failure, class 8 GO. Permit and VERRA do not replace the fill. They are overlays. Recolouring a GO patch purple because it sits in a Ramsar site would hide the physical class.

Generic CAUTION gold is not a paint. Every CAUTION patch in this file is class 4, class 5, or an elevation-demoted class 8, so it has a named colour. If a future patch is CAUTION and matches none of those, paint it with `KEY.notAssessed` and say "CAUTION, driver not named" in the inspect block. Do not reuse the tidal hex for that fallback.

### Context overlays

Below the rows, two overlay switches, default off:

| Switch | Draws | Note on the row |
| --- | --- | --- |
| Ramsar context | Permit context fill and dashed line | Context, not a filter. Turning it on does not change the headline count. |
| VERRA boundaries | Project overlap fill and line | Same. `redistributable` false where the layer says so. |

Per-layer provenance stays on the row as the existing info button. The full licence matrix remains the Licence page, one text link: "Licence and evidence".

### Presets

A preset sets place, rows, overlays, camera, and headline together. The selected preset is named in the headline's place clause ("Peam Krasaop hinterland, Koh Kong"). Copying a link copies the hash, not a separate "Copy bookmark" button.

| Preset | Sets | Camera |
| --- | --- | --- |
| Four provinces | All three class rows on. Elevation, permit hide, and VERRA hide off. Overlays off. | `CAMBODIA_COAST_BOUNDS` |
| Case A | Open or accreted on. Tidal and converted off. Elevation off. | Case A lon, lat, `half_m` 1,500. Place line from `cases.json` |
| Case C | Tidal flat on. Other class rows off. | Case C window |
| Field look, no known flag hit | Open or accreted on. Other class rows off. Elevation off. Hide permit hits on. Hide VERRA hits on. | Unchanged, or fit to what remains |

Case B is a row in the same list, not a camera:

> Case B is not in this pack. It is the open-water override of first-pass mangrove (class 2). The rule order is in Note 3b.

No strikethrough. No tick. An unavailable preset is a sentence, not a disabled button that looks finished.

### Inspect

Clicking a patch writes the selection into the panel under the headline and scrolls the headline into view. The map does not grow a third column. A second click on empty sea clears it.

Block order:

1. The settled sentence for this patch, same phrase order as the panel headline. Example shape: "Koh Kong. Class 8, historic mangrove now open cover. 12.4 hectares. Worth a field look. Elevation and legal STOP not assessed on this patch." Use the class meaning from `classMeaning.ts` for the middle clause. Province from the feature. Hectares to one decimal.
2. Every driver `driversForFeature` returns, each as the catalogue swatch plus the holds-back sentence. If the list is empty and suitability is GO: "No mapped hold-back on this patch. Physical screen only. Not planting permission."
3. Facts, one line each: patch id, class, hectares, province, protected area, legal stop, carbon project. Values for the three flags use `flagLabel` and nothing else: "Known flag", "No known flag", "Not fully checked". Legal stop on this pack is always the third.
4. Instrument or note lines only when the feature has them.
5. Actions: "Add to shortlist" (or "On the shortlist" once added), and "Clear selection".

Do not repeat the status word "On map" next to a driver that just painted. The sentence already said what the patch is.

### Shortlist and next checks

The shortlist is membership the reader chose. It is not a filter, and it does not change the headline count.

Each kept patch is one line: id, class label, hectares to one decimal, province. The line flies the camera to that polygon. Remove sits on the line. Empty: "No patches kept."

Export stays on these rows: CSV, GeoJSON. Clear sits as a text button after them.

The CSV starts with comment lines before the column header, and the GeoJSON `FeatureCollection` repeats them in `properties` of a `meta` object or in collection-level properties the writer already owns:

- bundle version
- the GO sentence: "GO means worth a field look. Physical and land-cover only. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome."
- the class rule for this pack: "Classes 4, 5, and 8. Legal STOP not assessed."
- the headline sentence at the time of export

Columns stay as `shortlistToCsv` writes them today, including the three-state flag labels. Add `bundle_version` as a column so a file that loses its comment lines still carries the pin.

Under the export buttons, a fixed list. These checks do not add or remove patches.

| Check | Source line | On v0.3.0 |
| --- | --- | --- |
| Hydrology and natural recruitment on flats | Note 3b class 4. Murray Global Intertidal Change | The CAUTION reading for class 4. Not a planting clearance. |
| Elevation against highest astronomical tide | L12 DeltaDTM against L13 FES2022 | Filled. A true flag demotes class 8. Still a screen, not a survey. |
| MoE core zone | MoE protected-area core zones | Not assessed. Do not infer from an IUCN category. |
| Tenure willingness | Not held | Not held. |
| Carbon outcome | Not held | Not held. Do not report tonnes. |

Licence stays a text link, not the last step of a rail.

### Hash

`#map` reopens the same view. Write what the panel can change:

`#map?place=koh-kong&class=8&elevation=1&hide=permit,verra&case=A`

| Key | Values | Default when absent |
| --- | --- | --- |
| `place` | `coast`, `koh-kong`, `preah-sihanouk`, `kampot`, `kep` | `coast` |
| `class` | comma list of `4`, `5`, `8` | `4,5,8` |
| `elevation` | `1` on, `0` off | `0` |
| `hide` | comma list of `permit`, `verra` | empty |
| `overlay` | comma list of `ramsar`, `verra` | empty |
| `case` | `A`, `C` | absent |

`case` applies the preset, then the other keys win if they are also present, so a shared link can start from Case A and turn elevation on. Bundle version is not in the hash. It is in the headline and the file, from the loaded manifest.

The shortlist stays in `localStorage` under `khm-shortlist-v1`. A shared link does not carry another person's shortlist.

### Copy the panel may show

Approved shapes. Do not paraphrase them in a second component.

| Slot | Words |
| --- | --- |
| GO, once | GO means worth a field look. |
| Claim ceiling | Physical and land-cover only. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome. |
| Not assessed, legal | Not assessed. MoE protected-area core zones. Do not infer from an IUCN category. |
| Not in pack, ponds | Not in this pack. Pond geometries stay off the public bundle. |
| Case B | Case B is not in this pack. It is the open-water override of first-pass mangrove (class 2). |
| Empty shortlist | No patches kept. |
| Empty map | No patches match these rows. Turn a class back on, or clear a hide. |
| Basemap | Streets names are from OpenStreetMap and imply no position on boundaries. |
| Offline basemap | Reference basemap unreachable. Showing plain sea. |

No uppercase kicker. No exclamation. Numerals from 2. Dates as 25 November 2026 if a date is shown. Errors say what failed and how to fix it: "We couldn't read the bundle. Reload the page. If it still fails, the pin in the footer of About names the file."

### Colour and type inside PatternFly

| Use | Value | Where it already lives |
| --- | --- | --- |
| Open or accreted fill | `#0099AA` | `SUITABILITY.go` |
| Tidal fill | `#C4A35A` | `CAUTION_DRIVERS` tidal |
| Converted fill | `#A67C52` | `CAUTION_DRIVERS` converted |
| Elevation fill | `#7A8F6A` | `CAUTION_DRIVERS` elevation |
| Permit overlay | `#6B4C9A` | `FLAGS.permit` |
| VERRA overlay | `#B85C38` | `FLAGS.project` |
| Not named | `#5C6570` | `KEY.notAssessed` |
| Page ink and chrome | PatternFly tokens | No new hex in `app.css` |

One primary button on the panel: Add to shortlist, and only when a patch is selected. Export CSV is secondary. Everything else is a checkbox, a text button, or a link. Do not paint Back, Next, and every preset in primary blue.

Hectares and patch counts use tabular numerals so a digit change does not move the sentence.

### Arrival, in order

1. Masthead and the two links.
2. Panel headline for the four provinces, all three classes, no hides.
3. Map fitted to the coast, drawing class 4, class 5, and class 8 GO. Elevation-demoted class 8 is off until that row is on.
4. Overlays off.
5. Inspect empty, so the headline and the rows are what the reader sees. The empty inspect sentence is the headline itself, not a second instruction.
6. Shortlist from this browser, if any.

## Build order

1. Stop filtering and painting on `primary_driver`. Derive the class and elevation predicates from `class_id` and `elevation_fail`. Until this lands, the panel hides 4,127 CAUTION patches.
2. Replace the driver checkbox block, Show GO, Show CAUTION, and Shortlist-ready with the rows in the table above. Legal STOP and class 7 stay visible and cannot be ticked.
3. Move the headline to the top of the panel and delete the page head, the coach, and the third inspect column.
4. Add place and the hash.
5. Turn Case A, Case C, and Field look into presets. Write Case B as the missing-preset sentence.
6. Put the version, the GO sentence, and the headline into the CSV and the GeoJSON.
7. Add the next-check list under the shortlist.

Do not wait for a bundle change. The file already has the attributes. Writing `primary_driver` into a later pack is optional, and only if it uses these predicates.

## Sources

| Fact | Where it was read |
| --- | --- |
| 5,165 features. Classes 4, 5, 8. Flag counts. `primary_driver` absent | `delivery/open-cleared/v0.3.0/layers/go-caution.geojson`, counted 25 Nov 2026 |
| Manifest classes, elevation count, product banner, public_ready | `delivery/open-cleared/v0.3.0/manifest.json` |
| Bundle README still says classes 4 and 8 | `delivery/open-cleared/v0.3.0/README.md` |
| Driver status words and colours | `app/src/lib/cautionDrivers.ts` |
| Filter and paint read `primary_driver` | `app/src/pages/MapPage.tsx`, `app/src/map/mapTheme.ts` |
| Inspect predicates | `driversForFeature` in `cautionDrivers.ts` |
| Three-state flag words | `flagLabel` in `app/src/lib/bundle.ts` |
| CSV columns, no version line | `app/src/lib/shortlist.ts` |
| Cases A and C. Case B absent | `delivery/open-cleared/v0.3.0/cases/cases.json` |
| LIIP: one row, face only if it can run, rows narrow | `nsw-dcceew-liip` `docs/filter-registry.md` |
| LIIP: headline from fixed phrases, nothing live above it | `nsw-dcceew-liip` `app/src/liip/ui/HeadlineSentence.tsx` |
| Earlier structural lesson, pack table superseded here | [10-lessons-from-nsw-liip.md](10-lessons-from-nsw-liip.md) |
