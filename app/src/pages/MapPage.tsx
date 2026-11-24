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
  HelperText,
  HelperTextItem,
  PageSection,
  Title,
  ToggleGroup,
  ToggleGroupItem
} from "@patternfly/react-core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DriverInfo } from "../common/DriverInfo";
import {
  dismissCoachStorage,
  MapGuide,
  readCoachDismissed,
  readFilterTouched,
  writeFilterTouched
} from "../flow/MapGuide";
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
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { parseEvidenceClass } from "../lib/evidence";
import {
  CAUTION_DRIVERS,
  driverStatusLabel,
  driversForFeature,
  holdsBackSummary,
  primaryDriver,
  type CautionDriverId
} from "../lib/cautionDrivers";
import { meaningForClass, suitabilityLabel } from "../lib/classMeaning";
import { formatVerraIds, isVerraLayer, layerDisplayTitle } from "../lib/layerLabels";
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
  LOSS_CONTEXT_FILL,
  LOSS_CONTEXT_LINE,
  GAP_MARKER_CIRCLE,
  GO_CAUTION_FILL,
  GO_CAUTION_LINE,
  PERMIT_CONTEXT_FILL,
  PERMIT_CONTEXT_LINE,
  PROJECT_OVERLAP_FILL,
  PROJECT_OVERLAP_LINE
} from "../map/mapTheme";
import { FLAGS, SUITABILITY } from "../theme/colours";

const SOURCE_ID = "khm-go-caution";
const FILL_ID = "khm-go-caution-fill";
const LINE_ID = "khm-go-caution-line";

/** Context overlay on only when explicitly true — undefined must mean OFF. */
function isContextOverlayOn(contextOn: Record<string, boolean>, layerId: string): boolean {
  return contextOn[layerId] === true;
}

/**
 * Keep GO±CAUTION (and hold-back driver paints) above context fills so stacked
 * WDPA/VERRA/Ramsar fills cannot bury the screen. Outline/circle overlays stay
 * above the screen paint so boundaries remain readable under labels.
 */
