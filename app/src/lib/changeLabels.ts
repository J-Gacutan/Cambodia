import type { ChangeLayerMeta } from "./changeLayers";

/** Client-facing layer titles — register codes stay in About / provenance only. */
export function changeLayerTitle(layer: Pick<ChangeLayerMeta, "id" | "title">): string {
  if (layer.id === "mangrove-extent") return "Mangrove extent 2025 (living cover)";
  if (layer.id === "mangrove-change") return "Mangrove loss 1996–2025";
  if (layer.id === "mangrove-gain") return "Mangrove gain 1996–2025";
  if (layer.id === "urban-change") return "Built-up nearby (sample)";
  return layer.title
    .replace(/\s*\(Goldberg\s*L4\)/gi, "")
    .replace(/\s*\(Dynamic World[^)]*\)/gi, "")
    .replace(/\s*\(L\d+\)/gi, "")
    .trim();
}

export function changeLayerShort(layerId: string): string {
  if (layerId === "mangrove-extent") return "Extent 2025";
  if (layerId === "mangrove-change") return "Loss 1996–2025";
  if (layerId === "mangrove-gain") return "Gain 1996–2025";
  if (layerId === "urban-change") return "Built-up";
  return layerId;
}

const LOSS_DRIVER_LABELS: Record<string, string> = {
  erosion: "Erosion",
  extreme_weather: "Extreme weather",
  commodities: "Commodities / conversion",
  settlement: "Settlement",
  non_productive: "Non-productive conversion",
  other_or_unmapped: "Other or unmapped"
};

const CLASS_LABELS: Record<string, string> = {
  ...LOSS_DRIVER_LABELS,
  mangrove_extent_2025: "Living mangrove (2025 cover)",
  gmw_loss_1996_2025: "Lost since 1996 (absent in 2025)",
  gmw_gain_1996_2025: "Gained since 1996 (present in 2025)",
  built_dynamic_world: "Built-up land (urban sample)",
  built: "Built-up land"
};

/** Plain-language class / driver name for inspect — never L4/L10 codes. */
export function changeClassLabel(
  classLabel: string | undefined,
  driverCodes?: Record<string, string>
): string {
  if (!classLabel) return "Not labelled";
  if (CLASS_LABELS[classLabel]) return CLASS_LABELS[classLabel]!;
  const fromCodes = driverCodes
    ? Object.values(driverCodes).find((v) => v === classLabel)
    : undefined;
  if (fromCodes && LOSS_DRIVER_LABELS[fromCodes]) return LOSS_DRIVER_LABELS[fromCodes]!;
  return classLabel.replace(/_/g, " ");
}

export type ChangeInspect = {
  layerId: string;
  layerTitle: string;
  id: string;
  classLabel: string;
  classPlain: string;
  areaHa: number | null;
  note: string | null;
  resolutionPlain: string | null;
  lng: number;
  lat: number;
};

export function parseChangeFeature(
  layer: ChangeLayerMeta,
  props: Record<string, unknown>,
  lng: number,
  lat: number
): ChangeInspect {
  const classLabel = props.class_label != null ? String(props.class_label) : "";
  const areaRaw = props.area_ha_approx;
  const areaHa = typeof areaRaw === "number" && Number.isFinite(areaRaw) ? areaRaw : null;
  return {
    layerId: layer.id,
    layerTitle: changeLayerTitle(layer),
    id: String(props.id ?? "—"),
    classLabel,
    classPlain: changeClassLabel(classLabel, layer.driver_codes),
    areaHa,
    note:
      props.note != null
        ? String(props.note)
            .replace(/\bL\d+\b/g, "")
            .replace(/\s{2,}/g, " ")
            .trim()
        : null,
    resolutionPlain: layer.resolution_plain ?? null,
    lng,
    lat
  };
}

export function stripRegisterCodes(text: string): string {
  return text.replace(/\bL\d+\b/g, "").replace(/\s{2,}/g, " ").trim();
}

/** Skim Interpretation for Locate — same tone as the Read panel headline. */
export function buildLocateHeadline(input: {
  layerOn: Record<string, boolean>;
  resolutionPlain?: string | null;
}): string {
  const bits: string[] = [];
  if (input.layerOn["mangrove-extent"]) bits.push("2025 mangrove extent");
  if (input.layerOn["mangrove-change"]) bits.push("loss since 1996");
  if (input.layerOn["mangrove-gain"]) bits.push("gain since 1996");
  if (input.layerOn["urban-change"]) bits.push("built-up nearby");
  const drawn =
    bits.length === 0
      ? "no mangrove layers"
      : bits.length === 1
        ? bits[0]!
        : bits.length === 2
          ? `${bits[0]} and ${bits[1]}`
          : `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;
  const scale =
    input.resolutionPlain?.trim() ||
    "These layers are generalised and fade as you zoom so they do not look like site-level data.";
  return `Across the four coastal provinces, this Locate view shows ${drawn}. Mangrove health is not assessed on this pack. ${scale}`;
}
