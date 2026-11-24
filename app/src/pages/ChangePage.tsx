import {
  HelperText,
  HelperTextItem,
  Label,
  List,
  ListItem,
  PageSection,
  Title
} from "@patternfly/react-core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { StepNav } from "../flow/StepNav";
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";
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
 * Ecosystem change over time — open P2 samples (Goldberg L4, Dynamic World built).
 * On-canvas toggles mirror BasemapControl. Continues to #map for the restoration screen.
 */
export default function ChangePage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const basemapControlRef = useRef<BasemapControl | null>(null);
  const layerControlRef = useRef<LayerToggleControl | null>(null);
  const [basemapChoice, setBasemapChoice] = useState<BasemapChoice>("satellite");
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState<ChangeIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [layerOn, setLayerOn] = useState<Record<string, boolean>>({
    "mangrove-change": true,
    "urban-change": false
  });
  const basemapChoiceRef = useRef(basemapChoice);
  basemapChoiceRef.current = basemapChoice;

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
            "Goldberg mangrove loss drivers (CC BY 4.0)",
            "Dynamic World (CC BY 4.0)"
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

  // Attach on-canvas layer toggles once index is known
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !index || layerControlRef.current) return;
    const options = index.layers.map((layer) => ({
      id: layer.id,
      label: layer.id === "mangrove-change" ? "Mangrove change" : "Urban",
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

  // Load / refresh change geometries after style ready
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
      })
    );

    return () => {
      cancelled = true;
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
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section">
      <div className="khm-map-head">
        <Title headingLevel="h1">Ecosystem change over time</Title>
        <div className="khm-go-banner" role="note">
          Open P2 samples only — mangrove loss drivers (Goldberg L4) and a Dynamic World built proxy.
          GMW annual change (L1) and GHS multi-epoch urban (L8) are documented data needs, not FLAG
          rasters. Use on-canvas toggles (same pattern as Streets / Satellite).
        </div>
        <HelperText>
          <HelperTextItem>
            Locate step. Read change and pressure here, then continue to Read (screen map) for GO / CAUTION
            drivers. Layer toggles stay on the map canvas.
          </HelperTextItem>
        </HelperText>
        <StepNav current="locate" />
      </div>
      <div className="khm-map-frame khm-change-frame">
        <div
          ref={container}
          className="khm-map"
          role="region"
          aria-label="Cambodia ecosystem change map"
        />
        <div className="khm-map-key" aria-hidden>
          <span className="khm-key-row">
            <span className="khm-key-swatch" style={{ background: MANGROVE_FILL }} />
            Mangrove loss drivers (L4)
          </span>
          <span className="khm-key-row">
            <span className="khm-key-swatch" style={{ background: URBAN_FILL }} />
            Urban / built proxy (L10)
          </span>
        </div>
      </div>
      {indexError && (
        <p className="khm-basemap-note" role="alert">
          Change stubs failed to load: {indexError}
        </p>
      )}
      {index && (
        <div className="khm-change-meta">
          <Title headingLevel="h2">Layers on this screen</Title>
          <List isPlain>
            {index.layers.map((layer) => (
              <ListItem key={layer.id}>
                <strong>{layer.title}</strong>{" "}
                <Label isCompact color={layer.stub ? "orange" : "blue"}>
                  {layer.stub ? "Stub" : "Open sample"}
                </Label>
                {" · "}
                {layer.feature_count ?? 0} features · {layer.register_id}
                {layer.note ? <div className="pf-v6-u-font-size-sm">{layer.note}</div> : null}
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
                  <ListItem key={need}>{need}</ListItem>
                ))}
              </List>
            </>
          )}
          <p className="pf-v6-u-font-size-sm pf-v6-u-mt-sm">
            {index.licence} Change stubs sit outside the open-cleared contract pin (
            {index.not_in_open_cleared_pin ? "not in pin" : "check pin"}).
          </p>
        </div>
      )}
      <p className="khm-basemap-note">
        Streets basemap names are from OpenStreetMap. Satellite tiles © Esri. Goldberg L4 and Dynamic
        World are CC BY 4.0.
      </p>
      {kind === "offline" && (
        <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>
      )}
      <div className="khm-map-head">
        <StepNav current="locate" />
      </div>
    </PageSection>
  );
}
