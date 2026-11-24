import { Button } from "@patternfly/react-core";
import { FLOW_STEPS, hrefForStep, nextStep, prevStep, stepIndex, stepMeta, type StepId } from "./steps";

/**
 * Progressive decision rail (LKA StepHead pattern).
 * Shows current / next / done — not a flat equal-weight tab strip.
 * About + Back/Next sit in this same row (not detached lines).
 */
export function StepRail({
  current,
  aboutActive = false,
  onSelect
}: {
  current: StepId | null;
  aboutActive?: boolean;
  onSelect?: (step: StepId) => void;
}) {
  const currentIndex = current ? stepIndex(current) : -1;
  const back = current ? prevStep(current) : null;
  const next = current ? nextStep(current) : null;

  return (
    <nav className="khm-step-rail" aria-label="Screening steps">
      <div className="khm-step-rail-row">
        <ol className="khm-steps">
          {FLOW_STEPS.map((step, index) => {
            const selected = current === step.id;
            const done = currentIndex > index;
            const upcomingNext = currentIndex >= 0 && index === currentIndex + 1;
            const className = [
              "khm-step",
              selected ? "khm-step-current" : "",
              done ? "khm-step-done" : "",
              upcomingNext ? "khm-step-next" : ""
            ]
              .filter(Boolean)
              .join(" ");

            const go = () => {
              if (onSelect) onSelect(step.id);
              else window.location.hash = step.href;
            };

            return (
              <li key={step.id} className={className}>
                {done ? (
                  <button type="button" className="khm-step-done-btn" onClick={go}>
                    <span className="khm-step-mark" aria-hidden>
                      ✓
                    </span>
                    <span>
                      {index + 1}. {step.label}
                    </span>
                  </button>
                ) : (
                  <Button
                    variant={selected ? "primary" : upcomingNext ? "secondary" : "tertiary"}
                    aria-current={selected ? "step" : undefined}
                    onClick={go}
                  >
                    {`${index + 1}. ${step.label}`}
                    {upcomingNext ? " →" : ""}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
        <div className="khm-rail-actions">
          {current && (
            <div className="khm-step-nav khm-step-nav-inline" role="navigation" aria-label="Step navigation">
              {back && (
                <Button variant="secondary" size="sm" component="a" href={hrefForStep(back)}>
                  {`Back: ${stepMeta(back).label}`}
                </Button>
              )}
              {next && (
                <Button variant="primary" size="sm" component="a" href={hrefForStep(next)}>
                  {`Next: ${stepMeta(next).label}`}
                </Button>
              )}
              {!next && (
                <Button variant="secondary" size="sm" component="a" href="#map">
                  Return to map
                </Button>
              )}
            </div>
          )}
          <a
            href="#about"
            className="khm-rail-about"
            aria-current={aboutActive ? "page" : undefined}
          >
            About
          </a>
        </div>
      </div>
      {current && (
        <p className="khm-step-cue" aria-live="polite">
          <strong>
            {stepIndex(current) + 1}. {FLOW_STEPS[stepIndex(current)]!.label}:
          </strong>{" "}
          {FLOW_STEPS[stepIndex(current)]!.cue}
        </p>
      )}
      {aboutActive && !current && (
        <p className="khm-step-cue" aria-live="polite">
          <strong>About:</strong> Package notes, data version, and provenance — the quiet shelf beside the
          five screening steps.
        </p>
      )}
    </nav>
  );
}
