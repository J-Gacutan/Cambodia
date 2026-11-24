import type { LayerSpecification } from "maplibre-gl";
import { FLAGS, SUITABILITY } from "../theme/colours";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;
type CirclePaint = NonNullable<Extract<LayerSpecification, { type: "circle" }>["paint"]>;

export const GO_CAUTION_FILL: FillPaint = {
  "fill-color": [
    "match",
    ["get", "suitability"],
    "go",
    SUITABILITY.go,
    "caution",
    SUITABILITY.caution,
    SUITABILITY.caution
  ],
  "fill-opacity": 0.45
};

export const GO_CAUTION_LINE: LinePaint = {
  "line-color": [
    "match",
    ["get", "suitability"],
    "go",
    SUITABILITY.go,
    "caution",
    SUITABILITY.caution,
    SUITABILITY.caution
  ],
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
