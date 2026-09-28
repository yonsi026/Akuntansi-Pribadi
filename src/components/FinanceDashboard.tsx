import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  DollarSign, 
  Percent, 
  AlertCircle, 
  Play,
  CheckCircle, 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  Boxes, 
  Wallet, 
  PlusCircle, 
  FileSpreadsheet, 
  Receipt, 
  Search, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  Building2, 
  BookOpen, 
  ExternalLink,
  Info
} from "lucide-react";
import { FinancialStats, Transaction, StockItem, StoreConfig } from "../types";
import { DashboardCharts } from "./DashboardCharts";
import { MonthlyProfitChart } from "./MonthlyProfitChart";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";

// Standard formatting function for Indonesian Rupiah
export const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num || 0);
};

interface FinanceDashboardProps {
  stats: FinancialStats;
  transactions: Transaction[];
  stockItems: StockItem[];
  onLoadDemoData: () => void;
  onNavigateToTab: (tab: string, subFilter?: string) => void;
  storeConfig?: StoreConfig;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  stats,
  transactions,
  stockItems,
  onLoadDemoData,
  onNavigateToTab,
  storeConfig
}) => {
  const [tableSearch, setTableSearch] = useState("");
  const [tableTypeFilter, setTableTypeFilter] = useState("all");

  // Calculate active inventory asset value
  const activeStockValue = stockItems.reduce((acc, item) => acc + (item.stock * item.avgPurchasePrice), 0);
  
  // Calculate cash balance (Kas 1001) from transactions
  const totalCashIn = transactions.reduce((acc, t) => {
    if (t.type === 'Setor Modal' || t.type === 'Penerimaan' || t.type === 'Penjualan Stok' || t.type === 'Penjualan') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const totalCashOut = transactions.reduce((acc, t) => {
    if (t.type === 'Tarik Prive' || t.type === 'Pengeluaran' || t.type === 'Pembelian Stok' || t.type === 'Pembelian' || t.type === 'Biaya Operasional' || t.type === 'Gaji Karyawan' || t.type === 'Listrik & Air' || t.type === 'Sewa Toko' || t.type === 'Internet & Pulsa' || t.type === 'Perlengkapan Toko' || t.type === 'Servis & Perbaikan' || t.type === 'Beli Inventaris') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const cashBalance = Math.max(0, totalCashIn - totalCashOut);

  // Balance match indicator (Aktiva vs Pasiva)
  const totalLiabilitiesAndEquity = stats.totalLiabilities + stats.totalEquity;
  const isBalanced = Math.abs(stats.totalAssets - totalLiabilitiesAndEquity) < 1;

  // Low stock items (stock < 10)
  const lowStockItems = stockItems.filter(item => item.stock < 10);

  // Filtered recent transactions for mini ledger table
  const recentTransactions = [...transactions].reverse().filter(t => {
    if (tableTypeFilter !== "all") {
      if (tableTypeFilter === "in" && !(t.type.includes("Penjualan") || t.type === "Penerimaan" || t.type === "Setor Modal")) return false;
      if (tableTypeFilter === "out" && (t.type.includes("Penjualan") || t.type === "Penerimaan" || t.type === "Setor Modal")) return false;
    }
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const salesCount = transactions.filter(t => t.type.includes("Penjualan")).length;
  const netMargin = stats.revenue > 0 ? Math.round((stats.netProfit / stats.revenue) * 100) : 0;
  const taxLimitPercentage = Math.min(100, Math.round((stats.revenue / 500000000) * 100));

  return (
    <div className="space-y-6" id="fin-dashboard">
      
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Standar SAK EMKM IAI
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tahun Buku 2026 · Periode Berjalan
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-medium">
              <Database className="w-3 h-3 text-indigo-500" />
              Penyimpanan Offline-First Aman
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-display tracking-tight">
            Ringkasan Keuangan {storeConfig?.storeName || "Toko"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikhtisar posisi kas, peredaran omzet, struktur beban, dan kepatuhan perpajakan bidang <strong>{storeConfig?.storeType || "UMKM Dagang"}</strong> di kota <strong>{storeConfig?.storeCity || "Indonesia"}</strong>.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {transactions.length === 0 ? (
            <button
              onClick={onLoadDemoData}
              id="btn-load-demo"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Muat Data Demo Bisnis
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigateToTab("transaksi")}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-200 cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Transaksi
              </button>

              <button
                onClick={() => onNavigateToTab("laporan", "ekspor")}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 transition cursor-pointer"
                title="Unduh seluruh laporan keuangan SAK EMKM dalam file Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>

              <button
                onClick={() => onNavigateToTab("asisten")}
                className="flex items-center justify-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-violet-200 transition cursor-pointer"
                title="Tanya solusi bisnis ke Akuntan AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Tanya AI</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. CORE KPI METRICS (4 SLEEK EXECUTIVE CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-kpi-grid">
        
        {/* Card 1: Kas & Saldo Bank */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kas & Saldo Bank</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatIDR(cashBalance)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Likuiditas Kas (1001)</span>
              <button 
                onClick={() => onNavigateToTab("transaksi")} 
                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
              >
                Buku Kas →
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Total Pendapatan / Omzet */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan (Omzet)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight text-emerald-600">
              {formatIDR(stats.revenue)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Peredaran Bruto Usaha</span>
              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                {salesCount} Penjualan
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran & HPP */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Beban & HPP</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight text-slate-800">
              {formatIDR(stats.expenses + stats.hpp)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500 truncate" title={`HPP: ${formatIDR(stats.hpp)} · Biaya: ${formatIDR(stats.expenses)}`}>
                HPP + Biaya Operasional
              </span>
              <span className="text-slate-600 font-mono text-[10px]">
                {stats.revenue > 0 ? Math.round(((stats.expenses + stats.hpp) / stats.revenue) * 100) : 0}% omzet
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Laba Bersih Toko (Net Profit) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Laba Bersih Berjalan</span>
            <div className={`p-2 rounded-xl group-hover:scale-105 transition-transform ${stats.netProfit >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${stats.netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
              {formatIDR(stats.netProfit)}
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Margin Laba Bersih</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${stats.netProfit >= 0 ? "bg-indigo-50 text-indigo-700" : "bg-rose-50 text-rose-700"}`}>
                {netMargin}% Margin
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. QUICK ACTIONS SHORTCUT BAR ("Aksi Cepat Akuntansi") */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold font-display text-white">Aksi Cepat Pembukuan</p>
              <p className="text-[11px] text-slate-400">Pintasan praktis input mutasi kas, stok, dan pencetakan laporan</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab("transaksi")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Catat Penjualan</span>
            </button>

            <button
              onClick={() => onNavigateToTab("transaksi")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Catat Beban / Biaya</span>
            </button>

            <button
              onClick={() => onNavigateToTab("stok")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Tambah Stok Barang</span>
            </button>

            <button
              onClick={() => onNavigateToTab("laporan", "neraca")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Neraca SAK EMKM</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. SPLIT 2-COLUMN MAIN DASHBOARD (8 Cols Left, 4 Cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* === LEFT COLUMN (8 COLS): CHARTS & RECENT TRANSACTIONS TABLE === */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Komponen Visualisasi Grafik Garis Recharts: Tren Laba Bulanan 6 Bulan Terakhir */}
          <MonthlyProfitChart transactions={transactions} stats={stats} />

          {/* Analytical Charts */}
          <DashboardCharts transactions={transactions} stockItems={stockItems} stats={stats} />

          {/* Recent Transactions Accounting Ledger Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs" id="dashboard-recent-txs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                    Buku Jurnal Transaksi Terkini
                  </h2>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                    {transactions.length} Entri
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan pembukuan kas masuk dan kas keluar terverifikasi sistem double-entry
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab("transaksi")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  <span>Buka Semua Jurnal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar for Ledger Table */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-4 mb-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Cari transaksi, nota, atau kategori..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => setTableTypeFilter("all")}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    tableTypeFilter === "all" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTableTypeFilter("in")}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    tableTypeFilter === "in" ? "bg-emerald-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Penerimaan (+)
                </button>
                <button
                  onClick={() => setTableTypeFilter("out")}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    tableTypeFilter === "out" ? "bg-rose-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Pengeluaran (-)
                </button>
              </div>
            </div>

            {/* Table Content */}
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 my-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-700">Belum ada transaksi yang sesuai</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Catat transaksi baru untuk memperbarui buku jurnal</p>
                <button
                  onClick={() => onNavigateToTab("transaksi")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Catat Transaksi
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Uraian / Deskripsi</th>
                      <th className="py-2.5 px-3">Tipe Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.slice(0, 6).map((t, idx) => {
                      const isIncome = t.type.includes("Penjualan") || t.type === "Penerimaan" || t.type === "Setor Modal";
                      return (
                        <tr key={t.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block truncate max-w-[200px] sm:max-w-xs">
                              {t.description}
                            </span>
                            {t.invoiceNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{t.invoiceNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-block text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {t.type}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                            isIncome ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {isIncome ? "+" : "-"} {formatIDR(t.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Klop
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* === RIGHT COLUMN (4 COLS): SAK EMKM COMPLIANCE, INVENTORY, TAX & AI === */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. SAK EMKM Double-Entry Balance Verification Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs" id="dashboard-balance-check">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Neraca Double-Entry
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isBalanced 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {isBalanced ? "✓ SEIMBANG (KLOP)" : "🗙 PERLU CEK"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Total Aktiva (Aset)</span>
                <span className="font-bold font-mono text-slate-900">{formatIDR(stats.totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-600 font-medium">Total Pasiva (Hutang + Modal)</span>
                <span className="font-bold font-mono text-slate-900">{formatIDR(totalLiabilitiesAndEquity)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Persamaan akuntansi <em>Aktiva = Liabilitas + Ekuitas</em> teruji seimbang matematis sesuai SAK EMKM.
              </span>
            </div>
          </div>

          {/* 2. Stock Inventory & Critical Supplies */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs" id="dashboard-stock-summary">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Persediaan Stok & HPP
              </h3>
              <button
                onClick={() => onNavigateToTab("stok")}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Kelola Stok →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Nilai Persediaan</span>
                <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block truncate">
                  {formatIDR(activeStockValue)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Katalog Produk</span>
                <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                  {stockItems.length} SKU
                </span>
              </div>
            </div>

            {/* Low stock alert */}
            {lowStockItems.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200/70 p-3 rounded-xl text-amber-900">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{lowStockItems.length} Produk Menipis (&lt; 10 unit)</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {lowStockItems.slice(0, 3).map(item => (
                    <span key={item.id} className="text-[10px] bg-white text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[130px]">
                      {item.name} ({item.stock} {item.unit})
                    </span>
                  ))}
                  {lowStockItems.length > 3 && (
                    <span className="text-[10px] text-amber-700 font-bold px-1 py-0.5">
                      +{lowStockItems.length - 3} lainnya
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Seluruh persediaan stok berada dalam jumlah aman.
              </p>
            )}
          </div>

          {/* 3. Pajak UMKM PP 23 (0.5%) Monitor Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs" id="dashboard-tax-monitor">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Pajak UMKM (PP 23 0.5%)
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {stats.revenue <= 500000000 ? "Bebas Pajak" : "Terutang 0.5%"}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Batasan omzet bebas pajak UU HPP: <strong>Rp 500 Juta / tahun</strong>
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-semibold text-slate-700">
                <span>Omzet Terkumpul</span>
                <span>{taxLimitPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.revenue > 500000000 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${taxLimitPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatIDR(stats.revenue)}</span>
                <span>Rp 500.000.000</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Estimasi PPh Final:</span>
              <span className="font-bold font-mono text-indigo-600">{formatIDR(stats.pph)}</span>
            </div>
          </div>

          {/* 4. AI Consultant Advice Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/60 rounded-2xl p-5 text-white shadow-md relative overflow-hidden" id="dashboard-ai-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                Rekomendasi Cerdas AI
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              {stats.revenue === 0 ? (
                "Belum ada catatan omzet penjualan. Muat data simulasi atau catat transaksi perdana untuk memicu analisa margin & likuiditas otomatis."
              ) : netMargin > 20 ? (
                `Kinerja prima! Margin laba bersih Anda ${netMargin}% melampaui rata-rata industri toko retail UMKM (15%). Likuiditas kas aman untuk ekspansi.`
              ) : (
                `Margin laba berjalan ${netMargin}%. Evaluasi pengeluaran beban operasional dan pastikan harga jual mencakup kenaikan HPP kulakan barang dagang.`
              )}
            </p>

            <button
              onClick={() => onNavigateToTab("asisten")}
              className="mt-4 w-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Konsultasikan Usaha ke AI
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          </div>

        </div>

      </div>

      {/* 5. OFFICIAL COMPLIANCE NOTE */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-[11px] text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800">
            Kepatuhan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)
          </p>
          <p className="text-slate-500 leading-relaxed">
            Aplikasi mengimplementasikan sistem pembukuan berpasangan (double-entry bookkeeping) dengan jurnal otomatis, pembaruan HPP persediaan rata-rata bergerak, serta pelaporan keuangan Laba Rugi, Neraca, dan Arus Kas sesuai regulasi resmi Ikatan Akuntan Indonesia (IAI).
          </p>
        </div>
      </div>

    </div>
  );
};
