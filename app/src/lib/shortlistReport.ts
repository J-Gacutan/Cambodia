/**
 * Printable shortlist report for Act — Markdown + HTML (+ pair with CSV/GeoJSON).
 * Land-cover screen only; never invents clearances.
 *
 * Shortlist sites, holds, and companion download pointers are first-class body
 * content. Optional reopen QR is a figure on the pack — it does not replace rows
 * or geometries.
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
    `## Shortlist sites`,
    ``,
    `First-class content of this decision pack — same rows carried from Read → Act.`,
    ``
  );
  for (const row of rows) {
    const meaning = meaningForClass(row.class_id);
    const drivers = driversForFeature(asProps(row));
    lines.push(`### ${row.id}`);
    lines.push(``);
    lines.push(
      `- **Reading:** ${suitabilityLabel(row.suitability)}${meaning ? ` · ${meaning.label}` : ""}`
    );
    lines.push(`- **Area:** ${row.area_ha.toFixed(2)} ha`);
    if (row.province) lines.push(`- **Province:** ${row.province}`);
    lines.push(`- **Centre point:** ${row.lon}, ${row.lat}`);
    lines.push(
      `- **Reasons to pause:** ${drivers.length ? drivers.map((id) => DRIVER_BY_ID[id].short).join(", ") : "none mapped"}`
    );
    lines.push(`- **Protected area:** ${flagLabel(row.permit_gate)}`);
    lines.push(
      `- **Legal stop:** ${flagLabel(row.stop_legal)}${row.stop_legal_status ? ` (${row.stop_legal_status})` : ""}`
    );
    lines.push(
      `- **Carbon project:** ${flagLabel(row.project_overlap)}${(row.project_overlap_ids ?? []).length ? ` · ${(row.project_overlap_ids ?? []).join(", ")}` : ""}`
    );
    lines.push(`- **Height check fail:** ${flagLabel(row.elevation_fail ?? null)}`);
    lines.push(
      `- **Geometry:** ${row.geometry.type} (full rings in companion map-polygon download — not inlined in Markdown)`
    );
    if (row.note) lines.push(`- **Note:** ${row.note}`);
    lines.push(``);
  }
  lines.push(
    `## Next steps`,
    ``,
    `1. Field visit — walk GO first; treat CAUTION holds as named checks.`,
    `2. Rights / access — confirm authorities or project holders where protected-area or carbon-project flags hit.`,
    `3. Share carefully — quote the package evidence lines; no commercial republish of protected-area or project extracts.`,
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

/** Printable HTML (open → Print / Save as PDF). */
export function shortlistReportHtml(rows: ShortlistItem[], meta: ShortlistReportMeta): string {
  const mdish = shortlistReportMarkdown(rows, meta);
  const go = rows.filter((r) => r.suitability === "go").length;
  const caution = rows.length - go;
  const ha = rows.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);
  const holds = holdCounts(rows);
  const qrBlock = meta.reportQr ? reportQrHtmlFigure(meta.reportQr) : "";
  const patchBlocks = rows
    .map((row) => {
      const meaning = meaningForClass(row.class_id);
      const drivers = driversForFeature(asProps(row));
      return `<article class="patch" id="patch-${esc(row.id)}">
  <h3>${esc(row.id)}</h3>
  <ul>
    <li><strong>Reading:</strong> ${esc(suitabilityLabel(row.suitability))}${meaning ? ` · ${esc(meaning.label)}` : ""}</li>
    <li><strong>Area:</strong> ${row.area_ha.toFixed(2)} ha</li>
    ${row.province ? `<li><strong>Province:</strong> ${esc(row.province)}</li>` : ""}
    <li><strong>Centre point:</strong> ${row.lon}, ${row.lat}</li>
    <li><strong>Reasons to pause:</strong> ${drivers.length ? esc(drivers.map((id) => DRIVER_BY_ID[id].short).join(", ")) : "none mapped"}</li>
    <li><strong>Protected area:</strong> ${esc(flagLabel(row.permit_gate))}</li>
    <li><strong>Legal stop:</strong> ${esc(flagLabel(row.stop_legal))}${row.stop_legal_status ? ` (${esc(row.stop_legal_status)})` : ""}</li>
    <li><strong>Carbon project:</strong> ${esc(flagLabel(row.project_overlap))}${(row.project_overlap_ids ?? []).length ? ` · ${esc((row.project_overlap_ids ?? []).join(", "))}` : ""}</li>
    <li><strong>Height check fail:</strong> ${esc(flagLabel(row.elevation_fail ?? null))}</li>
    <li><strong>Geometry:</strong> ${esc(row.geometry.type)} (rings in companion map-polygon download)</li>
  </ul>
</article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cambodia screen — shortlist decision report (${esc(meta.bundleVersion)})</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 48rem; margin: 1.5rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.45; }
    h1, h2, h3 { font-family: system-ui, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin: 0.75rem 0 1.25rem; font-size: 0.95rem; }
    th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }
    th { background: #f3f3f3; }
    .banner { border-left: 4px solid #0099AA; padding: 0.5rem 0.75rem; background: #f4fafb; margin: 1rem 0; }
    .patch { break-inside: avoid; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e5e5; }
    .report-qr svg { display: block; width: 8rem; height: 8rem; }
    .mast { display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: flex-start; justify-content: space-between; }
    .mast-text { flex: 1 1 16rem; min-width: 0; }
    @media print { body { margin: 0; max-width: none; } .no-print { display: none; } }
  </style>
</head>
<body>
  <p class="no-print"><button onclick="window.print()">Print / Save as PDF</button></p>
  <div class="mast">
    <div class="mast-text">
      <h1>Cambodia screen — shortlist decision report</h1>
      <p>Generated: ${esc(meta.generatedAt)}. Bundle: <code>${esc(meta.bundleVersion)}</code>.</p>
      <div class="banner">Land-cover screen only. GO = worth a field visit. Flags name instruments — never approved or refused. Not planting permission. Sites below are the decision content; pair with spreadsheet + map polygons from Act.</div>
    </div>
    ${qrBlock}
  </div>
  <h2>Summary</h2>
  <table>
    <tr><th>Sites (this shortlist)</th><td>${rows.length}</td></tr>
    <tr><th>GO</th><td>${go}</td></tr>
    <tr><th>CAUTION</th><td>${caution}</td></tr>
    <tr><th>Area (ha)</th><td>${ha.toFixed(2)}</td></tr>
  </table>
  <h2>Hold-backs</h2>
  ${
    holds.length === 0
      ? "<p>No mapped hold-back on these sites.</p>"
      : `<table><thead><tr><th>Reason</th><th>Sites</th><th>ha</th><th>Reading</th></tr></thead><tbody>${holds
          .map((h) => {
            const d = DRIVER_BY_ID[h.id];
            return `<tr><td>${esc(d.label)}</td><td>${h.count}</td><td>${h.ha.toFixed(2)}</td><td>${esc(d.holdsBack)}</td></tr>`;
          })
          .join("")}</tbody></table>`
  }
  <h2>Shortlist sites</h2>
  <p>First-class content of this decision pack — carried from Read → Act.</p>
  ${patchBlocks}
  <h2>Next steps</h2>
  <ol>
    <li>Field visit — walk GO first; treat CAUTION holds as named checks.</li>
    <li>Rights / access — confirm authorities or project holders where protected-area or carbon-project flags hit.</li>
    <li>Share carefully — quote package evidence; no commercial republish of protected-area or project extracts.</li>
  </ol>
  <p>Pair with spreadsheet + map-polygon downloads from Act (same shortlist). ${meta.productBanner ? esc(meta.productBanner) : ""}</p>
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
