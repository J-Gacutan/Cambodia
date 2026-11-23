# First public share — Licence / FLAG go/no-go gate

**Bead.** `khm-i6e.2` (decision). **Date.** 23 Nov 2026.  
**Audience.** Jordan (decide); agents building `khm-i6e.3`–`.5` (obey).  
**Living register.** [phase-0-licence-register.md](phase-0-licence-register.md). Module pointer: [../../docs/04-data-and-licences.md](../../docs/04-data-and-licences.md).  
**Rule.** Do **not** invent clearances Jordan has not given. Rows marked **DECISION** stay blocked for that channel until answered.

---

## Verdict (today)

| Channel | Status |
| --- | --- |
| **Public GitHub Pages** (Kenya-style open demo) | **NO-GO** until Jordan picks an open-cleared path **and** an open-only bundle exists (`khm-i6e.3`) |
| **Private static** (Amplify basic auth / Cloudflare Access) | **DECISION** — possible for INTERNAL CI relay without clearing FLAG for public redistribute; still needs host + share-path answers |
| **Analyst zip / QGIS pack** (Phase 0) | **DECISION** — CI relay only after licence-by-use path chosen; same FLAG inheritance as below |
| **FLAG / full `inputs/screen-layers/` (~13 GB)** | **NO-GO** on any public remote — forever unless a named clearance lands in the register |

**Pages stay blocked.** `khm-i6e.5` must not publish a public site that ships uncleared GO/case assets.

---

## 1. Share paths (Jordan must pick one)

From [docs/04-data-and-licences.md](../../docs/04-data-and-licences.md) licence-by-use and delivery plan §6. No path is pre-approved for public Pages.

| ID | Path | What it allows | What it does **not** allow |
| --- | --- | --- | --- |
| **P0** | Internal research only (this build) | Analyst use of FLAG rows as the register already allows for non-commercial research | Public Pages; CI forward; commercial / credit |
| **P1** | CI Cambodia / CI Blue Climate **relay** (INTERNAL) | Method + figures + selected layers **after** Jordan sign-off; prefer private host | Public Pages; FLAG geometries without row-level clear |
| **P2** | Open-cleared public package | Products built **only** from layers whose licences allow the intended public release + attribution | Pond-derived classes until Jiang **U** and Clark **FLAG** clear; L15; L21; WDPA in commercial packs |
| **P3** | Grant-funded / Seed Fund Phase 1 build | Re-check whole register; grant ≠ automatic research | Free Earth Engine commercial use; credit-design screening |
| **P4** | Credit / revenue-linked screening | Different licence path (Note 3b §8); paid EE or open stack | Current free-EE research posture |

**DECISION needed:** Which path is the **first share**? (P0–P4). Public Pages requires **P2** (or a later cleared equivalent), not P0/P1 alone.

**DECISION needed:** Host for first share — public Pages (P2 only) vs Amplify basic auth vs Cloudflare Access vs zip-only?

---

## 2. Go / no-go matrix — MVP assets

Statuses:

- **GO** — may ship on that channel under current register (attribution still required).
- **NO-GO** — must not ship on that channel.
- **CONDITIONAL** — only after the named rebuild or Jordan decision; not cleared today.
- **DECISION** — Jordan answer required; do not assume.

### 2.1 GO GeoJSON (≥ MMU 0.5 ha)

Source today: `inputs/screen-layers/L_class_10m/class_step3.tif` (not yet vectorised; that is `khm-i6e.3`).

| Asset | Upstream licence risk | Public Pages | Private CI relay | Notes |
| --- | --- | --- | --- | --- |
| **Full class / all GO+CAUTION polygons** (classes 1–10) | Embeds **class 6–7** pond GO/CAUTION from `L_ponds_10m` → Jiang **U** + Clark **FLAG**; class 2 “not a pond” uses the same mask; first-pass salt in class 5 from pond stack | **NO-GO** | **DECISION** (P1) | Do not ship nation-scale GeoTIFF either |
| **GO class 6** inactive pond (~362 ha) | Jiang HOLD + Clark FLAG | **NO-GO** | **DECISION** | Wait for author/Clark clear **or** drop from public bundle |
| **GO class 8** open/accreted (~3,907 ha) | H (GMW CC BY) + L10 (Dynamic World CC BY); no pond footprint required for the class rule | **CONDITIONAL** | **DECISION** | **Open-only candidate** after extract/rebuild that **omits** FLAG pond classes and does not publish the pond mask. Still needs Jordan **P2** + attribution list |
| **CAUTION class 4** tidal flat (~8,507 ha) | L11 + L10 (both CC BY) | **CONDITIONAL** | **DECISION** | Same open-only rules as class 8 |
| **CAUTION class 7** active pond (~1,485 ha) | Jiang + Clark | **NO-GO** | **DECISION** | Same as class 6 |
| **CAUTION class 5** other converted | Mostly L10 trees/crops (open); salt-field limb from FLAG pond stack (~25 ha first-pass kept) | **CONDITIONAL** (open limb only) / **NO-GO** (salt limb) | **DECISION** | Prefer open-only rebuild excluding salt-from-pond |
| **STOP / conserve** classes 1–3, 9–10 | Predominantly open catalogue layers; class 2 shaped by pond exclusion | **CONDITIONAL** (open-only rebuild) | **DECISION** | Safer to rebuild without pond mask than to ship current class 2 as “open” |
| **`class_step3.tif` whole file** | Combined product inherits FLAG | **NO-GO** | **DECISION** | Offline GIS only |

