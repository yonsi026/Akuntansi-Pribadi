import React, { useState, useEffect } from "react";
import { Transaction, StockItem, StoreConfig } from "../types";
import { Cloud, UploadCloud, DownloadCloud, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";

interface CloudSyncProps {
  transactions: Transaction[];
  stockItems: StockItem[];
  storeConfig: StoreConfig;
  onSyncImport: (transactions: Transaction[], stockItems: StockItem[], storeConfig: StoreConfig) => void;
}

export const CloudSync: React.FC<CloudSyncProps> = ({
  transactions,
  stockItems,
  storeConfig,
  onSyncImport
}) => {
  const LOCAL_STORAGE_GAS_KEY = "akuntan_ai_gas_url_v1";

  const [gasUrl, setGasUrl] = useState<string>("");
  const [syncing, setSyncing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load configured Web App URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem(LOCAL_STORAGE_GAS_KEY);
    if (savedUrl) {
      setGasUrl(savedUrl);
    }
  }, []);

  const saveUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem(LOCAL_STORAGE_GAS_KEY, url);
  };

  // --- 1. PUSH (KIRIM DATA) ---
  const handlePushData = async () => {
    if (!gasUrl.trim()) {
      setErrorMsg("Harap masukkan URL Google Apps Script Web App terlebih dahulu!");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSyncing(true);

    try {
      const payload = {
        transactions,
        stockItems,
        storeConfig
      };

      const response = await fetch(gasUrl, {
        method: "POST",
        mode: "no-cors", // Required in Apps Script to bypass preflight requests on simpler apps
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // Note: with mode: "no-cors", response.status is 0, which is normal and expected for post redirects to GAS.
      setSuccessMsg("Sinkronisasi BERHASIL! Seluruh database lokal Anda telah berhasil dipancarkan ke Google Sheets Cloud.");
      setTimeout(() => setSuccessMsg(null), 8050);
    } catch (e: any) {
      console.error("Gagal melakukan Push Cloud Sync", e);
      setErrorMsg("Koneksi gagal atau CORS error: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // --- 2. PULL (AMBIL DATA) ---
  const handlePullData = async () => {
    if (!gasUrl.trim()) {
      setErrorMsg("Harap masukkan URL Google Apps Script Web App terlebih dahulu!");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setSyncing(true);

    try {
      // Create cache buster to prevent cached fetch
      const finalUrl = gasUrl.includes("?") 
        ? `${gasUrl}&_cb=${Date.now()}` 
        : `${gasUrl}?_cb=${Date.now()}`;

      const response = await fetch(finalUrl);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      
      const payloadJson = await response.json();
      
      if (payloadJson && payloadJson.success && payloadJson.data) {
        const cloudData = payloadJson.data;
        const pulledTxs: Transaction[] = cloudData.transactions || [];
        const pulledStocks: StockItem[] = cloudData.stockItems || [];
        const pulledConfig: StoreConfig = cloudData.storeConfig || storeConfig;

        onSyncImport(pulledTxs, pulledStocks, pulledConfig);
        setSuccessMsg(`Sinkronisasi BERHASIL! Terunduh ${pulledTxs.length} transaksi & ${pulledStocks.length} katalog dari Cloud.`);
        setTimeout(() => setSuccessMsg(null), 8050);
      } else {
        throw new Error("Respons Cloud tidak valid.");
      }
    } catch (e: any) {
      console.error("Gagal melakukan Pull Cloud Sync", e);
      setErrorMsg("Gagal sinkron dari Sheets. Harap pastikan Web App Anda di-deploy sebagai 'Anyone' dan kembalikan tipe JSON sesuai panduan di bawah.");
    } finally {
      setSyncing(false);
    }
  };

  const appsScriptCode = `// ----------------------------------------------------
// GOOGLE APPS SCRIPT DATABASE SYNC ENGINE - AKUNTAN AI
// ----------------------------------------------------
// Petunjuk: Tempel kode ini di script.google.com, 
// kemudian deploy sebagai "Web App" dengan akses "Anyone".

function doGet(e) {
  var properties = PropertiesService.getScriptProperties();
  var data = {
    transactions: JSON.parse(properties.getProperty("transactions") || "[]"),
    stockItems: JSON.parse(properties.getProperty("stockItems") || "[]"),
    storeConfig: JSON.parse(properties.getProperty("storeConfig") || "null")
  };
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function doPost(e) {
  try {
    var rawData = JSON.parse(e.postData.contents);
    var properties = PropertiesService.getScriptProperties();
    
    if (rawData.transactions) properties.setProperty("transactions", JSON.stringify(rawData.transactions));
    if (rawData.stockItems) properties.setProperty("stockItems", JSON.stringify(rawData.stockItems));
    if (rawData.storeConfig) properties.setProperty("storeConfig", JSON.stringify(rawData.storeConfig));
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sinkronisasi Berhasil!" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6" id="cloud-sync-engine">
      
      {/* Module Title */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
          <Cloud className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Sinkronisasi Cloud &amp; Sinkron Multi-User</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sinkronisasikan seluruh database akuntansi lokal Anda ke Google Sheets secara gratis menggunakan Google Apps Script. 
            Hal ini memungkinkan data diakses dari perangkat lain, komputer desktop, maupun smartphone Anda kapan saja 100% cloud realtime.
          </p>
        </div>
      </div>

      {/* Inputs Web App URL */}
      <div className="space-y-2 max-w-2xl">
        <label className="block text-xs font-bold text-slate-700">URL Web App Google Apps Script</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={gasUrl}
            onChange={(e) => saveUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="flex-1 text-xs font-mono border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
          <button
            type="button"
            disabled={syncing}
            onClick={handlePushData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300"
          >
            <UploadCloud className="w-4 h-4" />
            {syncing ? "Sinkron..." : "Kirim ke Cloud"}
          </button>
          
          <button
            type="button"
            disabled={syncing}
            onClick={handlePullData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300"
          >
            <DownloadCloud className="w-4 h-4" />
            {syncing ? "Sindron..." : "Unduh dari Cloud"}
          </button>
        </div>
      </div>

      {/* Cloud Feedback Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-xs font-bold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Setup Guide Accordion */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
        <h4 className="text-xs font-bold text-slate-800">Panduan Setup 4 Langkah Mudah (Gratis Selamanya)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <p className="font-bold text-slate-700">Buat Script</p>
            <p className="text-[10px] text-slate-400">Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">script.google.com</a>, klik tombol **Project Baru**.</p>
          </div>
          <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <p className="font-bold text-slate-700">Tempel Kode</p>
            <p className="text-[10px] text-slate-400">Salin kode mesin sinkronisasi di bawah, lalu hapus semua kode bawaan dan tempel di editor script.</p>
          </div>
          <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <p className="font-bold text-slate-700">Deploy Web App</p>
            <p className="text-[10px] text-slate-400">Pilih **Terapkan (Deploy)** &gt; **Penerapan Baru**. Pilih jenis **Aplikasi Web**.</p>
          </div>
          <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <p className="font-bold text-slate-700">Anyone Access</p>
            <p className="text-[10px] text-slate-400">Setel bagian **Yang memiliki akses** ke **Siapa saja (Anyone)** lalu salin kodenya ke kotak di atas.</p>
          </div>
        </div>

        {/* Copyable Code Block Terminal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-900 px-4 py-2 rounded-t-xl border-b border-slate-800">
            <span>GOOGLE_APPS_SCRIPT.JS</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[10px] hover:text-white transition duration-200 cursor-pointer text-slate-300"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[10px] leading-relaxed rounded-b-xl overflow-x-auto max-h-56">
            <code>{appsScriptCode}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};
