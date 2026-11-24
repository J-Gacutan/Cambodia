import { Button, HelperText, HelperTextItem, PageSection, Title } from "@patternfly/react-core";
import { useState } from "react";
import { meaningForClass } from "../lib/classMeaning";
import { loadCases } from "../lib/bundle";
import { useBundle } from "../lib/useBundle";

/**
 * Cases A–C as short narrative cards from the open-cleared bundle (cases.json).
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
          Three short stories from Note 3b. Each card is one place, one reading of the screen, and a map
          bookmark — not a dense stats dump. Case figure PNGs stay offline / INTERNAL.
        </HelperTextItem>
      </HelperText>
      {cases.error && <p role="alert">{cases.error}</p>}
      {cases.absent && <p>This bundle version has no cases family.</p>}
      <div className="khm-case-grid">
        {(cases.data ?? []).map((c) => {
          const meaning = meaningForClass(c.focus);
          return (
            <article key={c.id} className="khm-case-card">
              <p className="khm-case-eyebrow">Case {c.id}</p>
              <Title headingLevel="h2">{c.title}</Title>
              <p className="khm-case-place">{c.place}</p>
              <p className="khm-case-story">{c.why}</p>
              {meaning && (
                <p className="khm-case-reading">
                  Screen reading: {meaning.label}. {meaning.meaning}
                </p>
              )}
              <p className="khm-case-meta">
                About {c.focus_ha.toFixed(0)} ha of the focus class in this window
              </p>
              <div className="khm-map-tools">
                <Button variant="secondary" onClick={() => openOnMap(c.id)}>
                  Open on map
                </Button>
                <Button variant="link" onClick={() => void copyBookmark(c.id)}>
                  {copied === c.id ? "Copied bookmark" : "Copy bookmark"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </PageSection>
  );
}
