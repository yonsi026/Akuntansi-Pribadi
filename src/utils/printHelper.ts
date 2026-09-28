/**
 * Universal Print & PDF Export Utility
 * Handles printing across standard browsers, sandboxed iframes, and mobile devices.
 * Supports:
 * 1. Direct hardware printing via isolated in-page print DOM (#universal-print-container)
 * 2. Instant client-side PDF file download (.pdf) using html2canvas & jsPDF with vector fallback
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ReportData } from "../components/PrintTemplate";

export interface PrintOptions {
  title: string;
  filename?: string;
  styles?: string;
}

export interface PdfExportResult {
  success: boolean;
  blobUrl?: string;
  filename: string;
  error?: string;
}

const DEFAULT_PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
  
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .font-mono {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: auto;
  }

  thead {
    display: table-header-group !important;
  }

  tfoot {
    display: table-footer-group !important;
  }

  th, td {
    padding: 6px 8px;
  }

  .no-print, .no-print-element {
    display: none !important;
  }

  @media print {
    .no-print, .no-print-element {
      display: none !important;
    }
    body {
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }
  }
`;

/**
 * Builds standalone printable HTML document with embedded fonts, styles, and action toolbar
 */
export function buildStandaloneHtml(htmlBody: string, title: string, customStyles = ""): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${DEFAULT_PRINT_STYLES}
    ${customStyles}
    .print-banner-bar {
      margin-bottom: 20px;
      padding: 12px 18px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-banner-bar button {
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-print-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-print-primary:hover {
      background: #1d4ed8;
    }
    .btn-print-secondary {
      background: #334155;
      color: #f1f5f9;
    }
    .btn-print-secondary:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <!-- Print Control Banner (Hidden in printer output) -->
  <div class="print-banner-bar no-print">
    <div>
      <div style="font-weight: 700; font-size: 13px;">${title} — Pratinjau Dokumen SAK EMKM</div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        Format Standar A4. Jika dialog cetak printer tidak otomatis muncul, tekan <strong>Ctrl + P</strong> (Windows) atau <strong>Cmd + P</strong> (Mac).
      </div>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="btn-print-primary" onclick="window.print()">
        🖨️ Cetak ke Printer / Simpan PDF
      </button>
      <button class="btn-print-secondary" onclick="window.close()">
        ✕ Tutup
      </button>
    </div>
  </div>

  <div class="printable-document-content">
    ${htmlBody}
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Auto print trigger error:', e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Activates in-page print mode using a dedicated isolated container on document.body
 * Hides #root completely during printing so the print output is 100% clean and never cut off.
 */
export function printInPageDOM(htmlContent: string, title = "Dokumen SAK EMKM"): boolean {
  try {
    const existing = document.getElementById("universal-print-container");
    if (existing) {
      existing.remove();
    }

    const container = document.createElement("div");
    container.id = "universal-print-container";
    container.innerHTML = htmlContent;

    // Reset styles on any sheet inside container to ensure full-width, unscaled A4 printing
    const sheet = container.querySelector(".a4-print-sheet, .printable-document, .printable-area") as HTMLElement;
    if (sheet) {
      sheet.style.transform = "none";
      sheet.style.webkitTransform = "none";
      sheet.style.maxWidth = "100%";
      sheet.style.width = "100%";
      sheet.style.minHeight = "auto";
      sheet.style.height = "auto";
      sheet.style.margin = "0";
      sheet.style.padding = "0";
      sheet.style.boxShadow = "none";
      sheet.style.border = "none";
    }

    // Remove buttons or interactive controls from print output
    container.querySelectorAll(".no-print, .no-print-element, button").forEach(el => el.remove());

    document.body.appendChild(container);
    document.body.classList.add("printing-mode");

    const cleanup = () => {
      document.body.classList.remove("printing-mode");
      const c = document.getElementById("universal-print-container");
      if (c) c.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    // Give browser brief time to layout before calling window.print()
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn("In-page window.print() failed:", e);
        cleanup();
      }
    }, 150);

    // Safety timeout cleanup after 60 seconds (NOT 3 seconds)
    setTimeout(() => {
      if (document.body.classList.contains("printing-mode")) {
        cleanup();
      }
    }, 60000);

    return true;
  } catch (err) {
    console.error("printInPageDOM error:", err);
    return false;
  }
}

/**
 * Triggers hardware printing by cloning an existing HTMLElement into the isolated print container
 */
