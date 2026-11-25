import { Button, Popover } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import type { CautionDriver } from "../lib/cautionDrivers";
import { driverStatusLabel } from "../lib/cautionDrivers";

/** Info-icon popover for reason-to-pause prose — sits inline to the right of the label. */
export function DriverInfo({ driver }: { driver: CautionDriver }) {
  const status = driverStatusLabel(driver.status);
  const statusLine =
    driver.status === "live"
      ? driver.source
      : driver.status === "partial"
        ? `Partly checked. ${driver.source}`
        : `Not assessed. ${driver.source}`;

  return (
    <Popover
      headerContent={driver.label}
      bodyContent={
        <div className="pf-v6-u-font-size-sm">
          <p>{driver.holdsBack}</p>
          <p className="pf-v6-u-mt-sm">{statusLine}</p>
          {status ? (
            <p className="pf-v6-u-mt-sm">
              Status: <strong>{status}</strong>
            </p>
          ) : null}
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
