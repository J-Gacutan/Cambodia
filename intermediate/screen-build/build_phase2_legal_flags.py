#!/usr/bin/env python3
"""Phase 2 legal / permit / project-overlap flags for the open-cleared bundle.

Attaches Note 3b gate-2 flags to GO±CAUTION features **without changing class**:

- permit_gate — intersects WDPA (L17, when present) and/or Ramsar (L18)
- stop_legal — **not invented**; stays null until MoE mapped core zones exist
- project_overlap — intersects staged project boundaries (VCS 1748 Southern
  Cardamom when present; Mangrove REDD+ / VCS 5071 remain gaps)

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


def flag_props(
    *,
    permit: bool | None,
    permit_sources: list[str],
    overlap: bool | None,
    overlap_ids: list[str],
    wdpa_present: bool,
) -> dict[str, Any]:
    stop_status = "unavailable"
    stop_note = (
        "MoE mapped core-zone GIS not provided (L19 digital GIS closed). "
        f"Instrument remains: {STOP_LEGAL_INSTRUMENT} Do not invent STOP from IUCN category alone."
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
        "project_overlap_note": (
            "Southern Cardamom REDD+ (VCS 1748) boundary staged when present. "
            "Mangrove REDD+ and VCS 5071 polygons not staged — gap."
        ),
        "flag_sources_complete": {
            "wdpa_l17": wdpa_present,
            "ramsar_l18_polygons": RAMSAR_POLY.is_file(),
            "ramsar_koh_kapik_polygon": False,
            "moe_core_zones": False,
            "cfi_cpa_boundaries": False,
            "mfma_boundaries": False,
            "vcs_1748_southern_cardamom": VCS1748_KML.is_file(),
            "mangrove_redd": False,
            "vcs_5071": False,
        },
        "product_banner": PRODUCT_BANNER,
    }


def annotate_features(
    fc: dict[str, Any],
    *,
    wdpa_geoms: list[Polygon],
    ramsar_geoms: list[Polygon],
    project_geoms: list[Polygon],
    wdpa_present: bool,
) -> dict[str, Any]:
    wdpa_tree, wdpa_list = build_index(wdpa_geoms)
    ramsar_tree, ramsar_list = build_index(ramsar_geoms)
    proj_tree, proj_list = build_index(project_geoms)

    stats = {
        "features": 0,
        "permit_gate_true": 0,
        "permit_gate_null": 0,
        "permit_gate_false": 0,
        "project_overlap_true": 0,
        "project_overlap_false": 0,
        "project_overlap_null": 0,
        "stop_legal_null": 0,
    }

    out_features = []
    for feat in fc.get("features", []):
        stats["features"] += 1
        props = dict(feat.get("properties") or {})
        geom = shape(feat["geometry"]) if feat.get("geometry") else None

        sources: list[str] = []
        hit_wdpa = any_intersects(geom, wdpa_tree, wdpa_list) if wdpa_present and wdpa_list else False
        hit_ramsar = any_intersects(geom, ramsar_tree, ramsar_list)
        if hit_wdpa:
            sources.append("L17-WDPA")
        if hit_ramsar:
            sources.append("L18-Ramsar")

        if hit_wdpa or hit_ramsar:
            permit: bool | None = True
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

        if project_geoms:
            hit_proj = any_intersects(geom, proj_tree, proj_list)
            overlap: bool | None = bool(hit_proj)
            overlap_ids = ["vcs-1748-southern-cardamom"] if hit_proj else []
            if hit_proj:
                stats["project_overlap_true"] += 1
            else:
                stats["project_overlap_false"] += 1
        else:
            overlap = None
            overlap_ids = []
            stats["project_overlap_null"] += 1

        stats["stop_legal_null"] += 1
        props.update(
            flag_props(
                permit=permit,
                permit_sources=sources,
                overlap=overlap,
                overlap_ids=overlap_ids,
                wdpa_present=bool(wdpa_present and wdpa_list),
            )
        )
        # Keep geometry as-is (already compact from v0.2.0).
        out_features.append({"type": "Feature", "properties": props, "geometry": feat["geometry"]})

    return {
        "type": "FeatureCollection",
        "features": out_features,
        "_stats": stats,
    }


def gaps_markdown(*, wdpa_present: bool, wdpa_n: int, project_n: int, ramsar_n: int, stats: dict[str, Any]) -> str:
    wdpa_gap = (
        "1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be pushed "
        "to a public remote. Derived `permit_gate` attributes joined on the workstation "
        f"(`khm-i6e.6.1`; n≈{wdpa_n} polygons). Thin/cloud clones without the gitignored gpkg "
        "still get `permit_gate=null` until re-run locally."
        if wdpa_present
        else (
            "1. **WDPA geometries** — research/non-commercial OK for the screen; **must not** be "
            "pushed to a public remote. On thin/cloud clones the merged gpkg is gitignored/absent; "
            "re-run this script on the workstation with `WDPA_KHM_polygons_merged_INTERNAL.gpkg` "
            "(`khm-i6e.6.1`)."
        )
    )
    return f"""# Phase 2 flag gaps (`khm-i6e.6`)

