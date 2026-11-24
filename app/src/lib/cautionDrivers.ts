/**
 * Hold-back drivers that separate CAUTION / blocked sites — not one bucket.
 * Physical class 4 is tidal today; other drivers attach from Phase 2 flags
 * or are clearly labelled stubs until open P2 layers ship.
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
  /** Open P2 source when live; otherwise stub */
  source: string;
  status: "live" | "partial" | "stub";
  color: string;
};

/** Canonical driver catalogue for legend + brief alignment. */
export const CAUTION_DRIVERS: CautionDriver[] = [
  {
    id: "tidal",
    label: "Tidal / hydroperiod",
    short: "Tidal",
    holdsBack:
      "Tidal flat or hydroperiod — no planting on mudflats; natural recruitment only after a hydrology check.",
    source: "Note 3b class 4 · Murray Global Intertidal Change (L11) + Dynamic World (L10)",
    status: "live",
    color: "#C4A35A"
  },
  {
    id: "elevation",
    label: "Elevation / suitability",
    short: "Elevation",
    holdsBack:
      "Site sits above the tidal frame relative to highest astronomical tide (within DEM error).",
    source: "L12 DeltaDTM vs L13 FES2022 elevation_check_flag — GO demoted to CAUTION when flag=1",
    status: "live",
    color: "#7A8F6A"
  },
  {
    id: "converted",
    label: "Converted / pressure",
    short: "Converted",
    holdsBack:
      "Historic mangrove converted to other use (crops or trees outside mangrove on the open limb).",
    source: "Note 3b class 5 (Dynamic World limb) — class 7 pond geometries stay FLAG/off public",
    status: "live",
    color: "#A67C52"
  },
  {
    id: "tenure",
    label: "Tenure / legal",
    short: "Tenure",
    holdsBack:
      "Permit-gate or STOP (legal) context — protected area, Ramsar, or MoE core zone when available.",
    source: "Phase 2 permit_gate (Ramsar/WDPA attributes); STOP legal unavailable until MoE core zones",
    status: "partial",
    color: "#6B4C9A"
  },
  {
    id: "verra",
    label: "VERRA / project overlap",
    short: "VERRA",
    holdsBack: "Inside an existing VERRA / VCS project boundary — double-counting and access check.",
    source: "Phase 2 project_overlap — staged VCS 1748 / 5071 / 5584 boundaries (non-commercial research overlay)",
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
  if (status === "live") return "On map";
  if (status === "partial") return "Partial";
  return "Not assessed";
}

export function holdsBackSummary(props: FeatureProps): string {
  const ids = driversForFeature(props);
  if (ids.length === 0) {
    return props.suitability === "go"
      ? "No mapped hold-back driver on this patch (physical GO only — still not planting permission)."
      : "CAUTION without a named driver attribute — treat as a generic named check.";
  }
  return ids.map((id) => DRIVER_BY_ID[id].holdsBack).join(" ");
}
