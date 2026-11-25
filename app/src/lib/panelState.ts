/**
 * Read-panel state for module 11 — place, drawn classes, narrowing flags,
 * overlays, and case presets. Hash is the shareable view; shortlist stays out.
 */

import type { FilterSpecification } from "maplibre-gl";

export type PlaceId = "coast" | "koh-kong" | "preah-sihanouk" | "kampot" | "kep";

export type DrawnClassId = 4 | 5 | 8;

export type HideFlag = "permit" | "verra";

export type OverlayId = "ramsar" | "verra";

export type PanelPreset = "coast" | "A" | "C" | "field";

export type PanelState = {
  place: PlaceId;
  classes: DrawnClassId[];
  elevation: boolean;
  hide: HideFlag[];
  overlay: OverlayId[];
  /** Named preset for headline place clause; null when custom. */
  preset: PanelPreset | null;
  caseId: "A" | "C" | null;
};

export const PLACE_OPTIONS: { id: PlaceId; label: string; province: string | null }[] = [
  { id: "coast", label: "Four coastal provinces", province: null },
  { id: "koh-kong", label: "Koh Kong", province: "Koh Kong" },
  { id: "preah-sihanouk", label: "Preah Sihanouk", province: "Preah Sihanouk" },
  { id: "kampot", label: "Kampot", province: "Kampot" },
  { id: "kep", label: "Kep", province: "Kep" }
];

export const DEFAULT_CLASSES: DrawnClassId[] = [4, 5, 8];

export function defaultPanelState(): PanelState {
  return {
    place: "coast",
    classes: [...DEFAULT_CLASSES],
    elevation: false,
    hide: [],
    overlay: [],
    preset: "coast",
    caseId: null
  };
}

export function provinceForPlace(place: PlaceId): string | null {
  return PLACE_OPTIONS.find((row) => row.id === place)?.province ?? null;
}

export function placeLabel(place: PlaceId, casePlaceLine?: string | null): string {
  if (casePlaceLine) return casePlaceLine;
  return PLACE_OPTIONS.find((row) => row.id === place)?.label ?? "Four coastal provinces";
}

