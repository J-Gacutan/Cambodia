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
    does: "See how the coast has been changing before you judge a patch.",
    cue: "Skim mangrove loss and nearby built pressure, then move on to the GO / CAUTION map.",
    detail:
      "Loss and pressure set the scene: where mangroves have retreated, and where built land is closing in. The change map is open samples only — enough context to arrive at the screen map with your eyes open."
  },
  {
    id: "read",
    label: "Read",
    href: "#map",
    does: "Open the screen map and ask what each patch is telling you.",
    cue: "Narrow the hold-back drivers, click a polygon, read why it is GO or CAUTION, then keep it if it earns a field look.",
    detail:
      "GO is open or accreted ground that still looks worth walking. CAUTION is not a single red light — it names the hold-back (tide on the public map today; elevation, converted land, tenure/legal, VERRA as they ship) so you can filter noise and keep a shortlist you trust."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Check the reading against a named place on the coast.",
    cue: "Case stories show how an open GO and a tidal CAUTION feel on the ground.",
    detail:
      "Two short stories — an open/accreted GO and a tidal-flat CAUTION — make the map legend concrete. Flags cite overlaps; they never say a site is approved or refused."
  },
  {
    id: "act",
    label: "Act",
    href: "#licence",
    does: "Leave with evidence you can quote, and a shortlist you can take offline.",
    cue: "Licence lines live here; CSV / GeoJSON export stays on the map.",
    detail:
      "When a patch earns a place on the shortlist, export it from the map. Come here for evidence class, attribution, and the open-cleared licence gate so you know what you may share."
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
