import { Button } from "@patternfly/react-core";
import { hrefForStep, nextStep, prevStep, stepMeta, type StepId } from "./steps";

/** Back / Next for sequential post-home routes (LKA Permit StepNav pattern). */
export function StepNav({
  current,
  className = "khm-step-nav"
}: {
  current: StepId;
  className?: string;
}) {
  const back = prevStep(current);
  const next = nextStep(current);

  return (
    <div className={className} role="navigation" aria-label="Step navigation">
      {back && (
        <Button variant="secondary" component="a" href={hrefForStep(back)}>
          {`Back: ${stepMeta(back).label}`}
        </Button>
      )}
      {next && (
        <Button variant="primary" component="a" href={hrefForStep(next)}>
          {`Next: ${stepMeta(next).label}`}
        </Button>
      )}
      {!next && (
        <Button variant="secondary" component="a" href="#map">
          Return to map
        </Button>
      )}
    </div>
  );
}
