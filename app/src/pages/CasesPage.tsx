import { Button, HelperText, HelperTextItem, PageSection, Title } from "@patternfly/react-core";
import { meaningForClass } from "../lib/classMeaning";
import { loadCases } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

/**
 * Cases A–C narrative from the open-cleared bundle (cases.json).
 * INTERNAL case PNGs from the QGIS bridge pack are NOT served here or on public Pages.
 */
export default function CasesPage() {
  const cases = useBundle(loadCases);

  return (
    <PageSection>
      <Title headingLevel="h1">Cases A–C</Title>
      <HelperText>
        <HelperTextItem>
          Worked examples from Note 3b. Zoom bookmarks open on the map. Case figure PNGs stay offline / INTERNAL —
          not shipped on public Pages.
        </HelperTextItem>
      </HelperText>
      {cases.error && <p role="alert">{cases.error}</p>}
      {cases.absent && <p>This bundle version has no cases family.</p>}
      <ul className="khm-case-list">
        {(cases.data ?? []).map((c) => {
          const meaning = meaningForClass(c.focus);
          return (
            <li key={c.id} className="khm-case">
              <Title headingLevel="h2">
                Case {c.id} — {c.title}
              </Title>
              <p className="pf-v6-u-font-size-sm">
                {c.place} · focus class {c.focus}
                {meaning ? ` (${meaning.label})` : ""} · {c.focus_ha.toFixed(1)} ha in window
              </p>
              <p>{c.why}</p>
              {meaning && <p className="pf-v6-u-font-size-sm">{meaning.meaning}</p>}
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.hash = `#map?case=${c.id}`;
                }}
              >
                Open on map (case {c.id})
              </Button>
            </li>
          );
        })}
      </ul>
    </PageSection>
  );
}
