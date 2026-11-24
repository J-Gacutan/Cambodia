#!/usr/bin/env python3
"""Enrich open-cleared v0.3.0 go-caution with converted (class 5) + elevation_fail paints.

Non-FLAG open limbs only:
  - class 5 (other converted — Dynamic World crops/trees limb). Class 7 ponds stay out.
  - elevation_check_flag_10m.tif flag=1 joined onto patches; GO that fails elev demotes to CAUTION.

Preserves existing VERRA/WDPA overlays in layers/index.json. Re-joins permit_gate /
project_overlap for newly added class-5 features when sources are present.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform
from shapely.strtree import STRtree
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "intermediate" / "screen-build"))

from build_open_cleared_go_bundle import (  # noqa: E402
    CLASS_TIF,
    L20,
    MMU_HA,
    MMU_PX,
    OPEN_CLEARED_BANNER,
    OPEN_CLEARED_LICENCE_PLAIN,
    RES_M,
    cambodia_mask,
    compact_feature_collection,
    feature_props,
    load_provinces,
    province_lookup,
    sieve_binary,
    to_wgs84,
)

BUNDLE = ROOT / "delivery" / "open-cleared" / "v0.3.0"
GO_PATH = BUNDLE / "layers" / "go-caution.geojson"
INDEX_PATH = BUNDLE / "layers" / "index.json"
MANIFEST_PATH = BUNDLE / "manifest.json"
ELEV_TIF = ROOT / "inputs" / "screen-layers" / "L13" / "elevation_check_flag_10m.tif"
VERRA_IDS = [
    "project-overlap-vcs1748",
    "project-overlap-vcs5071",
    "project-overlap-vcs5584",
]


def valid(g):
    if g.is_empty:
        return g
    if not g.is_valid:
        g = make_valid(g)
    return g


def vectorise_class5() -> list[dict]:
    import rasterio
    from rasterio import features as rio_features
    from pyproj import Transformer

    provinces = load_provinces()
    khm_mask = cambodia_mask(provinces)
    source_rel = str(CLASS_TIF.relative_to(ROOT))

    with rasterio.open(CLASS_TIF) as ds:
        data = ds.read(1)
        transform = ds.transform
        crs = ds.crs
        nodata = ds.nodata if ds.nodata is not None else 255

    mask = (data == 5).astype("uint8")
    if nodata is not None:
        mask[data == nodata] = 0
    mask = sieve_binary(mask, MMU_PX)
    feats: list[dict] = []
    seq = 0
    for geom, val in rio_features.shapes(mask, mask=mask.astype(bool), transform=transform):
        if int(val) != 1:
            continue
        g = shape(geom)
        if g.is_empty:
            continue
        g84 = to_wgs84(g, crs)
        if not g84.is_valid:
            g84 = g84.buffer(0)
        if khm_mask is not None:
            if not g84.intersects(khm_mask):
                continue
            g84 = g84.intersection(khm_mask)
            if not g84.is_valid:
                g84 = g84.buffer(0)
            if g84.is_empty or g84.geom_type not in ("Polygon", "MultiPolygon"):
                continue
            inv = Transformer.from_crs("EPSG:4326", crs, always_xy=True)

            def _back(x, y, z=None):
                xx, yy = inv.transform(x, y)
                return (xx, yy) if z is None else (xx, yy, z)

            g_m = shp_transform(_back, g84)
            area_ha = g_m.area / 10_000.0
        else:
            area_ha = g.area / 10_000.0
        if area_ha < MMU_HA - 1e-9:
            continue
        seq += 1
        fid = f"c5-{seq:05d}"
        props = feature_props(
            fid=fid,
            class_id=5,
            area_ha=area_ha,
            province=province_lookup(provinces, g84),
            source=source_rel,
            stub=False,
            open_cleared=True,
        )
        # Phase-2 defaults until join below
        props.update(
            {
                "permit_gate": False,
                "permit_gate_sources": None,
                "permit_instrument": None,
                "stop_legal": None,
                "stop_legal_status": "unavailable",
                "stop_legal_instrument": "ENR Code Art. 364",
                "stop_legal_note": "MoE core-zone GIS not provided",
                "project_overlap": False,
                "project_overlap_ids": [],
                "elevation_fail": False,
                "flag_sources_complete": {"wdpa_l17": True, "ramsar_l18": True, "verra": True},
            }
        )
        feats.append({"type": "Feature", "properties": props, "geometry": mapping(g84)})
    print(f"class 5 features ≥ MMU coastal: {len(feats)}", flush=True)
    return feats


def join_elevation(features: list[dict]) -> tuple[int, int]:
    """Set elevation_fail from L13 flag=1; demote GO → caution when fail.

    Uses per-feature windows (not a full-raster mask) so thousands of patches finish quickly.
    """
    import rasterio
    from rasterio.features import geometry_mask
    from rasterio.windows import from_bounds
    from pyproj import Transformer

    to_grid = Transformer.from_crs("EPSG:4326", "EPSG:32648", always_xy=True)

    def project(g):
        def _xy(x, y, z=None):
            xx, yy = to_grid.transform(x, y)
            return (xx, yy) if z is None else (xx, yy, z)

        return shp_transform(_xy, g)

    fail_n = 0
    demote_n = 0
    with rasterio.open(ELEV_TIF) as ds:
        nodata = ds.nodata
        for i, feat in enumerate(features):
            if i and i % 500 == 0:
                print(f"  elev join {i}/{len(features)}…", flush=True)
            g = valid(shape(feat["geometry"]))
            if g.is_empty:
                feat["properties"]["elevation_fail"] = False
                continue
            g_m = project(g)
            if g_m.is_empty:
                feat["properties"]["elevation_fail"] = False
                continue
            minx, miny, maxx, maxy = g_m.bounds
            if not np.isfinite([minx, miny, maxx, maxy]).all():
                feat["properties"]["elevation_fail"] = False
                continue
            try:
                window = from_bounds(minx, miny, maxx, maxy, transform=ds.transform)
                # pad one cell so edge polygons still sample
                window = window.round_offsets().round_lengths()
                data = ds.read(1, window=window, boundless=True, fill_value=int(nodata or 255))
                win_transform = ds.window_transform(window)
                mask = geometry_mask(
                    [mapping(g_m)],
                    out_shape=data.shape,
                    transform=win_transform,
                    invert=True,
                    all_touched=True,
                )
            except Exception:
                feat["properties"]["elevation_fail"] = False
                continue
            pixels = data[mask]
            if nodata is not None:
                pixels = pixels[pixels != nodata]
            tested = pixels[(pixels == 0) | (pixels == 1)]
            if tested.size == 0:
                fail = False
            else:
                fail = bool((tested == 1).sum() >= max(1, tested.size // 2))
            feat["properties"]["elevation_fail"] = fail
            if fail:
                fail_n += 1
                if feat["properties"].get("suitability") == "go":
                    feat["properties"]["suitability"] = "caution"
                    feat["properties"]["elevation_demoted_from_go"] = True
                    demote_n += 1
    print(f"elevation_fail={fail_n}, demoted GO→caution={demote_n}", flush=True)
    return fail_n, demote_n


def join_overlays(features: list[dict]) -> None:
    """Re-join VERRA + Ramsar/WDPA context onto features missing hits (esp. new class 5)."""
    # VERRA
    verra_polys = []
    verra_labels = []
    for vid in VERRA_IDS:
        path = BUNDLE / "layers" / f"{vid}.geojson"
        if not path.is_file():
            continue
        fc = json.loads(path.read_text())
        nice = "VCS " + vid.replace("project-overlap-vcs", "")
        for f in fc["features"]:
            g = valid(shape(f["geometry"]))
            if g.is_empty:
                continue
            verra_polys.append(g)
            verra_labels.append(nice)
    tree = STRtree(verra_polys) if verra_polys else None

    # Ramsar + WDPA coastal overlays already in pack
    permit_polys = []
    for name in ("ramsar-context.geojson", "wdpa-context.geojson"):
        path = BUNDLE / "layers" / name
        if not path.is_file():
            continue
        fc = json.loads(path.read_text())
        for f in fc["features"]:
            g = valid(shape(f["geometry"]))
            if not g.is_empty:
                permit_polys.append(g)
    permit_tree = STRtree(permit_polys) if permit_polys else None

    verra_true = 0
    permit_true = 0
    for feat in features:
        g = valid(shape(feat["geometry"]))
        p = feat["properties"]
        # VERRA
        hits = []
        if tree is not None and not g.is_empty:
            for idx in tree.query(g):
                i = int(idx)
                try:
                    if g.intersects(verra_polys[i]):
                        hits.append(verra_labels[i])
                except Exception:
                    if g.buffer(0).intersects(verra_polys[i].buffer(0)):
                        hits.append(verra_labels[i])
        hits = sorted(set(hits))
        if hits:
            p["project_overlap"] = True
            p["project_overlap_ids"] = hits
            p["project_overlap_note"] = (
                "Inside staged VERRA boundary — double-counting / access check; not a registry decision."
            )
            verra_true += 1
        else:
            p["project_overlap"] = False
            p["project_overlap_ids"] = []
            p.pop("project_overlap_note", None)

        # permit
        hit_permit = False
        if permit_tree is not None and not g.is_empty:
            for idx in permit_tree.query(g):
                i = int(idx)
                try:
                    if g.intersects(permit_polys[i]):
                        hit_permit = True
                        break
                except Exception:
                    if g.buffer(0).intersects(permit_polys[i].buffer(0)):
                        hit_permit = True
                        break
        # Keep existing True from prior WDPA join if overlays miss inland detail
        if hit_permit or p.get("permit_gate") is True:
            p["permit_gate"] = True
            permit_true += 1
        elif p.get("permit_gate") is None:
            p["permit_gate"] = False
        else:
            p["permit_gate"] = bool(p.get("permit_gate"))

    print(f"project_overlap true={verra_true}, permit_gate true={permit_true}")


def update_index_and_manifest(features: list[dict], elev_fail_n: int) -> None:
    idx = json.loads(INDEX_PATH.read_text())
    for layer in idx:
        if layer["id"] == "go-caution":
            layer["title"] = "GO class 8 ± CAUTION (tidal 4, converted 5, elevation demote) — open-cleared"
            layer["classes_included"] = [8, 4, 5]
            layer["licence_plain"] = (
                "Open-cleared derivative: Note 3b class 8, class 4, class 5 (converted — non-FLAG DW limb). "
                "Elevation fail from L12/L13 demotes GO to CAUTION. Upstream CC BY 4.0 (GMW, Dynamic World, "
                "Murray GIC, geoBoundaries) + DeltaDTM/FES2022 research screen. No Jiang/Clark pond geometries. "
                "Non-commercial / research (khm-i6e.2 P2)."
            )
            layer["note"] = (
                "Physical / land-cover suitability proxy. GO = open/accreted worth a field look. "
                "CAUTION paints: tidal (class 4), converted (class 5), elevation (L12/L13 fail on GO). "
                "Tenure/VERRA via flags + overlays. Not planting permission."
            )
            break
    INDEX_PATH.write_text(json.dumps(idx, indent=2) + "\n")

    man = json.loads(MANIFEST_PATH.read_text())
    n_go = sum(1 for f in features if f["properties"]["suitability"] == "go")
    n_caut = sum(1 for f in features if f["properties"]["suitability"] == "caution")
    ha_go = sum(f["properties"]["area_ha"] for f in features if f["properties"]["suitability"] == "go")
    ha_caut = sum(
        f["properties"]["area_ha"] for f in features if f["properties"]["suitability"] == "caution"
    )
    by_class: dict[str, int] = {}
    for f in features:
        cid = str(f["properties"]["class_id"])
        by_class[cid] = by_class.get(cid, 0) + 1

    man["classes_included"] = {"go": [8], "caution": [4, 5]}
    man["product_banner"] = (
        "Physical / land-cover suitability proxy (open-cleared class 8 ± 4/5 + elevation demote). "
        "GO = worth a field look. CAUTION paints tidal, converted (class 5), and elevation-fail. "
        "Tenure/VERRA via flags and overlays. Not MoE zoning, tenure clearance, planting permission, "
        "or a carbon outcome. Non-commercial / research use."
    )
    man["stats"] = {
        **man.get("stats", {}),
        "feature_count": len(features),
        "go_features": n_go,
        "caution_features": n_caut,
        "go_ha": round(ha_go, 4),
        "caution_ha": round(ha_caut, 4),
        "by_class": by_class,
        "elevation_fail_features": elev_fail_n,
    }
    notes = [
        n
        for n in man.get("notes", [])
        if "class 8 ± 4 only" not in n and "Phase 2 flags (v0.3.0)" not in n and "Classes included" not in n
    ]
    notes.insert(0, f"Classes included: [4, 5, 8] (class 7 ponds excluded — FLAG). MMU {MMU_HA} ha.")
    notes.append(
        f"Elevation hold-back: L13 elevation_check_flag_10m joined; {elev_fail_n} patches elevation_fail=true "
        "(GO demoted to CAUTION paint). Converted: class 5 open limb only."
    )
    notes.append(
        "Phase 2 flags: permit_gate from WDPA+Ramsar overlays; project_overlap from staged VCS 1748/5071/5584; "
        "stop_legal unavailable. Overlays redistributable=false where marked."
    )
    man["notes"] = notes
    attr = man.get("attribution", [])
    for a in [
        "DeltaDTM v1.1 (Pronk et al. 2024) + FES2022 amplitude-sum proxy — elevation check research screen",
        "Dynamic World (CC BY 4.0) — class 5 converted limb",
    ]:
        if a not in attr:
            attr.append(a)
    man["attribution"] = attr
    MANIFEST_PATH.write_text(json.dumps(man, indent=2) + "\n")


def main() -> None:
    if not GO_PATH.is_file():
        raise SystemExit(f"missing {GO_PATH}")
    if not CLASS_TIF.is_file():
        raise SystemExit(f"missing {CLASS_TIF}")
    if not ELEV_TIF.is_file():
        raise SystemExit(f"missing {ELEV_TIF}")

    existing = json.loads(GO_PATH.read_text())
    # Drop any prior class-5 enrichment so re-runs are idempotent
    base = [f for f in existing["features"] if f["properties"].get("class_id") != 5]
    for f in base:
        f["properties"].pop("elevation_demoted_from_go", None)
        # restore demoted GO if re-running
        if f["properties"].get("class_id") == 8 and f["properties"].get("suitability") == "caution":
            if f["properties"].get("elevation_fail"):
                pass  # will recompute
            else:
                f["properties"]["suitability"] = "go"

    class5 = vectorise_class5()
    features = base + class5
    elev_fail_n, _ = join_elevation(features)
    join_overlays(features)

    fc = compact_feature_collection({"type": "FeatureCollection", "features": features})
    GO_PATH.write_text(json.dumps(fc, separators=(",", ":")) + "\n")
    update_index_and_manifest(fc["features"], elev_fail_n)
    print(f"wrote {GO_PATH} features={len(fc['features'])} bytes={GO_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
