import type { LayerSpecification } from "maplibre-gl";
import { DRIVER_BY_ID } from "../lib/cautionDrivers";
import { FLAGS, SUITABILITY } from "../theme/colours";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;
type CirclePaint = NonNullable<Extract<LayerSpecification, { type: "circle" }>["paint"]>;

function driverColorExpr(fallback: string): FillPaint["fill-color"] {
  return [
    "case",
    [
      "in",
      ["get", "primary_driver"],
      ["literal", ["tidal", "elevation", "converted", "tenure", "verra"]]
    ],
    [
      "match",
      ["get", "primary_driver"],
      "tidal",
      DRIVER_BY_ID.tidal.color,
      "elevation",
      DRIVER_BY_ID.elevation.color,
      "converted",
      DRIVER_BY_ID.converted.color,
      "tenure",
      DRIVER_BY_ID.tenure.color,
      "verra",
      DRIVER_BY_ID.verra.color,
      fallback
    ],
    ["==", ["get", "suitability"], "go"],
    SUITABILITY.go,
    fallback
  ];
}

/** Prefer hold-back driver colour when set; else GO / generic CAUTION. */
export const GO_CAUTION_FILL: FillPaint = {
  "fill-color": driverColorExpr(SUITABILITY.caution),
  "fill-opacity": 0.45
};

export const GO_CAUTION_LINE: LinePaint = {
  "line-color": driverColorExpr(SUITABILITY.caution) as LinePaint["line-color"],
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
