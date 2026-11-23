import type { FeatureProps } from "./bundle";

export type ShortlistItem = {
  id: string;
  class_id: number;
  class_name: string;
  suitability: "go" | "caution";
  area_ha: number;
  province: string | null;
  place?: string;
  note?: string;
  lon: number;
  lat: number;
};

function centroid(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number] {
  const rings =
    geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flatMap((poly) => poly);
  let x = 0;
  let y = 0;
  let n = 0;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      x += lon;
      y += lat;
      n += 1;
    }
  }
  return n ? [x / n, y / n] : [0, 0];
}

export function featureToShortlist(
  props: FeatureProps,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): ShortlistItem {
  const [lon, lat] = centroid(geometry);
  return {
    id: props.id,
    class_id: props.class_id,
    class_name: props.class_name,
    suitability: props.suitability,
    area_ha: props.area_ha,
    province: props.province ?? null,
    place: props.place,
    note: props.note,
    lon: Math.round(lon * 1e5) / 1e5,
    lat: Math.round(lat * 1e5) / 1e5
  };
}

export function shortlistToCsv(rows: ShortlistItem[]): string {
  const header = ["id", "suitability", "class_id", "class_name", "area_ha", "province", "place", "lon", "lat", "note"];
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.suitability,
        row.class_id,
        row.class_name,
        row.area_ha,
        row.province,
        row.place ?? "",
        row.lon,
        row.lat,
        row.note ?? ""
      ]
        .map(escape)
        .join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

export function shortlistToGeoJson(rows: ShortlistItem[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      properties: {
        id: row.id,
        suitability: row.suitability,
        class_id: row.class_id,
        class_name: row.class_name,
        area_ha: row.area_ha,
        province: row.province,
        place: row.place ?? null,
        note: row.note ?? null
      },
      geometry: { type: "Point", coordinates: [row.lon, row.lat] }
    }))
  };
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
