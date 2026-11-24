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

/** Means step: explain the map legend with examples before Read. */
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
        Before you open the restoration map, learn the legend. GO and CAUTION are land-cover readings only —
        worth a field visit, or held back for a named reason. Overlays name designations and projects; they
        never approve or refuse a site.
      </p>

      <Title headingLevel="h2">Legend you will see on Read</Title>
      <ul className="khm-means-legend">
        <li>
          <Swatch color={SUITABILITY.go} label="GO — open opportunity" />
          <p>
            Former mangrove that now reads as open cover. Shortlist it for a field visit after height and
            rights checks. Example: Case A (Koh Kong hinterland).
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
                ? "Example: Case C (Preah Sihanouk / Kampot coast) — this is the hold-back painted on the map today."
                : driver.id === "verra"
                  ? "On this pack it lights when a site meets a staged project outline; toggle that overlay on Read to see the boundary."
                  : driver.id === "tenure"
                    ? "On this pack it lights when a protected-area attribute is joined; toggle those overlays on Read."
                    : driver.status === "live"
                      ? "Painted on the map when this reason applies."
                      : "Not painted as its own colour on this pack yet — listed so you know what is still coming."}
            </p>
          </li>
        ))}
        <li>
          <Swatch color={FLAGS.permit} label="Protected-area context" />
          <p>
            Designation context for a rights check. Toggle it on Read when you want to see named sites. Not
            planting permission. Research use only on this console.
          </p>
        </li>
        <li>
          <Swatch color={FLAGS.project} label="Existing carbon-project outline" />
          <p>
            Existing project outline (overlap / access check). Toggle on Read. Research use only — not a
            commercial republish of registry extracts.
          </p>
        </li>
      </ul>

      <Title headingLevel="h2">Case stories on this pack</Title>
      <p className="pf-v6-u-font-size-sm">
        Cases A and C ship with this open research package. Case B (open water overriding first-pass
        mangrove) is omitted — say so when you brief, so the gap is part of the reading.
      </p>
      {cases.error && <p role="alert">{cases.error}</p>}
      {cases.absent && <p>This package has no case stories.</p>}
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
            The open-water lesson is not in this package. Name the gap when you brief — do not invent a Case
            B window from this console.
          </p>
          <Label isCompact color="orange">
            Not in this pack
          </Label>
        </article>
      </div>

      <div className="khm-map-tools pf-v6-u-mt-xl">
        <Button variant="primary" onClick={() => openOnMap()}>
          Continue to Read (map)
        </Button>
        <Button variant="link" component="a" href="#change">
          Back: Locate
        </Button>
      </div>
    </PageSection>
  );
}
