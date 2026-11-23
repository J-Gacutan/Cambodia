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
import { useEffect, useRef, useState } from "react";
import {
  CAMBODIA_COAST_BOUNDS,
  loadCases,
  loadLayerGeometry,
  loadManifest,
  loadMapLayers,
  type CaseStudy,
  type FeatureProps,
  type MapLayer
} from "../lib/bundle";
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
import { GO_CAUTION_FILL, GO_CAUTION_LINE } from "../map/mapTheme";
import { SUITABILITY } from "../theme/colours";

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

export default function MapPage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGo, setShowGo] = useState(true);
  const [showCaution, setShowCaution] = useState(true);
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
        const raw = feature.properties as Record<string, unknown>;
        const props: FeatureProps = {
          ...(raw as FeatureProps),
          id: String(raw.id ?? ""),
          class_id: Number(raw.class_id),
          class_name: String(raw.class_name ?? ""),
          suitability: raw.suitability === "go" ? "go" : "caution",
          area_ha: Number(raw.area_ha),
          province: (raw.province as string | null | undefined) ?? null,
          place: raw.place != null ? String(raw.place) : undefined,
          note: raw.note != null ? String(raw.note) : undefined,
          stub: Boolean(raw.stub)
        };
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
    const layer = layers.data?.[0];
    if (!ready || !map || !layer) return;
    let cancelled = false;
    loadLayerGeometry(layer).then((fc) => {
      if (cancelled || mapRef.current !== map) return;
      geometryCache.current.set(layer.id, fc as GeoJSON.FeatureCollection);
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
  }, [ready, layers.data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(FILL_ID)) return;
    const wanted = [showGo ? "go" : null, showCaution ? "caution" : null].filter(
      (v): v is string => Boolean(v)
    );
    const filter: maplibregl.FilterSpecification =
      wanted.length === 0
        ? ["==", ["get", "suitability"], "__none__"]
        : ["in", ["get", "suitability"], ["literal", wanted]];
    map.setFilter(FILL_ID, filter);
    map.setFilter(LINE_ID, filter);
  }, [showGo, showCaution, ready, layers.data]);

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
    if (!inspect) return;
    const layer = layers.data?.[0];
    const fc = layer ? geometryCache.current.get(layer.id) : undefined;
    const match = fc?.features.find((f) => f.properties && (f.properties as FeatureProps).id === inspect.props.id);
    if (!match || !match.geometry || match.geometry.type === "GeometryCollection") return;
    const item = featureToShortlist(inspect.props, match.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon);
    setShortlist((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
  };

  const meaning = inspect ? meaningForClass(inspect.props.class_id) : null;
  const layerMeta: MapLayer | undefined = layers.data?.[0];

  return (
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section">
      <div className="khm-map-head">
        <Title headingLevel="h1">Screen map</Title>
        <HelperText>
          <HelperTextItem>
            Click a GO or CAUTION patch to read its class meaning. Shortlist patches for CSV / GeoJSON export.
            Physical screen only — not planting permission.
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
                </ul>
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Drawn layer
                </Title>
                {layers.error && <p role="alert">{layers.error}</p>}
                {layerMeta && (
                  <>
                    <p className="pf-v6-u-font-size-sm">{layerMeta.title}</p>
                    <Checkbox id="show-go" isChecked={showGo} label="Show GO" onChange={(_e, on) => setShowGo(on)} />
                    <Checkbox
                      id="show-caution"
                      isChecked={showCaution}
                      label="Show CAUTION"
                      onChange={(_e, on) => setShowCaution(on)}
                    />
                    <p className="pf-v6-u-font-size-sm pf-v6-u-mt-sm">{layerMeta.licence_plain}</p>
                    {layerMeta.stub && (
                      <p className="pf-v6-u-font-size-sm">
                        Stub geometry (sample). Replace via a later open-cleared version when{" "}
                        <code>khm-i6e.3.1</code> lands — bump <code>config/bundle-versions.json</code>.
                      </p>
                    )}
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
                      {inspect.props.place && (
                        <div>
                          <dt>Place</dt>
                          <dd>{inspect.props.place}</dd>
                        </div>
                      )}
                    </dl>
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
