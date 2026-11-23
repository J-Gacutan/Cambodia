#!/usr/bin/env python3
"""Note 3b elevation-check flag: L12 DeltaDTM vs L13 HAT amplitude-sum proxy.

Go reads as caution where surface elevation exceeds the HAT proxy by more than
L12 vertical error. The class raster is not rewritten: the flag attaches
without a new class code (method note: flags attach to any class without
changing it).

Grid: L_ponds_10m / class_firstpass (EPSG:32648, 10 m), nearest neighbour,
matching the Phase 0 screen freeze.

E_L12 = 0.74 m. Pronk et al. 2024, Scientific Data, Table 6 overall RMSE
against airborne lidar, which that paper uses as vertical uncertainty.
The staged product is DeltaDTM v1.1. The 4TU v1.1 record quotes overall MAE
0.43 m and does not republish an RMSE, so 0.74 m is applied to v1.1 as a
documented assumption. Mangrove-class RMSE in the same table is 0.73 m.
A class-6 sensitivity count at 0.43 m is reported and is not a second flag.

HAT proxy is an MSL-relative amplitude sum (phases ignored), not chart-datum
HAT. Exact 0.00 m in hat_amplitude_sum_proxy_kh.tif is the NaN fill from
process_l13_hat_examples_map.py (no constituent amplitude), so those cells
are not tested.
"""
from __future__ import annotations

import csv
import hashlib
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import rasterio
from matplotlib.colors import ListedColormap
from pyproj import Transformer
from rasterio.enums import Resampling
from rasterio.transform import array_bounds
from rasterio.warp import reproject

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
L12 = LAYERS / "L12" / "DeltaDTM_v1_1_cambodia_coastal_clip.tif"
L13 = LAYERS / "L13" / "hat_amplitude_sum_proxy_kh.tif"
GRID = LAYERS / "L_ponds_10m" / "aoi_mask.tif"
CLASS = LAYERS / "L_class_10m_firstpass" / "class_firstpass.tif"
OUT_TIF = LAYERS / "L13" / "elevation_check_flag_10m.tif"
VIZ = LAYERS / "L13" / "visualizations"
OUT_CSV = VIZ / "l13-elevation-check-qa.csv"
OUT_MD = VIZ / "l13-elevation-check.md"
OUT_PNG = VIZ / "elevation_check_flag.png"

# Pronk et al. 2024 Sci Data Table 6, overall RMSE (m). See module docstring.
E_L12 = 0.74
# 4TU DeltaDTM v1.1 record, overall MAE (m). Sensitivity count only.
E_MAE = 0.43
RES_M = 10.0
L12_NODATA = -32768
HAT_NODATA = -9999.0
FLAG_NODATA = 255
CLASS_GO = 6

SITES = [
    ("Koh Kong coast (Peam Krasop area)", 103.05, 11.45),
    ("Sihanoukville Bay", 103.55, 10.62),
    ("Kep", 104.32, 10.48),
    ("Koh Rong approaches", 103.30, 10.70),
    ("Kampot coast", 104.18, 10.60),
]


def ha(n: int) -> float:
    return n * (RES_M * RES_M) / 10_000.0


def warp_nearest(src_path: Path, dst: np.ndarray, profile, dst_nodata: float) -> None:
    with rasterio.open(src_path) as src:
        reproject(
            source=rasterio.band(src, 1),
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=src.nodata,
            dst_transform=profile["transform"],
            dst_crs=profile["crs"],
            dst_nodata=dst_nodata,
            resampling=Resampling.nearest,
            num_threads=4,
        )


