/**
 * Report QR helpers for printable decision packs (LIIP-style).
 *
 * Pattern source: NSW LIIP `app/src/liip/ui/reportQr.ts` (nsw-dcceew-liip).
 * That repo is optional / ungated here — this module ports the same habit:
 * a QR on the printable report encodes a reopen URL for the console, while
 * shortlist rows, holds, and geometries travel in the report body / CSV / GeoJSON.
 *
 * Does not invent clearances. Does not embed patch geometries in the QR.
 */

import QRCode from "qrcode";

export type ReportQrMeta = {
  /** Absolute (or same-origin) URL encoded in the QR. */
  url: string;
  /** Short caption under the figure. */
  caption: string;
  /** SVG markup for print / HTML embed. */
  svg: string;
  /** Optional PNG data-URL for UI preview. */
  dataUrl: string;
};

export type BuildActReportUrlInput = {
  /** Prefer `window.location.origin + pathname` when in-browser. */
  pageBase?: string;
  bundleVersion: string;
  /** Hash route for Act (default `#licence`). */
  hash?: string;
  patchCount?: number;
};

const DEFAULT_SIZE = 128;

/** Caption: what the code opens, plus the claim ceiling. */
export function reportQrCaption(bundleVersion: string, patchCount?: number): string {
  const patches =
    patchCount == null
      ? "this shortlist"
      : `${patchCount} shortlisted site${patchCount === 1 ? "" : "s"}`;
  return `Scan to reopen Act on the Cambodia screen (bundle ${bundleVersion}). Paper / file carries ${patches} — QR does not encode map shapes. Land-cover screen only; not planting permission.`;
}

/**
 * Build the reopen URL encoded in the QR.
 * Points at Act with bundle version (and optional patch count) in the query —
 * shortlist itself stays in session + export files, not in the QR payload.
 */
export function buildActReportUrl(input: BuildActReportUrlInput): string {
  const hash = input.hash ?? "#act";
  const base =
    (input.pageBase && input.pageBase.replace(/\/$/, "")) ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.replace(/\/$/, "") || ""}`
      : "");
  const params = new URLSearchParams();
  params.set("bundle", input.bundleVersion);
  params.set("from", "report-qr");
  if (input.patchCount != null) params.set("patches", String(input.patchCount));
  const q = params.toString();
  if (!base) {
    return `${hash}?${q}`;
  }
  // Hash routers: query sits after the hash so Act can read it if needed.
  return `${base}${hash}?${q}`;
}

export async function renderReportQrSvg(url: string, sizePx = DEFAULT_SIZE): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    width: sizePx,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}

export async function renderReportQrDataUrl(url: string, sizePx = DEFAULT_SIZE): Promise<string> {
  return QRCode.toDataURL(url, {
    width: sizePx,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}

/** Build the full QR meta block used by Act + printable HTML. */
export async function buildReportQr(input: BuildActReportUrlInput & { sizePx?: number }): Promise<ReportQrMeta> {
  const url = buildActReportUrl(input);
  const caption = reportQrCaption(input.bundleVersion, input.patchCount);
  const sizePx = input.sizePx ?? DEFAULT_SIZE;
  const [svg, dataUrl] = await Promise.all([
    renderReportQrSvg(url, sizePx),
    renderReportQrDataUrl(url, sizePx)
  ]);
  return { url, caption, svg, dataUrl };
}

/** Printable HTML figure (LIIP: QR travels with the decision pack). */
export function reportQrHtmlFigure(qr: Pick<ReportQrMeta, "svg" | "url" | "caption">): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<figure class="report-qr" style="margin:1.25rem 0;max-width:14rem;">
  <div class="report-qr-svg" aria-hidden="true">${qr.svg}</div>
  <figcaption style="font-size:0.8rem;line-height:1.35;margin-top:0.4rem;">${esc(qr.caption)}</figcaption>
  <p style="font-size:0.75rem;word-break:break-all;margin:0.35rem 0 0;"><a href="${esc(qr.url)}">${esc(qr.url)}</a></p>
</figure>`;
}

/** Markdown twin: URL + caption (scanners need the HTML/PDF for the code itself). */
export function reportQrMarkdownBlock(qr: Pick<ReportQrMeta, "url" | "caption">): string {
  return [`## Reopen (QR)`, ``, qr.caption, ``, `\`${qr.url}\``, ``].join("\n");
}
