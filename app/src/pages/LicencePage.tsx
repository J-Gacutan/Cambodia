import {
  Banner,
  Bullseye,
  Button,
  PageSection,
  Spinner,
  Title
} from "@patternfly/react-core";
import { useMemo, useState } from "react";
import {
  CAUTION_DRIVERS,
  DRIVER_BY_ID,
  type CautionDriverId,
  driversForFeature
} from "../lib/cautionDrivers";
import { loadManifest, type FeatureProps } from "../lib/bundle";
import { BUNDLE_VERSION } from "../lib/env";
import { buildReportQr, type ReportQrMeta } from "../liip/ui/reportQr";
import {
  downloadText,
  loadShortlistFromStorage,
  shortlistToCsv,
  shortlistToGeoJson,
  type ShortlistItem
} from "../lib/shortlist";
import {
  openPrintableReport,
  shortlistReportHtml,
  shortlistReportMarkdown
} from "../lib/shortlistReport";
import { captureShortlistMapShots } from "../lib/reportMapShots";
import { useBundle } from "../lib/useBundle";
import { meaningForClass, suitabilityLabel } from "../lib/classMeaning";
import { IllustrativeBadge } from "../common/Evidence";

function shortlistAsProps(row: ShortlistItem): FeatureProps {
  return {
    id: row.id,
    class_id: row.class_id,
    class_name: row.class_name,
    suitability: row.suitability,
    area_ha: row.area_ha,
    province: row.province,
    place: row.place,
    note: row.note,
    permit_gate: row.permit_gate,
    permit_instrument: row.permit_instrument,
    stop_legal: row.stop_legal,
    stop_legal_status: row.stop_legal_status,
    stop_legal_note: row.stop_legal_note,
    project_overlap: row.project_overlap,
    project_overlap_ids: row.project_overlap_ids ?? null,
    project_overlap_note: row.project_overlap_note,
    elevation_fail: row.elevation_fail ?? null
  };
}

