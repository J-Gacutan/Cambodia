/**
 * OpenFreeMap Positron reference style, Esri World Imagery satellite, and a
 * plain-sea offline fallback. No OpenStreetMap geometry enters the bundle.
 *
 * Satellite ↔ Streets swaps by toggling layer visibility inside one dual style
 * (no map.setStyle). Streets JSON is fetched once and cached / preloaded.
 */
import type { LayerSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { BASEMAP } from "../theme/colours";
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";

/** UI basemap choice (reference streets vs satellite imagery). */
export type BasemapChoice = "streets" | "satellite";

/** Resolved load kind after fetch / fallback. */
export type BasemapKind = "reference" | "satellite" | "offline";

export const REFERENCE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const COAST_BOUNDS = CAMBODIA_COAST_BOUNDS;

/** Esri World Imagery — open tiles with required attribution. */
export const ESRI_WORLD_IMAGERY_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const ATTRIBUTION = {
  bundle: "GO and CAUTION: Cambodia research map pack. Land-cover check only.",
  esri: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  openfreemap: "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors"
} as const;

const SAT_SOURCE_ID = "esri-world-imagery";
const SAT_LAYER_ID = "esri-world-imagery";
/** Layer metadata key — dual-style role for visibility toggles. */
export const BASEMAP_ROLE_KEY = "khm-basemap";
/** Stores the streets layer’s intended visibility when the streets basemap is on. */
const STREETS_VIS_KEY = "khm-streets-vis";

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

export function satelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      [SAT_SOURCE_ID]: {
        type: "raster",
        tiles: [ESRI_WORLD_IMAGERY_TILES],
        tileSize: 256,
        attribution: ATTRIBUTION.esri,
        maxzoom: 19
      }
    },
    layers: [{ id: SAT_LAYER_ID, type: "raster", source: SAT_SOURCE_ID }]
  };
}

type StreetsCache = { style: StyleSpecification; kind: BasemapKind };
let streetsCachePromise: Promise<StreetsCache> | null = null;

