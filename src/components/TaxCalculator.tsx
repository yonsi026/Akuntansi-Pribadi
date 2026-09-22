import React, { useState } from "react";
import { 
  Percent, 
  HelpCircle, 
  FileCheck, 
  CheckCircle, 
  User, 
  Building,
  ArrowRight,
  Info
} from "lucide-react";
import { FinancialStats } from "../types";
import { formatIDR } from "./FinanceDashboard";

interface TaxCalculatorProps {
  stats: FinancialStats;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({ stats }) => {
  const [taxpayerType, setTaxpayerType] = useState<'OP' | 'Badan'>('OP');
  const [customNpwp, setCustomNpwp] = useState<string>("93.026.481.5-403.000");
  const [storeName, setStoreName] = useState<string>("Toko Kelontong Berkah");
  
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
    // Badan Usaha (CV/PT) does not get 500M free allowance. Pays 0.5% Final on all.
    taxableOmzet = currentOmzetAllTime;
    pphFinalDue = taxableOmzet * 0.005;
  }

  // Get current date monthly variables
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6" id="perpajakan-panel">
      {/* Overview intro */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Simulasi Pajak UMKM (PP 23/2018)</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Hitung Pajak Penghasilan (PPh Final 0,5%) dan laporkan SPT Pajak secara mandiri dan akurat tanpa bingung.
          </p>
        </div>
        <div className="flex gap-2">
          {/* orang pribadi op selector */}
          <button
            onClick={() => setTaxpayerType('OP')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              taxpayerType === 'OP' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Wajib Pajak Orang Pribadi
          </button>
          
          {/* badan usaha selector */}
          <button
            onClick={() => setTaxpayerType('Badan')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
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
          {/* Header of standard tax voucher */}
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

          {/* Fields */}
          <div className="p-4 space-y-3 font-mono bg-slate-50/50">
            {/* Store Name input mapping */}
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

            {/* NPWP input mapping */}
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

            {/* Masa Pajak */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Masa Pajak</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{currentMonth}</span>
            </div>

            {/* KAP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Kode Akun Pajak (KAP)</span>
              <span className="sm:col-span-2 font-bold text-slate-800">411128 (Jenis Pajak PPh Pengasilan Final)</span>
            </div>

            {/* KJS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Kode Jenis Setoran (KJS)</span>
              <span className="sm:col-span-2 font-bold text-slate-800">420 (Sektor UMKM Tarik PP 23)</span>
            </div>

            {/* Total Omzet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Peredaran Bruto (Omzet)</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formatIDR(currentOmzetAllTime)}</span>
            </div>

            {/* Total Setoran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="text-slate-600 font-bold uppercase text-[11px]">Jumlah Pembayaran</span>
              <span className="sm:col-span-2 font-bold text-emerald-600 text-sm">{formatIDR(pphFinalDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
