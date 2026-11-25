/**
 * Hold-back reasons that separate CAUTION sites — not one bucket.
 * Tide, height, converted land, and ponds paint on this pack; rights and
 * carbon-project flags attach when present.
 */

import type { FeatureProps } from "./bundle";

export type CautionDriverId =
  | "tidal"
  | "elevation"
  | "converted"
  | "pond"
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
    label: "Tide / mudflat",
    short: "Tide",
    holdsBack:
      "This place is a tidal flat or mudflat. Do not plant here. Natural recovery only after a water check on site.",
    source: "Tide-flat map from open research data.",
    status: "live",
    /** PatternFly warning — amber tide, clear of GO cyan and converted red. */
    color: "#F0AB00"
  },
  {
    id: "elevation",
    label: "Height above the tide",
    short: "Height",
    holdsBack:
      "The ground sits higher than the usual tide range (within model error). Check height before planting.",
    source: "Height model checked against a tide model. Filled on this pack.",
    status: "live",
    color: "#7A8F6A"
  },
  {
    id: "converted",
    label: "Converted land",
    short: "Converted",
    holdsBack:
      "Former mangrove now used for something else (crops or trees that are not mangrove). Needs a named check before any restoration claim.",
    source: "Land-cover screen for converted cover on historic mangrove.",
    status: "live",
    /** PatternFly danger — red land-use hold, not a second gold. */
    color: "#C9190B"
  },
  {
    id: "pond",
    label: "Active pond",
    short: "Pond",
    holdsBack:
      "This place reads as an active or on-and-off pond. Check who uses it and what rights apply before any restoration claim.",
    source: "Active-pond screen on this pack. Source pond maps stay offline.",
    status: "live",
    /** Magenta #C2185B — clearly off tide amber (#F0AB00) and converted red; not blue. */
    color: "#C2185B"
  },
  {
    id: "tenure",
    label: "Protected-area flag",
    short: "Rights",
    holdsBack:
      "A protected-area or similar rights flag is present (for example Ramsar). Confirm access before any claim. Ministry core-zone stops are not on this pack yet.",
    source: "Ramsar and protected-area attributes. A hit is not a clearance.",
    status: "partial",
    color: "#6B4C9A"
  },
  {
    id: "verra",
    label: "Carbon-project outline",
    short: "Carbon project",
    holdsBack:
      "Inside or overlapping an existing carbon-project outline. Check double-counting and access.",
    source: "Staged project outlines for research. Not for commercial republish.",
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
  if (props.class_id === 5) out.push("converted");
  if (props.class_id === 7) out.push("pond");
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
      : "CAUTION, but the reason is not named on this pack.";
  }
  return ids.map((id) => DRIVER_BY_ID[id].holdsBack).join(" ");
}
