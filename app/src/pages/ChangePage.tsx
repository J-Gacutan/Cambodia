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
  Label,
  List,
  ListItem,
  Title
} from "@patternfly/react-core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAMBODIA_COAST_BOUNDS } from "../lib/bundle";
import {
  buildLocateHeadline,
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

/**
 * Locate — current mangrove state for a non-technical reader.
 * Ships GMW 2025 extent stock + GMW 1996→2025 loss/gain (extent differencing);
 * condition stays an explicit gap. Overlays fade before close satellite zoom.
 */
export default function ChangePage() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const basemapControlRef = useRef<BasemapControl | null>(null);
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const indexRef = useRef<ChangeIndex | null>(null);
  const [basemapChoice, setBasemapChoice] = useState<BasemapChoice>("satellite");
  const [kind, setKind] = useState<BasemapKind | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(
    () => !window.matchMedia("(max-width: 47.9375rem)").matches
  );
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
      setPanelOpen(true);
      window.requestAnimationFrame(() => {
        headlineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
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

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const id = window.setTimeout(() => map.resize(), 50);
    return () => window.clearTimeout(id);
  }, [panelOpen, ready]);

  const stateGaps = index?.state_gaps ?? [];
  const headline = useMemo(
    () =>
      buildLocateHeadline({
        layerOn,
        resolutionPlain: index?.resolution_plain ?? null
      }),
    [layerOn, index?.resolution_plain]
  );

  const layers = index?.layers ?? [];

  const panelInner = (
    <>
      <p ref={headlineRef} className="khm-panel-headline">
        {headline}
      </p>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        What this view covers
      </Title>
      <ul className="khm-plain-list pf-v6-u-font-size-sm">
        <li>
          <strong>Extent</strong> — where mangroves still stand in 2025. Toggle off to compare Satellite
          alone.
        </li>
        <li>
          <strong>Condition</strong> — mangrove health.{" "}
          <Label isCompact color="orange">
            Not assessed
          </Label>
        </li>
        <li>
          <strong>Change</strong> — loss or gain since 1996, plus optional built-up nearby as pressure
          context.
        </li>
      </ul>

      <Title headingLevel="h2" className="pf-v6-u-mt-md pf-v6-u-font-size-md">
        Layers
      </Title>
      {indexError && (
        <p className="pf-v6-u-font-size-sm" role="alert">
          Locate samples failed to load: {indexError}
        </p>
      )}
      {layers.map((layer) => (
        <div key={layer.id} className="khm-driver-toggle">
          <Checkbox
            id={`locate-${layer.id}`}
            isChecked={layerOn[layer.id] === true}
            isDisabled={layer.stub}
            label={
              <span className="khm-driver-label">
                {changeLayerShort(layer.id)}
                {layer.stub ? (
                  <Label isCompact color="orange">
                    Coming soon
                  </Label>
                ) : null}
              </span>
            }
            onChange={(_e, on) => setLayerOn((prev) => ({ ...prev, [layer.id]: on }))}
          />
        </div>
      ))}
      {!index && !indexError && <p className="pf-v6-u-font-size-sm">Loading layers…</p>}

      {inspect ? (
        <div className="khm-inspect khm-inspect-in-panel">
          <Title headingLevel="h2" className="pf-v6-u-font-size-md">
            Selected feature
          </Title>
          <p className="khm-panel-headline khm-panel-headline-sm">
            {inspect.layerTitle}. {inspect.classPlain}
            {inspect.areaHa != null ? ` · ${inspect.areaHa.toFixed(1)} ha` : ""}.
          </p>
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
                {inspect.resolutionPlain ?? "Generalised sample — coarser than the Read class map."}
              </dd>
            </div>
            <div>
              <dt>Feature</dt>
              <dd>{inspect.id}</dd>
            </div>
          </dl>
          {inspect.layerId === "mangrove-extent" && (
            <p className="pf-v6-u-font-size-sm">
              Living mangrove from Global Mangrove Watch 2025. Extent only — not health, and not a
              restoration shortlist.
            </p>
          )}
          {inspect.layerId === "mangrove-change" && (
            <p className="pf-v6-u-font-size-sm">
              Mangrove present in 1996 and absent in 2025. Not a driver attribution and not today’s living
              stock — turn on Extent 2025 for that.
            </p>
          )}
          {inspect.layerId === "mangrove-gain" && (
            <p className="pf-v6-u-font-size-sm">
              Mangrove absent in 1996 and present in 2025. Includes recovery and mapping refinement —
              treat as context, not a restoration score.
            </p>
          )}
          {inspect.layerId === "urban-change" && (
            <p className="pf-v6-u-font-size-sm">
              Built-up nearby from an open coastal sample — pressure context, not a multi-year expansion
              series or a health score.
            </p>
          )}
          <div className="khm-map-tools">
            <Button variant="link" isInline onClick={() => setInspect(null)}>
              Clear selection
            </Button>
          </div>
        </div>
      ) : (
        <p className="pf-v6-u-font-size-sm pf-v6-u-mt-md">
          Click extent, loss, gain, or built-up on the map for a plain reading. None of these layers is a
          mangrove-health score.
        </p>
      )}

      <div className="khm-change-next pf-v6-u-mt-md">
        <Button variant="primary" component="a" href="#cases">
          Next: Means — learn the legend
        </Button>
      </div>
    </>
  );

  return (
    <section className="khm-map-section khm-map-section-workspace khm-change-section">
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
                  <span id="locate-panel-title">Layers</span>
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
                  <span className="khm-key-note">~100 m · fades past ~z11.5</span>
                </div>
                {zoomPastScale && (
                  <div className="khm-change-zoom-note" role="status">
                    Overlays fade here on purpose — they are generalised samples (~100–300 m), not patch
                    outlines. Keep Satellite to read the coast; judge restoration patches on{" "}
                    <a href="#map">Read</a> after <a href="#cases">Means</a>.
                  </div>
                )}
                {basemapChoice !== "satellite" && (
                  <div className="khm-change-basemap-hint" role="note">
                    Satellite pairs better with these coarse samples. Streets names do not add mangrove
                    detail.
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
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="khm-change-meta">
        <p className="pf-v6-u-font-size-sm">
          Locate answers what is happening with mangroves along this coast today — 2025 extent plus loss
          or gain since 1996. A full year-by-year slider, multi-year urban expansion, and any health
          product remain gaps. Source notes live under <a href="#about">About</a>.
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
                  Gaps on this view
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
                    <ListItem key={need}>
                      {stripRegisterCodes(need)
                        .replace(/\s*\([^)]*\)/g, "")
                        .trim()}
                    </ListItem>
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
          Streets basemap names are from OpenStreetMap. Satellite tiles © Esri. Extent, loss/gain
          (1996–2025), and built-up samples are CC BY 4.0.
        </p>
        {kind === "offline" && (
          <p className="khm-basemap-note">Reference basemap unreachable; showing plain sea.</p>
        )}
      </div>
    </section>
  );
}
