/**
 * Settled headline for the Read panel — fixed phrase order from module 11.
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
  "Case B is not in this pack. It is the open-water override of first-pass mangrove (class 2). The rule order is in Note 3b.";
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

function drawnClassClause(state: PanelState): string {
  const bits: string[] = [];
  const sorted = [...state.classes].sort((a, b) => a - b);
  for (const id of sorted) bits.push(CLASS_PHRASE[id]);
  if (state.elevation) bits.push("elevation failures");
  if (bits.length === 0) return "No classes drawn";
  if (bits.length === 1) return bits[0]!.replace(/^./, (c) => c.toUpperCase());
  if (bits.length === 2) return `${bits[0]} and ${bits[1]}`.replace(/^./, (c) => c.toUpperCase());
  return `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`.replace(/^./, (c) =>
    c.toUpperCase()
  );
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
 * Panel headline. Legal STOP is the only "not assessed" clause on this pin.
 */
export function buildPanelHeadline(input: HeadlineInput): string {
  const place = placeLabel(input.state.place, input.casePlaceLine);
  const drawn =
    input.class8OnlyOpenCover &&
    input.state.classes.length === 1 &&
    input.state.classes[0] === 8 &&
    !input.state.elevation
      ? "Class 8, historic mangrove now open cover"
      : drawnClassClause(input.state);
  const patches = formatCount(input.counts.patches);
  const ha = formatCount(Math.round(input.counts.hectares));
  return [
    `${place}.`,
    `${drawn}.`,
    `${patches} patches, ${ha} hectares.`,
    `Counted from bundle ${input.bundleVersion}.`,
    GO_ONCE,
    "Legal STOP not assessed."
  ].join(" ");
}

/** Per-patch inspect sentence — same phrase order, one-decimal hectares. */
export function buildPatchHeadline(input: {
  province: string | null;
  classId: number;
  areaHa: number;
  suitability: "go" | "caution";
  elevationFail: boolean | null | undefined;
  /** Class meaning middle clause from classMeaning.ts. */
  classMeaning: string | null;
}): string {
  const place = input.province ?? "Four coastal provinces";
  const middle =
    input.classMeaning ??
    (input.classId === 8
      ? "Class 8, historic mangrove now open cover"
      : `Class ${input.classId}`);
  const ha = input.areaHa.toFixed(1);
  const goOrHold =
    input.suitability === "go" ? "Worth a field look." : "Held back on this screen.";
  const assessedGap =
    input.elevationFail == null
      ? "Elevation and legal STOP not assessed on this patch."
      : "Legal STOP not assessed on this patch.";
  return `${place}. ${middle}. ${ha} hectares. ${goOrHold} ${assessedGap}`;
}
