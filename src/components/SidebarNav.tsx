import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home,
  Tag,
  ShoppingBag,
  Receipt,
  Package,
  Boxes,
  BarChart2,
  CreditCard,
  BookOpen,
  Building2,
  Users,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  PanelLeftOpen,
  LayoutDashboard,
  FileText,
  Truck,
  ShoppingCart,
  FileSpreadsheet,
  PackageCheck,
  Percent,
  Sparkles,
  Settings,
  AlertTriangle,
  FolderTree,
  Warehouse,
  Wallet,
  Camera,
  CornerDownRight,
  Plus,
  Store,
  Factory
} from "lucide-react";
import { StoreConfig, UserAccount } from "../types";

export interface NavSubItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  actionTab: string;
  subFilter?: string;
  isNestedChild?: boolean;
  badgeText?: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  actionTab?: string;
  subFilter?: string;
  subItems?: NavSubItem[];
  badgeText?: string;
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
  onUpdateLogo?: (newLogo: string) => void;
}

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
  onOpenActivationModal,
  onUpdateLogo
}) => {
  // Accordion open/close state matching Kledo UI
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    penjualan: false,
    pembelian: false,
    produk: false,
    laporan: false
  });

  const [localSearch, setLocalSearch] = useState("");
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran berkas logo maksimal 3 MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUpdateLogo) {
        onUpdateLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Automatically expand accordion if child item is currently active
  useEffect(() => {
    if (activeTab === "penjualan" || activeTab === "tagihan" || (activeTab === "transaksi" && activeSubFilter === "invoice")) {
      setOpenMenus(prev => ({ ...prev, penjualan: true }));
    } else if (activeTab === "pembelian") {
      setOpenMenus(prev => ({ ...prev, pembelian: true }));
    } else if (activeTab === "stok" || activeTab === "produk") {
      setOpenMenus(prev => ({ ...prev, produk: true }));
    } else if (activeTab === "laporan") {
      setOpenMenus(prev => ({ ...prev, laporan: true }));
    }
  }, [activeTab, activeSubFilter]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  // Kledo Menu Items definition: Kas & Bank in original position, Kasir (POS) directly below Kas & Bank
  const menuList: NavMenuItem[] = [
    {
      id: "beranda",
      label: "Beranda",
      icon: Home,
      actionTab: "dashboard"
    },
    {
      id: "penjualan",
      label: "Penjualan",
      icon: Tag,
      subItems: [
        { id: "pj-overview", label: "Overview", icon: LayoutDashboard, actionTab: "penjualan", subFilter: "overview" },
        { id: "pj-tagihan", label: "Tagihan", icon: FileText, actionTab: "penjualan", subFilter: "tagihan" },
        { id: "pj-tambah-tagihan", label: "Tambah Tagihan", icon: Plus, actionTab: "penjualan", subFilter: "tambah-tagihan", badgeText: "Form" },
        { id: "pj-pengiriman", label: "Pengiriman", icon: Truck, actionTab: "penjualan", subFilter: "pengiriman" },
        { id: "pj-pemesanan", label: "Pemesanan", icon: ShoppingCart, actionTab: "penjualan", subFilter: "pemesanan" },
        { id: "pj-penawaran", label: "Penawaran", icon: FileSpreadsheet, actionTab: "penjualan", subFilter: "penawaran" }
      ]
    },
    {
      id: "pembelian",
      label: "Pembelian",
      icon: ShoppingBag,
      subItems: [
        { id: "pb-overview", label: "Overview", icon: LayoutDashboard, actionTab: "pembelian", subFilter: "overview" },
        { id: "pb-tagihan", label: "Tagihan Pembelian", icon: FileText, actionTab: "pembelian", subFilter: "tagihan" },
        { id: "pb-piutang", label: "Piutang", icon: Receipt, actionTab: "pembelian", subFilter: "piutang", isNestedChild: true, badgeText: "Sub" },
        { id: "pb-pengiriman", label: "Pengiriman Pembelian", icon: PackageCheck, actionTab: "pembelian", subFilter: "pengiriman" },
        { id: "pb-pesanan", label: "Pesanan Pembelian", icon: ShoppingCart, actionTab: "pembelian", subFilter: "pesanan" },
        { id: "pb-penawaran", label: "Penawaran Pembelian", icon: FileSpreadsheet, actionTab: "pembelian", subFilter: "penawaran" }
      ]
    },
    {
      id: "biaya",
      label: "Biaya",
      icon: Receipt,
      actionTab: "transaksi",
      subFilter: "input"
    },
    {
      id: "produk",
      label: "Produk",
      icon: Package,
      subItems: [
        { id: "pr-produk", label: "Produk", icon: Package, actionTab: "stok", subFilter: "katalog" }
      ]
    },
    {
      id: "inventori",
      label: "Inventori",
      icon: Warehouse,
      actionTab: "stok",
      subFilter: "hpp"
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: BarChart2,
      subItems: [
        { id: "lp-labarugi", label: "Laporan Laba Rugi", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "labarugi" },
        { id: "lp-neraca", label: "Laporan Posisi Keuangan", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "neraca" },
        { id: "lp-aruskas", label: "Laporan Arus Kas", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "aruskas" },
        { id: "lp-neracasaldo", label: "Neraca Saldo (Trial Balance)", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "neracasaldo" },
        { id: "lp-pemesanan", label: "Pemesanan per Produk", icon: ShoppingCart, actionTab: "laporan", subFilter: "pemesanan" },
        { id: "lp-pergerakan-inventori", label: "Pergerakan Stok Inventori", icon: Boxes, actionTab: "laporan", subFilter: "pergerakan-inventori" },
        { id: "lp-pergerakan-gudang", label: "Pergerakan Stok Gudang", icon: Warehouse, actionTab: "laporan", subFilter: "pergerakan-gudang" },
        { id: "lp-produksi", label: "Laporan Produksi", icon: Factory, actionTab: "laporan", subFilter: "produksi" },
        { id: "lp-piutang", label: "Daftar Piutang Pelanggan", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "piutang" },
        { id: "lp-pengiriman", label: "Pengiriman Penjualan", icon: Truck, actionTab: "laporan", subFilter: "pengiriman" },
        { id: "lp-ongkir", label: "Ongkos Kirim per Ekspedisi", icon: Truck, actionTab: "laporan", subFilter: "ongkir" },
        { id: "lp-jurnal", label: "Buku Jurnal Umum", icon: FileSpreadsheet, actionTab: "transaksi", subFilter: "jurnal" },
        { id: "lp-bukubesar", label: "Buku Besar per Akun", icon: FileSpreadsheet, actionTab: "transaksi", subFilter: "bukubesar" },
        { id: "lp-ekspor", label: "Unduh Excel (.xlsx)", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "ekspor" },
        { id: "lp-import", label: "Import Excel (.xlsx)", icon: FileSpreadsheet, actionTab: "laporan", subFilter: "import" }
      ]
    },
    {
      id: "kasbank",
      label: "Kas & Bank",
      icon: CreditCard,
      actionTab: "transaksi",
      subFilter: "mutasi"
    },
    {
      id: "pos",
      label: "Kasir (POS)",
      icon: Store,
      actionTab: "pos",
      badgeText: "POS"
    },
    {
      id: "akun",
      label: "Akun",
      icon: BookOpen,
      actionTab: "dokumen",
      subFilter: "coa"
    },
    {
      id: "asettetap",
      label: "Aset Tetap",
      icon: Building2,
      actionTab: "dokumen",
      subFilter: "pedoman"
    },
    {
      id: "blueprint",
      label: "Blueprint MD / Word",
      icon: Sparkles,
      actionTab: "dokumen",
      subFilter: "blueprint",
      badgeText: "PROMPT"
    },
    {
      id: "kontak",
      label: "Kontak",
      icon: Users,
      actionTab: "transaksi",
      subFilter: "invoice"
    },
    {
      id: "pajak",
      label: "Perpajakan UMKM",
      icon: Percent,
      actionTab: "pajak",
      subFilter: "pph"
    },
    {
      id: "asisten",
      label: "Tanya Akuntan AI ✨",
      icon: Sparkles,
      actionTab: "asisten",
      subFilter: "audit"
    },
    {
      id: "pengaturan",
      label: "Pengaturan Usaha",
      icon: Settings,
      actionTab: "pengaturan",
      subFilter: "profil"
    }
  ];

  // Helper to determine if a top menu or submenu is active
  const isMenuActive = (item: NavMenuItem) => {
    if (item.actionTab) {
      if (item.id === "beranda") return activeTab === "dashboard";
      if (item.id === "pos") return activeTab === "pos";
      if (item.id === "kasbank") return activeTab === "transaksi" && (activeSubFilter === "mutasi" || activeSubFilter === "bukubesar" || activeSubFilter === "jurnal" || !activeSubFilter);
      if (item.id === "biaya") return activeTab === "transaksi" && activeSubFilter === "input";
      if (item.id === "produk") return activeTab === "stok" && activeSubFilter === "katalog";
      if (item.id === "inventori") return activeTab === "stok" && (activeSubFilter === "hpp" || activeSubFilter === "all");
      if (item.id === "akun") return activeTab === "dokumen" && activeSubFilter === "coa";
      if (item.id === "asettetap") return activeTab === "dokumen" && activeSubFilter === "pedoman";
      if (item.id === "blueprint") return activeTab === "dokumen" && activeSubFilter === "blueprint";
      if (item.id === "kontak") return activeTab === "transaksi" && activeSubFilter === "invoice";
      if (item.id === "pajak") return activeTab === "pajak";
      if (item.id === "asisten") return activeTab === "asisten";
      if (item.id === "pengaturan") return activeTab === "pengaturan";
    }
    if (item.subItems) {
      return item.subItems.some(sub => isSubActive(sub));
    }
    return false;
  };

  const isSubActive = (sub: NavSubItem) => {
    if (sub.id === "pr-produk") {
      return (activeTab === "stok" || activeTab === "produk") && (activeSubFilter === "katalog" || !activeSubFilter);
    }
    if (activeTab === "tagihan" && sub.id === "pj-tagihan") return true;
    if (activeTab !== sub.actionTab) return false;
    if (sub.subFilter) {
      return activeSubFilter === sub.subFilter;
    }
    return true;
  };

  const handleSubClick = (sub: NavSubItem) => {
    onSelectTab(sub.actionTab, sub.subFilter);
    if (isMobileOpen) onCloseMobile();
  };

  const handleTopClick = (item: NavMenuItem) => {
    if (item.subItems) {
      toggleMenu(item.id);
      if (item.id === "produk" && item.subItems[0]) {
        onSelectTab(item.subItems[0].actionTab, item.subItems[0].subFilter);
        if (isMobileOpen) onCloseMobile();
      }
    } else if (item.actionTab) {
      onSelectTab(item.actionTab, item.subFilter);
      if (isMobileOpen) onCloseMobile();
    }
  };

  // Filtered menu for search input
  const filteredList = localSearch.trim()
    ? menuList.filter(item => {
        const matchTop = item.label.toLowerCase().includes(localSearch.toLowerCase());
        const matchSub = item.subItems?.some(s => s.label.toLowerCase().includes(localSearch.toLowerCase()));
        return matchTop || matchSub;
      })
    : menuList;

  const companyName = storeConfig.storeName || "PT. BUMI MANIS BERKAH";
  const userName = currentUser?.name || storeConfig.storeOwner || "yonsi";
  const userInitial = (userName.charAt(0) || "Y").toUpperCase();

  const [isLargeScreen, setIsLargeScreen] = useState(() => 
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const check = () => setIsLargeScreen(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };

  return (
    <>
      {/* Mobile backdrop with Framer Motion fade */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container - Light SaaS Kledo Style with Framer Motion Spring */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 272,
          x: isLargeScreen ? 0 : (isMobileOpen ? 0 : -280)
        }}
        transition={springConfig}
        className="fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200 z-50 flex flex-col select-none shadow-sm overflow-hidden"
      >

        {/* 1. Header: Company Brand + Collapse/Expand Toggle with Motion Transition */}
        <div className="border-b border-slate-100 overflow-hidden shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="py-3 px-2 flex flex-col items-center gap-2.5"
              >
                {/* Logo box */}
                <div 
                  onClick={() => logoFileInputRef.current?.click()}
                  title="Klik untuk mengganti logo perusahaan"
                  className="relative group w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-xs cursor-pointer border border-slate-200"
                >
                  {storeConfig.storeLogo ? (
                    <img 
                      src={storeConfig.storeLogo} 
                      alt={companyName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-black tracking-tight text-xs">
                      kledo
                    </div>
                  )}
                  {/* Hover overlay with Camera icon to change logo */}
                  <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] font-bold">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileLogoChange}
                  />
                </div>

                {/* Icon scroll / expand toggle: Diposisikan rapi DI BAWAH LOGO tanpa tabrakan */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onToggleCollapse}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer shadow-2xs group"
                  title="Buka / Perluas Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="p-3.5 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Logo box with custom company logo & instant upload capability */}
                  <div 
                    onClick={() => logoFileInputRef.current?.click()}
                    title="Klik untuk mengganti logo perusahaan"
                    className="relative group w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow-xs cursor-pointer border border-slate-200"
                  >
                    {storeConfig.storeLogo ? (
                      <img 
                        src={storeConfig.storeLogo} 
                        alt={companyName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-black tracking-tight text-xs">
                        kledo
                      </div>
                    )}
                    {/* Hover overlay with Camera icon to change logo */}
                    <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[8px] font-bold">
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <span className="scale-75">Ubah</span>
                    </div>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileLogoChange}
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[13px] text-slate-800 leading-tight truncate">
                      {companyName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      Elite Free Trial
                    </div>
                  </div>
                </div>

                {/* Collapse/Expand Toggle */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Ciutkan Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Search & Trial Alert Banner */}
        <AnimatePresence mode="wait" initial={false}>
          {!isCollapsed ? (
            <motion.div
              key="expanded-search-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3.5 pt-3 pb-1 overflow-hidden shrink-0"
            >
              {/* Search Input: Icon di sebelah kiri dan tombol hapus di kanan agar tidak bertabrakan */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari menu"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-700 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => setLocalSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded text-xs font-bold transition cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Trial Warning Banner (Exactly matching Kledo screenshot) */}
              <div 
                onClick={onOpenActivationModal}
                className="mt-2.5 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 text-amber-900 text-[11px] leading-relaxed cursor-pointer hover:bg-amber-100/80 transition shadow-2xs group"
              >
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span>Akses free trial Anda akan berakhir <strong>8 hari lagi</strong>. </span>
                    <span className="text-amber-800 font-bold underline group-hover:text-amber-950">
                      Upgrade Sekarang.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Search icon shortcut saat collapsed */
            <motion.div
              key="collapsed-search-shortcut"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-2 px-2 flex justify-center border-b border-slate-100 pb-2 overflow-hidden shrink-0"
            >
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onToggleCollapse}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                title="Cari menu (Buka Sidebar)"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Navigation Menu Items List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar">
          {filteredList.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item);
            const isOpen = openMenus[item.id] ?? false;

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Menu Item Button */}
                <motion.button
                  whileHover={{ x: isCollapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleTopClick(item)}
                  className={`w-full flex items-center ${
                    isCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2"
                  } rounded-lg text-xs font-medium transition cursor-pointer group ${
                    isActive && !item.subItems
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} min-w-0`}>
                    {/* Blue Icon matching Kledo */}
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "text-blue-600" : "text-blue-500 group-hover:scale-105"
                    }`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.badgeText && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded font-mono ml-auto mr-1">
                      {item.badgeText}
                    </span>
                  )}

                  {!isCollapsed && item.subItems && (
                    <span className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-1">
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </motion.button>

                {/* Submenu Accordion (when expanded and not collapsed) with Framer Motion AnimatePresence */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && isOpen && item.subItems && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                      className="overflow-hidden pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4.5 my-0.5"
                    >
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon || FileText;
                        const subActive = isSubActive(sub);

                        return (
                          <motion.button
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            key={sub.id}
                            type="button"
                            onClick={() => handleSubClick(sub)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition text-left cursor-pointer group ${
                              sub.isNestedChild ? "ml-3 pl-2.5 border-l-2 border-indigo-200 bg-indigo-50/40 text-indigo-900" : ""
                            } ${
                              subActive
                                ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                                : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {sub.isNestedChild ? (
                                <CornerDownRight className={`w-3.5 h-3.5 shrink-0 ${
                                  subActive ? "text-indigo-600 font-bold" : "text-indigo-400 group-hover:text-indigo-600"
                                }`} />
                              ) : (
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${
                                  subActive ? "text-blue-600" : "text-blue-400 group-hover:text-blue-600"
                                }`} />
                              )}
                              <span className="truncate">{sub.label}</span>
                            </div>

                            {sub.badgeText && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                sub.isNestedChild 
                                  ? "bg-indigo-100 text-indigo-700 font-mono" 
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {sub.badgeText}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* 4. Bottom Footer: User Profile Card + Logout */}
        <div className={`p-3 border-t border-slate-200/80 bg-white shrink-0 ${isCollapsed ? "flex flex-col items-center gap-2" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2 w-full`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Blue Avatar Box */}
              <div 
                className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs"
                title={isCollapsed ? `${userName} (${companyName})` : undefined}
              >
                {userInitial}
              </div>

              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 flex-1"
                >
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                    {userName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {companyName}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Logout Button */}
            {!isCollapsed && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer shrink-0"
                title="Keluar dari Aplikasi"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {isCollapsed && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
              title="Keluar dari Aplikasi"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          )}
        </div>

      </motion.aside>
    </>
  );
};