function restackScreenAboveContextFills(
  map: maplibregl.Map,
  contextLayers: MapLayer[]
): void {
  if (!map.getLayer(FILL_ID)) return;
  // Dual basemap parks satellite above Streets; keep app paints above the raster
  // (omit beforeId → top). Do not tuck under Streets symbol layers.
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

type Inspect = {
  props: FeatureProps;
  lng: number;
  lat: number;
};

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
  if (isVerraLayer(layer)) {
    return { fill: PROJECT_OVERLAP_FILL, line: PROJECT_OVERLAP_LINE };
  }
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

function LayerToggleRow({
  id,
  label,
  isChecked,
  isDisabled,
  onChange,
  provenance
}: {
  id: string;
  label: string;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange: (on: boolean) => void;
  provenance?: ReactNode;
}) {
  return (
    <div className="khm-layer-toggle">
      <Checkbox
        id={id}
        isChecked={isChecked}
        isDisabled={isDisabled}
        label={label}
        onChange={(_e, on) => onChange(on)}
      />
      {provenance}
    </div>
  );
}

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const [basemapChoice, setBasemapChoice] = useState<BasemapChoice>("streets");
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGo, setShowGo] = useState(true);
  const [showCaution, setShowCaution] = useState(true);
  const [driverFilter, setDriverFilter] = useState<Record<CautionDriverId, boolean>>({
    tidal: true,
    elevation: true,
    converted: true,
    tenure: true,
    verra: true
  });
  const [hidePermitHits, setHidePermitHits] = useState(false);
  const [hideStopHits, setHideStopHits] = useState(false);
  const [hideOverlapHits, setHideOverlapHits] = useState(false);
  const [shortlistReadyOnly, setShortlistReadyOnly] = useState(false);
  const [contextOn, setContextOn] = useState<Record<string, boolean>>({});
  const contextOnRef = useRef(contextOn);
  contextOnRef.current = contextOn;
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>(() => loadShortlistFromStorage());
  const [copiedCase, setCopiedCase] = useState<string | null>(null);
  const [place, setPlace] = useState<string>(() => {
    const q = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    return q.get("case") || "coast";
  });
  const [coachOpen, setCoachOpen] = useState(() => !readCoachDismissed());
  const [filterTouched, setFilterTouched] = useState(() => readFilterTouched());
  const [everInspected, setEverInspected] = useState(false);
  const [inspectReviewed, setInspectReviewed] = useState(false);
  const driversHeadingRef = useRef<HTMLHeadingElement>(null);
  const basemapChoiceRef = useRef(basemapChoice);
  basemapChoiceRef.current = basemapChoice;
  const basemapControlRef = useRef<BasemapControl | null>(null);

  useEffect(() => {
    saveShortlistToStorage(shortlist);
  }, [shortlist]);

  useEffect(() => {
    if (inspect) setEverInspected(true);
  }, [inspect]);

  // After a patch is open briefly, treat inspect as done so Shortlist becomes the next CTA.
  useEffect(() => {
    if (!inspect || inspectReviewed) return;
    const t = window.setTimeout(() => setInspectReviewed(true), 1200);
    return () => window.clearTimeout(t);
  }, [inspect, inspectReviewed]);

  const markFilterTouched = () => {
    setFilterTouched(true);
    writeFilterTouched();
  };

  const focusFilters = () => {
    setPanelOpen(true);
    markFilterTouched();
    window.requestAnimationFrame(() => {
      driversHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const dismissCoach = () => {
    dismissCoachStorage();
    setCoachOpen(false);
  };

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

  useEffect(() => {
    if (!contextLayers.length) return;
    setContextOn((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const layer of contextLayers) {
        // Force OFF unless the bundle explicitly opts in — never treat missing
        // state as visible (old `!== false` defaulted overlays on).
        if (next[layer.id] === undefined) {
          next[layer.id] = layer.default_visible === true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [contextLayers]);

  useEffect(() => {
    const onHash = () => {
      const q = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
      const c = q.get("case");
      if (c) setPlace(c);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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
      const basemapCtrl = new BasemapControl(basemapChoiceRef.current, (next) => setBasemapChoice(next));
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

  // Visibility-only swap — never setStyle (keeps GO/CAUTION overlays mounted).
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
      // Enrich with hold-back drivers so CAUTION is not one paint bucket.
      const fc: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: raw.features.map((feature) => {
          const props = parseFeatureProps(
            (feature.properties ?? {}) as Record<string, unknown>
          );
          const drivers = driversForFeature(props);
          const primary = primaryDriver(props);
          return {
            ...feature,
            properties: {
              ...feature.properties,
              primary_driver: primary,
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
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: fc });
        // Append on top of dual basemap (satellite raster sits above Streets).
        map.addLayer({ id: FILL_ID, type: "fill", source: SOURCE_ID, paint: GO_CAUTION_FILL });
        map.addLayer({ id: LINE_ID, type: "line", source: SOURCE_ID, paint: GO_CAUTION_LINE });
      } else {
        (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(fc);
      }
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
        // Start from bundle default (Ramsar/VERRA/WDPA are false) — do not flash on.
        const startVis = layer.default_visible === true ? "visible" : "none";
        if (paint.circle) {
          if (!map.getLayer(circleId)) {
            map.addLayer({
              id: circleId,
              type: "circle",
              source: sourceId,
              layout: { visibility: startVis },
              paint: paint.circle
            });
          }
        } else {
          if (paint.fill && !map.getLayer(fillId)) {
            map.addLayer({
              id: fillId,
              type: "fill",
              source: sourceId,
              layout: { visibility: startVis },
              paint: paint.fill
            });
          }
          if (paint.line && !map.getLayer(lineId)) {
            map.addLayer({
              id: lineId,
              type: "line",
              source: sourceId,
              layout: { visibility: startVis },
              paint: paint.line
            });
          }
        }
      })
    ).then(() => {
      if (cancelled || mapRef.current !== map) return;
      // Apply latest toggle state (ref avoids stale closure after slow GeoJSON loads).
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
    const wanted = shortlistReadyOnly
      ? (["go"] as string[])
      : ([showGo ? "go" : null, showCaution ? "caution" : null].filter(Boolean) as string[]);
    const parts: maplibregl.FilterSpecification[] = [];
    if (wanted.length === 0) {
      parts.push(["==", ["get", "suitability"], "__none__"]);
    } else {
      parts.push(["in", ["get", "suitability"], ["literal", wanted]]);
    }
    // Driver filters: CAUTION patches must match an enabled primary_driver.
    // GO patches pass unless shortlist-ready already stripped flags below.
    if (!shortlistReadyOnly && showCaution) {
      const enabled = (Object.entries(driverFilter) as [CautionDriverId, boolean][])
        .filter(([, on]) => on)
        .map(([id]) => id);
      if (enabled.length === 0) {
        parts.push(["!=", ["get", "suitability"], "caution"]);
      } else {
        parts.push([
          "any",
          ["!=", ["get", "suitability"], "caution"],
          ["in", ["get", "primary_driver"], ["literal", enabled]]
        ] as maplibregl.FilterSpecification);
      }
    }
    const hidePermit = hidePermitHits || shortlistReadyOnly;
    const hideStop = hideStopHits || shortlistReadyOnly;
    const hideOverlap = hideOverlapHits || shortlistReadyOnly;
    if (hidePermit) parts.push(["!=", ["get", "permit_gate"], true]);
    if (hideStop) parts.push(["!=", ["get", "stop_legal"], true]);
    if (hideOverlap) parts.push(["!=", ["get", "project_overlap"], true]);
    const filter: maplibregl.FilterSpecification =
      parts.length === 1 ? parts[0]! : (["all", ...parts] as maplibregl.FilterSpecification);
    map.setFilter(FILL_ID, filter);
    map.setFilter(LINE_ID, filter);
  }, [
    showGo,
    showCaution,
    driverFilter,
    hidePermitHits,
    hideStopHits,
    hideOverlapHits,
    shortlistReadyOnly,
    ready,
    screenLayer
  ]);

  useEffect(() => {
    if (!ready || !cases.data?.length || place === "coast") return;
    const c = cases.data.find((row) => row.id === place);
    if (!c || !mapRef.current) return;
    const [w, s, e, n] = caseBounds(c);
    mapRef.current.fitBounds(
      [
        [w, s],
        [e, n]
      ],
      { padding: 32, duration: 600 }
    );
  }, [ready, cases.data, place]);

  const zoomCoast = () => {
    mapRef.current?.fitBounds(
      [
        [CAMBODIA_COAST_BOUNDS[0], CAMBODIA_COAST_BOUNDS[1]],
        [CAMBODIA_COAST_BOUNDS[2], CAMBODIA_COAST_BOUNDS[3]]
      ],
      { padding: 24, duration: 600 }
    );
    setPlace("coast");
    if (window.location.hash.startsWith("#map")) window.history.replaceState(null, "", "#map");
  };

  const zoomCase = (c: CaseStudy) => {
    const [w, s, e, n] = caseBounds(c);
    mapRef.current?.fitBounds(
      [
        [w, s],
        [e, n]
      ],
      { padding: 32, duration: 600 }
    );
    setPlace(c.id);
    window.history.replaceState(null, "", `#map?case=${c.id}`);
  };

  const copyCaseBookmark = async (c: CaseStudy) => {
    const url = `${window.location.origin}${window.location.pathname}#map?case=${c.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCase(c.id);
      window.setTimeout(() => setCopiedCase((cur) => (cur === c.id ? null : cur)), 2000);
    } catch {
      window.prompt("Copy case bookmark", url);
    }
  };

  const setProjectOverlays = (on: boolean) => {
    setContextOn((prev) => {
      const next = { ...prev };
      for (const layer of contextLayers) {
        if (isVerraLayer(layer)) next[layer.id] = on;
      }
      return next;
    });
  };

  const setPermitOverlays = (on: boolean) => {
    setContextOn((prev) => {
      const next = { ...prev };
      for (const layer of contextLayers) {
        if (
          layer.flag_role === "permit_context" ||
          layer.flag_role === "permit_gap_marker" ||
          layer.id.includes("ramsar")
        ) {
          next[layer.id] = on;
        }
      }
      return next;
    });
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
    const props: FeatureProps = {
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
      project_overlap_ids: row.project_overlap_ids,
      project_overlap_note: row.project_overlap_note
    };
    setInspect({ props, lng: row.lon, lat: row.lat });
    setPanelOpen(true);
  };

  const removeShortlistItem = (id: string) => {
    setShortlist((prev) => prev.filter((row) => row.id !== id));
  };

  const meaning = inspect ? meaningForClass(inspect.props.class_id) : null;
  const inspectDrivers = inspect ? driversForFeature(inspect.props) : [];
  const publicReady = manifest.data?.public_ready === true;
  const verraIds = formatVerraIds(inspect?.props.project_overlap_ids);

  return (
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section">
      <div className="khm-map-head">
        <Title headingLevel="h1">Restoration map</Title>
        <div className="khm-go-banner" role="note">
          <strong>GO means worth a field visit</strong> — open opportunity on former mangrove (land cover
          only). CAUTION paints named reasons to pause: <strong>tide</strong>, <strong>height</strong>, and{" "}
          <strong>converted land</strong>. Rights and carbon-project context paint when a flag hits, and as
          overlays you can toggle. Flags never mean approved or refused.
        </div>
        <HelperText>
          <HelperTextItem>
            Read step — after <a href="#change">Locate</a> and <a href="#cases">Means</a>. On the map: filter
            reasons → click a site → inspect → shortlist. Case bookmarks jump to examples A and C.
          </HelperTextItem>
        </HelperText>
        <MapGuide
          progress={{
            filterTouched,
            hasInspect: everInspected,
            inspectReviewed,
            shortlistCount: shortlist.length
          }}
          coachOpen={coachOpen}
          onDismissCoach={dismissCoach}
          onFocusFilters={focusFilters}
          onMarkInspectReviewed={() => setInspectReviewed(true)}
          onAddShortlist={addInspectToShortlist}
          canAddShortlist={Boolean(inspect)}
        />
        <div className="khm-map-tools">
          <ToggleGroup aria-label="Case bookmarks">
            <ToggleGroupItem
              text="Four provinces"
              buttonId="zoom-coast"
              isSelected={place === "coast"}
              onChange={zoomCoast}
            />
            {(cases.data ?? []).map((c) => (
              <ToggleGroupItem
                key={c.id}
                text={`${c.id}: ${c.place.split(",")[0] ?? c.title}`}
                buttonId={`zoom-case-${c.id}`}
                isSelected={place === c.id}
                onChange={() => zoomCase(c)}
              />
            ))}
          </ToggleGroup>
          {place !== "coast" &&
            (cases.data ?? [])
              .filter((c) => c.id === place)
              .map((c) => (
                <Button key={`copy-${c.id}`} variant="link" onClick={() => void copyCaseBookmark(c)}>
                  {copiedCase === c.id ? "Copied bookmark" : `Copy #map?case=${c.id}`}
                </Button>
              ))}
          {!panelOpen && (
            <Button variant="secondary" onClick={() => setPanelOpen(true)}>
              Show layers
            </Button>
          )}
        </div>
      </div>
      <div className="khm-map-workspace">
        <Drawer isInline isExpanded={panelOpen} position="start" className="khm-map-drawer">
          <DrawerContent
            panelContent={
              <DrawerPanelContent
                isResizable
                defaultSize="20rem"
                minSize="14rem"
                resizeAriaLabel="Resize layers panel"
              >
                <DrawerHead>
                  <span id="layer-panel-title">Layers</span>
                  <DrawerActions>
                    <DrawerCloseButton onClick={() => setPanelOpen(false)} />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody className="khm-layer-panel">
                  <Title headingLevel="h2">Legend</Title>
                  <ul className="khm-plain-list">
                    <li>
                      <Swatch color={SUITABILITY.go} label="GO — open opportunity" />
                    </li>
                    {CAUTION_DRIVERS.map((driver) => (
                      <li key={driver.id}>
                        <Swatch
                          color={driver.color}
                          label={
                            driver.status === "live" || driver.status === "partial"
                              ? `CAUTION · ${driver.short} (painted)`
                              : `CAUTION · ${driver.short} (${driverStatusLabel(driver.status).toLowerCase()})`
                          }
                        />
                      </li>
                    ))}
                    <li>
                      <Swatch color={FLAGS.permit} label="Protected-area overlay" />
                    </li>
                    <li>
                      <Swatch color={FLAGS.project} label="Carbon-project overlay" />
                    </li>
                  </ul>
                  <Title headingLevel="h2" className="pf-v6-u-mt-md">
                    Map layer
                  </Title>
                  {layers.error && <p role="alert">{layers.error}</p>}
                  {screenLayer && (
                    <>
                      <p className="pf-v6-u-font-size-sm khm-layer-title-row">
                        {layerDisplayTitle(screenLayer)}{" "}
                        {(() => {
                          const cls = parseEvidenceClass(screenLayer.evidence_class);
                          return cls ? <EvidenceBadge cls={cls} /> : null;
                        })()}{" "}
                        <IllustrativeBadge publicReady={publicReady && screenLayer.public_ready} />
                        <LayerProvenance layer={screenLayer} publicReady={publicReady} />
                      </p>
                      <Checkbox
                        id="show-go"
                        isChecked={shortlistReadyOnly ? true : showGo}
                        isDisabled={shortlistReadyOnly}
                        label="Show GO"
                        onChange={(_e, on) => setShowGo(on)}
                      />
                      <Checkbox
                        id="show-caution"
                        isChecked={shortlistReadyOnly ? false : showCaution}
                        isDisabled={shortlistReadyOnly}
                        label="Show CAUTION (all reasons)"
                        onChange={(_e, on) => setShowCaution(on)}
                      />
                    </>
                  )}
                  <div ref={driversHeadingRef}>
                    <Title headingLevel="h2" className="pf-v6-u-mt-md">
                      Reasons to pause
                    </Title>
                  </div>
                  <p className="pf-v6-u-font-size-sm">
                    Why a site is held back — not one CAUTION bucket. Tide, height, and converted land paint
                    on this pack; rights and carbon projects paint when flags hit (info icon on each row).
                  </p>
                  {CAUTION_DRIVERS.map((driver) => (
                    <div key={driver.id} className="khm-driver-toggle">
                      <Checkbox
                        id={`driver-${driver.id}`}
                        isChecked={driverFilter[driver.id]}
                        isDisabled={shortlistReadyOnly || !showCaution}
                        label={
                          <span className="khm-driver-label">
                            <span>
                              {driver.label} · {driverStatusLabel(driver.status)}
                              {driver.status === "live" || driver.status === "partial"
                                ? " · painted"
                                : ""}
                            </span>
                            <DriverInfo driver={driver} />
                          </span>
                        }
                        onChange={(_e, on) => {
                          markFilterTouched();
                          setDriverFilter((prev) => ({ ...prev, [driver.id]: on }));
                        }}
                      />
                    </div>
                  ))}
                  <Title headingLevel="h2" className="pf-v6-u-mt-md">
                    Extra filters
                  </Title>
                  <p className="pf-v6-u-font-size-sm">
                    “Unknown” is not a clearance. Legal stop-zones for ministry core areas are not on this
                    pack yet. “Shortlist-ready” keeps only GO sites with no known flag hits.
                  </p>
                  <Checkbox
                    id="hide-permit"
                    isChecked={hidePermitHits || shortlistReadyOnly}
                    isDisabled={shortlistReadyOnly}
                    label="Hide sites with protected-area flag"
                    onChange={(_e, on) => setHidePermitHits(on)}
                  />
                  <Checkbox
                    id="hide-stop"
                    isChecked={hideStopHits || shortlistReadyOnly}
                    isDisabled={shortlistReadyOnly}
                    label="Hide sites with legal-stop flag"
                    onChange={(_e, on) => setHideStopHits(on)}
                  />
                  <Checkbox
                    id="hide-overlap"
                    isChecked={hideOverlapHits || shortlistReadyOnly}
                    isDisabled={shortlistReadyOnly}
                    label="Hide sites overlapping a carbon project"
                    onChange={(_e, on) => setHideOverlapHits(on)}
                  />
                  <Checkbox
                    id="shortlist-ready"
                    isChecked={shortlistReadyOnly}
                    label="Shortlist-ready: GO only, no known flags"
                    onChange={(_e, on) => {
                      setShortlistReadyOnly(on);
                      if (on) {
                        setShowGo(true);
                        setShowCaution(false);
                      }
                    }}
                  />
                  {contextLayers.length > 0 && (
                    <>
                      <Title headingLevel="h2" className="pf-v6-u-mt-md">
                        Context overlays
                      </Title>
                      <div className="khm-map-tools pf-v6-u-mb-sm">
                        <Button variant="secondary" onClick={() => setProjectOverlays(true)}>
                          Show carbon-project outlines
                        </Button>
                        <Button variant="secondary" onClick={() => setPermitOverlays(true)}>
                          Show protected-area context
                        </Button>
                        <Button
                          variant="link"
                          onClick={() => {
                            setProjectOverlays(false);
                            setPermitOverlays(false);
                          }}
                        >
                          Hide overlays
                        </Button>
                      </div>
                      {contextLayers.map((layer) => (
                        <LayerToggleRow
                          key={layer.id}
                          id={`ctx-${layer.id}`}
                          label={layerDisplayTitle(layer)}
                          isChecked={isContextOverlayOn(contextOn, layer.id)}
                          onChange={(on) => setContextOn((prev) => ({ ...prev, [layer.id]: on }))}
                          provenance={
                            <LayerProvenance
                              layer={layer}
                              publicReady={publicReady}
                              displayTitle={layerDisplayTitle(layer)}
                            />
                          }
                        />
                      ))}
                      <p className="pf-v6-u-font-size-sm">
                        Sharing rules: <a href="#about">About</a>
                      </p>
                    </>
                  )}
                  <Title headingLevel="h2" className="pf-v6-u-mt-md">
                    Shortlist ({shortlist.length})
                  </Title>
                  <p className="pf-v6-u-font-size-sm">
                    Kept in this browser session. Spreadsheet and map-polygon downloads also live on{" "}
                    <a href="#act">Act</a>.
                  </p>
                  {shortlist.length === 0 && <p className="pf-v6-u-font-size-sm">No sites yet.</p>}
                  {shortlist.length > 0 && (
                    <>
                      <ul className="khm-plain-list pf-v6-u-font-size-sm">
                        {shortlist.map((row) => (
                          <li key={row.id} className="khm-shortlist-row">
                            <button
                              type="button"
                              className="khm-shortlist-zoom"
                              onClick={() => zoomShortlistItem(row)}
                            >
                              {row.id} · {suitabilityLabel(row.suitability)} · {row.area_ha.toFixed(1)} ha
                              {row.project_overlap === true ? " · carbon project" : ""}
                              {row.permit_gate === true ? " · protected area" : ""}
                            </button>
                            <Button variant="link" isInline onClick={() => removeShortlistItem(row.id)}>
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="khm-map-tools pf-v6-u-mt-sm">
                        <Button
                          variant="primary"
                          onClick={() =>
                            downloadText(
                              `cambodia-shortlist-${manifest.data?.version ?? "bundle"}.csv`,
                              shortlistToCsv(shortlist),
                              "text/csv"
                            )
                          }
                        >
                          Download spreadsheet
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            downloadText(
                              `cambodia-shortlist-${manifest.data?.version ?? "bundle"}.geojson`,
                              JSON.stringify(shortlistToGeoJson(shortlist), null, 2),
                              "application/geo+json"
                            )
                          }
                        >
                          Download map polygons
                        </Button>
                        <Button variant="link" onClick={() => setShortlist([])}>
                          Clear
                        </Button>
                      </div>
                    </>
                  )}
                </DrawerPanelBody>
              </DrawerPanelContent>
            }
          >
            <DrawerContentBody>
              <div className="khm-map-frame">
                <div
                  ref={container}
                  className="khm-map"
                  role="region"
                  aria-label="Cambodia GO and CAUTION screen map"
                />
                <div className="khm-map-key" aria-hidden>
                  <Swatch color={SUITABILITY.go} label="GO · open" />
                  <Swatch color={CAUTION_DRIVERS[0]!.color} label="CAUTION · tide" />
                  <Swatch color={CAUTION_DRIVERS[1]!.color} label="CAUTION · height" />
                  <Swatch color={CAUTION_DRIVERS[2]!.color} label="CAUTION · converted" />
                </div>
              </div>
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
        <aside className="khm-inspect-panel" aria-label="Click inspect">
          <Title headingLevel="h2">Click inspect</Title>
          {!inspect && (
            <p className="pf-v6-u-font-size-sm">
              Click a GO or CAUTION site on the map. Details appear here — not buried in the layers drawer.
            </p>
          )}
          {inspect && (
            <div className="khm-inspect">
              <p>
                <strong>{suitabilityLabel(inspect.props.suitability)}</strong>
                {meaning ? ` · ${meaning.label}` : ""}
              </p>
              {meaning && <p className="pf-v6-u-font-size-sm">{meaning.meaning}</p>}
              <Title headingLevel="h3" className="pf-v6-u-font-size-md">
                Why held back
              </Title>
              <p className="pf-v6-u-font-size-sm">{holdsBackSummary(inspect.props)}</p>
              {inspectDrivers.length > 0 && (
                <ul className="khm-plain-list pf-v6-u-font-size-sm">
                  {inspectDrivers.map((id) => {
                    const d = CAUTION_DRIVERS.find((row) => row.id === id)!;
                    return (
                      <li key={id}>
                        <Swatch color={d.color} label={`${d.label} · ${driverStatusLabel(d.status)}`} />
                      </li>
                    );
                  })}
                </ul>
              )}
              <dl className="khm-facts">
                <div>
                  <dt>Site id</dt>
                  <dd>{inspect.props.id}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{inspect.props.area_ha.toFixed(2)} ha</dd>
                </div>
                <div>
                  <dt>Province</dt>
                  <dd>{inspect.props.province ?? "—"}</dd>
                </div>
                <div>
                  <dt>Protected area</dt>
                  <dd>{flagLabel(inspect.props.permit_gate)}</dd>
                </div>
                <div>
                  <dt>Legal stop</dt>
                  <dd>
                    {flagLabel(inspect.props.stop_legal)}
                    {inspect.props.stop_legal_status ? ` · ${inspect.props.stop_legal_status}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Carbon project</dt>
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
              <Button variant="secondary" onClick={addInspectToShortlist}>
                Add to shortlist
              </Button>
              <Button variant="link" isInline onClick={() => setInspect(null)}>
                Clear selection
              </Button>
            </div>
          )}
        </aside>
      </div>
      <p className="khm-basemap-note">
        Streets basemap names are from OpenStreetMap and imply no position on boundaries. Satellite tiles
        © Esri (Maxar, Earthstar Geographics, and the GIS User Community).
      </p>
      {kind === "offline" && (
        <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>
      )}
    </PageSection>
  );
}
