#!/usr/bin/env python3
"""Process Jiang + Clark pond layers onto the Note 3b 10 m screen grid.

Spec: outputs/03b-restoration-potential-screen-method.md
  - Land extent: Koh Kong, Preah Sihanouk, Kampot, Kep (L20)
  - Grid: 10 m, nearest-neighbour
  - MMU: 0.5 ha (50 pixels at 10 m)
  - Step 2 pond footprints: replace unusable CAP L5 with Jiang polygons;
    Clark class 3 as cross-check / alternate mask

CRS: EPSG:32648 (WGS 84 / UTM zone 48N). AOI is a 5 km buffer of Jiang∪Clark
pond footprints, clipped to L20 (coastal focus; not the full inland provinces).

Outputs: inputs/screen-layers/L_ponds_10m/
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio import features
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from rasterio.warp import reproject
from shapely import union_all
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
OUT = LAYERS / "L_ponds_10m"
L20 = LAYERS / "L20" / "coastal-four-provinces.geojson"
JIANG = {
    1990: LAYERS / "L_Jiang_ponds" / "A_Cambodia" / "90" / "cambodia90.shp",
    2000: LAYERS / "L_Jiang_ponds" / "A_Cambodia" / "00" / "cambodia_00.shp",
    2010: LAYERS / "L_Jiang_ponds" / "A_Cambodia" / "10" / "cambodia_10.shp",
    2020: LAYERS / "L_Jiang_ponds" / "A_Cambodia" / "20" / "cambodia_20.shp",
}
CLARK_LC = {
    1999: LAYERS / "L_Clark_aquaculture" / "Cambodia_Landcover_1999_v5exp.tif",
    2014: LAYERS / "L_Clark_aquaculture" / "Cambodia_Landcover_2014_v6exp.tif",
    2018: LAYERS / "L_Clark_aquaculture" / "Cambodia_Landcover_2018_v4exp.tif",
    2020: LAYERS / "L_Clark_aquaculture" / "Cambodia_Landcover_2020_v2exp.tif",
    2022: LAYERS / "L_Clark_aquaculture" / "Cambodia_Landcover_2022_v1exp.tif",
}
CLARK_CHANGE = {
    "1999_2022": LAYERS
    / "L_Clark_aquaculture"
    / "cambodia_change_persistence_1999_2022exp.tif",
    "2020_2022": LAYERS
    / "L_Clark_aquaculture"
    / "cambodia_change_persistence_2020_2022exp.tif",
}

CRS = "EPSG:32648"
RES = 10.0
BUFFER_M = 5000.0
MMU_HA = 0.5
MMU_PX = int(round(MMU_HA * 10_000 / (RES * RES)))  # 50
NODATA = 255


def write_tif(path: Path, array: np.ndarray, transform, nodata=NODATA, dtype="uint8"):
    path.parent.mkdir(parents=True, exist_ok=True)
    profile = {
        "driver": "GTiff",
        "height": array.shape[0],
        "width": array.shape[1],
        "count": 1,
        "dtype": dtype,
        "crs": CRS,
        "transform": transform,
        "nodata": nodata,
        "compress": "lzw",
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256,
    }
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(array, 1)


def sieve_binary(mask: np.ndarray, min_pixels: int) -> np.ndarray:
    """Drop connected components smaller than min_pixels (8-connectivity)."""
    if min_pixels <= 1:
        return mask
    # rasterio.features.sieve needs a 2D array with 0 background
    sieved = features.sieve(mask.astype("uint8"), size=min_pixels, connectivity=8)
    return (sieved > 0).astype("uint8")


def build_aoi(provinces: gpd.GeoDataFrame):
    parts = []
    for year, path in JIANG.items():
        g = gpd.read_file(path).to_crs(CRS)
        g = gpd.overlay(g, provinces[["geometry"]], how="intersection")
        if len(g):
            parts.extend(list(g.geometry))
            print(f"  Jiang {year}: {len(g)} polys, {g.geometry.area.sum()/1e4:.1f} ha in L20")

    with rasterio.open(CLARK_LC[2022]) as ds:
        arr = ds.read(1)
        pond = (arr == 3).astype("uint8")
        shapes_list = [
            shape(geom)
            for geom, val in features.shapes(
                pond, mask=pond.astype(bool), transform=ds.transform
            )
            if val == 1
        ]
        clark = gpd.GeoDataFrame(geometry=shapes_list, crs=ds.crs).to_crs(CRS)
        clark = gpd.overlay(clark, provinces[["geometry"]], how="intersection")
        print(
            f"  Clark 2022 class 3: {len(clark)} polys, "
            f"{clark.geometry.area.sum()/1e4:.1f} ha in L20"
        )
        parts.extend(list(clark.geometry))

    pond_union = union_all(parts)
    aoi = pond_union.buffer(BUFFER_M).intersection(provinces.union_all())
    return aoi


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Loading L20 coastal provinces…")
    provinces = gpd.read_file(L20).to_crs(CRS)
    print("Building AOI (5 km pond buffer ∩ L20)…")
    aoi = build_aoi(provinces)

    minx, miny, maxx, maxy = aoi.bounds
    # snap to 10 m
    minx = np.floor(minx / RES) * RES
    maxy = np.ceil(maxy / RES) * RES
    width = int(np.ceil((maxx - minx) / RES))
    height = int(np.ceil((maxy - miny) / RES))
    transform = from_origin(minx, maxy, RES, RES)
    print(f"Grid {width} x {height} @ {RES} m ({width * height / 1e6:.1f} Mpx)")

    # province + aoi mask
    prov_mask = features.rasterize(
        ((geom, 1) for geom in provinces.geometry),
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype="uint8",
        all_touched=False,
    )
    aoi_mask = features.rasterize(
        [(aoi, 1)],
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype="uint8",
        all_touched=False,
    )
    valid = (prov_mask == 1) & (aoi_mask == 1)
    domain = np.where(valid, 0, NODATA).astype("uint8")
    write_tif(OUT / "aoi_mask.tif", np.where(valid, 1, NODATA).astype("uint8"), transform)
    write_tif(OUT / "province_mask.tif", np.where(prov_mask == 1, 1, NODATA).astype("uint8"), transform)

    meta = {
        "crs": CRS,
        "resolution_m": RES,
        "width": width,
        "height": height,
        "transform": list(transform)[:6],
        "bounds_utm48n": [minx, miny, maxx, maxy],
        "mmu_ha": MMU_HA,
        "mmu_pixels": MMU_PX,
        "buffer_m": BUFFER_M,
        "note": "Note 3b Step 2 pond footprint processing; CAP L5 not used for footprints",
        "y1": 2024,
        "y2": 2025,
    }
    (OUT / "grid.json").write_text(json.dumps(meta, indent=2) + "\n")

    stats = []

    def record(name, arr, year=None, source=None):
        px = int((arr == 1).sum())
        ha = px * RES * RES / 10_000
        stats.append(
            {
                "layer": name,
                "year": year or "",
                "source": source or "",
                "pond_pixels": px,
                "pond_ha": round(ha, 2),
            }
        )
        print(f"  {name}: {ha:.1f} ha")

    # --- Jiang binary ponds ---
    print("Rasterizing Jiang…")
    jiang_bins = {}
    for year, path in JIANG.items():
        g = gpd.read_file(path).to_crs(CRS)
        g = gpd.overlay(g, provinces[["geometry"]], how="intersection")
        burned = features.rasterize(
            ((geom, 1) for geom in g.geometry),
            out_shape=(height, width),
            transform=transform,
            fill=0,
            dtype="uint8",
            all_touched=True,
        )
        burned = np.where(valid, burned, 0).astype("uint8")
        burned = sieve_binary(burned, MMU_PX)
        out = np.where(valid, burned, NODATA).astype("uint8")
        name = f"jiang_pond_{year}"
        write_tif(OUT / f"{name}.tif", out, transform)
        record(name, burned, year=year, source="Jiang zenodo.8344132")
        jiang_bins[year] = burned

    # --- Clark landcover + pond ---
    print("Reprojecting Clark (nearest neighbour)…")
    clark_bins = {}
    for year, path in CLARK_LC.items():
        with rasterio.open(path) as src:
            dest = np.zeros((height, width), dtype="uint8")
            reproject(
                source=rasterio.band(src, 1),
                destination=dest,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=transform,
                dst_crs=CRS,
                resampling=Resampling.nearest,
                src_nodata=0,
                dst_nodata=0,
            )
        dest = np.where(valid, dest, 0).astype("uint8")
        lc_out = np.where(valid, dest, NODATA).astype("uint8")
        write_tif(OUT / f"clark_landcover_{year}.tif", lc_out, transform)
        pond = (dest == 3).astype("uint8")
        pond = sieve_binary(pond, MMU_PX)
        pond_out = np.where(valid, pond, NODATA).astype("uint8")
        write_tif(OUT / f"clark_pond_{year}.tif", pond_out, transform)
        record(f"clark_pond_{year}", pond, year=year, source="Clark Labs")
        # also landcover class areas
        for cls, label in [
            (1, "mangrove"),
            (2, "coastal_wetland"),
            (3, "pond"),
            (4, "water"),
            (5, "other"),
        ]:
            px = int((dest == cls).sum())
            stats.append(
                {
                    "layer": f"clark_landcover_{year}_{label}",
                    "year": year,
                    "source": "Clark Labs",
                    "pond_pixels": px,
                    "pond_ha": round(px * RES * RES / 10_000, 2),
                }
            )
        clark_bins[year] = pond

    # --- Clark change ---
    print("Reprojecting Clark change layers…")
    for key, path in CLARK_CHANGE.items():
        with rasterio.open(path) as src:
            dest = np.zeros((height, width), dtype="uint8")
            reproject(
                source=rasterio.band(src, 1),
                destination=dest,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=transform,
                dst_crs=CRS,
                resampling=Resampling.nearest,
                src_nodata=0,
                dst_nodata=0,
            )
        out = np.where(valid, dest, NODATA).astype("uint8")
        write_tif(OUT / f"clark_change_{key}.tif", out, transform)
        # key classes for mangrove↔pond
        for cls, label in [
            (2, "mangrove_to_pond"),
            (5, "pond_persistence"),
            (6, "pond_to_mangrove"),
            (9, "other_to_pond"),
        ]:
            px = int((dest == cls).sum())
            stats.append(
                {
                    "layer": f"clark_change_{key}_{label}",
                    "year": key,
                    "source": "Clark Labs",
                    "pond_pixels": px,
                    "pond_ha": round(px * RES * RES / 10_000, 2),
                }
            )

    # --- Step 2 candidate masks (Note 3b: pond footprints for wet/dry state later) ---
    print("Building Step 2 union / agree…")
    j20 = jiang_bins[2020]
    c22 = clark_bins[2022]
    union = ((j20 == 1) | (c22 == 1)).astype("uint8")
    union = sieve_binary(union, MMU_PX)
    agree = ((j20 == 1) & (c22 == 1)).astype("uint8")
    agree = sieve_binary(agree, MMU_PX)
    j_only = ((j20 == 1) & (c22 == 0)).astype("uint8")
    c_only = ((c22 == 1) & (j20 == 0)).astype("uint8")

    write_tif(OUT / "step2_pond_jiang2020.tif", np.where(valid, j20, NODATA).astype("uint8"), transform)
    write_tif(OUT / "step2_pond_clark2022.tif", np.where(valid, c22, NODATA).astype("uint8"), transform)
    write_tif(OUT / "step2_pond_union.tif", np.where(valid, union, NODATA).astype("uint8"), transform)
    write_tif(OUT / "step2_pond_agree.tif", np.where(valid, agree, NODATA).astype("uint8"), transform)
    write_tif(OUT / "step2_pond_jiang_only.tif", np.where(valid, j_only, NODATA).astype("uint8"), transform)
    write_tif(OUT / "step2_pond_clark_only.tif", np.where(valid, c_only, NODATA).astype("uint8"), transform)

    record("step2_pond_jiang2020", j20, year=2020, source="Jiang")
    record("step2_pond_clark2022", c22, year=2022, source="Clark")
    record("step2_pond_union", union, source="Jiang2020|Clark2022")
    record("step2_pond_agree", agree, source="Jiang2020&Clark2022")
    record("step2_pond_jiang_only", j_only, source="Jiang only")
    record("step2_pond_clark_only", c_only, source="Clark only")

    # provincial breakdown for Step 2 union
    print("Provincial areas for Step 2 union…")
    for _, row in provinces.iterrows():
        name = row.get("shapeName", "unknown")
        pm = features.rasterize(
            [(row.geometry, 1)],
            out_shape=(height, width),
            transform=transform,
            fill=0,
            dtype="uint8",
        )
        for layer_name, arr in [
            ("jiang2020", j20),
            ("clark2022", c22),
            ("union", union),
            ("agree", agree),
        ]:
            px = int(((arr == 1) & (pm == 1) & valid).sum())
            stats.append(
                {
                    "layer": f"province_{name}_{layer_name}",
                    "year": "",
                    "source": "by province",
                    "pond_pixels": px,
                    "pond_ha": round(px * RES * RES / 10_000, 2),
                }
            )

    csv_path = OUT / "qa_areas.csv"
    with csv_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["layer", "year", "source", "pond_pixels", "pond_ha"])
        w.writeheader()
        w.writerows(stats)

    # markdown QA
    md = []
    md.append("# Pond layer processing QA — Note 3b Step 2\n")
    md.append(f"**Date.** Processed from script `{Path(__file__).name}`.\n")
    md.append("**Grid.** EPSG:32648, 10 m, nearest neighbour; MMU 0.5 ha (50 px); AOI = 5 km buffer of Jiang∪Clark ponds ∩ L20.\n")
    md.append("**Role.** Jiang 2020 replaces CAP L5 for pond *footprints*. Clark class 3 is the cross-check. Wet/dry/salt still need L6 (Sentinel) per Note 3b.\n")
    md.append("\n## Areas (ha)\n\n")
    md.append("| Layer | Year | ha |\n| --- | --- | ---: |\n")
    for s in stats:
        if s["layer"].startswith("province_"):
            continue
        if "landcover" in s["layer"] and not s["layer"].endswith("_pond"):
            continue
        md.append(f"| {s['layer']} | {s['year']} | {s['pond_ha']} |\n")
    md.append("\n## By province (Step 2)\n\n")
    md.append("| Province | Jiang 2020 | Clark 2022 | Union | Agree |\n| --- | ---: | ---: | ---: | ---: |\n")
    prov_names = list(provinces["shapeName"])
    for name in prov_names:
        vals = {}
        for key in ("jiang2020", "clark2022", "union", "agree"):
            hit = next(s for s in stats if s["layer"] == f"province_{name}_{key}")
            vals[key] = hit["pond_ha"]
        md.append(
            f"| {name} | {vals['jiang2020']} | {vals['clark2022']} | {vals['union']} | {vals['agree']} |\n"
        )
    md.append(
        "\n## Licence\n\n"
        "- Jiang: Zenodo open, licence field null — HOLD redistribution.\n"
        "- Clark: README CC BY 4.0; download page non-commercial rider — FLAG.\n"
        "- Do not include these rasters in a public package until cleared.\n"
    )
    (OUT / "qa_summary.md").write_text("".join(md))

    provenance = f"""L_ponds_10m — Note 3b Step 2 pond footprints on screen grid
