/**
 * Offscreen map snapshots for Act shortlist report patches.
 * Prefer MapLibre + satellite tiles; fall back to a Canvas 2D fitted outline
 * when WebGL is unavailable. Capture failures never throw — callers get null
 * and show a placeholder so export still completes.
 */
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadBasemapStyle, ATTRIBUTION } from "../map/basemap";
import { BASEMAP, SUITABILITY } from "../theme/colours";
import { geometryBounds, type ShortlistGeometry, type ShortlistItem } from "./shortlist";

export type ReportMapShot = {
  id: string;
  /** PNG data URL when capture succeeded; null when skipped / failed. */
  dataUrl: string | null;
};

export type CaptureMapShotsOptions = {
  width?: number;
  height?: number;
  /** Per-patch budget before giving up (tiles + idle). */
  timeoutMs?: number;
  /** Called after each patch (success or placeholder). */
  onProgress?: (done: number, total: number) => void;
};

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 220;
const DEFAULT_TIMEOUT_MS = 12_000;
const PAD_PX = 36;

function fillColor(suitability: ShortlistItem["suitability"]): string {
  return suitability === "go" ? SUITABILITY.go : SUITABILITY.caution;
}

function waitForIdle(map: maplibregl.Map, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      map.off("idle", onIdle);
      resolve();
    };
    const onIdle = () => finish();
    const timer = window.setTimeout(finish, timeoutMs);
    map.once("idle", onIdle);
    window.requestAnimationFrame(() => {
      if (!settled && map.loaded()) finish();
    });
  });
}

