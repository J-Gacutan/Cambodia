import { z } from "zod";

/** Change-screen layers live under public/change-stubs/ (Vite publicDir) — outside the open-cleared pin. */
const changeAssetUrl = (path: string) => `${import.meta.env.BASE_URL}change-stubs/${path}`;

const changeLayerSchema = z.object({
  id: z.string(),
  file: z.string(),
  title: z.string(),
  register_id: z.string(),
  feature_count: z.number().optional(),
  stub: z.boolean(),
  note: z.string().optional(),
  driver_codes: z.record(z.string()).optional(),
  /** Native source cell size in metres when known (before stub generalisation). */
  native_resolution_m: z.number().optional(),
  /** Approximate display scale after stub simplify / MMU (metres). */
  display_resolution_m: z.number().optional(),
  /** Honest one-liner for the UI about coarseness. */
  resolution_plain: z.string().optional(),
  /** Which “current state” facet this layer supports: extent | condition | change. */
  state_role: z.enum(["extent", "condition", "change"]).optional()
});

const changeIndexSchema = z.object({
  version: z.string(),
  licence: z.string(),
  public_ready: z.boolean(),
  not_in_open_cleared_pin: z.boolean().optional(),
  layers: z.array(changeLayerSchema),
  data_needs: z.array(z.string()).optional(),
  /** Facets of mangrove “current state” that are missing on Locate. */
  state_gaps: z
    .array(
      z.object({
        facet: z.enum(["extent", "condition", "change"]),
        status: z.enum(["missing", "partial", "sample"]),
        plain: z.string()
      })
    )
    .optional(),
  resolution_plain: z.string().optional()
});

export type ChangeLayerMeta = z.infer<typeof changeLayerSchema>;
export type ChangeIndex = z.infer<typeof changeIndexSchema>;

export async function loadChangeIndex(): Promise<ChangeIndex> {
  const res = await fetch(changeAssetUrl("index.json"));
  if (!res.ok) throw new Error(`change-stubs index HTTP ${res.status}`);
  return changeIndexSchema.parse(await res.json());
}

export async function loadChangeGeometry(file: string): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(changeAssetUrl(file));
  if (!res.ok) throw new Error(`change-stubs/${file} HTTP ${res.status}`);
  const data = (await res.json()) as GeoJSON.FeatureCollection;
  if (data.type !== "FeatureCollection") throw new Error(`change-stubs/${file}: not a FeatureCollection`);
  return data;
}
