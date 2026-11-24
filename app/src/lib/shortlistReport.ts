/**
 * Printable shortlist report for Act — Markdown + HTML (+ pair with CSV/GeoJSON).
 * Physical / land-cover proxy only; never invents clearances.
 */

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
    `# Cambodia screen — shortlist report`,
    ``,
    `Generated: ${meta.generatedAt} (Australia/Sydney local machine time as reported by the browser).`,
    `Bundle: \`${meta.bundleVersion}\`.`,
    ``,
    `> Physical / land-cover suitability proxy only. GO = worth a field look. Flags cite instruments and overlaps — never approved or refused. Not planting permission.`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Patches | ${rows.length} |`,
    `| GO | ${go.length} |`,
    `| CAUTION | ${caution.length} |`,
    `| Area (ha) | ${ha.toFixed(2)} |`,
    ``,
    `## Hold-backs on this shortlist`,
    ``
  ];
  if (holds.length === 0) {
    lines.push(`No mapped hold-back drivers on these patches (physical GO only where listed).`, ``);
  } else {
    lines.push(`| Driver | Patches | ha | Reading |`, `| --- | ---: | ---: | --- |`);
    for (const h of holds) {
      const d = DRIVER_BY_ID[h.id];
      lines.push(`| ${d.label} | ${h.count} | ${h.ha.toFixed(2)} | ${d.holdsBack} |`);
    }
    lines.push(``);
  }
  lines.push(`## Patches`, ``);
  for (const row of rows) {
    const meaning = meaningForClass(row.class_id);
    const drivers = driversForFeature(asProps(row));
    lines.push(`### ${row.id}`);
    lines.push(``);
    lines.push(
      `- **Reading:** ${suitabilityLabel(row.suitability)}${meaning ? ` · ${meaning.label}` : ` · class ${row.class_id}`}`
    );
    lines.push(`- **Area:** ${row.area_ha.toFixed(2)} ha`);
    if (row.province) lines.push(`- **Province:** ${row.province}`);
    lines.push(`- **Centroid:** ${row.lon}, ${row.lat}`);
    lines.push(
      `- **Drivers:** ${drivers.length ? drivers.map((id) => DRIVER_BY_ID[id].short).join(", ") : "none mapped"}`
    );
    lines.push(`- **Permit gate:** ${flagLabel(row.permit_gate)}`);
    lines.push(`- **STOP (legal):** ${flagLabel(row.stop_legal)}${row.stop_legal_status ? ` (${row.stop_legal_status})` : ""}`);
    lines.push(
      `- **VERRA / project overlap:** ${flagLabel(row.project_overlap)}${(row.project_overlap_ids ?? []).length ? ` · ${(row.project_overlap_ids ?? []).join(", ")}` : ""}`
    );
    lines.push(`- **Elevation fail:** ${flagLabel(row.elevation_fail ?? null)}`);
    if (row.note) lines.push(`- **Note:** ${row.note}`);
    lines.push(``);
  }
  lines.push(
    `## Next steps`,
    ``,
    `1. Field look — walk GO first; treat CAUTION holds as named checks.`,
    `2. Tenure / access — confirm MoE / project holders where permit or VERRA flags hit.`,
    `3. Licence before share — quote the open-cleared evidence lines; no commercial republish of WDPA/VERRA extracts.`,
    ``,
    `## Companion exports`,
    ``,
    `Pair this report with the CSV attribute table and GeoJSON polygons from Act.`,
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
  // Lightweight HTML wrapper; keep structure readable for print.
  const go = rows.filter((r) => r.suitability === "go").length;
  const caution = rows.length - go;
  const ha = rows.reduce((s, r) => s + (Number.isFinite(r.area_ha) ? r.area_ha : 0), 0);
  const holds = holdCounts(rows);
  const patchBlocks = rows
    .map((row) => {
      const meaning = meaningForClass(row.class_id);
      const drivers = driversForFeature(asProps(row));
      return `<article class="patch">
  <h3>${esc(row.id)}</h3>
  <ul>
    <li><strong>Reading:</strong> ${esc(suitabilityLabel(row.suitability))}${meaning ? ` · ${esc(meaning.label)}` : ` · class ${row.class_id}`}</li>
    <li><strong>Area:</strong> ${row.area_ha.toFixed(2)} ha</li>
    ${row.province ? `<li><strong>Province:</strong> ${esc(row.province)}</li>` : ""}
    <li><strong>Centroid:</strong> ${row.lon}, ${row.lat}</li>
    <li><strong>Drivers:</strong> ${drivers.length ? esc(drivers.map((id) => DRIVER_BY_ID[id].short).join(", ")) : "none mapped"}</li>
    <li><strong>Permit gate:</strong> ${esc(flagLabel(row.permit_gate))}</li>
    <li><strong>STOP (legal):</strong> ${esc(flagLabel(row.stop_legal))}${row.stop_legal_status ? ` (${esc(row.stop_legal_status)})` : ""}</li>
    <li><strong>VERRA:</strong> ${esc(flagLabel(row.project_overlap))}${(row.project_overlap_ids ?? []).length ? ` · ${esc((row.project_overlap_ids ?? []).join(", "))}` : ""}</li>
    <li><strong>Elevation fail:</strong> ${esc(flagLabel(row.elevation_fail ?? null))}</li>
  </ul>
</article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cambodia screen — shortlist report (${esc(meta.bundleVersion)})</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 48rem; margin: 1.5rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.45; }
    h1, h2, h3 { font-family: system-ui, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin: 0.75rem 0 1.25rem; font-size: 0.95rem; }
    th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; }
    th { background: #f3f3f3; }
    .banner { border-left: 4px solid #0099AA; padding: 0.5rem 0.75rem; background: #f4fafb; margin: 1rem 0; }
    .patch { break-inside: avoid; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e5e5; }
    @media print { body { margin: 0; max-width: none; } .no-print { display: none; } }
  </style>
</head>
<body>
  <p class="no-print"><button onclick="window.print()">Print / Save as PDF</button></p>
  <h1>Cambodia screen — shortlist report</h1>
  <p>Generated: ${esc(meta.generatedAt)}. Bundle: <code>${esc(meta.bundleVersion)}</code>.</p>
  <div class="banner">Physical / land-cover suitability proxy only. GO = worth a field look. Flags cite instruments — never approved or refused. Not planting permission.</div>
  <h2>Summary</h2>
  <table>
    <tr><th>Patches</th><td>${rows.length}</td></tr>
    <tr><th>GO</th><td>${go}</td></tr>
    <tr><th>CAUTION</th><td>${caution}</td></tr>
    <tr><th>Area (ha)</th><td>${ha.toFixed(2)}</td></tr>
  </table>
  <h2>Hold-backs</h2>
  ${
    holds.length === 0
      ? "<p>No mapped hold-back drivers on these patches.</p>"
      : `<table><thead><tr><th>Driver</th><th>Patches</th><th>ha</th><th>Reading</th></tr></thead><tbody>${holds
          .map((h) => {
            const d = DRIVER_BY_ID[h.id];
            return `<tr><td>${esc(d.label)}</td><td>${h.count}</td><td>${h.ha.toFixed(2)}</td><td>${esc(d.holdsBack)}</td></tr>`;
          })
          .join("")}</tbody></table>`
  }
  <h2>Patches</h2>
  ${patchBlocks}
  <h2>Next steps</h2>
  <ol>
    <li>Field look — walk GO first; treat CAUTION holds as named checks.</li>
    <li>Tenure / access — confirm MoE / project holders where permit or VERRA flags hit.</li>
    <li>Licence before share — quote open-cleared evidence; no commercial republish of WDPA/VERRA extracts.</li>
  </ol>
  <p>Pair with CSV + GeoJSON exports from Act. ${meta.productBanner ? esc(meta.productBanner) : ""}</p>
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
