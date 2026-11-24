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
    does: "Opens the place on the map.",
    detail:
      "The map shows open-cleared GO (class 8) and CAUTION tidal flat (class 4) patches. Use case bookmarks A and C, or pan the coast yourself."
  },
  {
    id: "read",
    label: "Read",
    does: "Reads what each patch holds.",
    detail:
      "Click a patch: class meaning, area, province, and Phase 2 flags (permit context, STOP legal when available) appear in the right-hand inspect panel."
  },
  {
    id: "means",
    label: "Means",
    does: "Reads what that means for a field look.",
    detail:
      "GO means worth a field look. CAUTION means a named check first. Flags cite instruments and overlaps — they never mean approved or refused."
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
          A step-through physical screen for coastal mangrove restoration potential — GO class 8 and CAUTION
          class 4 only on the public Pages package. Decide what you need, then open the map.
        </p>
        <div className="khm-map-tools">
          <Button variant="primary" component="a" href="#map">
            Open the screen map
          </Button>
          <Button variant="secondary" component="a" href="#licence">
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
              {info.id === "locate" || info.id === "act" ? (
                <p>
                  <a href="#map">Continue to the map →</a>
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
          <a href="#map">
            <strong>Screen map</strong>
          </a>
          <span> — GO / CAUTION patches, basemap toggle on the canvas, click-inspect, shortlist export.</span>
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
