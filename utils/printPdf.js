import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function isCancel(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code.includes("cancel") ||
    message.includes("cancel") ||
    message.includes("dismiss") ||
    message.includes("user did not share") ||
    message.includes("sharing canceled")
  );
}

/**
 * Build a simple printable HTML document. Keep CSS conservative for Android WebView PDF.
 */
export function buildReportHtml({ title, meta, headers, rows }) {
  const head = (headers || [])
    .map((label) => `<th>${escapeHtml(label)}</th>`)
    .join("");
  const body = (rows || [])
    .map((cells) => `<tr>${(cells || []).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 16px; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #12233d;
      padding: 18px;
      font-size: 11px;
    }
    h1 { font-size: 18px; margin: 0 0 6px; font-weight: 700; }
    .meta { color: #5b6b7c; font-size: 11px; margin: 0 0 14px; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border: 1px solid #d7e0ea;
      padding: 6px 7px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    th { background: #eef4fb; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Create a PDF from HTML and open the native share sheet (or system print fallback).
 * Returns { shared: true } | { printed: true } | { cancelled: true }.
 */
export async function createAndSharePdf({ html, dialogTitle, landscape = true }) {
  // US Letter @ 72ppi: portrait 612x792, landscape 792x612 — wide tables fit better in landscape.
  const size = landscape
    ? { width: 792, height: 612 }
    : { width: 612, height: 792 };

  const file = await Print.printToFileAsync({
    html,
    width: size.width,
    height: size.height,
  });

  if (!file?.uri) {
    throw new Error("PDF file was not created.");
  }

  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (canShare) {
    try {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: dialogTitle || "PDF",
        ...(Platform.OS === "ios" ? { UTI: ".pdf" } : {}),
      });
      return { shared: true, uri: file.uri };
    } catch (error) {
      if (isCancel(error)) return { cancelled: true, uri: file.uri };
      // Fall through to native print if share fails for another reason.
    }
  }

  try {
    await Print.printAsync({
      html,
      width: size.width,
      height: size.height,
    });
    return { printed: true, uri: file.uri };
  } catch (error) {
    if (isCancel(error)) return { cancelled: true, uri: file.uri };
    throw error;
  }
}
