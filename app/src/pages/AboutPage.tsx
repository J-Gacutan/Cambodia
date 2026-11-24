import { Banner, Button, PageSection, Title } from "@patternfly/react-core";
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { BUNDLE_VERSION } from "../lib/env";
import { loadManifest, loadMapLayers } from "../lib/bundle";
import { parseEvidenceClass } from "../lib/evidence";
import { layerDisplayTitle } from "../lib/layerLabels";
import { useBundle } from "../lib/useBundle";

export default function AboutPage() {
  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const publicReady = manifest.data?.public_ready === true;
  const version = manifest.data?.version ?? BUNDLE_VERSION;
  const built = manifest.data?.built;

  return (
    <PageSection className="khm-prose">
      <Title headingLevel="h1">About this screen</Title>
      <Banner
        color={publicReady ? "blue" : "orange"}
        className="khm-banner khm-about-banner"
        role="region"
        aria-label="Package status"
      >
        {publicReady ? (
          <>
            Research package for four coastal provinces.{" "}
            <strong>GO means worth a field visit</strong> — based on land cover only, not a permit or a
            carbon credit.
          </>
        ) : (
          <>
            Internal draft — not cleared for public sharing yet.{" "}
            <strong>GO means worth a field visit</strong> — based on land cover only.
          </>
        )}
      </Banner>

      <p>
        This console helps a team shortlist mangrove restoration sites that look physically promising, so
        people can plan a field visit. It covers Cambodia’s four coastal provinces. It is not zoning advice,
        tenure clearance, planting permission, or a carbon outcome.
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

      <Title headingLevel="h2">How the screen works</Title>
      <p>
        Five steps keep the same path every time: set the question (Frame), skim how the coast has changed
        (Locate), learn the legend with examples (Means), judge patches on the map (Read), then take the
        shortlist forward (Act). Colours and overlays are readings you can quote — they never approve or
        refuse a site.
      </p>
      <ul>
        <li>
          <strong>GO</strong> — open or newly built-up land on former mangrove that still looks worth walking.
        </li>
        <li>
          <strong>CAUTION</strong> — a named reason to pause (tide, height above the tide, converted land,
          rights context, or an existing carbon project).
        </li>
        <li>
          <strong>Overlays</strong> — protected-area context and existing project outlines for awareness only.
        </li>
      </ul>

      <Title headingLevel="h2">What this is not</Title>
      <p>
        The map is a land-cover filter and restoration proxy. Flags name instruments and overlaps; they do
        not mean a site is approved or refused. Legal stop-zones for ministry core areas are not on this
        pack yet — until they are, that check stays unavailable.
      </p>

      <Title headingLevel="h2">Data on this build</Title>
      <p>
        Package version <strong>{version}</strong>
        {built ? ` · built ${built}` : ""}.
        {publicReady
          ? " Cleared for this research share."
          : " Still illustrative — do not publish as a public product."}{" "}
        Sensitive pond outlines stay offline. For redistribution decisions, quote the original source
        register, not this website alone.
      </p>

      <Title headingLevel="h2" id="licence">
        Sharing and licence posture
      </Title>
      <p>
        This console is aimed at public research sharing (GitHub Pages). Sensitive working rasters and
        internal case images never go into the public site. Protected-area and carbon-project outlines may
        appear as research context only — not for commercial republishing, and not as planting permission.
      </p>
      <ul>
        <li>
          <strong>Public research site</strong> — {publicReady ? "allowed for this pack" : "blocked until the pack is cleared"}.
        </li>
        <li>
          <strong>Local preview</strong> — fine for team review against the pinned package.
        </li>
        <li>
          <strong>Sensitive pond maps</strong> — stay offline; never publish with the public site.
        </li>
        <li>
          <strong>Protected-area and project overlays</strong> — research use on this console; do not claim
          commercial redistribution.
        </li>
      </ul>

      <Title headingLevel="h2">Layers in this package</Title>
      <p className="pf-v6-u-font-size-sm">
        Each layer carries a plain-language licence line. Toggle overlays on the map; take the shortlist to{" "}
        <a href="#act">Act</a>.
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
