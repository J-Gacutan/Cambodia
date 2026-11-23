#!/usr/bin/env python3
"""Fetch GEBCO_2026 elevation + TID for coastal Cambodia (L14).

Reuses the CEDA/BODC NetcdfSubset route from LKA-MSP tools/fetch_gebco.py
(LKA-MSP-9lt): Earth Engine sat-io gebco_grid_2026 was not loadable there, and
download.gebco.net is a JS subsetter with no stable direct URL (IND-MSP
fetch_demak_sources.py). Public domain; not for navigation.

Default box matches Note 3b / phase-0 register: W 102.5–E 105.2, S 9.8–N 12.3.

    python3 intermediate/screen-build/fetch_l14_gebco_cambodia.py
    python3 intermediate/screen-build/fetch_l14_gebco_cambodia.py --elevation-only
    python3 intermediate/screen-build/fetch_l14_gebco_cambodia.py --tid-only
    python3 intermediate/screen-build/fetch_l14_gebco_cambodia.py --from-nc
        # convert any already-staged *.nc in L14/ to GeoTIFF (no download)
"""
from __future__ import annotations

import argparse
import hashlib
import tempfile
import time
from pathlib import Path

import numpy as np
import rasterio
import requests
from rasterio.transform import from_origin

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "inputs" / "screen-layers" / "L14"
BBOX = dict(west=102.5, east=105.2, south=9.8, north=12.3)
DOI = "10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa"
TERMS = "https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use"
# Same host pattern as LKA-MSP/tools/fetch_gebco.py; TID path mirrors ice_surface_elevation.
THREDDS_ELEV = (
    "https://dap.ceda.ac.uk/thredds/ncss/bodc/gebco/global/gebco_2026/"
    "ice_surface_elevation/netcdf/GEBCO_2026.nc"
)
THREDDS_TID = (
    "https://dap.ceda.ac.uk/thredds/ncss/bodc/gebco/global/gebco_2026/"
    "type_identifier_grid/netcdf/gebco_2026_tid.nc"
)
ELEV_TIF = OUT_DIR / "GEBCO_2026_KH_elevation.tif"
TID_TIF = OUT_DIR / "GEBCO_2026_KH_tid.tif"
ELEV_NC = OUT_DIR / "GEBCO_2026_KH_elevation.nc"
TID_NC = OUT_DIR / "GEBCO_2026_KH_tid.nc"


def ncss_url(base: str, var: str) -> str:
    q = "&".join(
        [f"var={var}", *(f"{k}={v}" for k, v in BBOX.items()), "horizStride=1", "accept=netcdf"]
    )
    return f"{base}?{q}"


def fetch(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, 8):
        try:
            r = requests.get(url, timeout=300)
        except requests.RequestException as e:
            print(f"attempt {attempt}: {type(e).__name__}: {e}; retrying")
            time.sleep(15)
            continue
        if r.status_code == 200 and r.content[:3] in (b"CDF", b"\x89HD"):
            dest.write_bytes(r.content)
            return
        print(f"attempt {attempt}: HTTP {r.status_code}, {len(r.content)} bytes; retrying")
        time.sleep(20)
    raise SystemExit(f"THREDDS NetcdfSubset failed after retries: {url}")


