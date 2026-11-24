import type { ChangeLayerMeta } from "./changeLayers";

/** Client-facing layer titles — register codes stay in About / provenance only. */
export function changeLayerTitle(layer: Pick<ChangeLayerMeta, "id" | "title">): string {
  if (layer.id === "mangrove-change") return "Mangrove loss (sample)";
  if (layer.id === "urban-change") return "Built-up nearby (sample)";
  return layer.title
    .replace(/\s*\(Goldberg\s*L4\)/gi, "")
    .replace(/\s*\(Dynamic World[^)]*\)/gi, "")
    .replace(/\s*\(L\d+\)/gi, "")
    .trim();
}

export function changeLayerShort(layerId: string): string {
  if (layerId === "mangrove-change") return "Mangrove loss";
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
  built_dynamic_world: "Built-up land (urban proxy)",
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
