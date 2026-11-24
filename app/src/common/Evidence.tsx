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

/** Shown while the package is still an internal draft. */
export function IllustrativeBadge({ publicReady }: { publicReady: boolean }) {
  if (publicReady) return null;
  return (
    <Popover bodyContent="This package is still an internal draft — illustrative only, not cleared for public sharing.">
      <Button
        variant="plain"
        aria-label="Illustrative. Not cleared for public sharing"
        className="khm-badge-button"
      >
        <Label isCompact color="orange">
          Illustrative
        </Label>
      </Button>
    </Popover>
  );
}