export function printA4Element(element: HTMLElement, title = "Dokumen Cetak SAK EMKM"): boolean {
  try {
    const existing = document.getElementById("universal-print-container");
    if (existing) {
      existing.remove();
    }

    const container = document.createElement("div");
    container.id = "universal-print-container";

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.webkitTransform = "none";
    clone.style.maxWidth = "100%";
    clone.style.width = "100%";
    clone.style.minHeight = "auto";
    clone.style.height = "auto";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.boxShadow = "none";
    clone.style.border = "none";

    // Remove interactive elements
    clone.querySelectorAll(".no-print, .no-print-element, button").forEach(el => el.remove());

    container.appendChild(clone);
    document.body.appendChild(container);
    document.body.classList.add("printing-mode");

    const cleanup = () => {
      document.body.classList.remove("printing-mode");
      const c = document.getElementById("universal-print-container");
      if (c) c.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn("printA4Element window.print error:", e);
        cleanup();
      }
    }, 150);

    setTimeout(() => {
      if (document.body.classList.contains("printing-mode")) {
        cleanup();
      }
    }, 60000);

    return true;
  } catch (err) {
    console.error("printA4Element error:", err);
    return false;
  }
}

/**
 * Triggers hardware printing via dedicated in-page DOM isolation
 */
export function printToHardwareOrBrowser(htmlContent: string, title = "Dokumen Cetak SAK EMKM"): boolean {
  return printInPageDOM(htmlContent, title);
}

/**
 * Exports an HTML element directly to a downloadable .pdf file using html2canvas and jsPDF.
 * Uses an isolated offscreen unscaled clone so that zoom levels, scroll positions, or container styles
 * NEVER truncate or distort the output.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename = "dokumen-keuangan.pdf",
  reportDataFallback?: ReportData
): Promise<PdfExportResult> {
  const finalFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;

  // Create isolated offscreen container with exact A4 width (794px at 96 DPI)
  const tempContainer = document.createElement("div");
  tempContainer.id = "pdf-export-offscreen-sandbox";
  tempContainer.style.position = "fixed";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "794px";
  tempContainer.style.maxWidth = "794px";
  tempContainer.style.minHeight = "1123px";
  tempContainer.style.background = "#ffffff";
  tempContainer.style.color = "#0f172a";
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.margin = "0";
  tempContainer.style.padding = "0";
  tempContainer.style.zIndex = "-9999";
  tempContainer.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Deep clone element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.webkitTransform = "none";
  clone.style.margin = "0 auto";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.width = "794px";
  clone.style.maxWidth = "794px";
  clone.style.minHeight = "auto";
  clone.style.height = "auto";
  clone.style.boxSizing = "border-box";

  // Remove interactive buttons or non-printable bars
  clone.querySelectorAll(".no-print, .no-print-element, button").forEach(el => el.remove());

  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  try {
    // Render high-res canvas at 2x scale
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    // Multi-page pagination (threshold 2mm avoids blank trailing page)
    while (heightLeft > 2) {
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    // Generate authentic Blob and trigger download
    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Anchor click download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalFilename;
    link.target = "_blank";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      link.remove();
      // Keep object URL alive for 45s so fallback link works
      setTimeout(() => URL.revokeObjectURL(blobUrl), 45000);
    }, 500);

    return { success: true, blobUrl, filename: finalFilename };
  } catch (err: any) {
    console.warn("html2canvas PDF export encountered error, attempting vector fallback:", err);

    // If html2canvas fails, fallback to vector PDF generation
    if (reportDataFallback) {
      return generateFallbackVectorPdf(reportDataFallback, finalFilename);
    }

    return {
      success: false,
      filename: finalFilename,
      error: err?.message || "Gagal menyusun dokumen PDF"
    };
  } finally {
    tempContainer.remove();
  }
}

/**
 * Fallback vector PDF generator using jsPDF native API
 * Guaranteed to generate a clean, valid .pdf without depending on canvas/DOM rasterization.
 */
