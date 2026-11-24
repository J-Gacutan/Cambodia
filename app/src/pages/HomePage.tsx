import { Button, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { StepNav } from "../flow/StepNav";
import { FLOW_STEPS, type StepId } from "../flow/steps";
import { loadManifest } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

const STEP_DETAIL: Record<StepId, string> = {
  frame:
    "This console is a physical / land-cover restoration screen for four coastal provinces — not MoE zoning, tenure clearance, planting permission, or a carbon outcome.",
  locate:
    "Open Locate (#change) for mangrove loss drivers and an urban/built proxy (open P2 samples), then Read (#map) for GO class 8 and CAUTION drivers — not one CAUTION bucket.",
  read: "On the map: filter hold-back drivers, click a patch, read class meaning and drivers in inspect, then shortlist.",
  means:
    "GO means worth a field look. CAUTION is split by drivers that prevent a project (tidal/hydroperiod, elevation stub, converted stub, tenure/legal, VERRA). Case stories show named places.",
  act: "Shortlist patches and export CSV/GeoJSON on the map, or open Act (#licence) for evidence and attribution. FLAG rasters stay offline."
};

/**
 * LKA-style decision-flow landing: five steps that lead into Locate → Read.
 * PatternFly 6 + hash routing; no hero photo required for this research console.
 */
export default function HomePage() {
  const [open, setOpen] = useState<StepId | null>("frame");
  const manifest = useBundle(loadManifest);
  const info = open ? FLOW_STEPS.find((s) => s.id === open) : null;
  const index = open ? FLOW_STEPS.findIndex((s) => s.id === open) : -1;
  const version = manifest.data?.version ?? "—";
  const publicReady = manifest.data?.public_ready === true;

  return (
    <PageSection className="khm-home">
      <div className="khm-home-hero">
        <p className="khm-home-kicker">
          {publicReady ? "Open-cleared research prototype" : "INTERNAL research prototype"}
        </p>
        <Title headingLevel="h1">Cambodia restoration screen</Title>
        <p className="khm-home-lead">
          A step-through physical screen for coastal mangrove restoration potential — Frame here, Locate
          change context, then Read GO class 8 with CAUTION split by hold-back drivers.
        </p>
        <StepNav current="frame" />
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-xl">
        Every decision follows the same five steps
      </Title>
      <p className="pf-v6-u-font-size-sm">
        Steps are views, not gates — the rail above tracks current / next / done. Choose a step below to see
        what it means, then continue in order.
      </p>
      <div className="khm-step-flow">
        <ol className="khm-flow-row">
          {FLOW_STEPS.map((step, i) => (
            <li key={step.id} className="khm-flow-item">
              <button
                type="button"
                className="khm-flow-badge"
                aria-expanded={open === step.id}
                aria-controls="khm-flow-detail"
                data-current={open === step.id || undefined}
                onClick={() => setOpen((cur) => (cur === step.id ? null : step.id))}
              >
                <span className="khm-flow-number">{i + 1}</span>
                <span>{step.label}</span>
              </button>
              {i < FLOW_STEPS.length - 1 && (
                <span className="khm-flow-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
        <div id="khm-flow-detail" className="khm-flow-detail" hidden={!info} aria-live="polite">
          {info && open && (
            <>
              <p className="khm-flow-detail-title">
                {index + 1}. {info.label}: {info.does}
              </p>
              <p>{STEP_DETAIL[open]}</p>
              <p>
                <a href={info.href}>Continue to {info.label} →</a>
              </p>
            </>
          )}
        </div>
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-xl">
        What this release can support
      </Title>
      <ul className="khm-home-doors">
        <li>
          <a href="#change">
            <strong>2. Locate — ecosystem change</strong>
          </a>
          <span>
            {" "}
            — mangrove loss drivers (L4) and urban/built proxy (L10); on-canvas toggles; open samples only.
          </span>
        </li>
        <li>
          <a href="#map">
            <strong>3. Read — screen map</strong>
          </a>
          <span>
            {" "}
            — filter drivers → click → inspect → shortlist; basemap toggle on the canvas.
          </span>
        </li>
        <li>
          <a href="#cases">
            <strong>4. Means — cases A and C</strong>
          </a>
          <span> — short narratives for open/accreted GO and tidal-flat CAUTION (no INTERNAL PNGs).</span>
        </li>
        <li>
          <a href="#licence">
            <strong>5. Act — licence</strong>
          </a>
          <span> — evidence class, attribution, and the P2 open-cleared gate.</span>
        </li>
      </ul>
      <div className="khm-map-tools pf-v6-u-mt-md">
        <Button variant="primary" component="a" href="#change">
          Next: Locate (ecosystem change)
        </Button>
        <Button variant="link" component="a" href="#map">
          Skip to screen map
        </Button>
      </div>
      <p className="pf-v6-u-font-size-sm pf-v6-u-mt-md">
        Data version {version}
        {publicReady ? " · public_ready=true (P2 Pages)" : " · public_ready=false"}. FLAG / pond geometries stay
        offline.
      </p>
    </PageSection>
  );
}
