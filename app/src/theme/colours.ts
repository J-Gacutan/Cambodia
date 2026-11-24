/** Map / chrome colours. Hex lives here and in styles/app.css only. */
export const BASEMAP = {
  land: "#E8EEE8",
  water: "#C5D9DE",
  sea: "#D0DEE2",
  boundary: "#6B7A79",
  label: "#243433",
  halo: "#FFFFFF"
} as const;

/** Suitability paints from delivery schema maplibre_hint. */
export const SUITABILITY = {
  go: "#0099AA",
  caution: "#C4A35A",
  stop: "#A33E5A"
} as const;

/** Phase 2 context overlays (not suitability classes). */
export const FLAGS = {
  permit: "#6B4C9A",
  project: "#B85C38",
  gapMarker: "#5C6570",
  /** GMW living mangrove stock (matches Locate extent teal). */
  extent: "#1B6B4A",
  /** GMW 1996→2025 loss (matches Locate loss lime). */
  loss: "#C6F06A"
} as const;

export const KEY = {
  notAssessed: "#5C6570"
} as const;
