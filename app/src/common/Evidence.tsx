import { Button, Label, Popover } from "@patternfly/react-core";
import {
  EVIDENCE_COLOR,
  EVIDENCE_DESCRIPTION,
  EVIDENCE_LABEL,
  type EvidenceClass
} from "../lib/evidence";

/** Evidence class on a focusable control; popover holds the explanation. */
export function EvidenceBadge({ cls }: { cls: EvidenceClass }) {
  return (
    <Popover bodyContent={EVIDENCE_DESCRIPTION[cls]}>
      <Button variant="plain" aria-label={EVIDENCE_DESCRIPTION[cls]} className="khm-badge-button">
        <Label isCompact color={EVIDENCE_COLOR[cls]}>
          {EVIDENCE_LABEL[cls]}
        </Label>
      </Button>
    </Popover>
  );
}

/** Shown until the licence gate clears public_ready (khm-i6e.2). */
export function IllustrativeBadge({ publicReady }: { publicReady: boolean }) {
  if (publicReady) return null;
  return (
    <Popover bodyContent="Bundle public_ready=false. Illustrative INTERNAL prototype until khm-i6e.2.">
      <Button
        variant="plain"
        aria-label="Illustrative. Not cleared for public Pages"
        className="khm-badge-button"
      >
        <Label isCompact color="orange">
          Illustrative
        </Label>
      </Button>
    </Popover>
  );
}
