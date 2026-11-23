#!/usr/bin/env python3
"""Phase 2 legal / permit / project-overlap flags for the open-cleared bundle.

Attaches Note 3b gate-2 flags to GO±CAUTION features **without changing class**:

- permit_gate — intersects WDPA (L17, when present) and/or Ramsar (L18)
- stop_legal — **not invented**; stays null until MoE mapped core zones exist
- project_overlap — intersects staged project boundaries when present:
  VCS 1748 (Southern Cardamom), VCS 5071 (mangrove ARR), VCS 5584
  (Krasop / Climate+ Mangrove REDD+)

Also writes optional MapLibre overlay GeoJSON for open-licence context layers
(Ramsar CC BY; project boundary derived from staged KML) and a gaps report.

Licence posture (do not invent clearances):

- Never flip ``public_ready`` (blocked on ``khm-i6e.2``).
- Never copy WDPA geometries into ``delivery/open-cleared/`` or a public remote.
  Derived boolean attributes on GO features are research/INTERNAL only while
  ``public_ready`` is false.
- Ramsar polygons (CC BY 4.0) may ship as an overlay.
- STOP (legal) cites Environment and Natural Resources Code Art. 364; without a
  mapped core-zone layer the attribute is null (unknown), not false.

Usage::

  python3 intermediate/screen-build/build_phase2_legal_flags.py \\
    --source-version v0.2.0 --out-version v0.2.1

  # Thin VM without WDPA gpkg: refresh project_overlap in place, keep permit_gate
  python3 intermediate/screen-build/build_phase2_legal_flags.py \\
    --source-version v0.2.1 --out-version v0.2.1 --preserve-permit-gate

Requires shapely. Optional: fiona/geopandas for WDPA GeoPackage on a full stack.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from shapely.geometry import MultiPolygon, Point, Polygon, mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
DELIVERY = ROOT / "delivery" / "open-cleared"

WDPA_GPKG = LAYERS / "L17" / "WDPA_KHM_polygons_merged_INTERNAL.gpkg"
WDPA_LAYER = "wdpa_khm"
RAMSAR_POLY = LAYERS / "L18" / "ramsar_cambodia_rsis.geojson"
RAMSAR_CENT = LAYERS / "L18" / "ramsar_cambodia_centroids.geojson"
VCS1748_KML = ROOT / "inputs" / "vcs-1748-southern-cardamom-boundary.kml"
VCS5071_KML = ROOT / "inputs" / "vcs-5071-kep-kampot-boundary.kml"
VCS5584_KML = ROOT / "inputs" / "vcs-5584-krasop-blue-carbon-boundary.kml"

# Staged Verra project boundaries for project_overlap (id → path + display).
PROJECT_KMLS: list[dict[str, Any]] = [
    {
        "id": "vcs-1748-southern-cardamom",
        "register_id": "vcs-1748",
        "name": "Southern Cardamom REDD+ (VCS 1748)",
        "path": VCS1748_KML,
        "overlay_file": "project-overlap-vcs1748.geojson",
        "simplify_tol": 0.003,
        "note": "Staged Verra/VCS 1748 KML. Illustrative overlap context.",
    },
    {
        "id": "vcs-5071-mangrove-arr",
        "register_id": "vcs-5071",
        "name": "Mangrove ARR (VCS 5071) — Kep/Kampot staged boundary",
        "path": VCS5071_KML,
        "overlay_file": "project-overlap-vcs5071.geojson",
        "simplify_tol": 0.0005,
        "note": (
            "From Verra document 'Kep, Kampot.kml'. Kampot/Kep extents only; "
            "Koh Kong ARR portion (if any) not published on registry at staging — not invented."
        ),
    },
    {
        "id": "vcs-5584-krasop-mangrove-redd",
        "register_id": "vcs-5584",
        "name": "Krasop Blue Carbon / Mangrove REDD+ (VCS 5584, Climate+)",
        "path": VCS5584_KML,
        "overlay_file": "project-overlap-vcs5584.geojson",
        "simplify_tol": 0.0005,
        "note": (
            "From Verra 'PKWS_project_boundary.kml'. Maps to CI Cambodia 2026 "
            "Table 6 Mangrove REDD+ (MoE / Climate+, Koh Kong)."
        ),
    },
]

PRODUCT_BANNER = (
    "Physical / land-cover suitability proxy only. GO = worth a field look. "
    "Not MoE zoning, tenure clearance, planting permission, or a carbon outcome. "
    "Permit / STOP (legal) / project-overlap flags cite instruments and overlaps — "
    "they never mean approved or refused."
)

STOP_LEGAL_INSTRUMENT = (
    "Environment and Natural Resources Code Art. 364 (mapped protected-area core zone). "
    "2008 Protected Areas Law abrogated by Art. 864."
)
PERMIT_INSTRUMENT = (
    "Permit gate (Note 3b): inside MNP, MFMA, other protected area, Ramsar, CFi or CPA — "
    "names MoE or GDF. Overlay sources used when present; incomplete coverage ≠ cleared."
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_geojson(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def write_geojson(path: Path, obj: dict[str, Any], *, compact: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        if compact:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(obj, f, ensure_ascii=False, indent=2)
            f.write("\n")


def round_coords(obj: Any, ndigits: int = 5) -> Any:
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(x), ndigits) for x in obj]
        return [round_coords(x, ndigits) for x in obj]
    return obj


def parse_kml_polygons(path: Path) -> list[Polygon]:
    """Extract outer rings from a KML MultiGeometry dump (no full KML DOM)."""
    text = path.read_text(encoding="utf-8", errors="replace")
    blocks = re.findall(
        r"<outerBoundaryIs>\s*<LinearRing>\s*<coordinates>(.*?)</coordinates>",
        text,
        flags=re.I | re.S,
    )
    polys: list[Polygon] = []
    for block in blocks:
        pairs: list[tuple[float, float]] = []
        for token in block.split():
            parts = token.split(",")
            if len(parts) < 2:
                continue
            try:
                lon, lat = float(parts[0]), float(parts[1])
            except ValueError:
                continue
            pairs.append((lon, lat))
        if len(pairs) >= 4:
            try:
                poly = Polygon(pairs)
            except Exception:
                continue
            if poly.is_valid and not poly.is_empty and poly.area > 0:
                polys.append(poly)
            else:
                fixed = poly.buffer(0)
                if not fixed.is_empty:
                    if isinstance(fixed, Polygon):
                        polys.append(fixed)
                    elif isinstance(fixed, MultiPolygon):
                        polys.extend([g for g in fixed.geoms if isinstance(g, Polygon)])
    return polys


def load_ramsar_polygons() -> tuple[list[dict[str, Any]], list[Polygon]]:
    if not RAMSAR_POLY.is_file():
        return [], []
    fc = load_geojson(RAMSAR_POLY)
    feats: list[dict[str, Any]] = []
    geoms: list[Polygon] = []
    for f in fc.get("features", []):
        props = dict(f.get("properties") or {})
        g = shape(f["geometry"])
        if g.is_empty:
            continue
        if isinstance(g, Polygon):
            geoms.append(g)
        elif isinstance(g, MultiPolygon):
            geoms.extend(list(g.geoms))
        else:
            continue
        name = props.get("officialname") or props.get("name") or "Ramsar site"
        rid = props.get("ramsarid")
        feats.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"ramsar-{rid}",
                    "name": name,
                    "ramsarid": rid,
                    "register_id": "L18-ramsar",
                    "flag_role": "permit_context",
                    "licence_plain": "Ramsar Sites Information Service extract — CC BY 4.0.",
                    "licence_spdx": "CC-BY-4.0",
                    "redistributable": True,
                    "public_ready": False,
                    "instrument": PERMIT_INSTRUMENT,
                    "note": "Coastal Koh Kapik (998) has no published RSIS polygon — centroid only.",
                },
                "geometry": mapping(g),
            }
        )
    return feats, geoms


def load_ramsar_centroids_gap() -> list[dict[str, Any]]:
    if not RAMSAR_CENT.is_file():
        return []
    fc = load_geojson(RAMSAR_CENT)
    out: list[dict[str, Any]] = []
    for f in fc.get("features", []):
        props = f.get("properties") or {}
        rid = props.get("ramsarid")
        if rid not in (998, 999, "998", "999"):
            continue
        out.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"ramsar-centroid-{rid}",
                    "name": props.get("officialname"),
                    "ramsarid": rid,
                    "register_id": "L18-ramsar-centroid",
                    "flag_role": "permit_gap_marker",
                    "licence_plain": "Ramsar Sites Information Service extract — CC BY 4.0.",
                    "licence_spdx": "CC-BY-4.0",
                    "redistributable": True,
                    "public_ready": False,
                    "note": "Polygon absent from RSIS features_published (22 Nov 2026). Location only.",
                },
                "geometry": f["geometry"],
            }
        )
    return out


def load_wdpa_polygons() -> tuple[bool, list[Polygon], list[dict[str, Any]]]:
    """Return (present, geometries, attribute rows). Never writes WDPA to delivery."""
    if not WDPA_GPKG.is_file():
        return False, [], []
    try:
        import fiona  # type: ignore
    except ImportError:
        try:
            import geopandas as gpd  # type: ignore

            gdf = gpd.read_file(WDPA_GPKG, layer=WDPA_LAYER)
            geoms: list[Polygon] = []
            rows: list[dict[str, Any]] = []
            for _, row in gdf.iterrows():
                g = row.geometry
                if g is None or g.is_empty:
                    continue
                if g.geom_type == "Polygon":
                    geoms.append(g)
                elif g.geom_type == "MultiPolygon":
                    geoms.extend(list(g.geoms))
                props = {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in row.items() if k != "geometry"}
                rows.append(props)
            return True, geoms, rows
        except ImportError:
            print("WARNING: WDPA gpkg present but fiona/geopandas missing — permit_gate from WDPA skipped.")
            return True, [], []
    geoms = []
    rows = []
    with fiona.open(WDPA_GPKG, layer=WDPA_LAYER) as src:
        for feat in src:
            g = shape(feat["geometry"])
            if g.is_empty:
                continue
            if isinstance(g, Polygon):
                geoms.append(g)
            elif isinstance(g, MultiPolygon):
                geoms.extend(list(g.geoms))
            rows.append(dict(feat.get("properties") or {}))
    return True, geoms, rows


def simplify_union(polys: list[Polygon], tol: float = 0.002) -> MultiPolygon | Polygon | None:
    if not polys:
        return None
    u = unary_union(polys)
    s = u.simplify(tol, preserve_topology=True)
    if s.is_empty:
        return None
    return s  # type: ignore[return-value]


def build_index(geoms: list[Polygon]) -> tuple[STRtree | None, list[Polygon]]:
    if not geoms:
        return None, []
    return STRtree(geoms), geoms


def any_intersects(geom, tree: STRtree | None, geoms: list[Polygon]) -> bool:
    if tree is None or geom is None or geom.is_empty:
        return False
    # shapely 2: tree.query returns indices
    try:
        idxs = tree.query(geom)
        for i in idxs:
            if geom.intersects(geoms[int(i)]):
                return True
    except Exception:
        for g in geoms:
            if geom.intersects(g):
                return True
    return False


def staged_project_ids() -> list[str]:
    return [p["id"] for p in PROJECT_KMLS if Path(p["path"]).is_file()]


def project_overlap_note(staged_ids: list[str]) -> str:
    bits = []
    if "vcs-1748-southern-cardamom" in staged_ids:
        bits.append("VCS 1748 Southern Cardamom staged")
    if "vcs-5071-mangrove-arr" in staged_ids:
        bits.append("VCS 5071 mangrove ARR staged (Kep/Kampot KML only)")
    if "vcs-5584-krasop-mangrove-redd" in staged_ids:
        bits.append("VCS 5584 Krasop / Mangrove REDD+ staged")
    if not bits:
        return "No project-boundary KMLs staged — project_overlap null."
    return (
        "; ".join(bits)
        + ". Overlap cites staged Verra boundaries — not a registry decision or clearance."
    )


def flag_props(
    *,
    permit: bool | None,
    permit_sources: list[str],
    overlap: bool | None,
    overlap_ids: list[str],
    wdpa_present: bool,
    staged_ids: list[str],
) -> dict[str, Any]:
    stop_status = "unavailable"
    stop_note = (
        "MoE mapped protected-area core-zone GIS not provided (khm-i6e.6.2). "
        "L19 digital Forest Cover GIS is closed and is not a core-zone substitute. "
        f"Instrument remains: {STOP_LEGAL_INSTRUMENT} "
        "Do not invent STOP from IUCN category alone."
    )
    return {
        "permit_gate": permit,
        "permit_gate_sources": permit_sources or None,
        "permit_instrument": PERMIT_INSTRUMENT,
        "stop_legal": None,
        "stop_legal_status": stop_status,
        "stop_legal_instrument": STOP_LEGAL_INSTRUMENT,
        "stop_legal_note": stop_note,
        "project_overlap": overlap,
        "project_overlap_ids": overlap_ids or None,
        "project_overlap_note": project_overlap_note(staged_ids),
        "flag_sources_complete": {
            "wdpa_l17": wdpa_present,
            "ramsar_l18_polygons": RAMSAR_POLY.is_file(),
            "ramsar_koh_kapik_polygon": False,
            "moe_core_zones": False,
            "cfi_cpa_boundaries": False,
            "mfma_boundaries": False,
            "vcs_1748_southern_cardamom": VCS1748_KML.is_file(),
            "mangrove_redd": VCS5584_KML.is_file(),
            "vcs_5071": VCS5071_KML.is_file(),
            "vcs_5584_krasop": VCS5584_KML.is_file(),
        },
        "product_banner": PRODUCT_BANNER,
    }


def annotate_features(
    fc: dict[str, Any],
    *,
    wdpa_geoms: list[Polygon],
    ramsar_geoms: list[Polygon],
    project_sources: list[dict[str, Any]],
    wdpa_present: bool,
    preserve_permit_gate: bool = False,
) -> dict[str, Any]:
    wdpa_tree, wdpa_list = build_index(wdpa_geoms)
    ramsar_tree, ramsar_list = build_index(ramsar_geoms)
    staged_ids = [p["id"] for p in project_sources]
    proj_indexes: list[tuple[str, STRtree | None, list[Polygon]]] = []
    for src in project_sources:
        tree, geoms = build_index(src["geoms"])
        proj_indexes.append((src["id"], tree, geoms))

    stats = {
        "features": 0,
        "permit_gate_true": 0,
        "permit_gate_null": 0,
        "permit_gate_false": 0,
        "project_overlap_true": 0,
        "project_overlap_false": 0,
        "project_overlap_null": 0,
        "stop_legal_null": 0,
        "project_overlap_by_id": {pid: 0 for pid in staged_ids},
    }

    out_features = []
    for feat in fc.get("features", []):
        stats["features"] += 1
        props = dict(feat.get("properties") or {})
        geom = shape(feat["geometry"]) if feat.get("geometry") else None

        if preserve_permit_gate and not (wdpa_present and wdpa_list) and "permit_gate" in props:
            permit = props.get("permit_gate")
            sources = list(props.get("permit_gate_sources") or [])
            if permit is True:
                stats["permit_gate_true"] += 1
            elif permit is False:
                stats["permit_gate_false"] += 1
            else:
                stats["permit_gate_null"] += 1
        else:
            sources = []
            hit_wdpa = (
                any_intersects(geom, wdpa_tree, wdpa_list) if wdpa_present and wdpa_list else False
            )
            hit_ramsar = any_intersects(geom, ramsar_tree, ramsar_list)
            if hit_wdpa:
                sources.append("L17-WDPA")
            if hit_ramsar:
                sources.append("L18-Ramsar")

            if hit_wdpa or hit_ramsar:
                permit = True
                stats["permit_gate_true"] += 1
            elif wdpa_present and wdpa_list:
                # Full WDPA available: absence of hit → not inside known PA/Ramsar polys
                # (still incomplete for CFi/CPA/MFMA).
                permit = False
                stats["permit_gate_false"] += 1
            else:
                # Thin clone / no WDPA: do not invent a negative clearance.
                permit = None
                stats["permit_gate_null"] += 1

        if proj_indexes:
            overlap_ids: list[str] = []
            for pid, tree, geoms in proj_indexes:
                if any_intersects(geom, tree, geoms):
                    overlap_ids.append(pid)
                    stats["project_overlap_by_id"][pid] += 1
            overlap: bool | None = bool(overlap_ids)
            if overlap_ids:
                stats["project_overlap_true"] += 1
            else:
                stats["project_overlap_false"] += 1
        else:
            overlap = None
            overlap_ids = []
            stats["project_overlap_null"] += 1

        stats["stop_legal_null"] += 1
        existing_complete = props.get("flag_sources_complete") or {}
        wdpa_flag = bool(wdpa_present and wdpa_list) or (
            preserve_permit_gate and existing_complete.get("wdpa_l17") is True
        )
        props.update(
            flag_props(
                permit=permit,
                permit_sources=sources,
                overlap=overlap,
                overlap_ids=overlap_ids,
                wdpa_present=wdpa_flag,
                staged_ids=staged_ids,
            )
        )
        # Keep geometry as-is (already compact from v0.2.0).
        out_features.append({"type": "Feature", "properties": props, "geometry": feat["geometry"]})

    return {
        "type": "FeatureCollection",
        "features": out_features,
        "_stats": stats,
    }


def gaps_markdown(
    *,
    wdpa_present: bool,
    wdpa_n: int,
    project_ring_total: int,
    staged_projects: list[str],
    ramsar_n: int,
    stats: dict[str, Any],
) -> str:
    wdpa_gap = (
        "1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be pushed "
        "to a public remote. Derived `permit_gate` attributes joined on the workstation "
        f"(`khm-i6e.6.1`; n≈{wdpa_n} polygons). Thin/cloud clones without the gitignored gpkg "
        "still get `permit_gate=null` until re-run locally (or use `--preserve-permit-gate` on a "
        "bundle that already carries WDPA-joined attributes)."
        if wdpa_present
        else (
            "1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be "
            "pushed to a public remote. On thin/cloud clones the merged gpkg is gitignored/absent; "
            "re-run this script on the workstation with `WDPA_KHM_polygons_merged_INTERNAL.gpkg` "
            "(`khm-i6e.6.1`), or refresh projects with `--preserve-permit-gate` against an existing "
            "WDPA-joined `v0.2.1`."
        )
    )
    staged_txt = ", ".join(staged_projects) if staged_projects else "**none**"
    return f"""# Phase 2 flag gaps (`khm-i6e.6`)

