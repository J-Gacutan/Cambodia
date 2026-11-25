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
    detail:
      "Across Cambodia’s four coastal provinces, this screen asks where mangrove restoration looks physically promising so a team can plan a field visit. It does not say whether the ministry would zone a site, whether tenure is clear, or whether anyone would buy a carbon credit."
  },
  {
    id: "locate",
    label: "Locate",
    href: "#change",
    does: "See what this console can say about mangroves now — and what it cannot.",
    cue: "Living mangrove extent (2025) and loss since 1996 are on; mangrove health is not assessed here; built-up nearby is optional context.",
    detail:
      "Locate shows today’s mangrove picture: where mangroves still stand (2025 extent), where they were lost or gained since 1996, and optional built-up nearby. Mangrove health is not assessed on this pack. Overlays are generalised and fade as you zoom. Satellite shows the shore; Means and Read carry the restoration screen."
  },
  {
    id: "means",
    label: "Means",
    href: "#cases",
    does: "Practice GO and tide readings, then open Read ready to shortlist.",
    cue: "Pick Case A or Case C, learn the colour, then continue to Read: filter → click → inspect → shortlist.",
    detail:
      "Means teaches the palette in the same groups you will use on the map — what you keep (GO), why you pause (named CAUTION reasons), and context overlays. Case A (open GO) and Case C (tide) are worked examples. Then Read is filter reasons, click a site, inspect, and shortlist."
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
