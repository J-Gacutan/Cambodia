import { Button, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { StepNav } from "../flow/StepNav";
import { FLOW_STEPS, type StepId } from "../flow/steps";

const STEP_DETAIL: Record<StepId, string> = {
  frame:
    "This console is a physical / land-cover restoration screen for four coastal provinces — not MoE zoning, tenure clearance, planting permission, or a carbon outcome.",
  locate:
    "Mangrove loss drivers (L4) and urban/built proxy (L10) on the change map — on-canvas toggles, open P2 samples only. Then continue to Read for GO / CAUTION.",
  read: "Filter hold-back drivers → click a patch → inspect → shortlist. Basemap toggle stays on the canvas.",
  means:
    "Case stories for open/accreted GO (A) and tidal-flat CAUTION (C). GO means worth a field look; CAUTION is split by drivers — flags never mean approved or refused.",
  act: "Evidence class, attribution, and the P2 open-cleared gate on Licence. Shortlist CSV / GeoJSON export stays on the map."
};

/**
 * LKA-style decision-flow landing: five steps that lead into Locate → Read.
 * PatternFly 6 + hash routing; no hero photo required for this research console.
 */
export default function HomePage() {
  const [open, setOpen] = useState<StepId | null>("frame");
  const info = open ? FLOW_STEPS.find((s) => s.id === open) : null;
  const index = open ? FLOW_STEPS.findIndex((s) => s.id === open) : -1;

  return (
    <PageSection className="khm-home">
      <div className="khm-home-hero">
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
        Steps are views, not gates — the rail above tracks current / next / done. Choose a step to see what
        this release supports there, then continue in order.
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

      <div className="khm-map-tools pf-v6-u-mt-md">
        <Button variant="primary" component="a" href="#change">
          Next: Locate (ecosystem change)
        </Button>
        <Button variant="link" component="a" href="#map">
          Skip to screen map
        </Button>
        <Button variant="link" component="a" href="#about">
          About / data version
        </Button>
      </div>
    </PageSection>
  );
}
