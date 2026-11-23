/**
 * OpenFreeMap Positron reference style, with a plain-sea offline fallback.
 * No OpenStreetMap geometry enters the bundle.
 */
import type { LayerSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { BASEMAP } from "../theme/colours";
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";

export type BasemapKind = "reference" | "offline";
export const REFERENCE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const COAST_BOUNDS = CAMBODIA_COAST_BOUNDS;
export const ATTRIBUTION = {
  bundle: "GO±CAUTION: Cambodia open-cleared delivery bundle. Illustrative physical screen only."
} as const;

export function collapseAttribution(map: MapLibreMap) {
  const el = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
  if (!el) return;
  el.classList.add("maplibregl-compact");
  el.classList.remove("maplibregl-compact-show");
  el.removeAttribute("open");
}

const STYLE_TIMEOUT_MS = 15000;
const LABEL_FIELD = ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
const HIDDEN_PREFIXES = ["highway", "railway", "tunnel", "road", "aeroway", "building"];

export function restyleReference(style: StyleSpecification): StyleSpecification {
  const layers: LayerSpecification[] = [];
  for (const layer of style.layers) {
    const paint = { ...(layer.paint as Record<string, unknown> | undefined) };
    const layout = { ...(layer.layout as Record<string, unknown> | undefined) };
    const id = layer.id;
    if (id === "background") paint["background-color"] = BASEMAP.land;
    if (id === "water") {
      paint["fill-color"] = BASEMAP.water;
      paint["fill-opacity"] = 1;
    }
    if (id === "park" || id === "landcover_wood") paint["fill-color"] = BASEMAP.land;
    if (id === "landuse_residential") paint["fill-color"] = BASEMAP.land;
    if (id.startsWith("boundary")) paint["line-color"] = BASEMAP.boundary;
    if (HIDDEN_PREFIXES.some((prefix) => id.startsWith(prefix)) && !id.includes("motorway")) {
      layout.visibility = "none";
    }
    if (layer.type === "symbol") {
      paint["text-color"] = BASEMAP.label;
      paint["text-halo-color"] = BASEMAP.halo;
      paint["text-halo-width"] = 1.2;
      const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
      if (sourceLayer === "place" || sourceLayer === "water_name" || sourceLayer === "waterway") {
        layout["text-field"] = LABEL_FIELD;
      }
    }
    layers.push({ ...layer, paint, layout } as LayerSpecification);
  }
  return { ...style, layers };
}

export const OCEAN_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "ocean", type: "background", paint: { "background-color": BASEMAP.sea } }]
};

export async function loadBasemapStyle(): Promise<{ style: StyleSpecification; kind: BasemapKind }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), STYLE_TIMEOUT_MS);
  try {
    const response = await fetch(REFERENCE_STYLE_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Reference style responded ${response.status}`);
    const style = (await response.json()) as StyleSpecification;
    return { style: restyleReference(style), kind: "reference" };
  } catch (error) {
    console.warn("Reference basemap unavailable; drawing plain sea.", error);
    return { style: OCEAN_STYLE, kind: "offline" };
  } finally {
    window.clearTimeout(timer);
  }
}