Built: {utc_now()}

## What shipped (without inventing clearances)

| Flag | Status in this bundle | Source used |
| --- | --- | --- |
| **permit_gate** | Partial — boolean when a known PA/Ramsar polygon hits; **null** when WDPA absent (do not invent “clear”) | L17 WDPA gpkg when present ({"yes, n≈" + str(wdpa_n) + "; bead `khm-i6e.6.1`" if wdpa_present else "**absent on this host** / preserved from prior join when flagged"}); L18 Ramsar polygons ({ramsar_n} coastal-usable inland sites only) |
| **STOP (legal)** | **Unavailable** (`stop_legal=null`, `stop_legal_status=unavailable`) | MoE protected-area **core-zone** GIS not provided (`khm-i6e.6.2`). L19 Forest Cover digital GIS closed and is **not** a substitute. Instrument cited only: ENR Code Art. 364 |
| **project_overlap** | Partial — staged Verra boundaries ({project_ring_total} rings across projects) | Staged: {staged_txt}. See `inputs/vcs-5071-5584-PROVENANCE.txt`. VCS 5071 Koh Kong ARR portion (if any) not in registry KML — not invented |
| **elevation_check** | Not burned into GO attributes here | Raster already on disk (`L13/elevation_check_flag_10m.tif`); wire in a later pass if needed |

