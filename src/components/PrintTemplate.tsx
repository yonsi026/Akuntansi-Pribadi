import React, { useState, useRef, useEffect } from "react";
import { 
  Printer, 
  Download, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  FileText, 
  Building2, 
  Calendar, 
  Hash, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  Maximize2
} from "lucide-react";
import { StoreConfig } from "../types";
import { downloadElementAsPdf, printA4Element } from "../utils/printHelper";

export interface PrintTableColumn<T = any> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface PrintSummaryItem {
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: "default" | "emerald" | "rose" | "blue" | "indigo";
}

export interface PrintSignature {
  role: string;          // e.g. "Dibuat Oleh," or "Mengetahui & Disetujui Oleh,"
  title: string;         // e.g. "Petugas Keuangan / Staf Akuntansi"
  name: string;          // e.g. "Staf Akuntansi SAK EMKM"
  date?: string;         // e.g. "28 September 2026"
  subtitle?: string;     // e.g. "Pimpinan Toko / Pemilik Usaha"
}

export interface ReportData<T = any> {
  title: string;
  subtitle?: string;
  reportCode?: string;
  period?: string;
  date?: string;
  storeConfig?: Partial<StoreConfig>;
  // Tabular Data
  columns?: PrintTableColumn<T>[];
  rows?: T[];
  // Summary & Totals
  summaryItems?: PrintSummaryItem[];
  grandTotalLabel?: string;
  grandTotalValue?: string | number;
  // Notes / Explanations
  notes?: string | string[];
  footerDisclaimer?: string;
  // Signatures
  signatures?: {
    preparer?: Partial<PrintSignature>;
    approver?: Partial<PrintSignature>;
    custom?: PrintSignature[];
  };
  // Metadata badges
  metadata?: Record<string, string>;
}

export interface PrintTemplateProps {
  /** Structured report data */
  data?: ReportData;
  /** Custom report content if rendering custom tables/elements within the A4 frame */
  children?: React.ReactNode;
  /** Component display mode: modal (overlay with preview controls), embedded (inline in page), or standalone */
  mode?: "modal" | "embedded" | "standalone";
  /** Whether the modal is open (applicable when mode='modal') */
  isOpen?: boolean;
  /** Close handler (applicable when mode='modal') */
  onClose?: () => void;
  /** Custom print handler override */
  onPrint?: () => void;
  /** Auto trigger print on component mount */
  autoPrint?: boolean;
  /** Show top action bar (Cetak, PDF, Zoom) */
  showActions?: boolean;
  /** Custom filename for PDF export */
  filename?: string;
  /** Custom container class */
  className?: string;
}

/**
 * Triggers hardware printing for any A4 print sheet in the DOM with automatic styling isolation
 */
