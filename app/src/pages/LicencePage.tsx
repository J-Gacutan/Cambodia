import {
  Banner,
  Bullseye,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Spinner,
  Title
} from "@patternfly/react-core";
import { useMemo, useState } from "react";
import { LayerProvenance } from "../common/LayerProvenance";
import { EvidenceBadge, IllustrativeBadge } from "../common/Evidence";
import {
  CAUTION_DRIVERS,
  DRIVER_BY_ID,
  type CautionDriverId,
  driversForFeature
} from "../lib/cautionDrivers";
import { flagLabel, loadManifest, loadMapLayers, type FeatureProps } from "../lib/bundle";
import { parseEvidenceClass } from "../lib/evidence";
import { BUNDLE_VERSION } from "../lib/env";
import { layerDisplayTitle } from "../lib/layerLabels";
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
import { useBundle } from "../lib/useBundle";
import { meaningForClass, suitabilityLabel } from "../lib/classMeaning";

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
    elevation_fail: (row as ShortlistItem & { elevation_fail?: boolean }).elevation_fail ?? null
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
 * Act step: shortlist → hold summary → export → next field/licence moves.
 * Licence / evidence panel (khm-i6e.7) remains below for quoting the pack.
 */
export default function LicencePage() {
  const manifest = useBundle(loadManifest);
  const layers = useBundle(loadMapLayers);
  const publicReady = manifest.data?.public_ready === true;
  const [shortlist, setShortlist] = useState<ShortlistItem[]>(() => loadShortlistFromStorage());
  const [reportQr, setReportQr] = useState<ReportQrMeta | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const holds = useMemo(() => holdSummary(shortlist), [shortlist]);
  const goCount = shortlist.filter((r) => r.suitability === "go").length;
  const cautionCount = shortlist.length - goCount;
  const ha = shortlist.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);

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

  if (!manifest.data && !manifest.error) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading Act panel" />
        </Bullseye>
      </PageSection>
    );
  }

  if (manifest.error || !manifest.data) {
    return (
      <PageSection>
        <p role="alert">{manifest.error ?? "Bundle manifest unavailable"}</p>
      </PageSection>
    );
  }

  const m = manifest.data;
  const version = m.version ?? BUNDLE_VERSION;

  return (
    <>
      <PageSection className="khm-prose">
        <Title headingLevel="h1">Act — decide from the shortlist</Title>
        <p>
          Carry forward patches you shortlisted on <a href="#map">Read</a>. Summarise hold-backs, export
          geometries, then take the next field or licence step. This page quotes the open-cleared pack — it
          does not invent clearances or planting permission.
        </p>
        <IllustrativeBadge publicReady={publicReady} />
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Your shortlist</Title>
        {shortlist.length === 0 ? (
          <>
            <Banner color="orange" role="status">
              No polygons shortlisted yet. On Read, click a patch → Add to shortlist, then return here.
            </Banner>
            <div className="khm-map-tools pf-v6-u-mt-md">
              <Button variant="primary" component="a" href="#map">
                Go to Read (map)
              </Button>
              <Button variant="link" onClick={refresh}>
                Refresh shortlist
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="pf-v6-u-font-size-sm">
              <strong>{shortlist.length}</strong> patch{shortlist.length === 1 ? "" : "es"} · {goCount} GO ·{" "}
              {cautionCount} CAUTION · about {ha.toFixed(0)} ha carried from this session.
            </p>
            {holds.length > 0 && (
              <>
                <Title headingLevel="h3" className="pf-v6-u-font-size-md">
                  Hold-backs on this shortlist
                </Title>
                <ul className="khm-plain-list pf-v6-u-font-size-sm">
                  {holds.map(({ id, count }) => (
                    <li key={id}>
                      <strong>{DRIVER_BY_ID[id].label}</strong> — {count} patch
                      {count === 1 ? "" : "es"}. {DRIVER_BY_ID[id].holdsBack}
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
                      {meaning ? ` · ${meaning.label}` : ` · class ${row.class_id}`}
                    </strong>
                    {" — "}
                    {row.area_ha.toFixed(1)} ha
                    {row.province ? ` · ${row.province}` : ""}
                    {drivers.length > 0
                      ? ` · holds: ${drivers.map((d) => DRIVER_BY_ID[d].short).join(", ")}`
                      : " · no mapped hold-back"}
                    {row.permit_gate != null ? ` · permit ${flagLabel(row.permit_gate)}` : ""}
                    {row.project_overlap != null ? ` · VERRA ${flagLabel(row.project_overlap)}` : ""}
                  </li>
                );
              })}
            </ul>
            <Title headingLevel="h3" className="pf-v6-u-font-size-md pf-v6-u-mt-md">
              Shortlist decision report
            </Title>
            <p className="pf-v6-u-font-size-sm">
              Decision pack for this shortlist: patch rows, hold-backs, hectares, permit/VERRA flags, and next
              field/licence steps. Printable HTML (Save as PDF) and Markdown carry the patches as first-class
              content; CSV / GeoJSON carry the same rows and full geometries. A LIIP-style report QR on the
              printable pack reopens Act — it does not replace the shortlist body.
            </p>
            <div className="khm-act-report-layout pf-v6-u-mt-md">
              <div className="khm-map-tools">
                <Button
                  variant="primary"
                  isDisabled={qrBusy}
                  onClick={() => {
                    void (async () => {
                      const qr = await ensureReportQr(version, shortlist.length);
                      const meta = {
                        bundleVersion: version,
                        generatedAt: sydneyStamp(),
                        productBanner: m.product_banner,
                        reportQr: qr
                      };
                      openPrintableReport(shortlistReportHtml(shortlist, meta));
                    })();
                  }}
                >
                  Open printable report (PDF via print)
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={qrBusy}
                  onClick={() => {
                    void (async () => {
                      const qr = await ensureReportQr(version, shortlist.length);
                      const meta = {
                        bundleVersion: version,
                        generatedAt: sydneyStamp(),
                        productBanner: m.product_banner,
                        reportQr: qr
                      };
                      downloadText(
                        `cambodia-shortlist-report-${version}.md`,
                        shortlistReportMarkdown(shortlist, meta),
                        "text/markdown"
                      );
                    })();
                  }}
                >
                  Download Markdown report
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={qrBusy}
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
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={qrBusy}
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
                  Export GeoJSON (polygons)
                </Button>
                <Button
                  variant="secondary"
                  isDisabled={qrBusy}
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
                  Refresh shortlist
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
                    Prepare or open a report to show the LIIP-style reopen QR beside the shortlist exports.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Next steps</Title>
        <ol className="khm-act-next">
          <li>
            <strong>Field look</strong> — walk GO patches first; treat CAUTION holds as named checks (tide,
            elevation, converted cover), not a single refuse.
          </li>
          <li>
            <strong>Tenure / access</strong> — where permit or VERRA flags hit, confirm with MoE / project
            holders before any claim. Overlays on Read are context only.
          </li>
          <li>
            <strong>Licence before share</strong> — quote layer evidence below and the living register; do not
            claim commercial redistribution of WDPA or VERRA extracts.
          </li>
        </ol>
      </PageSection>

      {!publicReady && (
        <PageSection>
          <Banner color="red" role="status">
            public_ready=false ({m.licence_gate}). Public Pages deploy is skipped until khm-i6e.2 and an
            open-cleared bundle with public_ready=true.
          </Banner>
        </PageSection>
      )}

      <PageSection>
        <Title headingLevel="h2">Bundle gate</Title>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{m.version}</code> (app pin <code>{BUNDLE_VERSION}</code>)
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Built</DescriptionListTerm>
            <DescriptionListDescription>{m.built}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>public_ready</DescriptionListTerm>
            <DescriptionListDescription>{String(m.public_ready)}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>licence_gate</DescriptionListTerm>
            <DescriptionListDescription>{m.licence_gate}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>completeness</DescriptionListTerm>
            <DescriptionListDescription>{m.completeness}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>stub</DescriptionListTerm>
            <DescriptionListDescription>{String(m.stub)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Host matrix (this project)</Title>
        <p className="pf-v6-u-font-size-sm">
          Preference: <strong>public GitHub Pages only</strong> for the screening console. Private Amplify /
          Cloudflare Access is out of scope unless Jordan revises. FLAG rasters and INTERNAL case PNGs never
          enter the Pages artifact. WDPA (coastal clip) and staged VERRA boundaries may ship as non-commercial
          research overlays with <code>redistributable=false</code> — do not claim commercial redistribution.
        </p>
        <table className="khm-licence-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Status today</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Public GitHub Pages</td>
              <td>{publicReady ? "GO (gate open)" : "NO-GO"}</td>
              <td>
                Workflow <code>.github/workflows/pages.yml</code> builds always; deploy only when{" "}
                <code>public_ready=true</code> (khm-i6e.2).
              </td>
            </tr>
            <tr>
              <td>Local / INTERNAL preview</td>
              <td>GO for research</td>
              <td>
                <code>npm run dev</code> / <code>preview</code> against the pinned open-cleared bundle.
              </td>
            </tr>
            <tr>
              <td>Amplify / CF Access</td>
              <td>Out of scope</td>
              <td>Not configured. Revisit only if Jordan changes the Pages-only preference.</td>
            </tr>
            <tr>
              <td>FLAG rasters / case PNGs</td>
              <td>NO-GO on public remote</td>
              <td>Stay under <code>inputs/screen-layers/</code> or QGIS bridge; never sync into public/</td>
            </tr>
            <tr>
              <td>WDPA + VERRA overlays</td>
              <td>Research OK</td>
              <td>
                Non-commercial research context on this console (<code>redistributable=false</code>). Not planting
                permission; not a commercial registry republish.
              </td>
            </tr>
          </tbody>
        </table>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Contract pin</Title>
        <p>
          LKA-style sha256 pin lives at <code>contract/platform.json</code>. Sync verifies every file before
          copying into <code>public/khm-bundle/</code>; <code>npm run check:bundle</code> re-checks the copy
          against <code>config/contract-pin.json</code>.
        </p>
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Layers in this bundle</Title>
        <p className="pf-v6-u-font-size-sm">
          Same layer list as About — evidence class and licence line per file in the open-cleared pack.
        </p>
        {layers.error && <p role="alert">{layers.error}</p>}
        {(!layers.data || layers.data.length === 0) && (
          <p role="status">No layers family in this bundle (degraded).</p>
        )}
        {layers.data?.map((layer) => {
          const evidence = parseEvidenceClass(layer.evidence_class);
          return (
            <div key={layer.id} className="khm-licence-layer">
              <Title headingLevel="h3">
                {layerDisplayTitle(layer)}{" "}
                {evidence && <EvidenceBadge cls={evidence} />}{" "}
                <IllustrativeBadge publicReady={publicReady && layer.public_ready} />
              </Title>
              <LayerProvenance
                layer={layer}
                publicReady={publicReady}
                displayTitle={layerDisplayTitle(layer)}
                variant="inline"
              />
            </div>
          );
        })}
      </PageSection>

      <PageSection>
        <Title headingLevel="h2">Product truth</Title>
        <p>{m.product_banner}</p>
        <p className="pf-v6-u-font-size-sm">
          Permit / STOP (legal) / VERRA (VCS 1748 / 5071 / 5584) flags cite instruments and overlaps — they
          never mean approved or refused.
        </p>
      </PageSection>
    </>
  );
}
