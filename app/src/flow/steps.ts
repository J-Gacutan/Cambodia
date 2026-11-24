import { hashPath } from "../lib/hash";

/** Decision steps mapped onto Cambodia routes. */
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

/** Order: Frame → Locate → Means → Read → Act (Means before Read). */
export const FLOW_STEPS: FlowStep[] = [
  {
    id: "frame",
    label: "Frame",
    href: "#home",
    does: "Set the question before you open the map.",
    cue: "You are shortlisting sites that look worth a field visit — not approving a project or scoring carbon.",
    detail:
      "Cambodia’s four coastal provinces are the scene. This screen asks where mangrove restoration looks physically promising so a team can plan a field visit — not whether the ministry would zone it, whether tenure is clear, or whether a buyer would buy a credit."
  },
  {
    id: "locate",
    label: "Locate",
    href: "#change",
    does: "See how the coast has been changing before you judge a site.",
    cue: "Skim mangrove loss and nearby built pressure, then learn the legend before the restoration map.",
    detail:
      "Loss and pressure set the scene: where mangroves have retreated, and where built land is closing in. The change map is an open sample — enough context before the case stories and the GO / CAUTION map."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Learn the legend — GO, CAUTION reasons, protected areas and carbon projects — before the map.",
    cue: "Walk the colours and examples here, then open Read with the legend already in mind.",
    detail:
      "Means explains what each map colour and overlay means, with Case A (open GO) and Case C (tidal CAUTION) as worked examples. Then continue to the restoration map."
  },
  {
    id: "read",
    label: "Read",
    href: "#map",
    does: "Open the map and ask what each site is telling you.",
    cue: "Filter reasons to pause, click a site, read why it is GO or CAUTION, then keep it if it earns a field visit.",
    detail:
      "GO is open or newly built land on former mangrove that still looks worth walking. CAUTION names the reason to pause — tide, height, converted land, rights context, or an existing carbon project — so you can keep a shortlist you trust."
  },
  {
    id: "act",
    label: "Act",
    href: "#act",
    does: "Take your shortlist forward — summary, download, then plan the next visit.",
    cue: "Sites you kept on the map arrive here; download a report and plan the walk.",
    detail:
      "Act carries forward sites you shortlisted on Read. Summarise why any are held back, download a report or map file, then plan the field visit. Sharing rules and layer licences live under About — not on this step."
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
    case "act":
    case "licence":
      // `#licence` kept as an alias for older bookmarks.
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

/** Map micro-actions under the Read step. */
export type MapActionId = "filter" | "click" | "inspect" | "shortlist";

export const MAP_ACTIONS: { id: MapActionId; label: string; cta: string }[] = [
  {
    id: "filter",
    label: "Filter reasons",
    cta: "Open Reasons to pause in the layers panel and keep only the ones you care about."
  },
  {
    id: "click",
    label: "Click a site",
    cta: "Click a GO or CAUTION area on the map."
  },
  {
    id: "inspect",
    label: "Inspect",
    cta: "Read what the site means and why it may be held back."
  },
  {
    id: "shortlist",
    label: "Shortlist",
    cta: "Add the site to your shortlist, then continue to Act when ready."
  }
];

export const MAP_COACH_KEY = "khm-map-coach-dismissed";
export const MAP_FILTER_TOUCHED_KEY = "khm-map-filter-touched";