### Counts (this run)

```
{json.dumps(stats, indent=2)}
```

## Explicit gaps (block full Note 3 gate-2)

{wdpa_gap}
2. **Koh Kapik Ramsar (998)** — RSIS publishes centroid only; no polygon for coastal permit intersection.
3. **CFi / CPA / MFMA boundaries** — not staged; permit_gate cannot name GDF vs MoE completely.
4. **MoE protected-area core zones** (`khm-i6e.6.2`) — required for STOP (legal); blocked until MoE provides mapped core zones. Do **not** proxy with IUCN category or L19 Forest Cover.
5. **VCS 5071 Koh Kong ARR geometry** — registry document is `Kep, Kampot.kml` only; any Trend Tech Koh Kong ARR extent remains unstaged (do not invent).
6. **`public_ready`** — remains false until `khm-i6e.2` (licence gate). Derived WDPA attributes and project-boundary overlays stay research/INTERNAL.

## Product language (UI must keep)

Flags **cite instruments and overlaps**. They never mean a site is approved or refused for planting, tenure, or carbon.
"""


def copy_bundle(src: Path, dest: Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def load_project_sources(*, skip: bool) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    if skip:
        print("Project KMLs skipped (--skip-project-kml)")
        return sources
    for meta in PROJECT_KMLS:
        path = Path(meta["path"])
        if not path.is_file():
            print(f"  missing {meta['id']}: {path.name}")
            continue
        size_mb = path.stat().st_size / 1_000_000
        print(f"Parsing {meta['id']} ({path.name}, {size_mb:.1f} MB)…")
        geoms = parse_kml_polygons(path)
        print(f"  rings={len(geoms)}")
        sources.append({**meta, "geoms": geoms})
    return sources


def write_project_overlays(overlays_dir: Path, project_sources: list[dict[str, Any]]) -> None:
    for src in project_sources:
        simp = simplify_union(src["geoms"], tol=float(src.get("simplify_tol") or 0.003))
        if simp is None:
            continue
        mapped = mapping(simp)
        proj_fc = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": src["id"],
                        "name": f"{src['name']} — staged boundary",
                        "register_id": src["register_id"],
                        "flag_role": "project_overlap",
                        "licence_plain": (
                            f"Derived from staged Verra/{src['register_id']} KML under inputs/. "
                            "Illustrative project-overlap context for research screen; "
                            "not a Verra registry extract republish. public_ready false."
                        ),
                        "licence_spdx": None,
                        "redistributable": False,
                        "public_ready": False,
                        "note": f"Simplified for MapLibre. Join used full rings. {src.get('note') or ''}",
                    },
                    "geometry": {
                        "type": mapped["type"],
                        "coordinates": round_coords(mapped["coordinates"], 5),
                    },
                }
            ],
        }
        write_geojson(overlays_dir / src["overlay_file"], proj_fc, compact=True)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source-version", default="v0.2.0")
    ap.add_argument("--out-version", default="v0.2.1")
    ap.add_argument("--skip-project-kml", action="store_true", help="Skip project-boundary KML joins")
    ap.add_argument(
        "--preserve-permit-gate",
        action="store_true",
        help="When WDPA gpkg absent, keep existing permit_gate* on features (thin-VM refresh)",
    )
    args = ap.parse_args()

    src = DELIVERY / args.source_version
    dest = DELIVERY / args.out_version
    if not src.is_dir():
        raise SystemExit(f"Source bundle missing: {src}")

    if src.resolve() == dest.resolve():
        print(f"In-place update of {dest}")
    else:
        print(f"Copying {src} → {dest}")
        copy_bundle(src, dest)

    go_path = dest / "layers" / "go-caution.geojson"
    fc = load_geojson(go_path)

    print("Loading Ramsar…")
    ramsar_feats, ramsar_geoms = load_ramsar_polygons()
    ramsar_gap = load_ramsar_centroids_gap()

    print("Loading WDPA (optional)…")
    wdpa_present, wdpa_geoms, _wdpa_rows = load_wdpa_polygons()
    print(f"  WDPA present={wdpa_present} polygons={len(wdpa_geoms)}")
    if args.preserve_permit_gate and not (wdpa_present and wdpa_geoms):
        print("  --preserve-permit-gate: keeping existing permit_gate attributes")

    print("Loading project KMLs…")
    project_sources = load_project_sources(skip=args.skip_project_kml)
    project_ring_total = sum(len(p["geoms"]) for p in project_sources)
    staged_ids = [p["id"] for p in project_sources]

    print("Annotating GO±CAUTION features…")
    annotated = annotate_features(
        fc,
        wdpa_geoms=wdpa_geoms,
        ramsar_geoms=ramsar_geoms,
        project_sources=project_sources,
        wdpa_present=wdpa_present,
        preserve_permit_gate=args.preserve_permit_gate,
    )
    stats = annotated.pop("_stats")
    write_geojson(go_path, annotated, compact=True)
    print("  stats:", stats)

    # Overlays (open-cleared safe)
    overlays_dir = dest / "layers"
    if ramsar_feats:
        ramsar_out = {
            "type": "FeatureCollection",
            "features": [
                {
                    **f,
                    "geometry": {
                        "type": f["geometry"]["type"],
                        "coordinates": round_coords(f["geometry"]["coordinates"], 5),
                    },
                }
                for f in ramsar_feats
            ],
        }
        write_geojson(overlays_dir / "ramsar-context.geojson", ramsar_out, compact=True)
    if ramsar_gap:
        write_geojson(
            overlays_dir / "ramsar-gap-centroids.geojson",
            {"type": "FeatureCollection", "features": ramsar_gap},
            compact=False,
        )

    write_project_overlays(overlays_dir, project_sources)

    # layers/index.json — keep go-caution first; append overlays
    index_path = overlays_dir / "index.json"
    index = load_geojson(index_path) if index_path.is_file() else []
    # Ensure list
    if not isinstance(index, list):
        index = []

    def upsert(layer: dict[str, Any]) -> None:
        nonlocal index
        index = [x for x in index if x.get("id") != layer["id"]]
        index.append(layer)

    # Refresh go-caution note
    for layer in index:
        if layer.get("id") == "go-caution":
            layer["note"] = PRODUCT_BANNER
            layer["public_ready"] = False

    if (overlays_dir / "ramsar-context.geojson").is_file():
        upsert(
            {
                "id": "ramsar-context",
                "title": "Ramsar context (permit gate partial)",
                "kind": "context_overlay",
                "file": "layers/ramsar-context.geojson",
                "crs": "EPSG:4326",
                "evidence_class": "designation_context",
                "register_id": "L18-ramsar",
                "licence_plain": "Ramsar Sites Information Service — CC BY 4.0. Not planting permission.",
                "licence_spdx": "CC-BY-4.0",
                "redistributable": True,
                "public_ready": False,
                "default_visible": False,
                "flag_role": "permit_context",
                "note": "Inland RSIS polygons only; Koh Kapik coastal site lacks published polygon.",
            }
        )
    if (overlays_dir / "ramsar-gap-centroids.geojson").is_file():
        upsert(
            {
                "id": "ramsar-gap-centroids",
                "title": "Ramsar gap markers (centroids)",
                "kind": "context_overlay",
                "file": "layers/ramsar-gap-centroids.geojson",
                "crs": "EPSG:4326",
                "evidence_class": "designation_context",
                "register_id": "L18-ramsar-centroid",
                "licence_plain": "Ramsar Sites Information Service — CC BY 4.0.",
                "licence_spdx": "CC-BY-4.0",
                "redistributable": True,
                "public_ready": False,
                "default_visible": False,
                "flag_role": "permit_gap_marker",
                "note": "Koh Kapik (998) and Mekong (999) — location only.",
            }
        )
    for src in project_sources:
        overlay_path = overlays_dir / src["overlay_file"]
        if not overlay_path.is_file():
            continue
        layer_id = Path(src["overlay_file"]).stem  # e.g. project-overlap-vcs1748
        upsert(
            {
                "id": layer_id,
                "title": f"Project overlap — {src['name']}",
                "kind": "context_overlay",
                "file": f"layers/{src['overlay_file']}",
                "crs": "EPSG:4326",
                "evidence_class": "project_boundary",
                "register_id": src["register_id"],
                "licence_plain": (
                    f"Staged {src['register_id']} boundary (simplified). "
                    "Research screen context; public_ready false."
                ),
                "licence_spdx": None,
                "redistributable": False,
                "public_ready": False,
                "default_visible": False,
                "flag_role": "project_overlap",
                "note": "Cites project overlap for double-counting awareness — not a registry decision.",
            }
        )
    # Drop stale project-overlap index rows that no longer match overlay filenames.
    valid_project_layer_ids = {Path(s["overlay_file"]).stem for s in project_sources}
    index = [
        x
        for x in index
        if not (
            isinstance(x.get("id"), str)
            and x["id"].startswith("project-overlap-vcs")
            and x["id"] not in valid_project_layer_ids
        )
    ]

    write_geojson(index_path, index, compact=False)

    # Schema
    schema_path = dest / "schema" / "feature-properties.json"
    schema = load_geojson(schema_path) if schema_path.is_file() else {"feature_properties": {}}
    schema.setdefault("feature_properties", {})
    schema["feature_properties"].update(
        {
            "permit_gate": "true | false | null — null when PA coverage incomplete (no invented clearance)",
            "permit_gate_sources": "list of register ids that hit, or null",
            "permit_instrument": "Note 3b permit-gate citation (never approved/refused)",
            "stop_legal": "true | false | null — null until MoE core zones mapped",
            "stop_legal_status": "unavailable | provisional | mapped",
            "stop_legal_instrument": "ENR Code Art. 364 citation",
            "stop_legal_note": "human-readable gap / reading rule",
            "project_overlap": "true | false | null",
            "project_overlap_ids": "list of project ids, or null",
            "project_overlap_note": "coverage note",
            "flag_sources_complete": "object of boolean coverage keys",
        }
    )
    schema["phase2_flags"] = {
        "bead": "khm-i6e.6",
        "children": ["khm-i6e.6.1", "khm-i6e.6.2", "khm-i6e.6.3"],
        "ui_rule": "Cite instruments and overlaps; never say approved or refused.",
        "filter_example": [
            "all",
            ["!=", ["get", "permit_gate"], True],
            ["!=", ["get", "project_overlap"], True],
        ],
    }
    write_geojson(schema_path, schema, compact=False)

    # WDPA status for docs: live join OR preserved attributes from prior join
    preserved_wdpa = False
    if args.preserve_permit_gate and not (wdpa_present and wdpa_geoms):
        for feat in annotated.get("features", [])[:50]:
            complete = (feat.get("properties") or {}).get("flag_sources_complete") or {}
            if complete.get("wdpa_l17") is True:
                preserved_wdpa = True
                break
    wdpa_joined = bool(wdpa_present and wdpa_geoms) or preserved_wdpa
    wdpa_n_for_docs = len(wdpa_geoms) if (wdpa_present and wdpa_geoms) else (
        128 if preserved_wdpa else 0
    )

    gaps_path = dest / "flags" / "GAPS.md"
    gaps_path.parent.mkdir(parents=True, exist_ok=True)
    gaps_path.write_text(
        gaps_markdown(
            wdpa_present=wdpa_joined,
            wdpa_n=wdpa_n_for_docs,
            project_ring_total=project_ring_total,
            staged_projects=staged_ids,
            ramsar_n=len(ramsar_geoms),
            stats=stats,
        ),
        encoding="utf-8",
    )
    write_geojson(
        dest / "flags" / "coverage.json",
        {
            "built": utc_now(),
            "bead": "khm-i6e.6",
            "wdpa_join_bead": "khm-i6e.6.1" if wdpa_joined else None,
            "project_overlap_bead": "khm-i6e.6.3" if staged_ids else None,
            "stop_legal_bead": "khm-i6e.6.2",
            "wdpa_present": wdpa_joined,
            "wdpa_polygon_count": wdpa_n_for_docs,
            "wdpa_join_mode": (
                "live_gpkg"
                if (wdpa_present and wdpa_geoms)
                else ("preserved" if preserved_wdpa else "absent")
            ),
            "ramsar_polygon_count": len(ramsar_geoms),
            "project_ring_count": project_ring_total,
            "project_sources_staged": staged_ids,
            "stats": stats,
            "public_ready": False,
            "stop_legal_status": "unavailable",
        },
        compact=False,
    )

    # Manifest
    manifest_path = dest / "manifest.json"
    manifest = load_geojson(manifest_path)
    manifest["version"] = args.out_version
    manifest["built"] = utc_now()
    manifest["public_ready"] = False
    manifest["licence_gate"] = "blocked_pending_khm-i6e.2"
    manifest["product_banner"] = PRODUCT_BANNER
    families = list(manifest.get("families") or [])
    for fam in ("flags", "layers", "cases", "schema"):
        if fam not in families:
            families.append(fam)
    manifest["families"] = families
    register_ids = [p["register_id"] for p in project_sources]
    manifest["phase2"] = {
        "bead": "khm-i6e.6",
        "wdpa_joined": wdpa_joined,
        "wdpa_join_bead": "khm-i6e.6.1" if wdpa_joined else None,
        "stop_legal_status": "unavailable",
        "stop_legal_bead": "khm-i6e.6.2",
        "project_overlap_bead": "khm-i6e.6.3",
        "project_overlap_sources": register_ids,
        "gaps_doc": "flags/GAPS.md",
    }
    notes = [n for n in (manifest.get("notes") or []) if not str(n).startswith("Phase 2 flags (")]
    permit_txt = (
        "from WDPA+Ramsar (khm-i6e.6.1)"
        if wdpa_joined
        else "partial (WDPA absent)"
    )
    proj_txt = ", ".join(register_ids) if register_ids else "none staged"
    notes.append(
        f"Phase 2 flags ({args.out_version}): permit_gate {permit_txt}; "
        f"stop_legal unavailable (khm-i6e.6.2 MoE core zones); "
        f"project_overlap from {proj_txt} (khm-i6e.6.3). See flags/GAPS.md."
    )
    manifest["notes"] = notes
    if "stats" in manifest and isinstance(manifest["stats"], dict):
        manifest["stats"]["phase2"] = stats
    write_geojson(manifest_path, manifest, compact=False)

    print(f"Wrote {dest}")
    print("public_ready remains false. WDPA geometries were not copied into delivery.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
