#!/usr/bin/env python3
"""Overview and three case-study zooms of Note 3b Step 3 class_step3.tif.

Case studies (contrasting Note 3b outcomes):
  A  GO: open or accreted (class 8) — Peam Krasaop hinterland, Koh Kong
  B  STOP: open water on former existing mangrove (class 2 over first-pass 3)
     — northern Koh Kong coast
  C  CAUTION: tidal flat (class 4) — Preah Sihanouk / Kampot coast

Outputs under inputs/screen-layers/L_class_10m/visualizations/
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import rasterio
from matplotlib.patches import Patch
from pyproj import Transformer
from rasterio.transform import rowcol, xy

ROOT = Path(__file__).resolve().parents[2]
LAYERS = ROOT / "inputs" / "screen-layers"
CLASS = LAYERS / "L_class_10m" / "class_step3.tif"
FIRST = LAYERS / "L_class_10m_firstpass" / "class_firstpass.tif"
OUT = LAYERS / "L_class_10m" / "visualizations"

# CI-adjacent palette for Note 3b classes 1-10 (no emoji; flat colours).
CLASS_COLORS = {
    1: "#7A1F1F",  # STOP built-up
    2: "#1A4F8A",  # STOP open water
    3: "#1F6B3A",  # existing mangrove
    4: "#C4A35A",  # CAUTION tidal flat
    5: "#B35C1E",  # CAUTION other converted
    6: "#6DB347",  # GO inactive pond
    7: "#E0A21B",  # CAUTION active pond
    8: "#0099AA",  # GO open/accreted
    9: "#8B6BB3",  # CAUTION history unproven
    10: "#D9D9D9",  # STOP outside tidal frame
}
CLASS_NAMES = {
    1: "1 STOP built-up",
    2: "2 STOP open water",
    3: "3 Existing mangrove",
    4: "4 CAUTION tidal flat",
    5: "5 CAUTION other converted",
    6: "6 GO inactive pond",
    7: "7 CAUTION active pond",
    8: "8 GO open/accreted",
    9: "9 CAUTION history unproven",
    10: "10 STOP outside tidal frame",
}

CASES = [
    {
        "id": "A",
        "slug": "a-go-open-accreted-koh-kong",
        "title": "GO: open or accreted land",
        "place": "Peam Krasaop hinterland, Koh Kong",
        "lon": 103.5857,
        "lat": 11.1760,
        "half_m": 1500,
        "focus": 8,
        "why": (
            "Historic mangrove (H) that Dynamic World now reads as bare, grass or shrub. "
            "Note 3b class 8 is the open and accreted GO class. It is a candidate for "
            "natural regeneration or planting after an elevation check, not a pond."
        ),
    },
    {
        "id": "B",
        "slug": "b-stop-water-on-mangrove-koh-kong-north",
        "title": "STOP: open water on former existing mangrove",
        "place": "Northern Koh Kong coast",
        "lon": 103.0618,
        "lat": 11.4713,
        "half_m": 1500,
        "focus": 2,
        "why": (
            "First-pass class 3 (existing mangrove, conserve) replaced by class 2 where "
            "Dynamic World is water in at least 90 percent of 2024-2025 observations, "
            "and the cell is neither a Murray tidal flat nor a Step 2 pond. Nationally "
            "this override is 1,144 ha. The site shows where the STOP open-water rule "
            "overrides conserve."
        ),
    },
    {
        "id": "C",
        "slug": "c-caution-tidal-flat-preah-sihanouk",
        "title": "CAUTION: tidal flat",
        "place": "Preah Sihanouk / Kampot coast",
        "lon": 103.8624,
        "lat": 10.6436,
        "half_m": 1500,
        "focus": 4,
        "why": (
            "Murray Global Intertidal Change (2014-2016) marks the cell as tidal flat, "
            "and Dynamic World now reads bare or water. Note 3b class 4 is CAUTION: no "
            "planting on mudflats; natural recruitment only after a hydrology check."
        ),
    },
]


def ha(mask: np.ndarray) -> float:
    return float(mask.sum()) * 0.01


def class_rgba_lut() -> np.ndarray:
    lut = np.ones((256, 4), dtype=float)
    lut[:, :3] = 1.0  # white background for nodata
    lut[255] = (1, 1, 1, 0)
    for code, hexcol in CLASS_COLORS.items():
        r = int(hexcol[1:3], 16) / 255
        g = int(hexcol[3:5], 16) / 255
        b = int(hexcol[5:7], 16) / 255
        lut[code] = (r, g, b, 1.0)
    return lut


def to_rgba(arr: np.ndarray, lut: np.ndarray) -> np.ndarray:
    return lut[arr]


def window_for(lon: float, lat: float, half_m: float, transform, shape, to_xy):
    x, y = to_xy.transform(lon, lat)
    r, c = rowcol(transform, x, y)
    px = int(half_m / 10.0)
    H, W = shape
    r0 = max(0, r - px)
    r1 = min(H, r + px)
    c0 = max(0, c - px)
    c1 = min(W, c + px)
    return slice(r0, r1), slice(c0, c1), (x, y)


def extent_for(transform, row_slice, col_slice):
    r0, r1 = row_slice.start, row_slice.stop
    c0, c1 = col_slice.start, col_slice.stop
    x0, y0 = xy(transform, r0, c0, offset="ul")
    x1, y1 = xy(transform, r1, c1, offset="ul")
    return [x0, x1, y1, y0]


def legend_handles(codes=None):
    codes = codes or list(range(1, 11))
    return [
        Patch(facecolor=CLASS_COLORS[c], edgecolor="#333333", linewidth=0.4, label=CLASS_NAMES[c])
        for c in codes
    ]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with rasterio.open(CLASS) as ds:
        cls = ds.read(1)
        transform = ds.transform
        crs = ds.crs
    with rasterio.open(FIRST) as ds:
        prev = ds.read(1)

    to_xy = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
    to_ll = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)
    lut = class_rgba_lut()

    # Downsample overview for plotting (every 8th pixel ≈ 80 m).
    step = 8
    overview = cls[::step, ::step]
    rgba = to_rgba(overview, lut)
    H, W = cls.shape
    x0, y0 = xy(transform, 0, 0, offset="ul")
    x1, y1 = xy(transform, H, W, offset="ul")
    # Convert corners to lon/lat for a readable overview.
    west, north = to_ll.transform(x0, y0)
    east, south = to_ll.transform(x1, y1)

    fig, ax = plt.subplots(figsize=(9.2, 7.2), dpi=150)
    ax.imshow(
        rgba,
        origin="upper",
        extent=[west, east, south, north],
        interpolation="nearest",
        aspect="equal",
    )
    for case in CASES:
        ax.plot(
            case["lon"],
            case["lat"],
            marker="o",
            markersize=7,
            markerfacecolor="white",
            markeredgecolor="#111111",
            markeredgewidth=1.2,
            zorder=5,
        )
        ax.text(
            case["lon"] + 0.04,
            case["lat"] + 0.04,
            case["id"],
            fontsize=9,
            fontweight="bold",
            color="#111111",
            bbox=dict(boxstyle="round,pad=0.15", facecolor="white", edgecolor="#111111", linewidth=0.6),
            zorder=6,
        )
    ax.set_xlabel("Longitude (E)")
    ax.set_ylabel("Latitude (N)")
    ax.set_title("Cambodia coastal screen — Note 3b Step 3 classes (10 m, pond grid)")
    ax.legend(
        handles=legend_handles(),
        loc="lower left",
        fontsize=6.5,
        framealpha=0.92,
        ncol=2,
        title="Class",
        title_fontsize=7,
    )
    ax.text(
        0.01,
        0.01,
        "Source: class_step3.tif · L8–L11 on Y1/Y2 2024–2025 · Downsampled for display",
        transform=ax.transAxes,
        fontsize=6.5,
        color="#333333",
        va="bottom",
    )
    overview_path = OUT / "step3_overview.png"
    fig.tight_layout()
    fig.savefig(overview_path, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"wrote {overview_path}", flush=True)

    case_stats = []
    for case in CASES:
        rs, cs, (cx, cy) = window_for(
            case["lon"], case["lat"], case["half_m"], transform, cls.shape, to_xy
        )
        win = cls[rs, cs]
        win_prev = prev[rs, cs]
        # Local UTM extent, then lon/lat for labels.
        x_ul, y_ul = xy(transform, rs.start, cs.start, offset="ul")
        x_lr, y_lr = xy(transform, rs.stop, cs.stop, offset="ul")
        lon0, lat1 = to_ll.transform(x_ul, y_ul)
        lon1, lat0 = to_ll.transform(x_lr, y_lr)

        counts = {c: ha(win == c) for c in range(1, 11)}
        override_ha = ha((win_prev == 3) & (win == 2))
        focus_ha = counts.get(case["focus"], 0.0)

        fig, ax = plt.subplots(figsize=(7.2, 6.4), dpi=150)
        ax.imshow(
            to_rgba(win, lut),
            origin="upper",
            extent=[lon0, lon1, lat0, lat1],
            interpolation="nearest",
            aspect="equal",
        )
        ax.plot(
            case["lon"],
            case["lat"],
            marker="+",
            markersize=12,
            markeredgewidth=1.6,
            color="#111111",
        )
        # Focus outline: cells of the focus class as a light hatch via alpha overlay is heavy;
        # instead mark the case centre and report ha in the caption.
        ax.set_title(f"Case {case['id']} — {case['title']}\n{case['place']}")
        ax.set_xlabel("Longitude (E)")
        ax.set_ylabel("Latitude (N)")
        present = [c for c in range(1, 11) if counts[c] >= 0.5]
        ax.legend(
            handles=legend_handles(present),
            loc="upper right",
            fontsize=6.5,
            framealpha=0.92,
            title="Classes ≥0.5 ha in window",
            title_fontsize=7,
        )
        note = f"Focus class {case['focus']}: {focus_ha:.1f} ha in {case['half_m']*2/1000:.1f} km window"
        if case["id"] == "B":
            note += f" · class 2 on first-pass 3: {override_ha:.1f} ha"
        ax.text(
            0.01,
            0.01,
            note,
            transform=ax.transAxes,
            fontsize=7,
            color="#111111",
            va="bottom",
            bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor="#888888", linewidth=0.4),
        )
        path = OUT / f"case_{case['slug']}.png"
        fig.tight_layout()
        fig.savefig(path, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        print(f"wrote {path}", flush=True)

        case_stats.append(
            {
                **case,
                "focus_ha": round(focus_ha, 2),
                "override_3_to_2_ha": round(override_ha, 2),
                "window_ha_by_class": {str(k): round(v, 2) for k, v in counts.items() if v > 0},
                "map": path.name,
            }
        )

    # Combined strip figure (overview-free) for a single glance.
    fig, axes = plt.subplots(1, 3, figsize=(12.5, 4.4), dpi=140)
    for ax, case, stats in zip(axes, CASES, case_stats):
        rs, cs, _ = window_for(
            case["lon"], case["lat"], case["half_m"], transform, cls.shape, to_xy
        )
        win = cls[rs, cs]
        x_ul, y_ul = xy(transform, rs.start, cs.start, offset="ul")
        x_lr, y_lr = xy(transform, rs.stop, cs.stop, offset="ul")
        lon0, lat1 = to_ll.transform(x_ul, y_ul)
        lon1, lat0 = to_ll.transform(x_lr, y_lr)
        ax.imshow(
            to_rgba(win, lut),
            origin="upper",
            extent=[lon0, lon1, lat0, lat1],
            interpolation="nearest",
            aspect="equal",
        )
        ax.plot(case["lon"], case["lat"], marker="+", color="#111111", markersize=10, markeredgewidth=1.4)
        ax.set_title(f"{case['id']}: {case['title']}", fontsize=8)
        ax.tick_params(labelsize=6)
        ax.set_xlabel("Lon E", fontsize=7)
        if ax is axes[0]:
            ax.set_ylabel("Lat N", fontsize=7)
    fig.suptitle("Three Step 3 case studies (3 km windows)", fontsize=10, y=1.02)
    strip = OUT / "step3_three_cases.png"
    fig.tight_layout()
    fig.savefig(strip, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"wrote {strip}", flush=True)

    # Narrative lives in docs/03-restoration-screen.md (product user guide).
    md_lines = [
        "# Step 3 class maps and three case studies (figures)",
        "",
        "**Narrative and rationale (user guide):** "
        "[docs/03-restoration-screen.md](../../../../docs/03-restoration-screen.md) "
        "— sections *How to read the map* and *Worked examples*.",
        "",
        "This file keeps the hectare tables and figure files next to the PNGs. "
        "Grid: `class_step3.tif` (EPSG:32648, 10 m). Y1/Y2 = 2024 and 2025.",
        "",
        "## National overview",
        "",
        "![Step 3 overview](step3_overview.png)",
        "",
        "Sites A–C are marked. Class 10 (outside the tidal frame) fills most of the province",
        "rectangle and is light grey so coastal classes stay readable.",
        "",
        "## Three case studies",
        "",
        "![Three cases](step3_three_cases.png)",
        "",
    ]
    for case, stats in zip(CASES, case_stats):
        md_lines += [
            f"### Case {case['id']} — {case['title']}",
            "",
            f"**Place.** {case['place']} ({case['lon']:.4f} E, {case['lat']:.4f} N).",
            f"**Focus.** Class {case['focus']}: {stats['focus_ha']:.1f} ha inside a "
            f"{case['half_m']*2/1000:.1f} km window.",
        ]
        if case["id"] == "B":
            md_lines.append(
                f"First-pass class 3 reassigned to class 2: "
                f"{stats['override_3_to_2_ha']:.1f} ha in this window "
                f"(1,144 ha nationally)."
            )
        md_lines += [
            "",
            f"![Case {case['id']}]({stats['map']})",
            "",
            "| Class | ha |",
            "| ---: | ---: |",
        ]
        for code in range(1, 11):
            val = stats["window_ha_by_class"].get(str(code), 0)
            if val:
                md_lines.append(f"| {code} | {val:.2f} |")
        md_lines.append("")

    md_lines += [
        "## QA cross-links",
        "",
        "- National class ha and first-pass overrides: [../class_step3_qa.md](../class_step3_qa.md)",
        "- Map script: "
        "[../../../../intermediate/screen-build/process_step3_case_study_maps.py]"
        "(../../../../intermediate/screen-build/process_step3_case_study_maps.py)",
        "",
    ]
    md_path = OUT / "step3-case-studies.md"
    md_path.write_text("\n".join(md_lines))
    (OUT / "step3-case-studies.json").write_text(json.dumps(case_stats, indent=2) + "\n")
    print(f"wrote {md_path}", flush=True)


if __name__ == "__main__":
    main()
