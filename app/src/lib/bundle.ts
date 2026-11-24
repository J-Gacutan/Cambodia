import { z } from "zod";
import { assetUrl } from "./env";

/** Single data-access path. Malformed bundles fail here. */

export const manifestSchema = z.object({
  version: z.string(),
  built: z.string(),
  stub: z.boolean(),
  completeness: z.string(),
  public_ready: z.boolean(),
  licence_gate: z.string(),
  product_banner: z.string(),
  crs_geometry: z.string(),
  source_grid: z.string().nullable().optional(),
  resolution_m: z.number().nullable().optional(),
  mmu_ha: z.number(),
  families: z.array(z.string()),
  stats: z
    .object({
      feature_count: z.number(),
      go_features: z.number().optional(),
      caution_features: z.number().optional(),
      go_ha: z.number().optional(),
      caution_ha: z.number().optional()
    })
    .passthrough()
    .optional(),
  notes: z.array(z.string()).optional(),
  path_policy: z.string().optional()
});

export const mapLayerSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.string(),
  file: z.string().regex(/^layers\/[a-z0-9-]+\.geojson$/),
  crs: z.string().optional(),
  suitability_filter: z.array(z.string()).optional(),
  evidence_class: z.string(),
  register_id: z.string(),
  licence_plain: z.string(),
  licence_spdx: z.string().nullable(),
  redistributable: z.boolean(),
  public_ready: z.boolean(),
  default_visible: z.boolean(),
  note: z.string().nullable().optional(),
  stub: z.boolean().optional(),
  flag_role: z.string().optional(),
  classes_included: z.array(z.number()).optional()
});

export const mapLayersSchema = z.array(mapLayerSchema);

export const caseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  place: z.string(),
  lon: z.number(),
  lat: z.number(),
  half_m: z.number(),
  focus: z.number(),
  why: z.string(),
  focus_ha: z.number(),
  override_3_to_2_ha: z.number().optional(),
  window_ha_by_class: z.record(z.number()).optional(),
  map: z.string().optional()
});

export const casesSchema = z.array(caseSchema);

const lonLat = z.tuple([z.number(), z.number()]).rest(z.number());
const ringSchema = z.array(lonLat).min(4);
const polygonSchema = z.object({ type: z.literal("Polygon"), coordinates: z.array(ringSchema).min(1) });
const multiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(ringSchema).min(1)).min(1)
});

const triState = z.union([z.boolean(), z.null()]).optional();

export const featurePropsSchema = z
  .object({
    id: z.string(),
    class_id: z.number().int(),
    class_name: z.string(),
    suitability: z.enum(["go", "caution"]),
    area_ha: z.number(),
    mmu_ha: z.number().optional(),
    province: z.string().nullable().optional(),
    evidence_class: z.string().optional(),
    register_id: z.string().optional(),
    licence_plain: z.string().optional(),
    public_ready: z.boolean().optional(),
    stub: z.boolean().optional(),
    case_id: z.string().optional(),
    place: z.string().optional(),
    note: z.string().optional(),
    product_banner: z.string().optional(),
    permit_gate: triState,
    permit_gate_sources: z.array(z.string()).nullable().optional(),
    // Bundle writes explicit nulls for unknown instruments (v0.3.0 hold-back enrich).
    permit_instrument: z.string().nullable().optional(),
    stop_legal: triState,
    stop_legal_status: z.string().nullable().optional(),
    stop_legal_instrument: z.string().nullable().optional(),
    stop_legal_note: z.string().nullable().optional(),
    project_overlap: triState,
    project_overlap_ids: z.array(z.string()).nullable().optional(),
    project_overlap_note: z.string().nullable().optional(),
    elevation_fail: z.boolean().nullable().optional(),
    elevation_demoted_from_go: z.boolean().optional(),
    flag_sources_complete: z.record(z.boolean()).optional()
  })
  .passthrough();

export const layerGeometrySchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z
    .array(
      z.object({
        type: z.literal("Feature"),
        properties: featurePropsSchema.nullable(),
        geometry: z.union([polygonSchema, multiPolygonSchema])
      })
    )
    .min(1)
});

const pointSchema = z.object({ type: z.literal("Point"), coordinates: lonLat });

/** Context overlays may be polygon or point (e.g. Ramsar gap centroids). */
export const contextGeometrySchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z
    .array(
      z.object({
        type: z.literal("Feature"),
        properties: z.record(z.unknown()).nullable(),
        geometry: z.union([polygonSchema, multiPolygonSchema, pointSchema])
      })
    )
    .min(1)
});

export type Manifest = z.infer<typeof manifestSchema>;
export type MapLayer = z.infer<typeof mapLayerSchema>;
export type CaseStudy = z.infer<typeof caseSchema>;
export type LayerGeometry = z.infer<typeof layerGeometrySchema>;
export type ContextGeometry = z.infer<typeof contextGeometrySchema>;
export type FeatureProps = z.infer<typeof featurePropsSchema>;

const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  const hit = cache.get(path) as Promise<T> | undefined;
  if (hit) return hit;
  const pending = fetch(assetUrl(path)).then(async (response) => {
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return schema.parse(await response.json());
  });
  cache.set(path, pending);
  pending.catch(() => cache.delete(path));
  return pending;
}

export const loadManifest = () => load("manifest.json", manifestSchema);

export const loadMapLayers = (): Promise<MapLayer[]> =>
  loadManifest().then((m) => (m.families.includes("layers") ? load("layers/index.json", mapLayersSchema) : []));

export const loadLayerGeometry = (layer: MapLayer) => load(layer.file, layerGeometrySchema);

export const loadContextGeometry = (layer: MapLayer) => load(layer.file, contextGeometrySchema);

export const loadCases = (): Promise<CaseStudy[] | null> =>
  loadManifest().then((m) => (m.families.includes("cases") ? load("cases/cases.json", casesSchema) : null));

export function isScreenLayer(layer: MapLayer): boolean {
  return layer.id === "go-caution" || layer.kind === "overlay";
}

export function isContextLayer(layer: MapLayer): boolean {
  return layer.kind === "context_overlay" || Boolean(layer.flag_role);
}

export function flagLabel(value: boolean | null | undefined): string {
  if (value === true) return "hit";
  if (value === false) return "no hit (known sources)";
  return "unknown / incomplete coverage";
}

/** Four coastal provinces — approximate bounds for the MVP camera. */
export const CAMBODIA_COAST_BOUNDS: [number, number, number, number] = [102.85, 10.35, 104.55, 11.85];