export function generateFallbackVectorPdf(
  data: ReportData,
  filename = "dokumen-laporan.pdf"
): PdfExportResult {
  try {
    const finalFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const store = data.storeConfig || {};
    let y = 18;

    // 1. Header (Kop Surat)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(store.storeName || "USAHA MIKRO KECIL DAN MENENGAH", 14, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${store.storeType || "Bidang Usaha & Jasa"} • ${store.storeCity || "Indonesia"}`, 14, y);
    y += 4;

    if (store.storeAddress) {
      doc.text(store.storeAddress, 14, y);
      y += 4;
    }

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`NPWP: ${store.storeNpwp || "-"}  |  Telp: ${store.storePhone || "-"}`, 14, y);
    y += 4;

    // Header divider line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(14, y, 196, y);
    doc.setLineWidth(0.2);
    doc.line(14, y + 1, 196, y + 1);
    y += 8;

    // 2. Title & Period
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(data.title.toUpperCase(), 105, y, { align: "center" });
    y += 5;

    if (data.period || data.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(data.period || data.subtitle || "", 105, y, { align: "center" });
      y += 6;
    }

    // 3. Tabular Data (if provided)
    if (data.columns && data.rows && data.rows.length > 0) {
      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 7, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 7, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      // Simple column spacing
      doc.text("KODE", 18, y + 5);
      doc.text("URAIAN AKUN / KETERANGAN", 42, y + 5);
      doc.text("KLASIFIKASI", 125, y + 5);
      doc.text("JUMLAH (RP)", 192, y + 5, { align: "right" });
      y += 7;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        if (y > 270) {
          doc.addPage();
          y = 18;
        }

        const codeVal = String(row.code || row.accountId || "-");
        const nameVal = String(row.name || row.accountName || "-");
        const typeVal = String(row.type || row.category || "-");
        const amountNum = typeof row.amount === "number" ? row.amount : (typeof row.debit === "number" ? row.debit : 0);
        const amountStr = amountNum < 0 ? `(${Math.abs(amountNum).toLocaleString("id-ID")})` : amountNum.toLocaleString("id-ID");

        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6.5, "F");
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, 182, 6.5, "S");

        doc.setTextColor(15, 23, 42);
        doc.text(codeVal, 18, y + 4.5);
        doc.text(nameVal.substring(0, 45), 42, y + 4.5);
        doc.text(typeVal.substring(0, 25), 125, y + 4.5);
        doc.text(amountStr, 192, y + 4.5, { align: "right" });

        y += 6.5;
      }

      // Grand Total Row
      if (data.grandTotalLabel || data.grandTotalValue !== undefined) {
        y += 2;
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, 182, 8, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(data.grandTotalLabel || "TOTAL:", 18, y + 5.5);
        const gVal = typeof data.grandTotalValue === "number" ? `Rp ${data.grandTotalValue.toLocaleString("id-ID")}` : String(data.grandTotalValue || "-");
        doc.text(gVal, 192, y + 5.5, { align: "right" });
        y += 12;
      }
    }

    // 4. Signatures
    if (y > 235) {
      doc.addPage();
      y = 20;
    } else {
      y += 8;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    // Left Signature
    doc.text(data.signatures?.preparer?.role || "Dibuat Oleh,", 30, y);
    doc.text(data.signatures?.preparer?.title || "Staf Akuntansi / Keuangan", 30, y + 4);

    // Right Signature
    doc.text(data.signatures?.approver?.role || "Mengetahui & Menyetujui,", 140, y);
    doc.text(data.signatures?.approver?.title || "Pimpinan / Pemilik Usaha", 140, y + 4);

    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(data.signatures?.preparer?.name || "Staf Akuntansi SAK EMKM", 30, y);
    doc.text(data.signatures?.approver?.name || store.storeName || "Pimpinan Usaha", 140, y);

    // Output & Download
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalFilename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 45000);
    }, 500);

    return { success: true, blobUrl, filename: finalFilename };
  } catch (err: any) {
    console.error("Vector PDF fallback error:", err);
    return {
      success: false,
      filename,
      error: err?.message || "Gagal membuat berkas PDF"
    };
  }
}

/**
 * Exports HTML string directly to a downloadable .pdf file by rendering it offscreen
 */
export async function downloadHtmlStringToPdf(
  htmlContent: string,
  filename = "dokumen-keuangan.pdf",
  title = "Dokumen SAK EMKM"
): Promise<PdfExportResult> {
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "fixed";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "794px";
  tempContainer.style.background = "#ffffff";
  tempContainer.style.padding = "24px";
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  tempContainer.innerHTML = htmlContent;

  document.body.appendChild(tempContainer);

  try {
    const res = await downloadElementAsPdf(tempContainer, filename);
    return res;
  } finally {
    tempContainer.remove();
  }
}

/**
 * Universal execution function for backwards compatibility
 */
export function executePrintContent(htmlBody: string, options: PrintOptions): void {
  const title = options.title || "Dokumen Pembukuan SAK EMKM";
  printToHardwareOrBrowser(htmlBody, title);
}

/**
 * Universal trigger for A4 hardware print with clean in-page DOM isolation
 */
export function triggerPrintA4(): void {
  const sheet = document.querySelector(".a4-print-sheet, .printable-document, .printable-area") as HTMLElement;
  if (sheet) {
    printA4Element(sheet, "Laporan Keuangan SAK EMKM");
    return;
  }
  safeNativePrint();
}

/**
 * Safely triggers window.print() with comprehensive fallback
 */
export function safeNativePrint(fallbackHtmlGenerator?: () => string, filename = "dokumen-cetak.pdf"): void {
  if (fallbackHtmlGenerator) {
    printToHardwareOrBrowser(fallbackHtmlGenerator(), "Dokumen SAK EMKM");
    return;
  }

  try {
    window.print();
  } catch (err) {
    console.warn("safeNativePrint error:", err);
  }
}
