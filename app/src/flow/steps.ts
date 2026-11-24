import { hashPath } from "../lib/hash";

/** LKA-style decision steps, mapped onto Cambodia routes. */
export type StepId = "frame" | "locate" | "read" | "means" | "act";

export type FlowStep = {
  id: StepId;
  label: string;
  /** Primary hash for this step. */
  href: string;
  does: string;
  /** Short cue shown under the rail on the current step. */
  cue: string;
};

export const FLOW_STEPS: FlowStep[] = [
  {
    id: "frame",
    label: "Frame",
    href: "#home",
    does: "States what you are screening for.",
    cue: "Physical / land-cover restoration screen — not MoE zoning or a carbon outcome."
  },
  {
    id: "locate",
    label: "Locate",
    href: "#change",
    does: "Reads ecosystem change, then the screen map.",
    cue: "Start with mangrove loss and urban pressure, then continue to GO / CAUTION."
  },
  {
    id: "read",
    label: "Read",
    href: "#map",
    does: "Reads what each patch holds.",
    cue: "Filter hold-back drivers, click a patch, inspect, then shortlist."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Reads what that means for a field look.",
    cue: "Case stories show how GO and CAUTION read at named places."
  },
  {
    id: "act",
    label: "Act",
    href: "#licence",
    does: "Takes a next step from the screen.",
    cue: "Check evidence and licence lines; shortlist export stays on the map."
  }
];

const ORDER = FLOW_STEPS.map((s) => s.id);

export function stepFromPath(path: string): StepId | null {
  switch (path) {
    case "":
    case "home":
      return "frame";
    case "change":
      return "locate";
    case "map":
      return "read";
    case "cases":
      return "means";
    case "licence":
      return "act";
    default:
      return null;
  }
}

export function stepFromHash(hash: string): StepId | null {
  return stepFromPath(hashPath(hash));
}

export function stepMeta(id: StepId): FlowStep {
  return FLOW_STEPS.find((s) => s.id === id)!;
}

export function stepIndex(id: StepId): number {
  return ORDER.indexOf(id);
}

export function prevStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i > 0 ? ORDER[i - 1]! : null;
}

export function nextStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1]! : null;
}

export function hrefForStep(id: StepId): string {
  return stepMeta(id).href;
}

/** Map micro-actions under the Read step (demonstrated order). */
export type MapActionId = "filter" | "click" | "inspect" | "shortlist";

export const MAP_ACTIONS: { id: MapActionId; label: string; cta: string }[] = [
  {
    id: "filter",
    label: "Filter drivers",
    cta: "Open Hold-back drivers in the layers panel and keep only the drivers you care about."
  },
  {
    id: "click",
    label: "Click a patch",
    cta: "Click a GO or CAUTION polygon on the map."
  },
  {
    id: "inspect",
    label: "Inspect",
    cta: "Read class meaning and why the site is held back in the inspect panel."
  },
  {
    id: "shortlist",
    label: "Shortlist",
    cta: "Add the patch to your shortlist, then export CSV / GeoJSON when ready."
  }
];

export const MAP_COACH_KEY = "khm-map-coach-dismissed";
export const MAP_FILTER_TOUCHED_KEY = "khm-map-filter-touched";
