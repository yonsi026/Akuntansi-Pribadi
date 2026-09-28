import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Boxes, 
  FileSpreadsheet, 
  Percent, 
  BrainCircuit, 
  Settings, 
  BookText, 
  Search, 
  X, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Wallet, 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  PanelLeftClose, 
  PanelLeft, 
  LogOut,
  Building2,
  Package,
  Receipt,
  HelpCircle,
  Command
} from "lucide-react";
import { StoreConfig, UserAccount } from "../types";

export interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "utama" | "operasional" | "laporan" | "sistem";
  badge?: string | number;
  badgeColor?: string;
  description: string;
  keywords: string[];
  subItems?: {
    id: string;
    label: string;
    description: string;
    keywords: string[];
    actionTab: string;
    subFilter?: string;
  }[];
}

interface SidebarNavProps {
  activeTab: string;
  activeSubFilter?: string;
  onSelectTab: (tabId: string, subFilter?: string) => void;
  storeConfig: StoreConfig;
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenLanding: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  transactionCount: number;
  stockCount: number;
  lowStockCount: number;
  isBalanced: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenActivationModal?: () => void;
  isActivated?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Ringkasan Toko",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
    category: "utama",
    description: "Executive summary, KPI arus kas, neraca, dan grafik keuangan",
    keywords: ["dashboard", "ringkasan", "beranda", "kpi", "omzet", "laba", "grafik", "arus kas", "saldo"],
    subItems: [
      { id: "db-kpi", label: "KPI Kas & Omzet", description: "Performa likuiditas dan laba bersih", keywords: ["kas", "omzet", "laba", "margin"], actionTab: "dashboard", subFilter: "kpi" },
      { id: "db-charts", label: "Grafik Tren Finansial", description: "Tren penjualan 7 hari & beban operasional", keywords: ["grafik", "tren", "analisis"], actionTab: "dashboard", subFilter: "charts" },
      { id: "db-balance", label: "Verifikasi Neraca SAK EMKM", description: "Status klop double-entry aktiva pasiva", keywords: ["neraca", "seimbang", "double entry"], actionTab: "dashboard", subFilter: "balance" }
    ]
  },
  {
    id: "transaksi",
    label: "Jurnal & Transaksi",
    shortLabel: "Transaksi",
    icon: BookOpen,
    category: "operasional",
    description: "Pencatatan kas, penjualan nota, pembelian, beban, dan mutasi",
    keywords: ["transaksi", "jurnal", "kas", "penjualan", "pembelian", "biaya", "pengeluaran", "prive", "modal", "beban", "gaji", "listrik", "sewa"],
    subItems: [
      { id: "tx-catat", label: "+ Catat Transaksi Baru", description: "Input transaksi debit & kredit otomatis", keywords: ["catat", "baru", "tambah", "input"], actionTab: "transaksi", subFilter: "input" },
      { id: "tx-tagihan", label: "Tagihan & Faktur (Invoices)", description: "Faktur penjualan, detil tagihan INV, ekspedisi & pembayaran", keywords: ["tagihan", "invoice", "faktur", "kledo", "penjualan", "inv", "resi", "piutang"], actionTab: "transaksi", subFilter: "invoice" },
      { id: "tx-jurnal", label: "Buku Jurnal Umum", description: "Daftar entri jurnal double-entry SAK EMKM", keywords: ["jurnal umum", "buku jurnal", "debit", "kredit"], actionTab: "transaksi", subFilter: "jurnal" },
      { id: "tx-mutasi", label: "Buku Kas & Mutasi", description: "Riwayat arus kas masuk dan kas keluar", keywords: ["kas", "mutasi", "rekening", "bank"], actionTab: "transaksi", subFilter: "mutasi" },
      { id: "tx-bukubesar", label: "Buku Besar per Akun", description: "Rincian mutasi akun SAK EMKM", keywords: ["buku besar", "ledger", "kartu akun"], actionTab: "transaksi", subFilter: "bukubesar" }
    ]
  },
  {
    id: "stok",
    label: "Stok Barang (HPP)",
    shortLabel: "Stok",
    icon: Boxes,
    category: "operasional",
    description: "Manajemen katalog barang, stok persediaan, dan harga pokok penjualan",
    keywords: ["stok", "barang", "produk", "hpp", "persediaan", "inventori", "gudang", "sku", "harga jual", "harga beli", "fifo", "moving average"],
    subItems: [
      { id: "stk-katalog", label: "Katalog & Saldo Stok", description: "Daftar produk, SKU, dan kuantitas tersedia", keywords: ["katalog", "daftar", "barang", "sku"], actionTab: "stok", subFilter: "katalog" },
      { id: "stk-tambah", label: "+ Tambah Produk Baru", description: "Daftarkan item barang dagang baru", keywords: ["tambah", "baru", "produk"], actionTab: "stok", subFilter: "tambah" },
      { id: "stk-hpp", label: "Rekalkulasi HPP Rata-Rata", description: "Perhitungan otomatis biaya modal pokok terjual", keywords: ["hpp", "moving average", "harga pokok"], actionTab: "stok", subFilter: "hpp" }
    ]
  },
  {
    id: "laporan",
    label: "Laporan Keuangan",
    shortLabel: "Laporan",
    icon: FileSpreadsheet,
    category: "laporan",
    badge: "SAK EMKM",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Laba Rugi, Neraca, Arus Kas, Neraca Saldo, dan Ekspor Excel",
    keywords: ["laporan", "keuangan", "laba rugi", "neraca", "arus kas", "buku besar", "excel", "download", "unduh", "sak emkm", "export"],
    subItems: [
      { id: "lap-laba-rugi", label: "Laporan Laba Rugi", description: "Pendapatan, HPP, beban operasional, dan laba bersih", keywords: ["laba rugi", "income statement", "profit"], actionTab: "laporan", subFilter: "labarugi" },
      { id: "lap-neraca", label: "Laporan Posisi Keuangan (Neraca)", description: "Aktiva lancar, aset tetap, liabilitas, dan ekuitas", keywords: ["neraca", "balance sheet", "posisi keuangan", "aktiva", "pasiva"], actionTab: "laporan", subFilter: "neraca" },
      { id: "lap-arus-kas", label: "Laporan Arus Kas", description: "Arus kas aktivitas operasional, investasi, pendanaan", keywords: ["arus kas", "cash flow"], actionTab: "laporan", subFilter: "aruskas" },
      { id: "lap-neraca-saldo", label: "Neraca Saldo (Trial Balance)", description: "Keseimbangan saldo debit dan kredit seluruh akun", keywords: ["neraca saldo", "trial balance"], actionTab: "laporan", subFilter: "neracasaldo" },
      { id: "lap-ekspor", label: "Unduh File Excel (.xlsx)", description: "Ekspor seluruh laporan lengkap dalam satu workbook", keywords: ["excel", "unduh", "download", "xlsx", "ekspor"], actionTab: "laporan", subFilter: "ekspor" }
    ]
  },
  {
    id: "pajak",
    label: "Perpajakan UMKM",
    shortLabel: "Pajak",
    icon: Percent,
    category: "laporan",
    badge: "0.5%",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    description: "Kalkulator PPh Final PP 23, simulasi batasan Rp 500 Juta, dan PPN",
    keywords: ["pajak", "pph", "pph final", "pp 23", "pp 55", "omzet 500 juta", "pajak umkm", "spt tahunan", "ppn 11%"],
    subItems: [
      { id: "pjk-pph", label: "PPh Final 0.5% (PP 23)", description: "Perhitungan pajak penghasilan UMKM otomatis", keywords: ["pph 23", "pph final", "0.5%"], actionTab: "pajak", subFilter: "pph" },
      { id: "pjk-ppn", label: "Kalkulator PPN 11%", description: "Pajak pertambahan nilai faktur penjualan", keywords: ["ppn", "faktur pajak", "11%"], actionTab: "pajak", subFilter: "ppn" }
    ]
  },
  {
    id: "dokumen",
    label: "Bagan Akun (COA)",
    shortLabel: "Bagan Akun",
    icon: BookText,
    category: "laporan",
    description: "Daftar kode akun standar akuntansi Indonesia SAK EMKM",
    keywords: ["dokumen", "bagan akun", "coa", "chart of accounts", "kode akun", "1001", "2001", "3001", "4001", "5001", "6001"],
    subItems: [
      { id: "coa-daftar", label: "Daftar Kode Akun", description: "Bagan akun Aset, Liabilitas, Ekuitas, Pendapatan, Beban", keywords: ["kode akun", "daftar coa", "aset", "beban"], actionTab: "dokumen", subFilter: "coa" },
      { id: "coa-sak", label: "Pedoman SAK EMKM", description: "Standar akuntansi keuangan entitas mikro kecil menengah", keywords: ["pedoman", "sak emkm", "ikatan akuntan indonesia"], actionTab: "dokumen", subFilter: "pedoman" }
    ]
  },
  {
    id: "asisten",
    label: "Tanya Akuntan AI ✨",
    shortLabel: "Asisten AI",
    icon: BrainCircuit,
    category: "sistem",
    badge: "AI",
    badgeColor: "bg-violet-500/15 text-violet-700 border-violet-500/30",
    description: "Konsultasi pembukuan cerdas bertenaga AI untuk analisis usaha",
    keywords: ["ai", "asisten", "tanya akuntan", "konsultasi", "analisis", "gemini", "rekomendasi", "audit", "diagnosa"],
    subItems: [
      { id: "ai-analisis", label: "Audit & Diagnosa Kesehatan", description: "Evaluasi rasio margin, likuiditas, dan beban", keywords: ["audit", "kesehatan bisnis", "rasio"], actionTab: "asisten", subFilter: "audit" },
      { id: "ai-chat", label: "Konsultasi Interaktif", description: "Tanyakan solusi pembukuan dan aturan pajak", keywords: ["chat", "tanya", "konsultasi"], actionTab: "asisten", subFilter: "chat" }
    ]
  },
  {
    id: "pengaturan",
    label: "Profil & Cloud Sync",
    shortLabel: "Pengaturan",
    icon: Settings,
    category: "sistem",
    description: "Konfigurasi toko, alamat, NPWP, cadangkan & impor data JSON",
    keywords: ["pengaturan", "profil", "toko", "cloud sync", "backup", "restore", "reset", "npwp", "alamat", "simulasi"],
    subItems: [
      { id: "cfg-toko", label: "Informasi & Profil Usaha", description: "Nama toko, bidang usaha, alamat, dan kota", keywords: ["profil", "nama toko", "kota", "npwp"], actionTab: "pengaturan", subFilter: "profil" },
      { id: "cfg-sync", label: "Backup & Cadangkan Data", description: "Ekspor dan impor database lokal JSON", keywords: ["backup", "sync", "restore", "cadangan"], actionTab: "pengaturan", subFilter: "sync" },
      { id: "cfg-lisensi", label: "Kunci Lisensi Hardware", description: "Status aktivasi mesin hardware & anti-pembajakan", keywords: ["lisensi", "serial", "aktivasi", "mesin", "hardware", "anti pembajakan", "kode aktivasi"], actionTab: "pengaturan", subFilter: "lisensi" }
    ]
  }
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  activeSubFilter,
  onSelectTab,
  storeConfig,
  currentUser,
  onLogout,
  onOpenLanding,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  transactionCount,
  stockCount,
  lowStockCount,
  isBalanced,
  searchQuery,
  onSearchChange,
  onOpenActivationModal,
  isActivated = false
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    dashboard: true,
    transaksi: true,
    stok: true,
    laporan: true,
    pajak: true,
    dokumen: true,
    asisten: true,
    pengaturan: true
  });

  // Keyboard shortcut listener: Ctrl+K or / or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && searchQuery) {
        onSearchChange("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, onSearchChange]);

  const toggleSubMenu = (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  // Filter items based on searchQuery
  const trimmedSearch = searchQuery.trim().toLowerCase();
  
  const searchResults: {
    item: NavItem;
    matchedSubItems: NonNullable<NavItem["subItems"]>;
    isItemMatch: boolean;
  }[] = [];

  if (trimmedSearch) {
    NAV_ITEMS.forEach(item => {
      const itemMatch = 
        item.label.toLowerCase().includes(trimmedSearch) ||
        item.description.toLowerCase().includes(trimmedSearch) ||
        item.keywords.some(k => k.toLowerCase().includes(trimmedSearch));

      const matchedSubs = (item.subItems || []).filter(sub => 
        sub.label.toLowerCase().includes(trimmedSearch) ||
        sub.description.toLowerCase().includes(trimmedSearch) ||
        sub.keywords.some(k => k.toLowerCase().includes(trimmedSearch))
      );

      if (itemMatch || matchedSubs.length > 0) {
        searchResults.push({
          item,
          matchedSubItems: matchedSubs,
          isItemMatch: itemMatch
        });
      }
    });
  }

  const handleItemClick = (tabId: string, subFilter?: string) => {
    let resolvedSubFilter = subFilter;
    if (!resolvedSubFilter) {
      if (tabId === "transaksi") resolvedSubFilter = "input";
      else if (tabId === "stok") resolvedSubFilter = "katalog";
      else if (tabId === "laporan") resolvedSubFilter = "labarugi";
      else if (tabId === "pajak") resolvedSubFilter = "pph";
      else if (tabId === "dokumen") resolvedSubFilter = "coa";
      else if (tabId === "asisten") resolvedSubFilter = "audit";
      else if (tabId === "pengaturan") resolvedSubFilter = "profil";
      else if (tabId === "dashboard") resolvedSubFilter = "kpi";
    }
    setExpandedMenus(prev => ({ ...prev, [tabId]: true }));
    onSelectTab(tabId, resolvedSubFilter);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 shadow-2xl lg:shadow-none select-none ${
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-68"}`}
        id="app-sidebar-nav"
      >
        {/* 1. BRAND & STORE IDENTITY HEADER */}
        <div className="p-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => handleItemClick("dashboard")}
              className="flex items-center gap-3 cursor-pointer group min-w-0"
              title="Kembali ke Dashboard Utama"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-600/20 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                </div>
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-white tracking-tight truncate leading-tight font-display">
                      {storeConfig.storeName || "Akuntan AI"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {storeConfig.storeType} · {storeConfig.storeCity}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse toggle (Desktop) or Close button (Mobile) */}
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isCollapsed ? "Buka Sidebar (Expand)" : "Persempit Sidebar (Collapse)"}
              >
                {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>

              <button
                onClick={onCloseMobile}
                className="flex lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. PROMINENT NAVBAR SEARCH BOX (Ditandai Kotak Hitam oleh Pengguna) */}
        <div className="px-3 pt-3.5 pb-2 shrink-0">
          <div className="relative" id="navbar-search-container">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isCollapsed ? "Cari..." : "Cari menu, fitur, laporan..."}
              className={`w-full bg-slate-950/80 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2.5 border border-slate-700/80 focus:border-indigo-500 focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-sans outline-none ${
                isCollapsed ? "text-[11px]" : ""
              }`}
              title="Pencarian Navbar Cepat (Tekan Ctrl+K atau /)"
            />

            {searchQuery ? (
              <button
                onClick={() => {
                  onSearchChange("");
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              !isCollapsed && (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800 border border-slate-700/70 px-1.5 py-0.5 rounded-md">
                    ⌘K
                  </span>
                </div>
              )
            )}
          </div>

          {/* Quick search badge indicator when searching */}
          {searchQuery && !isCollapsed && (
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
              <span>Hasil pencarian:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {searchResults.reduce((acc, curr) => acc + (curr.isItemMatch ? 1 : 0) + curr.matchedSubItems.length, 0)} menu
              </span>
            </div>
          )}
        </div>

        {/* 3. SCROLLABLE NAVIGATION LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          
          {/* A. SEARCH MODE (When user types in navbar search) */}
          {searchQuery ? (
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center px-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Search className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Tidak ada menu yang cocok</p>
                  <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci lain seperti: "laporan", "stok", "penjualan", "pajak", "excel", "coa"</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {["Laporan", "Penjualan", "Stok", "Pajak", "Excel"].map(k => (
                      <button
                        key={k}
                        onClick={() => onSearchChange(k)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700 transition cursor-pointer"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                searchResults.map(({ item, matchedSubItems, isItemMatch }) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <div key={item.id} className="bg-slate-950/40 rounded-xl p-1.5 border border-slate-800/80">
                      {/* Top item button */}
                      <button
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                          isActive 
                            ? "bg-indigo-600 text-white font-bold shadow-sm" 
                            : "hover:bg-slate-800/80 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-indigo-400"}`} />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold block truncate">{item.label}</span>
                            {!isCollapsed && (
                              <span className={`text-[10px] block truncate ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      </button>

                      {/* Matched Sub-items */}
                      {matchedSubItems.length > 0 && !isCollapsed && (
                        <div className="mt-1 pl-6 pr-1 space-y-1 border-t border-slate-800/60 pt-1.5">
                          {matchedSubItems.map(sub => {
                            const isSubActive = activeTab === sub.actionTab && activeSubFilter === sub.subFilter;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => handleItemClick(sub.actionTab, sub.subFilter)}
                                className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg text-[11px] transition cursor-pointer group ${
                                  isSubActive
                                    ? "bg-indigo-600 text-white font-bold border-l-2 border-emerald-400 pl-2 shadow-sm"
                                    : "text-slate-300 hover:text-white hover:bg-indigo-950/40"
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className={`font-semibold block truncate ${isSubActive ? "text-white" : "text-emerald-400 group-hover:text-emerald-300"}`}>
                                    {sub.label}
                                  </span>
                                  <span className={`text-[10px] block truncate ${isSubActive ? "text-indigo-100" : "text-slate-400"}`}>
                                    {sub.description}
                                  </span>
                                </div>
                                <ChevronRight className={`w-3 h-3 shrink-0 ${isSubActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* B. DEFAULT GROUPED NAVIGATION (Standard Kledo-like Layout) */
            <div className="space-y-4">
              
              {/* HELPER FUNCTION FOR RENDERING ANY MENU ITEM & ITS SUBMENUS */}
              {([
                { category: "utama", title: "Utama" },
                { category: "operasional", title: "Transaksi & Persediaan" },
                { category: "laporan", title: "Laporan & Kepatuhan" },
                { category: "sistem", title: "Sistem & AI" }
              ] as const).map(section => {
                const sectionItems = NAV_ITEMS.filter(item => item.category === section.category);
                if (sectionItems.length === 0) return null;

                return (
                  <div key={section.category}>
                    {!isCollapsed && (
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-1">
                      {sectionItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isExpanded = expandedMenus[item.id] !== false;
                        const isAi = item.id === "asisten";
                        const countBadge = item.id === "transaksi" ? transactionCount : (item.id === "stok" ? stockCount : undefined);

                        return (
                          <div key={item.id} className="space-y-0.5">
                            {/* Main Item Header Button */}
                            <div
                              onClick={() => handleItemClick(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition duration-150 cursor-pointer group relative ${
                                isActive 
                                  ? isAi
                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-600/30"
                                    : "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30" 
                                  : isAi
                                    ? "text-violet-300 hover:bg-violet-950/40 hover:text-violet-100"
                                    : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                              }`}
                              title={isCollapsed ? item.label : undefined}
                            >
                              <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                                isActive 
                                  ? "text-white" 
                                  : isAi 
                                    ? "text-violet-400 group-hover:scale-110" 
                                    : "text-indigo-400 group-hover:scale-110"
                              }`} />
                              
                              {!isCollapsed && (
                                <div className="min-w-0 flex-1 flex items-center justify-between">
                                  <span className="text-xs truncate">{item.label}</span>
                                  <div className="flex items-center gap-1.5">
                                    {countBadge !== undefined && (
                                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                                        isActive ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-300"
                                      }`}>
                                        {countBadge}
                                      </span>
                                    )}
                                    {item.id === "stok" && lowStockCount > 0 && (
                                      <span className="w-2 h-2 rounded-full bg-amber-400" title={`${lowStockCount} barang stok menipis`} />
                                    )}
                                    {item.badge && (
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold border ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                                        {item.badge}
                                      </span>
                                    )}
                                    {item.subItems && item.subItems.length > 0 && (
                                      <button
                                        onClick={(e) => toggleSubMenu(item.id, e)}
                                        className="p-0.5 text-slate-400 hover:text-white transition"
                                        title={isExpanded ? "Tutup Submenu" : "Buka Submenu"}
                                      >
                                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {isActive && !isCollapsed && (
                                <span className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-l" />
                              )}
                            </div>

                            {/* Submenu Item Buttons */}
                            {!isCollapsed && isExpanded && item.subItems && item.subItems.length > 0 && (
                              <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-800/80 ml-4 my-1">
                                {item.subItems.map(sub => {
                                  const isSubActive = activeTab === sub.actionTab && (
                                    activeSubFilter === sub.subFilter ||
                                    (!activeSubFilter && (
                                      (sub.subFilter === "input" && sub.actionTab === "transaksi") ||
                                      (sub.subFilter === "katalog" && sub.actionTab === "stok") ||
                                      (sub.subFilter === "labarugi" && sub.actionTab === "laporan") ||
                                      (sub.subFilter === "pph" && sub.actionTab === "pajak") ||
                                      (sub.subFilter === "coa" && sub.actionTab === "dokumen") ||
                                      (sub.subFilter === "audit" && sub.actionTab === "asisten") ||
                                      (sub.subFilter === "profil" && sub.actionTab === "pengaturan")
                                    ))
                                  );

                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemClick(sub.actionTab, sub.subFilter);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] transition cursor-pointer group ${
                                        isSubActive
                                          ? "bg-indigo-600/35 text-white font-bold border-l-2 border-emerald-400 pl-2 shadow-2xs"
                                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                      }`}
                                      title={sub.description}
                                    >
                                      <span className="truncate group-hover:translate-x-0.5 transition-transform flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? "bg-emerald-400 ring-2 ring-emerald-400/30" : "bg-slate-600 group-hover:bg-slate-400"}`} />
                                        <span className="truncate">{sub.label}</span>
                                      </span>
                                      {isSubActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* 4. FOOTER STATUS & USER PROFILE */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0 space-y-2.5">
          {/* SAK EMKM & Database Badge */}
          {!isCollapsed && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isBalanced ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className="text-slate-300 font-medium">SAK EMKM Double-Entry</span>
              </div>
              <span className={`font-bold font-mono text-[9px] px-1.5 py-0.5 rounded ${
                isBalanced ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {isBalanced ? "Klop" : "Cek"}
              </span>
            </div>
          )}

          {/* Hardware Machine License Status Badge */}
          {!isCollapsed && onOpenActivationModal && (
            <button
              type="button"
              onClick={onOpenActivationModal}
              className={`w-full border rounded-xl p-2 flex items-center justify-between text-[10px] transition cursor-pointer text-left ${
                isActivated 
                  ? "bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-900/50 text-emerald-300" 
                  : "bg-rose-950/40 border-rose-800/60 hover:bg-rose-900/50 text-rose-300"
              }`}
              title="Klik untuk membuka Status Lisensi & ID Mesin Hardware"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="font-semibold truncate">{isActivated ? "Lisensi: Teraktivasi" : "Belum Aktivasi"}</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono bg-black/40">
                {isActivated ? "KLOP" : "KUNCI"}
              </span>
            </button>
          )}

          {/* User Account / Profile Info */}
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => handleItemClick("pengaturan")}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
              title="Buka Pengaturan Profil Toko"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-900/70 border border-indigo-700/50 text-indigo-200 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition">
                      {currentUser?.name || "Budi Santoso"}
                    </p>
                    {currentUser?.isDemo && (
                      <span className="text-[8px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentUser?.role === "owner" ? "Pemilik Usaha" : "Akuntan"}
                  </p>
                </div>
              )}
            </div>

            {/* Logout button */}
            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
};
