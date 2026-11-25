import { Button, Label, PageSection, Title } from "@patternfly/react-core";
import { useMemo, useState } from "react";
import { CAUTION_DRIVERS, driverStatusLabel, type CautionDriverId } from "../lib/cautionDrivers";
import { meaningForClass } from "../lib/classMeaning";
import { loadCases, type CaseStudy } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";
import { FLAGS, SUITABILITY } from "../theme/colours";

type PracticeId = "go" | "tidal";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="khm-key-row">
      <span className="khm-key-swatch" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Plain case stories for experts — bundle `why` stays method-faithful in the pin. */
const CASE_PLAIN: Record<
  string,
  { title: string; story: string; onRead: string; practice: PracticeId }
> = {
  A: {
    title: "Open land worth a visit",
    story:
      "Behind the living mangrove fringe near Peam Krasaop, some former mangrove now reads as open ground — bare, grass, or shrub rather than trees, crops, water, or built-up. That is a GO reading: candidate for natural recovery or planting only after height and rights checks on site. It is not a pond.",
    onRead:
      "Keep GO on, click a teal patch, read the side panel, then shortlist it if a field visit still makes sense.",
    practice: "go"
  },
  C: {
    title: "Tide / mudflat — pause",
    story:
      "Along the Preah Sihanouk / Kampot coast, some cells are tidal flat or mudflat. That is a CAUTION reading: do not plant here; natural recovery only after a water check on site.",
    onRead:
      "Open Reasons to pause, keep Tide on, click a gold patch, read why it is held back — usually leave it off the shortlist for planting.",
    practice: "tidal"
  }
};

const PRACTICE: Record<
  PracticeId,
  {
    label: string;
    caseId: string;
    color: string;
    swatch: string;
    meaning: string;
    driverId?: CautionDriverId;
  }
> = {
  go: {
    label: "GO — open opportunity",
    caseId: "A",
    color: SUITABILITY.go,
    swatch: "GO — open opportunity",
    meaning:
      "Former mangrove that now looks open. Worth shortlisting for a field visit after height and rights checks — not zoning or planting permission."
  },
  tidal: {
    label: "CAUTION · Tide",
    caseId: "C",
    color: "#C4A35A",
    swatch: "CAUTION · Tide — pause",
    meaning:
      "Tidal flat or mudflat. Held back so you do not plant on the wrong wetness — natural recovery only after a water check.",
    driverId: "tidal"
  }
};

