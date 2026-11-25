#!/usr/bin/env python3
"""Add CAUTION class 7 (active pond) polygons to open-cleared v0.3.0 go-caution.

Vectorises class 7 from class_step3.tif (≥ MMU 0.5 ha, L20 clip). Source pond
rasters (Jiang / Clark) stay offline — only screened polygons enter the public
tree. Research / non-commercial posture; no FLAG GeoTIFF copied into delivery/.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "intermediate" / "screen-build"))

from build_open_cleared_go_bundle import (  # noqa: E402
    CLASS_TIF,
    MMU_HA,
    MMU_PX,
    cambodia_mask,
    compact_feature_collection,
    feature_props,
    load_provinces,
    province_lookup,
    sieve_binary,
    to_wgs84,
)
from enrich_open_cleared_holdbacks import join_elevation, join_overlays  # noqa: E402
from shapely.geometry import shape
from shapely.ops import transform as shp_transform

BUNDLE = ROOT / "delivery" / "open-cleared" / "v0.3.0"
GO_PATH = BUNDLE / "layers" / "go-caution.geojson"
INDEX_PATH = BUNDLE / "layers" / "index.json"
MANIFEST_PATH = BUNDLE / "manifest.json"
GAPS_PATH = BUNDLE / "flags" / "GAPS.md"

POND_LICENCE = (
    "Open-cleared research screen: Note 3b class 7 (active / intermittent pond hold-back) "
    "vectorised ≥0.5 ha. Upstream pond footprints informed the class raster; Jiang/Clark "
    "source rasters stay offline. Non-commercial / research only — not planting permission."
)


def vectorise_class7() -> list[dict]:
    import rasterio
    from pyproj import Transformer
    from rasterio import features as rio_features

    provinces = load_provinces()
    khm_mask = cambodia_mask(provinces)
    source_rel = str(CLASS_TIF.relative_to(ROOT))

    with rasterio.open(CLASS_TIF) as ds:
        data = ds.read(1)
        transform = ds.transform
        crs = ds.crs
        nodata = ds.nodata if ds.nodata is not None else 255

    mask = (data == 7).astype("uint8")
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
        fid = f"c7-{seq:05d}"
        props = feature_props(
            fid=fid,
            class_id=7,
            area_ha=area_ha,
            province=province_lookup(provinces, g84),
            source=source_rel,
            stub=False,
            open_cleared=True,
        )
        props["licence_plain"] = POND_LICENCE
        props["class_name"] = "caution_active_pond"
        from shapely.geometry import mapping

        feats.append({"type": "Feature", "properties": props, "geometry": mapping(g84)})
    print(f"vectorised class 7 features={len(feats)}")
    return feats


def update_index_and_manifest(features: list[dict], elev_fail_n: int) -> None:
    idx = json.loads(INDEX_PATH.read_text())
    for layer in idx:
        if layer["id"] == "go-caution":
            layer["title"] = (
                "GO open land ± CAUTION (tide, converted, ponds, elevation) — open research pack"
            )
            layer["classes_included"] = [8, 4, 5, 7]
            layer["licence_plain"] = (
                "Open research pack: Note 3b classes 8, 4, 5, and 7 (active pond hold-back). "
                "Elevation fail from height vs tide model demotes GO to CAUTION. Upstream CC BY 4.0 "
                "(GMW, Dynamic World, Murray tide flats, geoBoundaries) + height/tide research screen. "
                "Pond source rasters stay offline; screened polygons only. Non-commercial / research."
            )
            layer["note"] = (
                "Land-cover screen only. GO = open land worth a field look. CAUTION paints: tide, "
                "converted land, active ponds, and height fails. Rights / carbon project flags are "
                "extra context. Not planting permission."
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

    man["classes_included"] = {"go": [8], "caution": [4, 5, 7]}
    man["product_banner"] = (
        "Land-cover screen for four coastal provinces (open land, tide, converted land, active ponds, "
        "height check). GO = worth a field look. Not ministry zoning, land rights, planting permission, "
        "or a carbon score. Non-commercial / research use."
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
        if "Classes included" not in n and "class 7 ponds excluded" not in n
    ]
    notes.insert(
        0,
        f"Classes included: [4, 5, 7, 8]. Class 7 = active pond CAUTION (≥{MMU_HA} ha). "
        "Pond source rasters stay offline.",
    )
    man["notes"] = notes
    attr = man.get("attribution", [])
    for a in [
        "Note 3b class 7 active-pond screen (research polygons; source pond rasters offline)",
    ]:
        if a not in attr:
            attr.append(a)
    man["attribution"] = attr
    from datetime import datetime, timezone

    man["built"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    MANIFEST_PATH.write_text(json.dumps(man, indent=2) + "\n")

    if GAPS_PATH.is_file():
        text = GAPS_PATH.read_text()
        text = text.replace(
            "Class 5 converted open limb also painted; class 7 ponds stay off public",
            "Class 5 converted and class 7 active-pond hold-backs painted; pond source rasters stay offline",
        )
        GAPS_PATH.write_text(text)


def main() -> None:
    if not GO_PATH.is_file():
        raise SystemExit(f"missing {GO_PATH}")
    if not CLASS_TIF.is_file():
        raise SystemExit(f"missing {CLASS_TIF}")

    existing = json.loads(GO_PATH.read_text())
    base = [f for f in existing["features"] if f["properties"].get("class_id") != 7]
    class7 = vectorise_class7()
    features = base + class7
    elev_fail_n, _ = join_elevation(features)
    join_overlays(features)

    fc = compact_feature_collection({"type": "FeatureCollection", "features": features})
    GO_PATH.write_text(json.dumps(fc, separators=(",", ":")) + "\n")
    update_index_and_manifest(fc["features"], elev_fail_n)
    print(f"wrote {GO_PATH} features={len(fc['features'])} bytes={GO_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
