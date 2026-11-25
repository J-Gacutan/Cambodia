/** Plain meanings for click-inspect. Land cover only. */
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
    meaning: "Built-up land. Do not treat as a restoration site."
  },
  2: {
    class_id: 2,
    suitability: "stop",
    label: "STOP: open water",
    meaning: "Open water. Not a planting site on this screen."
  },
  3: {
    class_id: 3,
    suitability: "conserve",
    label: "Existing mangrove: conserve",
    meaning: "Living mangrove now. Conserve it — not a restoration GO."
  },
  4: {
    class_id: 4,
    suitability: "caution",
    label: "CAUTION: tide / mudflat",
    meaning: "Tide flat or mudflat. Do not plant here; natural recovery only after a water check on site."
  },
  5: {
    class_id: 5,
    suitability: "caution",
    label: "CAUTION: converted land",
    meaning: "Former mangrove now used for something else. Check use and rights before planting or claiming restoration."
  },
  6: {
    class_id: 6,
    suitability: "go",
    label: "GO: inactive pond",
    meaning: "Inactive pond on former mangrove. Worth a field visit (land cover only)."
  },
  7: {
    class_id: 7,
    suitability: "caution",
    label: "CAUTION: active pond",
    meaning: "Active or on-and-off pond. Check who uses it and what rights apply before any restoration claim."
  },
  8: {
    class_id: 8,
    suitability: "go",
    label: "GO: open land",
    meaning: "Open land that was once mangrove. Worth a field visit — not zoning or planting permission."
  },
  9: {
    class_id: 9,
    suitability: "caution",
    label: "CAUTION: history unproven",
    meaning: "Inside the habitat area without proven historic mangrove under the history rule."
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
