import {
  Button,
  Checkbox,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Title
} from "@patternfly/react-core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { DriverInfo } from "../common/DriverInfo";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { LayerProvenance } from "../common/LayerProvenance";
import {
  CAMBODIA_COAST_BOUNDS,
  flagLabel,
  isContextLayer,
  isScreenLayer,
  loadCases,
  loadContextGeometry,
  loadLayerGeometry,
  loadManifest,
  loadMapLayers,
  type CaseStudy,
  type FeatureProps,
  type MapLayer
} from "../lib/bundle";
import {
  CAUTION_DRIVERS,
  DRIVER_BY_ID,
  driversForFeature,
  type CautionDriverId
} from "../lib/cautionDrivers";
import { meaningForClass } from "../lib/classMeaning";
import { parseEvidenceClass } from "../lib/evidence";
import { formatVerraIds, isVerraLayer, layerDisplayTitle } from "../lib/layerLabels";
import {
  CASE_B_MISSING,
  CLAIM_CEILING,
  CLASS_RULE_V03,
  EMPTY_MAP,
  EMPTY_SHORTLIST,
  GO_ONCE,
  LEGAL_STOP_NOT_ASSESSED,
  PONDS_NOT_IN_PACK,
  buildPanelHeadline,
  buildPatchHeadline
} from "../lib/panelHeadline";
import {
  PLACE_OPTIONS,
  buildScreenFilter,
  featureMatchesPanel,
  panelStateFromHash,
  panelStateToHashQuery,
  presetCaseA,
  presetCaseC,
  presetCoast,
  presetFieldLook,
  type DrawnClassId,
  type PanelPreset,
  type PanelState,
  type PlaceId
} from "../lib/panelState";
import {
  downloadText,
  featureToShortlist,
  geometryBounds,
  loadShortlistFromStorage,
  saveShortlistToStorage,
  shortlistToCsv,
  shortlistToGeoJson,
  type ShortlistItem
} from "../lib/shortlist";
import { useBundle } from "../lib/useBundle";
import {
  ATTRIBUTION,
  applyBasemapChoice,
  collapseAttribution,
  loadDualBasemapStyle,
  mapHasDualBasemap,
  preloadStreetsBasemap,
  rememberDualBasemap,
  type BasemapChoice,
  type BasemapKind
} from "../map/basemap";
import { BasemapControl } from "../map/BasemapControl";
import {
  EXTENT_CONTEXT_FILL,
  EXTENT_CONTEXT_LINE,
  GAP_MARKER_CIRCLE,
  GO_CAUTION_FILL,
  GO_CAUTION_LINE,
  LOSS_CONTEXT_FILL,
  LOSS_CONTEXT_LINE,
  PERMIT_CONTEXT_FILL,
  PERMIT_CONTEXT_LINE,
  PROJECT_OVERLAP_FILL,
  PROJECT_OVERLAP_LINE
} from "../map/mapTheme";
import { SUITABILITY } from "../theme/colours";

const SOURCE_ID = "khm-go-caution";
const FILL_ID = "khm-go-caution-fill";
const LINE_ID = "khm-go-caution-line";

function isContextOverlayOn(contextOn: Record<string, boolean>, layerId: string): boolean {
  return contextOn[layerId] === true;
}

function restackScreenAboveContextFills(map: maplibregl.Map, contextLayers: MapLayer[]): void {
  if (!map.getLayer(FILL_ID)) return;
  for (const layer of contextLayers) {
    const fillId = `khm-ctx-${layer.id}-fill`;
    if (map.getLayer(fillId)) map.moveLayer(fillId, FILL_ID);
  }
  if (map.getLayer(FILL_ID)) map.moveLayer(FILL_ID);
  if (map.getLayer(LINE_ID)) map.moveLayer(LINE_ID);
  for (const layer of contextLayers) {
    const lineId = `khm-ctx-${layer.id}-line`;
    const circleId = `khm-ctx-${layer.id}-circle`;
    if (map.getLayer(lineId)) map.moveLayer(lineId);
    if (map.getLayer(circleId)) map.moveLayer(circleId);
  }
}

type Inspect = { props: FeatureProps; lng: number; lat: number };

function metersToHalfDeg(halfM: number, lat: number): { dLon: number; dLat: number } {
  const dLat = halfM / 111_320;
  const dLon = halfM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { dLon, dLat };
}

