import { ExpandableSection } from "@patternfly/react-core";
import type { MapLayer } from "../lib/bundle";
import { parseEvidenceClass } from "../lib/evidence";
import { EvidenceBadge, IllustrativeBadge } from "./Evidence";

/** Licence, evidence and register id for one bundle layer. */
export function LayerProvenance({ layer, publicReady }: { layer: MapLayer; publicReady: boolean }) {
  const evidence = parseEvidenceClass(layer.evidence_class);
  return (
    <ExpandableSection toggleText={`Provenance — ${layer.title}`} isIndented>
      <ul className="khm-plain-list khm-layer-facts pf-v6-u-font-size-sm">
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
      </ul>
    </ExpandableSection>
  );
}