async function fetchStreetsStyle(): Promise<StreetsCache> {
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

/** Start (or reuse) the Streets style fetch — call on Locate mount. */
export function preloadStreetsBasemap(): Promise<StreetsCache> {
  if (!streetsCachePromise) streetsCachePromise = fetchStreetsStyle();
  return streetsCachePromise;
}

function layerMeta(layer: LayerSpecification): Record<string, unknown> {
  const meta = layer.metadata;
  return meta && typeof meta === "object" ? { ...(meta as Record<string, unknown>) } : {};
}

/** Invisible fill that keeps Streets vector tiles warm under Satellite. */
function streetsPreloadLayer(streets: StyleSpecification): LayerSpecification | null {
  const vectorSource = Object.entries(streets.sources ?? {}).find(([, src]) => {
    const s = src as { type?: string };
    return s?.type === "vector";
  });
  if (!vectorSource) return null;
  const [sourceId] = vectorSource;
  // Prefer a common OpenMapTiles water layer; fall back to first fill’s source-layer.
  let sourceLayer = "water";
  for (const layer of streets.layers) {
    if (layer.type === "fill" && "source-layer" in layer && layer["source-layer"]) {
      sourceLayer = String(layer["source-layer"]);
      break;
    }
  }
  return {
    id: "khm-streets-preload",
    type: "fill",
    source: sourceId,
    "source-layer": sourceLayer,
    layout: { visibility: "visible" },
    paint: { "fill-opacity": 0 },
    metadata: { [BASEMAP_ROLE_KEY]: "preload" }
  } as LayerSpecification;
}

/**
 * One style with both Esri satellite (top) and Streets layers underneath.
 * App overlays must be added *after* the satellite raster (no beforeId / top of stack).
 * Toggle with {@link applyBasemapChoice} — never map.setStyle for the swap.
 */
export function buildDualBasemapStyle(
  streets: StyleSpecification,
  choice: BasemapChoice
): StyleSpecification {
  const sat = satelliteStyle();
  const streetsLayers: LayerSpecification[] = streets.layers.map((layer) => {
    const layout = { ...(layer.layout as Record<string, unknown> | undefined) };
    const intended = typeof layout.visibility === "string" ? layout.visibility : "visible";
    layout.visibility = choice === "streets" ? intended : "none";
    return {
      ...layer,
      layout,
      metadata: {
        ...layerMeta(layer),
        [BASEMAP_ROLE_KEY]: "streets",
        [STREETS_VIS_KEY]: intended
      }
    } as LayerSpecification;
  });
  const satLayers: LayerSpecification[] = sat.layers.map((layer) => {
    const layout = { ...(layer.layout as Record<string, unknown> | undefined) };
    layout.visibility = choice === "satellite" ? "visible" : "none";
    return {
      ...layer,
      layout,
      metadata: { ...layerMeta(layer), [BASEMAP_ROLE_KEY]: "satellite" }
    } as LayerSpecification;
  });
  const preload = streetsPreloadLayer(streets);
  return {
    ...streets,
    sources: { ...(streets.sources ?? {}), ...(sat.sources ?? {}) },
    // Streets → optional preload (tiles warm) → satellite on top. Overlays append above sat.
    layers: [...streetsLayers, ...(preload ? [preload] : []), ...satLayers]
  };
}

export async function loadDualBasemapStyle(
  choice: BasemapChoice = "satellite"
): Promise<{ style: StyleSpecification; kind: BasemapKind; streetsKind: BasemapKind }> {
  const streets = await preloadStreetsBasemap();
  const style = buildDualBasemapStyle(streets.style, choice);
  const kind: BasemapKind =
    choice === "satellite" ? "satellite" : streets.kind === "offline" ? "offline" : "reference";
  return { style, kind, streetsKind: streets.kind };
}

type DualBasemapIndex = {
  streetsKind: BasemapKind;
  streets: { id: string; intended: "visible" | "none" }[];
  satellite: string[];
};

const dualByMap = new WeakMap<MapLibreMap, DualBasemapIndex>();

/** Call once after `new maplibregl.Map({ style: dual })` so toggles do not depend on metadata. */
export function rememberDualBasemap(
  map: MapLibreMap,
  style: StyleSpecification,
  streetsKind: BasemapKind
): void {
  const streets: DualBasemapIndex["streets"] = [];
  const satellite: string[] = [];
  for (const layer of style.layers) {
    const meta = layerMeta(layer);
    const role = meta[BASEMAP_ROLE_KEY];
    if (role === "satellite" || layer.id === SAT_LAYER_ID) {
      satellite.push(layer.id);
      continue;
    }
    if (role === "preload" || layer.id === "khm-streets-preload") continue;
    if (role === "streets" || !layer.id.startsWith("khm-")) {
      const fromMeta = meta[STREETS_VIS_KEY];
      streets.push({
        id: layer.id,
        intended: fromMeta === "none" || fromMeta === "visible" ? fromMeta : "visible"
      });
    }
  }
  dualByMap.set(map, { streetsKind, streets, satellite });
}

/** Sync visibility toggle — keeps overlay sources/layers intact. */
export function applyBasemapChoice(map: MapLibreMap, choice: BasemapChoice): BasemapKind {
  const indexed = dualByMap.get(map);
  if (indexed) {
    for (const id of indexed.satellite) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", choice === "satellite" ? "visible" : "none");
      }
    }
    for (const { id, intended } of indexed.streets) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", choice === "streets" ? intended : "none");
      }
    }
    if (choice === "satellite") return "satellite";
    return indexed.streetsKind === "offline" ? "offline" : "reference";
  }

  // Fallback if rememberDualBasemap was skipped — id heuristics, no metadata required.
  const style = map.getStyle();
  if (!style?.layers) return choice === "satellite" ? "satellite" : "reference";
  let sawStreets = false;
  let streetsOffline = false;
  for (const layer of style.layers) {
    if (layer.id === SAT_LAYER_ID) {
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(layer.id, "visibility", choice === "satellite" ? "visible" : "none");
      }
      continue;
    }
    if (layer.id === "khm-streets-preload" || layer.id.startsWith("khm-")) continue;
    sawStreets = true;
    if (layer.id === "ocean") streetsOffline = true;
    if (map.getLayer(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", choice === "streets" ? "visible" : "none");
    }
  }
  if (choice === "satellite") return "satellite";
  if (!sawStreets) return "offline";
  return streetsOffline ? "offline" : "reference";
}

/** Whether this map was registered for dual-basemap visibility swaps. */
export function mapHasDualBasemap(map: MapLibreMap): boolean {
  if (dualByMap.has(map)) return true;
  return Boolean(map.getLayer(SAT_LAYER_ID));
}

/**
 * Legacy single-style loader (tests / callers that still need one style).
 * Prefer {@link loadDualBasemapStyle} + {@link applyBasemapChoice} for UI toggles.
 */
export async function loadBasemapStyle(
  choice: BasemapChoice = "streets"
): Promise<{ style: StyleSpecification; kind: BasemapKind }> {
  if (choice === "satellite") {
    return { style: satelliteStyle(), kind: "satellite" };
  }
  const streets = await preloadStreetsBasemap();
  return { style: streets.style, kind: streets.kind };
}
