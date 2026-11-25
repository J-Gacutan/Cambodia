import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Banner,
  Button,
  Label,
  List,
  ListItem,
  PageSection,
  SearchInput,
  Title
} from "@patternfly/react-core";
import { useEffect, useMemo, useState } from "react";
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { BUNDLE_VERSION } from "../lib/env";
import { loadManifest, loadMapLayers, type MapLayer } from "../lib/bundle";
import { changeLayerTitle, stripRegisterCodes } from "../lib/changeLabels";
import { loadChangeIndex, type ChangeIndex, type ChangeLayerMeta } from "../lib/changeLayers";
import { parseEvidenceClass } from "../lib/evidence";
import { layerDisplayTitle } from "../lib/layerLabels";
import { useBundle } from "../lib/useBundle";
import { hashPath, useHash } from "../lib/hash";

type SectionId = "how" | "colours" | "limits" | "data" | "licence" | "locate" | "layers";

const SECTIONS: { id: SectionId; nav: string }[] = [
  { id: "how", nav: "How it works" },
  { id: "colours", nav: "Colours" },
  { id: "limits", nav: "Limits" },
  { id: "data", nav: "Data" },
  { id: "licence", nav: "Licence" },
  { id: "locate", nav: "Locate layers" },
  { id: "layers", nav: "Package layers" }
];

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesFilter(haystack: string, q: string): boolean {
  if (!q) return true;
  return norm(haystack).includes(q);
}

function changeLayerHaystack(layer: ChangeLayerMeta): string {
  return [
    changeLayerTitle(layer),
    layer.id,
    layer.state_role ?? "",
    stripRegisterCodes(layer.resolution_plain || layer.note || "")
  ].join(" ");
}

function mapLayerHaystack(layer: MapLayer): string {
  return [
    layerDisplayTitle(layer),
    layer.id,
    layer.register_id,
    layer.licence_plain,
    layer.licence_spdx ?? "",
    layer.note ?? "",
    layer.flag_role ?? "",
    layer.evidence_class
  ].join(" ");
}

