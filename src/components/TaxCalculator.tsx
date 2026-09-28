import React, { useState, useEffect } from "react";
import { 
  Percent, 
  HelpCircle, 
  FileCheck, 
  CheckCircle, 
  User, 
  Building,
  ArrowRight,
  Info,
  Receipt,
  Calculator,
  ShieldCheck,
  Sparkles,
  Printer
} from "lucide-react";
import { FinancialStats, StoreConfig } from "../types";
import { formatIDR } from "./FinanceDashboard";
import { UniversalPrintModal } from "./UniversalPrintModal";

interface TaxCalculatorProps {
  stats: FinancialStats;
  storeConfig?: StoreConfig;
  initialMode?: 'pph' | 'ppn';
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({ 
  stats,
  storeConfig,
  initialMode = 'pph'
}) => {
  const [taxMode, setTaxMode] = useState<'pph' | 'ppn'>(initialMode);
  const [taxpayerType, setTaxpayerType] = useState<'OP' | 'Badan'>('OP');
  const [customNpwp, setCustomNpwp] = useState<string>(storeConfig?.storeNpwp || "93.026.481.5-403.000");
  const [storeName, setStoreName] = useState<string>(storeConfig?.storeName || "Toko Kelontong Berkah");
  const [showTaxPrintModal, setShowTaxPrintModal] = useState(false);
  
  // PPN Interactive Calculator States
  const [ppnBaseAmount, setPpnBaseAmount] = useState<number>(1000000);
  const [ppnCalculationMode, setPpnCalculationMode] = useState<'exclude' | 'include'>('exclude');
  const [ppnInvoiceType, setPpnInvoiceType] = useState<'keluaran' | 'masukan'>('keluaran');

  useEffect(() => {
    if (initialMode) {
      setTaxMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (storeConfig?.storeName) {
      setStoreName(storeConfig.storeName);
    }
    if (storeConfig?.storeNpwp) {
      setCustomNpwp(storeConfig.storeNpwp);
    }
  }, [storeConfig]);
  
  // Calculate PPh Final based on taxpayer type
  // According to Indonesian UU HPP: WP OP gets Rp 500 Million gross turnover limit per year exempt.
  // Beyond 500M, it's 0.5%.
  const TAX_EXEMPT_THRESHOLD = 500000000; // Rp 500.000.000
  
  const currentOmzetAllTime = stats.revenue; // Currently logged omzet
  
  let taxableOmzet = 0;
  let pphFinalDue = 0;
  let isUnderLimitExempt = false;

  if (taxpayerType === 'OP') {
    if (currentOmzetAllTime <= TAX_EXEMPT_THRESHOLD) {
      isUnderLimitExempt = true;
      taxableOmzet = 0;
      pphFinalDue = 0;
    } else {
      taxableOmzet = currentOmzetAllTime - TAX_EXEMPT_THRESHOLD;
      pphFinalDue = taxableOmzet * 0.005;
    }
  } else {
    taxableOmzet = currentOmzetAllTime;
    pphFinalDue = taxableOmzet * 0.005;
  }

  // PPN Math (11%)
  const PPN_RATE = 0.11;
  let dpp = ppnBaseAmount;
  let ppnValue = 0;
  let grandTotal = 0;

  if (ppnCalculationMode === 'exclude') {
    dpp = ppnBaseAmount;
    ppnValue = Math.round(dpp * PPN_RATE);
    grandTotal = dpp + ppnValue;
  } else {
    // include tax: amount = DPP * 1.11 -> DPP = amount / 1.11
    dpp = Math.round(ppnBaseAmount / (1 + PPN_RATE));
    ppnValue = ppnBaseAmount - dpp;
    grandTotal = ppnBaseAmount;
  }

  // Get current date monthly variables
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6" id="perpajakan-panel">
      {taxMode === 'pph' ? (
        <>
          {/* Overview intro */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Simulasi Pajak UMKM (PP 23/2018 &amp; UU HPP)</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Hitung Pajak Penghasilan (PPh Final 0,5%) dan laporkan SPT Pajak secara mandiri dan akurat sesuai aturan Dirjen Pajak.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTaxPrintModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                title="Cetak Lembar Bukti Perhitungan Pajak (Print / PDF)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Pajak (Print / PDF)</span>
              </button>

              {/* orang pribadi op selector */}
              <button
                onClick={() => setTaxpayerType('OP')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  taxpayerType === 'OP' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Wajib Pajak Orang Pribadi (OP)
              </button>
              
              {/* badan usaha selector */}
              <button
                onClick={() => setTaxpayerType('Badan')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  taxpayerType === 'Badan' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Badan Usaha (CV / PT)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core calculation math columns */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">
                Kalkulasi Setoran PPh Final 0.5% Masa {currentMonth}
              </h3>

              <div className="space-y-4 text-xs">
                {/* Step 1: Omzet */}
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Total Peredaran Bruto Toko (Omzet)</span>
                  <span className="font-mono font-bold text-slate-900">{formatIDR(currentOmzetAllTime)}</span>
                </div>

                {/* Step 2: Exempt Limit representation */}
                {taxpayerType === 'OP' ? (
                  <div className="flex justify-between border-b border-slate-100 pb-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                    <div className="space-y-0.5 max-w-sm">
                      <span className="font-bold text-slate-700 block">Batas Bebas Pajak WP OP (UU HPP):</span>
                      <span className="text-slate-400 block leading-normal">Bebas Pajak pada Rp 500.000.000 omzet akumulatif per tahun</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">Rp 500.000.000</span>
                  </div>
                ) : (
                  <div className="flex justify-between border-b border-slate-100 pb-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                    <div className="space-y-0.5 max-w-sm">
                      <span className="font-bold text-slate-700 block">Batas Bebas Pajak WP Badan:</span>
                      <span className="text-slate-400 block leading-normal">Wajib Pajak Badan tidak berhak mendapat fasilitas Rp 500Jt bebas pajak</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600">Rp 0 (Tidak Ada)</span>
                  </div>
                )}

                {/* Step 3: Taxable Omzet */}
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Peredaran Bruto Kena Pajak</span>
                  <span className="font-mono font-bold text-slate-800">{formatIDR(taxableOmzet)}</span>
                </div>

                {/* Step 4: Final Tax rate */}
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Tarif Pajak Final PP 23/2018</span>
                  <span className="font-bold text-indigo-700 font-mono">0,5% (Setengah Persen)</span>
                </div>

                {/* Final Amount Payable */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Total Setoran PPh Final Wajib</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">{formatIDR(pphFinalDue)}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase font-mono">
                    {isUnderLimitExempt ? "Bebas Pajak (Nihil)" : "Kurang Bayar"}
                  </span>
                </div>

                {/* Tax Exempt Notification banner */}
                {isUnderLimitExempt && taxpayerType === 'OP' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[11px] leading-relaxed">
                    <span className="font-bold block">Kabar Baik! Pengabaian Pajak UMKM Terpenuhi:</span>
                    Omzet Anda sebesar <strong>{formatIDR(currentOmzetAllTime)}</strong> masih di bawah plafon Rp 500 Juta per tahun. Anda tidak wajib menyetor pajak sepeser pun bulan ini. Cukup buat draf laporan SPT tahunan nihil.
                  </div>
                )}
              </div>
            </div>

            {/* Info Box Column */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 bg-white/10 text-emerald-300 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md w-max">
                  <Info className="w-3.5 h-3.5" />
                  <span>Saku Edukasi Pajak</span>
                </div>
                <h4 className="text-sm font-bold font-sans">Batas Penyetoran?</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Penyetoran PPh Final 0,5% UMKM dilakukan paling lambat tanggal 15 bulan berikutnya setelah Masa Pajak berakhir. Pelaporan Surat Pemberitahuan (SPT) Tahunan dilakukan maksimal tanggal 31 Maret (untuk WP OP) atau 30 April (untuk WP Badan).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">KODE SETORAN UMKM:</span>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <span className="text-[9px] text-slate-400 block">KAP Pajak</span>
                    <span className="font-bold text-white">411128</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/10">
                    <span className="text-[9px] text-slate-400 block">KJS Setoran</span>
                    <span className="font-bold text-white">420</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Surat Setoran Pajak (SSP) Draft */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Draft Formulir Surat Setoran Pajak (SSP)</h3>
              <p className="text-xs text-slate-400">Salin detail berikut ketika melakukan pengisian form pembayaran pajak di bank, e-Billing, atau DJP Online</p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-w-4xl mx-auto">
              <div className="bg-slate-100 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Formulir Setoran</span>
                  <h4 className="font-sans font-bold text-slate-800">DEPARTEMEN KEUANGAN RI <br/> DIREKTORAT JENDERAL PAJAK</h4>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono text-right">Draft Lampiran</span>
                  <h4 className="font-sans font-bold text-slate-700">DRAFT LEMBAR MANDIRI SSP</h4>
                </div>
              </div>

              <div className="p-4 space-y-3 font-mono bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Nama Wajib Pajak</span>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none text-xs text-slate-800 focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">NPWP Wajib Pajak</span>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={customNpwp}
                      onChange={(e) => setCustomNpwp(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Masa Pajak</span>
                  <span className="sm:col-span-2 font-bold text-slate-800">{currentMonth}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Kode Akun Pajak (KAP)</span>
                  <span className="sm:col-span-2 font-bold text-slate-800">411128 (Jenis Pajak PPh Pengasilan Final)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Kode Jenis Setoran (KJS)</span>
                  <span className="sm:col-span-2 font-bold text-slate-800">420 (Sektor UMKM Tarik PP 23)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Peredaran Bruto (Omzet)</span>
                  <span className="sm:col-span-2 font-bold text-slate-800">{formatIDR(currentOmzetAllTime)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <span className="text-slate-600 font-bold uppercase text-[11px]">Jumlah Pembayaran</span>
                  <span className="sm:col-span-2 font-bold text-emerald-600 text-sm">{formatIDR(pphFinalDue)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PPN 11% INTERACTIVE CALCULATOR (UU HPP) */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Kalkulator Pajak Pertambahan Nilai (PPN 11%)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Hitung Dasar Pengenaan Pajak (DPP), PPN 11% (Tarif UU Harmonisasi Peraturan Perpajakan), faktur penjualan, atau pembelian barang kena pajak.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPpnInvoiceType('keluaran')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  ppnInvoiceType === 'keluaran'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                PPN Keluaran (Penjualan)
              </button>
              <button
                onClick={() => setPpnInvoiceType('masukan')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  ppnInvoiceType === 'masukan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                PPN Masukan (Pembelian)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input & Options */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">
                Input Nilai Transaksi &amp; Perhitungan
              </h3>

              <div className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Metode Perhitungan Harga</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPpnCalculationMode('exclude')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        ppnCalculationMode === 'exclude'
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-800 block">Harga Belum Termasuk PPN</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Nilai input adalah DPP murni (PPN 11% ditambahkan di atasnya)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPpnCalculationMode('include')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        ppnCalculationMode === 'include'
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-800 block">Harga Sudah Termasuk PPN</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Nilai input adalah harga final konsumen (DPP dihitung mundur)</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {ppnCalculationMode === 'exclude' ? "Nominal DPP (Harga Sebelum Pajak):" : "Total Nilai Transaksi (Termasuk PPN):"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={ppnBaseAmount || ""}
                      onChange={(e) => setPpnBaseAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-bold border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Calculations Summary */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Dasar Pengenaan Pajak (DPP):</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formatIDR(dpp)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600">Tarif PPN (UU HPP):</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded">11%</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-600 text-sm">{formatIDR(ppnValue)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-800 font-bold">Total Pembayaran / Faktur:</span>
                    <span className="font-mono font-bold text-emerald-600 text-base">{formatIDR(grandTotal)}</span>
                  </div>
                </div>

                {/* Posting Info */}
                <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl text-[11px] text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Pencatatan Akuntansi Berpasangan (SAK EMKM):
                  </p>
                  {ppnInvoiceType === 'keluaran' ? (
                    <p>
                      Pada penjualan dengan PPN: <strong>Debit Kas/Piutang ({formatIDR(grandTotal)})</strong>, <strong>Kredit Pendapatan ({formatIDR(dpp)})</strong>, dan <strong>Kredit Utang PPN Keluaran ({formatIDR(ppnValue)})</strong>.
                    </p>
                  ) : (
                    <p>
                      Pada pembelian dengan PPN: <strong>Debit Persediaan/Beban ({formatIDR(dpp)})</strong>, <strong>Debit Piutang PPN Masukan ({formatIDR(ppnValue)})</strong>, dan <strong>Kredit Kas/Utang ({formatIDR(grandTotal)})</strong>.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Faktur Preview Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Simulasi Struk / Faktur</span>
                    <h4 className="text-sm font-bold">{storeName}</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    PPN 11%
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span>DPP (Subtotal):</span>
                    <span className="text-white font-bold">{formatIDR(dpp)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span>PPN 11%:</span>
                    <span className="text-emerald-400 font-bold">{formatIDR(ppnValue)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-bold text-white">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-400">{formatIDR(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 leading-relaxed border-t border-slate-800">
                  <p>NPWP Usaha: <span className="font-mono text-white">{customNpwp}</span></p>
                  <p className="mt-1">Pajak Pertambahan Nilai dipungut sesuai UU HPP No. 7 Tahun 2021.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Status Usaha:</span>
                <span className="font-bold text-white font-mono">Pengusaha Kena Pajak (PKP)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL PRINT & PDF MODAL UNTUK PERHITUNGAN PAJAK */}
      <UniversalPrintModal
        isOpen={showTaxPrintModal}
        onClose={() => setShowTaxPrintModal(false)}
        title={`Lembar Perhitungan Pajak UMKM - ${storeName}`}
        filename={`Perhitungan-Pajak-${taxMode.toUpperCase()}-${Date.now()}.pdf`}
        htmlContent={`
          <div style="max-width: 800px; margin: 0 auto; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
              <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeName}</h1>
              <p style="font-size: 9.5pt; color: #475569; margin: 2px 0;">NPWP: ${customNpwp}</p>
              <h2 style="font-size: 13pt; margin: 6px 0 2px 0; color: #1e3a8a;">LEMBAR PERHITUNGAN PAJAK UMKM (PPH FINAL 0.5% &amp; PPN)</h2>
              <p style="font-size: 9pt; color: #64748b; margin: 0;">Berdasarkan PP 55/2022 &amp; UU HPP • Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tbody>
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 45%;">Klasifikasi Wajib Pajak:</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1;">${taxpayerType === 'OP' ? 'Wajib Pajak Orang Pribadi (WP OP UMKM)' : 'Badan Usaha (CV / PT)'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Akumulasi Omzet Bruto:</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">Rp ${currentOmzetAllTime.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Batas Omzet Bebas Pajak (PTKP):</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace;">${taxpayerType === 'OP' ? 'Rp 500.000.000 (Tidak Kena Pajak)' : 'Rp 0 (Badan Usaha Langsung Dikenai PPh)'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Dasar Pengenaan Pajak (DPP):</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">Rp ${taxableOmzet.toLocaleString('id-ID')}</td>
                </tr>
                <tr style="background: #f1f5f9;">
                  <td style="padding: 10px; border: 1px solid #0f172a; font-weight: 900; font-size: 11pt;">PPh Final 0.5% Terutang:</td>
                  <td style="padding: 10px; border: 1px solid #0f172a; font-family: monospace; font-weight: 900; font-size: 11pt; color: #1e3a8a;">Rp ${pphFinalDue.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; font-size: 8.5pt; color: #475569; margin-bottom: 24px;">
              <strong>Keterangan Resmi:</strong> PPh Final 0,5% disetorkan paling lambat tanggal 15 bulan berikutnya ke Kas Negara menggunakan Kode Billing Pajak (KAP 411128, KJS 420).
            </div>

            <!-- Tanda Tangan -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 9.5pt;">
              <div>
                <p style="color: #64748b; margin: 0;">Disiapkan Oleh Bagian Pembukuan,</p>
                <div style="height: 50px;"></div>
                <p style="font-weight: bold; margin: 0; text-decoration: underline;">Staf Keuangan</p>
              </div>
              <div>
                <p style="color: #64748b; margin: 0;">Wajib Pajak / Pemilik Usaha,</p>
                <div style="height: 50px;"></div>
                <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeName}</p>
              </div>
            </div>
          </div>
        `}
      />
    </div>
  );
};

