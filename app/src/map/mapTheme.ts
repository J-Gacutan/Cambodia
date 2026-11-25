import type { LayerSpecification } from "maplibre-gl";
import { DRIVER_BY_ID } from "../lib/cautionDrivers";
import { FLAGS, KEY, SUITABILITY } from "../theme/colours";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;
type CirclePaint = NonNullable<Extract<LayerSpecification, { type: "circle" }>["paint"]>;

/**
 * Fill from class_id + elevation_fail (module 11). Do not read primary_driver —
 * the open pack does not write it. Order: tidal → converted → elev-fail class 8 → GO.
 */
function classColorExpr(): FillPaint["fill-color"] {
  return [
    "case",
    ["==", ["get", "class_id"], 4],
    DRIVER_BY_ID.tidal.color,
    ["==", ["get", "class_id"], 5],
    DRIVER_BY_ID.converted.color,
    [
      "all",
      ["==", ["get", "class_id"], 8],
      ["==", ["get", "elevation_fail"], true]
    ],
    DRIVER_BY_ID.elevation.color,
    ["==", ["get", "class_id"], 8],
    SUITABILITY.go,
    ["==", ["get", "suitability"], "go"],
    SUITABILITY.go,
    KEY.notAssessed
  ];
}

/** Prefer named class / elevation colours; never fall back to tidal gold for unknown CAUTION. */
export const GO_CAUTION_FILL: FillPaint = {
  "fill-color": classColorExpr(),
  "fill-opacity": 0.45
};

export const GO_CAUTION_LINE: LinePaint = {
  "line-color": classColorExpr() as LinePaint["line-color"],
  "line-width": 1.5
};

export const GO_CAUTION_HIGHLIGHT: FillPaint = {
  "fill-color": "#FFFFFF",
  "fill-opacity": 0.25
};

export const PERMIT_CONTEXT_FILL: FillPaint = {
  "fill-color": FLAGS.permit,
  "fill-opacity": 0.18
};

export const PERMIT_CONTEXT_LINE: LinePaint = {
  "line-color": FLAGS.permit,
  "line-width": 1.25,
  "line-dasharray": [2, 1]
};

export const PROJECT_OVERLAP_FILL: FillPaint = {
  "fill-color": FLAGS.project,
  "fill-opacity": 0.16
};

export const PROJECT_OVERLAP_LINE: LinePaint = {
  "line-color": FLAGS.project,
  "line-width": 1.5
};

export const GAP_MARKER_CIRCLE: CirclePaint = {
  "circle-radius": 6,
  "circle-color": FLAGS.gapMarker,
  "circle-stroke-width": 1.5,
  "circle-stroke-color": "#FFFFFF"
};

/** GMW living mangrove stock — Read context overlay (default off). */
export const EXTENT_CONTEXT_FILL: FillPaint = {
  "fill-color": FLAGS.extent,
  "fill-opacity": 0.28
};

export const EXTENT_CONTEXT_LINE: LinePaint = {
  "line-color": FLAGS.extent,
  "line-width": 1.25
};

/** GMW 1996→2025 loss — Read context overlay (default off). */
export const LOSS_CONTEXT_FILL: FillPaint = {
  "fill-color": FLAGS.loss,
  "fill-opacity": 0.35
};

export const LOSS_CONTEXT_LINE: LinePaint = {
  "line-color": "#5C7A1A",
  "line-width": 1.25
};
