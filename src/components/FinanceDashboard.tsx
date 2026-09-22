import React from "react";
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
  Boxes
} from "lucide-react";
import { FinancialStats, Transaction, StockItem, StoreConfig } from "../types";
import { DashboardCharts } from "./DashboardCharts";

// Standard formatting function for Indonesian Rupiah
export const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

interface FinanceDashboardProps {
  stats: FinancialStats;
  transactions: Transaction[];
  stockItems: StockItem[];
  onLoadDemoData: () => void;
  onNavigateToTab: (tab: string) => void;
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
  const activeStockValue = stockItems.reduce((acc, item) => acc + (item.stock * item.avgPurchasePrice), 0);
  
  // Calculate cash balance (Kas 1001) from transactions
  const totalCashIn = transactions.reduce((acc, t) => {
    if (t.type === 'Setor Modal' || t.type === 'Penerimaan' || t.type === 'Penjualan Stok') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const totalCashOut = transactions.reduce((acc, t) => {
    if (t.type === 'Tarik Prive' || t.type === 'Pengeluaran' || t.type === 'Pembelian Stok') {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const cashBalance = Math.max(0, totalCashIn - totalCashOut);

  // Balance match indicator
  const isBalanced = Math.abs(stats.totalAssets - (stats.totalLiabilities + stats.totalEquity)) < 1;

  // Recent transactions (last 3)
  const recentTransactions = [...transactions].slice(-3).reverse();

  return (
    <div className="space-y-8" id="fin-dashboard">
      
      {/* Dynamic Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-auto" id="dashboard-bento-grid">
        
        {/* Box 1: Welcome & Active Log Status (Col span 2, Dark theme) */}
        <div className="md:col-span-2 bg-slate-950 border border-slate-900 text-white rounded-[32px] p-8 shadow-xl flex flex-col justify-between relative overflow-hidden" id="bento-welcome">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-slate-800/40 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistem Pembukuan SAK EMKM v1.2
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-3">
              {storeConfig?.storeName || "Selamat datang di asisten digital Anda."}
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Asisten pembukuan digital khusus kategori <strong>{storeConfig?.storeType || "UMKM Dagang"}</strong> di kota <strong>{storeConfig?.storeCity || "Indonesia"}</strong> berdasarkan Standar Akuntansi Indonesia SAK EMKM.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {transactions.length === 0 ? (
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-400 font-medium">Mulai simulasi bisnis dengan profil Anda:</p>
                <button
                  onClick={onLoadDemoData}
                  id="btn-load-demo"
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Simulasikan Data Demo
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300 font-medium font-display">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Database: <span className="text-emerald-400 font-bold ml-0.5">Local Storage</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs text-indigo-200 font-medium">
                  🚀 <span className="font-bold text-white">{transactions.length} Transaksi</span> tercatat
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Laba Bersih Premium (Col span 2, Emerald Theme) */}
        <div className="md:col-span-2 bg-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-700/10 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300" id="bento-netprofit">
          {/* Subtle glow orb */}
          <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-emerald-500/30 text-emerald-50 border border-emerald-400/20 px-3 py-1 rounded-full">
              Laba Bersih Toko (Estimasi)
            </span>
            <div className="p-2.5 bg-emerald-500/20 text-white rounded-2xl border border-emerald-400/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-emerald-100 font-semibold tracking-wider block mb-1">EBITDA & NET PROFIT RUNNING</span>
            <h3 className="text-4xl md:text-5xl font-bold font-display tracking-tight leading-none mb-4 drop-shadow-sm font-mono">
              {formatIDR(stats.netProfit)}
            </h3>
            <p className="text-xs text-emerald-100/85 leading-relaxed max-w-sm">
              Nominal total laba setelah dikurangi seluruh pengeluaran operasional dan harga pokok penjualan (HPP). Net Profit Margin: <span className="font-bold text-white">{stats.revenue > 0 ? Math.round((stats.netProfit / stats.revenue) * 100) : 0}%</span>.
            </p>
          </div>
        </div>

        {/* Box 3: Revenue (Col span 1) */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-7 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-200 transition duration-200" id="bento-revenue">
          <div className="flex items-center justify-between pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue (4001)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-10">
            <span className="text-[10px] text-slate-400 font-medium block">Total Omzet Penjualan</span>
            <h4 className="text-2xl font-bold text-slate-900 font-mono tracking-tight my-1">{formatIDR(stats.revenue)}</h4>
            <p className="text-[11px] text-slate-400 leading-tight">Seluruh pendapatan bruto penjualan operasional.</p>
          </div>
        </div>

        {/* Box 4: HPP Cost (Col span 1) */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-7 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-200 transition duration-200" id="bento-hpp">
          <div className="flex items-center justify-between pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">COGS / HPP (5001)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-10">
            <span className="text-[10px] text-slate-400 font-medium block">Harga Pokok Penjualan</span>
            <h4 className="text-2xl font-bold text-slate-900 font-mono tracking-tight my-1">{formatIDR(stats.hpp)}</h4>
            <p className="text-[11px] text-slate-400 leading-tight">Biaya modal pokok atas barang dagang yang terjual.</p>
          </div>
        </div>

        {/* Box 5: Expenses (Col span 1) */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-7 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-rose-200 transition duration-200" id="bento-expenses">
          <div className="flex items-center justify-between pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beban Operasional</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-10">
            <span className="text-[10px] text-slate-400 font-medium block">Biaya Adm & Penunjang</span>
            <h4 className="text-2xl font-bold text-slate-900 font-mono tracking-tight my-1">{formatIDR(stats.expenses)}</h4>
            <p className="text-[11px] text-slate-400 leading-tight">Pengeluaran sewa, gaji pramusaji, utilitas, listrik dll.</p>
          </div>
        </div>

        {/* Box 6: Tax Estimated (Col span 1) */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-7 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 transition duration-200" id="bento-tax">
          <div className="flex items-center justify-between pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pajak UMKM 0.5%</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-10">
            <span className="text-[10px] text-slate-400 font-medium block">Estimasi PPh Final PP 23</span>
            <h4 className="text-2xl font-bold text-indigo-600 font-mono tracking-tight my-1">{formatIDR(stats.pph)}</h4>
            <p className="text-[11px] text-slate-400 leading-tight">Dihitung otomatis atas total penerimaan bruto omzet.</p>
          </div>
        </div>

        {/* Box 7: Posisi Kas & Likuiditas (Col span 2) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between" id="bento-liquidity">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Alokasi & Posisi Aktiva</h3>
              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Rasio Buku SAK EMKM</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Kas di Tangan & Bank (1001)</span>
                <span className="text-xl font-bold text-slate-800 font-mono">{formatIDR(cashBalance)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
                <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold tracking-wider">Nilai Persediaan Stok (1003)</span>
                <span className="text-xl font-bold text-slate-800 font-mono">{formatIDR(activeStockValue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6 mt-6 border-t border-slate-50">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Struktur Aktiva (Aset Lancar)</span>
                <span>{stats.totalAssets > 0 ? Math.round(((cashBalance + activeStockValue) / stats.totalAssets) * 100) : 0}% Lancar</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.totalAssets > 0 ? Math.round(((cashBalance + activeStockValue) / stats.totalAssets) * 100) : 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Rasio Laba Bersih terhadap Omzet (Net Margin)</span>
                <span>{stats.revenue > 0 ? Math.round((stats.netProfit / stats.revenue) * 100) : 0}% Margin</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.revenue > 0 ? Math.min(100, Math.max(0, Math.round((stats.netProfit / stats.revenue) * 100))) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Box 8: Neraca Balance Verification (Col span 2) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between" id="bento-balance">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">Persamaan Neraca Akuntansi</h3>
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {isBalanced ? '✓ DOUBLE-ENTRY BENAR' : '🗙 TAMPILKAN ENTRI'}
              </span>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center text-sm text-slate-600 border-b border-slate-100 pb-2.5">
                <span className="font-semibold">Total Aktiva (Aset)</span>
                <span className="font-bold font-mono text-slate-800">{formatIDR(stats.totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-600 border-b border-slate-100 pb-2.5">
                <span className="font-semibold">Total Pasiva (Liabilitas + Ekuitas)</span>
                <span className="font-bold font-mono text-slate-800">{formatIDR(stats.totalLiabilities + stats.totalEquity)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {isBalanced ? (
              <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-850 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Neraca Seimbang (Balanced)</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Sistem otomatis double-entry memverifikasi debit dan kredit 100% klop secara matematis. Anda siap mengekspor laporan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-100 text-amber-900 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-display">Aset & Pasiva Tidak Seimbang</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Kredit/debit belum pas. Coba check lagi entri log transaksi baru Anda, atau reset dengan muat data kelontong demo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Box 9: Recent Logs Ledger Block (Col span 2, Slate Dark) */}
        <div className="md:col-span-2 bg-slate-950 border border-slate-900 text-white rounded-[32px] p-8 shadow-xl flex flex-col justify-between" id="bento-recent">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-200">Aktivitas Transaksi Terakhir</h3>
              <span className="text-[10px] font-extrabold text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-full">REALTIME LOG</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Belum ada transaksi terekam di buku harian.
              </div>
            ) : (
              <div className="space-y-3.5 mt-4">
                {recentTransactions.map((t, i) => (
                  <div key={t.id || i} className="flex justify-between items-center py-2.5 border-b border-slate-900 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        t.type === 'Penerimaan' || t.type === 'Penjualan Stok' || t.type === 'Setor Modal'
                          ? 'bg-emerald-400'
                          : 'bg-rose-500'
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{t.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.date} · {t.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono ${
                      t.type === 'Penerimaan' || t.type === 'Penjualan Stok' || t.type === 'Setor Modal'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}>
                      {t.type === 'Penerimaan' || t.type === 'Penjualan Stok' || t.type === 'Setor Modal' ? '+' : '-'} {formatIDR(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-930">
            <button
              onClick={() => onNavigateToTab("transaksi")}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition shrink-0 cursor-pointer"
            >
              Kelola Buku Jurnal Umum & Transaksi 
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Box 10: AI Consultant Premium Hub (Col span 2, Deep Blue/Purple Gradient) */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-indigo-950" id="bento-ai">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-6 pointer-events-none">
            <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-extrabold tracking-widest px-3.5 py-1.5 rounded-full uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Layanan Penasihat AI Aktif
            </span>
            <h3 className="text-2xl font-bold font-display tracking-tight leading-snug">
              Analisis performa & perpajakan usaha bersama asisten AI.
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm">
              Dapatkan rekomendasi efisiensi HPP stok, kepatuhan SPT pajak, serta proyeksi likuiditas kas toko kelontong Anda secara otomatis.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab("asisten")}
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs py-3 px-5 rounded-2xl transition duration-250 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/10 mt-4"
          >
            Konsultasikan Kesehatan Toko Sekarang
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          </button>
        </div>

      </div>

      {/* 3 Interactive SAK EMKM Analytical Charts */}
      <DashboardCharts transactions={transactions} stockItems={stockItems} stats={stats} />

      {/* Tax disclaimer banner in a gorgeous slate block with rounded borders */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-[24px] p-6 flex flex-col sm:flex-row items-start gap-4" id="tax-banner">
        <div className="p-3 bg-amber-100/50 text-amber-700 rounded-2xl shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">Ketentuan Resmi Peredaran Bruto UMKM Orang Pribadi (Indonesia)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sesuai regulasi UU HPP terbaru, peredaran bruto (omzet) setahun khusus Wajib Pajak Orang Pribadi pelaku UMKM dibebaskan dari pengenaan pajak PPh Final 0,5% sampai dengan akumulasi batasan omzet Rp 500 Juta setahun. Akuntan AI mendeteksi dan menghitung potensi kewajiban pajak Anda secara akurat pada menu <strong className="text-indigo-600">Perpajakan</strong>.
          </p>
        </div>
      </div>

    </div>
  );
};

