/** Note 3b class meanings for click-inspect. Physical / land-cover only. */
export type ClassMeaning = {
  class_id: number;
  suitability: "go" | "caution" | "stop" | "conserve";
  label: string;
  meaning: string;
};

export const CLASS_MEANINGS: Record<number, ClassMeaning> = {
  1: {
    class_id: 1,
    suitability: "stop",
    label: "STOP: built-up",
    meaning: "Built-up on the screen. Do not treat as a restoration site."
  },
  2: {
    class_id: 2,
    suitability: "stop",
    label: "STOP: open water",
    meaning: "Open water (including water override of first-pass mangrove). Not a planting site on this screen."
  },
  3: {
    class_id: 3,
    suitability: "conserve",
    label: "Existing mangrove: conserve",
    meaning: "Current mangrove stock. Conserve; not a restoration GO."
  },
  4: {
    class_id: 4,
    suitability: "caution",
    label: "CAUTION: tidal flat",
    meaning: "Tidal flat. No planting on mudflats; natural recruitment only after a hydrology check."
  },
  5: {
    class_id: 5,
    suitability: "caution",
    label: "CAUTION: other converted",
    meaning: "Converted use on historic mangrove. Needs a named check before planting or claiming restoration."
  },
  6: {
    class_id: 6,
    suitability: "go",
    label: "GO: inactive pond",
    meaning: "Inactive pond on historic mangrove. Worth a field look (physical suitability only)."
  },
  7: {
    class_id: 7,
    suitability: "caution",
    label: "CAUTION: active pond",
    meaning: "Active or intermittent pond. Needs tenure / use check before any restoration claim."
  },
  8: {
    class_id: 8,
    suitability: "go",
    label: "GO: open or accreted land",
    meaning: "Open or accreted land on historic mangrove. Worth a field look — not MoE zoning or planting permission."
  },
  9: {
    class_id: 9,
    suitability: "caution",
    label: "CAUTION: history unproven",
    meaning: "Inside the habitat mask without proven historic mangrove under the H rule."
  },
  10: {
    class_id: 10,
    suitability: "stop",
    label: "STOP: outside tidal frame",
    meaning: "Outside the tidal / habitat frame. Not a surveyed restoration finding."
  }
};

export function meaningForClass(classId: number | null | undefined): ClassMeaning | null {
  if (classId == null || !Number.isFinite(classId)) return null;
  return CLASS_MEANINGS[classId] ?? null;
}

export function suitabilityLabel(value: string | null | undefined): string {
  if (value === "go") return "GO";
  if (value === "caution") return "CAUTION";
  if (value === "stop") return "STOP";
  return value ?? "unknown";
}
