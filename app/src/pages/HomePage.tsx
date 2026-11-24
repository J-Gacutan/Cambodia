import { Button, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { FLOW_STEPS, type StepId } from "../flow/steps";
import { loadManifest } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

/**
 * LKA-style decision-flow landing: Frame → Locate → Means → Read → Act.
 * PatternFly 6 + hash routing; no hero photo required for this research console.
 */
export default function HomePage() {
  const [open, setOpen] = useState<StepId | null>("frame");
  const manifest = useBundle(loadManifest);
  const publicReady = manifest.data?.public_ready === true;
  const info = open ? FLOW_STEPS.find((s) => s.id === open) : null;
  const index = open ? FLOW_STEPS.findIndex((s) => s.id === open) : -1;

  return (
    <PageSection className="khm-home">
      <div className="khm-home-hero">
        <p className="khm-home-kicker">
          {publicReady ? "Open-cleared research prototype" : "INTERNAL research prototype"}
        </p>
        <Title headingLevel="h1">Cambodia mangrove restoration screen</Title>
        <p className="khm-home-lead">
          A physical / land-cover screen of four coastal provinces to shortlist sites worth a field look.{" "}
          <strong>GO</strong> marks open or accreted restoration opportunity; <strong>CAUTION</strong>{" "}
          separates hold-back drivers (tidal on the map today; elevation, converted land, tenure/legal, and
          VERRA listed as coming soon) instead of one catch-all. Not MoE zoning, tenure clearance, planting
          permission, or a carbon outcome — start with ecosystem change, then inspect and shortlist on the map.
        </p>
      </div>

      <Title headingLevel="h2" className="pf-v6-u-mt-xl">
        Every decision follows the same five steps
      </Title>
      <p className="pf-v6-u-font-size-sm">
        Same path every time: set the question, read the coast, learn from a case story, judge a patch, take
        the shortlist. Choose a step for the story; the rail above keeps your place.
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
                {index + 1}. {info.label}
              </p>
              <p className="khm-flow-detail-does">{info.does}</p>
              <p>{info.detail}</p>
              <p>
                <a href={info.href}>Continue to {info.label} →</a>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="khm-map-tools pf-v6-u-mt-md">
        <Button variant="primary" component="a" href="#change">
          Next: Locate (ecosystem change)
        </Button>
        <Button variant="link" component="a" href="#map">
          Skip to screen map
        </Button>
      </div>
    </PageSection>
  );
}
