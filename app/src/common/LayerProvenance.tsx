import { Button, Popover } from "@patternfly/react-core";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import type { MapLayer } from "../lib/bundle";
import { parseEvidenceClass } from "../lib/evidence";
import { EvidenceBadge, IllustrativeBadge } from "./Evidence";
import { layerDisplayTitle } from "../lib/layerLabels";

export function LayerProvenanceBody({
  layer,
  publicReady,
  displayTitle
}: {
  layer: MapLayer;
  publicReady: boolean;
  displayTitle?: string;
}) {
  const evidence = parseEvidenceClass(layer.evidence_class);
  const title = displayTitle ?? layerDisplayTitle(layer);
  return (
    <ul className="khm-plain-list khm-layer-facts pf-v6-u-font-size-sm">
      <li>
        <strong>{title}</strong>
      </li>
      <li>
        Evidence: {evidence ? <EvidenceBadge cls={evidence} /> : layer.evidence_class}{" "}
        <IllustrativeBadge publicReady={publicReady && layer.public_ready} />
      </li>
      <li>{`Source ${layer.register_id}`}</li>
      <li>{`Licence (plain): ${layer.licence_plain}`}</li>
      <li>{`Licence (SPDX): ${layer.licence_spdx ?? "null — not open-cleared"}`}</li>
      <li>{`Redistributable: ${layer.redistributable ? "yes" : "no"}`}</li>
      <li>{`Layer public_ready: ${String(layer.public_ready)}`}</li>
      {layer.flag_role && <li>{`Flag role: ${layer.flag_role}`}</li>}
      {layer.note && <li>{layer.note}</li>}
      <li>
        Full matrix: <a href="#licence">Licence and evidence</a>
      </li>
    </ul>
  );
}

/** Info-icon pop-up for map layer toggles; use `variant="inline"` on the licence page. */
export function LayerProvenance({
  layer,
  publicReady,
  displayTitle,
  variant = "popover"
}: {
  layer: MapLayer;
  publicReady: boolean;
  displayTitle?: string;
  variant?: "popover" | "inline";
}) {
  const title = displayTitle ?? layerDisplayTitle(layer);
  const body = (
    <LayerProvenanceBody layer={layer} publicReady={publicReady} displayTitle={title} />
  );

  if (variant === "inline") {
    return body;
  }

  return (
    <Popover headerContent={`Provenance — ${title}`} bodyContent={body} position="right" hasAutoWidth>
      <Button
        variant="plain"
        aria-label={`Provenance for ${title}`}
        className="khm-provenance-info"
      >
        <InfoCircleIcon />
      </Button>
    </Popover>
  );
}
