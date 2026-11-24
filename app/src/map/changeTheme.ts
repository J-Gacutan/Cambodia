import type { LayerSpecification } from "maplibre-gl";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;

/**
 * Locate overlays are generalised open samples (~100–300 m), far coarser than
 * Read’s 10 m class polygons. Fade and hide them before close satellite zoom
 * so blocky outlines do not look like broken fine data.
 */
/** Living mangrove stock — deep teal, distinct from lime loss samples. */
export const MANGROVE_EXTENT_FILL = "#1B6B4A";
export const MANGROVE_EXTENT_LINE = "#0D3D2A";
/** Bright lime on Satellite so GMW loss stays findable against dark canopy. */
export const MANGROVE_CHANGE_FILL = "#C6F06A";
export const MANGROVE_CHANGE_LINE = "#5C7A1A";
/** Soft blue-green for optional GMW gain (recovery / mapping refinement). */
export const MANGROVE_GAIN_FILL = "#7EC8B8";
export const MANGROVE_GAIN_LINE = "#2F6F62";
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