def nc_to_tif(nc: Path, tif: Path, *, product: str, var_hint: str, units: str) -> None:
    with rasterio.open(nc) as src:
        arr = src.read(1)
        b = src.bounds
        res_x = (b.right - b.left) / src.width
        res_y = (b.top - b.bottom) / src.height
        tags = src.tags()
    assert abs(res_x - 1 / 240) < 1e-6 and abs(res_y - 1 / 240) < 1e-6, (res_x, res_y)
    title = tags.get("NC_GLOBAL#title", "")
    assert "GEBCO_2026" in title or var_hint in title.lower() or title, title
    assert arr.min() > -32000, "fill values present"
    dtype = "int16" if arr.dtype.kind in "iu" or np.issubdtype(arr.dtype, np.integer) else "float32"
    if dtype == "int16":
        arr = arr.astype("int16")
    meta = dict(
        driver="GTiff",
        height=arr.shape[0],
        width=arr.shape[1],
        count=1,
        dtype=dtype,
        crs="EPSG:4326",
        transform=from_origin(b.left, b.top, res_x, res_y),
        compress="deflate",
        predictor=2,
        tiled=True,
        blockxsize=256,
        blockysize=256,
    )
    with rasterio.open(tif, "w", **meta) as dst:
        dst.write(arr, 1)
        dst.update_tags(
            TITLE=title,
            PRODUCT=product,
            DOI=DOI,
            LICENCE="Public domain, free of charge; see " + TERMS,
            SOURCE_URL=ncss_url(THREDDS_ELEV if "elevation" in product.lower() else THREDDS_TID,
                                "elevation" if "elevation" in product.lower() else "tid"),
            BBOX="W102.5–E105.2, S9.8–N12.3",
            UNITS=units,
            DATE_CREATED=tags.get("NC_GLOBAL#date_created", ""),
            STAGED="22 Nov 2026 ywdp.8.1.3",
            REUSE="CEDA NetcdfSubset pattern from LKA-MSP/tools/fetch_gebco.py",
        )
    print(f"wrote {tif.relative_to(ROOT)}: {tif.stat().st_size} bytes, "
          f"{arr.shape[1]}x{arr.shape[0]}, {int(arr.min())}..{int(arr.max())}")
    print("sha256", hashlib.sha256(tif.read_bytes()).hexdigest())


def write_provenance() -> None:
    lines = [
        "L14 — GEBCO_2026 Grid, Cambodia coastal subset (elevation + TID)",
        f"DOI: {DOI}",
        f"Terms: {TERMS} (PDF also in this folder)",
        "Box: W 102.5–E 105.2, S 9.8–N 12.3 (15 arc-second)",
        "Route: CEDA/BODC THREDDS NetcdfSubset (same pattern as LKA-MSP/tools/fetch_gebco.py)",
        f"  elevation: {THREDDS_ELEV}",
        f"  TID: {THREDDS_TID}",
        "Files:",
        f"  {ELEV_TIF.name if ELEV_TIF.exists() else '(elevation tif pending)'}",
        f"  {TID_TIF.name if TID_TIF.exists() else '(TID tif pending — CEDA may be down; re-run --tid-only)'}",
        "Public domain; not for navigation. Staged for ywdp.8.1.3.",
        "",
    ]
    (OUT_DIR / "PROVENANCE.txt").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--elevation-only", action="store_true")
    ap.add_argument("--tid-only", action="store_true")
    ap.add_argument("--from-nc", action="store_true",
                    help="convert staged NetCDF only; do not download")
    args = ap.parse_args()
    do_elev = not args.tid_only
    do_tid = not args.elevation_only
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.from_nc:
        if do_elev and ELEV_NC.exists():
            nc_to_tif(ELEV_NC, ELEV_TIF,
                      product="GEBCO_2026 Grid (ice surface elevation version)",
                      var_hint="elevation",
                      units="metres relative to sea level, negative below")
        if do_tid and TID_NC.exists():
            nc_to_tif(TID_NC, TID_TIF,
                      product="GEBCO_2026 Type Identifier (TID) Grid",
                      var_hint="tid",
                      units="GEBCO TID codes (see GEBCO documentation)")
        write_provenance()
        return

    if do_elev:
        url = ncss_url(THREDDS_ELEV, "elevation")
        print("fetch elevation", url)
        fetch(url, ELEV_NC)
        nc_to_tif(ELEV_NC, ELEV_TIF,
                  product="GEBCO_2026 Grid (ice surface elevation version)",
                  var_hint="elevation",
                  units="metres relative to sea level, negative below")
    if do_tid:
        url = ncss_url(THREDDS_TID, "tid")
        print("fetch TID", url)
        fetch(url, TID_NC)
        nc_to_tif(TID_NC, TID_TIF,
                  product="GEBCO_2026 Type Identifier (TID) Grid",
                  var_hint="tid",
                  units="GEBCO TID codes (see GEBCO documentation)")
    write_provenance()


if __name__ == "__main__":
    main()