/** Means step: teach the legend with practice, then hand off to Read / shortlist. */
export default function CasesPage() {
  const cases = useBundle(loadCases);
  const [copied, setCopied] = useState<string | null>(null);
  const [practice, setPractice] = useState<PracticeId>("go");
  const [openDriver, setOpenDriver] = useState<CautionDriverId | null>("tidal");

  const byId = useMemo(() => {
    const map = new Map<string, CaseStudy>();
    for (const c of cases.data ?? []) map.set(c.id, c);
    return map;
  }, [cases.data]);

  const active = PRACTICE[practice];
  const activeCase = byId.get(active.caseId);
  const plain = CASE_PLAIN[active.caseId];

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

  const selectPractice = (id: PracticeId) => {
    setPractice(id);
    if (id === "tidal") setOpenDriver("tidal");
  };

  return (
    <PageSection className="khm-prose khm-means">
      <Title headingLevel="h1">Means — learn the colours before the map</Title>
      <p className="khm-home-lead">
        This step teaches what GO and CAUTION mean, with two worked places. Then you open Read: filter reasons
        to pause, click a site, inspect it, and shortlist only what earns a field visit. Colours are land-cover
        readings — they never approve or refuse a site.
      </p>

      <div className="khm-means-primer" role="region" aria-label="How Means sets up Read">
        <Title headingLevel="h2">What you will do next on Read</Title>
        <ol className="khm-means-read-path">
          <li>
            <strong>Filter</strong> reasons to pause (tide, height, converted land; rights and carbon projects
            when flags hit).
          </li>
          <li>
            <strong>Click</strong> a coloured patch on the restoration map.
          </li>
          <li>
            <strong>Inspect</strong> the side panel — GO worth a visit, or a named hold-back.
          </li>
          <li>
            <strong>Shortlist</strong> sites you still want to walk, then continue to Act.
          </li>
        </ol>
      </div>

      <Title headingLevel="h2">Practice a reading</Title>
      <p className="pf-v6-u-font-size-sm">
        Pick one example. Match the colour to the story, then preview that window on Read — the map opens on
        the same bookmark.
      </p>
      <div className="khm-means-practice-tabs" role="tablist" aria-label="Practice readings">
        <button
          type="button"
          role="tab"
          id="means-tab-go"
          aria-selected={practice === "go"}
          aria-controls="means-practice-panel"
          className="khm-means-tab"
          data-active={practice === "go" || undefined}
          onClick={() => selectPractice("go")}
        >
          <span className="khm-key-swatch" style={{ background: SUITABILITY.go }} aria-hidden />
          Case A · GO
        </button>
        <button
          type="button"
          role="tab"
          id="means-tab-tidal"
          aria-selected={practice === "tidal"}
          aria-controls="means-practice-panel"
          className="khm-means-tab"
          data-active={practice === "tidal" || undefined}
          onClick={() => selectPractice("tidal")}
        >
          <span className="khm-key-swatch" style={{ background: PRACTICE.tidal.color }} aria-hidden />
          Case C · Tide
        </button>
      </div>

      <div
        id="means-practice-panel"
        role="tabpanel"
        aria-labelledby={practice === "go" ? "means-tab-go" : "means-tab-tidal"}
        className="khm-means-practice"
      >
        <Swatch color={active.color} label={active.swatch} />
        <p className="khm-means-practice-meaning">{active.meaning}</p>
        {plain && (
          <>
            <p className="khm-case-place">
              {activeCase?.place ?? (practice === "go" ? "Koh Kong" : "Preah Sihanouk / Kampot")}
            </p>
            <p className="khm-case-story">{plain.story}</p>
            <p className="khm-means-practice-next">
              <strong>On Read:</strong> {plain.onRead}
            </p>
          </>
        )}
        {activeCase && (
          <p className="khm-case-meta">
            About {activeCase.focus_ha.toFixed(0)} ha of this reading in the example window
          </p>
        )}
        <div className="khm-map-tools">
          <Button variant="primary" onClick={() => openOnMap(active.caseId)}>
            Preview Case {active.caseId} on Read
          </Button>
          <Button variant="link" onClick={() => void copyBookmark(active.caseId)}>
            {copied === active.caseId ? "Copied bookmark" : "Copy bookmark"}
          </Button>
        </div>
      </div>

      <Title headingLevel="h2">Legend you will see on Read</Title>
      <p className="pf-v6-u-font-size-sm">
        Same groups as the map’s layers panel: what you keep, why you pause, then context you can toggle.
      </p>

      <Title headingLevel="h3" className="khm-means-group-title">
        What you keep
      </Title>
      <ul className="khm-means-legend">
        <li
          className="khm-means-legend-item"
          data-active={practice === "go" || undefined}
          onClick={() => selectPractice("go")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectPractice("go");
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Swatch color={SUITABILITY.go} label="GO — open opportunity" />
          <p>
            Former mangrove that now reads as open cover. Shortlist for a field visit after height and rights
            checks. Worked example: Case A.
          </p>
        </li>
      </ul>

      <Title headingLevel="h3" className="khm-means-group-title">
        Why you pause
      </Title>
      <p className="pf-v6-u-font-size-sm">
        CAUTION is not one bucket — each colour names a hold-back. Open a row for the plain reason; Tide is
        the live coastal example (Case C).
      </p>
      <ul className="khm-means-legend khm-means-drivers">
        {CAUTION_DRIVERS.map((driver) => {
          const isOpen = openDriver === driver.id;
          const isPractice = practice === "tidal" && driver.id === "tidal";
          return (
            <li
              key={driver.id}
              className="khm-means-legend-item"
              data-active={isPractice || undefined}
              data-open={isOpen || undefined}
            >
              <button
                type="button"
                className="khm-means-driver-toggle"
                aria-expanded={isOpen}
                onClick={() => {
                  setOpenDriver((cur) => (cur === driver.id ? null : driver.id));
                  if (driver.id === "tidal") setPractice("tidal");
                }}
              >
                <Swatch
                  color={driver.color}
                  label={
                    driverStatusLabel(driver.status)
                      ? `CAUTION · ${driver.short} — ${driverStatusLabel(driver.status)}`
                      : `CAUTION · ${driver.short}`
                  }
                />
                <span className="khm-means-driver-chevron" aria-hidden>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              {isOpen && (
                <p>
                  {driver.holdsBack}{" "}
                  {driver.id === "tidal"
                    ? "Worked example: Case C — this hold-back is painted on the map today."
                    : driver.id === "verra"
                      ? "On this pack it lights when a site meets a staged project outline; toggle that overlay on Read to see the boundary."
                      : driver.id === "tenure"
                        ? "On this pack it lights when a protected-area attribute is joined; toggle those overlays on Read."
                        : driver.status === "live"
                          ? "Painted on the map when this reason applies."
                          : "Not painted as its own colour on this pack yet — listed so you know what is still coming."}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Title headingLevel="h3" className="khm-means-group-title">
        Context you can toggle
      </Title>
      <ul className="khm-means-legend">
        <li>
          <Swatch color={FLAGS.permit} label="Protected-area context" />
          <p>
            Named designations for a rights check. Toggle on Read when you want to see them. Not planting
            permission. Research use only on this console.
          </p>
        </li>
        <li>
          <Swatch color={FLAGS.project} label="Existing carbon-project outline" />
          <p>
            Existing project outline for an overlap / access check. Toggle on Read. Research use only — not a
            commercial republish of registry extracts.
          </p>
        </li>
      </ul>

      <Title headingLevel="h2">Both examples on this pack</Title>
      <p className="pf-v6-u-font-size-sm">
        Cases A and C ship with this open research package. Case B (open water overriding first-pass mangrove)
        is omitted — say so when you brief.
      </p>
      {cases.error && <p role="alert">{cases.error}</p>}
      {cases.absent && <p>This package has no case stories.</p>}
      <div className="khm-case-grid">
        {(cases.data ?? []).map((c) => {
          const meaning = meaningForClass(c.focus);
          const plainCase = CASE_PLAIN[c.id];
          const isGo = c.focus === 8;
          const selected = (isGo && practice === "go") || (!isGo && practice === "tidal");
          return (
            <article
              key={c.id}
              className="khm-case-card"
              data-selected={selected || undefined}
            >
              <p className="khm-case-eyebrow">
                Case {c.id} · {isGo ? "GO example" : "CAUTION · tidal example"}
              </p>
              <Title headingLevel="h3">{plainCase?.title ?? c.title}</Title>
              <p className="khm-case-place">{c.place}</p>
              <p className="khm-case-story">{plainCase?.story ?? c.why}</p>
              {meaning && (
                <p className="khm-case-reading">
                  Map reading: {isGo ? "GO — open opportunity" : "CAUTION — tidal flat"}. {meaning.meaning}
                </p>
              )}
              <p className="khm-case-meta">About {c.focus_ha.toFixed(0)} ha in this example window</p>
              <div className="khm-map-tools">
                <Button
                  variant="secondary"
                  onClick={() => {
                    selectPractice(isGo ? "go" : "tidal");
                    openOnMap(c.id);
                  }}
                >
                  Preview on Read
                </Button>
                <Button
                  variant="link"
                  onClick={() => selectPractice(isGo ? "go" : "tidal")}
                >
                  {selected ? "Showing in practice" : "Use in practice"}
                </Button>
                <Button variant="link" onClick={() => void copyBookmark(c.id)}>
                  {copied === c.id ? "Copied bookmark" : "Copy bookmark"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="khm-means-omitted" role="note">
        <Label isCompact color="orange">
          Case B omitted
        </Label>{" "}
        Open water overriding first-pass mangrove is not in this package. Name the gap when you brief — do not
        invent a Case B window from this console.
      </p>

      <div className="khm-means-exit khm-map-tools pf-v6-u-mt-xl">
        <Button variant="primary" onClick={() => openOnMap()}>
          Continue to Read — filter, click, shortlist
        </Button>
        <Button variant="link" component="a" href="#change">
          Back: Locate
        </Button>
      </div>
    </PageSection>
  );
}
