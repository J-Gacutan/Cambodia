#!/usr/bin/env python3
"""Note 3b Step 3, classes that need L8-L11, merged onto the first pass.

Reads class_firstpass (classes 3, 5, 6, 7). Fills the rest in Note 3b order.
Classes 1 and 2 are the only rules allowed to replace 3, 5, 6 or 7.
Class 4 does not replace them: overlap is counted and left as the first pass.
The L10 limb of class 5 (crops, or trees outside C) is applied only where the
first pass is still 0. The first pass had assigned class 5 for salt fields only.

L10 labels: 0 water, 1 trees, 2 grass, 4 crops, 5 shrub, 6 built, 7 bare.
Class 1 flag bits (do not change the class):
  1  L10 built and WorldCover is not class 50
  2  L10 built and GHS-BUILT-S 2025 is under 50 percent
  4  WorldCover 50 or GHS 2025 at least 50 percent, and L10 is not built

Outputs: inputs/screen-layers/L_class_10m/
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from types import SimpleNamespace

import fiona
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.warp import reproject, transform_geom

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
FIRST = LAYERS / "L_class_10m_firstpass"
SRC = LAYERS / "L8_L11_10m"
PONDS = LAYERS / "L_ponds_10m"
MANG = LAYERS / "L_mangrove_10m"
L3_GPKG = LAYERS / "L3" / "gmw_hab_msk_v28.gpkg"
OUT = LAYERS / "L_class_10m"

NODATA = 255
RES_M = 10.0
# Dynamic World.
WATER, TREES, GRASS, FLOODED, CROPS, SHRUB, BUILT, BARE = 0, 1, 2, 3, 4, 5, 6, 7
OPEN = (BARE, GRASS, SHRUB)  # class 8 and class 9 cover
WATER_PCT = 90
BUILT_PCT = 50

CLASS_NAMES = {
    1: "stop_built_up",
    2: "stop_open_water",
    3: "existing_mangrove_conserve",
    4: "caution_tidal_flat",
    5: "caution_other_converted",
    6: "go_inactive_pond",
    7: "caution_active_pond",
    8: "go_open_or_accreted",
    9: "caution_history_unproven",
    10: "stop_outside_tidal_frame",
}


def ha(mask) -> float:
    return float(np.asarray(mask).sum()) * (RES_M * RES_M) / 10_000.0


def read_band(path: Path) -> np.ndarray:
    with rasterio.open(path) as ds:
        return ds.read(1)


def assert_same_grid(path: Path, ref):
    with rasterio.open(path) as ds:
        if ds.width != ref.width or ds.height != ref.height:
            raise SystemExit(f"{path.name} shape {ds.width}x{ds.height} != grid")
        if ds.transform != ref.transform or ds.crs != ref.crs:
            raise SystemExit(f"{path.name} is not on the class_firstpass grid")


def warp_binary(src_path: Path, ref) -> np.ndarray:
    dst = np.zeros((ref.height, ref.width), dtype="uint8")
    with rasterio.open(src_path) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=ref.transform,
            dst_crs=ref.crs,
            src_nodata=0 if src.nodata is None else src.nodata,
            dst_nodata=0,
            resampling=Resampling.nearest,
        )
    return (dst == 1).astype("uint8")


def write_u8(path: Path, array: np.ndarray, ref, description: str, nodata=NODATA):
    path.parent.mkdir(parents=True, exist_ok=True)
    profile = ref.profile.copy()
    profile.update(
        driver="GTiff",
        count=1,
        dtype="uint8",
        nodata=nodata,
        compress="lzw",
        tiled=True,
        blockxsize=256,
        blockysize=256,
    )
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(array.astype("uint8"), 1)
        dst.update_tags(DESCRIPTION=description)
    print(f"  wrote {path.name}", flush=True)


def rasterize_l3(ref) -> np.ndarray:
    """GMW habitat mask v28, pixel centres, on the screen grid."""
    to_wgs = rasterio.warp.transform_bounds(ref.crs, "EPSG:4326", *ref.bounds)
    # Small pad so polygons that cross the border are included.
    minx, miny, maxx, maxy = to_wgs
    bbox = (minx - 0.05, miny - 0.05, maxx + 0.05, maxy + 0.05)
    shapes = []
    with fiona.open(L3_GPKG) as src:
        for feat in src.filter(bbox=bbox):
            if feat["geometry"] is None:
                continue
            if int(feat["properties"].get("ClassID") or 0) != 1:
                continue
            shapes.append(
                (transform_geom(src.crs, ref.crs, feat["geometry"]), 1)
            )
    print(f"  L3 polygons in bbox: {len(shapes)}", flush=True)
    if not shapes:
        raise SystemExit("L3 bbox filter returned no polygons")
    burned = rasterize(
        shapes,
        out_shape=(ref.height, ref.width),
        transform=ref.transform,
        fill=0,
        dtype="uint8",
        all_touched=False,
    )
    return burned


def load_grid():
    with rasterio.open(FIRST / "class_firstpass.tif") as ds:
        return SimpleNamespace(
            width=ds.width,
            height=ds.height,
            transform=ds.transform,
            crs=ds.crs,
            bounds=ds.bounds,
            profile=ds.profile.copy(),
        ), ds.read(1)


def require_sources():
    needed = [
        "l8_2025_pct.tif",
        "l9_map.tif",
        "l10_modal.tif",
        "l10_water_pct.tif",
        "l10_n.tif",
        "l11_flat.tif",
    ]
    missing = [name for name in needed if not (SRC / name).exists()]
    if missing:
        raise SystemExit(
            "Missing L8-L11 grids in L8_L11_10m: "
            + ", ".join(missing)
            + ". Run export_l8_l11_gee.py --download-only after the Drive tasks finish."
        )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--l3-only", action="store_true")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    ref, cls = load_grid()
    if args.l3_only:
        print("Rasterizing L3…", flush=True)
        l3_u8 = rasterize_l3(ref)
        aoi = cls != NODATA
        write_u8(
            OUT / "l3_habitat.tif",
            np.where(aoi, l3_u8, 0).astype("uint8"),
            ref,
            "GMW habitat mask v28 on the screen grid. 1 = inside, 0 = outside. Pixel centre.",
            nodata=0,
        )
        print(f"  L3 inside AOI {ha((l3_u8 == 1) & aoi):.1f} ha", flush=True)
        return

    require_sources()

    for name in (
        "l8_2025_pct.tif",
        "l9_map.tif",
        "l10_modal.tif",
        "l10_water_pct.tif",
        "l11_flat.tif",
    ):
        assert_same_grid(SRC / name, ref)

    aoi = cls != NODATA
    prev = cls.copy()
    print(f"AOI {ha(aoi):.1f} ha", flush=True)

    print("Reading layers…", flush=True)
    modal = read_band(SRC / "l10_modal.tif")
    water = read_band(SRC / "l10_water_pct.tif")
    l8 = read_band(SRC / "l8_2025_pct.tif")
    l9 = read_band(SRC / "l9_map.tif")
    flat = read_band(SRC / "l11_flat.tif") == 1
    h = read_band(FIRST / "h_on_pond_grid.tif") == 1
    c = read_band(FIRST / "c_on_pond_grid.tif") == 1
    pond = read_band(PONDS / "step2_pond_union.tif") == 1
    assert_same_grid(PONDS / "step2_pond_union.tif", ref)
    assert_same_grid(FIRST / "h_on_pond_grid.tif", ref)

    print("Warping step 1 leftovers…", flush=True)
    leftover = warp_binary(MANG / "h_l1_only_1996_class9.tif", ref) == 1

    l3_path = OUT / "l3_habitat.tif"
    if l3_path.exists():
        print("Reading existing L3 raster…", flush=True)
        assert_same_grid(l3_path, ref)
        l3 = read_band(l3_path) == 1
    else:
        print("Rasterizing L3…", flush=True)
        l3_u8 = rasterize_l3(ref)
        # 0 outside the mask is a real value, including outside the AOI.
        write_u8(
            l3_path,
            np.where(aoi, l3_u8, 0).astype("uint8"),
            ref,
            "GMW habitat mask v28 on the screen grid. 1 = inside, 0 = outside. Pixel centre.",
            nodata=0,
        )
        l3 = l3_u8 == 1

    valid = modal != NODATA
    built = aoi & valid & (modal == BUILT)
    water90 = aoi & valid & (water >= WATER_PCT) & (water != NODATA)
    bare_or_water = aoi & valid & ((modal == WATER) | (modal == BARE))
    open_cover = aoi & valid & np.isin(modal, OPEN)
    crops = aoi & valid & (modal == CROPS)
    trees = aoi & valid & (modal == TREES)

    # 1 STOP built-up. Overrides 3/5/6/7.
    cls[built] = 1
    # 2 STOP open water. Not a flat, not a step 2 pond. Overrides remaining 3/5/6/7.
    cls[aoi & (cls != 1) & water90 & ~flat & ~pond] = 2
    # 4 CAUTION tidal flat. Unclassified cells only.
    cls[(cls == 0) & flat & bare_or_water] = 4
    # 5 L10 limb on cells the salt-only first pass left at 0. H and crops, or
    # H and trees outside C. Does not replace 6 or 7.
    cls[(cls == 0) & h & (crops | (trees & ~c))] = 5
    # 8 GO open or accreted. H and bare, grass or shrub.
    cls[(cls == 0) & h & open_cover] = 8
    # 9 CAUTION history unproven. Not H, inside L3, and pond or open cover
    # or a step 1 leftover (L1 1996 and not H).
    cls[(cls == 0) & ~h & l3 & (pond | open_cover | leftover)] = 9
    # 10 everything else inside the AOI.
    cls[aoi & (cls == 0)] = 10

    preserved = np.isin(prev, [3, 5, 6, 7])
    # Class 4 test on cells that stayed 3/5/6/7.
    flat_on_preserved = preserved & (cls == prev) & flat & bare_or_water

    print("Disagreement flag…", flush=True)
    corroborated = (l9 == 50) | (l8 >= BUILT_PCT)
    flag = np.zeros(cls.shape, dtype="uint8")
    flag[built & (l9 != 50)] += 1
    flag[built & (l8 < BUILT_PCT)] += 2
    flag[aoi & corroborated & ~built] += 4
    flag[~aoi] = 0

    write_u8(
        OUT / "class_step3.tif",
        cls,
        ref,
        "Note 3b Step 3 classes 1-10 on the pond grid. 255 = outside AOI.",
    )
    write_u8(
        OUT / "built_disagree.tif",
        flag,
        ref,
        "Bits: 1 L10 built vs WorldCover not 50; 2 L10 built vs GHS 2025 under 50%; "
        "4 WorldCover 50 or GHS>=50% but L10 not built. 0 = no flag.",
    )

    rows = []

    def add(name, mask):
        rows.append((name, ha(mask)))

    for code, name in CLASS_NAMES.items():
        add(f"class_{code}_{name}", cls == code)
    add("aoi", aoi)
    add("outside_aoi_nodata", ~aoi)
    add("l10_nodata_in_aoi", aoi & ~valid)
    add("l11_flat_in_aoi", aoi & flat)
    add("l3_in_aoi", aoi & l3)

    for code in (3, 5, 6, 7):
        add(f"override_class1_on_{code}", (prev == code) & (cls == 1))
        add(f"override_class2_on_{code}", (prev == code) & (cls == 2))
        add(f"class4_overlap_kept_{code}", flat_on_preserved & (prev == code))
        add(f"preserved_{code}", (prev == code) & (cls == code))

    add("class5_l10_limb_new", (prev == 0) & (cls == 5))
    add("class5_l10_crops", (cls == 5) & (modal == CROPS))
    add("class5_l10_trees", (cls == 5) & (modal == TREES))
    add("class1_neither_corroborator", (cls == 1) & ~corroborated)
    add("class2_and_worldcover_water", (cls == 2) & (l9 == 80))
    add("l8_2025_at_least_50", aoi & (l8 >= BUILT_PCT) & (l8 != NODATA))
    add("class1_flag_l9", (flag & 1) > 0)
    add("class1_flag_l8", (flag & 2) > 0)
    add("flag_corroborated_not_l10", (flag & 4) > 0)
    add("class1_and_either_corroborated", (cls == 1) & corroborated)
    add("h_flooded_veg_class10", (cls == 10) & h & valid & (modal == FLOODED))
    add("h_other_class10", (cls == 10) & h)
    add("flat_l10_nodata", aoi & flat & ~valid)
    add("step1_leftover", aoi & leftover)
    add("step1_leftover_class9", (cls == 9) & leftover)
    add("step1_leftover_outside_l3", aoi & leftover & ~l3)
    add("l10_n_capped", aoi & (read_band(SRC / "l10_n.tif") == 254))

    with (OUT / "class_step3_qa.csv").open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "ha"])
        for name, val in rows:
            writer.writerow([name, round(val, 2)])
            print(f"  {name}: {val:.2f}", flush=True)

    def cell(name):
        return next(val for key, val in rows if key == name)

    lines = [
        "# Step 3 class QA, L8-L11 (Note 3b)",
        "",
        "Grid: class_firstpass, EPSG:32648, 10 m. Y1 and Y2 are calendar 2024 and 2025.",
        "First matching rule wins. Classes 3, 5, 6 and 7 from the first pass are kept",
        "unless class 1 (built-up) or class 2 (open water) matches.",
        "",
        "Class 5 in the first pass is salt fields only. This pass also assigns class 5",
        "where the cell was still unclassified, H is set, and L10 is crops, or L10 is",
        "trees and C is not set. That is the rest of the Note 3b class 5 rule.",
        "",
        "Class 4 overlap with kept 3, 5, 6 or 7 is reported and not reassigned.",
        "No minimum-mapping-unit sieve on these classes. H and C were sieved in Step 1.",
        "L8 percent is GHS-BUILT-S 2025, which is a modelled epoch. The 2020 observed",
        "epoch is staged beside it and is not used in the flag.",
        "L11 is the 2014-2016 epoch. A pixel is a flat where the classification value is 1.",
        "Dynamic World ties take the lowest class code (Earth Engine mode).",
        "Step 1 leftovers are L1 1996 and not H (`h_l1_only_1996_class9`). Mangrove",
        "only before 1996 was not a separate Step 1 raster.",
        "",
        "| Class | Name | ha |",
        "| ---: | --- | ---: |",
    ]
    for code, name in CLASS_NAMES.items():
        lines.append(f"| {code} | {name} | {cell(f'class_{code}_{name}'):.2f} |")
    lines += [
        "",
        "## Overrides of the first pass",
        "",
        "| First-pass class | Kept (ha) | Replaced by class 1 (ha) | Replaced by class 2 (ha) | Also matches class 4, kept (ha) |",
        "| ---: | ---: | ---: | ---: | ---: |",
    ]
    for code in (3, 5, 6, 7):
        lines.append(
            f"| {code} | {cell(f'preserved_{code}'):.2f} | "
            f"{cell(f'override_class1_on_{code}'):.2f} | "
            f"{cell(f'override_class2_on_{code}'):.2f} | "
            f"{cell(f'class4_overlap_kept_{code}'):.2f} |"
        )
    lines += [
        "",
        "## Flags and residuals",
        "",
        "| Metric | ha |",
        "| --- | ---: |",
        f"| AOI | {cell('aoi'):.2f} |",
        f"| L10 no observation inside AOI | {cell('l10_nodata_in_aoi'):.2f} |",
        f"| L11 flat inside AOI | {cell('l11_flat_in_aoi'):.2f} |",
        f"| L3 inside AOI | {cell('l3_in_aoi'):.2f} |",
        f"| New class 5 from the L10 limb | {cell('class5_l10_limb_new'):.2f} |",
        f"| Class 5 and L10 crops | {cell('class5_l10_crops'):.2f} |",
        f"| Class 5 and L10 trees | {cell('class5_l10_trees'):.2f} |",
        f"| Class 1 with neither L9 nor L8 | {cell('class1_neither_corroborator'):.2f} |",
        f"| Class 2 and WorldCover water (80) | {cell('class2_and_worldcover_water'):.2f} |",
        f"| GHS 2025 at least 50 percent, whole AOI | {cell('l8_2025_at_least_50'):.2f} |",
        f"| Class 1 and WorldCover is not 50 | {cell('class1_flag_l9'):.2f} |",
        f"| Class 1 and GHS 2025 under 50% | {cell('class1_flag_l8'):.2f} |",
        f"| GHS or WorldCover built, L10 not built | {cell('flag_corroborated_not_l10'):.2f} |",
        f"| Class 1 with L9 or L8 corroboration | {cell('class1_and_either_corroborated'):.2f} |",
        f"| H and L10 flooded vegetation, class 10 | {cell('h_flooded_veg_class10'):.2f} |",
        f"| H ending in class 10 | {cell('h_other_class10'):.2f} |",
        f"| L11 flat with no L10 observation | {cell('flat_l10_nodata'):.2f} |",
        f"| Step 1 leftover inside AOI | {cell('step1_leftover'):.2f} |",
        f"| Step 1 leftover in class 9 | {cell('step1_leftover_class9'):.2f} |",
        f"| Step 1 leftover outside L3 | {cell('step1_leftover_outside_l3'):.2f} |",
        f"| L10 count capped at 254 | {cell('l10_n_capped'):.2f} |",
        "",
        "Built-up disagreement is a flag on `built_disagree.tif`. It does not change the class.",
        "Class 1 is the Dynamic World modal call. Most of it has neither corroborator:",
        "GHS-BUILT-S at the 50 percent proposal covers only a few hundred hectares on this",
        "grid, and WorldCover class 50 is much smaller than the Dynamic World built area.",
        "Class 2 replaces some first-pass existing mangrove where Dynamic World is water",
        "in at least 90 percent of observations and the cell is not a flat or a pond.",
        "Nearly all of the new class 5 is L10 trees outside C, not crops. Salt fields",
        "remain the first-pass part of class 5, minus any class 1 override.",
        "Class 10 is every AOI cell that matched no earlier rule, so most of the province",
        "grid sits there. It is not a claim that those cells were assessed as tidal.",
        "The pond-grid rectangle is fully inside the AOI, so the nodata area is zero.",
        "",
    ]
    (OUT / "class_step3_qa.md").write_text("\n".join(lines))

    meta = {
        "grid": "L_class_10m_firstpass / L_ponds_10m",
        "sources": "L8_L11_10m",
        "classes": list(CLASS_NAMES),
        "preserve": [3, 5, 6, 7],
        "stop_overrides": [1, 2],
        "class5_l10_limb": "unclassified and H and (crops or (trees and not C))",
        "water_percent": WATER_PCT,
        "built_percent": BUILT_PCT,
        "l8_epoch_used": 2025,
        "l11_epoch": "2014-2016",
        "y1_y2": [2024, 2025],
        "flag_bits": {"1": "L10 built, L9 not 50", "2": "L10 built, L8<50", "4": "L9 or L8 built, L10 not"},
    }
    (OUT / "PROVENANCE.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("DONE", OUT / "class_step3_qa.md", flush=True)


if __name__ == "__main__":
    main()
