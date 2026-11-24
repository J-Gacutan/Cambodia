import { hashPath } from "../lib/hash";

/** LKA-style decision steps, mapped onto Cambodia routes. */
export type StepId = "frame" | "locate" | "read" | "means" | "act";

export type FlowStep = {
  id: StepId;
  label: string;
  /** Primary hash for this step. */
  href: string;
  /** One-line narrative under the step name (home detail title + rail cue). */
  does: string;
  /** Short cue shown under the rail on the current step. */
  cue: string;
  /** Longer home-panel story for this step. */
  detail: string;
};

/** Demonstrated order: Frame → Locate → Means → Read → Act (Means before Read). */
export const FLOW_STEPS: FlowStep[] = [
  {
    id: "frame",
    label: "Frame",
    href: "#home",
    does: "Decide what kind of screen this is before you open the map.",
    cue: "You are shortlisting physical restoration potential — not clearing a project or scoring carbon.",
    detail:
      "Cambodia’s four coastal provinces are the scene. This console asks where mangrove restoration looks physically plausible so a team can plan a field look — not whether MoE would zone it, whether tenure is clear, or whether a credit buyer would buy it."
  },
  {
    id: "locate",
    label: "Locate",
    href: "#change",
    does: "See what this console can say about mangroves now — and what it cannot.",
    cue: "Extent and condition are gaps; change samples (loss + built pressure) set the scene before Means and Read.",
    detail:
      "Locate is the current-state step: extent (where mangroves still stand), condition (health — not assessed), and change (loss and nearby built land). Only open change samples ship today; they are generalised and fade as you zoom. Satellite shows the shore; Means and Read carry the restoration screen."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Learn the legend — GO, CAUTION drivers, Ramsar and VERRA — before you open the map.",
    cue: "Walk the colours and case examples here, then continue to Read with the legend already in mind.",
    detail:
      "Means explains what each map colour and overlay means, with Case A (open/accreted GO) and Case C (tidal CAUTION) as worked examples. Elevation, converted land and VERRA hold-backs stay visible as not assessed until those layers paint. Then continue to the screen map."
  },
  {
    id: "read",
    label: "Read",
    href: "#map",
    does: "Open the screen map and ask what each patch is telling you.",
    cue: "Narrow the hold-back drivers, click a polygon, read why it is GO or CAUTION, then keep it if it earns a field look.",
    detail:
      "GO is open or accreted ground that still looks worth walking. CAUTION names the hold-back — tidal, elevation, converted (class 5), plus tenure and VERRA when flags hit — so you can filter noise and keep a shortlist you trust."
  },
  {
    id: "act",
    label: "Act",
    href: "#licence",
    does: "Decide from your shortlist — hold summary, export, then field or licence next steps.",
    cue: "Polygons you kept on Read arrive here with named holds; export CSV / GeoJSON and plan the walk.",
    detail:
      "Act carries forward shortlisted polygons from Read. Summarise tidal, elevation, converted, tenure and VERRA holds, export geometries, then take the next field look or licence check. Evidence class and attribution stay on this page so you know what you may share."
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
