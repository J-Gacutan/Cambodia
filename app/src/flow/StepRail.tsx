import { Button } from "@patternfly/react-core";
import { FLOW_STEPS, stepIndex, type StepId } from "./steps";

/**
 * Progressive decision rail (LKA StepHead pattern).
 * Shows current / next / done — not a flat equal-weight tab strip.
 */
export function StepRail({
  current,
  onSelect
}: {
  current: StepId | null;
  onSelect?: (step: StepId) => void;
}) {
  const currentIndex = current ? stepIndex(current) : -1;

  return (
    <nav className="khm-step-rail" aria-label="Screening steps">
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
      {current && (
        <p className="khm-step-cue" aria-live="polite">
          <strong>
            {stepIndex(current) + 1}. {FLOW_STEPS[stepIndex(current)]!.label}:
          </strong>{" "}
          {FLOW_STEPS[stepIndex(current)]!.cue}
        </p>
      )}
    </nav>
  );
}