def main() -> None:
    VIZ.mkdir(parents=True, exist_ok=True)
    with rasterio.open(GRID) as ref:
        profile = ref.profile.copy()
        transform = ref.transform
        aoi = ref.read(1)
        height, width = aoi.shape

    print(f"grid {width} x {height}", flush=True)
    elev_dm = np.full((height, width), L12_NODATA, dtype=np.int16)
    hat = np.full((height, width), HAT_NODATA, dtype=np.float32)
    print("warping L12 nearest…", flush=True)
    warp_nearest(L12, elev_dm, profile, L12_NODATA)
    print("warping L13 nearest…", flush=True)
    warp_nearest(L13, hat, profile, HAT_NODATA)

    elev_ok = elev_dm != L12_NODATA
    # 0.00 m is the NaN fill in the amplitude-sum GeoTIFF, not a tide height.
    hat_ok = np.isfinite(hat) & (hat > 0.0) & (hat != np.float32(HAT_NODATA))
    tested = elev_ok & hat_ok
    elev_m = np.zeros((height, width), dtype=np.float32)
    elev_m[elev_ok] = elev_dm[elev_ok].astype(np.float32) / 10.0

    margin = np.full((height, width), np.nan, dtype=np.float32)
    margin[tested] = elev_m[tested] - hat[tested]

    flag = np.full((height, width), FLAG_NODATA, dtype=np.uint8)
    flag[tested] = 0
    flag[tested & (margin > E_L12)] = 1

    # Sensitivity at the v1.1 stated MAE. Not written as a raster.
    sens = tested & (margin > E_MAE)

    with rasterio.open(CLASS) as ds:
        cls = ds.read(1)
    go = cls == CLASS_GO
    on_aoi = (aoi > 0) & (aoi != 255)

    def n(mask: np.ndarray) -> int:
        return int(np.count_nonzero(mask))

    rows = [
        ("tested", n(tested)),
        ("flagged_caution", n(flag == 1)),
        ("within_allowance", n(flag == 0)),
        ("not_tested", n(flag == FLAG_NODATA)),
        ("not_tested_hat_fill_zero", n(elev_ok & ~hat_ok & (hat == 0))),
        ("not_tested_no_elev", n(~elev_ok)),
        ("tested_on_aoi", n(tested & on_aoi)),
        ("flagged_on_aoi", n((flag == 1) & on_aoi)),
        ("within_allowance_on_aoi", n((flag == 0) & on_aoi)),
        ("class6_go_total", n(go)),
        ("class6_flagged_caution", n(go & (flag == 1))),
        ("class6_within_allowance", n(go & (flag == 0))),
        ("class6_not_tested", n(go & (flag == FLAG_NODATA))),
        ("class6_not_tested_no_elev", n(go & ~elev_ok)),
        ("class6_not_tested_hat_fill_zero", n(go & elev_ok & ~hat_ok)),
        ("class6_flagged_if_E_0.43m", n(go & sens)),
    ]

    go_tested = go & tested
    if n(go_tested):
        elev_go = elev_m[go_tested]
        hat_go = hat[go_tested]
        mar_go = margin[go_tested]
        p_elev = np.percentile(elev_go, [10, 50, 90])
        p_hat = np.percentile(hat_go, [10, 50, 90])
        p_mar = np.percentile(mar_go, [10, 50, 90])
    else:
        p_elev = p_hat = p_mar = [np.nan, np.nan, np.nan]

    out_profile = profile.copy()
    out_profile.update(
        driver="GTiff",
        count=1,
        dtype="uint8",
        nodata=FLAG_NODATA,
        compress="lzw",
        tiled=True,
        blockxsize=256,
        blockysize=256,
    )
    OUT_TIF.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(OUT_TIF, "w", **out_profile) as dst:
        dst.write(flag, 1)
        dst.update_tags(
            RULE="elev_m > hat_proxy_m + E_L12",
            E_L12_M=str(E_L12),
            E_SOURCE="Pronk et al. 2024 Sci Data Table 6 overall RMSE",
            L12_UNITS="int16 decimetres / 10; nodata -32768",
            L13_UNITS="metres; amplitude-sum proxy; 0.00 is NaN fill, not tested",
            DATUM="MSL screening (EGM2008 DeltaDTM vs FES MSL amplitudes); not chart datum",
            GRID="L_ponds_10m EPSG:32648 10 m nearest",
            CODES="0 within allowance; 1 caution; 255 not tested",
            CLASS_RASTER="unchanged; flag does not rewrite class codes",
        )
    sha = hashlib.sha256(OUT_TIF.read_bytes()).hexdigest()
    print("wrote", OUT_TIF, "sha256", sha[:16], flush=True)

    counts = {name: c for name, c in rows}
    with OUT_CSV.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["metric", "pixels", "ha"])
        w.writeheader()
        for name, c in rows:
            w.writerow({"metric": name, "pixels": c, "ha": f"{ha(c):.2f}"})
            print(f"  {name}: {ha(c):.2f} ha", flush=True)

    # Example sites on the screen grid (diagnostic, not a sample design).
    to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32648", always_xy=True)
    site_lines = []
    for label, lon, lat in SITES:
        x, y = to_utm.transform(lon, lat)
        row, col = rasterio.transform.rowcol(transform, x, y)
        if not (0 <= row < height and 0 <= col < width):
            site_lines.append(f"| {label} | {lon:.2f} | {lat:.2f} | outside grid | | | |")
            continue
        ev = float(elev_m[row, col]) if elev_ok[row, col] else float("nan")
        hv = float(hat[row, col]) if hat_ok[row, col] else float("nan")
        code = int(flag[row, col])
        code_s = {0: "within allowance", 1: "caution", 255: "not tested"}[code]
        if np.isfinite(ev) and np.isfinite(hv):
            site_lines.append(
                f"| {label} | {lon:.2f} | {lat:.2f} | {ev:.2f} | {hv:.2f} | {ev - hv:.2f} | {code_s} |"
            )
        else:
            site_lines.append(
                f"| {label} | {lon:.2f} | {lat:.2f} | "
                f"{'n/a' if not np.isfinite(ev) else f'{ev:.2f}'} | "
                f"{'n/a' if not np.isfinite(hv) else f'{hv:.2f}'} | n/a | {code_s} |"
            )

    # Downsampled map. Row 0 is north.
    step = 20
    small = flag[::step, ::step]
    show = np.ma.masked_equal(small, FLAG_NODATA)
    left, bottom, right, top = array_bounds(height, width, transform)
    extent = [left / 1000.0, right / 1000.0, bottom / 1000.0, top / 1000.0]
    fig, ax = plt.subplots(figsize=(8.2, 6.8), dpi=140)
    cmap = ListedColormap(["#6DB347", "#1A3560"])
    cmap.set_bad("#D9D9D9")
    im = ax.imshow(
        show,
        origin="upper",
        extent=extent,
        cmap=cmap,
        vmin=0,
        vmax=1,
        interpolation="nearest",
        aspect="equal",
    )
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.02, ticks=[0.25, 0.75])
    cbar.ax.set_yticklabels(["within allowance", "caution"])
    ax.set_facecolor("#D9D9D9")
    ax.set_xlabel("Easting (km, EPSG:32648)")
    ax.set_ylabel("Northing (km, EPSG:32648)")
    ax.set_title("Elevation-check flag, 10 m screen grid (shown at 200 m)")
    fig.tight_layout()
    fig.subplots_adjust(bottom=0.16)
    fig.text(
        0.5,
        0.02,
        "Grey: not tested. Caution where DeltaDTM exceeds the HAT amplitude-sum proxy by more than 0.74 m. Not chart-datum HAT.",
        ha="center",
        fontsize=7,
        color="#333333",
    )
    fig.savefig(OUT_PNG, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    c6_total = ha(counts["class6_go_total"])
    c6_flag = ha(counts["class6_flagged_caution"])
    c6_ok = ha(counts["class6_within_allowance"])
    c6_na = ha(counts["class6_not_tested"])
    c6_sens = ha(counts["class6_flagged_if_E_0.43m"])
    md = [
        "# L12 vs L13 elevation-check flag",
        "",
        "**Status.** Note 3b elevation check on the 10 m screen grid. The first-pass class raster is unchanged. Where class 6 (GO: inactive pond) carries flag 1, read go as caution. No new class code.",
        "",
        "## Rule",
        "",
        "Flag a tested cell where `elev_m > hat_proxy_m + E_L12`.",
        "",
        f"- `E_L12` = **{E_L12:.2f} m**. Pronk et al. 2024, *Scientific Data* 11:273, Table 6 overall RMSE of DeltaDTM against airborne lidar (bias 0.01 m, MAE 0.45 m, RMSE 0.74 m). The same paper treats that RMSE as the vertical uncertainty for sea-level increments. DOI: [10.1038/s41597-024-03091-9](https://doi.org/10.1038/s41597-024-03091-9).",
        "- Staged L12 is **DeltaDTM v1.1** (int16 decimetres, nodata -32768, divided by 10). The 4TU v1.1 record (12 Dec 2024) quotes an overall MAE of 0.43 m and does not republish an RMSE, so 0.74 m is applied to v1.1 as a documented assumption. Mangrove rows in Table 6 are bias 0.17 m, MAE 0.48 m, RMSE 0.73 m.",
        f"- Sensitivity, not a second flag: class 6 hectares that would be caution if `E_L12` were the v1.1 MAE of {E_MAE:.2f} m are reported below.",
        "- L13 is the FES2022 amplitude-sum proxy in metres (sum of 34 constituent amplitudes, phases ignored). It is an MSL-relative screening ceiling, higher than a nodal predicted HAT, and it is not a chart-datum HAT.",
        "- DeltaDTM is on EGM2008, which Pronk et al. treat as mean sea level. FES2022 amplitudes are relative to the tide model's mean sea level. The comparison is MSL elevation against an MSL-relative ceiling.",
        "- Exact 0.00 m in `hat_amplitude_sum_proxy_kh.tif` is the NaN fill from `process_l13_hat_examples_map.py` (no constituent amplitude). Those cells are not tested. L12 nodata is not tested.",
        "- Both layers are warped with nearest neighbour onto `L_ponds_10m` (EPSG:32648, 10 m), the grid used by `class_firstpass.tif`. That matches the Phase 0 freeze (10 m, nearest neighbour).",
        "",
        "Flag codes: 0 within allowance, 1 caution, 255 not tested.",
        "",
        "## Area",
        "",
        "| Metric | ha |",
        "| --- | ---: |",
        f"| Tested (valid L12 and HAT proxy > 0) | {ha(counts['tested']):.2f} |",
        f"| Caution (flag 1) | {ha(counts['flagged_caution']):.2f} |",
        f"| Within allowance (flag 0) | {ha(counts['within_allowance']):.2f} |",
        f"| Not tested | {ha(counts['not_tested']):.2f} |",
        f"| Of which L12 present but HAT fill 0 | {ha(counts['not_tested_hat_fill_zero']):.2f} |",
        f"| Of which no L12 elevation | {ha(counts['not_tested_no_elev']):.2f} |",
        f"| Tested inside the pond AOI | {ha(counts['tested_on_aoi']):.2f} |",
        f"| Caution inside the pond AOI | {ha(counts['flagged_on_aoi']):.2f} |",
        f"| Within allowance inside the pond AOI | {ha(counts['within_allowance_on_aoi']):.2f} |",
        "",
        "## Class 6 GO (inactive pond)",
        "",
        "First-pass class 6 only. Classes 1, 2, 4 and 8 are not on this raster yet, so this is not the full go area.",
        "",
        "| Metric | ha |",
        "| --- | ---: |",
        f"| Class 6 total | {c6_total:.2f} |",
        f"| Class 6 caution (flag 1, E = {E_L12:.2f} m) | {c6_flag:.2f} |",
        f"| Class 6 within allowance | {c6_ok:.2f} |",
        f"| Class 6 not tested | {c6_na:.2f} |",
        f"| Class 6 not tested, no L12 elevation | {ha(counts['class6_not_tested_no_elev']):.2f} |",
        f"| Class 6 not tested, L12 present but HAT fill 0 | {ha(counts['class6_not_tested_hat_fill_zero']):.2f} |",
        f"| Class 6 that would be caution at E = {E_MAE:.2f} m | {c6_sens:.2f} |",
        "",
        "Not tested is not a pass. DeltaDTM stores nodata over oceans, lakes and rivers (Pronk et al. 2024), so a pond pixel on that water mask has no elevation to compare. Those cells stay class 6 until a terrain elevation exists.",
        "",
        "On tested class 6 cells, percentiles (p10 / p50 / p90):",
        "",
        f"- DeltaDTM elevation (m): {p_elev[0]:.2f} / {p_elev[1]:.2f} / {p_elev[2]:.2f}",
        f"- HAT proxy (m): {p_hat[0]:.2f} / {p_hat[1]:.2f} / {p_hat[2]:.2f}",
        f"- Elevation minus HAT proxy (m): {p_mar[0]:.2f} / {p_mar[1]:.2f} / {p_mar[2]:.2f}",
        "",
        f"Caution on class 6 requires elevation minus HAT proxy greater than {E_L12:.2f} m.",
        "",
        "## Example sites",
        "",
        "Same points as the L13 HAT note. One 10 m cell each, nearest source pixel. Diagnostic only.",
        "",
        "| Site | Lon | Lat | Elev (m) | HAT proxy (m) | Elev − HAT (m) | Flag |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
        *site_lines,
        "",
        "## Figure",
        "",
        "![Elevation-check flag](elevation_check_flag.png)",
        "",
        "## Files",
        "",
        f"- `{OUT_TIF.relative_to(ROOT)}`",
        f"- `{OUT_CSV.relative_to(ROOT)}`",
        f"- `{OUT_PNG.relative_to(ROOT)}`",
        f"- sha256 `{sha}`",
        "",
        "Class raster left as-is: `inputs/screen-layers/L_class_10m_firstpass/class_firstpass.tif`.",
        "",
    ]
    # The table header uses a minus sign in "Elev - HAT", not an em dash.
    # Rebuild that header without a unicode minus that could be read as a dash in prose.
    text = "\n".join(md) + "\n"
    text = text.replace("Elev − HAT (m)", "Elev minus HAT (m)")
    OUT_MD.write_text(text)
    print("wrote", OUT_MD, flush=True)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
