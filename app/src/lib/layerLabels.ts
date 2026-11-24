import type { MapLayer } from "./bundle";

/** Human UI labels for VERRA project-overlap layers (keep bundle ids stable). */
const VERRA_TITLES: Record<string, string> = {
  "project-overlap-vcs1748": "VERRA — Southern Cardamom REDD+ (VCS 1748)",
  "project-overlap-vcs5071": "VERRA — Mangrove ARR (VCS 5071)",
  "project-overlap-vcs5584": "VERRA — Krasop Blue Carbon / Mangrove REDD+ (VCS 5584)"
};

export function isVerraLayer(layer: Pick<MapLayer, "id" | "flag_role">): boolean {
  return layer.flag_role === "project_overlap" || layer.id.includes("project-overlap");
}

/** Display title for layer toggles / legend — VERRA wording, not “Project overlap”. */
export function layerDisplayTitle(layer: MapLayer): string {
  if (VERRA_TITLES[layer.id]) return VERRA_TITLES[layer.id];
  if (isVerraLayer(layer)) {
    return layer.title.replace(/^Project overlap\s*[—–-]?\s*/i, "VERRA — ");
  }
  return layer.title;
}

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
