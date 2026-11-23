#!/usr/bin/env python3
"""Note 3b Step 3 first pass: classes available from H/C + pond stack.

Uses L_ponds_10m grid. Warps Step 1 H/C onto it.

Class codes (Note 3b order; only rows that need no L8–L11 yet):
  3  Existing mangrove: conserve          — C
  5  CAUTION: other converted use         — H and salt field (subset)
  6  GO: inactive pond                    — H, pond, dry in Y1 and Y2
  7  CAUTION: active pond                 — H, pond, wet or intermittent in Y1 or Y2
  0  unclassified on this pass            — everything else (STOP/built/water/flat/
                                            open land / history unproven deferred)

Priority among assigned classes follows Note 3b order: 5 before 6/7; 3 before
pond rules only where C (existing mangrove wins over pond labels).

Outputs: inputs/screen-layers/L_class_10m_firstpass/
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import reproject

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
PONDS = LAYERS / "L_ponds_10m"
MANG = LAYERS / "L_mangrove_10m"
OUT = LAYERS / "L_class_10m_firstpass"

RES = 10.0
NODATA = 255
CLASS_NAMES = {
    0: "unclassified_this_pass",
    3: "existing_mangrove_conserve",
    5: "caution_salt_or_other_converted",
    6: "go_inactive_pond",
    7: "caution_active_pond",
}


def ha(mask: np.ndarray) -> float:
    return float(np.asarray(mask, dtype=np.uint64).sum()) * (RES * RES) / 10_000.0


def warp_to(src_path: Path, ref_profile, ref_transform) -> np.ndarray:
    dst = np.zeros((ref_profile["height"], ref_profile["width"]), dtype="uint8")
    with rasterio.open(src_path) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=ref_transform,
            dst_crs=ref_profile["crs"],
            src_nodata=src.nodata if src.nodata is not None else 0,
            dst_nodata=0,
            resampling=Resampling.nearest,
        )
    return (dst == 1).astype("uint8")


def write_tif(path: Path, array: np.ndarray, profile):
    path.parent.mkdir(parents=True, exist_ok=True)
    p = profile.copy()
    p.update(count=1, dtype="uint8", nodata=NODATA, compress="lzw", tiled=True,
             blockxsize=256, blockysize=256)
    with rasterio.open(path, "w", **p) as dst:
        dst.write(array, 1)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with rasterio.open(PONDS / "aoi_mask.tif") as ref:
        profile = ref.profile
        transform = ref.transform
        aoi = (ref.read(1) > 0)

    print("Warping H/C onto pond grid…", flush=True)
    h = warp_to(MANG / "h_historic.tif", profile, transform)
    c = warp_to(MANG / "c_current.tif", profile, transform)

    with rasterio.open(PONDS / "step2_pond_union.tif") as ds:
        pond = (ds.read(1) == 1)
    with rasterio.open(PONDS / "l6_pond_activity_y1y2.tif") as ds:
        # expect: 1=inactive dry both, 2=active (wet/int), or similar — read QA
        act = ds.read(1)
    with rasterio.open(PONDS / "l6_salt_field.tif") as ds:
        salt = (ds.read(1) == 1)

    # Inspect activity coding from process_l6 script conventions
    # Fallback: inactive from dry-both layer if coded differently
    inactive = None
    active = None
    uniq = np.unique(act[pond])
    print(f"  activity unique on ponds: {uniq[:20]}", flush=True)

    # Preferred: dedicated inactive/active if values 1/2
    if set(uniq.tolist()) <= {0, 1, 2, 255, NODATA}:
        inactive = pond & (act == 1)
        active = pond & (act == 2)
    else:
        # Try reading state rasters
        with rasterio.open(PONDS / "l6_pond_state_2024.tif") as ds:
            s24 = ds.read(1)
        with rasterio.open(PONDS / "l6_pond_state_2025.tif") as ds:
            s25 = ds.read(1)
        # 1=dry, 2=intermittent, 3=wet (from process_l6)
        inactive = pond & (s24 == 1) & (s25 == 1)
        active = pond & ~inactive

    print(f"  H on AOI {ha(h & aoi):.1f} ha; C {ha(c & aoi):.1f} ha", flush=True)
    print(f"  pond {ha(pond):.1f}; inactive {ha(inactive):.1f}; active {ha(active):.1f}; salt {ha(salt):.1f}", flush=True)

    cls = np.zeros(aoi.shape, dtype="uint8")

    # Order: 3, then 5, then 6, then 7 (Note 3b). Only assign where still 0.
    m3 = aoi & (c == 1)
    cls[m3] = 3

    m5 = aoi & (cls == 0) & (h == 1) & salt
    cls[m5] = 5

    m6 = aoi & (cls == 0) & (h == 1) & inactive
    cls[m6] = 6

    m7 = aoi & (cls == 0) & (h == 1) & active
    cls[m7] = 7

    write_tif(OUT / "class_firstpass.tif", np.where(aoi, cls, NODATA).astype("uint8"), profile)
    write_tif(OUT / "h_on_pond_grid.tif", np.where(aoi, h, 0).astype("uint8"), {**profile, "nodata": 0})
    write_tif(OUT / "c_on_pond_grid.tif", np.where(aoi, c, 0).astype("uint8"), {**profile, "nodata": 0})

    rows = []
    for code, name in CLASS_NAMES.items():
        if code == 0:
            val = ha(aoi & (cls == 0))
        else:
            val = ha(cls == code)
        rows.append((code, name, val))

    with open(OUT / "class_firstpass_qa.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["class", "name", "ha"])
        w.writeheader()
        for code, name, val in rows:
            w.writerow({"class": code, "name": name, "ha": round(val, 2)})
            print({"class": code, "name": name, "ha": round(val, 2)}, flush=True)

    md = [
        "# Step 3 first-pass class QA (Note 3b)",
        "",
        "Pond-grid overlay of Step 1 H/C with Step 2 pond union / L6 state / salt.",
        "Deferred: STOP built-up, STOP open water, CAUTION tidal flat, GO open/accreted,",
        "CAUTION history unproven, elevation/permit/project flags (need L8–L13, L17–L18).",
        "",
        "| Class | Name | ha |",
        "| ---: | --- | ---: |",
    ]
    for code, name, val in rows:
        md.append(f"| {code} | {name} | {val:.2f} |")
    (OUT / "class_firstpass_qa.md").write_text("\n".join(md) + "\n")

    meta = {
        "grid": "L_ponds_10m",
        "classes_assigned": [3, 5, 6, 7],
        "deferred": [1, 2, 4, 8, 9, 10],
        "note": "First pass only; not the full Note 3b screen",
    }
    (OUT / "PROVENANCE.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