function caseBounds(c: CaseStudy): [number, number, number, number] {
  const { dLon, dLat } = metersToHalfDeg(c.half_m, c.lat);
  return [c.lon - dLon, c.lat - dLat, c.lon + dLon, c.lat + dLat];
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="khm-key-row">
      <span className="khm-key-swatch" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

function parseFeatureProps(raw: Record<string, unknown>): FeatureProps {
  return {
    ...(raw as FeatureProps),
    id: String(raw.id ?? ""),
    class_id: Number(raw.class_id),
    class_name: String(raw.class_name ?? ""),
    suitability: raw.suitability === "go" ? "go" : "caution",
    area_ha: Number(raw.area_ha),
    province: (raw.province as string | null | undefined) ?? null,
    place: raw.place != null ? String(raw.place) : undefined,
    note: raw.note != null ? String(raw.note) : undefined,
    stub: Boolean(raw.stub),
    permit_gate: raw.permit_gate === true ? true : raw.permit_gate === false ? false : null,
    stop_legal: raw.stop_legal === true ? true : raw.stop_legal === false ? false : null,
    stop_legal_status: raw.stop_legal_status != null ? String(raw.stop_legal_status) : undefined,
    stop_legal_instrument:
      raw.stop_legal_instrument != null ? String(raw.stop_legal_instrument) : undefined,
    stop_legal_note: raw.stop_legal_note != null ? String(raw.stop_legal_note) : undefined,
    permit_instrument: raw.permit_instrument != null ? String(raw.permit_instrument) : undefined,
    project_overlap:
      raw.project_overlap === true ? true : raw.project_overlap === false ? false : null,
    project_overlap_ids: Array.isArray(raw.project_overlap_ids)
      ? (raw.project_overlap_ids as string[])
      : null,
    project_overlap_note:
      raw.project_overlap_note != null ? String(raw.project_overlap_note) : undefined,
    elevation_fail:
      raw.elevation_fail === true ? true : raw.elevation_fail === false ? false : null
  };
}

function contextStyle(layer: MapLayer): {
  fill?: typeof PERMIT_CONTEXT_FILL;
  line?: typeof PERMIT_CONTEXT_LINE;
  circle?: typeof GAP_MARKER_CIRCLE;
} {
  if (isVerraLayer(layer)) return { fill: PROJECT_OVERLAP_FILL, line: PROJECT_OVERLAP_LINE };
  if (layer.flag_role === "extent_context" || layer.id === "mangrove-extent") {
    return { fill: EXTENT_CONTEXT_FILL, line: EXTENT_CONTEXT_LINE };
  }
  if (layer.flag_role === "change_loss_context" || layer.id === "mangrove-change") {
    return { fill: LOSS_CONTEXT_FILL, line: LOSS_CONTEXT_LINE };
  }
  if (layer.flag_role === "permit_gap_marker" || layer.id.includes("gap")) {
    return { circle: GAP_MARKER_CIRCLE };
  }
  return { fill: PERMIT_CONTEXT_FILL, line: PERMIT_CONTEXT_LINE };
}

function isRamsarLayer(layer: MapLayer): boolean {
  return (
    layer.flag_role === "permit_context" ||
    layer.flag_role === "permit_gap_marker" ||
    layer.id.includes("ramsar")
  );
}

const PRESET_OPTIONS: {
  id: PanelPreset;
  label: string;
  description: string;
}[] = [
  {
    id: "coast",
    label: "Four provinces",
    description: "Reset filters and zoom out to all four coastal provinces."
  },
  {
    id: "A",
    label: "Case A — open land (GO)",
    description: "Zoom to the Peam Krasaop example. Shows open former mangrove worth a field look."
  },
  {
    id: "C",
    label: "Case C — tide / mudflat",
    description: "Zoom to the Preah Sihanouk / Kampot example. Shows tidal flats to pause on — do not plant."
  },
  {
    id: "field",
    label: "Field look, no known flag hit",
    description:
      "Keep your current place. Show only open (GO) patches and hide known permit / project flag hits."
  }
];

const NEXT_CHECKS: { check: string; source: string; onPack: string }[] = [
  {
    check: "Hydrology and natural recruitment on flats",
    source: "Note 3b class 4. Murray Global Intertidal Change",
    onPack: "The CAUTION reading for class 4. Not a planting clearance."
  },
  {
    check: "Elevation against highest astronomical tide",
    source: "L12 DeltaDTM against L13 FES2022",
    onPack: "Filled. A true flag demotes class 8. Still a screen, not a survey."
  },
  {
    check: "MoE core zone",
    source: "MoE protected-area core zones",
    onPack: "Not assessed. Do not infer from an IUCN category."
  },
  { check: "Tenure willingness", source: "Not held", onPack: "Not held." },
  { check: "Carbon outcome", source: "Not held", onPack: "Not held. Do not report tonnes." }
];

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const [basemapChoice, setBasemapChoice] = useState<BasemapChoice>("streets");
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(
    () => !window.matchMedia("(max-width: 47.9375rem)").matches
  );
  const [panel, setPanel] = useState<PanelState>(() => panelStateFromHash(window.location.hash));
  const [placeOpen, setPlaceOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [contextOn, setContextOn] = useState<Record<string, boolean>>({});
  const contextOnRef = useRef(contextOn);
  contextOnRef.current = contextOn;
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>(() => loadShortlistFromStorage());
  const [screenFc, setScreenFc] = useState<GeoJSON.FeatureCollection | null>(null);
  const basemapChoiceRef = useRef(basemapChoice);
  basemapChoiceRef.current = basemapChoice;
  const basemapControlRef = useRef<BasemapControl | null>(null);
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const skipHashWrite = useRef(false);

  useEffect(() => {
    saveShortlistToStorage(shortlist);
  }, [shortlist]);

  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const cases = useBundle(loadCases);
  const geometryCache = useRef<Map<string, GeoJSON.FeatureCollection>>(new Map());

  const screenLayer = useMemo(
    () => layers.data?.find((l) => l.id === "go-caution") ?? layers.data?.find(isScreenLayer),
    [layers.data]
  );
  const contextLayers = useMemo(
    () => (layers.data ?? []).filter((l) => l.id !== screenLayer?.id && isContextLayer(l)),
    [layers.data, screenLayer?.id]
  );

  const activeCase = useMemo(() => {
    if (!panel.caseId || !cases.data) return null;
    return cases.data.find((c) => c.id === panel.caseId) ?? null;
  }, [panel.caseId, cases.data]);

  const counts = useMemo(() => {
    if (!screenFc) return { patches: 0, hectares: 0 };
    let patches = 0;
    let hectares = 0;
    for (const feature of screenFc.features) {
      const props = parseFeatureProps((feature.properties ?? {}) as Record<string, unknown>);
      if (!featureMatchesPanel(props, panel)) continue;
      patches += 1;
      hectares += Number.isFinite(props.area_ha) ? props.area_ha : 0;
    }
    return { patches, hectares };
  }, [screenFc, panel]);

  const rowCounts = useMemo(() => {
    const empty = { patches: 0, hectares: 0 };
    if (!screenFc) {
      return { tidal: empty, converted: empty, open: empty, elevation: empty, permit: empty, verra: empty };
    }
    const province = PLACE_OPTIONS.find((r) => r.id === panel.place)?.province ?? null;
    const tally = (pred: (p: FeatureProps) => boolean) => {
      let patches = 0;
      let hectares = 0;
      for (const feature of screenFc.features) {
        const props = parseFeatureProps((feature.properties ?? {}) as Record<string, unknown>);
        if (province && props.province !== province) continue;
        if (!pred(props)) continue;
        patches += 1;
        hectares += Number.isFinite(props.area_ha) ? props.area_ha : 0;
      }
      return { patches, hectares };
    };
    return {
      tidal: tally((p) => p.class_id === 4),
      converted: tally((p) => p.class_id === 5),
      open: tally((p) => p.class_id === 8 && p.elevation_fail !== true),
      elevation: tally((p) => p.class_id === 8 && p.elevation_fail === true),
      permit: tally((p) => p.permit_gate === true),
      verra: tally((p) => p.project_overlap === true)
    };
  }, [screenFc, panel.place]);

  const bundleVersion = manifest.data?.version ?? "v0.3.0";
  const casePlaceLine =
    panel.preset === "A" || panel.preset === "C" ? (activeCase ? activeCase.place : null) : null;

  const headline = buildPanelHeadline({
    state: panel,
    counts,
    bundleVersion,
    casePlaceLine,
    class8OnlyOpenCover: panel.classes.length === 1 && panel.classes[0] === 8 && !panel.elevation
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (announceRef.current) announceRef.current.textContent = headline;
    }, 500);
    return () => window.clearTimeout(t);
  }, [headline]);

  const writeHash = (next: PanelState) => {
    skipHashWrite.current = true;
    const href = panelStateToHashQuery(next);
    if (window.location.hash !== href) {
      window.history.replaceState(null, "", href);
    }
    window.setTimeout(() => {
      skipHashWrite.current = false;
    }, 0);
  };

  const applyPanel = (next: PanelState, opts?: { fitCase?: CaseStudy | null; fitCoast?: boolean }) => {
    setPanel(next);
    writeHash(next);
    if (opts?.fitCoast) {
      mapRef.current?.fitBounds(
        [
          [CAMBODIA_COAST_BOUNDS[0], CAMBODIA_COAST_BOUNDS[1]],
          [CAMBODIA_COAST_BOUNDS[2], CAMBODIA_COAST_BOUNDS[3]]
        ],
        { padding: 24, duration: 600 }
      );
    }
    if (opts?.fitCase) {
      const c = opts.fitCase;
      const [w, s, e, n] = caseBounds(c);
      mapRef.current?.fitBounds(
        [
          [w, s],
          [e, n]
        ],
        { padding: 32, duration: 600 }
      );
    }
  };

  useEffect(() => {
    if (!contextLayers.length) return;
    setContextOn((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const layer of contextLayers) {
        const want =
          (isVerraLayer(layer) && panel.overlay.includes("verra")) ||
          (isRamsarLayer(layer) && panel.overlay.includes("ramsar"));
        if (next[layer.id] !== want) {
          next[layer.id] = want;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [contextLayers, panel.overlay]);

  useEffect(() => {
    const onHash = () => {
      if (skipHashWrite.current) return;
      if (!window.location.hash.startsWith("#map")) return;
      const next = panelStateFromHash(window.location.hash);
      setPanel(next);
      if (next.caseId && cases.data) {
        const c = cases.data.find((row) => row.id === next.caseId);
        if (c && mapRef.current) {
          const [w, s, e, n] = caseBounds(c);
          mapRef.current.fitBounds(
            [
              [w, s],
              [e, n]
            ],
            { padding: 32, duration: 600 }
          );
        }
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [cases.data]);

  useEffect(() => {
    let cancelled = false;
    void preloadStreetsBasemap();
    loadDualBasemapStyle(basemapChoiceRef.current).then(({ style, kind: loadedKind, streetsKind }) => {
      if (cancelled || !container.current) return;
      setKind(loadedKind);
      const map = new maplibregl.Map({
        container: container.current,
        style,
        attributionControl: false,
        bounds: CAMBODIA_COAST_BOUNDS,
        fitBoundsOptions: { padding: 24 }
      });
      rememberDualBasemap(map, style, streetsKind);
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      const basemapCtrl = new BasemapControl(basemapChoiceRef.current, (nextBm) =>
        setBasemapChoice(nextBm)
      );
      basemapControlRef.current = basemapCtrl;
      map.addControl(basemapCtrl, "top-left");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-left");
      map.addControl(
        new maplibregl.AttributionControl({ compact: true, customAttribution: ATTRIBUTION.bundle })
      );
      collapseAttribution(map);
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      map.on("click", FILL_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature?.properties) return;
        const props = parseFeatureProps(feature.properties as Record<string, unknown>);
        setInspect({ props, lng: event.lngLat.lng, lat: event.lngLat.lat });
        setPanelOpen(true);
        window.requestAnimationFrame(() => {
          headlineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      });
      map.on("click", (event) => {
        if (!map.getLayer(FILL_ID)) return;
        const hits = map.queryRenderedFeatures(event.point, { layers: [FILL_ID] });
        if (!hits.length) setInspect(null);
      });
      map.on("mouseenter", FILL_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FILL_ID, () => {
        map.getCanvas().style.cursor = "";
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = undefined;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    basemapControlRef.current?.setChoice(basemapChoice);
    const map = mapRef.current;
    if (!ready || !map || !mapHasDualBasemap(map)) return;
    setKind(applyBasemapChoice(map, basemapChoice));
    collapseAttribution(map);
  }, [basemapChoice, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !screenLayer) return;
    let cancelled = false;
    loadLayerGeometry(screenLayer).then((raw) => {
      if (cancelled || mapRef.current !== map) return;
      const fc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: raw.features.map((feature) => {
          const props = parseFeatureProps((feature.properties ?? {}) as Record<string, unknown>);
          const drivers = driversForFeature(props);
          return {
            ...feature,
            properties: {
              ...feature.properties,
              driver_ids: drivers.join("|"),
              has_tidal: drivers.includes("tidal"),
              has_tenure: drivers.includes("tenure"),
              has_verra: drivers.includes("verra"),
              has_converted: drivers.includes("converted"),
              has_elevation: drivers.includes("elevation")
            }
          };
        })
      };
      geometryCache.current.set(screenLayer.id, fc);
      setScreenFc(fc);
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: fc });
        map.addLayer({ id: FILL_ID, type: "fill", source: SOURCE_ID, paint: GO_CAUTION_FILL });
        map.addLayer({ id: LINE_ID, type: "line", source: SOURCE_ID, paint: GO_CAUTION_LINE });
      } else {
        (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(fc);
      }
      const filter = buildScreenFilter(panelRef.current);
      if (map.getLayer(FILL_ID)) map.setFilter(FILL_ID, filter);
      if (map.getLayer(LINE_ID)) map.setFilter(LINE_ID, filter);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, screenLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !contextLayers.length) return;
    let cancelled = false;

    Promise.all(
      contextLayers.map(async (layer) => {
        const fc = await loadContextGeometry(layer);
        if (cancelled || mapRef.current !== map) return;
        geometryCache.current.set(layer.id, fc as GeoJSON.FeatureCollection);
        const sourceId = `khm-ctx-${layer.id}`;
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: "geojson", data: fc });
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(fc);
        }
        const paint = contextStyle(layer);
        const fillId = `${sourceId}-fill`;
        const lineId = `${sourceId}-line`;
        const circleId = `${sourceId}-circle`;
        if (paint.circle) {
          if (!map.getLayer(circleId)) {
            map.addLayer({
              id: circleId,
              type: "circle",
              source: sourceId,
              layout: { visibility: "none" },
              paint: paint.circle
            });
          }
        } else {
          if (paint.fill && !map.getLayer(fillId)) {
            map.addLayer({
              id: fillId,
              type: "fill",
              source: sourceId,
              layout: { visibility: "none" },
              paint: paint.fill
            });
          }
          if (paint.line && !map.getLayer(lineId)) {
            map.addLayer({
              id: lineId,
              type: "line",
              source: sourceId,
              layout: { visibility: "none" },
              paint: paint.line
            });
          }
        }
      })
    ).then(() => {
      if (cancelled || mapRef.current !== map) return;
      const on = contextOnRef.current;
      for (const layer of contextLayers) {
        const sourceId = `khm-ctx-${layer.id}`;
        const vis = isContextOverlayOn(on, layer.id) ? "visible" : "none";
        for (const suffix of ["fill", "line", "circle"]) {
          const id = `${sourceId}-${suffix}`;
          if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
        }
      }
      restackScreenAboveContextFills(map, contextLayers);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, contextLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const layer of contextLayers) {
      const sourceId = `khm-ctx-${layer.id}`;
      const vis = isContextOverlayOn(contextOn, layer.id) ? "visible" : "none";
      for (const suffix of ["fill", "line", "circle"]) {
        const id = `${sourceId}-${suffix}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      }
    }
    restackScreenAboveContextFills(map, contextLayers);
  }, [contextOn, contextLayers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(FILL_ID)) return;
    const filter = buildScreenFilter(panel);
    map.setFilter(FILL_ID, filter);
    map.setFilter(LINE_ID, filter);
  }, [panel, ready, screenLayer]);

  useEffect(() => {
    if (!ready || !screenFc || panel.caseId) return;
    if (panel.place === "coast") {
      mapRef.current?.fitBounds(
        [
          [CAMBODIA_COAST_BOUNDS[0], CAMBODIA_COAST_BOUNDS[1]],
          [CAMBODIA_COAST_BOUNDS[2], CAMBODIA_COAST_BOUNDS[3]]
        ],
        { padding: 24, duration: 600 }
      );
      return;
    }
    const province = PLACE_OPTIONS.find((r) => r.id === panel.place)?.province;
    if (!province) return;
    let w = Infinity;
    let s = Infinity;
    let e = -Infinity;
    let n = -Infinity;
    for (const feature of screenFc.features) {
      const props = feature.properties as FeatureProps | null;
      if (!props || props.province !== province) continue;
      if (!feature.geometry || feature.geometry.type === "GeometryCollection") continue;
      const [bw, bs, be, bn] = geometryBounds(
        feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
      );
      if (bw < w) w = bw;
      if (bs < s) s = bs;
      if (be > e) e = be;
      if (bn > n) n = bn;
    }
    if (Number.isFinite(w)) {
      mapRef.current?.fitBounds(
        [
          [w, s],
          [e, n]
        ],
        { padding: 32, duration: 600 }
      );
    }
  }, [panel.place, panel.caseId, ready, screenFc]);

  const toggleClass = (id: DrawnClassId, on: boolean) => {
    const classes = on
      ? panel.classes.includes(id)
        ? panel.classes
        : [...panel.classes, id]
      : panel.classes.filter((c) => c !== id);
    applyPanel({ ...panel, classes, preset: null, caseId: null });
  };

  const setPlace = (place: PlaceId) => {
    applyPanel({
      ...panel,
      place,
      preset: place === "coast" ? "coast" : null,
      caseId: null
    });
  };

  const placeLabelSelected =
    PLACE_OPTIONS.find((opt) => opt.id === panel.place)?.label ?? "Four coastal provinces";
  const presetSelected = PRESET_OPTIONS.find((opt) => opt.id === panel.preset) ?? null;

  const applyPreset = (id: PanelPreset) => {
    if (id === "coast") {
      applyPanel(presetCoast(), { fitCoast: true });
      return;
    }
    if (id === "A") {
      const c = cases.data?.find((row) => row.id === "A");
      applyPanel(presetCaseA(), { fitCase: c ?? null });
      return;
    }
    if (id === "C") {
      const c = cases.data?.find((row) => row.id === "C");
      applyPanel(presetCaseC(), { fitCase: c ?? null });
      return;
    }
    applyPanel(presetFieldLook(panel));
  };

  const setOverlay = (id: "ramsar" | "verra", on: boolean) => {
    const overlay = on
      ? panel.overlay.includes(id)
        ? panel.overlay
        : [...panel.overlay, id]
      : panel.overlay.filter((o) => o !== id);
    applyPanel({ ...panel, overlay, preset: null });
  };

  const setHide = (id: "permit" | "verra", on: boolean) => {
    const hide = on
      ? panel.hide.includes(id)
        ? panel.hide
        : [...panel.hide, id]
      : panel.hide.filter((h) => h !== id);
    applyPanel({ ...panel, hide, preset: null, caseId: null });
  };

  const addInspectToShortlist = () => {
    if (!inspect || !screenLayer) return;
    const fc = geometryCache.current.get(screenLayer.id);
    const match = fc?.features.find(
      (f) => f.properties && (f.properties as FeatureProps).id === inspect.props.id
    );
    if (!match || !match.geometry || match.geometry.type === "GeometryCollection") return;
    const item = featureToShortlist(
      inspect.props,
      match.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
    );
    setShortlist((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
  };

  const zoomShortlistItem = (row: ShortlistItem) => {
    const [w, s, e, n] = geometryBounds(row.geometry);
    mapRef.current?.fitBounds(
      [
        [w, s],
        [e, n]
      ],
      { padding: 48, duration: 600, maxZoom: 14 }
    );
    setInspect({
      props: {
        id: row.id,
        class_id: row.class_id,
        class_name: row.class_name,
        suitability: row.suitability,
        area_ha: row.area_ha,
        province: row.province,
        place: row.place,
        note: row.note,
        permit_gate: row.permit_gate,
        permit_instrument: row.permit_instrument,
        stop_legal: row.stop_legal,
        stop_legal_status: row.stop_legal_status,
        stop_legal_note: row.stop_legal_note,
        project_overlap: row.project_overlap,
        project_overlap_ids: row.project_overlap_ids ?? null,
        project_overlap_note: row.project_overlap_note,
        elevation_fail: row.elevation_fail ?? null
      },
      lng: row.lon,
      lat: row.lat
    });
    setPanelOpen(true);
  };

  const exportMeta = {
    bundleVersion,
    goSentence: `${GO_ONCE} ${CLAIM_CEILING}`,
    classRule: CLASS_RULE_V03,
    headline
  };

  const meaning = inspect ? meaningForClass(inspect.props.class_id) : null;
  const inspectDrivers = inspect ? driversForFeature(inspect.props) : [];
  const publicReady = manifest.data?.public_ready === true;
  const verraIds = formatVerraIds(inspect?.props.project_overlap_ids);
  const onShortlist = inspect ? shortlist.some((row) => row.id === inspect.props.id) : false;

  const patchSentence = inspect
    ? buildPatchHeadline({
        province: inspect.props.province ?? null,
        classId: inspect.props.class_id,
        areaHa: inspect.props.area_ha,
        suitability: inspect.props.suitability,
        elevationFail: inspect.props.elevation_fail ?? null,
        classMeaning:
          inspect.props.class_id === 8
            ? "Class 8, historic mangrove now open cover"
            : meaning
              ? meaning.label.replace(/^CAUTION:\s*/i, "Class ").replace(/^GO:\s*/i, "Class ")
              : `Class ${inspect.props.class_id}`
      })
    : null;

  const fmtCount = (n: number, ha: number) =>
    `${n.toLocaleString("en-AU")} patches · ${Math.round(ha).toLocaleString("en-AU")} ha`;

  const panelInner = (
    <>
      <p ref={headlineRef} className="khm-panel-headline">
        {headline}
      </p>
      <div className="pf-v6-screen-reader" aria-live="polite" aria-atomic="true" ref={announceRef} />

      {inspect && patchSentence && (
        <div className="khm-inspect khm-inspect-in-panel">
          <Title headingLevel="h2" className="pf-v6-u-font-size-md">
            Selected patch
          </Title>
          <p className="khm-panel-headline khm-panel-headline-sm">{patchSentence}</p>
          {inspectDrivers.length === 0 && inspect.props.suitability === "go" ? (
            <p className="pf-v6-u-font-size-sm">
              No mapped hold-back on this patch. Physical screen only. Not planting permission.
            </p>
          ) : (
            <ul className="khm-plain-list pf-v6-u-font-size-sm">
              {inspectDrivers.map((id: CautionDriverId) => {
                const d = DRIVER_BY_ID[id];
                return (
                  <li key={id}>
                    <Swatch color={d.color} label={d.holdsBack} />
                  </li>
                );
              })}
            </ul>
          )}
          <dl className="khm-facts">
            <div>
              <dt>Patch id</dt>
              <dd>{inspect.props.id}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>
                {inspect.props.class_id}
                {meaning ? ` · ${meaning.label}` : ""}
              </dd>
            </div>
            <div>
              <dt>Hectares</dt>
              <dd className="khm-tabular">{inspect.props.area_ha.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Province</dt>
              <dd>{inspect.props.province ?? "—"}</dd>
            </div>
            <div>
              <dt>Permit gate</dt>
              <dd>{flagLabel(inspect.props.permit_gate)}</dd>
            </div>
            <div>
              <dt>Legal STOP</dt>
              <dd>{flagLabel(inspect.props.stop_legal)}</dd>
            </div>
            <div>
              <dt>VERRA</dt>
              <dd>
                {flagLabel(inspect.props.project_overlap)}
                {verraIds ? ` · ${verraIds}` : ""}
              </dd>
            </div>
          </dl>
          {inspect.props.permit_instrument && (
            <p className="pf-v6-u-font-size-sm">{inspect.props.permit_instrument}</p>
          )}
          {inspect.props.stop_legal_note && (
            <p className="pf-v6-u-font-size-sm">{inspect.props.stop_legal_note}</p>
          )}
          {inspect.props.project_overlap_note && (
            <p className="pf-v6-u-font-size-sm">{inspect.props.project_overlap_note}</p>
          )}
          <div className="khm-map-tools">
            <Button variant="primary" onClick={addInspectToShortlist} isDisabled={onShortlist}>
              {onShortlist ? "On the shortlist" : "Add to shortlist"}
            </Button>
            <Button variant="link" isInline onClick={() => setInspect(null)}>
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Place
      </Title>
      <p className="pf-v6-u-font-size-sm khm-panel-select-help">
        Zoom and filter the map to one province, or keep all four coastal provinces.
      </p>
      <div className="khm-panel-select">
        <Select
          id="place-select"
          className="khm-panel-select-menu"
          isOpen={placeOpen}
          selected={panel.place}
          onOpenChange={(open) => setPlaceOpen(open)}
          onSelect={(_event, value) => {
            setPlaceOpen(false);
            if (typeof value === "string") setPlace(value as PlaceId);
          }}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setPlaceOpen((open) => !open)}
              isExpanded={placeOpen}
              isFullWidth
              aria-label="Place"
            >
              {placeLabelSelected}
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <SelectList>
            {PLACE_OPTIONS.map((opt) => (
              <SelectOption
                key={opt.id}
                value={opt.id}
                isSelected={panel.place === opt.id && !panel.caseId}
              >
                {opt.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Drawn class
      </Title>
      {layers.error && <p role="alert">{layers.error}</p>}
      {screenLayer && (
        <p className="pf-v6-u-font-size-sm khm-layer-title-row">
          {layerDisplayTitle(screenLayer)}{" "}
          {(() => {
            const cls = parseEvidenceClass(screenLayer.evidence_class);
            return cls ? <EvidenceBadge cls={cls} /> : null;
          })()}{" "}
          <IllustrativeBadge publicReady={publicReady && screenLayer.public_ready} />
          <LayerProvenance layer={screenLayer} publicReady={publicReady} />
        </p>
      )}
      <div className="khm-driver-toggle">
        <Checkbox
          id="class-tidal"
          isChecked={panel.classes.includes(4)}
          label={
            <span className="khm-driver-label">
              <Swatch color={CAUTION_DRIVERS[0]!.color} label="Tidal flat" />
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.tidal.patches, rowCounts.tidal.hectares)}
              </span>
              <DriverInfo driver={DRIVER_BY_ID.tidal} />
            </span>
          }
          onChange={(_e, on) => toggleClass(4, on)}
        />
      </div>
      <div className="khm-driver-toggle">
        <Checkbox
          id="class-converted"
          isChecked={panel.classes.includes(5)}
          label={
            <span className="khm-driver-label">
              <Swatch color={CAUTION_DRIVERS[2]!.color} label="Converted" />
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.converted.patches, rowCounts.converted.hectares)}
              </span>
              <DriverInfo driver={DRIVER_BY_ID.converted} />
            </span>
          }
          onChange={(_e, on) => toggleClass(5, on)}
        />
      </div>
      <div className="khm-driver-toggle">
        <Checkbox
          id="class-open"
          isChecked={panel.classes.includes(8)}
          label={
            <span className="khm-driver-label">
              <Swatch color={SUITABILITY.go} label="Open or accreted" />
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.open.patches, rowCounts.open.hectares)}
              </span>
            </span>
          }
          onChange={(_e, on) => toggleClass(8, on)}
        />
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Narrowing
      </Title>
      <div className="khm-driver-toggle">
        <Checkbox
          id="elev-narrow"
          isChecked={panel.elevation}
          label={
            <span className="khm-driver-label">
              <Swatch color={CAUTION_DRIVERS[1]!.color} label="Elevation" />
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.elevation.patches, rowCounts.elevation.hectares)}
              </span>
              <DriverInfo driver={DRIVER_BY_ID.elevation} />
            </span>
          }
          onChange={(_e, on) => applyPanel({ ...panel, elevation: on, preset: null, caseId: null })}
        />
      </div>
      <p className="pf-v6-u-font-size-sm">{DRIVER_BY_ID.elevation.source}</p>
      <div className="khm-driver-toggle">
        <Checkbox
          id="hide-permit"
          isChecked={panel.hide.includes("permit")}
          label={
            <span className="khm-driver-label">
              Hide patches inside a permit gate
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.permit.patches, rowCounts.permit.hectares)}
              </span>
              <DriverInfo driver={DRIVER_BY_ID.tenure} />
            </span>
          }
          onChange={(_e, on) => setHide("permit", on)}
        />
      </div>
      <p className="pf-v6-u-font-size-sm">{DRIVER_BY_ID.tenure.source}</p>
      <div className="khm-driver-toggle">
        <Checkbox
          id="hide-verra"
          isChecked={panel.hide.includes("verra")}
          label={
            <span className="khm-driver-label">
              Hide patches inside a VERRA project
              <span className="khm-tabular pf-v6-u-font-size-sm">
                {fmtCount(rowCounts.verra.patches, rowCounts.verra.hectares)}
              </span>
              <DriverInfo driver={DRIVER_BY_ID.verra} />
            </span>
          }
          onChange={(_e, on) => setHide("verra", on)}
        />
      </div>
      <p className="pf-v6-u-font-size-sm">{DRIVER_BY_ID.verra.source}</p>

      <p className="khm-not-assessed-row pf-v6-u-font-size-sm">
        <strong>Legal STOP.</strong> {LEGAL_STOP_NOT_ASSESSED}
      </p>
      <p className="khm-not-assessed-row pf-v6-u-font-size-sm">
        <strong>Class 7 ponds.</strong> {PONDS_NOT_IN_PACK}
      </p>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Context overlays
      </Title>
      <Checkbox
        id="overlay-ramsar"
        isChecked={panel.overlay.includes("ramsar")}
        label="Ramsar context"
        onChange={(_e, on) => setOverlay("ramsar", on)}
      />
      <Checkbox
        id="overlay-verra"
        isChecked={panel.overlay.includes("verra")}
        label="VERRA boundaries"
        onChange={(_e, on) => setOverlay("verra", on)}
      />
      {contextLayers
        .filter((l) => isRamsarLayer(l) || isVerraLayer(l))
        .map((layer) => (
          <div key={layer.id} className="khm-layer-toggle">
            <span className="pf-v6-u-font-size-sm">{layerDisplayTitle(layer)}</span>
            <LayerProvenance
              layer={layer}
              publicReady={publicReady}
              displayTitle={layerDisplayTitle(layer)}
            />
          </div>
        ))}
      <p className="pf-v6-u-font-size-sm">
        <a href="#licence">About this pack — licence and evidence</a>
      </p>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Presets
      </Title>
      <p className="pf-v6-u-font-size-sm khm-panel-select-help">
        A preset sets which patches show and where the map focuses. Use Case A or Case C for the worked
        examples from Means, or Field look to keep open land without known flag hits.
      </p>
      <div className="khm-panel-select">
        <Select
          id="preset-select"
          className="khm-panel-select-menu"
          isOpen={presetOpen}
          selected={panel.preset ?? undefined}
          onOpenChange={(open) => setPresetOpen(open)}
          onSelect={(_event, value) => {
            setPresetOpen(false);
            if (typeof value === "string") applyPreset(value as PanelPreset);
          }}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setPresetOpen((open) => !open)}
              isExpanded={presetOpen}
              isFullWidth
              isPlaceholder={!presetSelected}
              aria-label="Presets"
            >
              {presetSelected?.label ?? "Choose a preset…"}
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <SelectList>
            {PRESET_OPTIONS.map((opt) => (
              <SelectOption
                key={opt.id}
                value={opt.id}
                isSelected={panel.preset === opt.id}
                description={opt.description}
              >
                {opt.label}
              </SelectOption>
            ))}
          </SelectList>
        </Select>
      </div>
      {presetSelected && (
        <p className="pf-v6-u-font-size-sm khm-panel-select-help">{presetSelected.description}</p>
      )}
      <p className="pf-v6-u-font-size-sm khm-means-omitted" role="note">
        {CASE_B_MISSING}
      </p>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Shortlist ({shortlist.length})
      </Title>
      {shortlist.length === 0 && <p className="pf-v6-u-font-size-sm">{EMPTY_SHORTLIST}</p>}
      {shortlist.length > 0 && (
        <ul className="khm-plain-list pf-v6-u-font-size-sm">
          {shortlist.map((row) => (
            <li key={row.id} className="khm-shortlist-row">
              <button type="button" className="khm-shortlist-zoom" onClick={() => zoomShortlistItem(row)}>
                {row.id} · class {row.class_id} · {row.area_ha.toFixed(1)} ha
                {row.province ? ` · ${row.province}` : ""}
              </button>
              <Button variant="link" isInline onClick={() => setShortlist((prev) => prev.filter((r) => r.id !== row.id))}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="khm-map-tools pf-v6-u-mt-sm">
        <Button
          variant="secondary"
          isDisabled={shortlist.length === 0}
          onClick={() =>
            downloadText(
              `cambodia-shortlist-${bundleVersion}.csv`,
              shortlistToCsv(shortlist, exportMeta),
              "text/csv"
            )
          }
        >
          Export CSV
        </Button>
        <Button
          variant="secondary"
          isDisabled={shortlist.length === 0}
          onClick={() =>
            downloadText(
              `cambodia-shortlist-${bundleVersion}.geojson`,
              JSON.stringify(shortlistToGeoJson(shortlist, exportMeta), null, 2),
              "application/geo+json"
            )
          }
        >
          Export GeoJSON
        </Button>
        {shortlist.length > 0 && (
          <Button variant="link" onClick={() => setShortlist([])}>
            Clear
          </Button>
        )}
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Next checks
      </Title>
      <ul className="khm-plain-list pf-v6-u-font-size-sm">
        {NEXT_CHECKS.map((row) => (
          <li key={row.check}>
            <strong>{row.check}.</strong> {row.source}. {row.onPack}
          </li>
        ))}
      </ul>
      <p className="pf-v6-u-font-size-sm">
        <a href="#licence">About this pack — licence and evidence</a>
      </p>
    </>
  );

  return (
    <section className="khm-map-section khm-map-section-workspace">
      {!panelOpen && (
        <div className="khm-map-tools khm-map-layers-open">
          <Button variant="secondary" onClick={() => setPanelOpen(true)}>
            Layers
          </Button>
        </div>
      )}
      <div className="khm-map-workspace khm-map-workspace-solo">
        <Drawer isInline isExpanded={panelOpen} position="start" className="khm-map-drawer">
          <DrawerContent
            panelContent={
              <DrawerPanelContent
                isResizable
                defaultSize="20rem"
                minSize="16rem"
                resizeAriaLabel="Resize layers panel"
              >
                <DrawerHead>
                  <span id="layer-panel-title">Layers</span>
                  <DrawerActions>
                    <DrawerCloseButton onClick={() => setPanelOpen(false)} />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody className="khm-layer-panel">{panelInner}</DrawerPanelBody>
              </DrawerPanelContent>
            }
          >
            <DrawerContentBody>
              <div className="khm-map-frame khm-map-frame-fill">
                <div
                  ref={container}
                  className="khm-map"
                  role="region"
                  aria-label="Cambodia restoration screen map"
                />
                <div className="khm-map-key" aria-hidden>
                  <Swatch color={SUITABILITY.go} label="Open or accreted" />
                  <Swatch color={CAUTION_DRIVERS[0]!.color} label="Tidal flat" />
                  <Swatch color={CAUTION_DRIVERS[2]!.color} label="Converted" />
                  <Swatch color={CAUTION_DRIVERS[1]!.color} label="Elevation" />
                </div>
                {counts.patches === 0 && screenFc && (
                  <p className="khm-map-empty" role="status">
                    {EMPTY_MAP}
                  </p>
                )}
              </div>
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </div>
      <p className="khm-basemap-note">
        Streets names are from OpenStreetMap and imply no position on boundaries.
      </p>
      {kind === "offline" && (
        <p className="khm-basemap-note">Reference basemap unreachable. Showing plain sea.</p>
      )}
    </section>
  );
}
