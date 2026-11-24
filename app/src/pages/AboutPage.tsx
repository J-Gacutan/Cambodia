import { PageSection, Title } from "@patternfly/react-core";
import { BUNDLE_VERSION } from "../lib/env";
import { loadManifest } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

export default function AboutPage() {
  const manifest = useBundle(loadManifest);

  return (
    <PageSection>
      <Title headingLevel="h1">About this console</Title>
      <p>
        Thin React + PatternFly 6 + MapLibre MVP for the Cambodia four-province mangrove restoration screen
        (Seed Fund / REDD+ scoping). Modelled on the LKA MSP platform shell — map, legend, click-inspect, cases,
        shortlist export — not the Indonesia national console.
      </p>
      <Title headingLevel="h2">Product truth</Title>
      <p>
        The class map is a physical / land-cover suitability filter and restoration <strong>proxy</strong>.{" "}
        <strong>GO means worth a field look</strong> — nothing more. It is not MoE zoning, tenure clearance,
        planting permission, or a carbon outcome. Phase 2 flags cite instruments and overlaps; they never say a
        site is approved or refused.
      </p>
      <Title headingLevel="h2">Data</Title>
      <p>
        Feeds from versioned <code>delivery/open-cleared/&lt;version&gt;/</code>, synced into{" "}
        <code>public/khm-bundle/</code>. Current pin: <code>{BUNDLE_VERSION}</code>
        {manifest.data ? ` (built ${manifest.data.built})` : ""}.
      </p>
      {manifest.data && (
        <ul>
          <li>stub: {String(manifest.data.stub)}</li>
          <li>public_ready: {String(manifest.data.public_ready)}</li>
          <li>licence_gate: {manifest.data.licence_gate}</li>
          <li>completeness: {manifest.data.completeness}</li>
        </ul>
      )}
      <Title headingLevel="h2">Phase 2 flags</Title>
      <p>
        Permit gate, STOP (legal), and VERRA (VCS 1748 / 5071 / 5584) attributes attach without changing class.
        The UI cites instruments and overlaps — it never says a site is approved or refused. STOP (legal) stays{" "}
        <em>unavailable</em> until MoE mapped core zones exist (L19 digital GIS closed). Gaps:{" "}
        <code>delivery/open-cleared/{BUNDLE_VERSION}/flags/GAPS.md</code>.
      </p>
      <Title headingLevel="h2">Bundle versions</Title>
      <p>
        Default pin is <code>v0.3.0</code> (P2 open-cleared class 8 ± 4, <code>public_ready=true</code>). Fall
        back to <code>v0.2.2</code> (full GO±CAUTION INTERNAL), <code>v0.2.0</code>, or{" "}
        <code>v0.1.0-stub</code> via <code>VITE_KHM_BUNDLE_VERSION</code> or by editing{" "}
        <code>config/bundle-versions.json</code>, then <code>npm run sync:bundle</code>.
      </p>
      <Title headingLevel="h2">Contract pin</Title>
      <p>
        LKA-style sha256 pin: <code>contract/platform.json</code> → verified on{" "}
        <code>npm run sync:bundle</code> → <code>config/contract-pin.json</code>. Check with{" "}
        <code>npm run check:bundle</code>.
      </p>
      <Title headingLevel="h2">Licence panel</Title>
      <p>
        Per-layer evidence and licence lines: <a href="#licence">Licence and evidence</a>. Host matrix is
        public Pages only; deploy stays gated on <code>public_ready</code>.
      </p>
      <Title headingLevel="h2">Public Pages</Title>
      <p>
        Kenya-style Actions → GitHub Pages is scaffolded but must not go live until the open-cleared bundle has{" "}
        <code>public_ready=true</code> (licence gate <code>khm-i6e.2</code>). FLAG rasters, WDPA geometries, and
        INTERNAL case PNGs never enter the Pages artifact.
      </p>
    </PageSection>
  );
}
