#!/usr/bin/env python3
"""Clip open-cleared GO±CAUTION polygons to Cambodia coastal provinces (L20).

Drops Viet Nam spill southeast of the Kampot / Hà Tiên border (null-province
patches and border-straddling rings). Intersects geometry with the L20 coastal
four-province union, reassigns province, recomputes area_ha in EPSG:32648, and
drops patches below MMU after clip.

Does not flip public_ready. Typical use:

  python3 intermediate/screen-build/clip_go_caution_to_cambodia.py \\
    --source-version v0.2.1 --out-version v0.2.2

Then refresh Phase 2 flags / contract as needed.
"""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
L20 = ROOT / "inputs" / "screen-layers" / "L20" / "coastal-four-provinces.geojson"
DELIVERY = ROOT / "delivery" / "open-cleared"
MMU_HA = 0.5


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_l20_mask():
    import geopandas as gpd

    gdf = gpd.read_file(L20).to_crs("EPSG:4326")
    mask = unary_union(gdf.geometry.values)
    return gdf, mask


def province_for(gdf, geom):
    if geom.is_empty:
        return None
    hits = gdf[gdf.intersects(geom)]
    if hits.empty:
        return None
    # Prefer largest intersection area among coastal provinces.
    best = None
    best_area = -1.0
    for _, row in hits.iterrows():
        area = row.geometry.intersection(geom).area
        if area > best_area:
            best_area = area
            best = str(row["shapeName"])
    return best


def area_ha_32648(geom_wgs84) -> float:
    from pyproj import Transformer

    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32648", always_xy=True)

    def _xy(x, y, z=None):
        xx, yy = transformer.transform(x, y)
        return (xx, yy) if z is None else (xx, yy, z)

    projected = shp_transform(_xy, geom_wgs84)
    return float(projected.area / 10_000.0)


def round_coords(obj, ndigits=5):
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(v), ndigits) for v in obj]
        return [round_coords(v, ndigits) for v in obj]
    return obj


