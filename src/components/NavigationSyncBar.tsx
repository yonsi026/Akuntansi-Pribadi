import React from "react";
import { 
  Store, 
  CreditCard, 
  Wallet, 
  Plus, 
  Receipt, 
  Building2, 
  FileText, 
  Truck, 
  ShoppingCart, 
  FileSpreadsheet, 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Boxes, 
  Percent, 
  BookOpen, 
  Scale, 
  Download, 
  BarChart2, 
  BrainCircuit, 
  Sparkles,
  ArrowUpRight,
  Tag
} from "lucide-react";

interface NavigationSyncBarProps {
  activeTab: string;
  activeSubFilter?: string;
  onNavigate: (tab: string, sub?: string) => void;
  posCount?: number;
  stockCount?: number;
  unpaidInvoiceCount?: number;
}

export const NavigationSyncBar: React.FC<NavigationSyncBarProps> = ({
  activeTab,
  activeSubFilter,
  onNavigate,
  stockCount = 0,
  unpaidInvoiceCount = 0
}) => {
  // 1. Dashboard: Keep completely clean without duplicate floating bars
  if (activeTab === "dashboard") {
    return null;
  }

  // 2. Kas & Bank Section & Kasir (POS)
  const isKasBankOrPosSection = activeTab === "pos" || (activeTab === "transaksi" && activeSubFilter !== "invoice");

  if (isKasBankOrPosSection) {
    const kasBankTabs = [
      {
        id: "mutasi",
        label: "Buku Kas & Mutasi",
        icon: Wallet,
        action: () => onNavigate("transaksi", "mutasi"),
        isActive: activeTab === "transaksi" && (activeSubFilter === "mutasi" || !activeSubFilter),
      },
      {
        id: "pos",
        label: "Kasir (POS)",
        icon: Store,
        action: () => onNavigate("pos"),
        isActive: activeTab === "pos",
      },
      {
        id: "input",
        label: "Catat Kas Masuk & Biaya",
        icon: Plus,
        action: () => onNavigate("transaksi", "input"),
        isActive: activeTab === "transaksi" && activeSubFilter === "input",
      },
      {
        id: "jurnal",
        label: "Buku Jurnal Umum",
        icon: FileSpreadsheet,
        action: () => onNavigate("transaksi", "jurnal"),
        isActive: activeTab === "transaksi" && activeSubFilter === "jurnal",
      },
      {
        id: "bukubesar",
        label: "Rekening Bank & Buku Besar",
        icon: Building2,
        action: () => onNavigate("transaksi", "bukubesar"),
        isActive: activeTab === "transaksi" && activeSubFilter === "bukubesar",
      }
    ];

    return (
      <nav aria-label="Sub navigasi Kas dan Kasir" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          {/* Minimalist Underline Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {kasBankTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quiet Link to Invoices */}
          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("penjualan", "tagihan")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Faktur Penjualan</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 3. Penjualan Section
  const isPenjualanSection = activeTab === "penjualan" || activeTab === "tagihan" || (activeTab === "transaksi" && activeSubFilter === "invoice");

  if (isPenjualanSection) {
    const penjualanTabs = [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        action: () => onNavigate("penjualan", "overview"),
        isActive: activeTab === "penjualan" && (activeSubFilter === "overview" || !activeSubFilter),
      },
      {
        id: "tagihan",
        label: "Tagihan",
        icon: FileText,
        action: () => onNavigate("penjualan", "tagihan"),
        isActive: activeTab === "tagihan" || (activeTab === "penjualan" && activeSubFilter === "tagihan") || (activeTab === "transaksi" && activeSubFilter === "invoice"),
        count: unpaidInvoiceCount > 0 ? unpaidInvoiceCount : undefined
      },
      {
        id: "tambah-tagihan",
        label: "+ Tambah Tagihan",
        icon: Plus,
        action: () => onNavigate("penjualan", "tambah-tagihan"),
        isActive: activeTab === "penjualan" && (activeSubFilter === "tambah-tagihan" || activeSubFilter === "form-tagihan"),
      },
      {
        id: "pengiriman",
        label: "Pengiriman",
        icon: Truck,
        action: () => onNavigate("penjualan", "pengiriman"),
        isActive: activeTab === "penjualan" && activeSubFilter === "pengiriman",
      },
      {
        id: "pemesanan",
        label: "Pemesanan",
        icon: ShoppingCart,
        action: () => onNavigate("penjualan", "pemesanan"),
        isActive: activeTab === "penjualan" && (activeSubFilter === "pemesanan" || activeSubFilter === "pemesanan-per-produk"),
      },
      {
        id: "penawaran",
        label: "Penawaran",
        icon: FileSpreadsheet,
        action: () => onNavigate("penjualan", "penawaran"),
        isActive: activeTab === "penjualan" && activeSubFilter === "penawaran",
      }
    ];

    return (
      <nav aria-label="Sub navigasi Penjualan" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {penjualanTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("pos")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Kasir (POS)</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 4. Pembelian Section
  if (activeTab === "pembelian") {
    const pembelianTabs = [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        action: () => onNavigate("pembelian", "overview"),
        isActive: activeTab === "pembelian" && (activeSubFilter === "overview" || !activeSubFilter),
      },
      {
        id: "tagihan",
        label: "Tagihan Pembelian",
        icon: FileText,
        action: () => onNavigate("pembelian", "tagihan"),
        isActive: activeTab === "pembelian" && activeSubFilter === "tagihan",
      },
      {
        id: "piutang",
        label: "Piutang",
        icon: Receipt,
        action: () => onNavigate("pembelian", "piutang"),
        isActive: activeTab === "pembelian" && activeSubFilter === "piutang",
      },
      {
        id: "pengiriman",
        label: "Pengiriman",
        icon: Truck,
        action: () => onNavigate("pembelian", "pengiriman"),
        isActive: activeTab === "pembelian" && activeSubFilter === "pengiriman",
      },
      {
        id: "pesanan",
        label: "Pesanan (PO)",
        icon: ShoppingCart,
        action: () => onNavigate("pembelian", "pesanan"),
        isActive: activeTab === "pembelian" && activeSubFilter === "pesanan",
      },
      {
        id: "penawaran",
        label: "Penawaran (RFQ)",
        icon: FileSpreadsheet,
        action: () => onNavigate("pembelian", "penawaran"),
        isActive: activeTab === "pembelian" && activeSubFilter === "penawaran",
      }
    ];

    return (
      <nav aria-label="Sub navigasi Pembelian" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {pembelianTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-amber-600 text-amber-700 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-amber-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("transaksi", "mutasi")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>Buku Kas &amp; Bank</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 5. Produk & Stok Section
  if (activeTab === "stok" || activeTab === "produk") {
    const stokTabs = [
      {
        id: "katalog",
        label: "Produk",
        icon: Package,
        action: () => onNavigate("stok", "katalog"),
        isActive: (activeTab === "stok" || activeTab === "produk") && (activeSubFilter === "katalog" || !activeSubFilter),
      },
      {
        id: "tambah",
        label: "+ Tambah Produk",
        icon: Plus,
        action: () => onNavigate("stok", "tambah"),
        isActive: activeSubFilter === "tambah",
      },
      {
        id: "aturan-harga",
        label: "Aturan Harga",
        icon: Tag,
        action: () => onNavigate("stok", "aturan-harga"),
        isActive: activeSubFilter === "aturan-harga",
      },
      {
        id: "hpp",
        label: "Rekalkulasi HPP",
        icon: Warehouse,
        action: () => onNavigate("stok", "hpp"),
        isActive: activeSubFilter === "hpp",
      },
      {
        id: "all",
        label: "Semua Saldo Stok",
        icon: Boxes,
        action: () => onNavigate("stok", "all"),
        isActive: activeSubFilter === "all",
      }
    ];

    return (
      <nav aria-label="Sub navigasi Produk" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {stokTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("pos")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Kasir (POS)</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 6. Laporan Keuangan Section
  if (activeTab === "laporan") {
    const laporanTabs = [
      { id: "labarugi", label: "Laba Rugi", icon: FileSpreadsheet, action: () => onNavigate("laporan", "labarugi"), isActive: activeSubFilter === "labarugi" || !activeSubFilter },
      { id: "neraca", label: "Posisi Keuangan (Neraca)", icon: Scale, action: () => onNavigate("laporan", "neraca"), isActive: activeSubFilter === "neraca" },
      { id: "aruskas", label: "Arus Kas", icon: Wallet, action: () => onNavigate("laporan", "aruskas"), isActive: activeSubFilter === "aruskas" },
      { id: "neracasaldo", label: "Neraca Saldo", icon: Building2, action: () => onNavigate("laporan", "neracasaldo"), isActive: activeSubFilter === "neracasaldo" },
      { id: "piutang", label: "Piutang", icon: Receipt, action: () => onNavigate("laporan", "piutang"), isActive: activeSubFilter === "piutang" },
      { id: "pengiriman", label: "Pengiriman", icon: Truck, action: () => onNavigate("laporan", "pengiriman"), isActive: activeSubFilter === "pengiriman" },
      { id: "ekspor", label: "Ekspor / Import", icon: Download, action: () => onNavigate("laporan", "ekspor"), isActive: activeSubFilter === "ekspor" || activeSubFilter === "import" },
    ];

    return (
      <nav aria-label="Sub navigasi Laporan" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {laporanTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("transaksi", "mutasi")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>Buku Kas &amp; Bank</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 7. Perpajakan UMKM Section
  if (activeTab === "pajak") {
    const pajakTabs = [
      { id: "pph", label: "PPh Final 0.5% (PP 23)", icon: Percent, action: () => onNavigate("pajak", "pph"), isActive: activeSubFilter === "pph" || !activeSubFilter },
      { id: "ppn", label: "Kalkulator PPN 11%", icon: Receipt, action: () => onNavigate("pajak", "ppn"), isActive: activeSubFilter === "ppn" }
    ];

    return (
      <nav aria-label="Sub navigasi Pajak" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {pajakTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("pos")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Kasir (PPN 11%)</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 8. Bagan Akun (COA) & Aset Tetap Section
  if (activeTab === "dokumen") {
    const docTabs = [
      { id: "coa", label: "Bagan Akun (COA)", icon: BookOpen, action: () => onNavigate("dokumen", "coa"), isActive: activeSubFilter === "coa" || !activeSubFilter },
      { id: "pedoman", label: "Pedoman SAK EMKM", icon: FileText, action: () => onNavigate("dokumen", "pedoman"), isActive: activeSubFilter === "pedoman" }
    ];

    return (
      <nav aria-label="Sub navigasi Akun" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {docTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("transaksi", "bukubesar")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Buku Besar</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 9. Asisten AI & Analisis Margin Section
  if (activeTab === "asisten") {
    const aiTabs = [
      { id: "margins", label: "Analisis Margin Produk ✨", icon: Percent, action: () => onNavigate("asisten", "margins"), isActive: activeSubFilter === "margins" || !activeSubFilter },
      { id: "chat", label: "Konsultasi Chat AI", icon: BrainCircuit, action: () => onNavigate("asisten", "chat"), isActive: activeSubFilter === "chat" },
      { id: "audit", label: "Audit Kesehatan Toko", icon: Sparkles, action: () => onNavigate("asisten", "audit"), isActive: activeSubFilter === "audit" }
    ];

    return (
      <nav aria-label="Sub navigasi Asisten AI" className="border-b border-slate-200/90 mb-5 bg-transparent">
        <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {aiTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={t.action}
                  className={`inline-flex items-center gap-2 pb-2.5 px-3 text-xs border-b-2 transition cursor-pointer whitespace-nowrap -mb-px ${
                    t.isActive
                      ? "border-indigo-600 text-indigo-700 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 pb-2.5">
            <button
              type="button"
              onClick={() => onNavigate("pos")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Kasir (POS)</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return null;
};
