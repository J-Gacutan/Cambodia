import type { FeatureProps } from "./bundle";
import { flagLabel } from "./bundle";

export type ShortlistGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

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
  permit_gate: boolean | null;
  permit_instrument?: string;
  stop_legal: boolean | null;
  stop_legal_status?: string;
  stop_legal_note?: string;
  project_overlap: boolean | null;
  project_overlap_ids?: string[] | null;
  project_overlap_note?: string;
  /** L12/L13 elevation check fail — GO may have been demoted to CAUTION paint. */
  elevation_fail?: boolean | null;
  /** Full patch geometry for GeoJSON export (centroid alone is not enough for desk work). */
  geometry: ShortlistGeometry;
};

const STORAGE_KEY = "khm-shortlist-v1";

function centroid(geometry: ShortlistGeometry): [number, number] {
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

function tri(v: unknown): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

export function featureToShortlist(props: FeatureProps, geometry: ShortlistGeometry): ShortlistItem {
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
    lat: Math.round(lat * 1e5) / 1e5,
    permit_gate: tri(props.permit_gate),
    permit_instrument: props.permit_instrument,
    stop_legal: tri(props.stop_legal),
    stop_legal_status: props.stop_legal_status,
    stop_legal_note: props.stop_legal_note,
    project_overlap: tri(props.project_overlap),
    project_overlap_ids: props.project_overlap_ids ?? null,
    project_overlap_note: props.project_overlap_note,
    elevation_fail: tri(props.elevation_fail),
    geometry
  };
}

export function shortlistToCsv(rows: ShortlistItem[]): string {
  const header = [
    "id",
    "suitability",
    "class_id",
    "class_name",
    "area_ha",
    "province",
    "place",
    "lon",
    "lat",
    "permit_gate",
    "permit_instrument",
    "stop_legal",
    "stop_legal_status",
    "stop_legal_note",
    "project_overlap",
    "project_overlap_ids",
    "project_overlap_note",
    "elevation_fail",
    "note"
  ];
  const escape = (v: string | number | boolean | null | undefined) => {
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
        flagLabel(row.permit_gate),
        row.permit_instrument ?? "",
        flagLabel(row.stop_legal),
        row.stop_legal_status ?? "",
        row.stop_legal_note ?? "",
        flagLabel(row.project_overlap),
        (row.project_overlap_ids ?? []).join("|"),
        row.project_overlap_note ?? "",
        flagLabel(row.elevation_fail ?? null),
        row.note ?? ""
      ]
        .map(escape)
        .join(",")
    );
  }
  // UTF-8 BOM helps Excel open CSV without mangling ids.
  return `\uFEFF${lines.join("\n")}\n`;
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
        note: row.note ?? null,
        lon: row.lon,
        lat: row.lat,
        permit_gate: row.permit_gate,
        permit_instrument: row.permit_instrument ?? null,
        stop_legal: row.stop_legal,
        stop_legal_status: row.stop_legal_status ?? null,
        stop_legal_note: row.stop_legal_note ?? null,
        project_overlap: row.project_overlap,
        project_overlap_ids: row.project_overlap_ids ?? null,
        project_overlap_note: row.project_overlap_note ?? null,
        elevation_fail: row.elevation_fail ?? null,
        product_note:
          "Physical / land-cover suitability proxy only. GO = worth a field look. Flags cite instruments — never approved/refused."
      },
      geometry: row.geometry
    }))
  };
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadShortlistFromStorage(): ShortlistItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShortlistItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row) =>
        row &&
        typeof row.id === "string" &&
        row.geometry &&
        (row.geometry.type === "Polygon" || row.geometry.type === "MultiPolygon")
    );
  } catch {
    return [];
  }
}

export function saveShortlistToStorage(rows: ShortlistItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Quota / private mode — ignore; shortlist still works in-memory.
  }
}

/** Approximate bbox from a shortlist polygon for map fitBounds. */
export function geometryBounds(geometry: ShortlistGeometry): [number, number, number, number] {
  const rings =
    geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flatMap((poly) => poly);
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < w) w = lon;
      if (lon > e) e = lon;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    }
  }
  if (!Number.isFinite(w)) return [0, 0, 0, 0];
  return [w, s, e, n];
}