function holdSummary(rows: ShortlistItem[]): { id: CautionDriverId; count: number }[] {
  const counts: Partial<Record<CautionDriverId, number>> = {};
  for (const row of rows) {
    for (const id of driversForFeature(shortlistAsProps(row))) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return CAUTION_DRIVERS.map((d) => ({ id: d.id, count: counts[d.id] ?? 0 })).filter((r) => r.count > 0);
}

/**
 * Act step: shortlist, hold summary, report/export (with reopen QR), next field steps.
 * Product context, layers, and sharing rules live on About.
 */
export default function LicencePage() {
  const manifest = useBundle(loadManifest);
  const publicReady = manifest.data?.public_ready === true;
  const [shortlist, setShortlist] = useState<ShortlistItem[]>(() => loadShortlistFromStorage());
  const [reportQr, setReportQr] = useState<ReportQrMeta | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [mapShotBusy, setMapShotBusy] = useState(false);
  const [mapShotProgress, setMapShotProgress] = useState<string | null>(null);
  const holds = useMemo(() => holdSummary(shortlist), [shortlist]);
  const goCount = shortlist.filter((r) => r.suitability === "go").length;
  const cautionCount = shortlist.length - goCount;
  const ha = shortlist.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);
  const reportBusy = qrBusy || mapShotBusy;

  const refresh = () => setShortlist(loadShortlistFromStorage());

  const sydneyStamp = () =>
    new Date().toLocaleString("en-AU", {
      timeZone: "Australia/Sydney",
      dateStyle: "medium",
      timeStyle: "short"
    });

  const ensureReportQr = async (bundleVersion: string, patchCount: number): Promise<ReportQrMeta> => {
    if (
      reportQr &&
      reportQr.url.includes(`bundle=${encodeURIComponent(bundleVersion)}`) &&
      reportQr.url.includes(`patches=${patchCount}`)
    ) {
      return reportQr;
    }
    setQrBusy(true);
    try {
      const qr = await buildReportQr({
        bundleVersion,
        patchCount,
        pageBase: `${window.location.origin}${window.location.pathname}`
      });
      setReportQr(qr);
      return qr;
    } finally {
      setQrBusy(false);
    }
  };

  /** Capture per-site map PNGs; never throws — failed shots become placeholders in the report. */
  const ensureMapShots = async (
    rows: ShortlistItem[]
  ): Promise<Record<string, string | null>> => {
    setMapShotBusy(true);
    setMapShotProgress(rows.length ? `Map shots 0/${rows.length}` : null);
    try {
      return await captureShortlistMapShots(rows, {
        onProgress: (done, total) => setMapShotProgress(`Map shots ${done}/${total}`)
      });
    } catch (err) {
      console.warn("Report map shots failed; continuing with placeholders.", err);
      const empty: Record<string, string | null> = {};
      for (const row of rows) empty[row.id] = null;
      return empty;
    } finally {
      setMapShotBusy(false);
      setMapShotProgress(null);
    }
  };

  if (!manifest.data && !manifest.error) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading Act" />
        </Bullseye>
      </PageSection>
    );
  }

  if (manifest.error || !manifest.data) {
    return (
      <PageSection>
        <p role="alert">{manifest.error ?? "Data package could not be loaded."}</p>
      </PageSection>
    );
  }

  const version = manifest.data.version ?? BUNDLE_VERSION;
  const plainBanner =
    "GO means worth a field visit. This screen does not grant planting permission or settle land rights.";

  return (
    <>
      <PageSection className="khm-prose">
        <Title headingLevel="h1">Act — decide from your shortlist</Title>
        <p>
          Sites you kept on the map arrive here. Review why any are held back, download a short report, then
          plan the next visit. This step does not approve a project or clear land rights — see{" "}
          <a href="#about">About this pack</a> for how the screen works and what you may share.
        </p>
        <IllustrativeBadge publicReady={publicReady} />
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Your shortlist</Title>
        {shortlist.length === 0 ? (
          <>
            <Banner color="orange" role="status">
              Nothing shortlisted yet. On the map, click a site and choose Add to shortlist, then come back
              here.
            </Banner>
            <div className="khm-map-tools pf-v6-u-mt-md">
              <Button variant="primary" component="a" href="#map">
                Open the map
              </Button>
              <Button variant="link" onClick={refresh}>
                Refresh list
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="pf-v6-u-font-size-sm">
              <strong>{shortlist.length}</strong> site{shortlist.length === 1 ? "" : "s"} · {goCount} worth a
              look (GO) · {cautionCount} held back (CAUTION) · about {ha.toFixed(0)} ha in this browser
              session.
            </p>
            {holds.length > 0 && (
              <>
                <Title headingLevel="h3" className="pf-v6-u-font-size-md">
                  Why sites on this list are held back
                </Title>
                <ul className="khm-plain-list pf-v6-u-font-size-sm">
                  {holds.map(({ id, count }) => (
                    <li key={id}>
                      <strong>{DRIVER_BY_ID[id].label}</strong> — {count} site
                      {count === 1 ? "" : "s"}. {DRIVER_BY_ID[id].holdsBack}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <ul className="khm-plain-list pf-v6-u-mt-md">
              {shortlist.map((row) => {
                const meaning = meaningForClass(row.class_id);
                const drivers = driversForFeature(shortlistAsProps(row));
                return (
                  <li key={row.id} className="khm-act-shortlist-row">
                    <strong>
                      {suitabilityLabel(row.suitability)}
                      {meaning ? ` · ${meaning.label}` : ""}
                    </strong>
                    {" — "}
                    {row.area_ha.toFixed(1)} ha
                    {row.province ? ` · ${row.province}` : ""}
                    {drivers.length > 0
                      ? ` · held by: ${drivers.map((d) => DRIVER_BY_ID[d].short).join(", ")}`
                      : " · no mapped hold-back"}
                    {row.permit_gate === true ? " · protected-area context" : ""}
                    {row.project_overlap === true ? " · existing carbon project nearby" : ""}
                  </li>
                );
              })}
            </ul>
            <Title headingLevel="h3" className="pf-v6-u-font-size-md pf-v6-u-mt-md">
              Download a report
            </Title>
            <p className="pf-v6-u-font-size-sm">
              Printable page (use the browser Print dialog to save a PDF), Markdown notes, spreadsheet
              table, or map polygons. The printable pack embeds a small map snapshot per site when capture
              succeeds; failed shots show a placeholder and still download. A QR code reopens Act — it does
              not replace the shortlist itself.
            </p>
            {mapShotProgress && (
              <p className="pf-v6-u-font-size-sm" role="status">
                Preparing {mapShotProgress}…
              </p>
            )}
            <div className="khm-act-report-layout pf-v6-u-mt-md">
              <div className="khm-map-tools">
                <Button
                  variant="primary"
                  isDisabled={reportBusy}
                  onClick={() => {
                    void (async () => {
                      const [qr, mapShots] = await Promise.all([
                        ensureReportQr(version, shortlist.length),
                        ensureMapShots(shortlist)
                      ]);
                      openPrintableReport(
                        shortlistReportHtml(shortlist, {
                          bundleVersion: version,
                          generatedAt: sydneyStamp(),
                          productBanner: plainBanner,
                          reportQr: qr,
                          mapShots
                        })
                      );
                    })();
                  }}
                >
                  {mapShotBusy ? "Capturing map shots…" : "Open printable report"}
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={reportBusy}
                  onClick={() => {
                    void (async () => {
                      const [qr, mapShots] = await Promise.all([
                        ensureReportQr(version, shortlist.length),
                        ensureMapShots(shortlist)
                      ]);
                      downloadText(
                        `cambodia-shortlist-report-${version}.md`,
                        shortlistReportMarkdown(shortlist, {
                          bundleVersion: version,
                          generatedAt: sydneyStamp(),
                          productBanner: plainBanner,
                          reportQr: qr,
                          mapShots
                        }),
                        "text/markdown"
                      );
                    })();
                  }}
                >
                  Download Markdown
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={reportBusy}
                  onClick={() => {
                    void (async () => {
                      const qr = await ensureReportQr(version, shortlist.length);
                      downloadText(
                        `cambodia-shortlist-${version}.csv`,
                        shortlistToCsv(shortlist, {
                          bundleVersion: version,
                          generatedAt: sydneyStamp(),
                          reportQrUrl: qr.url
                        }),
                        "text/csv"
                      );
                    })();
                  }}
                >
                  Download spreadsheet (CSV)
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={reportBusy}
                  onClick={() => {
                    void (async () => {
                      const qr = await ensureReportQr(version, shortlist.length);
                      downloadText(
                        `cambodia-shortlist-${version}.geojson`,
                        JSON.stringify(
                          shortlistToGeoJson(shortlist, {
                            bundleVersion: version,
                            generatedAt: sydneyStamp(),
                            reportQrUrl: qr.url
                          }),
                          null,
                          2
                        ),
                        "application/geo+json"
                      );
                    })();
                  }}
                >
                  Download map polygons
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={reportBusy}
                  onClick={() => {
                    void ensureReportQr(version, shortlist.length);
                  }}
                >
                  {qrBusy ? "Preparing QR…" : reportQr ? "Refresh report QR" : "Prepare report QR"}
                </Button>
                <Button variant="link" component="a" href="#map">
                  Back to map
                </Button>
                <Button variant="link" onClick={refresh}>
                  Refresh list
                </Button>
              </div>
              <aside className="khm-act-report-qr" aria-label="Report QR preview">
                {reportQr ? (
                  <>
                    <img src={reportQr.dataUrl} width={128} height={128} alt="" />
                    <p className="pf-v6-u-font-size-sm">{reportQr.caption}</p>
                    <p className="khm-act-report-qr-url pf-v6-u-font-size-sm">
                      <a href={reportQr.url}>{reportQr.url}</a>
                    </p>
                  </>
                ) : (
                  <p className="pf-v6-u-font-size-sm">
                    Prepare or open a report to show the reopen QR beside the downloads.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">What to do next</Title>
        <ol className="khm-act-next">
          <li>
            <strong>Visit the ground</strong> — walk GO sites first. Treat each CAUTION reason as a named
            check (tide, height, converted land, ponds), not a blanket “no”.
          </li>
          <li>
            <strong>Check rights and projects</strong> — where the map shows a protected area, a pond hold-back,
            or an existing carbon project, confirm with the right authorities before any claim.
          </li>
          <li>
            <strong>Share carefully</strong> — this is a research screen. Read{" "}
            <a href="#licence">About this pack</a> (licence) before redistributing maps or project outlines.
          </li>
        </ol>
      </PageSection>
    </>
  );
}
