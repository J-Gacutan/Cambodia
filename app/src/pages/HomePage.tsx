import { Button, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { loadManifest } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

type StepId = "frame" | "locate" | "read" | "means" | "act";

const STEPS: { id: StepId; label: string; does: string; detail: string }[] = [
  {
    id: "frame",
    label: "Frame",
    does: "States what you are screening for.",
    detail:
      "This console is a physical / land-cover restoration screen for four coastal provinces — not MoE zoning, tenure clearance, planting permission, or a carbon outcome."
  },
  {
    id: "locate",
    label: "Locate",
    does: "Starts with ecosystem change, then the screen map.",
    detail:
      "Open #change for mangrove loss drivers and an urban/built proxy (open P2 samples), then #map for GO class 8 and CAUTION drivers — not one CAUTION bucket."
  },
  {
    id: "read",
    label: "Read",
    does: "Reads what each patch holds.",
    detail:
      "Click a patch: class meaning, hold-back drivers (tidal, tenure, VERRA…), area, province, and Phase 2 flags appear in the inspect panel."
  },
  {
    id: "means",
    label: "Means",
    does: "Reads what that means for a field look.",
    detail:
      "GO means worth a field look. CAUTION is split by drivers that prevent a project (tidal/hydroperiod, elevation stub, converted stub, tenure/legal, VERRA). Flags never mean approved or refused."
  },
  {
    id: "act",
    label: "Act",
    does: "Takes a next step from the screen.",
    detail:
      "Shortlist patches, export CSV/GeoJSON, copy a case bookmark, or open Licence for evidence and attribution. FLAG rasters stay offline."
  }
];

/**
 * LKA-style decision-flow landing: five steps that lead into #map.
 * PatternFly 6 + hash routing; no hero photo required for this research console.
 */
export default function HomePage() {
  const [open, setOpen] = useState<StepId | null>("frame");
  const manifest = useBundle(loadManifest);
  const info = open ? STEPS.find((s) => s.id === open) : null;
  const index = open ? STEPS.findIndex((s) => s.id === open) : -1;
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
          A step-through physical screen for coastal mangrove restoration potential — change context first,
          then GO class 8 with CAUTION split by hold-back drivers on the public Pages package.
        </p>
        <div className="khm-map-tools">
          <Button variant="primary" component="a" href="#change">
            Start with ecosystem change
          </Button>
          <Button variant="secondary" component="a" href="#map">
            Open the screen map
          </Button>
          <Button variant="link" component="a" href="#licence">
            Licence and evidence
          </Button>
        </div>
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-xl">
        Every decision follows the same five steps
      </Title>
      <p className="pf-v6-u-font-size-sm">
        Steps are views, not gates — choose any step to see what it means here, then continue to the map.
      </p>
      <div className="khm-step-flow">
        <ol className="khm-flow-row">
          {STEPS.map((step, i) => (
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
              {i < STEPS.length - 1 && (
                <span className="khm-flow-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
        <div id="khm-flow-detail" className="khm-flow-detail" hidden={!info} aria-live="polite">
          {info && (
            <>
              <p className="khm-flow-detail-title">
                {index + 1}. {info.label}: {info.does}
              </p>
              <p>{info.detail}</p>
              {info.id === "locate" ? (
                <p>
                  <a href="#change">Continue to ecosystem change →</a>
                </p>
              ) : null}
              {info.id === "act" ? (
                <p>
                  <a href="#map">Continue to the restoration map →</a>
                </p>
              ) : null}
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
            <strong>Ecosystem change</strong>
          </a>
          <span>
            {" "}
            — mangrove loss drivers (L4) and urban/built proxy (L10); on-canvas toggles; open samples only.
          </span>
        </li>
        <li>
          <a href="#map">
            <strong>Screen map</strong>
          </a>
          <span>
            {" "}
            — GO / CAUTION by hold-back driver, basemap toggle on the canvas, click-inspect, shortlist export.
          </span>
        </li>
        <li>
          <a href="#cases">
            <strong>Cases A and C</strong>
          </a>
          <span> — short narratives for open/accreted GO and tidal-flat CAUTION (no INTERNAL PNGs).</span>
        </li>
        <li>
          <a href="#licence">
            <strong>Licence</strong>
          </a>
          <span> — evidence class, attribution, and the P2 open-cleared gate.</span>
        </li>
      </ul>
      <p className="pf-v6-u-font-size-sm pf-v6-u-mt-md">
        Data version {version}
        {publicReady ? " · public_ready=true (P2 Pages)" : " · public_ready=false"}. FLAG / pond geometries stay
        offline.
      </p>
    </PageSection>
  );
}
