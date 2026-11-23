#!/usr/bin/env python3
"""Build open-cleared GO ± CAUTION GeoJSON bundle (≥ MMU) for MapLibre MVP.

Reads ``inputs/screen-layers/L_class_10m/class_step3.tif`` (EPSG:32648, 10 m),
keeps GO classes 6/8 and (by default) CAUTION classes 4/5/7/9, sieves patches
smaller than MMU 0.5 ha, polygonises, attributes for the delivery contract, and
writes under ``delivery/open-cleared/<version>/`` (never under FLAG staging).

On thin clones without the class GeoTIFF, pass ``--sample-stub`` to emit an
illustrative FeatureCollection from case-study windows A/C (not production).

Licence: class raster inherits FLAG/INTERNAL until the register clears the
intended use (bead ``khm-i6e.2``). This script always sets
``public_ready: false`` in the manifest; do not flip that without the gate.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform
from shapely.geometry import box

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
CLASS_TIF = LAYERS / "L_class_10m" / "class_step3.tif"
CASES_JSON = LAYERS / "L_class_10m" / "visualizations" / "step3-case-studies.json"
L20 = LAYERS / "L20" / "coastal-four-provinces.geojson"
DELIVERY = ROOT / "delivery" / "open-cleared"

RES_M = 10.0
MMU_HA = 0.5
MMU_PX = int(round(MMU_HA * 10_000 / (RES_M * RES_M)))  # 50
NODATA = 255

CLASS_META = {
    4: {"class_name": "caution_tidal_flat", "suitability": "caution"},
    5: {"class_name": "caution_other_converted", "suitability": "caution"},
    6: {"class_name": "go_inactive_pond", "suitability": "go"},
    7: {"class_name": "caution_active_pond", "suitability": "caution"},
    8: {"class_name": "go_open_or_accreted", "suitability": "go"},
    9: {"class_name": "caution_history_unproven", "suitability": "caution"},
}
GO_CLASSES = {6, 8}
CAUTION_CLASSES = {4, 5, 7, 9}

# Physical / land-cover screen only — never planting permission.
PRODUCT_BANNER = (
    "Physical / land-cover suitability proxy only. GO = worth a field look. "
    "Not MoE zoning, tenure clearance, planting permission, or a carbon outcome."
)

REGISTER_ID = "note3b-step3-class"
LICENCE_PLAIN = (
    "Derived from class_step3 (FLAG/INTERNAL upstreams may apply). "
    "Not cleared for public redistribution until licence gate (khm-i6e.2)."
)


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_file(path: Path) -> str | None:
    if not path.is_file():
        return None
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sieve_binary(mask: np.ndarray, min_pixels: int) -> np.ndarray:
    """Drop connected components smaller than min_pixels (8-connectivity)."""
    from rasterio import features

    if min_pixels <= 1:
        return mask
    sieved = features.sieve(mask.astype("uint8"), size=min_pixels, connectivity=8)
    return (sieved > 0).astype("uint8")


def to_wgs84(geom, src_crs):
    from pyproj import Transformer

    transformer = Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)

    def _xy(x, y, z=None):
        lon, lat = transformer.transform(x, y)
        return (lon, lat) if z is None else (lon, lat, z)

    return shp_transform(_xy, geom)


def province_lookup(provinces_gdf, geom_wgs84):
    """Return shapeName of first intersecting coastal province, else None."""
    if provinces_gdf is None or geom_wgs84.is_empty:
        return None
    hits = provinces_gdf[provinces_gdf.intersects(geom_wgs84)]
    if hits.empty:
        return None
    return str(hits.iloc[0]["shapeName"])


def feature_props(
    *,
    fid: str,
    class_id: int,
    area_ha: float,
    province: str | None,
    source: str,
    stub: bool,
) -> dict:
    meta = CLASS_META[class_id]
    return {
        "id": fid,
        "class_id": class_id,
        "class_name": meta["class_name"],
        "suitability": meta["suitability"],
        "area_ha": round(float(area_ha), 4),
        "mmu_ha": MMU_HA,
        "province": province,
        "evidence_class": "derived_screen",
        "register_id": REGISTER_ID,
        "licence_plain": LICENCE_PLAIN,
        "licence_spdx": None,
        "redistributable": False,
        "public_ready": False,
        "source_raster": source,
        "product_banner": PRODUCT_BANNER,
        "stub": stub,
    }


def _round_coords(obj, nd: int = 5):
    """Round nested GeoJSON coordinates (≈1 m at equator for nd=5)."""
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(x), nd) for x in obj]
        return [_round_coords(x, nd) for x in obj]
    return obj


def compact_feature_collection(fc: dict, *, coord_decimals: int = 5) -> dict:
    """Drop indent bloat and quantise coordinates for git-safe GeoJSON."""
    out = {"type": "FeatureCollection", "features": []}
    for feat in fc.get("features", []):
        geom = feat.get("geometry")
        if geom and "coordinates" in geom:
            geom = {
                **geom,
                "coordinates": _round_coords(geom["coordinates"], coord_decimals),
            }
        out["features"].append(
            {
                "type": "Feature",
                "properties": feat.get("properties", {}),
                "geometry": geom,
            }
        )
    return out


def write_bundle(
    out_dir: Path,
    *,
    version: str,
    stub: bool,
    completeness: str,
    features_fc: dict,
    cases: list | None,
    source_sha: str | None,
    notes: list[str],
):
    layers_dir = out_dir / "layers"
    layers_dir.mkdir(parents=True, exist_ok=True)
    schema_dir = out_dir / "schema"
    schema_dir.mkdir(parents=True, exist_ok=True)

    go_caut_path = layers_dir / "go-caution.geojson"
    # Compact + 5-dp coords keeps full GO±CAUTION under GitHub's soft size limit.
    fc_out = compact_feature_collection(features_fc) if not stub else features_fc
    if stub:
        go_caut_path.write_text(json.dumps(fc_out, indent=2) + "\n")
    else:
        go_caut_path.write_text(json.dumps(fc_out, separators=(",", ":")) + "\n")
    features_fc = fc_out  # stats / counts use the written geometry set
    layer_index = [
        {
            "id": "go-caution",
            "title": "GO ± CAUTION patches (≥ MMU)",
            "kind": "overlay",
            "file": "layers/go-caution.geojson",
            "crs": "EPSG:4326",
            "suitability_filter": ["go", "caution"],
            "evidence_class": "derived_screen",
            "register_id": REGISTER_ID,
            "licence_plain": LICENCE_PLAIN,
            "licence_spdx": None,
            "redistributable": False,
            "public_ready": False,
            "default_visible": True,
            "note": PRODUCT_BANNER,
            "stub": stub,
        }
    ]
    (layers_dir / "index.json").write_text(json.dumps(layer_index, indent=2) + "\n")

    if cases is not None:
        cases_dir = out_dir / "cases"
        cases_dir.mkdir(parents=True, exist_ok=True)
        (cases_dir / "cases.json").write_text(json.dumps(cases, indent=2) + "\n")

    schema = {
        "feature_properties": {
            "id": "stable feature id (string)",
            "class_id": "Note 3b class code: GO 6|8; CAUTION 4|5|7|9",
            "class_name": "snake_case class label",
            "suitability": "go | caution",
            "area_ha": "planar area on EPSG:32648 before WGS84 export",
            "mmu_ha": "minimum mapping unit applied at vectorise (0.5)",
            "province": "Koh Kong | Preah Sihanouk | Kampot | Kep | null",
            "evidence_class": "derived_screen",
            "register_id": REGISTER_ID,
            "licence_plain": "human licence line; never imply public clear",
            "licence_spdx": "null until open-cleared",
            "redistributable": False,
            "public_ready": False,
            "source_raster": "path or 'sample-stub'",
            "product_banner": "must surface in MapLibre UI",
            "stub": "true when not from full class_step3.tif",
        },
        "maplibre_hint": {
            "source_layer": "go-caution",
            "paint_by": "suitability",
            "go_color": "#0099AA",
            "caution_color": "#C4A35A",
            "filter_example": ["in", ["get", "suitability"], ["literal", ["go", "caution"]]],
        },
    }
    (schema_dir / "feature-properties.json").write_text(json.dumps(schema, indent=2) + "\n")

    n_go = sum(1 for f in features_fc["features"] if f["properties"]["suitability"] == "go")
    n_caut = sum(1 for f in features_fc["features"] if f["properties"]["suitability"] == "caution")
    ha_go = sum(f["properties"]["area_ha"] for f in features_fc["features"] if f["properties"]["suitability"] == "go")
    ha_caut = sum(
        f["properties"]["area_ha"] for f in features_fc["features"] if f["properties"]["suitability"] == "caution"
    )

    manifest = {
        "version": version,
        "built": utc_now(),
        "stub": stub,
        "completeness": completeness,
        "public_ready": False,
        "licence_gate": "blocked_pending_khm-i6e.2",
        "product_banner": PRODUCT_BANNER,
        "crs_geometry": "EPSG:4326",
        "source_grid": "EPSG:32648",
        "resolution_m": RES_M,
        "mmu_ha": MMU_HA,
        "mmu_pixels": MMU_PX,
        "classes_included": {
            "go": sorted(GO_CLASSES),
            "caution": sorted(CAUTION_CLASSES),
        },
        "source_raster": str(CLASS_TIF.relative_to(ROOT)) if CLASS_TIF.is_file() else None,
        "source_raster_sha256": source_sha,
        "families": ["layers", "cases", "schema"],
        "stats": {
            "feature_count": len(features_fc["features"]),
            "go_features": n_go,
            "caution_features": n_caut,
            "go_ha": round(ha_go, 4),
            "caution_ha": round(ha_caut, 4),
        },
        "notes": notes,
        "path_policy": (
            "Ship only under delivery/open-cleared/. Do not copy FLAG rasters or "
            "inputs/screen-layers binaries into this tree or a public remote."
        ),
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    readme = f"""# Open-cleared GO ± CAUTION bundle `{version}`

