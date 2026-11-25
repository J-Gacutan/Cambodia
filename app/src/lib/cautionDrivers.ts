/**
 * Hold-back drivers that separate CAUTION sites — not one bucket.
 * Tidal, elevation, and converted paint on the open pack; tenure and VERRA
 * attach from flags when present.
 */

import type { FeatureProps } from "./bundle";

export type CautionDriverId =
  | "tidal"
  | "elevation"
  | "converted"
  | "tenure"
  | "verra";

export type CautionDriver = {
  id: CautionDriverId;
  label: string;
  short: string;
  /** Why this holds a project back */
  holdsBack: string;
  /** Plain-language source note (no task codes in the live console). */
  source: string;
  status: "live" | "partial" | "stub";
  color: string;
};

/** Canonical driver catalogue for legend + brief alignment. */
export const CAUTION_DRIVERS: CautionDriver[] = [
  {
    id: "tidal",
    label: "Tidal flat",
    short: "Tide",
    holdsBack:
      "Tidal flat or mudflat — do not plant here; natural recovery only after a water check on site.",
    source: "Note 3b class 4. Murray Global Intertidal Change.",
    status: "live",
    /** PatternFly warning — amber tide, clear of GO cyan and converted red. */
    color: "#F0AB00"
  },
  {
    id: "elevation",
    label: "Elevation",
    short: "Elevation",
    holdsBack:
      "Ground sits above the usual tidal range (within elevation-model error) — check height before planting.",
    source: "L12 DeltaDTM against L13 FES2022. Filled on this pack.",
    status: "live",
    color: "#7A8F6A"
  },
  {
    id: "converted",
    label: "Converted",
    short: "Converted",
    holdsBack:
      "Former mangrove now in another use (crops or trees outside mangrove) — needs a named check before any restoration claim.",
    source: "Land-cover screen for converted cover on historic mangrove.",
    status: "live",
    /** PatternFly danger — red land-use hold, not a second gold. */
    color: "#C9190B"
  },
  {
    id: "tenure",
    label: "Permit gate",
    short: "Permit",
    holdsBack:
      "Protected-area or legal context (for example Ramsar) — confirm access before any claim. Ministry core-zone stops are not on this pack yet.",
    source: "Ramsar and WDPA attributes. A hit is not a clearance.",
    status: "partial",
    color: "#6B4C9A"
  },
  {
    id: "verra",
    label: "VERRA overlap",
    short: "VERRA",
    holdsBack:
      "Inside or overlapping an existing carbon-project outline — check double-counting and access.",
    source: "Staged VCS 1748, 5071, 5584. Non-commercial research.",
    status: "partial",
    color: "#B85C38"
  }
];

export const DRIVER_BY_ID: Record<CautionDriverId, CautionDriver> = Object.fromEntries(
  CAUTION_DRIVERS.map((d) => [d.id, d])
) as Record<CautionDriverId, CautionDriver>;

/** Drivers that currently hold this feature back (may be empty for clear GO). */
export function driversForFeature(props: FeatureProps): CautionDriverId[] {
  const out: CautionDriverId[] = [];
  if (props.class_id === 4) out.push("tidal");
  if (props.elevation_fail === true) out.push("elevation");
  if (props.class_id === 5 || props.class_id === 7) out.push("converted");
  if (props.permit_gate === true || props.stop_legal === true) out.push("tenure");
  if (props.project_overlap === true) out.push("verra");
  return out;
}

export function primaryDriver(props: FeatureProps): CautionDriverId | null {
  const ids = driversForFeature(props);
  return ids[0] ?? null;
}

export function driverStatusLabel(status: CautionDriver["status"]): string {
  if (status === "live") return "";
  if (status === "partial") return "Partial";
  return "Not assessed";
}

export function holdsBackSummary(props: FeatureProps): string {
  const ids = driversForFeature(props);
  if (ids.length === 0) {
    return props.suitability === "go"
      ? "No mapped hold-back on this patch. Physical screen only. Not planting permission."
      : "CAUTION, driver not named.";
  }
  return ids.map((id) => DRIVER_BY_ID[id].holdsBack).join(" ");
}
