/**
 * Printable shortlist report for Act — Markdown + HTML (+ pair with CSV/GeoJSON).
 * Land-cover screen only; never invents clearances.
 *
 * Shortlist sites, holds, and companion download pointers are first-class body
 * content. Optional reopen QR is a figure on the pack — it does not replace rows
 * or geometries.
 *
 * HTML is the A4 print path (@page size A4); Markdown / CSV / GeoJSON stay
 * desk-useful companions.
 */

import type { ReportQrMeta } from "../liip/ui/reportQr";
import { reportQrHtmlFigure, reportQrMarkdownBlock } from "../liip/ui/reportQr";
import {
  CAUTION_DRIVERS,
  DRIVER_BY_ID,
  type CautionDriverId,
  driversForFeature
} from "./cautionDrivers";
import { flagLabel, type FeatureProps } from "./bundle";
import { meaningForClass, suitabilityLabel } from "./classMeaning";
import { reportMapShotHtml } from "./reportMapShots";
import type { ShortlistItem } from "./shortlist";

function asProps(row: ShortlistItem): FeatureProps {
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

export type ShortlistReportMeta = {
  bundleVersion: string;
  generatedAt: string;
  productBanner?: string;
  /** Reopen QR for the printable pack (optional). */
  reportQr?: Pick<ReportQrMeta, "svg" | "url" | "caption">;
  /**
   * Per-patch map PNG data URLs (or null when capture failed).
   * Missing keys also render as placeholders so export never blocks.
   */
  mapShots?: Record<string, string | null>;
};

function holdCounts(rows: ShortlistItem[]): { id: CautionDriverId; count: number; ha: number }[] {
  const counts: Partial<Record<CautionDriverId, { count: number; ha: number }>> = {};
  for (const row of rows) {
    for (const id of driversForFeature(asProps(row))) {
      const cur = counts[id] ?? { count: 0, ha: 0 };
      cur.count += 1;
      cur.ha += Number.isFinite(row.area_ha) ? row.area_ha : 0;
      counts[id] = cur;
    }
  }
  return CAUTION_DRIVERS.map((d) => ({
    id: d.id,
    count: counts[d.id]?.count ?? 0,
    ha: counts[d.id]?.ha ?? 0
  })).filter((r) => r.count > 0);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function driversCell(row: ShortlistItem): string {
  const drivers = driversForFeature(asProps(row));
  return drivers.length ? drivers.map((id) => DRIVER_BY_ID[id].short).join(", ") : "none mapped";
}

function readingCell(row: ShortlistItem): string {
  const meaning = meaningForClass(row.class_id);
  return `${suitabilityLabel(row.suitability)}${meaning ? ` · ${meaning.label}` : ""}`;
}

function overlaysCell(row: ShortlistItem): string {
  const carbonExtra = (row.project_overlap_ids ?? []).length
    ? ` · ${(row.project_overlap_ids ?? []).join(", ")}`
    : "";
  const legalExtra = row.stop_legal_status ? ` (${row.stop_legal_status})` : "";
  return [
    `Protected: ${flagLabel(row.permit_gate)}`,
    `Legal stop: ${flagLabel(row.stop_legal)}${legalExtra}`,
    `Carbon: ${flagLabel(row.project_overlap)}${carbonExtra}`,
    `Height fail: ${flagLabel(row.elevation_fail ?? null)}`
  ].join("; ");
}

function siteMarkdownTable(row: ShortlistItem, meta: ShortlistReportMeta): string[] {
  const lines: string[] = [`### ${row.id}`, ``];
  if (meta.mapShots) {
    const shot = meta.mapShots[row.id];
    lines.push(
      shot
        ? `*Map snapshot: included in the printable HTML report for this site.*`
        : `*Map snapshot unavailable for ${row.id} — pair with printable HTML or map-polygon download.*`,
      ``
    );
  }
  lines.push(
    `| Field | Value |`,
    `| --- | --- |`,
    `| Reading | ${readingCell(row)} |`,
    `| Area (ha) | ${row.area_ha.toFixed(2)} |`
  );
  if (row.province) lines.push(`| Province | ${row.province} |`);
  lines.push(
    `| Centroid lat | ${row.lat} |`,
    `| Centroid lon | ${row.lon} |`,
    `| Drivers | ${driversCell(row)} |`,
    `| Protected area | ${flagLabel(row.permit_gate)} |`,
    `| Legal stop | ${flagLabel(row.stop_legal)}${row.stop_legal_status ? ` (${row.stop_legal_status})` : ""} |`,
    `| Carbon project | ${flagLabel(row.project_overlap)}${(row.project_overlap_ids ?? []).length ? ` · ${(row.project_overlap_ids ?? []).join(", ")}` : ""} |`,
    `| Height check fail | ${flagLabel(row.elevation_fail ?? null)} |`,
    `| Geometry | ${row.geometry.type} (full rings in companion map-polygon download) |`
  );
  if (row.note) lines.push(`| Note | ${row.note} |`);
  lines.push(``);
  return lines;
}

/** Markdown report for download / paste into notes. */
export function shortlistReportMarkdown(rows: ShortlistItem[], meta: ShortlistReportMeta): string {
  const go = rows.filter((r) => r.suitability === "go");
  const caution = rows.filter((r) => r.suitability !== "go");
  const ha = rows.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);
  const holds = holdCounts(rows);
  const lines: string[] = [
    `# Cambodia screen — shortlist decision report`,
    ``,
    `Generated: ${meta.generatedAt} (Australia/Sydney local machine time as reported by the browser).`,
    `Bundle: \`${meta.bundleVersion}\`.`,
    ``,
    `> Land-cover screen only. GO = worth a field visit. Flags name instruments and overlaps — never approved or refused. Not planting permission.`,
    ``
  ];
  if (meta.reportQr) {
    lines.push(reportQrMarkdownBlock(meta.reportQr));
  }
  lines.push(
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Sites (this shortlist) | ${rows.length} |`,
    `| GO | ${go.length} |`,
    `| CAUTION | ${caution.length} |`,
    `| Area (ha) | ${ha.toFixed(2)} |`,
    ``,
    `## Hold-backs on this shortlist`,
    ``
  );
  if (holds.length === 0) {
    lines.push(`No mapped hold-back on these sites (physical GO only where listed).`, ``);
  } else {
    lines.push(`| Reason | Sites | ha | Reading |`, `| --- | ---: | ---: | --- |`);
    for (const h of holds) {
      const d = DRIVER_BY_ID[h.id];
      lines.push(`| ${d.label} | ${h.count} | ${h.ha.toFixed(2)} | ${d.holdsBack} |`);
    }
    lines.push(``);
  }
  lines.push(
    `## Shortlist sites (overview)`,
    ``,
    `First-class content of this decision pack — same rows carried from Read → Act.`,
    ``,
    `| Site | Reading | ha | Lat | Lon | Drivers | Overlays |`,
    `| --- | --- | ---: | ---: | ---: | --- | --- |`
  );
  for (const row of rows) {
    lines.push(
      `| ${row.id} | ${readingCell(row)} | ${row.area_ha.toFixed(2)} | ${row.lat} | ${row.lon} | ${driversCell(row)} | ${overlaysCell(row)} |`
    );
  }
  lines.push(``, `## Shortlist sites (detail)`, ``);
  for (const row of rows) {
    lines.push(...siteMarkdownTable(row, meta));
  }
  lines.push(
    `## Next steps`,
    ``,
    `| Step | Action |`,
    `| --- | --- |`,
    `| 1 | Field visit — walk GO first; treat CAUTION holds as named checks. |`,
    `| 2 | Rights / access — confirm authorities or project holders where protected-area or carbon-project flags hit. |`,
    `| 3 | Share carefully — quote the package evidence lines; no commercial republish of protected-area or project extracts. |`,
    ``,
    `## Companion downloads`,
    ``,
    `Pair this report with the spreadsheet table and map polygons from Act (same shortlist, same session).`,
    ``
  );
  if (meta.productBanner) {
    lines.push(`---`, ``, meta.productBanner, ``);
  }
  return lines.join("\n");
}

function siteDetailHtml(row: ShortlistItem, meta: ShortlistReportMeta): string {
  const meaning = meaningForClass(row.class_id);
  const drivers = driversForFeature(asProps(row));
  const includeMap = meta.mapShots !== undefined;
  const shotHtml = includeMap
    ? reportMapShotHtml(row.id, meta.mapShots![row.id] ?? null, esc)
    : "";
  const attrRows: string[] = [
    `<tr><th scope="row">Reading</th><td>${esc(suitabilityLabel(row.suitability))}${meaning ? ` · ${esc(meaning.label)}` : ""}</td></tr>`,
    `<tr><th scope="row">Area (ha)</th><td class="num">${row.area_ha.toFixed(2)}</td></tr>`
  ];
  if (row.province) {
    attrRows.push(`<tr><th scope="row">Province</th><td>${esc(row.province)}</td></tr>`);
  }
  attrRows.push(
    `<tr><th scope="row">Centroid lat</th><td class="num">${row.lat}</td></tr>`,
    `<tr><th scope="row">Centroid lon</th><td class="num">${row.lon}</td></tr>`,
    `<tr><th scope="row">Drivers</th><td>${drivers.length ? esc(drivers.map((id) => DRIVER_BY_ID[id].short).join(", ")) : "none mapped"}</td></tr>`,
    `<tr><th scope="row">Protected area</th><td>${esc(flagLabel(row.permit_gate))}</td></tr>`,
    `<tr><th scope="row">Legal stop</th><td>${esc(flagLabel(row.stop_legal))}${row.stop_legal_status ? ` (${esc(row.stop_legal_status)})` : ""}</td></tr>`,
    `<tr><th scope="row">Carbon project</th><td>${esc(flagLabel(row.project_overlap))}${(row.project_overlap_ids ?? []).length ? ` · ${esc((row.project_overlap_ids ?? []).join(", "))}` : ""}</td></tr>`,
    `<tr><th scope="row">Height check fail</th><td>${esc(flagLabel(row.elevation_fail ?? null))}</td></tr>`,
    `<tr><th scope="row">Geometry</th><td>${esc(row.geometry.type)} (rings in companion map-polygon download)</td></tr>`
  );
  if (row.note) {
    attrRows.push(`<tr><th scope="row">Note</th><td>${esc(row.note)}</td></tr>`);
  }

  if (!includeMap) {
    return `<article class="site-sheet" id="site-${esc(row.id)}">
  <h3>${esc(row.id)}</h3>
  <table class="kv">
    <tbody>
      ${attrRows.join("\n      ")}
    </tbody>
  </table>
</article>`;
  }

  return `<article class="site-sheet" id="site-${esc(row.id)}">
  <h3>${esc(row.id)}</h3>
  <table class="site-grid">
    <tbody>
      <tr>
        <td class="site-grid__attrs">
          <table class="kv">
            <tbody>
              ${attrRows.join("\n              ")}
            </tbody>
          </table>
        </td>
        <td class="site-grid__map">
          ${shotHtml}
        </td>
      </tr>
    </tbody>
  </table>
</article>`;
}

/** Printable HTML (open → Print / Save as PDF). A4 template. */
export function shortlistReportHtml(rows: ShortlistItem[], meta: ShortlistReportMeta): string {
  const mdish = shortlistReportMarkdown(rows, meta);
  const go = rows.filter((r) => r.suitability === "go").length;
  const caution = rows.length - go;
  const ha = rows.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);
  const holds = holdCounts(rows);
  const qrBlock = meta.reportQr ? reportQrHtmlFigure(meta.reportQr) : "";
  const includeMap = meta.mapShots !== undefined;

  const overviewRows = rows
    .map((row) => {
      const mapCell = includeMap
        ? `<td class="map-thumb">${reportMapShotHtml(row.id, meta.mapShots![row.id] ?? null, esc)}</td>`
        : "";
      return `<tr>
      <td><a href="#site-${esc(row.id)}">${esc(row.id)}</a></td>
      <td>${esc(readingCell(row))}</td>
      <td class="num">${row.area_ha.toFixed(2)}</td>
      <td class="num">${row.lat}</td>
      <td class="num">${row.lon}</td>
      <td>${esc(driversCell(row))}</td>
      <td>${esc(overlaysCell(row))}</td>
      ${mapCell}
    </tr>`;
    })
    .join("\n    ");

  const detailBlocks = rows.map((row) => siteDetailHtml(row, meta)).join("\n");

  const holdsHtml =
    holds.length === 0
      ? "<p class=\"empty\">No mapped hold-back on these sites.</p>"
      : `<table class="data">
        <thead>
          <tr><th>Reason</th><th class="num">Sites</th><th class="num">ha</th><th>Reading</th></tr>
        </thead>
        <tbody>
          ${holds
            .map((h) => {
              const d = DRIVER_BY_ID[h.id];
              return `<tr><td>${esc(d.label)}</td><td class="num">${h.count}</td><td class="num">${h.ha.toFixed(2)}</td><td>${esc(d.holdsBack)}</td></tr>`;
            })
            .join("\n          ")}
        </tbody>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cambodia screen — shortlist decision report (${esc(meta.bundleVersion)})</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm 16mm 12mm;
    }

    :root {
      --ink: #1a1a1a;
      --muted: #4a4a4a;
      --rule: #c8c8c8;
      --rule-soft: #e6e6e6;
      --wash: #f5f7f8;
      --accent: #0099AA;
      --accent-wash: #eef7f8;
      --sans: "IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      --mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    }

    * { box-sizing: border-box; }

    html { font-size: 11pt; }

    body {
      font-family: var(--sans);
      color: var(--ink);
      line-height: 1.4;
      margin: 0 auto;
      max-width: 210mm;
      padding: 1.25rem 1.5rem 2rem;
      background: #fff;
    }

    h1, h2, h3 {
      font-family: var(--sans);
      font-weight: 600;
      line-height: 1.25;
      margin: 0 0 0.5rem;
      page-break-after: avoid;
    }
    h1 { font-size: 1.35rem; letter-spacing: -0.01em; }
    h2 {
      font-size: 1.05rem;
      margin-top: 1.35rem;
      padding-bottom: 0.25rem;
      border-bottom: 1.5px solid var(--accent);
    }
    h3 { font-size: 0.98rem; margin-top: 0; }

    p { margin: 0.4rem 0 0.75rem; }
    code {
      font-family: var(--mono);
      font-size: 0.88em;
      background: var(--wash);
      padding: 0.05em 0.3em;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .no-print { margin: 0 0 1rem; }
    .no-print button {
      font: inherit;
      font-weight: 600;
      padding: 0.45rem 0.9rem;
      border: 1px solid var(--accent);
      background: var(--accent);
      color: #fff;
      cursor: pointer;
    }

    .mast {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 1.5rem;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      page-break-inside: avoid;
    }
    .mast-text { flex: 1 1 14rem; min-width: 0; }
    .meta { color: var(--muted); font-size: 0.9rem; margin: 0.25rem 0 0.65rem; }

    .banner {
      border-left: 3px solid var(--accent);
      padding: 0.55rem 0.75rem;
      background: var(--accent-wash);
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
      color: var(--ink);
    }

    .summary {
      page-break-inside: avoid;
      margin-bottom: 0.25rem;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.45rem 0 0.9rem;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid var(--rule);
      padding: 0.32rem 0.45rem;
      text-align: left;
      vertical-align: top;
    }
    thead th {
      background: var(--wash);
      font-weight: 600;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--muted);
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .data td:nth-child(2),
    .data td:nth-child(3) { text-align: right; font-variant-numeric: tabular-nums; }

    table.summary-metrics {
      width: auto;
      min-width: 14rem;
    }
    table.summary-metrics th {
      background: var(--wash);
      font-weight: 600;
      width: 11rem;
    }
    table.summary-metrics td {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    table.overview { font-size: 0.82rem; }
    table.overview th, table.overview td { padding: 0.28rem 0.35rem; }
    table.overview .map-thumb { width: 7.5rem; max-width: 7.5rem; }
    table.overview .map-thumb .map-shot { margin: 0; max-width: 7.2rem; }
    table.overview .map-thumb .map-shot img { width: 100%; height: auto; }
    table.overview .map-thumb .map-shot figcaption,
    table.overview .map-thumb .map-shot--missing .hint { display: none; }
    table.overview .map-thumb .map-shot--missing {
      padding: 0.35rem;
      font-size: 0.72rem;
      margin: 0;
    }

    .empty { color: var(--muted); font-size: 0.92rem; }

    .site-sheet {
      break-inside: avoid;
      page-break-inside: avoid;
      margin: 0.85rem 0 1rem;
      padding: 0.65rem 0.7rem 0.75rem;
      border: 1px solid var(--rule-soft);
      background: #fff;
    }
    .site-sheet h3 {
      margin: 0 0 0.45rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--rule-soft);
    }

    table.kv { margin: 0; font-size: 0.88rem; }
    table.kv th {
      width: 8.5rem;
      background: var(--wash);
      font-weight: 600;
      color: var(--muted);
      white-space: nowrap;
    }
    table.kv td { word-break: break-word; }

    table.site-grid {
      margin: 0;
      border: none;
    }
    table.site-grid > tbody > tr > td {
      border: none;
      padding: 0;
      vertical-align: top;
    }
    .site-grid__attrs { width: 58%; padding-right: 0.65rem !important; }
    .site-grid__map { width: 42%; }
    .site-grid__map .map-shot { margin: 0; max-width: none; }
    .site-grid__map .map-shot img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: #d0dee2;
    }
    .site-grid__map .map-shot figcaption {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 0.2rem;
    }
    .site-grid__map .map-shot--missing {
      border: 1px dashed #999;
      padding: 0.65rem 0.75rem;
      background: var(--wash);
      color: var(--muted);
      font-size: 0.82rem;
      margin: 0;
    }
    .site-grid__map .map-shot--missing .hint { font-size: 0.75rem; margin: 0.3rem 0 0; }

    .map-shot { margin: 0.5rem 0 0.75rem; max-width: 22.5rem; }
    .map-shot img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: #d0dee2;
    }
    .map-shot figcaption { font-size: 0.8rem; color: var(--muted); margin-top: 0.25rem; }
    .map-shot--missing {
      border: 1px dashed #999;
      padding: 0.75rem 1rem;
      background: var(--wash);
      color: var(--muted);
      font-size: 0.9rem;
    }
    .map-shot--missing .hint { font-size: 0.8rem; margin: 0.35rem 0 0; }

    .report-qr { page-break-inside: avoid; }
    .report-qr svg { display: block; width: 7.5rem; height: 7.5rem; }

    .next-steps { page-break-inside: avoid; }
    .foot {
      margin-top: 1rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--rule-soft);
      font-size: 0.85rem;
      color: var(--muted);
    }

    @media print {
      body {
        margin: 0;
        max-width: none;
        padding: 0;
        font-size: 10pt;
      }
      .no-print { display: none !important; }
      a { color: inherit; text-decoration: none; }
      .site-sheet {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      table.overview { page-break-inside: auto; }
      table.overview tr { break-inside: avoid; page-break-inside: avoid; }
      h2 { break-after: avoid; page-break-after: avoid; }
      .map-shot img { max-width: 100%; }
      .site-grid__map .map-shot img { max-height: 48mm; object-fit: cover; object-position: center; }
    }

    @media screen and (max-width: 40rem) {
      .site-grid__attrs,
      .site-grid__map { display: block; width: 100%; padding-right: 0 !important; }
      .site-grid__map { margin-top: 0.65rem; }
    }
  </style>
</head>
<body>
  <p class="no-print"><button type="button" onclick="window.print()">Print / Save as PDF (A4)</button></p>

  <header class="mast">
    <div class="mast-text">
      <h1>Cambodia screen — shortlist decision report</h1>
      <p class="meta">Generated: ${esc(meta.generatedAt)}. Bundle: <code>${esc(meta.bundleVersion)}</code>.</p>
      <div class="banner">Land-cover screen only. GO = worth a field visit. Flags name instruments — never approved or refused. Not planting permission. Sites below are the decision content; pair with spreadsheet + map polygons from Act.</div>
    </div>
    ${qrBlock}
  </header>

  <section class="summary" aria-labelledby="summary-heading">
    <h2 id="summary-heading">Summary</h2>
    <table class="summary-metrics">
      <tbody>
        <tr><th scope="row">Sites (this shortlist)</th><td>${rows.length}</td></tr>
        <tr><th scope="row">GO</th><td>${go}</td></tr>
        <tr><th scope="row">CAUTION</th><td>${caution}</td></tr>
        <tr><th scope="row">Area (ha)</th><td>${ha.toFixed(2)}</td></tr>
      </tbody>
    </table>

    <h2>Hold-backs</h2>
    ${holdsHtml}
  </section>

  <section aria-labelledby="sites-overview-heading">
    <h2 id="sites-overview-heading">Shortlist sites</h2>
    <p>First-class content of this decision pack — carried from Read → Act.</p>
    <table class="data overview">
      <thead>
        <tr>
          <th>Site</th>
          <th>Reading</th>
          <th class="num">ha</th>
          <th class="num">Lat</th>
          <th class="num">Lon</th>
          <th>Drivers</th>
          <th>Overlays</th>
          ${includeMap ? "<th>Map</th>" : ""}
        </tr>
      </thead>
      <tbody>
    ${overviewRows}
      </tbody>
    </table>
  </section>

  <section aria-labelledby="sites-detail-heading">
    <h2 id="sites-detail-heading">Site detail</h2>
    ${detailBlocks}
  </section>

  <section class="next-steps" aria-labelledby="next-heading">
    <h2 id="next-heading">Next steps</h2>
    <table class="data">
      <thead>
        <tr><th>Step</th><th>Action</th></tr>
      </thead>
      <tbody>
        <tr><td class="num">1</td><td>Field visit — walk GO first; treat CAUTION holds as named checks.</td></tr>
        <tr><td class="num">2</td><td>Rights / access — confirm authorities or project holders where protected-area or carbon-project flags hit.</td></tr>
        <tr><td class="num">3</td><td>Share carefully — quote package evidence; no commercial republish of protected-area or project extracts.</td></tr>
      </tbody>
    </table>
  </section>

  <p class="foot">Pair with spreadsheet + map-polygon downloads from Act (same shortlist). ${meta.productBanner ? esc(meta.productBanner) : ""}</p>
  <!-- Markdown twin available as .md download from Act.
${esc(mdish)}
  -->
</body>
</html>`;
}

export function openPrintableReport(html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) {
    // Popup blocked — fall back to download
    const a = document.createElement("a");
    a.href = url;
    a.download = "cambodia-shortlist-report.html";
    a.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