def clip_feature_collection(fc: dict, provinces_gdf, mask) -> tuple[dict, dict]:
    kept = []
    dropped_outside = 0
    clipped_partial = 0
    dropped_mmu = 0

    for feat in fc.get("features") or []:
        geom_in = shape(feat["geometry"])
        if not geom_in.is_valid:
            geom_in = geom_in.buffer(0)
        if geom_in.is_empty or not geom_in.intersects(mask):
            dropped_outside += 1
            continue
        clipped = geom_in.intersection(mask)
        if not clipped.is_valid:
            clipped = clipped.buffer(0)
        if clipped.is_empty:
            dropped_outside += 1
            continue
        if clipped.geom_type == "GeometryCollection":
            polys = [g for g in clipped.geoms if g.geom_type in ("Polygon", "MultiPolygon") and not g.is_empty]
            if not polys:
                dropped_outside += 1
                continue
            from shapely.ops import unary_union as uu

            clipped = uu(polys)
        if clipped.geom_type not in ("Polygon", "MultiPolygon"):
            dropped_outside += 1
            continue

        if not geom_in.equals(clipped):
            clipped_partial += 1

        area_ha = area_ha_32648(clipped)
        if area_ha < MMU_HA - 1e-9:
            dropped_mmu += 1
            continue

        props = dict(feat.get("properties") or {})
        props["area_ha"] = round(area_ha, 2)
        props["province"] = province_for(provinces_gdf, clipped)
        props["mmu_ha"] = props.get("mmu_ha", MMU_HA)
        mapped = mapping(clipped)
        mapped["coordinates"] = round_coords(mapped["coordinates"], 5)
        kept.append({"type": "Feature", "properties": props, "geometry": mapped})

    stats = {
        "input_features": len(fc.get("features") or []),
        "output_features": len(kept),
        "dropped_outside_cambodia_l20": dropped_outside,
        "partially_clipped": clipped_partial,
        "dropped_below_mmu_after_clip": dropped_mmu,
        "go_features": sum(1 for f in kept if (f["properties"] or {}).get("suitability") == "go"),
        "caution_features": sum(
            1 for f in kept if (f["properties"] or {}).get("suitability") == "caution"
        ),
        "go_ha": round(
            sum(
                float((f["properties"] or {}).get("area_ha") or 0)
                for f in kept
                if (f["properties"] or {}).get("suitability") == "go"
            ),
            2,
        ),
        "caution_ha": round(
            sum(
                float((f["properties"] or {}).get("area_ha") or 0)
                for f in kept
                if (f["properties"] or {}).get("suitability") == "caution"
            ),
            2,
        ),
    }
    return {"type": "FeatureCollection", "features": kept}, stats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source-version", default="v0.2.1")
    ap.add_argument("--out-version", default="v0.2.2")
    ap.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite go-caution in --out-version without copying the whole tree first",
    )
    args = ap.parse_args()

    if not L20.is_file():
        raise SystemExit(f"Missing L20 provinces: {L20}")

    src = DELIVERY / args.source_version
    dest = DELIVERY / args.out_version
    if not src.is_dir():
        raise SystemExit(f"Source bundle missing: {src}")

    if not args.in_place:
        if dest.exists() and src.resolve() != dest.resolve():
            shutil.rmtree(dest)
        if src.resolve() != dest.resolve():
            print(f"Copying {src} → {dest}")
            shutil.copytree(src, dest)

    go_path = dest / "layers" / "go-caution.geojson"
    print(f"Loading {go_path} …")
    fc = json.loads(go_path.read_text(encoding="utf-8"))
    provinces_gdf, mask = load_l20_mask()
    print("Clipping to L20 coastal-four-provinces …")
    clipped, stats = clip_feature_collection(fc, provinces_gdf, mask)
    go_path.write_text(json.dumps(clipped, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print("  clip stats:", stats)

    manifest_path = dest / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["version"] = args.out_version
    manifest["built"] = utc_now()
    manifest["public_ready"] = False
    manifest["licence_gate"] = "blocked_pending_khm-i6e.2"
    stats_block = dict(manifest.get("stats") or {})
    stats_block.update(
        {
            "feature_count": stats["output_features"],
            "go_features": stats["go_features"],
            "caution_features": stats["caution_features"],
            "go_ha": stats["go_ha"],
            "caution_ha": stats["caution_ha"],
            "cambodia_clip": {
                "boundary": "inputs/screen-layers/L20/coastal-four-provinces.geojson",
                **{k: stats[k] for k in stats if k.startswith("dropped") or k == "partially_clipped"},
            },
        }
    )
    manifest["stats"] = stats_block
    notes = list(manifest.get("notes") or [])
    clip_note = (
        f"Cambodia clip ({args.out_version}): GO±CAUTION intersected with L20 coastal "
        "four provinces (Koh Kong, Preah Sihanouk, Kampot, Kep). Removes Viet Nam spill "
        f"(dropped_outside={stats['dropped_outside_cambodia_l20']}, "
        f"partial={stats['partially_clipped']}, below_mmu={stats['dropped_below_mmu_after_clip']})."
    )
    notes = [n for n in notes if not str(n).startswith("Cambodia clip (")]
    notes.append(clip_note)
    manifest["notes"] = notes
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    readme = dest / "README.md"
    if readme.is_file():
        text = readme.read_text(encoding="utf-8")
        banner = (
            f"\n\n## Cambodia clip ({args.out_version})\n\n"
            "GO±CAUTION clipped to `inputs/screen-layers/L20/coastal-four-provinces.geojson` "
            "so Viet Nam-side patches near Hà Tiên / Giang Thành are not shipped. "
            "`public_ready` remains false.\n"
        )
        if f"Cambodia clip ({args.out_version})" not in text:
            readme.write_text(text.rstrip() + banner, encoding="utf-8")

    print(f"Wrote clipped go-caution → {go_path}")
    print("public_ready remains false.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