export default function AboutPage() {
  const hash = useHash("#about");
  const onLicence = hashPath(hash) === "licence";
  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const [changeIndex, setChangeIndex] = useState<ChangeIndex | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<SectionId>>(() => new Set<SectionId>(["how"]));
  const [filter, setFilter] = useState("");
  const publicReady = manifest.data?.public_ready === true;
  const version = manifest.data?.version ?? BUNDLE_VERSION;
  const built = manifest.data?.built;
  const filterQ = norm(filter);

  useEffect(() => {
    let cancelled = false;
    loadChangeIndex()
      .then((data) => {
        if (!cancelled) setChangeIndex(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setChangeError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onLicence) return;
    setExpanded((prev) => {
      if (prev.has("licence")) return prev;
      const next = new Set(prev);
      next.add("licence");
      return next;
    });
    const el = document.getElementById("licence");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [onLicence, changeIndex, layers.data]);

  useEffect(() => {
    if (!filterQ) return;
    setExpanded((prev) => {
      if (prev.has("locate") && prev.has("layers")) return prev;
      const next = new Set(prev);
      next.add("locate");
      next.add("layers");
      return next;
    });
  }, [filterQ]);

  const filteredChangeLayers = useMemo(() => {
    if (!changeIndex) return [];
    if (!filterQ) return changeIndex.layers;
    return changeIndex.layers.filter((layer) => matchesFilter(changeLayerHaystack(layer), filterQ));
  }, [changeIndex, filterQ]);

  const filteredGaps = useMemo(() => {
    if (!changeIndex) return [];
    const gaps = changeIndex.state_gaps ?? [];
    if (!filterQ) return gaps;
    return gaps.filter((gap) => matchesFilter(`${gap.facet} ${gap.plain} ${gap.status}`, filterQ));
  }, [changeIndex, filterQ]);

  const filteredNeeds = useMemo(() => {
    if (!changeIndex?.data_needs) return [];
    if (!filterQ) return changeIndex.data_needs;
    return changeIndex.data_needs.filter((need) =>
      matchesFilter(stripRegisterCodes(need).replace(/\s*\([^)]*\)/g, ""), filterQ)
    );
  }, [changeIndex, filterQ]);

  const filteredMapLayers = useMemo(() => {
    const list = layers.data ?? [];
    if (!filterQ) return list;
    return list.filter((layer) => matchesFilter(mapLayerHaystack(layer), filterQ));
  }, [layers.data, filterQ]);

  const toggleSection = (id: SectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goSection = (id: SectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (id === "licence") {
      if (hashPath(window.location.hash || "#about") !== "licence") {
        window.location.hash = "licence";
        return;
      }
    } else if (hashPath(window.location.hash || "#about") === "licence") {
      window.location.hash = "about";
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const expandAll = () => setExpanded(new Set(SECTIONS.map((s) => s.id)));
  const collapseAll = () => setExpanded(new Set());

  const licenceHaystack = changeIndex
    ? `${changeIndex.licence} ${stripRegisterCodes(changeIndex.licence)}`
    : "";
  const showLocateLicence =
    !filterQ || matchesFilter(licenceHaystack, filterQ) || filteredChangeLayers.length > 0;

  return (
    <PageSection className="khm-prose khm-about">
      <Title headingLevel="h1">About this pack</Title>
      <Banner
        color={publicReady ? "blue" : "orange"}
        className="khm-banner khm-about-banner"
        role="region"
        aria-label="Package status"
      >
        {publicReady ? (
          <>
            Research pack for four coastal provinces.{" "}
            <strong>GO means worth a field visit</strong> — from land cover only, not a permit or a carbon
            credit.
          </>
        ) : (
          <>
            Internal draft — not cleared for public sharing yet.{" "}
            <strong>GO means worth a field visit</strong> — from land cover only.
          </>
        )}
      </Banner>

      <p>
        This console helps a team shortlist mangrove restoration sites that look worth walking, so people can
        plan a field visit. It covers Cambodia’s four coastal provinces. It is not zoning advice, land-rights
        clearance, planting permission, or a carbon score.
      </p>

      <div className="khm-map-tools">
        <Button variant="secondary" component="a" href="#home">
          Back to Frame
        </Button>
        <Button variant="primary" component="a" href="#map">
          Open the map
        </Button>
        <Button variant="link" component="a" href="#act">
          Go to Act (shortlist)
        </Button>
      </div>

      <nav className="khm-about-nav" aria-label="About sections">
        <p className="khm-about-nav-hint">
          Jump to a section (opens it). Use the search to find a layer or licence line.
        </p>
        <div className="khm-about-nav-row">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant={expanded.has(section.id) ? "secondary" : "tertiary"}
              className="khm-about-nav-btn"
              onClick={() => goSection(section.id)}
              aria-controls={section.id}
            >
              {section.nav}
            </Button>
          ))}
        </div>
        <div className="khm-about-nav-tools">
          <SearchInput
            className="khm-about-filter"
            placeholder="Filter layers or licence text"
            value={filter}
            onChange={(_e, value) => setFilter(value)}
            onClear={() => setFilter("")}
            aria-label="Filter layers or licence text"
          />
          <div className="khm-about-nav-expand">
            <Button variant="link" isInline onClick={expandAll}>
              Open all
            </Button>
            <Button variant="link" isInline onClick={collapseAll}>
              Close all
            </Button>
          </div>
        </div>
      </nav>

      <Accordion headingLevel="h2" className="khm-about-accordion">
        <AccordionItem isExpanded={expanded.has("how")} id="how" className="khm-about-section">
          <AccordionToggle id="about-toggle-how" onClick={() => toggleSection("how")}>
            How the screen works
          </AccordionToggle>
          <AccordionContent id="about-expand-how">
            <p>
              Five steps keep the same path every time: set the question (Frame), skim how the coast has changed
              (Locate), learn the colours with examples (Means), judge sites on the map (Read), then take the
              shortlist forward (Act). Colours are readings you can quote — they never approve or refuse a site.
            </p>
            <ul>
              <li>
                <strong>GO</strong> — open land that was once mangrove and still looks worth walking.
              </li>
              <li>
                <strong>CAUTION</strong> — a named reason to pause (tide, height, converted land, active pond,
                rights context, or an existing carbon project).
              </li>
              <li>
                <strong>Overlays</strong> — protected-area context and existing project outlines for awareness only.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("colours")} id="colours" className="khm-about-section">
          <AccordionToggle id="about-toggle-colours" onClick={() => toggleSection("colours")}>
            What the colours mean (once)
          </AccordionToggle>
          <AccordionContent id="about-expand-colours">
            <p>
              On Read, the map draws four live colours from this pack, plus a height filter. Plain names first;
              method codes stay in the layer list below.
            </p>
            <ul>
              <li>
                <strong>Open land (GO)</strong> — former mangrove that now reads as open cover.
              </li>
              <li>
                <strong>Tide / mudflat</strong> — pause; do not plant on mudflats.
              </li>
              <li>
                <strong>Converted land</strong> — former mangrove now in another use (crops or trees that are not
                mangrove).
              </li>
              <li>
                <strong>Active pond</strong> (berry / magenta on the map, not the amber tide colour) — reads as an
                active or on-and-off pond. Check who uses it before any claim. About 500 pond patches (~1,350 ha)
                ship on this pack; source pond maps stay offline.
              </li>
              <li>
                <strong>Height above the tide</strong> — optional filter that holds back open land that sits too high.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("limits")} id="limits" className="khm-about-section">
          <AccordionToggle id="about-toggle-limits" onClick={() => toggleSection("limits")}>
            What this is not
          </AccordionToggle>
          <AccordionContent id="about-expand-limits">
            <p>
              The map is a land-cover filter. Flags name instruments and overlaps; they do not mean a site is
              approved or refused. Ministry core-zone stops are not on this pack yet — until they are, that check
              stays unavailable. Case B is not in this pack (no open-water override example or data).
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("data")} id="data" className="khm-about-section">
          <AccordionToggle id="about-toggle-data" onClick={() => toggleSection("data")}>
            Data on this build
          </AccordionToggle>
          <AccordionContent id="about-expand-data">
            <p>
              Package version <strong>{version}</strong>
              {built ? ` · built ${built}` : ""}.
              {publicReady
                ? " Cleared for this research share."
                : " Still illustrative — do not publish as a public product."}{" "}
              For redistribution decisions, quote the original source register, not this website alone.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("licence")} id="licence" className="khm-about-section">
          <AccordionToggle id="about-toggle-licence" onClick={() => toggleSection("licence")}>
            Sharing and licence
          </AccordionToggle>
          <AccordionContent id="about-expand-licence">
            <p>
              This console is aimed at public research sharing (GitHub Pages). Sensitive working rasters never go
              into the public site. Protected-area and carbon-project outlines may appear as research context only —
              not for commercial republishing, and not as planting permission. Active-pond polygons ship for a
              research hold-back; the original pond maps stay offline.
            </p>
            <ul>
              <li>
                <strong>Public research site</strong> —{" "}
                {publicReady ? "allowed for this pack" : "blocked until the pack is cleared"}.
              </li>
              <li>
                <strong>Local preview</strong> — fine for team review against the pinned package.
              </li>
              <li>
                <strong>Source pond maps</strong> — stay offline; only screened polygons appear here.
              </li>
              <li>
                <strong>Protected-area and project overlays</strong> — research use on this console; do not claim
                commercial redistribution.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("locate")} id="locate" className="khm-about-section">
          <AccordionToggle id="about-toggle-locate" onClick={() => toggleSection("locate")}>
            Locate layers (coast picture)
          </AccordionToggle>
          <AccordionContent id="about-expand-locate">
            <p className="pf-v6-u-font-size-sm">
              Locate shows what is happening with mangroves along this coast today — 2025 extent plus loss or gain
              since 1996. A year-by-year slider, multi-year urban expansion, and any health product remain gaps.
              Toggle those overlays on <a href="#change">Locate</a>.
            </p>
            {changeError && <p role="alert">{changeError}</p>}
            {changeIndex && (
              <>
                {filterQ && (
                  <p className="pf-v6-u-font-size-sm" role="status">
                    Showing {filteredChangeLayers.length} of {changeIndex.layers.length} Locate layers
                    {filteredGaps.length !== (changeIndex.state_gaps ?? []).length ||
                    filteredNeeds.length !== (changeIndex.data_needs ?? []).length
                      ? ", plus matching gaps or data needs"
                      : ""}
                    .
                  </p>
                )}
                <List isPlain>
                  {filteredChangeLayers.map((layer) => (
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
                {filterQ && filteredChangeLayers.length === 0 && (
                  <p role="status">No Locate layers match this filter.</p>
                )}
                {filteredGaps.length > 0 && (
                  <>
                    <Title headingLevel="h3" className="pf-v6-u-mt-md">
                      Gaps on Locate
                    </Title>
                    <List>
                      {filteredGaps.map((gap) => (
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
                {filteredNeeds.length > 0 && (
                  <>
                    <Title headingLevel="h3" className="pf-v6-u-mt-md">
                      Documented data needs
                    </Title>
                    <List>
                      {filteredNeeds.map((need) => (
                        <ListItem key={need}>
                          {stripRegisterCodes(need)
                            .replace(/\s*\([^)]*\)/g, "")
                            .trim()}
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                {showLocateLicence && (
                  <p className="pf-v6-u-font-size-sm pf-v6-u-mt-sm">
                    {stripRegisterCodes(changeIndex.licence)} These samples sit beside the main restoration package
                    ({changeIndex.not_in_open_cleared_pin ? "not in the pinned pack" : "check pack"}). Streets
                    basemap names are from OpenStreetMap. Satellite tiles © Esri. Extent, loss/gain (1996–2025), and
                    built-up samples are CC BY 4.0.
                  </p>
                )}
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem isExpanded={expanded.has("layers")} id="layers" className="khm-about-section">
          <AccordionToggle id="about-toggle-layers" onClick={() => toggleSection("layers")}>
            Layers in this package
          </AccordionToggle>
          <AccordionContent id="about-expand-layers">
            <p className="pf-v6-u-font-size-sm">
              Each layer carries a plain-language licence line. Toggle overlays on the map; take the shortlist to{" "}
              <a href="#act">Act</a>. Active ponds are part of the main restoration layer on this pack.
            </p>
            {layers.error && <p role="alert">{layers.error}</p>}
            {filterQ && layers.data && (
              <p className="pf-v6-u-font-size-sm" role="status">
                Showing {filteredMapLayers.length} of {layers.data.length} package layers.
              </p>
            )}
            {filteredMapLayers.map((layer) => {
              const evidence = parseEvidenceClass(layer.evidence_class);
              return (
                <div key={layer.id} className="khm-licence-layer">
                  <Title headingLevel="h3">
                    {layerDisplayTitle(layer)}{" "}
                    {evidence && <EvidenceBadge cls={evidence} />}{" "}
                    <IllustrativeBadge publicReady={publicReady && layer.public_ready} />
                  </Title>
                  <LayerProvenance
                    layer={layer}
                    publicReady={publicReady}
                    displayTitle={layerDisplayTitle(layer)}
                    variant="inline"
                  />
                </div>
              );
            })}
            {filterQ && filteredMapLayers.length === 0 && !layers.error && (
              <p role="status">No package layers match this filter.</p>
            )}
            {(!layers.data || layers.data.length === 0) && !layers.error && !filterQ && (
              <p role="status">No layers in this package.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </PageSection>
  );
}
