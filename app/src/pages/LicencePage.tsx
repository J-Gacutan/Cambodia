import {
  Banner,
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Spinner,
  Title
} from "@patternfly/react-core";
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import { loadManifest, loadMapLayers } from "../lib/bundle";
import { parseEvidenceClass } from "../lib/evidence";
import { BUNDLE_VERSION } from "../lib/env";
import { layerDisplayTitle } from "../lib/layerLabels";
import { useBundle } from "../lib/useBundle";

/**
 * In-app licence / evidence panel (khm-i6e.7).
 * Host matrix follows project preference: public GitHub Pages only — no Amplify/CF Access path
 * unless Jordan revises. Pages stay gated on public_ready (khm-i6e.2).
 */
export default function LicencePage() {
  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const publicReady = manifest.data?.public_ready === true;

  if (!manifest.data && !manifest.error) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading licence panel" />
        </Bullseye>
      </PageSection>
    );
  }

  if (manifest.error || !manifest.data) {
    return (
      <PageSection>
        <p role="alert">{manifest.error ?? "Bundle manifest unavailable"}</p>
      </PageSection>
    );
  }

  const m = manifest.data;

  return (
    <>
      <PageSection>
        <Title headingLevel="h1">Act — licence and evidence</Title>
        <p>
          Act step. Every map layer carries evidence class, register id, and a plain-language licence line.
          This panel quotes the open-cleared bundle — it does not invent clearances. Quote the living
          register, not this site, for redistribution decisions. Shortlist export stays on the{" "}
          <a href="#map">screen map</a>.
        </p>
        <IllustrativeBadge publicReady={publicReady} />
      </PageSection>

      {!publicReady && (
        <PageSection>
          <Banner color="red" role="status">
            public_ready=false ({m.licence_gate}). Public Pages deploy is skipped until khm-i6e.2 and an
            open-cleared bundle with public_ready=true.
          </Banner>
        </PageSection>
      )}

      <PageSection>
        <Title headingLevel="h2">Bundle gate</Title>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{m.version}</code> (app pin <code>{BUNDLE_VERSION}</code>)
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Built</DescriptionListTerm>
            <DescriptionListDescription>{m.built}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>public_ready</DescriptionListTerm>
            <DescriptionListDescription>{String(m.public_ready)}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>licence_gate</DescriptionListTerm>
            <DescriptionListDescription>{m.licence_gate}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>completeness</DescriptionListTerm>
            <DescriptionListDescription>{m.completeness}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>stub</DescriptionListTerm>
            <DescriptionListDescription>{String(m.stub)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Host matrix (this project)</Title>
        <p className="pf-v6-u-font-size-sm">
          Preference: <strong>public GitHub Pages only</strong> for the screening console. Private Amplify /
          Cloudflare Access is out of scope unless Jordan revises. FLAG rasters, WDPA geometries, and INTERNAL
          case PNGs never enter the Pages artifact.
        </p>
        <table className="khm-licence-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Status today</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Public GitHub Pages</td>
              <td>{publicReady ? "GO (gate open)" : "NO-GO"}</td>
              <td>
                Workflow <code>.github/workflows/pages.yml</code> builds always; deploy only when{" "}
                <code>public_ready=true</code> (khm-i6e.2).
              </td>
            </tr>
            <tr>
              <td>Local / INTERNAL preview</td>
              <td>GO for research</td>
              <td>
                <code>npm run dev</code> / <code>preview</code> against the pinned open-cleared bundle.
              </td>
            </tr>
            <tr>
              <td>Amplify / CF Access</td>
              <td>Out of scope</td>
              <td>Not configured. Revisit only if Jordan changes the Pages-only preference.</td>
            </tr>
            <tr>
              <td>FLAG / WDPA / case PNGs</td>
              <td>NO-GO on public remote</td>
              <td>Stay under <code>inputs/screen-layers/</code> or QGIS bridge; never sync into public/</td>
            </tr>
          </tbody>
        </table>
        <p className="pf-v6-u-font-size-sm pf-v6-u-mt-md">
          Living register: <code>intermediate/screen-build/phase-0-licence-register.md</code>. First-share
          gate: <code>intermediate/screen-build/first-public-share-gate.md</code>. Module:{" "}
          <code>docs/04-data-and-licences.md</code>. Pages enablement (when ready):{" "}
          <code>docs/09-github-pages.md</code>.
        </p>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Contract pin</Title>
        <p>
          LKA-style sha256 pin lives at <code>contract/platform.json</code>. Sync verifies every file before
          copying into <code>public/khm-bundle/</code>; <code>npm run check:bundle</code> re-checks the copy
          against <code>config/contract-pin.json</code>.
        </p>
        <ul>
          <li>
            Regenerate pin after bundle edits: <code>node scripts/write-contract.mjs</code>
          </li>
          <li>
            Sync + pin write: <code>cd app && npm run sync:bundle</code>
          </li>
          <li>
            Verify: <code>cd app && npm run check:bundle</code>
          </li>
        </ul>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Layers in this bundle</Title>
        {layers.error && <p role="alert">{layers.error}</p>}
        {(!layers.data || layers.data.length === 0) && (
          <p role="status">No layers family in this bundle (degraded).</p>
        )}
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
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Product truth</Title>
        <p>{m.product_banner}</p>
        <p className="pf-v6-u-font-size-sm">
          Permit / STOP (legal) / VERRA (VCS 1748 / 5071 / 5584) flags cite instruments and overlaps — they
          never mean approved or refused.
        </p>
      </PageSection>
    </>
  );
}