export function triggerPrintA4(): void {
  document.body.classList.add("printing-a4-active");
  const cleanup = () => {
    document.body.classList.remove("printing-a4-active");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Short delay so browser styles settle before rendering print preview
  setTimeout(() => {
    try {
      window.print();
    } catch (err) {
      console.warn("window.print() error:", err);
    }
    // Fallback safety cleanup after 3 seconds
    setTimeout(cleanup, 3000);
  }, 100);
}

/**
 * Production-ready Dedicated PrintTemplate Component
 * Renders report data into clean, compliant A4 layout with Company Header, styled tables, and official signatures.
 */
export const PrintTemplate: React.FC<PrintTemplateProps> = ({
  data,
  children,
  mode = "embedded",
  isOpen = true,
  onClose,
  onPrint,
  autoPrint = false,
  showActions = true,
  filename,
  className = ""
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [downloadLink, setDownloadLink] = useState<{ url: string; filename: string } | null>(null);
  const a4DocRef = useRef<HTMLDivElement>(null);

  // Handle auto-print if requested
  useEffect(() => {
    if (autoPrint && isOpen) {
      const timer = setTimeout(() => {
        handleTriggerPrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, isOpen]);

  if (mode === "modal" && !isOpen) {
    return null;
  }

  const store = data?.storeConfig || {};
  const reportTitle = data?.title || "LAPORAN KEUANGAN SAK EMKM";
  const reportSubtitle = data?.subtitle || data?.period || "Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah";
  const reportCode = data?.reportCode || `DOC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const printDateStr = data?.date || new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const printTimeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const defaultPdfFilename = filename || `${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.pdf`;

  // Action: Trigger Browser / Hardware Print via isolated DOM container
  const handleTriggerPrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (a4DocRef.current) {
      printA4Element(a4DocRef.current, reportTitle);
    } else {
      triggerPrintA4();
    }
  };

  // Action: Export Authentic Client-Side PDF (.pdf) with vector fallback
  const handleExportPdf = async () => {
    if (!a4DocRef.current) return;
    setIsExportingPdf(true);
    setPdfSuccess(false);

    try {
      const result = await downloadElementAsPdf(a4DocRef.current, defaultPdfFilename, data);
      if (result && result.success) {
        setPdfSuccess(true);
        if (result.blobUrl) {
          setDownloadLink({ url: result.blobUrl, filename: result.filename });
        }
        setTimeout(() => setPdfSuccess(false), 6000);
      }
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Helper format value
  const formatCellValue = (val: any) => {
    if (val === null || val === undefined || val === "") return "-";
    if (typeof val === "number") {
      if (isNaN(val)) return "-";
      return val.toLocaleString("id-ID");
    }
    return String(val);
  };

  // Content of the clean A4 sheet
  const renderA4Sheet = () => (
    <div 
      ref={a4DocRef}
      className={`a4-print-sheet printable-area print-card-wrapper bg-white text-slate-900 mx-auto w-full transition-all duration-150 ${className}`}
      style={{
        boxSizing: "border-box",
        maxWidth: "210mm",
        minHeight: "297mm",
        padding: "12mm 15mm",
        transform: mode === "modal" ? `scale(${zoomLevel / 100})` : undefined,
        transformOrigin: "top center"
      }}
    >
      {/* ========================================================================= */}
      {/* 1. HEADER PERUSAHAAN (KOP SURAT RESMI STANDAR SAK EMKM)                   */}
      {/* ========================================================================= */}
      <div className="report-header-block pb-4 mb-5 border-b-2 border-slate-900 border-b-double">
        <div className="flex justify-between items-start gap-4">
          {/* Logo / Company Identity */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs print:border print:border-slate-800">
              {store.storeName ? store.storeName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                {store.storeName || "USAHA MIKRO KECIL MENENGAH"}
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {store.storeType || "Bidang Perdagangan & Jasa"} • {store.storeCity || "Indonesia"}
              </p>
              {store.storeAddress && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {store.storeAddress}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1 font-mono">
                {store.storeNpwp && (
                  <span>NPWP: <strong>{store.storeNpwp}</strong></span>
                )}
                {store.storePhone && (
                  <span>Telp/WA: <strong>{store.storePhone}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Document Official Badge & Date */}
          <div className="text-right shrink-0">
            <span className="inline-block border-2 border-slate-900 px-2.5 py-0.5 text-[9.5pt] font-black uppercase tracking-widest text-slate-900 rounded-sm">
              DOKUMEN RESMI SAK EMKM
            </span>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 font-mono">
              <div>No: <strong className="text-slate-900">{reportCode}</strong></div>
              <div>Cetak: <strong>{printDateStr}</strong> {printTimeStr}</div>
              {data?.period && (
                <div className="text-blue-900 font-sans font-bold text-[10.5px]">
                  {data.period}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Main Title Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-center">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 font-sans">
            {reportTitle}
          </h2>
          {reportSubtitle && (
            <p className="text-xs text-slate-600 font-mono font-medium mt-0.5">
              {reportSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY LAPORAN (CUSTOM CHILDREN OR STANDARD TABULAR DATA)                */}
      {/* ========================================================================= */}
      <div className="report-body-block space-y-5">
        {/* If custom children are provided, render them */}
        {children}

        {/* If structured columns & rows are provided, render clean A4 Table */}
        {data?.columns && data?.rows && (
          <div className="overflow-x-auto my-3">
            <table className="w-full border-collapse text-[10pt] font-sans border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-400">
                  {data.columns.map((col, idx) => (
                    <th 
                      key={col.key || idx}
                      style={{ width: col.width }}
                      className={`py-2 px-3 text-xs font-bold text-slate-800 uppercase tracking-wider border border-slate-300 ${
                        col.align === "right" 
                          ? "text-right" 
                          : col.align === "center" 
                          ? "text-center" 
                          : "text-left"
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={data.columns.length} 
                      className="py-8 text-center text-xs text-slate-500 italic border border-slate-200"
                    >
                      Tidak ada data transaksi untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, rowIdx) => (
                    <tr 
                      key={row.id || rowIdx}
                      className={rowIdx % 2 === 1 ? "bg-slate-50/60" : "bg-white"}
                    >
                      {data.columns!.map((col, colIdx) => (
                        <td 
                          key={col.key || colIdx}
                          className={`py-2 px-3 border border-slate-200 text-slate-800 ${
                            col.align === "right" 
                              ? "text-right font-mono" 
                              : col.align === "center" 
                              ? "text-center font-mono" 
                              : "text-left"
                          }`}
                        >
                          {col.render 
                            ? col.render(row[col.key], row, rowIdx) 
                            : formatCellValue(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {/* Optional Table Foot / Totals */}
              {(data.grandTotalLabel || data.grandTotalValue !== undefined) && (
                <tfoot>
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-900">
                    <td 
                      colSpan={Math.max(1, (data.columns?.length || 2) - 1)}
                      className="py-2.5 px-3 text-right font-bold text-xs uppercase tracking-wide border border-slate-300"
                    >
                      {data.grandTotalLabel || "TOTAL KESELURUHAN:"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-slate-900 border border-slate-300">
                      {typeof data.grandTotalValue === "number"
                        ? (isNaN(data.grandTotalValue) ? "-" : `Rp ${data.grandTotalValue.toLocaleString("id-ID")}`)
                        : data.grandTotalValue || "-"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Summary Items / KPI Cards */}
        {data?.summaryItems && data.summaryItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-4">
            {data.summaryItems.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border text-left ${
                  item.color === "emerald"
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                    : item.color === "rose"
                    ? "bg-rose-50/60 border-rose-300 text-rose-950"
                    : item.color === "blue" || item.color === "indigo"
                    ? "bg-indigo-50/60 border-indigo-300 text-indigo-950"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </div>
                <div className="text-sm font-black font-mono mt-1">
                  {typeof item.value === "number" 
                    ? (isNaN(item.value) ? "-" : `Rp ${item.value.toLocaleString("id-ID")}`) 
                    : (item.value ?? "-")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes / Ketentuan Tambahan */}
        {data?.notes && (
          <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[9.5pt] text-slate-600 leading-relaxed my-3">
            <strong className="text-slate-800 block text-[10px] uppercase tracking-wider mb-1">
              Catatan &amp; Keterangan Tambahan:
            </strong>
            {Array.isArray(data.notes) ? (
              <ul className="list-disc list-inside space-y-0.5">
                {data.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="margin-0">{data.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TANDA TANGAN RESMI (DUAL COLUMN OFFICIAL SIGNATURES)                    */}
      {/* ========================================================================= */}
      <div className="report-signature-block signature-block mt-8 pt-6 border-t-2 border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Kolom Kiri: Pembuat Laporan (Staf Keuangan) */}
          <div className="flex flex-col justify-between h-36">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                {data?.signatures?.preparer?.role || "Dibuat Oleh,"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {data?.signatures?.preparer?.title || "Petugas Keuangan / Staf Akuntansi"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 underline font-sans">
                {data?.signatures?.preparer?.name || "Staf Akuntansi SAK EMKM"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Tanggal: {data?.signatures?.preparer?.date || printDateStr}
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Pimpinan / Penanggung Jawab */}
          <div className="flex flex-col justify-between h-36">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                {data?.signatures?.approver?.role || "Mengetahui & Disetujui Oleh,"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {data?.signatures?.approver?.title || "Pimpinan / Pemilik Usaha"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 underline font-sans">
                {data?.signatures?.approver?.name || store.storeName || "Pimpinan Usaha"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {data?.signatures?.approver?.subtitle || store.storeCity || "Indonesia"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER / LEGAL DISCLAIMER                                             */}
      {/* ========================================================================= */}
      <div className="report-footer-block mt-6 pt-3 border-t border-slate-200 text-center text-[8.5pt] text-slate-400">
        <p>
          {data?.footerDisclaimer || 
            "Dokumen laporan ini diterbitkan secara otomatis oleh Sistem Pembukuan SAK EMKM. Sah dan dapat dipertanggungjawabkan sesuai ketentuan pelaporan keuangan entitas mikro, kecil, dan menengah."}
        </p>
        <p className="text-[7.5pt] text-slate-400 font-mono mt-0.5">
          Dicetak dari aplikasi web SAK EMKM • Halaman 1 dari 1 • Kode Verifikasi: {reportCode}
        </p>
      </div>
    </div>
  );

  // If in MODAL mode, wrap in preview overlay with top controls
  if (mode === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print-template-modal-overlay">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto print-template-modal-box animate-in fade-in zoom-in-95">
          {/* Top Control Bar (Hidden on print) */}
          <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-2">
                  <span>{reportTitle}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    A4 Siap Cetak
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Pratinjau cetak layout A4 presisi SAK EMKM
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Zoom Controls */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg text-xs text-slate-300">
                <button 
                  onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))}
                  className="hover:text-white p-1 cursor-pointer"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-[11px]">{zoomLevel}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                  className="hover:text-white p-1 cursor-pointer"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hardware / Browser Print Button */}
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                title="Cetak langsung ke hardware printer (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen (A4)</span>
              </button>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                title="Unduh dokumen dalam format PDF asli (.pdf)"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyusun PDF...</span>
                  </>
                ) : pdfSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Tersimpan (.PDF)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Direct Download Fallback Banner for Sandbox / Iframe */}
          {downloadLink && (
            <div className="bg-emerald-950 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dokumen PDF <strong>{downloadLink.filename}</strong> berhasil diproses!</span>
              </div>
              <a
                href={downloadLink.url}
                download={downloadLink.filename}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File (.PDF)</span>
              </a>
            </div>
          )}

          {/* Sheet Viewer Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/50 flex justify-center">
            {renderA4Sheet()}
          </div>
        </div>
      </div>
    );
  }

  // EMBEDDED or STANDALONE MODE
  return (
    <div className="print-template-container w-full">
      {/* Optional In-Page Action Toolbar (Hidden in print) */}
      {showActions && (
        <div className="no-print mb-4 p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Printer className="w-4 h-4" />
            </span>
            <span>
              <strong>Format A4 Siap Cetak:</strong> Dilengkapi Kop Usaha resmi, tabel akun tertata rapi, dan blok tanda tangan sah SAK EMKM.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded direct download notification */}
      {downloadLink && (
        <div className="no-print mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Berkas PDF <strong>{downloadLink.filename}</strong> berhasil dibuat dan siap diunduh!</span>
          </div>
          <a
            href={downloadLink.url}
            download={downloadLink.filename}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Klik di Sini untuk Unduh Langsung</span>
          </a>
        </div>
      )}

      {/* The Actual A4 Sheet */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden p-2 sm:p-6 print:border-none print:shadow-none print:p-0">
        {renderA4Sheet()}
      </div>
    </div>
  );
};
