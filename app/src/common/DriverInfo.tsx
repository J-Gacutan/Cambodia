import { Button, Popover } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import type { CautionDriver } from "../lib/cautionDrivers";
import { driverStatusLabel } from "../lib/cautionDrivers";

/** Info-icon popover for hold-back driver prose — keeps the filter row compact. */
export function DriverInfo({ driver }: { driver: CautionDriver }) {
  const status = driverStatusLabel(driver.status);
  return (
    <Popover
      headerContent={driver.label}
      bodyContent={
        <div className="pf-v6-u-font-size-sm">
          <p>{driver.holdsBack}</p>
          <p className="pf-v6-u-mt-sm">
            Status: <strong>{status}</strong>
            {driver.status === "live"
              ? " — painted on the public map when this driver is the primary hold-back."
              : driver.status === "partial"
                ? " — flag attributes may light this driver when present."
                : " — not painted yet on the public pack; listed so the filter path is clear."}
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
