#!/usr/bin/env python3
"""Export Note 3b L8-L11 onto the class_firstpass 10 m grid (EPSG:32648).

L8  JRC/GHSL/P2023A/GHS_BUILT_S epochs 2025 (used) and 2020 (comparison).
    built_surface is m2 in a 100 m Mollweide cell. Percent = m2 / 100.
    Epoch 2025 is modelled (product epochs after 2020 are modelled).
L9  ESA/WorldCover/v200 band Map (2021). Class 50 is built-up.
L10 GOOGLE/DYNAMICWORLD/V1 label over calendar 2024 and 2025.
    Modal class, water percent of valid observations, observation count
    capped at 254. No top-1 probability mask: Note 3b uses the label.
    Earth Engine mode returns the lowest class code on a tie.
L11 UQ/murray/Intertidal/v1_1/global_intertidal epoch 2014-2016.
    classification bit 0 = 1 is tidal flat. Masked elsewhere, exported as 0.

Project default: gee-gmw-lka-extract. Drive folder: CI_Cambodia_L8_L11.

  python3 export_l8_l11_gee.py --test
  python3 export_l8_l11_gee.py --export-only
  python3 export_l8_l11_gee.py --download-only
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import ee
import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
FIRSTPASS = LAYERS / "L_class_10m_firstpass" / "class_firstpass.tif"
OUT = LAYERS / "L8_L11_10m"
SCRATCH = OUT / "gee_scratch"
TASKS = OUT / "export_tasks.json"

EE_PROJECT = "gee-gmw-lka-extract"
DRIVE_FOLDER = "CI_Cambodia_L8_L11"
Y1 = "2024-01-01"
Y2_EXCLUSIVE = "2026-01-01"

# Dynamic World label codes.
DW_WATER = 0
DW_BUILT = 6


def grid_from_firstpass():
    with rasterio.open(FIRSTPASS) as ds:
        if ds.crs.to_string() != "EPSG:32648":
            raise SystemExit(f"expected EPSG:32648, got {ds.crs}")
        transform = ds.transform
        bounds = ds.bounds
        return {
            "width": ds.width,
            "height": ds.height,
            "crs_transform": [
                transform.a,
                transform.b,
                transform.c,
                transform.d,
                transform.e,
                transform.f,
            ],
            "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            "transform": transform,
        }


def region_geom(grid) -> ee.Geometry:
    xmin, ymin, xmax, ymax = grid["bounds"]
    return ee.Geometry.Rectangle(
        [xmin, ymin, xmax, ymax], proj="EPSG:32648", geodesic=False
    )


def built_pct(year: str) -> ee.Image:
    """Percent of the 100 m cell that is built surface. 50% == 5000 m2."""
    img = (
        ee.ImageCollection("JRC/GHSL/P2023A/GHS_BUILT_S")
        .filter(ee.Filter.eq("system:index", year))
        .first()
        .select("built_surface")
    )
    return img.divide(100).round().clamp(0, 100).unmask(0).toUint8()


def l9_map() -> ee.Image:
    return (
        ee.ImageCollection("ESA/WorldCover/v200")
        .first()
        .select("Map")
        .unmask(0)
        .toUint8()
        .rename("l9_map")
    )


def l11_flat() -> ee.Image:
    img = (
        ee.ImageCollection("UQ/murray/Intertidal/v1_1/global_intertidal")
        .filter(ee.Filter.eq("system:index", "2014-2016"))
        .first()
        .select("classification")
    )
    # Bit 0 set = tidal flat. Unmapped coast is not a flat.
    return img.eq(1).unmask(0).toUint8().rename("l11_flat")


def corroboration_image() -> ee.Image:
    return ee.Image.cat(
        [
            built_pct("2025").rename("l8_2025_pct"),
            built_pct("2020").rename("l8_2020_pct"),
            l9_map(),
            l11_flat(),
        ]
    )


def l10_image(region: ee.Geometry) -> ee.Image:
    dw = (
        ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
        .filterDate(Y1, Y2_EXCLUSIVE)
        .filterBounds(region)
        .select("label")
    )

    def as_water(img):
        return img.eq(DW_WATER).rename("is_water").toUint8()

    count = dw.reduce(ee.Reducer.count()).rename("n")
    modal = dw.reduce(ee.Reducer.mode()).rename("modal")
    water = dw.map(as_water).reduce(ee.Reducer.mean()).rename("water")
    valid = count.gt(0)
    modal_u8 = modal.updateMask(valid).unmask(255).toUint8().rename("l10_modal")
    water_u8 = (
        water.multiply(100)
        .round()
        .clamp(0, 100)
        .updateMask(valid)
        .unmask(255)
        .toUint8()
        .rename("l10_water_pct")
    )
    n_u8 = count.min(254).updateMask(valid).unmask(255).toUint8().rename("l10_n")
    return ee.Image.cat([modal_u8, water_u8, n_u8])


def start_export(image: ee.Image, name: str, grid) -> ee.batch.Task:
    task = ee.batch.Export.image.toDrive(
        image=image,
        description=name[:100],
        folder=DRIVE_FOLDER,
        fileNamePrefix=name,
        region=region_geom(grid),
        crs="EPSG:32648",
        crsTransform=grid["crs_transform"],
        maxPixels=1e11,
        fileFormat="GeoTIFF",
        formatOptions={"noData": 255},
    )
    task.start()
    print(f"  started {name} ({task.id})", flush=True)
    return task


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


def download_prefix(prefix: str) -> list[Path]:
    from googleapiclient.http import MediaIoBaseDownload

    svc = drive_service()
    q = f"name contains '{prefix}' and trashed = false"
    files = (
        svc.files()
        .list(q=q, fields="files(id,name,size,createdTime)", pageSize=100)
        .execute()
        .get("files", [])
    )
    files = [f for f in files if f["name"].startswith(prefix) and f["name"].endswith(".tif")]
    if not files:
        raise FileNotFoundError(f"No Drive GeoTIFF for {prefix}")
    SCRATCH.mkdir(parents=True, exist_ok=True)
    out = []
    for f in sorted(files, key=lambda x: x["name"]):
        path = SCRATCH / f["name"]
        size = int(f.get("size") or 0)
        if path.exists() and size and path.stat().st_size == size:
            print(f"  skip existing {f['name']}", flush=True)
            out.append(path)
            continue
        print(f"  download {f['name']} ({size} bytes)", flush=True)
        req = svc.files().get_media(fileId=f["id"])
        with path.open("wb") as fh:
            downloader = MediaIoBaseDownload(fh, req, chunksize=8 * 1024 * 1024)
            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    print(f"    {int(status.progress() * 100)}%", flush=True)
        out.append(path)
    return out


def paste_shards(paths: list[Path], band: int, grid) -> np.ndarray:
    """Paste Drive shards. A coverage mask separates holes from a real 255."""
    dest = np.full((grid["height"], grid["width"]), 255, dtype="uint8")
    cover = np.zeros((grid["height"], grid["width"]), dtype="bool")
    xmin = grid["transform"].c
    ymax = grid["transform"].f
    for path in paths:
        with rasterio.open(path) as src:
            if src.crs is None or src.crs.to_string() != "EPSG:32648":
                raise SystemExit(f"{path.name} CRS is {src.crs}, expected EPSG:32648")
            col_f = (src.transform.c - xmin) / 10.0
            row_f = (ymax - src.transform.f) / 10.0
            if abs(col_f - round(col_f)) > 1e-3 or abs(row_f - round(row_f)) > 1e-3:
                raise SystemExit(
                    f"{path.name} is not on the screen grid "
                    f"(col {col_f}, row {row_f})"
                )
            if abs(src.transform.a - 10) > 1e-6 or abs(src.transform.e + 10) > 1e-6:
                raise SystemExit(f"{path.name} resolution is not 10 m")
            data = src.read(band)
            if data.dtype != np.uint8:
                data = np.clip(np.rint(data), 0, 255).astype("uint8")
            col = int(round(col_f))
            row = int(round(row_f))
            h, w = data.shape
            r0, c0 = max(row, 0), max(col, 0)
            r1 = min(row + h, grid["height"])
            c1 = min(col + w, grid["width"])
            if r0 >= r1 or c0 >= c1:
                print(f"  shard {path.name} falls outside the grid", flush=True)
                continue
            dest[r0:r1, c0:c1] = data[
                r0 - row : r0 - row + (r1 - r0), c0 - col : c0 - col + (c1 - c0)
            ]
            cover[r0:r1, c0:c1] = True
            print(f"  pasted {path.name} band {band} at row {row} col {col}", flush=True)
    missing = int((~cover).sum())
    if missing:
        raise SystemExit(f"band {band} is missing {missing} pixels after mosaic")
    return dest


def write_band(path: Path, array: np.ndarray, grid, description: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    profile = {
        "driver": "GTiff",
        "width": grid["width"],
        "height": grid["height"],
        "count": 1,
        "dtype": "uint8",
        "crs": "EPSG:32648",
        "transform": grid["transform"],
        "nodata": 255,
        "compress": "lzw",
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256,
    }
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(array, 1)
        dst.update_tags(DESCRIPTION=description)
    print(f"  wrote {path.name} ({path.stat().st_size} bytes)", flush=True)


def stage_layers(grid):
    bands_a = {
        1: ("l8_2025_pct.tif", "GHS-BUILT-S 2025 built percent of the 100 m cell (modelled epoch)"),
        2: ("l8_2020_pct.tif", "GHS-BUILT-S 2020 built percent of the 100 m cell (last observed epoch)"),
        3: ("l9_map.tif", "ESA WorldCover v200 Map, 2021. 0 = unmapped. Class 50 = built-up"),
        4: ("l11_flat.tif", "Murray intertidal v1.1 epoch 2014-2016 tidal flat (1) or not (0)"),
    }
    bands_b = {
        1: ("l10_modal.tif", "Dynamic World modal label, calendar 2024 and 2025. 255 = no observation"),
        2: ("l10_water_pct.tif", "Dynamic World water share of valid observations, percent. 255 = no observation"),
        3: ("l10_n.tif", "Dynamic World observation count, capped at 254. 255 = no observation"),
    }
    paths_a = download_prefix("l8_l9_l11_screen10m")
    paths_b = download_prefix("l10_y1y2_screen10m")
    for band, (name, desc) in bands_a.items():
        write_band(OUT / name, paste_shards(paths_a, band, grid), grid, desc)
    for band, (name, desc) in bands_b.items():
        write_band(OUT / name, paste_shards(paths_b, band, grid), grid, desc)
    (OUT / "PROVENANCE.json").write_text(
        json.dumps(
            {
                "grid": "class_firstpass / L_ponds_10m",
                "crs": "EPSG:32648",
                "crs_transform": grid["crs_transform"],
                "width": grid["width"],
                "height": grid["height"],
                "ee_project": EE_PROJECT,
                "y1_y2": "2024-01-01 inclusive to 2026-01-01 exclusive",
                "l8": "JRC/GHSL/P2023A/GHS_BUILT_S built_surface/100, epochs 2025 and 2020",
                "l9": "ESA/WorldCover/v200 Map",
                "l10": "GOOGLE/DYNAMICWORLD/V1 label mode, water percent, count cap 254",
                "l10_tie": "Earth Engine Reducer.mode returns the lowest class on a tie",
                "l11": "UQ/murray/Intertidal/v1_1/global_intertidal 2014-2016 classification == 1",
                "resampling": "nearest, export crsTransform locked to the screen grid",
            },
            indent=2,
        )
        + "\n"
    )


def run_test(grid):
    """Histograms on a 64 x 64 block in the north-west of the grid, plus two points."""
    image = corroboration_image().addBands(l10_image(region_geom(grid)))
    xmin, ymin, xmax, ymax = grid["bounds"]
    # North-west 640 m block, inside the grid.
    x0, y0 = xmin + 20000, ymax - 20000
    block = ee.Geometry.Rectangle(
        [x0, y0 - 640, x0 + 640, y0], proj="EPSG:32648", geodesic=False
    )
    hist = image.reduceRegion(
        reducer=ee.Reducer.frequencyHistogram(),
        geometry=block,
        crs="EPSG:32648",
        crsTransform=grid["crs_transform"],
        maxPixels=1e6,
        bestEffort=False,
    ).getInfo()
    print("64x64 block histograms (north-west inset):")
    for band, counts in hist.items():
        top = sorted(counts.items(), key=lambda kv: -float(kv[1]))[:8]
        print(f"  {band}: {top}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=EE_PROJECT)
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--export-only", action="store_true")
    ap.add_argument("--download-only", action="store_true")
    args = ap.parse_args()

    grid = grid_from_firstpass()
    print(
        f"grid {grid['width']}x{grid['height']} transform {grid['crs_transform']} "
        f"bounds {grid['bounds']}",
        flush=True,
    )
    ee.Initialize(project=args.project)
    if args.test:
        run_test(grid)
        return
    if args.download_only:
        stage_layers(grid)
        return

    region = region_geom(grid)
    tasks = [
        start_export(corroboration_image(), "l8_l9_l11_screen10m", grid),
        start_export(l10_image(region), "l10_y1y2_screen10m", grid),
    ]
    OUT.mkdir(parents=True, exist_ok=True)
    TASKS.write_text(
        json.dumps(
            [{"id": t.id, "name": t.status().get("description")} for t in tasks],
            indent=2,
        )
        + "\n"
    )
    if args.export_only:
        print(f"task ids written to {TASKS}")
        return

    pending = {t.id: t for t in tasks}
    while pending:
        done = []
        for tid, task in pending.items():
            state = task.status()["state"]
            print(f"  {task.status().get('description', tid)}: {state}", flush=True)
            if state in ("COMPLETED", "FAILED", "CANCELLED"):
                if state != "COMPLETED":
                    raise RuntimeError(task.status())
                done.append(tid)
        for tid in done:
            pending.pop(tid)
        if pending:
            time.sleep(30)
    stage_layers(grid)


if __name__ == "__main__":
    main()
