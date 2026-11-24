import { Button } from "@patternfly/react-core";
import { FLOW_STEPS, stepIndex, type StepId } from "./steps";

/**
 * Progressive decision rail (LKA StepHead pattern).
 * Shows current / next / done — not a flat equal-weight tab strip.
 * About is pinned at the end of this same bar (not a detached masthead float).
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
        <a
          href="#about"
          className="khm-rail-about"
          aria-current={aboutActive ? "page" : undefined}
        >
          About
        </a>
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
          <strong>About:</strong> Console notes and provenance — outside the five screening steps.
        </p>
      )}
    </nav>
  );
}
