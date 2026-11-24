#!/usr/bin/env python3
"""Build Locate mangrove loss/gain from GMW v4.1.12 multi-year extent differencing.

Method
------
1. Read Global Mangrove Watch v4.1.12 annual extent vectors for Cambodia (KHM)
   for BASE_YEAR (1996) and END_YEAR (2025) from the Source Cooperative mirror of
   Zenodo 21346457 (CC BY 4.0).
2. Union each year, clip to L20 coastal four provinces.
3. Loss  = BASE − END  (mangrove in 1996, absent in 2025).
4. Gain  = END − BASE  (absent in 1996, mangrove in 2025).
5. MMU 0.5 ha, ~100 m simplify for MapLibre. Writes public/change-stubs/
   mangrove-change.geojson (loss, primary) and mangrove-gain.geojson (optional).
6. Optionally copies loss into delivery/open-cleared/v0.3.0/layers/ and refreshes
   public/change-stubs/index.json metadata.

Does not touch FLAG / INTERNAL rasters. Goldberg L4 loss-driver stub is demoted:
this script replaces mangrove-change.geojson content.
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path

import duckdb
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "change-stubs"
L20 = ROOT / "inputs/screen-layers/L20/coastal-four-provinces.geojson"
OPEN_CLEARED = ROOT / "delivery/open-cleared/v0.3.0/layers"

BASE_YEAR = 1996
END_YEAR = 2025
MMU_HA = 0.5
SIMPLIFY_DEG = 0.0009  # ~100 m at 11.5 N
PARQUET_TMPL = (
    "https://data.source.coop/portolan-mirrors/global-mangrove-watch/"
    "annual-extent/extent-vector/year={year}/extent-{year}.parquet"
)


def approx_ha(g84) -> float:
    cy = g84.centroid.y
    return float(g84.area * (111_320**2) * math.cos(math.radians(cy)) / 10_000)


def load_coast():
    with L20.open() as f:
        fc = json.load(f)
    return unary_union([shape(feat["geometry"]) for feat in fc["features"]])


def load_year_union(con: duckdb.DuckDBPyConnection, year: int, coast):
    url = PARQUET_TMPL.format(year=year)
    t0 = time.time()
    rows = con.execute(
        f"""
        SELECT ST_AsGeoJSON(geom) AS g
        FROM read_parquet('{url}')
        WHERE cntry_iso3 = 'KHM'
        """
    ).fetchall()
    geoms = []
    for (gjson,) in rows:
        g = shape(json.loads(gjson))
        if not g.is_valid:
            g = g.buffer(0)
        if not g.is_empty:
            geoms.append(g)
    print(f"{year}: loaded {len(geoms)} polys in {time.time() - t0:.1f}s")
    u = unary_union(geoms).intersection(coast)
    if not u.is_valid:
        u = u.buffer(0)
    print(f"{year}: coastal clip area_deg2={u.area:.6f} ha≈{approx_ha(u):.0f}")
    return u


def explode_filter(diff, class_label: str, id_prefix: str) -> list[dict]:
    if diff.is_empty:
        return []
    parts = []
    if diff.geom_type == "Polygon":
        parts = [diff]
    elif diff.geom_type == "MultiPolygon":
        parts = list(diff.geoms)
    else:
        parts = [g for g in getattr(diff, "geoms", []) if g.geom_type in ("Polygon", "MultiPolygon")]
        flat = []
        for g in parts:
            if g.geom_type == "Polygon":
                flat.append(g)
            else:
                flat.extend(list(g.geoms))
        parts = flat

    kept: list[tuple[object, float]] = []
    for p in parts:
        if not p.is_valid:
            p = p.buffer(0)
        a = approx_ha(p)
        if a < MMU_HA:
            continue
        s = p.simplify(SIMPLIFY_DEG, preserve_topology=True)
        if s.is_empty:
            continue
        if not s.is_valid:
            s = s.buffer(0)
        kept.append((s, approx_ha(s)))
    kept.sort(key=lambda r: -r[1])

    features = []
    for i, (g84, area_ha) in enumerate(kept):
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"{id_prefix}-{i + 1:04d}",
                    "class_label": class_label,
                    "change_kind": "loss" if "loss" in class_label else "gain",
                    "base_year": BASE_YEAR,
                    "end_year": END_YEAR,
                    "area_ha_approx": round(area_ha, 2),
                    "register_id": "L1",
                    "stub": False,
                    "open_cleared": True,
                    "note": (
                        f"GMW v4.1.12 extent differencing ({BASE_YEAR}→{END_YEAR}): "
                        f"{'present in baseline, absent in end year' if 'loss' in class_label else 'absent in baseline, present in end year'}. "
                        "CC BY 4.0. Coastal clip; not a driver attribution."
                    ),
                },
                "geometry": mapping(g84),
            }
        )
    return features


def write_fc(path: Path, features: list[dict], name: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fc = {
        "type": "FeatureCollection",
        "name": name,
        "features": features,
    }
    path.write_text(json.dumps(fc, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({len(features)} features, {path.stat().st_size / 1e6:.2f} MB)")


def update_index(loss_n: int, gain_n: int) -> None:
    index_path = OUT / "index.json"
    index = {
        "version": "change-stubs-v1.3",
        "built_for": "#change Locate screen — current state (extent / condition / change)",
        "licence": (
            "CC BY 4.0 upstream (GMW v4.1.12 1996→2025 extent differencing; "
            "GMW 2025 extent stock; Dynamic World built modal). Non-commercial / research P2."
        ),
        "public_ready": True,
        "not_in_open_cleared_pin": True,
        "resolution_plain": (
            "Extent is GMW 2025 stock (~30 m native, ~100 m after simplify). "
            f"Loss/gain are GMW v4.1.12 {BASE_YEAR}→{END_YEAR} extent differencing "
            "(~30 m native, ~100 m after simplify) — finer than the old Goldberg coastal sample. "
            "Built sample remains generalised (~200 m). Overlays fade past about zoom 11.5."
        ),
        "state_gaps": [
            {
                "facet": "extent",
                "status": "sample",
                "plain": (
                    "GMW 2025 mangrove extent ships as a coastal stock layer on Locate (open CC BY). "
                    "Annual time slider remains a data need."
                ),
            },
            {
                "facet": "condition",
                "status": "missing",
                "plain": (
                    "No mangrove condition, health, canopy, or degradation score ships on this console. "
                    "Note 3b: degradation not mapped (no canopy layer cleared for public)."
                ),
            },
            {
                "facet": "change",
                "status": "sample",
                "plain": (
                    f"GMW {BASE_YEAR}→{END_YEAR} loss (and optional gain) from annual extent differencing, "
                    "plus a built-up proxy. Not an annual time slider or multi-epoch urban expansion series. "
                    "Goldberg 2000–2016 loss-driver polygons are demoted (not on Locate)."
                ),
            },
        ],
        "layers": [
            {
                "id": "mangrove-extent",
                "file": "mangrove-extent.geojson",
                "title": "Mangrove extent 2025 (stock)",
                "register_id": "L1",
                "feature_count": 1899,
                "stub": False,
                "state_role": "extent",
                "native_resolution_m": 30,
                "display_resolution_m": 100,
                "resolution_plain": (
                    "GMW v4.1.12 2025 extent, coastal four-province clip, simplified for Locate "
                    "(~100 m display). Living stock — not a condition score."
                ),
                "note": (
                    "Global Mangrove Watch annual extent 2025 (CC BY 4.0). Clipped to L20 coastal "
                    "provinces; MMU 0.5 ha. Fills the Locate extent / stock facet."
                ),
            },
            {
                "id": "mangrove-change",
                "file": "mangrove-change.geojson",
                "title": f"Mangrove loss {BASE_YEAR}–{END_YEAR} (GMW)",
                "register_id": "L1",
                "feature_count": loss_n,
                "stub": False,
                "state_role": "change",
                "native_resolution_m": 30,
                "display_resolution_m": 100,
                "resolution_plain": (
                    f"GMW v4.1.12 extent differencing ({BASE_YEAR} minus {END_YEAR}), coastal clip, "
                    "MMU 0.5 ha, ~100 m simplify. Replaces the coarser Goldberg loss-driver stub."
                ),
                "note": (
                    f"Loss = mangrove in GMW {BASE_YEAR} extent and absent in {END_YEAR}. "
                    "Same product family as the 2025 stock layer (CC BY 4.0). Not a driver map."
                ),
            },
            {
                "id": "mangrove-gain",
                "file": "mangrove-gain.geojson",
                "title": f"Mangrove gain {BASE_YEAR}–{END_YEAR} (GMW)",
                "register_id": "L1",
                "feature_count": gain_n,
                "stub": False,
                "state_role": "change",
                "native_resolution_m": 30,
                "display_resolution_m": 100,
                "resolution_plain": (
                    f"GMW v4.1.12 extent differencing ({END_YEAR} minus {BASE_YEAR}), coastal clip, "
                    "MMU 0.5 ha, ~100 m simplify. Optional — default off on Locate."
                ),
                "note": (
                    f"Gain = mangrove in GMW {END_YEAR} extent and absent in {BASE_YEAR}. "
                    "Includes recovery and mapping refinement; treat as context, not a restoration score."
                ),
            },
            {
                "id": "urban-change",
                "file": "urban-change.geojson",
                "title": "Built-up / urban change",
                "register_id": "L10",
                "feature_count": 180,
                "stub": False,
                "state_role": "change",
                "native_resolution_m": 10,
                "display_resolution_m": 200,
                "resolution_plain": (
                    "Dynamic World built modal, coastal sample, simplified for the public stub "
                    "(~200 m display). Pressure context only."
                ),
                "note": (
                    "Open coastal sample of Dynamic World modal built (class 6). "
                    "GHS-BUILT multi-epoch remains a data need."
                ),
            },
        ],
        "data_needs": [
            "Mangrove condition / degradation / canopy product — Locate condition facet (licence-clear)",
            "GMW annual time slider (all epochs) on Locate — currently single-interval 1996→2025",
            "Goldberg ORNL DAAC loss-driver attribution (demoted; rebuild via build_change_stubs.py if needed)",
            "GHS-BUILT multi-epoch urban expansion polygons",
            "Converted / pond CAUTION classes 6–7 stay FLAG/HOLD until licence clears",
        ],
    }
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {index_path.relative_to(ROOT)}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    coast = load_coast()
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial;")
    base = load_year_union(con, BASE_YEAR, coast)
    end = load_year_union(con, END_YEAR, coast)

    t0 = time.time()
    loss = base.difference(end)
    gain = end.difference(base)
    print(f"difference done in {time.time() - t0:.1f}s")

    loss_features = explode_filter(loss, "gmw_loss_1996_2025", "gmw-loss")
    gain_features = explode_filter(gain, "gmw_gain_1996_2025", "gmw-gain")
    print(
        f"loss features={len(loss_features)} ha≈{sum(f['properties']['area_ha_approx'] for f in loss_features):.0f}"
    )
    print(
        f"gain features={len(gain_features)} ha≈{sum(f['properties']['area_ha_approx'] for f in gain_features):.0f}"
    )

    write_fc(OUT / "mangrove-change.geojson", loss_features, "mangrove-loss-gmw-1996-2025")
    write_fc(OUT / "mangrove-gain.geojson", gain_features, "mangrove-gain-gmw-1996-2025")
    update_index(len(loss_features), len(gain_features))

    # Mirror loss into open-cleared pack as context overlay (same geometry as Locate).
    OPEN_CLEARED.mkdir(parents=True, exist_ok=True)
    write_fc(
        OPEN_CLEARED / "mangrove-change.geojson",
        loss_features,
        "mangrove-loss-gmw-1996-2025",
    )
    print("done")


if __name__ == "__main__":
    main()
