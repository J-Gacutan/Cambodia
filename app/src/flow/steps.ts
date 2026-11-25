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
    does: "Name what you are asking before you open the map.",
    cue: "You are looking for sites that look worth a field visit — not approving a project or scoring carbon.",
    detail: "Name the question before you open the map. Pack scope and what this screen is not live under About."
  },
  {
    id: "locate",
    label: "Locate",
    href: "#change",
    does: "See what this console can say about mangroves now — and what it cannot.",
    cue: "Living mangrove extent (2025) and loss since 1996 are on; mangrove health is not assessed here; built-up nearby is optional context.",
    detail:
      "Skim today’s mangrove picture on the map. Layer notes, gaps, and licences for this pack live under About."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Practice GO and tide readings, then open Read ready to shortlist.",
    cue: "Pick Case A or Case C, learn the colour, then continue to Read: filter → click → inspect → shortlist.",
    detail:
      "Learn the palette with Case A and Case C, then continue to Read. Which examples ship in this pack is listed under About."
  },
  {
    id: "read",
    label: "Read",
    href: "#map",
    does: "Open the map and ask what each site is telling you.",
    cue: "Filter reasons to pause, click a site, read why it is GO or CAUTION, then keep it if it earns a field visit.",
    detail:
      "Filter, click, inspect, and shortlist. GO and CAUTION meanings, plus layer licences, are summarised under About."
  },
  {
    id: "act",
    label: "Act",
    href: "#act",
    does: "Take your shortlist forward — summary, download, then plan the next visit.",
    cue: "Sites you kept on the map arrive here; download a report and plan the walk.",
    detail:
      "Summarise holds, download a report, then plan the visit. Sharing rules and layer licences live under About — not on this step."
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
