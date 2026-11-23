#!/usr/bin/env python3
"""Process staged FES2022 extrapolated heights into HAT examples + coastal map (L13).

Raw product only until this step: harmonic amplitude/phase NetCDFs under
inputs/screen-layers/L13/pytmd/fes2022b/ocean_tide_extrapolated/.

Outputs (under L13/):
  hat_amplitude_sum_proxy_kh.tif   — sum of 34 constituent amplitudes (m), KH box
  visualizations/hat_proxy_map.png
  visualizations/examples_timeseries.png
  visualizations/l13-hat-examples.md

HAT note: amplitude-sum is a conservative screening proxy (phases ignored), not a
chart-datum HAT from an 18.6-year prediction. Also reports 2*(M2+S2) spring range.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import matplotlib.pyplot as plt
import netCDF4 as nc
import numpy as np
import rasterio
from rasterio.transform import from_origin

ROOT = Path(__file__).resolve().parents[2]
L13 = ROOT / "inputs" / "screen-layers" / "L13"
MODEL = L13 / "pytmd" / "fes2022b" / "ocean_tide_extrapolated"
VIZ = L13 / "visualizations"
OUT_TIF = L13 / "hat_amplitude_sum_proxy_kh.tif"

# Note 3b / Phase 0 coastal box
WEST, EAST, SOUTH, NORTH = 102.5, 105.2, 9.8, 12.3

SITES = [
    ("Koh Kong coast (Peam Krasop area)", 103.05, 11.45),
    ("Sihanoukville Bay", 103.55, 10.62),
    ("Kep", 104.32, 10.48),
    ("Koh Rong approaches", 103.30, 10.70),
    ("Kampot coast", 104.18, 10.60),
]

MAJOR = ("m2", "s2", "k1", "o1", "n2", "p1", "k2", "q1")
# Mean periods (hours) for a short illustrative reconstruction (not nodal-corrected).
PERIOD_H = {
    "m2": 12.4206012,
    "s2": 12.0,
    "n2": 12.6583482,
    "k2": 11.9672348,
    "k1": 23.9344697,
    "o1": 25.8193416,
    "p1": 24.0658902,
    "q1": 26.8683567,
}


def constituent_paths() -> list[Path]:
    return sorted(
        p for p in MODEL.glob("*_fes2022.nc") if p.name != "mask_fes2022B.nc"
    )


def lon_to_index(lon_1d: np.ndarray, lon: float) -> int:
    # FES lon is 0–360
    x = lon % 360.0
    return int(np.argmin(np.abs(lon_1d - x)))


def lat_to_index(lat_1d: np.ndarray, lat: float) -> int:
    return int(np.argmin(np.abs(lat_1d - lat)))


def crop_indices(lon: np.ndarray, lat: np.ndarray) -> tuple[int, int, int, int]:
    i0 = lon_to_index(lon, WEST)
    i1 = lon_to_index(lon, EAST)
    j0 = lat_to_index(lat, SOUTH)
    j1 = lat_to_index(lat, NORTH)
    if i0 > i1:
        i0, i1 = i1, i0
    if j0 > j1:
        j0, j1 = j1, j0
    return j0, j1, i0, i1


def read_amp_phase_point(path: Path, j: int, i: int) -> tuple[float, float]:
    """Amplitude (m) and phase (degrees) at one grid cell."""
    with nc.Dataset(path) as ds:
        amp_m = float(np.ma.filled(ds.variables["amplitude"][j, i], np.nan)) / 100.0
        phase = float(np.ma.filled(ds.variables["phase"][j, i], np.nan))
    return amp_m, phase


def read_amp_subset(path: Path, j0: int, j1: int, i0: int, i1: int) -> np.ndarray:
    """Return amplitude (metres) for KH hyperslab only."""
    with nc.Dataset(path) as ds:
        amp_cm = np.ma.filled(
            ds.variables["amplitude"][j0 : j1 + 1, i0 : i1 + 1], np.nan
        ).astype(np.float64)
    return amp_cm / 100.0  # cm → m


def reconstruct_series(constituents: dict[str, tuple[float, float]], hours: np.ndarray) -> np.ndarray:
    """eta(t) = sum A cos(2π t/T − φ). Phase from FES in degrees."""
    elev = np.zeros_like(hours, dtype=np.float64)
    for name, (amp_m, phase_deg) in constituents.items():
        if name not in PERIOD_H or not np.isfinite(amp_m) or not np.isfinite(phase_deg):
            continue
        omega = 2.0 * np.pi / PERIOD_H[name]
        elev += amp_m * np.cos(omega * hours - np.deg2rad(phase_deg))
    return elev


def main() -> None:
    VIZ.mkdir(parents=True, exist_ok=True)
    paths = constituent_paths()
    assert len(paths) == 34, f"expected 34 constituents, got {len(paths)}"

    with nc.Dataset(paths[0]) as ds0:
        lon = ds0.variables["lon"][:].astype(np.float64)
        lat = ds0.variables["lat"][:].astype(np.float64)

    j0, j1, i0, i1 = crop_indices(lon, lat)
    lon_sub = lon[i0 : i1 + 1]
    lat_sub = lat[j0 : j1 + 1]

    # Build amplitude-sum proxy + stash major constituents
    hat = None
    majors: dict[str, np.ndarray] = {}
    for p in paths:
        name = p.name.replace("_fes2022.nc", "").lower()
        sub = read_amp_subset(p, j0, j1, i0, i1)
        if hat is None:
            hat = np.zeros_like(sub, dtype=np.float64)
        hat += np.nan_to_num(sub, nan=0.0)
        if name in MAJOR:
            majors[name] = sub

    assert hat is not None
    # FES lat is typically north-to-south or south-to-north — check
    if lat_sub[0] > lat_sub[-1]:
        hat = hat[::-1, :]
        majors = {k: v[::-1, :] for k, v in majors.items()}
        lat_sub = lat_sub[::-1]

    res_x = float(np.mean(np.diff(lon_sub)))
    res_y = float(np.mean(np.diff(lat_sub)))
    transform = from_origin(float(lon_sub[0] - res_x / 2), float(lat_sub[-1] + res_y / 2), res_x, res_y)

    # Write GeoTIFF (metres)
    meta = dict(
        driver="GTiff",
        height=hat.shape[0],
        width=hat.shape[1],
        count=1,
        dtype="float32",
        crs="EPSG:4326",
        transform=transform,
        compress="deflate",
        predictor=2,
        nodata=-9999.0,
    )
    hat_f = hat.astype(np.float32)
    with rasterio.open(OUT_TIF, "w", **meta) as dst:
        dst.write(hat_f, 1)
        dst.update_tags(
            PRODUCT="FES2022_extrapolated amplitude-sum HAT proxy",
            UNITS="metres (sum of harmonic amplitudes; conservative screening proxy)",
            MODEL="FES2022_extrapolated",
            BBOX=f"W{WEST}-E{EAST}, S{SOUTH}-N{NORTH}",
            NOTE="Not chart-datum HAT; phases ignored. DOI 10.24400/527896/A01-2024.004",
            STAGED="23 Nov 2026 ywdp.8.1.4",
        )
    print("wrote", OUT_TIF, "sha256", hashlib.sha256(OUT_TIF.read_bytes()).hexdigest()[:16])

    # Site examples
    rows = []
    for label, slon, slat in SITES:
        ii = int(np.argmin(np.abs(lon_sub - (slon % 360))))
        jj = int(np.argmin(np.abs(lat_sub - slat)))
        m2 = float(majors["m2"][jj, ii])
        s2 = float(majors["s2"][jj, ii])
        k1 = float(majors["k1"][jj, ii])
        o1 = float(majors["o1"][jj, ii])
        spring = 2.0 * (m2 + s2)
        hat_p = float(hat[jj, ii])
        rows.append(
            dict(
                site=label,
                lon=slon,
                lat=slat,
                m2_m=round(m2, 3),
                s2_m=round(s2, 3),
                k1_m=round(k1, 3),
                o1_m=round(o1, 3),
                spring_range_m=round(spring, 3),
                hat_amp_sum_m=round(hat_p, 3),
            )
        )

    # Time series example at Sihanoukville (7 days) from major constituents only
    # (avoids loading full global grids via pyTMD.compute — OOM on this host).
    t0 = np.datetime64("2026-11-01T00:00:00")
    hours = np.arange(0, 24 * 7, 0.25)  # 15-minute steps
    times = t0 + (hours * 60).astype("timedelta64[m]")
    ji = lat_to_index(lat, 10.62)
    ii = lon_to_index(lon, 103.55)
    major_ap: dict[str, tuple[float, float]] = {}
    for p in paths:
        name = p.name.replace("_fes2022.nc", "").lower()
        if name in PERIOD_H:
            major_ap[name] = read_amp_phase_point(p, ji, ii)
    elev = reconstruct_series(major_ap, hours)

    # Map figure
    fig, ax = plt.subplots(figsize=(8.5, 7), dpi=150)
    extent = [
        float(lon_sub[0] - res_x / 2),
        float(lon_sub[-1] + res_x / 2),
        float(lat_sub[0] - res_y / 2),
        float(lat_sub[-1] + res_y / 2),
    ]
    im = ax.imshow(
        hat_f,
        origin="upper",
        extent=extent,
        cmap="viridis",
        vmin=0,
        vmax=max(0.5, float(np.nanpercentile(hat_f, 98))),
        aspect="auto",
    )
    for r in rows:
        ax.plot(r["lon"], r["lat"], "o", color="white", markersize=6, markeredgecolor="black", markeredgewidth=0.8)
        ax.text(r["lon"] + 0.05, r["lat"] + 0.05, r["site"].split("(")[0].strip(), fontsize=7, color="white")
    ax.set_xlim(WEST, EAST)
    ax.set_ylim(SOUTH, NORTH)
    ax.set_xlabel("Longitude (E)")
    ax.set_ylabel("Latitude (N)")
    ax.set_title("Cambodia coast — FES2022 HAT amplitude-sum proxy (m)")
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.02)
    cbar.set_label("Sum of harmonic amplitudes (m)")
    ax.text(
        0.02,
        0.02,
        "Screening proxy (phases ignored). FES2022 extrapolated. Not for navigation.",
        transform=ax.transAxes,
        fontsize=7,
        color="white",
        va="bottom",
    )
    map_path = VIZ / "hat_proxy_map.png"
    fig.tight_layout()
    fig.savefig(map_path, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    # Time series figure
    fig2, ax2 = plt.subplots(figsize=(9, 3.2), dpi=150)
    ax2.plot(times.astype("datetime64[h]"), elev, color="#0386C5", lw=1.0)
    ax2.axhline(0.0, color="#666666", lw=0.6)
    ax2.set_title("Example tide elevation — Sihanoukville Bay (103.55 E, 10.62 N), 1–7 Nov 2026")
    ax2.set_ylabel("Elevation (m, model)")
    ax2.set_xlabel("UTC")
    ax2.grid(True, alpha=0.3)
    ts_path = VIZ / "examples_timeseries.png"
    fig2.tight_layout()
    fig2.savefig(ts_path, bbox_inches="tight", facecolor="white")
    plt.close(fig2)

    # Markdown
    md = VIZ / "l13-hat-examples.md"
    lines = [
        "# L13 — FES2022 HAT examples and coastal map",
        "",
        "**Status.** Raw FES2022 extrapolated heights were staged only until this step.",
        "This note is the first processed product for the Note 3b elevation-check flag.",
        "",
        "## Method",
        "",
        "- Model: pyTMD `FES2022_extrapolated` (AVISO FES2022b ocean tide, heights only).",
        "- **HAT amplitude-sum proxy:** sum of all 34 constituent amplitudes (metres).",
        "  Conservative screening ceiling (assumes coincident peaks). Not a chart-datum HAT",
        "  from an 18.6-year nodal prediction.",
        "- **Mean spring range proxy:** `2 × (M2 + S2)` amplitudes.",
        "- Box: W 102.5–E 105.2, S 9.8–N 12.3.",
        "- Time series: eight major constituents (M2, S2, N2, K2, K1, O1, P1, Q1) reconstructed",
        "  at Sihanoukville, 1–7 Nov 2026 UTC (illustrative; no nodal corrections).",
        "",
        "## Example sites",
        "",
        "| Site | Lon | Lat | M2 (m) | S2 (m) | K1 (m) | O1 (m) | Spring range 2(M2+S2) (m) | HAT amp-sum proxy (m) |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for r in rows:
        lines.append(
            f"| {r['site']} | {r['lon']:.2f} | {r['lat']:.2f} | {r['m2_m']:.3f} | {r['s2_m']:.3f} | "
            f"{r['k1_m']:.3f} | {r['o1_m']:.3f} | {r['spring_range_m']:.3f} | {r['hat_amp_sum_m']:.3f} |"
        )
    lines += [
        "",
        f"Grid HAT proxy range in box: **{float(np.nanmin(hat)):.2f}–{float(np.nanmax(hat)):.2f} m** "
        f"(median {float(np.nanmedian(hat)):.2f} m).",
        "",
        "## Figures",
        "",
        f"![HAT amplitude-sum proxy map](hat_proxy_map.png)",
        "",
        f"![Sihanoukville 7-day tide](examples_timeseries.png)",
        "",
        "## Files",
        "",
        f"- `{OUT_TIF.relative_to(ROOT)}`",
        f"- `{map_path.relative_to(ROOT)}`",
        f"- `{ts_path.relative_to(ROOT)}`",
        "",
        "## Next for the screen",
        "",
        "Elevation-check flag (23 Nov 2026): `inputs/screen-layers/L13/elevation_check_flag_10m.tif`",
        "and `inputs/screen-layers/L13/visualizations/l13-elevation-check.md` (`E_L12` = 0.74 m).",
        "Optionally replace the amplitude-sum proxy with a true multi-year predicted HAT if CI",
        "wants chart-style values.",
        "",
    ]
    md.write_text("\n".join(lines) + "\n", encoding="utf-8")

    summary = {
        "sites": rows,
        "hat_proxy_min_m": float(np.nanmin(hat)),
        "hat_proxy_max_m": float(np.nanmax(hat)),
        "hat_proxy_median_m": float(np.nanmedian(hat)),
        "timeseries_sihanoukville": {
            "min_m": float(np.nanmin(elev)),
            "max_m": float(np.nanmax(elev)),
            "period": "2026-11-01 to 2026-11-07 UTC",
        },
        "tif": str(OUT_TIF.relative_to(ROOT)),
        "map_png": str(map_path.relative_to(ROOT)),
        "ts_png": str(ts_path.relative_to(ROOT)),
    }
    (VIZ / "l13-hat-examples.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    print("wrote", md)


if __name__ == "__main__":
    main()
