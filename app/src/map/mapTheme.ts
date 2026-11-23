import type { LayerSpecification } from "maplibre-gl";
import { SUITABILITY } from "../theme/colours";

type FillPaint = NonNullable<Extract<LayerSpecification, { type: "fill" }>["paint"]>;
type LinePaint = NonNullable<Extract<LayerSpecification, { type: "line" }>["paint"]>;

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
