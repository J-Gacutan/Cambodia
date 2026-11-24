import {
  Button,
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
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";
import {
  changeLayerShort,
  changeLayerTitle,
  parseChangeFeature,
  stripRegisterCodes,
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
  CHANGE_COARSE_ZOOM_WARN,
  CHANGE_LAYER_MAX_ZOOM,
  changeFillOpacity,
  changeLineOpacity,
  changeLineWidth,
  MANGROVE_CHANGE_FILL,
  MANGROVE_CHANGE_LINE,
  MANGROVE_EXTENT_FILL,
  MANGROVE_EXTENT_LINE,
  MANGROVE_GAIN_FILL,
  MANGROVE_GAIN_LINE,
  URBAN_CHANGE_FILL,
  URBAN_CHANGE_LINE
} from "../map/changeTheme";
import { LayerToggleControl } from "../map/LayerToggleControl";

/**
 * Locate — current mangrove state for a non-technical reader.
 * Ships GMW 2025 extent stock + GMW 1996→2025 loss/gain (extent differencing);
 * condition stays an explicit gap. Overlays fade before close satellite zoom.
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
  const [zoomPastScale, setZoomPastScale] = useState(false);
  const [layerOn, setLayerOn] = useState<Record<string, boolean>>({
    "mangrove-extent": true,
    "mangrove-change": true,
    "mangrove-gain": false,
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
    // Warm Streets JSON while dual style builds (Locate defaults to Satellite).
    void preloadStreetsBasemap();
    loadDualBasemapStyle(basemapChoiceRef.current).then(({ style, kind: loadedKind, streetsKind }) => {
      if (cancelled || !container.current) return;
      setKind(loadedKind);
      const map = new maplibregl.Map({
        container: container.current,
        style,
        attributionControl: false,
        bounds: CAMBODIA_COAST_BOUNDS,
        fitBoundsOptions: { padding: 24 },
        maxZoom: 16
      });
      rememberDualBasemap(map, style, streetsKind);
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
            "GMW mangrove extent 2025 (CC BY 4.0)",
            "GMW mangrove loss/gain 1996–2025 (CC BY 4.0)",
            "Built-up / urban change sample (CC BY 4.0)"
          ]
        })
      );
      collapseAttribution(map);
      const syncZoomWarn = () => {
        setZoomPastScale(map.getZoom() >= CHANGE_COARSE_ZOOM_WARN);
      };
      map.on("load", () => {
        if (!cancelled) {
          setReady(true);
          syncZoomWarn();
        }
      });
      map.on("zoomend", syncZoomWarn);
      map.on("moveend", syncZoomWarn);
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

  // Visibility-only swap — never setStyle (keeps change overlays mounted).
  // Depend on `ready` so the first user click is not eaten by a pre-map skip guard.
  useEffect(() => {
    basemapControlRef.current?.setChoice(basemapChoice);
    const map = mapRef.current;
    if (!ready || !map || !mapHasDualBasemap(map)) return;
    setKind(applyBasemapChoice(map, basemapChoice));
    collapseAttribution(map);
  }, [basemapChoice, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !index || layerControlRef.current) return;
    const options = index.layers.map((layer) => ({
      id: layer.id,
      label: changeLayerShort(layer.id),
      stub: layer.stub
    }));
    const ctrl = new LayerToggleControl("Locate layers", options, layerOn, (id, on) => {
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

    const paintFor = (layer: ChangeLayerMeta) => {
      if (layer.id === "mangrove-extent") {
        return { fill: MANGROVE_EXTENT_FILL, line: MANGROVE_EXTENT_LINE };
      }
      if (layer.id === "mangrove-gain") {
        return { fill: MANGROVE_GAIN_FILL, line: MANGROVE_GAIN_LINE };
      }
      if (layer.id === "urban-change") {
        return { fill: URBAN_CHANGE_FILL, line: URBAN_CHANGE_LINE };
      }
      return { fill: MANGROVE_CHANGE_FILL, line: MANGROVE_CHANGE_LINE };
    };

    const fillPeak = (layer: ChangeLayerMeta) => {
      if (layer.id === "mangrove-extent") return 0.52;
      if (layer.id === "mangrove-gain") return 0.45;
      if (layer.id === "urban-change") return 0.48;
      return 0.58;
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

    Promise.all(
      index.layers.map(async (layer) => {
        const fc = await loadChangeGeometry(layer.file);
        if (cancelled || mapRef.current !== map) return;
        const sourceId = `khm-change-${layer.id}`;
        const paint = paintFor(layer);
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "geojson",
            data: fc,
            // Client simplify at overview zooms; source is already generalised.
            tolerance: 0.375
          });
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(fc);
        }
        const fillId = `${sourceId}-fill`;
        const lineId = `${sourceId}-line`;
        if (!map.getLayer(fillId)) {
          // Append on top of dual basemap (satellite raster sits above Streets).
          map.addLayer({
            id: fillId,
            type: "fill",
            source: sourceId,
            maxzoom: CHANGE_LAYER_MAX_ZOOM,
            paint: {
              "fill-color": paint.fill,
              "fill-opacity": changeFillOpacity(fillPeak(layer)),
              "fill-outline-color": paint.line
            }
          });
        }
        if (!map.getLayer(lineId)) {
          map.addLayer({
            id: lineId,
            type: "line",
            source: sourceId,
            maxzoom: CHANGE_LAYER_MAX_ZOOM,
            paint: {
              "line-color": paint.line,
              "line-width": changeLineWidth(),
              "line-opacity": changeLineOpacity(
                layer.id === "urban-change"
                  ? 0.9
                  : layer.id === "mangrove-extent" || layer.id === "mangrove-gain"
                    ? 0.88
                    : 0.95
              )
            }
          });
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
  }, [ready, index]);

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
  }, [layerOn, index, ready]);

  const stateGaps = index?.state_gaps ?? [];

  return (
    <PageSection isFilled padding={{ default: "noPadding" }} className="khm-map-section khm-change-section">
      <div className="khm-map-head khm-change-head">
        <Title headingLevel="h1">Locate — current state of the coast</Title>
        <HelperText>
          <HelperTextItem>
            Skim what this console can say about mangroves <em>now</em>: living extent stock (2025), GMW
            loss since 1996, optional gain, and a built-up proxy. Condition scores are not on this map —
            named below. Prefer Satellite; overlays fade as you zoom so generalised outlines do not look
            like patch-level data.
          </HelperTextItem>
        </HelperText>
      </div>

      <div className="khm-change-primer" role="region" aria-label="What current state means">
        <Title headingLevel="h2">What “current state” means here</Title>
        <List isPlain>
          <ListItem>
            <strong>Extent</strong> — where mangroves still stand as a stock layer.{" "}
            <Label isCompact color="blue">
              On Locate
            </Label>{" "}
            GMW 2025 mangrove extent (coastal clip). Toggle off to compare Satellite alone; Read still
            shortlists open/accreted restoration patches, not this stock layer.
          </ListItem>
          <ListItem>
            <strong>Condition</strong> — health, degradation, or canopy quality.{" "}
            <Label isCompact color="orange">
              Not assessed
            </Label>{" "}
            No condition score ships on this console.
          </ListItem>
          <ListItem>
            <strong>Change</strong> — where mangroves were lost (or gained) since 1996, and where built land
            sits nearby.{" "}
            <Label isCompact color="blue">
              GMW differencing
            </Label>{" "}
            Loss = GMW extent in 1996 minus 2025; gain is the reverse (default off). Built-up remains a
            coarse proxy — not an annual time slider.
          </ListItem>
        </List>
        {(index?.resolution_plain || stateGaps.length > 0) && (
          <p className="khm-change-resolution pf-v6-u-font-size-sm">
            <strong>Resolution.</strong>{" "}
            {index?.resolution_plain ??
              "These polygons are generalised (~100–300 m). They are coarser than the Read screen’s 10 m class map and will look blocky if you zoom past their scale — so they fade on purpose."}
          </p>
        )}
      </div>

      <div className="khm-change-workspace">
        <div className="khm-map-frame khm-change-frame">
          <div
            ref={container}
            className="khm-map khm-change-map"
            role="region"
            aria-label="Cambodia mangrove locate map"
          />
          <div className="khm-map-key" aria-hidden>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: MANGROVE_EXTENT_FILL }} />
              Mangrove extent 2025
            </span>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: MANGROVE_CHANGE_FILL }} />
              Mangrove loss 1996–2025
            </span>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: MANGROVE_GAIN_FILL }} />
              Mangrove gain 1996–2025
            </span>
            <span className="khm-key-row">
              <span className="khm-key-swatch" style={{ background: URBAN_CHANGE_FILL }} />
              Built-up nearby (sample)
            </span>
            <span className="khm-key-note">~100 m GMW · fades past ~z11.5</span>
          </div>
          {zoomPastScale && (
            <div className="khm-change-zoom-note" role="status">
              Overlays fade here on purpose — they are generalised samples (~100–300 m), not patch outlines.
              Keep Satellite to read the coast; judge restoration patches on{" "}
              <a href="#map">Read</a> after <a href="#cases">Means</a>.
            </div>
          )}
          {basemapChoice !== "satellite" && (
            <div className="khm-change-basemap-hint" role="note">
              Satellite pairs better with these coarse samples. Streets names do not add mangrove detail.
              <Button
                variant="link"
                isInline
                className="pf-v6-u-ml-sm"
                onClick={() => setBasemapChoice("satellite")}
              >
                Switch to Satellite
              </Button>
            </div>
          )}
        </div>
        <aside className="khm-inspect-panel" aria-label="Locate click inspect">
          <Title headingLevel="h2">Click inspect</Title>
          {!inspect && (
            <p className="pf-v6-u-font-size-sm">
              Click extent, loss, gain, or built-up polygons for a plain reading. Extent is 2025 living
              stock; loss/gain are GMW 1996→2025 differencing; built is pressure context — none is a
              condition score.
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
                  <dt>Scale</dt>
                  <dd>
                    {inspect.resolutionPlain ??
                      "Generalised sample — coarser than the Read class map."}
                  </dd>
                </div>
                <div>
                  <dt>Feature</dt>
                  <dd>{inspect.id}</dd>
                </div>
              </dl>
              {inspect.layerId === "mangrove-extent" && (
                <p className="pf-v6-u-font-size-sm">
                  Living mangrove stock from Global Mangrove Watch 2025 (open CC BY coastal clip). This is
                  extent only — not health, canopy, or degradation, and not a restoration shortlist.
                </p>
              )}
              {inspect.layerId === "mangrove-change" && (
                <p className="pf-v6-u-font-size-sm">
                  Mangrove present in Global Mangrove Watch 1996 and absent in 2025 (extent differencing, CC
                  BY coastal clip). Not a driver attribution and not today’s living stock — toggle Extent
                  2025 for that.
                </p>
              )}
              {inspect.layerId === "mangrove-gain" && (
                <p className="pf-v6-u-font-size-sm">
                  Mangrove absent in Global Mangrove Watch 1996 and present in 2025. Includes recovery and
                  mapping refinement — treat as context, not a restoration score.
                </p>
              )}
              {inspect.layerId === "urban-change" && (
                <p className="pf-v6-u-font-size-sm">
                  Built-up / urban proxy from an open coastal sample — nearby pressure, not a multi-year
                  expansion series or a condition score.
                </p>
              )}
              <Button variant="link" isInline onClick={() => setInspect(null)}>
                Clear selection
              </Button>
            </div>
          )}
          <div className="khm-change-next pf-v6-u-mt-md">
            <Button variant="primary" component="a" href="#cases">
              Next: Means (legend + cases)
            </Button>
          </div>
        </aside>
      </div>
      {indexError && (
        <p className="khm-basemap-note" role="alert">
          Locate samples failed to load: {indexError}
        </p>
      )}
      <div className="khm-change-meta">
        <p className="pf-v6-u-font-size-sm">
          Locate answers “what is going on with mangroves along this coast?” with 2025 extent stock plus
          GMW 1996→2025 loss/gain. A full annual time slider, multi-year urban expansion, and any condition
          product remain documented gaps — sensitive pond maps stay offline. Source notes live under{" "}
          <a href="#about">About</a>.
        </p>
        {index && (
          <>
            <Title headingLevel="h2">Layers on this screen</Title>
            <List isPlain>
              {index.layers.map((layer) => (
                <ListItem key={layer.id}>
                  <strong>{changeLayerTitle(layer)}</strong>{" "}
                  <Label isCompact color={layer.stub ? "orange" : "blue"}>
                    {layer.stub
                      ? "Coming soon"
                      : layer.state_role === "extent"
                        ? "Open stock"
                        : "Open sample"}
                  </Label>
                  {layer.state_role ? (
                    <>
                      {" "}
                      <Label isCompact color="grey">
                        {layer.state_role}
                      </Label>
                    </>
                  ) : null}
                  {" · "}
                  {layer.feature_count ?? 0} features
                  {layer.display_resolution_m != null ? (
                    <span className="pf-v6-u-font-size-sm">
                      {" "}
                      · ~{layer.display_resolution_m} m display scale
                    </span>
                  ) : null}
                  <span className="pf-v6-u-font-size-sm">
                    {" "}
                    · source {layer.register_id}
                  </span>
                  {layer.resolution_plain || layer.note ? (
                    <div className="pf-v6-u-font-size-sm">
                      {stripRegisterCodes(layer.resolution_plain || layer.note || "")}
                    </div>
                  ) : null}
                </ListItem>
              ))}
            </List>
            {stateGaps.length > 0 && (
              <>
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  State gaps (plain)
                </Title>
                <List>
                  {stateGaps.map((gap) => (
                    <ListItem key={gap.facet}>
                      <strong>{gap.facet}</strong>{" "}
                      <Label isCompact color={gap.status === "sample" ? "blue" : "orange"}>
                        {gap.status}
                      </Label>
                      {" — "}
                      {gap.plain}
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {index.data_needs && index.data_needs.length > 0 && (
              <>
                <Title headingLevel="h2" className="pf-v6-u-mt-md">
                  Documented data needs
                </Title>
                <List>
                  {index.data_needs.map((need) => (
                    <ListItem key={need}>{stripRegisterCodes(need).replace(/\s*\([^)]*\)/g, "").trim()}</ListItem>
                  ))}
                </List>
              </>
            )}
            <p className="pf-v6-u-font-size-sm pf-v6-u-mt-sm">
              {stripRegisterCodes(index.licence)} These samples sit beside the main restoration package (
              {index.not_in_open_cleared_pin ? "not in the pinned pack" : "check pack"}).
            </p>
          </>
        )}
        <p className="khm-basemap-note">
          Streets basemap names are from OpenStreetMap. Satellite tiles © Esri. GMW extent, GMW
          loss/gain (1996–2025), and built-up samples are CC BY 4.0.
        </p>
        {kind === "offline" && (
          <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>
        )}
      </div>
    </PageSection>
  );
}
