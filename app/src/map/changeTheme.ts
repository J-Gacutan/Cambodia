import type { LayerSpecification } from "maplibre-gl";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;

/**
 * Locate overlays are generalised open samples (~100–300 m), far coarser than
 * Read’s 10 m class polygons. Fade and hide them before close satellite zoom
 * so blocky outlines do not look like broken fine data.
 */
/** Living mangrove stock — deep teal, distinct from loss/gain samples. */
export const MANGROVE_EXTENT_FILL = "#1B6B4A";
export const MANGROVE_EXTENT_LINE = "#0D3D2A";
/** PatternFly danger red — high chroma on Satellite; colourblind-safer vs gain lime. */
export const MANGROVE_CHANGE_FILL = "#C9190B";
export const MANGROVE_CHANGE_LINE = "#7D1007";
/** Bright lime / yellow-green — not ocean-blue; pops on Satellite against loss red. */
export const MANGROVE_GAIN_FILL = "#C6F06A";
export const MANGROVE_GAIN_LINE = "#5C7A1A";
/** Warm clay — readable on imagery without competing with GO/CAUTION on Read. */
export const URBAN_CHANGE_FILL = "#E09A5A";
export const URBAN_CHANGE_LINE = "#8B4513";

/** Native display ceiling — past this, overlays are intentionally gone. */
export const CHANGE_LAYER_MAX_ZOOM = 11.75;

/** Soften fills as the user approaches the generalisation scale. */
export function changeFillOpacity(peak = 0.55): FillPaint["fill-opacity"] {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    peak,
    9,
    peak * 0.9,
    10.5,
    peak * 0.5,
    CHANGE_LAYER_MAX_ZOOM,
    0
  ];
}

export function changeLineOpacity(peak = 0.85): LinePaint["line-opacity"] {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    peak,
    9,
    peak * 0.9,
    10.5,
    peak * 0.4,
    CHANGE_LAYER_MAX_ZOOM,
    0
  ];
}

export function changeLineWidth(): LinePaint["line-width"] {
  return ["interpolate", ["linear"], ["zoom"], 6, 1.0, 9, 1.6, 11, 1.0];
}

/** Zoom at which the UI should warn that overlays are past their honest scale. */
export const CHANGE_COARSE_ZOOM_WARN = 10.25;
