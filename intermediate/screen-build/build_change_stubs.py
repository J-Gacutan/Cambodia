#!/usr/bin/env python3
"""Build open P2 change-stub GeoJSONs for public/change-stubs/ (outside open-cleared pin).

Upstream: Goldberg L4 (CC BY 4.0) + Dynamic World L10 modal built (CC BY 4.0).
Does not copy FLAG / INTERNAL rasters into a public remote path.
"""
from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.mask import mask
from rasterio.warp import transform_geom
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "change-stubs"

# ORNL DAAC 1768 loss_driver_class (CMS user guide)
DRIVER_LABEL = {
    0: "erosion",
    1: "extreme_weather",
    2: "commodities",
    3: "settlement",
    4: "non_productive",
    5: "other_or_unmapped",
}


def approx_ha(g84) -> float:
    cy = g84.centroid.y
    return float(g84.area * (111_320**2) * np.cos(np.radians(cy)) / 10_000)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    l20 = gpd.read_file(ROOT / "inputs/screen-layers/L20/coastal-four-provinces.geojson")
    coast_g = gpd.GeoSeries([unary_union(l20.geometry)], crs="EPSG:4326")

    with rasterio.open(ROOT / "inputs/screen-layers/L4/land_cover_change_class_KHM.tif") as chg, rasterio.open(
        ROOT / "inputs/screen-layers/L4/loss_driver_class_KHM.tif"
    ) as drv:
        coast_ds = coast_g.to_crs(chg.crs).iloc[0]
        chg_img, transform = mask(chg, [mapping(coast_ds)], crop=True, filled=True, nodata=255)
        drv_img, _ = mask(drv, [mapping(coast_ds)], crop=True, filled=True, nodata=255)
        change, driver = chg_img[0], drv_img[0]
        loss_mask = (change != 255) & (driver != 255)
        coded = np.where(loss_mask, driver, 255).astype(np.uint8)
        coded = np.where(np.isin(coded, list(DRIVER_LABEL)), coded, 255).astype(np.uint8)
        results = []
        for geom, val in shapes(coded, mask=coded != 255, transform=transform):
            g = shape(geom)
            if not g.is_valid:
                g = g.buffer(0)
            g84 = shape(transform_geom(chg.crs, "EPSG:4326", mapping(g), precision=6))
            area_ha = approx_ha(g84)
            if area_ha < 2.0:
                continue
            g84 = g84.simplify(0.001, preserve_topology=True)
            if g84.is_empty:
                continue
            results.append((g84, int(val), area_ha))
        results.sort(key=lambda r: -r[2])
        results = results[:300]
        mang_features = [
            {
                "type": "Feature",
                "properties": {
                    "id": f"l4-loss-{i + 1:04d}",
                    "class_value": val,
                    "class_label": DRIVER_LABEL[val],
                    "area_ha_approx": round(area_ha, 2),
                    "register_id": "L4",
                    "stub": False,
                    "open_cleared": True,
                    "note": "Goldberg mangrove loss driver (2000–2016), coastal sample.",
                },
                "geometry": mapping(g84),
            }
            for i, (g84, val, area_ha) in enumerate(results)
        ]

    with rasterio.open(ROOT / "inputs/screen-layers/L8_L11_10m/l10_modal.tif") as ds:
        coast_ds = coast_g.to_crs(ds.crs).iloc[0]
        out_img, transform = mask(ds, [mapping(coast_ds)], crop=True, filled=True, nodata=255)
        data = np.where(out_img[0] == 6, 6, 0).astype(np.uint8)
        results = []
        for geom, val in shapes(data, mask=data != 0, transform=transform):
            g = shape(geom)
            if not g.is_valid:
                g = g.buffer(0)
            g84 = shape(transform_geom(ds.crs, "EPSG:4326", mapping(g), precision=6))
            area_ha = approx_ha(g84)
            if area_ha < 3.0:
                continue
            g84 = g84.simplify(0.0012, preserve_topology=True)
            if g84.is_empty:
                continue
            results.append((g84, int(val), area_ha))
        results.sort(key=lambda r: -r[2])
        results = results[:180]
        urb_features = [
            {
                "type": "Feature",
                "properties": {
                    "id": f"l10-built-{i + 1:04d}",
                    "class_value": val,
                    "class_label": "built_dynamic_world",
                    "area_ha_approx": round(area_ha, 2),
                    "register_id": "L10",
                    "stub": False,
                    "open_cleared": True,
                    "note": "Dynamic World modal built (class 6) coastal sample — urban proxy, not multi-year change.",
                },
                "geometry": mapping(g84),
            }
            for i, (g84, val, area_ha) in enumerate(results)
        ]

    mang = {"type": "FeatureCollection", "features": mang_features}
    urb = {"type": "FeatureCollection", "features": urb_features}
    meta = {
        "version": "change-stubs-v1",
        "built_for": "#change screen",
        "licence": "CC BY 4.0 upstream (Goldberg L4 ORNL DAAC 1768; Dynamic World L10). Non-commercial / research P2.",
        "public_ready": True,
        "not_in_open_cleared_pin": True,
        "layers": [
            {
                "id": "mangrove-change",
                "file": "mangrove-change.geojson",
                "title": "Mangrove loss drivers (Goldberg L4)",
                "register_id": "L4",
                "feature_count": len(mang_features),
                "stub": False,
                "driver_codes": {str(k): v for k, v in DRIVER_LABEL.items()},
                "note": "Open coastal sample of ORNL DAAC mangrove loss drivers (2000–2016). Not GMW annual change (L1) — data need for time slider.",
            },
            {
                "id": "urban-change",
                "file": "urban-change.geojson",
                "title": "Urban / built proxy (Dynamic World modal)",
                "register_id": "L10",
                "feature_count": len(urb_features),
                "stub": False,
                "note": "Open coastal sample of Dynamic World modal built (class 6). GHS-BUILT L8 multi-epoch remains a data need.",
            },
        ],
        "data_needs": [
            "GMW v4.1.12 annual extent change (L1) vectorised for public",
            "GHS-BUILT-S (L8) multi-epoch urban expansion polygons",
            "Elevation-fail polygons (L12 vs L13) for elevation CAUTION driver",
            "Converted / pond CAUTION classes 5–7 stay FLAG/HOLD until licence clears",
        ],
    }
    (OUT / "mangrove-change.geojson").write_text(json.dumps(mang, separators=(",", ":")))
    (OUT / "urban-change.geojson").write_text(json.dumps(urb, separators=(",", ":")))
    (OUT / "index.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"Wrote {len(mang_features)} mangrove + {len(urb_features)} urban features → {OUT}")


if __name__ == "__main__":
    main()
