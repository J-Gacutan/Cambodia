import { Button, HelperText, HelperTextItem, Label, List, ListItem, PageSection, Title } from "@patternfly/react-core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";
import {
  changeLayerShort,
  changeLayerTitle,
  parseChangeFeature,
  type ChangeInspect
} from "../lib/changeLabels";
import {
  loadChangeGeometry,
  loadChangeIndex,
  type ChangeIndex,
  type ChangeLayerMeta
} from "../lib/changeLayers";
import {
  ATTRIBUTION,
  collapseAttribution,
  loadBasemapStyle,
  type BasemapChoice,
  type BasemapKind
} from "../map/basemap";
import { BasemapControl } from "../map/BasemapControl";
import { LayerToggleControl } from "../map/LayerToggleControl";

const MANGROVE_FILL = "#2F6F4E";
const MANGROVE_LINE = "#1B4332";
const URBAN_FILL = "#8B4513";
const URBAN_LINE = "#5C2E0A";

/**
 * Ecosystem change over time — open P2 samples (mangrove loss + built-up / urban).
 * On-canvas toggles mirror BasemapControl. Continues to #map for the restoration screen.
 */
export default function ChangePage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const basemapControlRef = useRef<BasemapControl | null>(null);
  const layerControlRef = useRef<LayerToggleControl | null>(null);
  const indexRef = useRef<ChangeIndex | null>(null);
  const [basemapChoice, setBasemapChoice] = useState<BasemapChoice>("satellite");
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState<ChangeIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [inspect, setInspect] = useState<ChangeInspect | null>(null);
  const [layerOn, setLayerOn] = useState<Record<string, boolean>>({
    "mangrove-change": true,
    "urban-change": false
  });
  const basemapChoiceRef = useRef(basemapChoice);
  basemapChoiceRef.current = basemapChoice;
  indexRef.current = index;

  useEffect(() => {
    let cancelled = false;
    loadChangeIndex()
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setIndexError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadBasemapStyle(basemapChoiceRef.current).then(({ style, kind: loadedKind }) => {
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
      const basemapCtrl = new BasemapControl(basemapChoiceRef.current, (next) => setBasemapChoice(next));
      basemapControlRef.current = basemapCtrl;
      map.addControl(basemapCtrl, "top-left");
      map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-left");
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: [
            ATTRIBUTION.bundle,
            "Mangrove loss drivers (CC BY 4.0)",
            "Built-up / urban change sample (CC BY 4.0)"
          ]
        })
      );
      collapseAttribution(map);
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = undefined;
      basemapControlRef.current = null;
      layerControlRef.current = null;
      setReady(false);
    };
  }, []);

  const basemapSwitchReady = useRef(false);
  useEffect(() => {
    basemapControlRef.current?.setChoice(basemapChoice);
    const map = mapRef.current;
    if (!map) return;
    if (!basemapSwitchReady.current) {
      basemapSwitchReady.current = true;
      return;
    }
    let cancelled = false;
    setReady(false);
    loadBasemapStyle(basemapChoice).then(({ style, kind: loadedKind }) => {
      if (cancelled || mapRef.current !== map) return;
      setKind(loadedKind);
      map.once("style.load", () => {
        if (!cancelled && mapRef.current === map) {
          collapseAttribution(map);
          setReady(true);
        }
      });
      map.setStyle(style);
    });
    return () => {
      cancelled = true;
    };
  }, [basemapChoice]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !index || layerControlRef.current) return;
    const options = index.layers.map((layer) => ({
      id: layer.id,
      label: changeLayerShort(layer.id),
      stub: layer.stub
    }));
    const ctrl = new LayerToggleControl("Change layers", options, layerOn, (id, on) => {
      setLayerOn((prev) => ({ ...prev, [id]: on }));
    });
    layerControlRef.current = ctrl;
    map.addControl(ctrl, "top-left");
  }, [index, ready]); // eslint-disable-line react-hooks/exhaustive-deps -- attach once

  useEffect(() => {
    layerControlRef.current?.setState(layerOn);
  }, [layerOn]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !index) return;
    let cancelled = false;
    const symbol = () => map.getStyle().layers?.find((l) => l.type === "symbol")?.id;

    const paintFor = (layer: ChangeLayerMeta) => {
      if (layer.id === "urban-change") {
        return { fill: URBAN_FILL, line: URBAN_LINE };
      }
      return { fill: MANGROVE_FILL, line: MANGROVE_LINE };
    };

    const onFeatureClick = (layer: ChangeLayerMeta) => (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature?.properties) return;
      setInspect(
        parseChangeFeature(
          layer,
          feature.properties as Record<string, unknown>,
          event.lngLat.lng,
          event.lngLat.lat
        )
      );
    };

    const fillIds: string[] = [];

    Promise.all(
      index.layers.map(async (layer) => {
        const fc = await loadChangeGeometry(layer.file);
        if (cancelled || mapRef.current !== map) return;
        const sourceId = `khm-change-${layer.id}`;
        const paint = paintFor(layer);
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: "geojson", data: fc });
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(fc);
        }
        const fillId = `${sourceId}-fill`;
        const lineId = `${sourceId}-line`;
        fillIds.push(fillId);
        if (!map.getLayer(fillId)) {
          map.addLayer(
            {
              id: fillId,
              type: "fill",
              source: sourceId,
              paint: { "fill-color": paint.fill, "fill-opacity": 0.45 }
            },
            symbol()
          );
        }
        if (!map.getLayer(lineId)) {
          map.addLayer(
            {
              id: lineId,
              type: "line",
              source: sourceId,
              paint: { "line-color": paint.line, "line-width": 1.25 }
            },
            symbol()
          );
        }
        map.on("click", fillId, onFeatureClick(layer));
        map.on("mouseenter", fillId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", fillId, () => {
          map.getCanvas().style.cursor = "";
        });
      })
    );

    return () => {
      cancelled = true;
      for (const layer of index.layers) {
        const fillId = `khm-change-${layer.id}-fill`;
        map.off("click", fillId, onFeatureClick(layer));
      }
    };
  }, [ready, index, basemapChoice]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !index) return;
    for (const layer of index.layers) {
      const sourceId = `khm-change-${layer.id}`;
      const vis = layerOn[layer.id] ? "visible" : "none";
      for (const suffix of ["fill", "line"]) {
        const id = `${sourceId}-${suffix}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      }
    }
  }, [layerOn, index, ready, basemapChoice]);

  return (
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section khm-change-section">
      <div className="khm-map-head khm-change-head">
        <Title headingLevel="h1">Ecosystem change over time</Title>
        <HelperText>
          <HelperTextItem>
            Locate step — click a shape for a plain-language reading, then continue to Means (examples)
            before the restoration map. Layer and basemap toggles stay on the map.
          </HelperTextItem>
        </HelperText>
      </div>
      <div className="khm-change-workspace">
        <div className="khm-map-frame khm-change-frame">
          <div
            ref={container}
            className="khm-map khm-change-map"
            role="region"
            aria-label="Cambodia ecosystem change map"
          />
          <div className="khm-map-key" aria-hidden>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: MANGROVE_FILL }} />
              Mangrove loss drivers
            </span>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: URBAN_FILL }} />
              Built-up / urban change
            </span>
          </div>
        </div>
        <aside className="khm-inspect-panel" aria-label="Change click inspect">
          <Title headingLevel="h2">Click inspect</Title>
          {!inspect && (
            <p className="pf-v6-u-font-size-sm">
              Click a mangrove-loss or built-up polygon. Details appear here in plain language.
            </p>
          )}
          {inspect && (
            <div className="khm-inspect">
              <p>
                <strong>{inspect.layerTitle}</strong>
              </p>
              <p className="pf-v6-u-font-size-sm">{inspect.classPlain}</p>
              <dl className="khm-facts">
                <div>
                  <dt>Reading</dt>
                  <dd>{inspect.classPlain}</dd>
                </div>
                <div>
                  <dt>Approx. area</dt>
                  <dd>{inspect.areaHa != null ? `${inspect.areaHa.toFixed(1)} ha` : "—"}</dd>
                </div>
                <div>
                  <dt>Feature</dt>
                  <dd>{inspect.id}</dd>
                </div>
              </dl>
              {inspect.layerId === "mangrove-change" && (
                <p className="pf-v6-u-font-size-sm">
                  Mangrove loss driver from an open coastal sample (2000–2016). Use it as pressure context
                  before judging restoration patches on the screen map.
                </p>
              )}
              {inspect.layerId === "urban-change" && (
                <p className="pf-v6-u-font-size-sm">
                  Built-up / urban proxy from an open coastal sample — pressure context, not a multi-year
                  change series.
                </p>
              )}
              <Button variant="link" isInline onClick={() => setInspect(null)}>
                Clear selection
              </Button>
            </div>
          )}
        </aside>
      </div>
      {indexError && (
        <p className="khm-basemap-note" role="alert">
          Change samples failed to load: {indexError}
        </p>
      )}
      <div className="khm-change-meta">
        <p className="pf-v6-u-font-size-sm">
          Open research samples only — mangrove loss drivers and a built-up / urban proxy. Fuller year-by-year
          change layers are still a documented data need. Source notes live under <a href="#about">About</a>.
        </p>
        {index && (
          <>
            <Title headingLevel="h2">Layers on this screen</Title>
            <List isPlain>
              {index.layers.map((layer) => (
                <ListItem key={layer.id}>
                  <strong>{changeLayerTitle(layer)}</strong>{" "}
                  <Label isCompact color={layer.stub ? "orange" : "blue"}>
                    {layer.stub ? "Coming soon" : "Open sample"}
                  </Label>
                  {" · "}
                  {layer.feature_count ?? 0} features
                  <span className="pf-v6-u-font-size-sm">
                    {" "}
                    · source {layer.register_id}
                  </span>
                  {layer.note ? (
                    <div className="pf-v6-u-font-size-sm">
                      {layer.note.replace(/\bL\d+\b/g, "").replace(/\s{2,}/g, " ").trim()}
                    </div>
                  ) : null}
                </ListItem>
              ))}
            </List>
            {index.data_needs && index.data_needs.length > 0 && (
              <>
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Documented data needs
                </Title>
                <List>
                  {index.data_needs.map((need) => (
                    <ListItem key={need}>{need.replace(/\s*\(L\d+\)/g, "")}</ListItem>
                  ))}
                </List>
              </>
            )}
            <p className="pf-v6-u-font-size-sm pf-v6-u-mt-sm">
              {index.licence.replace(/\bL\d+\b/g, "").replace(/\s{2,}/g, " ").trim()} These samples sit beside
              the main restoration package ({index.not_in_open_cleared_pin ? "not in the pinned pack" : "check pack"}).
            </p>
          </>
        )}
        <p className="khm-basemap-note">
          Streets basemap names are from OpenStreetMap. Satellite tiles © Esri. Mangrove loss and built-up
          samples are CC BY 4.0.
        </p>
        {kind === "offline" && (
          <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>
        )}
      </div>
    </PageSection>
  );
}
