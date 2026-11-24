#!/usr/bin/env python3
"""Build public Locate mangrove-extent stub from GMW v4.1.12 2025 (CC BY 4.0).

Source: ArcGIS FeatureServer hosting GMW 2025 extent country vectors
(register L1; Zenodo 21346457). Fetches Cambodia (KHM), clips to L20 coastal
four provinces, MMU-filters, and simplifies for MapLibre. Does not copy FLAG /
INTERNAL rasters. Output: public/change-stubs/mangrove-extent.geojson + index.
"""
from __future__ import annotations

import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "change-stubs"
L20 = ROOT / "inputs/screen-layers/L20/coastal-four-provinces.geojson"

LAYER_URL = (
    "https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/"
    "Global_Mangrove_Watch_2025_Extent/FeatureServer/43/query"
)
USER_AGENT = "Cambodia-screen-research/1.0 (non-commercial; P2 open-cleared)"
PAGE = 1000
MMU_HA = 0.5
SIMPLIFY_DEG = 0.0009  # ~100 m at 11.5 N


def approx_ha(g84) -> float:
    cy = g84.centroid.y
    return float(g84.area * (111_320**2) * math.cos(math.radians(cy)) / 10_000)


def fetch_json(params: dict) -> dict:
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(
        f"{LAYER_URL}?{q}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            if attempt == 4:
                raise
            time.sleep(2**attempt)
            print(f"  retry after {err!r}")
    raise RuntimeError("unreachable")


def fetch_khm_features() -> list[dict]:
    """Paginate all KHM GMW 2025 polygons as GeoJSON features (EPSG:4326).

    Uses resultOffset (not IN (...)) so GET URLs stay under ArcGIS limits.
    """
    count_payload = fetch_json(
        {
            "where": "cntry_iso3='KHM'",
            "returnCountOnly": "true",
            "f": "json",
        }
    )
    total = int(count_payload.get("count") or 0)
    print(f"KHM feature count: {total}")
    features: list[dict] = []
    offset = 0
    while offset < total or (total == 0 and offset == 0):
        payload = fetch_json(
            {
                "where": "cntry_iso3='KHM'",
                "outFields": "fid,cntry_iso3,cntry_name,Shape__Area",
                "returnGeometry": "true",
                "outSR": "4326",
                "resultOffset": str(offset),
                "resultRecordCount": str(PAGE),
                "orderByFields": "fid ASC",
                "f": "geojson",
            }
        )
        batch = payload.get("features") or []
        if not batch:
            break
        features.extend(batch)
        offset += len(batch)
        print(f"  fetched {len(features)}/{total or '?'}")
        time.sleep(0.2)
        if len(batch) < PAGE:
            break
    return features


def load_coast() -> object:
    with L20.open() as f:
        fc = json.load(f)
    geoms = [shape(feat["geometry"]) for feat in fc["features"]]
    return unary_union(geoms)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    coast = load_coast()
    raw = fetch_khm_features()
    kept: list[tuple[object, float, int | None]] = []
    for feat in raw:
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        clipped = geom.intersection(coast)
        if clipped.is_empty:
            continue
        # Drop GeometryCollection noise; keep polygonal parts only.
        if clipped.geom_type == "GeometryCollection":
            polys = [g for g in clipped.geoms if g.geom_type in ("Polygon", "MultiPolygon")]
            if not polys:
                continue
            clipped = unary_union(polys)
        if clipped.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        area_ha = approx_ha(clipped)
        if area_ha < MMU_HA:
            continue
        simplified = clipped.simplify(SIMPLIFY_DEG, preserve_topology=True)
        if simplified.is_empty:
            continue
        if not simplified.is_valid:
            simplified = simplified.buffer(0)
        if simplified.is_empty or simplified.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        props = feat.get("properties") or {}
        kept.append((simplified, area_ha, props.get("fid")))

    kept.sort(key=lambda r: -r[1])
    print(f"kept after coastal clip + MMU {MMU_HA} ha: {len(kept)}")

    features_out = []
    for i, (geom, area_ha, src_fid) in enumerate(kept):
        features_out.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"gmw2025-ext-{i + 1:04d}",
                    "class_value": 1,
                    "class_label": "mangrove_extent_2025",
                    "area_ha_approx": round(area_ha, 2),
                    "register_id": "L1",
                    "year": 2025,
                    "source_fid": src_fid,
                    "stub": False,
                    "open_cleared": True,
                    "state_role": "extent",
                    "note": (
                        "GMW v4.1.12 2025 mangrove extent (stock). Coastal four-province clip, "
                        f"MMU {MMU_HA} ha, simplified for Locate. CC BY 4.0. Not a condition score."
                    ),
                },
                "geometry": mapping(geom),
            }
        )

    extent_path = OUT / "mangrove-extent.geojson"
    with extent_path.open("w") as f:
        json.dump({"type": "FeatureCollection", "features": features_out}, f, separators=(",", ":"))
    print(f"wrote {extent_path} ({extent_path.stat().st_size} bytes, {len(features_out)} features)")

    index_path = OUT / "index.json"
    with index_path.open() as f:
        index = json.load(f)

    extent_layer = {
        "id": "mangrove-extent",
        "file": "mangrove-extent.geojson",
        "title": "Mangrove extent 2025 (stock)",
        "register_id": "L1",
        "feature_count": len(features_out),
        "stub": False,
        "state_role": "extent",
        "native_resolution_m": 30,
        "display_resolution_m": 100,
        "resolution_plain": (
            "GMW v4.1.12 2025 extent, coastal four-province clip, simplified for Locate "
            f"(~{int(SIMPLIFY_DEG * 111_320)} m display). Living stock — not a condition score."
        ),
        "note": (
            "Global Mangrove Watch annual extent 2025 (CC BY 4.0). Clipped to L20 coastal "
            "provinces; MMU 0.5 ha. Fills the Locate extent / stock facet. Not GMW change, "
            "not canopy condition."
        ),
    }

    # Put extent first so Locate defaults to stock, then change samples.
    other = [L for L in index.get("layers", []) if L.get("id") != "mangrove-extent"]
    index["layers"] = [extent_layer] + other
    index["version"] = "change-stubs-v1.2"
    index["built_for"] = "#change Locate screen — current state (extent / condition / change)"
    index["licence"] = (
        "CC BY 4.0 upstream (GMW v4.1.12 2025 extent; Goldberg ORNL DAAC 1768 mangrove loss "
        "drivers; Dynamic World built modal). Non-commercial / research P2."
    )
    index["public_ready"] = True
    index["not_in_open_cleared_pin"] = True
    index["resolution_plain"] = (
        "Extent is GMW 2025 stock (~30 m native, ~100 m after simplify). Loss and built samples "
        "remain generalised (~100–300 m). All Locate overlays fade past about zoom 11.5 so blocky "
        "edges do not look like broken fine data beside Satellite."
    )
    index["state_gaps"] = [
        {
            "facet": "extent",
            "status": "sample",
            "plain": (
                "GMW 2025 mangrove extent ships as a coastal stock layer on Locate (open CC BY). "
                "Annual time slider / multi-year extent change remains a data need."
            ),
        },
        {
            "facet": "condition",
            "status": "missing",
            "plain": (
                "No mangrove condition, health, canopy, or degradation score ships on this console. "
                "Note 3b: degradation not mapped (no canopy layer cleared for public)."
            ),
        },
        {
            "facet": "change",
            "status": "sample",
            "plain": (
                "Open coastal samples only: 2000–2016 loss drivers and a built-up proxy. "
                "Not an annual change time slider or multi-epoch urban expansion series."
            ),
        },
    ]
    # Refresh data needs — elev/converted paints live on Read (v0.3.0); extent stock now on Locate.
    index["data_needs"] = [
        "Mangrove condition / degradation / canopy product — Locate condition facet (licence-clear)",
        "GMW annual extent change vectorised for a public time slider",
        "GHS-BUILT multi-epoch urban expansion polygons",
        "Converted / pond CAUTION classes 6–7 stay FLAG/HOLD until licence clears",
    ]

    with index_path.open("w") as f:
        json.dump(index, f, indent=2)
        f.write("\n")
    print(f"updated {index_path}")


if __name__ == "__main__":
    main()
