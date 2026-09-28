import React, { useState, useRef } from "react";
import { Printer, Download, X, ZoomIn, ZoomOut, Check, FileText, ExternalLink, Loader2, Info } from "lucide-react";
import { 
  printToHardwareOrBrowser, 
  printInPageDOM,
  downloadElementAsPdf, 
  downloadHtmlStringToPdf,
  buildStandaloneHtml 
} from "../utils/printHelper";

interface UniversalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename?: string;
  htmlContent: string;
}

export const UniversalPrintModal: React.FC<UniversalPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  filename,
  htmlContent
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [downloadLink, setDownloadLink] = useState<{ url: string; filename: string } | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const previewDocRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const pdfFileName = filename 
    ? (filename.endsWith(".pdf") ? filename : `${filename.replace(/\.html$/, "")}.pdf`)
    : `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;

  // 1. Direct hardware printer trigger
  const handleTriggerPrint = () => {
    setPrintStatus("Membuka perintah pencetakan printer...");
    printInPageDOM(htmlContent, title);
    setTimeout(() => setPrintStatus(null), 3500);
  };

  // 2. Client-side authentic PDF export (.pdf)
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setPrintStatus(null);
    setPdfSuccess(false);

    try {
      let res;
      if (previewDocRef.current) {
        res = await downloadElementAsPdf(previewDocRef.current, pdfFileName);
      }
      if (!res || !res.success) {
        res = await downloadHtmlStringToPdf(htmlContent, pdfFileName, title);
      }

      if (res && res.success) {
        setPdfSuccess(true);
        if (res.blobUrl) {
          setDownloadLink({ url: res.blobUrl, filename: res.filename });
        }
        setTimeout(() => setPdfSuccess(false), 6000);
      }
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. Open clean standalone tab
  const handleOpenInNewTab = () => {
    const fullHtml = buildStandaloneHtml(htmlContent, title);
    try {
      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, "_blank");
      if (!newWin) {
        // If popup blocked, direct trigger print
        printToHardwareOrBrowser(htmlContent, title);
      }
    } catch (e) {
      console.warn("Open new tab error:", e);
      printToHardwareOrBrowser(htmlContent, title);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print-modal-overlay print-template-modal-overlay">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh] print-modal-box print-template-modal-box animate-in fade-in zoom-in-95">
        
        {/* Top Control Bar (Marked as no-print) */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-2">
                <span>{title}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  A4 Siap Cetak
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Cetak langsung ke hardware printer atau unduh berkas resmi PDF
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg text-xs text-slate-300">
              <button 
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="hover:text-white p-1 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-[11px]">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(130, zoomLevel + 15))}
                className="hover:text-white p-1 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Hardware Print Button */}
            <button
              onClick={handleTriggerPrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              title="Cetak langsung ke printer hardware yang terhubung"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ke Hardware</span>
            </button>

            {/* Download Clean PDF (.pdf) */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              title="Unduh file dokumen PDF asli (.pdf)"
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
                  <span>Unduh PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Open Standalone Tab */}
            <button
              onClick={handleOpenInNewTab}
              className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium px-2.5 py-2 rounded-xl items-center gap-1.5 transition cursor-pointer"
              title="Buka dokumen di tab baru browser"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tab Baru</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Status Banner */}
        {printStatus && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{printStatus}</span>
            </div>
            <button onClick={() => setPrintStatus(null)} className="text-amber-800 hover:underline font-bold">Tutup</button>
          </div>
        )}

        {pdfSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center gap-2 no-print">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Berhasil!</strong> Berkas PDF <code>{pdfFileName}</code> telah diunduh ke perangkat Anda.</span>
          </div>
        )}

        {/* Informative helper ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">Petunjuk Cetak:</span>
            <span>
              Gunakan tombol <strong>Cetak ke Hardware</strong> untuk mengirim langsung ke printer (Epson, Canon, HP, dll), atau tombol <strong>Unduh PDF (.pdf)</strong> untuk menyimpan arsip PDF resmi.
            </span>
          </div>
        </div>

        {/* Document Sheet Viewer */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div 
            ref={previewDocRef}
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: "top center", 
              transition: "transform 0.15s ease",
              width: "100%",
              maxWidth: "800px"
            }}
            className="bg-white rounded-lg shadow-xl border border-slate-200/80 p-6 sm:p-10 text-slate-900 printable-document a4-print-sheet print-card-wrapper min-h-[1050px]"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

      </div>
    </div>
  );
};
