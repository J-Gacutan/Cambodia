# First public share — Licence / FLAG go/no-go gate

**Bead.** `khm-i6e.2` (decision). **Date.** 23 Nov 2026; **locked** 24 Nov 2026 (AU/Sydney).  
**Audience.** Jordan (decide); agents building `khm-i6e.3`–`.5` (obey).  
**Living register.** [phase-0-licence-register.md](phase-0-licence-register.md). Module pointer: [../../docs/04-data-and-licences.md](../../docs/04-data-and-licences.md).  
**Rule.** Do **not** invent clearances Jordan has not given. Rows marked **DECISION** stay blocked for that channel until answered.

---

## Verdict (locked 24 Nov 2026)

| Channel | Status |
| --- | --- |
| **Public GitHub Pages** (Kenya-style open demo) | **GO** for **P2 open-cleared** class **8 ± 4** bundle only (`delivery/open-cleared/v0.3.0/`, `public_ready=true`). Non-commercial / research; no credit or revenue-linked use. |
| **Private static** (Amplify / Cloudflare Access) | **Not required** — Pages-only host preference stands |
| **Analyst zip / QGIS pack** (Phase 0) | **INTERNAL** — same FLAG rules; not a public bypass |
| **FLAG / full `inputs/screen-layers/` (~13 GB)** | **NO-GO** on any public remote — forever unless a named clearance lands in the register |

**Pages path enabled** when the pinned open-cleared manifest has `public_ready=true` (`khm-i6e.5` workflow). FLAG rasters, pond classes 6–7, WDPA geometries, and INTERNAL case PNGs must not enter the Pages artifact.

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

**LOCKED (24 Nov 2026):** First share = **P2**. Host = **public GitHub Pages**. Open-only MVP = **class 8 ± 4**. Non-commercial / research confirmed (no credit or revenue-linked use).

---

## 2. Go / no-go matrix — MVP assets

Statuses:

- **GO** — may ship on that channel under current register (attribution still required).
- **NO-GO** — must not ship on that channel.
- **CONDITIONAL** — only after the named rebuild or Jordan decision; not cleared today.
- **DECISION** — Jordan answer required; do not assume.

### 2.1 GO GeoJSON (≥ MMU 0.5 ha)

| Asset | Upstream licence risk | Public Pages | Private CI relay | Notes |
| --- | --- | --- | --- | --- |
| **Full class / all GO+CAUTION polygons** (classes 1–10) | Embeds **class 6–7** pond GO/CAUTION from `L_ponds_10m` → Jiang **U** + Clark **FLAG** | **NO-GO** | INTERNAL only | Do not ship nation-scale GeoTIFF either |
| **GO class 6** inactive pond | Jiang HOLD + Clark FLAG | **NO-GO** | INTERNAL | |
| **GO class 8** open/accreted | H (GMW CC BY) + L10 (Dynamic World CC BY) | **GO** (P2) | GO | Shipped in `v0.3.0` |
| **CAUTION class 4** tidal flat | L11 + L10 (both CC BY) | **GO** (P2) | GO | Shipped in `v0.3.0` |
| **CAUTION class 7** active pond | Jiang + Clark | **NO-GO** | INTERNAL | |
| **CAUTION class 5 / 9** and STOP/conserve | Mixed / pond-shaped | **NO-GO** on Pages until open-only rebuild | INTERNAL | Not in `v0.3.0` |
| **`class_step3.tif` whole file** | Combined product inherits FLAG | **NO-GO** | DECISION | Offline GIS only |

**Open-cleared MVP (locked):** vectorise **class 8 ± class 4** at ≥0.5 ha MMU; clip to L20 coastal provinces; **exclude** classes 6–7 and FLAG salt; document attribution; never attach L15/L17/L21 geometries to the public bundle. VERRA project-boundary overlays stay out of the public_ready package (`redistributable=false`).

### 2.2 Case PNGs

**NO-GO** on public Pages (remain INTERNAL / QGIS bridge). Text cases A and C may ship without PNG embeds.

### 2.3 Method notes and how-to

Licence register + this gate: **GO** (docs). Method notes: follow existing INTERNAL sign-off rules.

---

## 3. Upstream FLAG / HOLD that block a naïve “ship class_step3” release

| Layer / product | Mark | Blocks |
| --- | --- | --- |
| **L_Clark_aquaculture** | **FLAG** | Pond stack; classes 6–7; salt limb of 5 |
| **L_Jiang_ponds** | **U** HOLD | Same until authors confirm |
| **L_ponds_10m** | Inherits both | Do not release |
| **L15** UNEP-WCMC seagrass | **FLAG** | Public seagrass geometry |
| **L17** WDPA | Research OK; commercial redistribute restricted | Geometries stay offline; permit **attributes** OK under non-commercial research |
| **L21** Google Earth | **FLAG** | Never in bundle |

---

## 4. Decisions checklist for Jordan

| # | Question | Answer (24 Nov 2026) |
| --- | --- | --- |
| 1 | First-share path | **P2** |
| 2 | Host | **Public GitHub Pages** |
| 3 | Open-only MVP geometry | **Class 8 ± 4** (no pond classes) |
| 4 | Case PNGs | Withhold on Pages (INTERNAL) |
| 5 | Method notes | Docs/register GO; figures INTERNAL |
| 6 | Credit / revenue-linked use | **No** — non-commercial / research confirmed |

---

## 5. Agent rules (downstream beads)

| Bead | Gate implication |
| --- | --- |
| `khm-i6e.3` | Open-cleared GeoJSON = class 8±4 under P2 (`v0.3.0`) |
| `khm-i6e.4` | App serves P2 package on Pages; local may still preview older INTERNAL pins |
| `khm-i6e.5` | **Deploy when** pinned manifest `public_ready=true` |
| `khm-i6e.1` | Phase 0 QGIS/PNG pack = not a public bypass |

---

## 6. Log

| Date | Event |
| --- | --- |
| 23 Nov 2026 | `khm-i6e.2` claimed; gate matrix written. Pages = NO-GO pending Jordan. |
| 24 Nov 2026 (AU/Sydney) | **Jordan locked P2:** public Pages; class 8±4 open-cleared; non-commercial / research; FLAG stays NO-GO on public remote. `v0.3.0` `public_ready=true`. Bead closable. |
