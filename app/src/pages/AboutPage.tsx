import { Banner, Button, Label, List, ListItem, PageSection, Title } from "@patternfly/react-core";
import { useEffect, useState } from "react";
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { BUNDLE_VERSION } from "../lib/env";
import { loadManifest, loadMapLayers } from "../lib/bundle";
import { changeLayerTitle, stripRegisterCodes } from "../lib/changeLabels";
import { loadChangeIndex, type ChangeIndex } from "../lib/changeLayers";
import { parseEvidenceClass } from "../lib/evidence";
import { layerDisplayTitle } from "../lib/layerLabels";
import { useBundle } from "../lib/useBundle";
import { hashPath, useHash } from "../lib/hash";

export default function AboutPage() {
  const hash = useHash("#about");
  const onLicence = hashPath(hash) === "licence";
  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const [changeIndex, setChangeIndex] = useState<ChangeIndex | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const publicReady = manifest.data?.public_ready === true;
  const version = manifest.data?.version ?? BUNDLE_VERSION;
  const built = manifest.data?.built;

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
    const el = document.getElementById("licence");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [onLicence, changeIndex, layers.data]);

  return (
    <PageSection className="khm-prose">
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
        <Button variant="link" component="a" href="#licence">
          Jump to Licence
        </Button>
      </div>

      <Title headingLevel="h2">How the screen works</Title>
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

      <Title headingLevel="h2">What the colours mean (once)</Title>
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
          <strong>Active pond</strong> (magenta <code>#C2185B</code> on the map — not the amber tide colour
          <code>#F0AB00</code>) — reads as an active or on-and-off pond. Check who uses it before any claim.
          About 500 pond patches (~1,350 ha) ship on this pack; source pond maps stay offline.
        </li>
        <li>
          <strong>Height above the tide</strong> — optional filter that holds back open land that sits too high.
        </li>
      </ul>

      <Title headingLevel="h2">What this is not</Title>
      <p>
        The map is a land-cover filter. Flags name instruments and overlaps; they do not mean a site is
        approved or refused. Ministry core-zone stops are not on this pack yet — until they are, that check
        stays unavailable. Case B is not in this pack (no open-water override example or data).
      </p>

      <Title headingLevel="h2">Data on this build</Title>
      <p>
        Package version <strong>{version}</strong>
        {built ? ` · built ${built}` : ""}.
        {publicReady
          ? " Cleared for this research share."
          : " Still illustrative — do not publish as a public product."}{" "}
        For redistribution decisions, quote the original source register, not this website alone.
      </p>

      <Title headingLevel="h2" id="licence">
        Sharing and licence
      </Title>
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

      <Title headingLevel="h2">Locate layers (coast picture)</Title>
      <p className="pf-v6-u-font-size-sm">
        Locate shows what is happening with mangroves along this coast today — 2025 extent plus loss or gain
        since 1996. A year-by-year slider, multi-year urban expansion, and any health product remain gaps.
        Toggle those overlays on <a href="#change">Locate</a>.
      </p>
      {changeError && <p role="alert">{changeError}</p>}
      {changeIndex && (
        <>
          <List isPlain>
            {changeIndex.layers.map((layer) => (
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
          {(changeIndex.state_gaps ?? []).length > 0 && (
            <>
              <Title headingLevel="h3" className="pf-v6-u-mt-md">
                Gaps on Locate
              </Title>
              <List>
                {(changeIndex.state_gaps ?? []).map((gap) => (
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
          {changeIndex.data_needs && changeIndex.data_needs.length > 0 && (
            <>
              <Title headingLevel="h3" className="pf-v6-u-mt-md">
                Documented data needs
              </Title>
              <List>
                {changeIndex.data_needs.map((need) => (
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
            {stripRegisterCodes(changeIndex.licence)} These samples sit beside the main restoration package
            ({changeIndex.not_in_open_cleared_pin ? "not in the pinned pack" : "check pack"}). Streets
            basemap names are from OpenStreetMap. Satellite tiles © Esri. Extent, loss/gain (1996–2025), and
            built-up samples are CC BY 4.0.
          </p>
        </>
      )}

      <Title headingLevel="h2">Layers in this package</Title>
      <p className="pf-v6-u-font-size-sm">
        Each layer carries a plain-language licence line. Toggle overlays on the map; take the shortlist to{" "}
        <a href="#act">Act</a>. Active ponds are part of the main restoration layer on this pack.
      </p>
      {layers.error && <p role="alert">{layers.error}</p>}
      {layers.data?.map((layer) => {
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
      {(!layers.data || layers.data.length === 0) && !layers.error && (
        <p role="status">No layers in this package.</p>
      )}
    </PageSection>
  );
}
