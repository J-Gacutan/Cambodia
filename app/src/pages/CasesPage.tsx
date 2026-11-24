import { Button, Label, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { CAUTION_DRIVERS, driverStatusLabel } from "../lib/cautionDrivers";
import { meaningForClass } from "../lib/classMeaning";
import { loadCases } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";
import { FLAGS, SUITABILITY } from "../theme/colours";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="khm-key-row">
      <span className="khm-key-swatch" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Means step: explain the map legend with narrative examples before Read.
 * Cases A and C are the live examples on v0.3.0; Case B is named as omitted.
 */
export default function CasesPage() {
  const cases = useBundle(loadCases);
  const [copied, setCopied] = useState<string | null>(null);

  const openOnMap = (id?: string) => {
    window.location.hash = id ? `#map?case=${id}` : "#map";
  };

  const copyBookmark = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#map?case=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      window.setTimeout(() => setCopied((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      window.prompt("Copy case bookmark", url);
    }
  };

  return (
    <PageSection className="khm-prose khm-means">
      <Title headingLevel="h1">Means — how to read the map</Title>
      <p className="khm-home-lead">
        Before you open the screen map, learn the legend. GO and CAUTION are physical / land-cover readings
        only — worth a field look, or held back for a named reason. Overlays cite designations and projects;
        they never approve or refuse a site.
      </p>

      <Title headingLevel="h2">Legend you will see on Read</Title>
      <ul className="khm-means-legend">
        <li>
          <Swatch color={SUITABILITY.go} label="GO — open / accreted opportunity" />
          <p>
            Historic mangrove that now reads as open cover. Shortlist it for a field look after elevation and
            tenure checks. Example: Case A (Koh Kong hinterland).
          </p>
        </li>
        {CAUTION_DRIVERS.map((driver) => (
          <li key={driver.id}>
            <Swatch
              color={driver.color}
              label={`CAUTION · ${driver.short} — ${driverStatusLabel(driver.status)}`}
            />
            <p>
              {driver.holdsBack}{" "}
              {driver.id === "tidal"
                ? "Example: Case C (Preah Sihanouk / Kampot coast) — this is the hold-back painted on the public map today."
                : driver.id === "verra"
                  ? "On this pack it lights when a patch intersects a staged VCS boundary; toggle the VERRA overlay on Read to see the outline."
                  : driver.id === "tenure"
                    ? "On this pack it lights when a permit-gate attribute is joined (Ramsar / WDPA context); toggle those overlays on Read."
                    : "Not painted as a separate colour on this public pack yet — listed so you know what is still coming."}
            </p>
          </li>
        ))}
        <li>
          <Swatch color={FLAGS.permit} label="Ramsar / protected-area context" />
          <p>
            Designation context for a permit-gate check. Toggle it on Read when you want to see named sites.
            Not planting permission. Non-commercial research use on this console.
          </p>
        </li>
        <li>
          <Swatch color={FLAGS.project} label="VERRA project boundary" />
          <p>
            Existing VCS project outline (double-counting / access check). Toggle on Read. Non-commercial
            research use only — not a commercial republish of registry extracts.
          </p>
        </li>
      </ul>

      <Title headingLevel="h2">Case stories on this pack</Title>
      <p className="pf-v6-u-font-size-sm">
        Cases A and C ship with open-cleared v0.3.0. Case B (open water overriding first-pass mangrove) is
        omitted from this pack — say so when you brief, so the omission is part of the reading.
      </p>
      {cases.error && <p role="alert">{cases.error}</p>}
      {cases.absent && <p>This bundle version has no cases family.</p>}
      <div className="khm-case-grid">
        {(cases.data ?? []).map((c) => {
          const meaning = meaningForClass(c.focus);
          const isGo = c.focus === 8;
          return (
            <article key={c.id} className="khm-case-card">
              <p className="khm-case-eyebrow">
                Case {c.id} · {isGo ? "GO example" : "CAUTION · tidal example"}
              </p>
              <Title headingLevel="h2">{c.title}</Title>
              <p className="khm-case-place">{c.place}</p>
              <p className="khm-case-story">{c.why}</p>
              {meaning && (
                <p className="khm-case-reading">
                  Map reading: {meaning.label}. {meaning.meaning}
                </p>
              )}
              <p className="khm-case-meta">About {c.focus_ha.toFixed(0)} ha of the focus class in this window</p>
              <div className="khm-map-tools">
                <Button variant="secondary" onClick={() => openOnMap(c.id)}>
                  Preview on map
                </Button>
                <Button variant="link" onClick={() => void copyBookmark(c.id)}>
                  {copied === c.id ? "Copied bookmark" : "Copy bookmark"}
                </Button>
              </div>
            </article>
          );
        })}
        <article className="khm-case-card khm-case-card-omitted">
          <p className="khm-case-eyebrow">Case B · omitted on this pack</p>
          <Title headingLevel="h2">Open water overriding first-pass mangrove</Title>
          <p className="khm-case-story">
            The rule-order lesson for STOP / open water is not in open-cleared v0.3.0. Name the gap when you
            brief — do not invent a Case B window from this console.
          </p>
          <Label isCompact color="orange">
            Not in v0.3.0
          </Label>
        </article>
      </div>

      <div className="khm-map-tools pf-v6-u-mt-xl">
        <Button variant="primary" onClick={() => openOnMap()}>
          Continue to Read (screen map)
        </Button>
        <Button variant="link" component="a" href="#change">
          Back: Locate
        </Button>
      </div>
    </PageSection>
  );
}