Built: {utc_now()}

## What shipped (without inventing clearances)

| Flag | Status in this bundle | Source used |
| --- | --- | --- |
| **permit_gate** | Partial — boolean when a known PA/Ramsar polygon hits; **null** when WDPA absent (do not invent “clear”) | L17 WDPA gpkg when present ({"yes, n≈" + str(wdpa_n) + "; bead `khm-i6e.6.1`" if wdpa_present else "**absent on this host**"}); L18 Ramsar polygons ({ramsar_n} coastal-usable inland sites only) |
| **STOP (legal)** | **Unavailable** (`stop_legal=null`, `stop_legal_status=unavailable`) | MoE core-zone GIS not provided (L19 digital GIS closed). Instrument cited only: ENR Code Art. 364 |
| **project_overlap** | Partial — Southern Cardamom REDD+ (VCS 1748) when KML present ({project_n} rings parsed) | `inputs/vcs-1748-southern-cardamom-boundary.kml`. Mangrove REDD+ / VCS 5071 **not staged** |
| **elevation_check** | Not burned into GO attributes here | Raster already on disk (`L13/elevation_check_flag_10m.tif`); wire in a later pass if needed |

### Counts (this run)

```
{json.dumps(stats, indent=2)}
```

## Explicit gaps (block full Note 3 gate-2)

{wdpa_gap}
2. **Koh Kapik Ramsar (998)** — RSIS publishes centroid only; no polygon for coastal permit intersection.
3. **CFi / CPA / MFMA boundaries** — not staged; permit_gate cannot name GDF vs MoE completely.
4. **MoE protected-area core zones** — required for STOP (legal); do **not** proxy with IUCN category alone.
5. **Mangrove REDD+ and VCS 5071** — named in Note 3b / CI Cambodia 2026; polygons not in-repo.
6. **`public_ready`** — remains false until `khm-i6e.2` (licence gate). Derived WDPA attributes stay research/INTERNAL.

## Product language (UI must keep)