function parseClassList(raw: string | null): DrawnClassId[] {
  if (raw == null || raw.trim() === "") return [...DEFAULT_CLASSES];
  const out: DrawnClassId[] = [];
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (n === 4 || n === 5 || n === 8) {
      if (!out.includes(n)) out.push(n);
    }
  }
  return out;
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw || !raw.trim()) return [];
  const out: T[] = [];
  for (const part of raw.split(",")) {
    const v = part.trim() as T;
    if (allowed.includes(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

const PLACES: PlaceId[] = ["coast", "koh-kong", "preah-sihanouk", "kampot", "kep"];

/** Apply case preset first, then other hash keys win. */
export function panelStateFromHash(hash: string): PanelState {
  const q = new URLSearchParams(hash.split("?")[1] ?? "");
  const caseRaw = q.get("case");
  const caseId = caseRaw === "A" || caseRaw === "C" ? caseRaw : null;

  let state = defaultPanelState();
  if (caseId === "A") {
    state = {
      ...state,
      classes: [8],
      elevation: false,
      hide: [],
      overlay: [],
      preset: "A",
      caseId: "A"
    };
  } else if (caseId === "C") {
    state = {
      ...state,
      classes: [4],
      elevation: false,
      hide: [],
      overlay: [],
      preset: "C",
      caseId: "C"
    };
  }

  const placeRaw = q.get("place");
  if (placeRaw && (PLACES as string[]).includes(placeRaw)) {
    state = { ...state, place: placeRaw as PlaceId, preset: caseId ? state.preset : null };
  }

  if (q.has("class")) {
    state = { ...state, classes: parseClassList(q.get("class")), preset: caseId ? state.preset : null };
  }
  if (q.has("elevation")) {
    state = { ...state, elevation: q.get("elevation") === "1", preset: caseId ? state.preset : null };
  }
  if (q.has("hide")) {
    state = {
      ...state,
      hide: parseList(q.get("hide"), ["permit", "verra"] as const),
      preset: caseId ? state.preset : null
    };
  }
  if (q.has("overlay")) {
    state = {
      ...state,
      overlay: parseList(q.get("overlay"), ["ramsar", "verra"] as const),
      preset: caseId ? state.preset : null
    };
  }

  return state;
}

export function panelStateToHashQuery(state: PanelState): string {
  const q = new URLSearchParams();
  if (state.place !== "coast") q.set("place", state.place);

  const classesSorted = [...state.classes].sort((a, b) => a - b);
  const defaultClasses =
    classesSorted.length === 3 && classesSorted[0] === 4 && classesSorted[1] === 5 && classesSorted[2] === 8;
  if (!defaultClasses) q.set("class", classesSorted.join(",") || "");

  if (state.elevation) q.set("elevation", "1");
  if (state.hide.length) q.set("hide", state.hide.join(","));
  if (state.overlay.length) q.set("overlay", state.overlay.join(","));
  if (state.caseId) q.set("case", state.caseId);

  const s = q.toString();
  return s ? `#map?${s}` : "#map";
}

export function presetCoast(): PanelState {
  return defaultPanelState();
}

export function presetCaseA(): PanelState {
  return {
    place: "coast",
    classes: [8],
    elevation: false,
    hide: [],
    overlay: [],
    preset: "A",
    caseId: "A"
  };
}

export function presetCaseC(): PanelState {
  return {
    place: "coast",
    classes: [4],
    elevation: false,
    hide: [],
    overlay: [],
    preset: "C",
    caseId: "C"
  };
}

export function presetFieldLook(current: PanelState): PanelState {
  return {
    ...current,
    classes: [8],
    elevation: false,
    hide: ["permit", "verra"],
    overlay: [],
    preset: "field",
    caseId: null
  };
}

/** MapLibre filter for drawn classes + elevation include + place + hides. */
export function buildScreenFilter(state: PanelState): FilterSpecification {
  const classParts: FilterSpecification[] = [];
  if (state.classes.includes(4)) {
    classParts.push(["==", ["get", "class_id"], 4]);
  }
  if (state.classes.includes(5)) {
    classParts.push(["==", ["get", "class_id"], 5]);
  }
  if (state.classes.includes(8)) {
    classParts.push([
      "all",
      ["==", ["get", "class_id"], 8],
      ["!=", ["get", "elevation_fail"], true]
    ] as FilterSpecification);
  }
  if (state.elevation) {
    classParts.push([
      "all",
      ["==", ["get", "class_id"], 8],
      ["==", ["get", "elevation_fail"], true]
    ] as FilterSpecification);
  }

  const parts: FilterSpecification[] = [];
  if (classParts.length === 0) {
    parts.push(["==", ["get", "class_id"], -1]);
  } else if (classParts.length === 1) {
    parts.push(classParts[0]!);
  } else {
    parts.push(["any", ...classParts] as FilterSpecification);
  }

  const province = provinceForPlace(state.place);
  if (province) {
    parts.push(["==", ["get", "province"], province]);
  }
  if (state.hide.includes("permit")) {
    parts.push(["!=", ["get", "permit_gate"], true]);
  }
  if (state.hide.includes("verra")) {
    parts.push(["!=", ["get", "project_overlap"], true]);
  }

  if (parts.length === 1) return parts[0]!;
  return ["all", ...parts] as FilterSpecification;
}

/** Whether a feature matches panel rows (for client-side headline counts). */
export function featureMatchesPanel(
  props: {
    class_id: number;
    elevation_fail?: boolean | null;
    province?: string | null;
    permit_gate?: boolean | null;
    project_overlap?: boolean | null;
  },
  state: PanelState
): boolean {
  const province = provinceForPlace(state.place);
  if (province && props.province !== province) return false;
  if (state.hide.includes("permit") && props.permit_gate === true) return false;
  if (state.hide.includes("verra") && props.project_overlap === true) return false;

  const elevFail = props.elevation_fail === true;
  if (props.class_id === 4 && state.classes.includes(4)) return true;
  if (props.class_id === 5 && state.classes.includes(5)) return true;
  if (props.class_id === 8 && !elevFail && state.classes.includes(8)) return true;
  if (props.class_id === 8 && elevFail && state.elevation) return true;
  return false;
}
