import { Button, HelperText, HelperTextItem, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { meaningForClass } from "../lib/classMeaning";
import { loadCases } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

/**
 * Cases A–C narrative from the open-cleared bundle (cases.json).
 * INTERNAL case PNGs from the QGIS bridge pack are NOT served here or on public Pages.
 */
export default function CasesPage() {
  const cases = useBundle(loadCases);
  const [copied, setCopied] = useState<string | null>(null);

  const openOnMap = (id: string) => {
    window.location.hash = `#map?case=${id}`;
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
    <PageSection>
      <Title headingLevel="h1">Cases A–C</Title>
      <HelperText>
        <HelperTextItem>
          Worked examples from Note 3b. Each case has a map bookmark (`#map?case=A|B|C`). Case figure PNGs stay
          offline / INTERNAL — not shipped on public Pages.
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
              <p className="khm-case-bookmark">Bookmark: #map?case={c.id}</p>
              <p>{c.why}</p>
              {meaning && <p className="pf-v6-u-font-size-sm">{meaning.meaning}</p>}
              <div className="khm-map-tools">
                <Button variant="secondary" onClick={() => openOnMap(c.id)}>
                  Open on map (case {c.id})
                </Button>
                <Button variant="link" onClick={() => void copyBookmark(c.id)}>
                  {copied === c.id ? "Copied bookmark" : "Copy bookmark URL"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </PageSection>
  );
}