function makeHost(width: number, height: number): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${width}px`,
    `height:${height}px`,
    "opacity:0",
    "pointer-events:none",
    "overflow:hidden"
  ].join(";");
  document.body.appendChild(host);
  return host;
}

/** Project lon/lat into canvas pixels fitted to bounds. */
function projecter(
  bounds: [number, number, number, number],
  width: number,
  height: number
): (lon: number, lat: number) => [number, number] {
  const [w, s, e, n] = bounds;
  const bw = Math.max(e - w, 1e-9);
  const bh = Math.max(n - s, 1e-9);
  const innerW = width - PAD_PX * 2;
  const innerH = height - PAD_PX * 2;
  const scale = Math.min(innerW / bw, innerH / bh);
  const ox = PAD_PX + (innerW - bw * scale) / 2;
  const oy = PAD_PX + (innerH - bh * scale) / 2;
  return (lon, lat) => [ox + (lon - w) * scale, oy + (n - lat) * scale];
}

function ringsOf(geometry: ShortlistGeometry): number[][][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flatMap((poly) => poly);
}

/**
 * Canvas 2D fallback when WebGL / MapLibre cannot initialise.
 * Still centres and fits the shortlist polygon for the printable pack.
 */
function captureStaticFallback(
  row: ShortlistItem,
  width: number,
  height: number
): string | null {
  const bounds = geometryBounds(row.geometry);
  if (bounds[0] === bounds[2] && bounds[1] === bounds[3]) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = BASEMAP.sea;
  ctx.fillRect(0, 0, width, height);
  // Soft land wash
  ctx.fillStyle = BASEMAP.land;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(8, 8, width - 16, height - 16);
  ctx.globalAlpha = 1;

  const toPx = projecter(bounds, width, height);
  const color = fillColor(row.suitability);
  const rings = ringsOf(row.geometry);

  ctx.beginPath();
  for (const ring of rings) {
    if (!ring.length) continue;
    const [x0, y0] = toPx(ring[0][0], ring[0][1]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < ring.length; i += 1) {
      const [x, y] = toPx(ring[i][0], ring[i][1]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.fill("evenodd");
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = BASEMAP.label;
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText(`${row.id} · ${row.lon}, ${row.lat}`, 10, height - 10);

  return canvas.toDataURL("image/png");
}

async function captureMapLibre(
  row: ShortlistItem,
  width: number,
  height: number,
  timeoutMs: number
): Promise<string | null> {
  const bounds = geometryBounds(row.geometry);
  if (bounds[0] === bounds[2] && bounds[1] === bounds[3]) return null;

  const host = makeHost(width, height);
  let map: maplibregl.Map | undefined;
  try {
    const { style } = await loadBasemapStyle("satellite");
    map = new maplibregl.Map({
      container: host,
      style,
      attributionControl: false,
      interactive: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
      fadeDuration: 0,
      bounds,
      fitBoundsOptions: { padding: PAD_PX, maxZoom: 15 }
    });
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: [ATTRIBUTION.bundle, ATTRIBUTION.esri]
      })
    );

    // Style load only — tile 404s also emit "error" and must not abort capture.
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("map load timeout")), timeoutMs);
      map!.once("load", () => {
        window.clearTimeout(timer);
        resolve();
      });
    });
    map.on("error", (e) => {
      console.warn(`Report map shot tile/style warning for ${row.id}`, e.error ?? e);
    });

    const color = fillColor(row.suitability);
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { id: row.id, suitability: row.suitability },
          geometry: row.geometry
        }
      ]
    };
    map.addSource("report-patch", { type: "geojson", data: fc });
    map.addLayer({
      id: "report-patch-fill",
      type: "fill",
      source: "report-patch",
      paint: { "fill-color": color, "fill-opacity": 0.45 }
    });
    map.addLayer({
      id: "report-patch-line",
      type: "line",
      source: "report-patch",
      paint: { "line-color": color, "line-width": 2 }
    });

    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ],
      { padding: PAD_PX, maxZoom: 15, duration: 0 }
    );

    await new Promise<void>((r) => window.requestAnimationFrame(() => r()));
    await waitForIdle(map, Math.min(timeoutMs, 8_000));

    const canvas = map.getCanvas();
    if (!canvas.width || !canvas.height) return null;
    return canvas.toDataURL("image/png");
  } finally {
    try {
      map?.remove();
    } catch {
      // ignore dispose errors
    }
    host.remove();
  }
}

async function captureOne(
  row: ShortlistItem,
  width: number,
  height: number,
  timeoutMs: number
): Promise<string | null> {
  try {
    const live = await captureMapLibre(row, width, height, timeoutMs);
    if (live) return live;
  } catch (err) {
    console.warn(`Report MapLibre shot failed for ${row.id}; trying static fallback.`, err);
  }
  try {
    return captureStaticFallback(row, width, height);
  } catch (err) {
    console.warn(`Report static map shot failed for ${row.id}`, err);
    return null;
  }
}

/**
 * Capture a small fitted map PNG for each shortlisted patch.
 * Sequential to keep GPU / tile load light; never rejects.
 */
export async function captureShortlistMapShots(
  rows: ShortlistItem[],
  options: CaptureMapShotsOptions = {}
): Promise<Record<string, string | null>> {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const out: Record<string, string | null> = {};
  const total = rows.length;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    try {
      out[row.id] = await captureOne(row, width, height, timeoutMs);
    } catch (err) {
      console.warn(`Report map shot unexpected failure for ${row.id}`, err);
      out[row.id] = null;
    }
    options.onProgress?.(i + 1, total);
  }

  return out;
}

/** HTML figure or placeholder for one patch. */
export function reportMapShotHtml(
  rowId: string,
  dataUrl: string | null | undefined,
  esc: (s: string) => string
): string {
  if (dataUrl) {
    return `<figure class="map-shot">
  <img src="${dataUrl}" alt="Map snapshot of site ${esc(rowId)}" width="360" height="220" />
  <figcaption>Site ${esc(rowId)} — map snapshot fitted to the shortlist outline.</figcaption>
</figure>`;
  }
  return `<div class="map-shot map-shot--missing" role="img" aria-label="Map snapshot unavailable for ${esc(rowId)}">
  <p>Map snapshot unavailable for ${esc(rowId)}.</p>
  <p class="hint">Export continued without this image. Pair with the map-polygon download from Act.</p>
</div>`;
}