**Status:** stub={stub} · completeness=`{completeness}` · **public_ready=false**

{PRODUCT_BANNER}

## Contents

| Path | Role |
| --- | --- |
| `manifest.json` | Version, licence gate, stats |
| `layers/go-caution.geojson` | MapLibre FeatureCollection (EPSG:4326) |
| `layers/index.json` | Layer catalogue (LKA-style fields) |
| `cases/cases.json` | Case A–C bookmarks (when present) |
| `schema/feature-properties.json` | Attribute contract for MVP |

## Build

```bash
# Full stack (host with class_step3.tif):
python3 intermediate/screen-build/build_open_cleared_go_bundle.py

# Thin clone / CI without raster:
python3 intermediate/screen-build/build_open_cleared_go_bundle.py --sample-stub
```

## Licence

Do **not** mark public-ready or push to public Pages until bead `khm-i6e.2`
clears FLAG inheritance for this derivative. Bundle stays INTERNAL / gated.

## Notes

{chr(10).join("- " + n for n in notes)}
"""
    (out_dir / "README.md").write_text(readme)


def load_provinces():
    if not L20.is_file():
        return None
    import geopandas as gpd

    return gpd.read_file(L20).to_crs("EPSG:4326")


def load_cases() -> list:
    if not CASES_JSON.is_file():
        return []
    return json.loads(CASES_JSON.read_text())


def build_from_raster(*, include_caution: bool, version: str, out_dir: Path) -> None:
    import rasterio
    from rasterio import features as rio_features
    from rasterio.transform import xy as rio_xy

    classes = set(GO_CLASSES)
    if include_caution:
        classes |= CAUTION_CLASSES

    provinces = load_provinces()
    cases = load_cases()
    source_rel = str(CLASS_TIF.relative_to(ROOT))
    source_sha = sha256_file(CLASS_TIF)

    with rasterio.open(CLASS_TIF) as ds:
        data = ds.read(1)
        transform = ds.transform
        crs = ds.crs
        nodata = ds.nodata if ds.nodata is not None else NODATA

    feats = []
    seq = 0
    for class_id in sorted(classes):
        mask = (data == class_id).astype("uint8")
        if nodata is not None:
            mask[data == nodata] = 0
        mask = sieve_binary(mask, MMU_PX)
        if not mask.any():
            continue
        for geom, val in rio_features.shapes(mask, mask=mask.astype(bool), transform=transform):
            if int(val) != 1:
                continue
            g = shape(geom)
            if g.is_empty:
                continue
            area_ha = g.area / 10_000.0
            if area_ha < MMU_HA - 1e-9:
                continue
            g84 = to_wgs84(g, crs)
            if not g84.is_valid:
                g84 = g84.buffer(0)
            seq += 1
            fid = f"c{class_id}-{seq:05d}"
            province = province_lookup(provinces, g84)
            feats.append(
                {
                    "type": "Feature",
                    "properties": feature_props(
                        fid=fid,
                        class_id=class_id,
                        area_ha=area_ha,
                        province=province,
                        source=source_rel,
                        stub=False,
                    ),
                    "geometry": mapping(g84),
                }
            )

    fc = {"type": "FeatureCollection", "features": feats}
    write_bundle(
        out_dir,
        version=version,
        stub=False,
        completeness="full_raster_vectorised",
        features_fc=fc,
        cases=cases or None,
        source_sha=source_sha,
        notes=[
            f"Vectorised from {source_rel} with MMU {MMU_HA} ha ({MMU_PX} px).",
            "GO classes 6/8"
            + ("; CAUTION 4/5/7/9 included." if include_caution else "; CAUTION omitted (--go-only)."),
            "public_ready remains false until khm-i6e.2.",
        ],
    )


def square_around(lon: float, lat: float, area_ha: float):
    """Axis-aligned square in WGS84 approx, sized to area_ha at ~11°N."""
    # metres per degree
    m_per_deg_lat = 111_320.0
    m_per_deg_lon = 111_320.0 * math.cos(math.radians(lat))
    side_m = math.sqrt(max(area_ha, MMU_HA) * 10_000.0)
    dlon = (side_m / 2.0) / m_per_deg_lon
    dlat = (side_m / 2.0) / m_per_deg_lat
    return box(lon - dlon, lat - dlat, lon + dlon, lat + dlat)


def build_sample_stub(*, version: str, out_dir: Path) -> None:
    """Illustrative polygons from case windows A (GO) and C (CAUTION). Not production."""
    cases = load_cases()
    by_id = {c["id"]: c for c in cases}
    provinces = load_provinces()
    feats = []

    # Case A — GO open/accreted focus (class 8)
    a = by_id.get("A") or {
        "id": "A",
        "lon": 103.5857,
        "lat": 11.176,
        "focus": 8,
        "focus_ha": 189.93,
        "place": "Peam Krasaop hinterland, Koh Kong",
    }
    g_a = square_around(a["lon"], a["lat"], float(a["focus_ha"]))
    feats.append(
        {
            "type": "Feature",
            "properties": {
                **feature_props(
                    fid="sample-A-go-open-accreted",
                    class_id=int(a["focus"]),
                    area_ha=float(a["focus_ha"]),
                    province=province_lookup(provinces, g_a) or "Koh Kong",
                    source="sample-stub",
                    stub=True,
                ),
                "case_id": "A",
                "place": a.get("place"),
                "note": "SAMPLE: axis-aligned square sized to case A focus_ha — not raster vectorisation.",
            },
            "geometry": mapping(g_a),
        }
    )

    # Case C — CAUTION tidal flat (class 4)
    c = by_id.get("C") or {
        "id": "C",
        "lon": 103.8624,
        "lat": 10.6436,
        "focus": 4,
        "focus_ha": 382.42,
        "place": "Preah Sihanouk / Kampot coast",
    }
    g_c = square_around(c["lon"], c["lat"], float(c["focus_ha"]))
    feats.append(
        {
            "type": "Feature",
            "properties": {
                **feature_props(
                    fid="sample-C-caution-tidal-flat",
                    class_id=int(c["focus"]),
                    area_ha=float(c["focus_ha"]),
                    province=province_lookup(provinces, g_c),
                    source="sample-stub",
                    stub=True,
                ),
                "case_id": "C",
                "place": c.get("place"),
                "note": "SAMPLE: axis-aligned square sized to case C focus_ha — not raster vectorisation.",
            },
            "geometry": mapping(g_c),
        }
    )

    # Tiny GO inactive-pond placeholder near case A (schema demo for class 6)
    g6 = square_around(a["lon"] + 0.02, a["lat"] - 0.015, 1.2)
    feats.append(
        {
            "type": "Feature",
            "properties": {
                **feature_props(
                    fid="sample-go-inactive-pond-demo",
                    class_id=6,
                    area_ha=1.2,
                    province=province_lookup(provinces, g6) or "Koh Kong",
                    source="sample-stub",
                    stub=True,
                ),
                "note": "SAMPLE: synthetic class-6 patch for MapLibre attribute demo (≥ MMU).",
            },
            "geometry": mapping(g6),
        }
    )

    fc = {"type": "FeatureCollection", "features": feats}
    write_bundle(
        out_dir,
        version=version,
        stub=True,
        completeness="sample_stub_no_raster",
        features_fc=fc,
        cases=cases or None,
        source_sha=None,
        notes=[
            f"class_step3.tif missing at {CLASS_TIF.relative_to(ROOT)}; sample stub only.",
            "Re-run without --sample-stub on a host with the full screen stack.",
            "Follow-up bead: host-with-full-stack vectorise (see bd).",
            "public_ready remains false until khm-i6e.2.",
        ],
    )


def parse_args():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--version",
        default="v0.1.0-stub",
        help="Bundle directory name under delivery/open-cleared/ (default: v0.1.0-stub)",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Override output directory (default: delivery/open-cleared/<version>)",
    )
    p.add_argument(
        "--sample-stub",
        action="store_true",
        help="Emit case-window sample GeoJSON when class_step3.tif is absent (or force sample).",
    )
    p.add_argument(
        "--go-only",
        action="store_true",
        help="Vectorise GO classes only (omit CAUTION).",
    )
    p.add_argument(
        "--force-sample",
        action="store_true",
        help="Force sample stub even if class_step3.tif exists.",
    )
    return p.parse_args()


def main():
    args = parse_args()
    out_dir = args.out or (DELIVERY / args.version)
    include_caution = not args.go_only

    if args.force_sample or args.sample_stub or not CLASS_TIF.is_file():
        if not CLASS_TIF.is_file():
            print(f"WARN: missing {CLASS_TIF}; building sample stub.", flush=True)
        build_sample_stub(version=args.version, out_dir=out_dir)
        print("WROTE", out_dir, "(sample stub)", flush=True)
        return

    build_from_raster(include_caution=include_caution, version=args.version, out_dir=out_dir)
    print("WROTE", out_dir, "(full vectorise)", flush=True)


if __name__ == "__main__":
    main()