Built by: intermediate/screen-build/process_pond_layers_note3b.py
Date: see filesystem mtime

Inputs
  L20 coastal-four-provinces.geojson
  L_Jiang_ponds Cambodia shapefiles 1990/2000/2010/2020
  L_Clark_aquaculture landcover 1999/2014/2018/2020/2022 + change layers

Methods (from Note 3b)
  CRS EPSG:32648; 10 m; nearest-neighbour for Clark reproject
  Clip to L20; AOI = 5 km buffer of Jiang∪Clark pond footprints ∩ L20
  Binary pond masks sieved to MMU 0.5 ha ({MMU_PX} pixels)
  Step 2 candidates: jiang2020, clark2022, union, agree
  CAP L5 not used (1° grids only)

Values
  Binary pond rasters: 1 = pond, 0 = non-pond inside AOI, 255 = outside AOI/nodata
  clark_landcover_*: 1 mangrove, 2 coastal wetland, 3 pond, 4 water, 5 other (Clark legend)
  clark_change_*: Clark change codes 1–15 (see L_Clark_aquaculture/README.txt)

Not done here (still Note 3b Step 2)
  L6 Sentinel water-frequency; wet / dry / intermittent for Y1=2024 Y2=2025
  Salt-field separation
"""
    (OUT / "PROVENANCE.txt").write_text(provenance)
    print(f"Done. Outputs in {OUT}")
    print(f"QA: {csv_path}")


if __name__ == "__main__":
    main()
