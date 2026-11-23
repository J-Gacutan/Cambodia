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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { meaningForClass, suitabilityLabel } from "../lib/classMeaning";
import {
  downloadText,
  featureToShortlist,
  shortlistToCsv,
  shortlistToGeoJson,
  type ShortlistItem
} from "../lib/shortlist";
import { useBundle } from "../lib/useBundle";
import { ATTRIBUTION, collapseAttribution, loadBasemapStyle, type BasemapKind } from "../map/basemap";
import {
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
      raw.project_overlap_note != null ? String(raw.project_overlap_note) : undefined
  };
}

function contextStyle(layer: MapLayer): {
  fill?: typeof PERMIT_CONTEXT_FILL;
  line?: typeof PERMIT_CONTEXT_LINE;
  circle?: typeof GAP_MARKER_CIRCLE;
} {
  if (layer.flag_role === "project_overlap" || layer.id.includes("project-overlap")) {
    return { fill: PROJECT_OVERLAP_FILL, line: PROJECT_OVERLAP_LINE };
  }
  if (layer.flag_role === "permit_gap_marker" || layer.id.includes("gap")) {
    return { circle: GAP_MARKER_CIRCLE };
  }
  return { fill: PERMIT_CONTEXT_FILL, line: PERMIT_CONTEXT_LINE };
}

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGo, setShowGo] = useState(true);
  const [showCaution, setShowCaution] = useState(true);
  const [hidePermitHits, setHidePermitHits] = useState(false);
  const [hideStopHits, setHideStopHits] = useState(false);
  const [hideOverlapHits, setHideOverlapHits] = useState(false);
  const [shortlistReadyOnly, setShortlistReadyOnly] = useState(false);
  const [contextOn, setContextOn] = useState<Record<string, boolean>>({});
  const [inspect, setInspect] = useState<Inspect | null>(null);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [place, setPlace] = useState<string>(() => {
    const q = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    return q.get("case") || "coast";
  });

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
      for (const layer of contextLayers) {
        if (next[layer.id] === undefined) next[layer.id] = Boolean(layer.default_visible);
      }
      return next;
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
    loadBasemapStyle().then(({ style, kind: loadedKind }) => {
      if (cancelled || !container.current) return;
      setKind(loadedKind);
      const map = new maplibregl.Map({
        container: container.current,
        style,
        attributionControl: false,
        bounds: CAMBODIA_COAST_BOUNDS,
        fitBoundsOptions: { padding: 24 }
      });
      map.addControl(new maplibregl.NavigationControl(), "top-right");
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

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !screenLayer) return;
    let cancelled = false;
    loadLayerGeometry(screenLayer).then((fc) => {
      if (cancelled || mapRef.current !== map) return;
      geometryCache.current.set(screenLayer.id, fc as GeoJSON.FeatureCollection);
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: fc });
        const symbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;
        map.addLayer(
          { id: FILL_ID, type: "fill", source: SOURCE_ID, paint: GO_CAUTION_FILL },
          symbol
        );
        map.addLayer({ id: LINE_ID, type: "line", source: SOURCE_ID, paint: GO_CAUTION_LINE }, symbol);
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
    const symbol = () => map.getStyle().layers?.find((l) => l.type === "symbol")?.id;

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
            map.addLayer(
              { id: circleId, type: "circle", source: sourceId, paint: paint.circle },
              symbol()
            );
          }
        } else {
          if (paint.fill && !map.getLayer(fillId)) {
            map.addLayer({ id: fillId, type: "fill", source: sourceId, paint: paint.fill }, symbol());
          }
          if (paint.line && !map.getLayer(lineId)) {
            map.addLayer({ id: lineId, type: "line", source: sourceId, paint: paint.line }, symbol());
          }
        }
      })
    );

    return () => {
      cancelled = true;
    };
  }, [ready, contextLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const layer of contextLayers) {
      const sourceId = `khm-ctx-${layer.id}`;
      const visible = contextOn[layer.id] !== false;
      const vis = visible ? "visible" : "none";
      for (const suffix of ["fill", "line", "circle"]) {
        const id = `${sourceId}-${suffix}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      }
    }
  }, [contextOn, contextLayers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(FILL_ID)) return;
    const wanted = [showGo ? "go" : null, showCaution ? "caution" : null].filter(
      (v): v is string => Boolean(v)
    );
    const parts: maplibregl.FilterSpecification[] = [];
    if (wanted.length === 0) {
      parts.push(["==", ["get", "suitability"], "__none__"]);
    } else {
      parts.push(["in", ["get", "suitability"], ["literal", wanted]]);
    }
    if (hidePermitHits) parts.push(["!=", ["get", "permit_gate"], true]);
    if (hideStopHits) parts.push(["!=", ["get", "stop_legal"], true]);
    if (hideOverlapHits) parts.push(["!=", ["get", "project_overlap"], true]);
    if (shortlistReadyOnly) {
      parts.push(["==", ["get", "suitability"], "go"]);
      parts.push(["!=", ["get", "permit_gate"], true]);
      parts.push(["!=", ["get", "stop_legal"], true]);
      parts.push(["!=", ["get", "project_overlap"], true]);
    }
    const filter: maplibregl.FilterSpecification =
      parts.length === 1 ? parts[0]! : (["all", ...parts] as maplibregl.FilterSpecification);
    map.setFilter(FILL_ID, filter);
    map.setFilter(LINE_ID, filter);
  }, [
    showGo,
    showCaution,
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
      { padding: 32, duration: 0 }
    );
  }, [ready, cases.data, place]);

  const zoomCoast = () => {
    mapRef.current?.fitBounds(
      [
        [CAMBODIA_COAST_BOUNDS[0], CAMBODIA_COAST_BOUNDS[1]],
        [CAMBODIA_COAST_BOUNDS[2], CAMBODIA_COAST_BOUNDS[3]]
      ],
      { padding: 24, duration: 0 }
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
      { padding: 32, duration: 0 }
    );
    setPlace(c.id);
    window.history.replaceState(null, "", `#map?case=${c.id}`);
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

  const meaning = inspect ? meaningForClass(inspect.props.class_id) : null;

  return (
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section">
      <div className="khm-map-head">
        <Title headingLevel="h1">Screen map</Title>
        <HelperText>
          <HelperTextItem>
            Click a GO or CAUTION patch to read class meaning and Phase 2 flags. Flags cite instruments and
            overlaps — they never mean approved or refused. Shortlist exports include flag columns.
          </HelperTextItem>
        </HelperText>
        <div className="khm-map-tools">
          <ToggleGroup aria-label="Zoom to">
            <ToggleGroupItem text="Four provinces" buttonId="zoom-coast" isSelected={place === "coast"} onChange={zoomCoast} />
            {(cases.data ?? []).map((c) => (
              <ToggleGroupItem
                key={c.id}
                text={`Case ${c.id}`}
                buttonId={`zoom-case-${c.id}`}
                isSelected={place === c.id}
                onChange={() => zoomCase(c)}
              />
            ))}
          </ToggleGroup>
          {!panelOpen && (
            <Button variant="secondary" onClick={() => setPanelOpen(true)}>
              Show panel
            </Button>
          )}
        </div>
      </div>
      <Drawer isInline isExpanded={panelOpen} position="start" className="khm-map-drawer">
        <DrawerContent
          panelContent={
            <DrawerPanelContent isResizable defaultSize="22rem" minSize="16rem" resizeAriaLabel="Resize panel">
              <DrawerHead>
                <span id="layer-panel-title">Layers and inspect</span>
                <DrawerActions>
                  <DrawerCloseButton onClick={() => setPanelOpen(false)} />
                </DrawerActions>
              </DrawerHead>
              <DrawerPanelBody className="khm-layer-panel">
                <Title headingLevel="h2">Legend</Title>
                <ul className="khm-plain-list">
                  <li>
                    <Swatch color={SUITABILITY.go} label="GO — worth a field look" />
                  </li>
                  <li>
                    <Swatch color={SUITABILITY.caution} label="CAUTION — named check first" />
                  </li>
                  <li>
                    <Swatch color={FLAGS.permit} label="Permit context (Ramsar / PA)" />
                  </li>
                  <li>
                    <Swatch color={FLAGS.project} label="Project overlap (staged)" />
                  </li>
                </ul>
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Drawn layer
                </Title>
                {layers.error && <p role="alert">{layers.error}</p>}
                {screenLayer && (
                  <>
                    <p className="pf-v6-u-font-size-sm">
                      {screenLayer.title}{" "}
                      {(() => {
                        const cls = parseEvidenceClass(screenLayer.evidence_class);
                        return cls ? <EvidenceBadge cls={cls} /> : null;
                      })()}{" "}
                      <IllustrativeBadge
                        publicReady={manifest.data?.public_ready === true && screenLayer.public_ready}
                      />
                    </p>
                    <Checkbox id="show-go" isChecked={showGo} label="Show GO" onChange={(_e, on) => setShowGo(on)} />
                    <Checkbox
                      id="show-caution"
                      isChecked={showCaution}
                      label="Show CAUTION"
                      onChange={(_e, on) => setShowCaution(on)}
                    />
                    <LayerProvenance
                      layer={screenLayer}
                      publicReady={manifest.data?.public_ready === true}
                    />
                  </>
                )}
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Phase 2 flag filters
                </Title>
                <p className="pf-v6-u-font-size-sm">
                  Null means incomplete coverage — not a clearance. STOP (legal) stays unavailable until MoE
                  core zones exist.
                </p>
                <Checkbox
                  id="hide-permit"
                  isChecked={hidePermitHits}
                  label="Hide permit-gate hits"
                  onChange={(_e, on) => setHidePermitHits(on)}
                />
                <Checkbox
                  id="hide-stop"
                  isChecked={hideStopHits}
                  label="Hide STOP (legal) hits"
                  onChange={(_e, on) => setHideStopHits(on)}
                />
                <Checkbox
                  id="hide-overlap"
                  isChecked={hideOverlapHits}
                  label="Hide project-overlap hits"
                  onChange={(_e, on) => setHideOverlapHits(on)}
                />
                <Checkbox
                  id="shortlist-ready"
                  isChecked={shortlistReadyOnly}
                  label="GO ∩ no known flag hits (shortlist filter)"
                  onChange={(_e, on) => setShortlistReadyOnly(on)}
                />
                {contextLayers.length > 0 && (
                  <>
                    <Title headingLevel="h2" className="pf-v6-u-mt-md">
                      Context overlays
                    </Title>
                    {contextLayers.map((layer) => (
                      <div key={layer.id} className="khm-context-layer">
                        <Checkbox
                          id={`ctx-${layer.id}`}
                          isChecked={contextOn[layer.id] !== false}
                          label={layer.title}
                          onChange={(_e, on) => setContextOn((prev) => ({ ...prev, [layer.id]: on }))}
                        />
                        <LayerProvenance
                          layer={layer}
                          publicReady={manifest.data?.public_ready === true}
                        />
                      </div>
                    ))}
                    <p className="pf-v6-u-font-size-sm">
                      Full licence matrix: <a href="#licence">Licence and evidence</a>
                    </p>
                  </>
                )}
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Click inspect
                </Title>
                {!inspect && <p className="pf-v6-u-font-size-sm">Click a patch on the map.</p>}
                {inspect && (
                  <div className="khm-inspect">
                    <p>
                      <strong>{suitabilityLabel(inspect.props.suitability)}</strong>
                      {meaning ? ` · ${meaning.label}` : ` · class ${inspect.props.class_id}`}
                    </p>
                    {meaning && <p className="pf-v6-u-font-size-sm">{meaning.meaning}</p>}
                    <dl className="khm-facts">
                      <div>
                        <dt>Feature</dt>
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
                        <dt>Permit gate</dt>
                        <dd>{flagLabel(inspect.props.permit_gate)}</dd>
                      </div>
                      <div>
                        <dt>STOP (legal)</dt>
                        <dd>
                          {flagLabel(inspect.props.stop_legal)}
                          {inspect.props.stop_legal_status
                            ? ` · ${inspect.props.stop_legal_status}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt>Project overlap</dt>
                        <dd>
                          {flagLabel(inspect.props.project_overlap)}
                          {(inspect.props.project_overlap_ids ?? []).length
                            ? ` · ${(inspect.props.project_overlap_ids ?? []).join(", ")}`
                            : ""}
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
                  </div>
                )}
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Shortlist ({shortlist.length})
                </Title>
                {shortlist.length === 0 && <p className="pf-v6-u-font-size-sm">No patches yet.</p>}
                {shortlist.length > 0 && (
                  <>
                    <ul className="khm-plain-list pf-v6-u-font-size-sm">
                      {shortlist.map((row) => (
                        <li key={row.id}>
                          {row.id} · {suitabilityLabel(row.suitability)} · {row.area_ha.toFixed(1)} ha
                          {row.project_overlap === true ? " · overlap" : ""}
                          {row.permit_gate === true ? " · permit" : ""}
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
                        Export CSV
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
                        Export GeoJSON
                      </Button>
                      <Button variant="link" onClick={() => setShortlist([])}>
                        Clear
                      </Button>
                    </div>
                  </>
                )}
                {manifest.data && (
                  <p className="pf-v6-u-font-size-sm pf-v6-u-mt-md">
                    Bundle {manifest.data.version} · stub={String(manifest.data.stub)} · public_ready=
                    {String(manifest.data.public_ready)}
                  </p>
                )}
              </DrawerPanelBody>
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            <div className="khm-map-frame">
              <div ref={container} className="khm-map" role="region" aria-label="Cambodia GO and CAUTION screen map" />
              <div className="khm-map-key" aria-hidden>
                <Swatch color={SUITABILITY.go} label="GO" />
                <Swatch color={SUITABILITY.caution} label="CAUTION" />
              </div>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
      <p className="khm-basemap-note">Basemap names are from OpenStreetMap and imply no position on boundaries.</p>
      {kind === "offline" && <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>}
    </PageSection>
  );
}