**Open-cleared MVP shape (recommended if Jordan chooses P2):** vectorise **class 8 ± class 4** (and optionally open-only class 5 limb / conserve) at ≥0.5 ha MMU; **exclude** classes 6–7 and FLAG salt; document attribution; never attach L15/L17/L21 geometries to the public bundle.

### 2.2 Case PNGs (Phase 0 / MVP chrome)

Paths under `inputs/screen-layers/L_class_10m/visualizations/`.

| Asset | Focus class | Public Pages | Private CI relay | Notes |
| --- | --- | --- | --- | --- |
| `step3_overview.png` | Full colormap | **NO-GO** | **DECISION** | Shows FLAG-derived classes nationally |
| `step3_three_cases.png` | A–C strip | **NO-GO** | **DECISION** | Same |
| `case_a-….png` | Class 8 GO open/accreted | **NO-GO** today / **CONDITIONAL** open-only re-render | **DECISION** | Window still paints class 5 (and others). Current PNG = combined product |
| `case_b-….png` | Class 2 STOP water | **NO-GO** / **CONDITIONAL** open-only re-render | **DECISION** | Class 2 rule uses pond exclusion |
| `case_c-….png` | Class 4 CAUTION flat | **NO-GO** / **CONDITIONAL** open-only re-render | **DECISION** | Focus layers are open; figure still combined product |
| `step3-case-studies.md` (+ `.json`) | Ha tables | **CONDITIONAL** (text-only, no PNG embed) | **DECISION** | Tables without FLAG geometries may follow method-note path |

`docs/03-restoration-screen.md` already: overview/case PNGs stay **INTERNAL** until licence-by-use is cleared.

### 2.3 Method notes and how-to

| Asset | Public Pages | Private CI relay | Notes |
| --- | --- | --- | --- |
| `outputs/03b-…screen-method.md` | **DECISION** (after sign-off; no FLAG geometries in text) | **DECISION** — existing rule: nothing to CI before Jordan sign-off (`outputs/README.md`) | Method cites FLAG rows; does not redistribute geometries |
| `outputs/01`–`03` policy notes | **DECISION** | **DECISION** — INTERNAL until sign-off | Not MVP map assets |
| `docs/03-restoration-screen.md` how-to + cases narrative | **DECISION** | **DECISION** | Keep Illustrative / physical-screen language |
| Licence register + this gate | **GO** (docs) | **GO** | Safe to publish process docs |

---

## 3. Upstream FLAG / HOLD that block a naïve “ship class_step3” release

| Layer / product | Mark | Blocks |
| --- | --- | --- |
| **L_Clark_aquaculture** | **FLAG** (CC BY + non-commercial rider) | Pond stack; classes 6–7; salt limb of 5; any figure of those |
| **L_Jiang_ponds** | **U** (Zenodo `license` null) — HOLD redistribute | Same as Clark until authors confirm |
| **L_ponds_10m** | Inherits both | Do not release |
| **L15** UNEP-WCMC seagrass | **FLAG** | Any public seagrass geometry (prefer **L_Peng** CC BY if needed later) |
| **L17** WDPA | Research OK; commercial / wholesale redistribute restricted | Phase 2 flags on public Pages need a fresh terms check; filename still `*_INTERNAL.gpkg` |
| **L21** Google Earth | **FLAG** no redistribute | Labels only — never in bundle |
| **Earth Engine free tier** | Non-commercial platform | **P3/P4** credit or commercial builds need paid EE or open stack (Note 3b §8) |

Open catalogue rows used by class 8 / 4 (among others): L1–L3, L8–L11, L20, etc. — see register. Open upstream ≠ automatic clearance of the **combined** class product.

---

## 4. Decisions checklist for Jordan

Copy answers into the register log when decided.

1. **First-share path:** P0 / P1 / P2 / P3 / P4?  
2. **Host:** public Pages vs Amplify vs CF Access vs zip-only?  
3. **Open-only MVP geometry:** allow class **8 ± 4** public bundle **without** pond classes, or wait for Jiang + Clark clearance for full GO±CAUTION?  
4. **Case PNGs:** CI relay as-is (INTERNAL), open-only re-render for Pages, or withhold?  
5. **Method notes:** sign-off for CI relay? Any public method page?  
6. **Confirm** no credit / revenue-linked use on this share (keeps research / non-commercial WDPA + EE posture).

Until (1)–(3) are answered, treat **public Pages as NO-GO** and keep FLAG offline.

---

## 5. Agent rules (downstream beads)

| Bead | Gate implication |
| --- | --- |
| `khm-i6e.3` | Build **open-cleared** GeoJSON only if Jordan chose **P2** + open-only shape; otherwise build INTERNAL bundle and label it |
| `khm-i6e.4` | App may prototype on INTERNAL data locally; do not assume public CDN |
| `khm-i6e.5` | **Blocked** on public Pages until this gate flips Pages to GO; private static allowed only under P1 + host decision |
| `khm-i6e.1` | Phase 0 QGIS/PNG pack = same matrix as §2.2 — not a public bypass |

---

## 6. Log

| Date | Event |
| --- | --- |
| 23 Nov 2026 | `khm-i6e.2` claimed; gate matrix written from register + Note 3b + case tables. **No new clearances invented.** Pages = NO-GO. |
