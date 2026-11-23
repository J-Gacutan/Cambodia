#!/usr/bin/env python3
"""Note 3b Step 1: historic (H) and current (C) mangrove on the 10 m screen grid.

Spec (outputs/03b-restoration-potential-screen-method.md):
  H = mangrove in L2 1996, OR mangrove in L1 for three or more consecutive
      years from 1996 (proposal). L1 1996 alone / only before 1996 -> class 9
      leftovers (reported separately as h_l1_only_1996).
  C = mangrove in the latest L1 year (2025).
  Sensitivity: also report H from L2 1996 alone and from L1 1996 alone.

L1 stack: GMW v4.1.12, 41 bands 1985 (band 1) … 2025 (band 41).
L2: GMW v3.0 1996 coastal tiles.

Grid: EPSG:32648, 10 m, L20 coastal four provinces ∩ L1 coastal-tile mosaic
bbox (snapped). MMU 0.5 ha applied to H and C binary masks.

Outputs: inputs/screen-layers/L_mangrove_10m/
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio import features
from rasterio.transform import from_origin
from rasterio.warp import reproject, transform_bounds
from rasterio.enums import Resampling
from shapely import union_all
from shapely.geometry import box, mapping

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
OUT = LAYERS / "L_mangrove_10m"
L20 = LAYERS / "L20" / "coastal-four-provinces.geojson"
L1_DIR = LAYERS / "L1" / "gmw_mng_ext_v4112_stack"
L2_DIR = LAYERS / "L2" / "gmw_v3_1996_coastal"

CRS = "EPSG:32648"
RES = 10.0
MMU_HA = 0.5
MMU_PX = int(round(MMU_HA * 10_000 / (RES * RES)))  # 50
NODATA = 255
YEAR0 = 1985  # L1 band 1
LATEST = 2025
BASELINE = 1996


def year_to_band(year: int) -> int:
    return year - YEAR0 + 1


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
    if min_pixels <= 1:
        return mask.astype("uint8")
    sieved = features.sieve(mask.astype("uint8"), size=min_pixels, connectivity=8)
    return (sieved > 0).astype("uint8")


def ha(mask: np.ndarray) -> float:
    return float(mask.astype(np.uint64).sum()) * (RES * RES) / 10_000.0


def build_grid():
    provinces = gpd.read_file(L20).to_crs(CRS)
    tiles = sorted(L1_DIR.glob("GMW_*_mng_ext.tif"))
    if not tiles:
        raise FileNotFoundError(f"No L1 tiles in {L1_DIR}")
    mosaic_bounds = None
    for t in tiles:
        with rasterio.open(t) as ds:
            bb = transform_bounds(ds.crs, CRS, *ds.bounds)
            if mosaic_bounds is None:
                mosaic_bounds = list(bb)
            else:
                mosaic_bounds[0] = min(mosaic_bounds[0], bb[0])
                mosaic_bounds[1] = min(mosaic_bounds[1], bb[1])
                mosaic_bounds[2] = max(mosaic_bounds[2], bb[2])
                mosaic_bounds[3] = max(mosaic_bounds[3], bb[3])
    aoi = union_all(provinces.geometry).intersection(box(*mosaic_bounds))
    minx, miny, maxx, maxy = aoi.bounds
    # snap to 10 m
    minx = np.floor(minx / RES) * RES
    maxy = np.ceil(maxy / RES) * RES
    maxx = np.ceil(maxx / RES) * RES
    miny = np.floor(miny / RES) * RES
    width = int(round((maxx - minx) / RES))
    height = int(round((maxy - miny) / RES))
    transform = from_origin(minx, maxy, RES, RES)
    aoi_mask = features.rasterize(
        [(mapping(aoi), 1)],
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype="uint8",
    )
    return transform, width, height, aoi_mask, (minx, miny, maxx, maxy), tiles


def warp_band_to_grid(src_path: Path, band: int, transform, shape, dst: np.ndarray):
    with rasterio.open(src_path) as src:
        src_arr = src.read(band)
        reproject(
            source=src_arr,
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=transform,
            dst_crs=CRS,
            src_nodata=0,
            dst_nodata=0,
            resampling=Resampling.nearest,
        )


def mosaic_l1_year(tiles, year: int, transform, shape) -> np.ndarray:
    """Nearest-neighbour warp+OR of L1 tiles for one year onto the screen grid."""
    h, w = shape
    out = np.zeros((h, w), dtype="uint8")
    band = year_to_band(year)
    for t in tiles:
        tmp = np.zeros((h, w), dtype="uint8")
        warp_band_to_grid(t, band, transform, shape, tmp)
        out = np.maximum(out, (tmp == 1).astype("uint8"))
    return out


def mosaic_l2_1996(transform, shape) -> np.ndarray:
    h, w = shape
    out = np.zeros((h, w), dtype="uint8")
    tiles = sorted(L2_DIR.glob("GMW_*_1996_v3.tif"))
    if not tiles:
        raise FileNotFoundError(f"No L2 coastal tiles in {L2_DIR}")
    for t in tiles:
        tmp = np.zeros((h, w), dtype="uint8")
        warp_band_to_grid(t, 1, transform, shape, tmp)
        out = np.maximum(out, (tmp == 1).astype("uint8"))
    return out


def persistent_from_1996(tiles, transform, shape, aoi_mask) -> np.ndarray:
    """L1 mangrove in ≥3 consecutive years starting at/after 1996."""
    h, w = shape
    # Rolling window of three years: 1996-98, 1997-99, …, 2023-25
    years = list(range(BASELINE, LATEST + 1))
    # Stream year masks one at a time; keep last two
    prev2 = None
    prev1 = None
    persistent = np.zeros((h, w), dtype="uint8")
    for y in years:
        print(f"  L1 year {y}…", flush=True)
        cur = mosaic_l1_year(tiles, y, transform, shape) & aoi_mask
        if prev2 is not None and prev1 is not None:
            triple = prev2 & prev1 & cur
            persistent = np.maximum(persistent, triple)
        prev2, prev1 = prev1, cur
    return persistent


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Building screen grid…", flush=True)
    transform, width, height, aoi_mask, bounds, tiles = build_grid()
    shape = (height, width)
    print(f"  grid {width}×{height} ({width * height / 1e6:.1f} Mpx) bounds {bounds}", flush=True)
    write_tif(OUT / "aoi_mask.tif", aoi_mask, transform, nodata=0)

    print("L2 1996…", flush=True)
    h_l2 = mosaic_l2_1996(transform, shape) & aoi_mask
    print(f"  L2 1996 {ha(h_l2):.1f} ha", flush=True)

    print("L1 1996…", flush=True)
    h_l1_1996 = mosaic_l1_year(tiles, BASELINE, transform, shape) & aoi_mask
    print(f"  L1 1996 {ha(h_l1_1996):.1f} ha", flush=True)

    print("L1 ≥3 consecutive years from 1996…", flush=True)
    h_persist = persistent_from_1996(tiles, transform, shape, aoi_mask)
    print(f"  L1 persist {ha(h_persist):.1f} ha", flush=True)

    # Spec H
    h = np.maximum(h_l2, h_persist).astype("uint8")
    # Leftovers: L1 1996 alone (and not in H via L2 or persist) — class 9 candidates
    h_l1_only = (h_l1_1996 == 1) & (h == 0)
    h_l1_only = h_l1_only.astype("uint8")

    print(f"C = L1 {LATEST}…", flush=True)
    c = mosaic_l1_year(tiles, LATEST, transform, shape) & aoi_mask
    print(f"  C {ha(c):.1f} ha", flush=True)

    print("MMU sieve…", flush=True)
    h = sieve_binary(h, MMU_PX)
    c = sieve_binary(c, MMU_PX)
    h_l2_s = sieve_binary(h_l2, MMU_PX)
    h_l1_1996_s = sieve_binary(h_l1_1996, MMU_PX)
    h_persist_s = sieve_binary(h_persist, MMU_PX)
    h_l1_only = sieve_binary(h_l1_only, MMU_PX)

    write_tif(OUT / "h_historic.tif", h, transform)
    write_tif(OUT / "c_current.tif", c, transform)
    write_tif(OUT / "h_l2_1996.tif", h_l2_s, transform)
    write_tif(OUT / "h_l1_1996.tif", h_l1_1996_s, transform)
    write_tif(OUT / "h_l1_persist3.tif", h_persist_s, transform)
    write_tif(OUT / "h_l1_only_1996_class9.tif", h_l1_only, transform)

    rows = [
        ("h_historic_spec", ha(h)),
        ("h_l2_1996", ha(h_l2_s)),
        ("h_l1_1996", ha(h_l1_1996_s)),
        ("h_l1_persist3", ha(h_persist_s)),
        ("h_l1_only_1996_class9", ha(h_l1_only)),
        ("c_current_2025", ha(c)),
        ("h_and_c", ha(h & c)),
        ("h_not_c_loss", ha((h == 1) & (c == 0))),
        ("c_not_h_gain", ha((c == 1) & (h == 0))),
        ("aoi", ha(aoi_mask)),
    ]
    with open(OUT / "step1_mangrove_hc_qa.csv", "w", newline="") as f:
        wri = csv.DictWriter(f, fieldnames=["layer", "ha"])
        wri.writeheader()
        for name, val in rows:
            wri.writerow({"layer": name, "ha": round(val, 2)})
            print({"layer": name, "ha": round(val, 2)}, flush=True)

    md = [
        "# Step 1 mangrove H/C QA (Note 3b)",
        "",
        f"**Grid.** EPSG:32648, 10 m, {width}×{height}. L20 coastal four ∩ L1 mosaic bbox.",
        f"**MMU.** {MMU_HA} ha ({MMU_PX} px).",
        f"**H.** L2 1996 OR L1 ≥3 consecutive years from {BASELINE}.",
        f"**C.** L1 {LATEST}.",
        "",
        "| Layer | ha |",
        "| --- | ---: |",
    ]
    for name, val in rows:
        md.append(f"| {name} | {val:.2f} |")
    (OUT / "step1_mangrove_hc_qa.md").write_text("\n".join(md) + "\n")

    grid = {
        "crs": CRS,
        "resolution_m": RES,
        "width": width,
        "height": height,
        "transform": [RES, 0.0, bounds[0], 0.0, -RES, bounds[3]],
        "bounds_utm48n": list(bounds),
        "mmu_ha": MMU_HA,
        "mmu_pixels": MMU_PX,
        "y1": 2024,
        "y2": 2025,
        "c_year": LATEST,
        "baseline_year": BASELINE,
        "note": "Note 3b Step 1 H/C; AOI = L20 coastal four ∩ L1 v4.1.12 coastal tiles",
    }
    (OUT / "grid.json").write_text(json.dumps(grid, indent=2) + "\n")
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
