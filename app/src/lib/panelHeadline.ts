/**
 * Settled Interpretation copy for the Read panel — short prose, same facts.
 */

import type { DrawnClassId, PanelState } from "./panelState";
import { placeLabel } from "./panelState";

export const GO_ONCE = "GO means worth a field look.";
export const CLAIM_CEILING =
  "Physical and land-cover only. Not MoE zoning, tenure clearance, planting permission, or a carbon outcome.";
export const CLASS_RULE_V03 = "Classes 4, 5, and 8. Legal STOP not assessed.";
export const LEGAL_STOP_NOT_ASSESSED =
  "Not assessed. MoE protected-area core zones. Do not infer from an IUCN category.";
export const PONDS_NOT_IN_PACK =
  "Not in this pack. Pond geometries stay off the public bundle.";
export const CASE_B_MISSING =
  "Case B is not in this pack. It would show open water that overrides a first mangrove reading. Name that gap when you brief — do not invent a Case B window from this console.";
export const EMPTY_SHORTLIST = "No patches kept.";
export const EMPTY_MAP =
  "No patches match these rows. Turn a class back on, or clear a hide.";

const CLASS_PHRASE: Record<DrawnClassId, string> = {
  4: "class 4",
  5: "class 5",
  8: "class 8"
};

function formatCount(n: number): string {
  return n.toLocaleString("en-AU");
}

function drawnClassBits(state: PanelState): string[] {
  const bits: string[] = [];
  const sorted = [...state.classes].sort((a, b) => a - b);
  for (const id of sorted) bits.push(CLASS_PHRASE[id]);
  if (state.elevation) bits.push("elevation failures");
  return bits;
}

function joinEnglish(bits: string[]): string {
  if (bits.length === 0) return "";
  if (bits.length === 1) return bits[0]!;
  if (bits.length === 2) return `${bits[0]} and ${bits[1]}`;
  return `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;
}

function placeLead(place: string): string {
  if (/^four coastal provinces$/i.test(place.trim())) {
    return "Across the four coastal provinces";
  }
  return `In ${place}`;
}

export type HeadlineCounts = {
  patches: number;
  hectares: number;
};

export type HeadlineInput = {
  state: PanelState;
  counts: HeadlineCounts;
  bundleVersion: string;
  /** Case place line when a case preset is active. */
  casePlaceLine?: string | null;
  /** When place is a single province and class 8 only — optional tighter middle clause. */
  class8OnlyOpenCover?: boolean;
};

/**
 * Panel Interpretation. Legal STOP is the only "not assessed" clause on this pin.
 * One or two skim sentences: place, what is drawn, counts, pack version, GO, legal STOP.
 */
export function buildPanelHeadline(input: HeadlineInput): string {
  const place = placeLabel(input.state.place, input.casePlaceLine);
  const lead = placeLead(place);
  const patches = formatCount(input.counts.patches);
  const ha = formatCount(Math.round(input.counts.hectares));
  const pack = input.bundleVersion;
  const closing =
    "GO means worth a field look; legal STOP is not assessed on this pack.";

  const class8Only =
    input.class8OnlyOpenCover &&
    input.state.classes.length === 1 &&
    input.state.classes[0] === 8 &&
    !input.state.elevation;

  if (class8Only) {
    return `${lead}, class 8 — historic mangrove now open cover — shows ${patches} patches covering about ${ha} hectares, counted from pack ${pack}. ${closing}`;
  }

  const bits = drawnClassBits(input.state);
  if (bits.length === 0) {
    return `${lead}, no classes are drawn right now (0 patches from pack ${pack}). ${closing}`;
  }

  const drawn = joinEnglish(bits);
  const verb = bits.length === 1 ? "is" : "are";
  return `${lead}, ${drawn} ${verb} drawn — ${patches} patches covering about ${ha} hectares, counted from pack ${pack}. ${closing}`;
}

/** Per-patch inspect sentence — same facts, short prose, one-decimal hectares. */
export function buildPatchHeadline(input: {
  province: string | null;
  classId: number;
  areaHa: number;
  suitability: "go" | "caution";
  elevationFail: boolean | null | undefined;
  /** Class meaning middle clause from classMeaning.ts. */
  classMeaning: string | null;
}): string {
  const lead = placeLead(input.province ?? "Four coastal provinces");
  const middle =
    input.classMeaning ??
    (input.classId === 8
      ? "class 8 — historic mangrove now open cover"
      : `class ${input.classId}`);
  const mid = middle.replace(/^Class\b/, "class");
  const ha = input.areaHa.toFixed(1);
  const goOrHold =
    input.suitability === "go"
      ? "It is worth a field look"
      : "It is held back on this screen";
  const assessedGap =
    input.elevationFail == null
      ? "elevation and legal STOP are not assessed on this patch"
      : "legal STOP is not assessed on this patch";
  return `${lead}, this patch is ${mid} (${ha} hectares). ${goOrHold}; ${assessedGap}.`;
}
