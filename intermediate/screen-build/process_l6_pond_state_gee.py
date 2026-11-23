#!/usr/bin/env python3
"""Note 3b Step 2: L6 wet/dry/intermittent + salt via Earth Engine Drive export.

Project default: gee-gmw-lka-extract

  python3 process_l6_pond_state_gee.py --project gee-gmw-lka-extract
  python3 process_l6_pond_state_gee.py --project gee-gmw-lka-extract --download-only

Exports water-frequency and dry-season composites to Google Drive folder
CI_Cambodia_L6, downloads them, warps to L_ponds_10m grid, classifies.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import time
from pathlib import Path

import ee
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject

ROOT = Path(__file__).resolve().parents[2]
PONDS = ROOT / "inputs" / "screen-layers" / "L_ponds_10m"
OUT = PONDS
GRID = PONDS / "grid.json"
POND_MASK = PONDS / "step2_pond_union.tif"
SCRATCH = PONDS / "l6_gee_scratch"
DRIVE_FOLDER = "CI_Cambodia_L6"

EE_PROJECT = "gee-gmw-lka-extract"
NODATA_U8 = 255
NODATA_F = -9999.0
WET = 0.50
DRY = 0.10
SALT_NDVI = 0.15
SALT_B11 = 0.20
SALT_WF = 0.10


def aoi_from_grid() -> ee.Geometry:
    meta = json.loads(GRID.read_text())
    minx, miny, maxx, maxy = meta["bounds_utm48n"]
    # buffer slightly
    return ee.Geometry.Rectangle([minx, miny, maxx, maxy], proj="EPSG:32648", geodesic=False)


def water_frequency(year: int) -> ee.Image:
    start, end = f"{year}-01-01", f"{year}-12-31"
    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 80))
    )

    def s2_water(img):
        scl = img.select("SCL")
        clear = scl.eq(4).Or(scl.eq(5)).Or(scl.eq(6)).Or(scl.eq(7))
        green = img.select("B3").multiply(0.0001)
        swir = img.select("B11").multiply(0.0001)
        water = green.subtract(swir).divide(green.add(swir)).gt(0).rename("water")
        return water.updateMask(clear).copyProperties(img, ["system:time_start"])

    s1 = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterDate(start, end)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .select("VV")
        .map(
            lambda img: img.lt(-18).rename("water").copyProperties(img, ["system:time_start"])
        )
    )
    combined = s2.map(s2_water).merge(s1)
    wf = combined.mean().select("water").rename("wf")
    n = combined.count().select("water").rename("n")
    return wf.addBands(n).toFloat()


def dry_season(year: int) -> ee.Image:
    start, end = f"{year - 1}-12-01", f"{year}-04-30"
    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 80))
    )

    def prep(img):
        scl = img.select("SCL")
        clear = scl.eq(4).Or(scl.eq(5)).Or(scl.eq(6)).Or(scl.eq(7))
        nir = img.select("B8").multiply(0.0001)
        red = img.select("B4").multiply(0.0001)
        green = img.select("B3").multiply(0.0001)
        swir = img.select("B11").multiply(0.0001)
        ndvi = nir.subtract(red).divide(nir.add(red)).rename("ndvi")
        b11 = swir.rename("b11")
        water = green.subtract(swir).divide(green.add(swir)).gt(0).rename("ds_wf")
        return ee.Image.cat([ndvi, b11, water]).updateMask(clear)

    col = s2.map(prep)
    return (
        col.select(["ndvi", "b11"])
        .median()
        .addBands(col.select("ds_wf").mean())
        .toFloat()
    )


def start_export(image: ee.Image, name: str, region: ee.Geometry, scale: int = 10) -> ee.batch.Task:
    task = ee.batch.Export.image.toDrive(
        image=image,
        description=name[:100],
        folder=DRIVE_FOLDER,
        fileNamePrefix=name,
        region=region,
        scale=scale,
        crs="EPSG:32648",
        maxPixels=1e11,
        fileFormat="GeoTIFF",
        formatOptions={"cloudOptimized": True},
    )
    task.start()
    print(f"  started Drive export: {name} ({task.id})", flush=True)
    return task


def wait_tasks(tasks: list[ee.batch.Task], poll: int = 30):
    pending = {t.id: t for t in tasks}
    while pending:
        done = []
        for tid, t in pending.items():
            st = t.status()
            state = st["state"]
            if state in ("COMPLETED", "FAILED", "CANCELLED"):
                print(f"  {t.status().get('description', tid)}: {state}", flush=True)
                if state != "COMPLETED":
                    raise RuntimeError(f"Export failed: {st}")
                done.append(tid)
            else:
                print(f"  … {t.status().get('description', tid)}: {state}", flush=True)
        for tid in done:
            pending.pop(tid)
        if pending:
            time.sleep(poll)


def drive_service():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from ee.oauth import CLIENT_ID, CLIENT_SECRET

    cred_path = Path.home() / ".config" / "earthengine" / "credentials"
    raw = json.loads(cred_path.read_text())
    creds = Credentials(
        token=None,
        refresh_token=raw["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=raw.get("scopes"),
    )
    creds.refresh(Request())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def download_drive_prefix(prefix: str, dest_dir: Path) -> list[Path]:
    """Download Drive GeoTIFFs whose name starts with prefix (any CI_Cambodia_L6 folder)."""
    from googleapiclient.http import MediaIoBaseDownload

    svc = drive_service()
    # EE may create one CI_Cambodia_L6 folder per export; search by name globally
    q = f"name contains '{prefix}' and trashed = false"
    files = (
        svc.files()
        .list(q=q, fields="files(id,name,size)", pageSize=50)
        .execute()
        .get("files", [])
    )
    files = [f for f in files if f["name"].startswith(prefix) and f["name"].endswith(".tif")]
    if not files:
        raise FileNotFoundError(f"No Drive files matching {prefix}")
    dest_dir.mkdir(parents=True, exist_ok=True)
    out_paths = []
    for f in sorted(files, key=lambda x: x["name"]):
        path = dest_dir / f["name"]
        if path.exists() and path.stat().st_size == int(f.get("size") or 0):
            print(f"  skip existing {f['name']}", flush=True)
            out_paths.append(path)
            continue
        print(f"  download {f['name']} ({f.get('size', '?')} bytes)", flush=True)
        req = svc.files().get_media(fileId=f["id"])
        with path.open("wb") as fh:
            downloader = MediaIoBaseDownload(fh, req, chunksize=8 * 1024 * 1024)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    print(f"    {int(status.progress() * 100)}%", flush=True)
        out_paths.append(path)
    return out_paths


def warp_to_grid(src_path: Path, band_index: int, out_path: Path, dtype="float32", nodata=NODATA_F):
    with rasterio.open(POND_MASK) as tmpl:
        dst_crs = tmpl.crs
        dst_transform = tmpl.transform
        h, w = tmpl.height, tmpl.width
        profile = tmpl.profile.copy()
    profile.update(dtype=dtype, count=1, nodata=nodata, compress="lzw", tiled=True)
    dest = np.full((h, w), nodata, dtype=dtype)
    with rasterio.open(src_path) as src:
        reproject(
            source=rasterio.band(src, band_index),
            destination=dest,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=Resampling.nearest,
            src_nodata=src.nodata,
            dst_nodata=nodata,
        )
    with rasterio.open(out_path, "w", **profile) as dst:
        dst.write(dest, 1)
    return dest


def classify_state(wf: np.ndarray, pond: np.ndarray) -> np.ndarray:
    out = np.full(wf.shape, NODATA_U8, dtype="uint8")
    valid = (pond == 1) & (wf != nodata_check(wf)) & np.isfinite(wf) & (wf >= 0)
    out[pond == 0] = 0
    out[valid & (wf <= DRY)] = 1
    out[valid & (wf > DRY) & (wf < WET)] = 2
    out[valid & (wf >= WET)] = 3
    out[(pond == 1) & ~valid] = NODATA_U8
    return out


def nodata_check(wf: np.ndarray) -> np.ndarray:
    return (wf == NODATA_F) | (wf < -1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=EE_PROJECT)
    ap.add_argument("--years", nargs="+", type=int, default=[2024, 2025])
    ap.add_argument("--download-only", action="store_true")
    ap.add_argument("--export-only", action="store_true")
    ap.add_argument("--scale", type=int, default=10)
    args = ap.parse_args()

    ee.Initialize(project=args.project)
    region = aoi_from_grid()
    SCRATCH.mkdir(parents=True, exist_ok=True)

    exports = []
    if not args.download_only:
        print("Starting Drive exports…", flush=True)
        for year in args.years:
            exports.append(
                start_export(water_frequency(year), f"l6_waterfreq_{year}", region, args.scale)
            )
            exports.append(
                start_export(dry_season(year), f"l6_dryseason_{year}", region, args.scale)
            )
        wait_tasks(exports)
        if args.export_only:
            print("Export-only done.")
            return

    print("Downloading from Drive…", flush=True)
    downloaded = {}
    for year in args.years:
        downloaded[f"wf_{year}"] = download_drive_prefix(f"l6_waterfreq_{year}", SCRATCH)
        downloaded[f"ds_{year}"] = download_drive_prefix(f"l6_dryseason_{year}", SCRATCH)

    with rasterio.open(POND_MASK) as ds:
        pond = ds.read(1)
        profile_u8 = ds.profile.copy()
    profile_u8.update(dtype="uint8", count=1, nodata=NODATA_U8, compress="lzw", tiled=True)

    wf_by_year = {}
    for year in args.years:
        # EE may split into multiple geotiffs; mosaic first if needed
        paths = downloaded[f"wf_{year}"]
        # Prefer single file; if shards, open first (Drive export usually one cloud-optimized or shards)
        # warp band 1 = wf, band 2 = n if present
        src = paths[0]
        if len(paths) > 1:
            # pick the largest shard as primary warning
            src = max(paths, key=lambda p: p.stat().st_size)
            print(f"  warning: {len(paths)} shards for wf {year}; using {src.name}")
        wf = warp_to_grid(src, 1, OUT / f"l6_waterfreq_{year}_wf.tif")
        with rasterio.open(src) as s:
            if s.count >= 2:
                warp_to_grid(src, 2, OUT / f"l6_waterfreq_{year}_n.tif")
        wf_by_year[year] = wf
        state = classify_state(wf, pond)
        with rasterio.open(OUT / f"l6_pond_state_{year}.tif", "w", **profile_u8) as dst:
            dst.write(state, 1)
            dst.update_tags(
                CLASSES="0=non-pond,1=dry,2=intermittent,3=wet,255=nodata",
                WET=str(WET),
                DRY=str(DRY),
                PROJECT=args.project,
            )
        print(f"  wrote l6_pond_state_{year}.tif")

    y1, y2 = args.years[0], args.years[1]
    s1 = classify_state(wf_by_year[y1], pond)
    s2 = classify_state(wf_by_year[y2], pond)
    both = np.full(pond.shape, NODATA_U8, dtype="uint8")
    both[pond == 0] = 0
    both[(pond == 1) & (s1 == 1) & (s2 == 1)] = 1
    both[(pond == 1) & (((s1 >= 2) & (s1 <= 3)) | ((s2 >= 2) & (s2 <= 3)))] = 2
    with rasterio.open(OUT / "l6_pond_activity_y1y2.tif", "w", **profile_u8) as dst:
        dst.write(both, 1)
        dst.update_tags(CLASSES="0=non-pond,1=inactive,2=active,255=nodata", Y1=str(y1), Y2=str(y2))

    salt_ok = np.ones(pond.shape, dtype=bool)
    for year in args.years:
        paths = downloaded[f"ds_{year}"]
        src = max(paths, key=lambda p: p.stat().st_size)
        ndvi = warp_to_grid(src, 1, OUT / f"l6_dryseason_{year}_ndvi.tif")
        b11 = warp_to_grid(src, 2, OUT / f"l6_dryseason_{year}_b11.tif")
        dswf = warp_to_grid(src, 3, OUT / f"l6_dryseason_{year}_ds_wf.tif")
        ok = (
            np.isfinite(ndvi)
            & np.isfinite(b11)
            & np.isfinite(dswf)
            & (ndvi > -1)
            & (ndvi < SALT_NDVI)
            & (b11 > SALT_B11)
            & (dswf <= SALT_WF)
            & (dswf >= 0)
        )
        salt_ok &= ok
        print(f"  salt candidates {year}: {int((ok & (pond==1)).sum())} px")

    salt = np.full(pond.shape, NODATA_U8, dtype="uint8")
    salt[pond == 0] = 0
    salt[(pond == 1) & salt_ok] = 1
    salt[(pond == 1) & ~salt_ok] = 0
    with rasterio.open(OUT / "l6_salt_field.tif", "w", **profile_u8) as dst:
        dst.write(salt, 1)
        dst.update_tags(
            METHOD=f"NDVI<{SALT_NDVI}, B11>{SALT_B11}, ds_wf<={SALT_WF}, both dry seasons",
            NOTE="PROPOSAL thresholds; eye-check before class 5",
        )

    rows = []
    px_ha = 0.01

    def add(name, m):
        px = int(m.sum())
        rows.append({"layer": name, "pixels": px, "ha": round(px * px_ha, 2)})

    for year in args.years:
        st = classify_state(wf_by_year[year], pond)
        add(f"state_{year}_dry", st == 1)
        add(f"state_{year}_intermittent", st == 2)
        add(f"state_{year}_wet", st == 3)
    add("inactive_dry_both_years", both == 1)
    add("active", both == 2)
    add("salt_field", salt == 1)
    add("pond_union", pond == 1)

    with (OUT / "l6_pond_state_qa.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["layer", "pixels", "ha"])
        w.writeheader()
        w.writerows(rows)

    lines = [
        "# L6 pond state QA (Note 3b Step 2)\n\n",
        f"**EE project.** `{args.project}` via Drive folder `{DRIVE_FOLDER}`.\n\n",
        f"**Years.** Y1={y1}, Y2={y2}. Mask `step2_pond_union.tif`.\n\n",
        f"**State.** dry≤{DRY}, wet≥{WET}. **Salt (proposal).** NDVI<{SALT_NDVI}, B11>{SALT_B11}, ds WF≤{SALT_WF}.\n\n",
        "| Layer | ha |\n| --- | ---: |\n",
    ]
    for r in rows:
        lines.append(f"| {r['layer']} | {r['ha']} |\n")
    (OUT / "l6_pond_state_qa.md").write_text("".join(lines))

    with (OUT / "PROVENANCE.txt").open("a") as f:
        f.write(
            f"\nL6 Drive export ({args.project}): waterfreq + dryseason {args.years}; "
            "l6_pond_state_*, l6_pond_activity_y1y2, l6_salt_field\n"
        )
    print("Done.", OUT / "l6_pond_state_qa.md")


if __name__ == "__main__":
    main()
