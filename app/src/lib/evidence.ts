import { z } from "zod";

/**
 * Cambodia screen evidence classes (bundle layers/index.json).
 * Adapted from LKA evidence.ts — different vocabulary for a restoration proxy, not ocean accounts.
 */
export const evidenceClassSchema = z.enum([
  "derived_screen",
  "designation_context",
  "project_boundary",
  "observed_government",
  "published",
  "observed_global",
  "stand_in",
  "not_assessed"
]);
export type EvidenceClass = z.infer<typeof evidenceClassSchema>;

export const EVIDENCE_LABEL: Record<EvidenceClass, string> = {
  derived_screen: "Derived screen",
  designation_context: "Designation context",
  project_boundary: "Project boundary",
  observed_government: "Government",
  published: "Published",
  observed_global: "Global product",
  stand_in: "Stand-in",
  not_assessed: "Not assessed"
};

export const EVIDENCE_COLOR: Record<
  EvidenceClass,
  "green" | "blue" | "purple" | "orange" | "grey" | "teal" | "red"
> = {
  derived_screen: "orange",
  designation_context: "blue",
  project_boundary: "purple",
  observed_government: "green",
  published: "blue",
  observed_global: "teal",
  stand_in: "grey",
  not_assessed: "grey"
};

export const EVIDENCE_DESCRIPTION: Record<EvidenceClass, string> = {
  derived_screen:
    "Derived from the offline restoration class screen. Physical / land-cover proxy only — not MoE zoning or clearance.",
  designation_context:
    "Published designation context (for example Ramsar). Cites instruments; never means planting permission.",
  project_boundary:
    "Staged project / registry boundary used for double-counting awareness — not a registry decision.",
  observed_government: "Cambodian government data or law.",
  published: "A peer-reviewed paper or agency report, cited to table or page.",
  observed_global: "A global product clipped to the study area, used for a gap or a cross-check.",
  stand_in: "An outline used where the official boundary is not held. No clearance is implied.",
  not_assessed: "No source is held for this layer in the current bundle."
};

export function parseEvidenceClass(value: string | undefined | null): EvidenceClass | null {
  if (!value) return null;
  const parsed = evidenceClassSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
