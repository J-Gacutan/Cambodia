import { Button, Popover } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import type { CautionDriver } from "../lib/cautionDrivers";
import { driverStatusLabel } from "../lib/cautionDrivers";

/** Info-icon popover for hold-back driver prose — sits inline to the right of the label. */
export function DriverInfo({ driver }: { driver: CautionDriver }) {
  const status = driverStatusLabel(driver.status);
  const paintNote =
    driver.status === "live"
      ? " — painted on the map when this driver is the primary hold-back."
      : driver.status === "partial"
        ? " — paints when a flag hits the patch; also available as a toggleable overlay."
        : " — listed as a reason path, not painted as its own colour on this public pack yet.";

  return (
    <Popover
      headerContent={driver.label}
      bodyContent={
        <div className="pf-v6-u-font-size-sm">
          <p>{driver.holdsBack}</p>
          <p className="pf-v6-u-mt-sm">
            Status: <strong>{status}</strong>
            {paintNote}
          </p>
        </div>
      }
      position="right"
      hasAutoWidth
    >
      <Button
        variant="plain"
        aria-label={`About ${driver.label}`}
        className="khm-provenance-info"
      >
        <InfoCircleIcon />
      </Button>
    </Popover>
  );
}
