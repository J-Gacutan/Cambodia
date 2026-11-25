import type { MapLayer } from "./bundle";

/** Human UI labels for carbon-project layers (keep bundle ids stable). */
const VERRA_TITLES: Record<string, string> = {
  "project-overlap-vcs1748": "Carbon project — Southern Cardamom REDD+ (VCS 1748)",
  "project-overlap-vcs5071": "Carbon project — Mangrove ARR (VCS 5071)",
  "project-overlap-vcs5584": "Carbon project — Krasop Blue Carbon / Mangrove REDD+ (VCS 5584)"
};

export function isVerraLayer(layer: Pick<MapLayer, "id" | "flag_role">): boolean {
  return layer.flag_role === "project_overlap" || layer.id.includes("project-overlap");
}

/** Display title for layer toggles / legend — client terms, not class/MMU jargon. */
export function layerDisplayTitle(layer: MapLayer): string {
  if (VERRA_TITLES[layer.id]) return VERRA_TITLES[layer.id];
  if (isVerraLayer(layer)) {
    return layer.title.replace(/^Project overlap\s*[—–-]?\s*/i, "Carbon project — ");
  }
  if (layer.id === "go-caution" || /GO open land|GO class 8|≥ MMU|CAUTION/i.test(layer.title)) {
    return "Open land and reasons to pause (tide, converted, ponds, height) — sites ≥ 0.5 ha";
  }
  if (layer.id === "mangrove-extent" || layer.flag_role === "extent_context") {
    return "Mangrove extent 2025 (living cover)";
  }
  if (layer.id === "mangrove-change" || layer.flag_role === "change_loss_context") {
    return "Mangrove loss 1996–2025";
  }
  return layer.title
    .replace(/GO class 8\s*±\s*CAUTION class 4/gi, "Open land opportunity ± tide reasons to pause")
    .replace(/≥\s*MMU/gi, "≥ 0.5 ha")
    .replace(/\bMMU\b/gi, "minimum site size");

/** Format project_overlap_ids for inspect (prefer VCS ####). */
export function formatVerraIds(ids: string[] | null | undefined): string {
  if (!ids?.length) return "";
  return ids
    .map((id) => {
      const m = id.match(/vcs[_-]?(\d+)/i);
      return m ? `VCS ${m[1]}` : id;
    })
    .join(", ");
}