Flags **cite instruments and overlaps**. They never mean a site is approved or refused for planting, tenure, or carbon.
"""


def copy_bundle(src: Path, dest: Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source-version", default="v0.2.0")
    ap.add_argument("--out-version", default="v0.2.1")
    ap.add_argument("--skip-project-kml", action="store_true", help="Skip heavy VCS 1748 join (debug)")
    args = ap.parse_args()

    src = DELIVERY / args.source_version
    dest = DELIVERY / args.out_version
    if not src.is_dir():
        raise SystemExit(f"Source bundle missing: {src}")

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

    project_geoms: list[Polygon] = []
    if not args.skip_project_kml and VCS1748_KML.is_file():
        print(f"Parsing VCS 1748 KML ({VCS1748_KML.stat().st_size // 1_000_000} MB)…")
        project_geoms = parse_kml_polygons(VCS1748_KML)
        print(f"  rings={len(project_geoms)}")
    else:
        print("Project KML skipped or missing")

    print("Annotating GO±CAUTION features…")
    annotated = annotate_features(
        fc,
        wdpa_geoms=wdpa_geoms,
        ramsar_geoms=ramsar_geoms,
        project_geoms=project_geoms,
        wdpa_present=wdpa_present,
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

    if project_geoms:
        simp = simplify_union(project_geoms, tol=0.003)
        if simp is not None:
            proj_fc = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "id": "vcs-1748-southern-cardamom",
                            "name": "Southern Cardamom REDD+ (VCS 1748) — staged boundary",
                            "register_id": "vcs-1748",
                            "flag_role": "project_overlap",
                            "licence_plain": (
                                "Derived from staged Verra/VCS 1748 KML under inputs/. "
                                "Illustrative project-overlap context for research screen; "
                                "not a Verra registry extract republish. public_ready false."
                            ),
                            "licence_spdx": None,
                            "redistributable": False,
                            "public_ready": False,
                            "note": "Simplified for MapLibre. Join used full rings.",
                        },
                        "geometry": {
                            "type": mapping(simp)["type"],
                            "coordinates": round_coords(mapping(simp)["coordinates"], 5),
                        },
                    }
                ],
            }
            write_geojson(overlays_dir / "project-overlap-vcs1748.geojson", proj_fc, compact=True)

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
    if (overlays_dir / "project-overlap-vcs1748.geojson").is_file():
        upsert(
            {
                "id": "project-overlap-vcs1748",
                "title": "Project overlap — Southern Cardamom (VCS 1748)",
                "kind": "context_overlay",
                "file": "layers/project-overlap-vcs1748.geojson",
                "crs": "EPSG:4326",
                "evidence_class": "project_boundary",
                "register_id": "vcs-1748",
                "licence_plain": "Staged VCS 1748 boundary (simplified). Research screen context; public_ready false.",
                "licence_spdx": None,
                "redistributable": False,
                "public_ready": False,
                "default_visible": False,
                "flag_role": "project_overlap",
                "note": "Cites project overlap for double-counting awareness — not a registry decision.",
            }
        )

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
        "ui_rule": "Cite instruments and overlaps; never say approved or refused.",
        "filter_example": [
            "all",
            ["!=", ["get", "permit_gate"], True],
            ["!=", ["get", "project_overlap"], True],
        ],
    }
    write_geojson(schema_path, schema, compact=False)

    gaps_path = dest / "flags" / "GAPS.md"
    gaps_path.parent.mkdir(parents=True, exist_ok=True)
    gaps_path.write_text(
        gaps_markdown(
            wdpa_present=bool(wdpa_present and wdpa_geoms),
            wdpa_n=len(wdpa_geoms),
            project_n=len(project_geoms),
            ramsar_n=len(ramsar_geoms),
            stats=stats,
        ),
        encoding="utf-8",
    )
    wdpa_joined = bool(wdpa_present and wdpa_geoms)
    write_geojson(
        dest / "flags" / "coverage.json",
        {
            "built": utc_now(),
            "bead": "khm-i6e.6",
            "wdpa_join_bead": "khm-i6e.6.1" if wdpa_joined else None,
            "wdpa_present": wdpa_joined,
            "wdpa_polygon_count": len(wdpa_geoms),
            "ramsar_polygon_count": len(ramsar_geoms),
            "project_ring_count": len(project_geoms),
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
    manifest["phase2"] = {
        "bead": "khm-i6e.6",
        "wdpa_joined": wdpa_joined,
        "wdpa_join_bead": "khm-i6e.6.1" if wdpa_joined else None,
        "stop_legal_status": "unavailable",
        "project_overlap_sources": ["vcs-1748"] if project_geoms else [],
        "gaps_doc": "flags/GAPS.md",
    }
    notes = [n for n in (manifest.get("notes") or []) if not str(n).startswith("Phase 2 flags (")]
    notes.append(
        f"Phase 2 flags ({args.out_version}): permit_gate "
        f"{'from WDPA+Ramsar (khm-i6e.6.1)' if wdpa_joined else 'partial (WDPA absent)'}; "
        f"stop_legal unavailable; project_overlap from VCS 1748 when staged. See flags/GAPS.md."
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
