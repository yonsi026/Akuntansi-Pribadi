import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Tag, 
  Boxes, 
  TrendingUp, 
  AlertTriangle,
  ShoppingBag,
  Trash2,
  Printer,
  ChevronDown,
  Filter,
  Search,
  Download,
  Upload,
  BookOpen,
  Package,
  Layers,
  CheckSquare,
  Square,
  HelpCircle,
  FileSpreadsheet,
  Wallet,
  Building2,
  Warehouse,
  CheckCircle2,
  X,
  ExternalLink,
  Edit2
} from "lucide-react";
import { StockItem, StoreConfig } from "../types";
import { formatIDR } from "./FinanceDashboard";
import { generateStockInventoryPrintHtml } from "../utils/printTemplates";
import { UniversalPrintModal } from "./UniversalPrintModal";

interface StockManagerProps {
  stockItems: StockItem[];
  onAddStockItem: (item: Omit<StockItem, "id" | "purchaseHistory"> & { initialCost?: number }) => void;
  onDeleteStockItem: (id: string) => void;
  initialView?: string;
  storeConfig?: StoreConfig;
  onNavigateToTab?: (tab: string, sub?: string) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  stockItems,
  onAddStockItem,
  onDeleteStockItem,
  initialView,
  storeConfig,
  onNavigateToTab
}) => {
  const [stockView, setStockView] = useState<'katalog' | 'tambah' | 'hpp' | 'all' | 'aturan-harga'>(
    initialView === 'tambah' ? 'tambah' : (initialView === 'hpp' ? 'hpp' : (initialView === 'aturan-harga' ? 'aturan-harga' : 'katalog'))
  );
  
  const [showStockPrintModal, setShowStockPrintModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showPerGudang, setShowPerGudang] = useState(false);
  const [showCardsDetail, setShowCardsDetail] = useState(true);

  // Dropdown states for Kledo-style action buttons
  const [dropdownLaporan, setDropdownLaporan] = useState(false);
  const [dropdownPanduan, setDropdownPanduan] = useState(false);
  const [dropdownTambah, setDropdownTambah] = useState(false);
  const [dropdownImport, setDropdownImport] = useState(false);
  const [dropdownPrint, setDropdownPrint] = useState(false);

  // Form states for adding product
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [category, setCategory] = useState<string>("Sembako");
  const [unit, setUnit] = useState<string>("Pcs");
  const [initialStock, setInitialStock] = useState<number>(0);
  const [initialCost, setInitialCost] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [tambahModalType, setTambahModalType] = useState<string>("Reguler");

  // Validation States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setDropdownLaporan(false);
      setDropdownPanduan(false);
      setDropdownTambah(false);
      setDropdownImport(false);
      setDropdownPrint(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (initialView === 'tambah') setStockView('tambah');
    else if (initialView === 'hpp') setStockView('hpp');
    else if (initialView === 'aturan-harga') setStockView('aturan-harga');
    else if (initialView === 'all') setStockView('all');
    else setStockView('katalog');
  }, [initialView]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama produk tidak boleh kosong!");
      return;
    }
    if (initialStock < 0) {
      setErrorMsg("Stok awal tidak boleh negatif!");
      return;
    }
    if (initialCost < 0) {
      setErrorMsg("Harga beli awal (HPP) tidak boleh negatif!");
      return;
    }
    if (sellPrice < 0) {
      setErrorMsg("Harga jual pasar tidak boleh negatif!");
      return;
    }

    const calculatedSku = sku.trim() || `PRD/${String(stockItems.length + 1).padStart(5, '0')}`;

    onAddStockItem({
      name: name.trim(),
      sku: calculatedSku,
      category: category.trim() || "Other",
      unit,
      stock: initialStock,
      avgPurchasePrice: initialCost,
      sellPrice,
      initialCost: initialStock > 0 ? initialCost : 0
    });

    setName("");
    setSku("");
    setInitialStock(0);
    setInitialCost(0);
    setSellPrice(0);
    setSuccessMsg(`Produk "${name.trim()}" (${tambahModalType}) berhasil ditambahkan!`);
    
    // Switch to catalog
    setStockView('katalog');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Calculations for Kledo KPI Summary Cards (matching Produk1.png)
  const availableStockCount = stockItems.filter(item => item.stock > 0).length;
  const lowStockCount = stockItems.filter(item => item.stock > 0 && item.stock < 5).length;
  const outOfStockCount = stockItems.filter(item => item.stock <= 0).length;
  const totalStockUnits = stockItems.reduce((acc, item) => acc + item.stock, 0);
  const totalInventoryValue = stockItems.reduce((acc, item) => acc + (item.stock * item.avgPurchasePrice), 0);
  const totalHppValue = stockItems.reduce((acc, item) => acc + (item.stock * item.avgPurchasePrice), 0);

  // Filtered Items
  const filteredItems = stockItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || 
           item.sku.toLowerCase().includes(q) || 
           (item.category && item.category.toLowerCase().includes(q));
  });

  // Select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-xs text-slate-800" id="produk-module">
      
      {/* 1. Header Toolbar (matching Kledo Produk1.png) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Produk</h1>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* 1. Laporan Dropdown (matching Produk2.png) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setDropdownLaporan(prev => !prev);
                setDropdownPanduan(false);
                setDropdownTambah(false);
                setDropdownImport(false);
                setDropdownPrint(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Laporan</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownLaporan && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("asisten", "margins");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                >
                  <span>Profitabilitas Produk</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("laporan", "pemesanan");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Penjualan per Produk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("laporan", "pemesanan");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Pemesanan per Produk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("laporan", "pemesanan");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Penjualan per Kategori Produk
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("pembelian", "tagihan");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Pembelian per Produk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    onNavigateToTab?.("pembelian", "tagihan");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Pembelian Produk per Vendor
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    setStockView('all');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Ringkasan Inventori
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownLaporan(false);
                    setStockView('hpp');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Pergerakan Stok Inventori
                </button>
              </div>
            )}
          </div>

          {/* 2. Panduan Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setDropdownPanduan(prev => !prev);
                setDropdownLaporan(false);
                setDropdownTambah(false);
                setDropdownImport(false);
                setDropdownPrint(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Panduan</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownPanduan && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownPanduan(false);
                    setStockView('hpp');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Panduan Perhitungan HPP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownPanduan(false);
                    setStockView('aturan-harga');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Panduan Aturan Harga
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownPanduan(false);
                    onNavigateToTab?.("dokumen", "pedoman");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Pedoman SAK EMKM Persediaan
                </button>
              </div>
            )}
          </div>

          {/* 3. Aturan Harga (matching green button in Produk1.png) */}
          <button
            type="button"
            onClick={() => setStockView(stockView === 'aturan-harga' ? 'katalog' : 'aturan-harga')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shadow-xs ${
              stockView === 'aturan-harga'
                ? "bg-emerald-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Aturan Harga</span>
          </button>

          {/* 4. + Tambah Split Button (matching Produk3.png) */}
          <div className="relative inline-flex rounded-lg shadow-xs" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setTambahModalType("Reguler");
                setStockView('tambah');
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-l-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownTambah(prev => !prev);
                setDropdownLaporan(false);
                setDropdownPanduan(false);
                setDropdownImport(false);
                setDropdownPrint(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white border-l border-blue-500 px-2 py-1.5 rounded-r-lg transition cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {dropdownTambah && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setTambahModalType("Reguler");
                    setStockView('tambah');
                    setDropdownTambah(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tambah Produk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTambahModalType("Paket");
                    setStockView('tambah');
                    setDropdownTambah(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tambah Produk Paket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTambahModalType("Manufaktur");
                    setStockView('tambah');
                    setDropdownTambah(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tambah Produk Manufaktur</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTambahModalType("Varian");
                    setStockView('tambah');
                    setDropdownTambah(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tambah Produk Varian</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Import Dropdown (matching Produk4.png) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setDropdownImport(prev => !prev);
                setDropdownLaporan(false);
                setDropdownPanduan(false);
                setDropdownTambah(false);
                setDropdownPrint(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownImport && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownImport(false);
                    onNavigateToTab?.("laporan", "import");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Import Produk Reguler</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownImport(false);
                    onNavigateToTab?.("laporan", "ekspor");
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspor Produk Reguler (.xlsx)</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. Print Button */}
          <button
            type="button"
            onClick={() => setShowStockPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

        </div>
      </div>

      {/* 2. Success / Error Feedback Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">×</button>
        </div>
      )}

      {/* 3. 6 KPI Status Cards with Left Color Bars (matching Produk1.png) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Produk Stok Tersedia (Green Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Stok Tersedia</span>
            <span className="text-base font-black text-slate-900 font-mono block mt-0.5">{availableStockCount}</span>
          </div>
        </div>

        {/* Card 2: Produk Stok Hampir Habis (Yellow Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Hampir Habis</span>
            <span className="text-base font-black text-amber-600 font-mono block mt-0.5">{lowStockCount}</span>
          </div>
        </div>

        {/* Card 3: Produk Stok Habis (Blue Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Stok Habis</span>
            <span className="text-base font-black text-slate-700 font-mono block mt-0.5">{outOfStockCount}</span>
          </div>
        </div>

        {/* Card 4: Total Stok (Orange Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Warehouse className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Total Stok</span>
            <span className="text-base font-black text-slate-900 font-mono block mt-0.5">{totalStockUnits}</span>
          </div>
        </div>

        {/* Card 5: Total Nilai Produk (Blue Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Nilai Produk</span>
            <span className="text-xs font-black text-slate-900 font-mono block mt-0.5 truncate" title={formatIDR(totalInventoryValue)}>
              {formatIDR(totalInventoryValue)}
            </span>
          </div>
        </div>

        {/* Card 6: Total HPP (Purple Left Bar) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600 rounded-l" />
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block truncate">Total HPP</span>
            <span className="text-xs font-black text-slate-900 font-mono block mt-0.5 truncate" title={formatIDR(totalHppValue)}>
              {formatIDR(totalHppValue)}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Form Tambah Produk (when tambah view is active) */}
      {stockView === 'tambah' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs max-w-2xl mx-auto space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tambah Produk Baru ({tambahModalType})</h3>
              <p className="text-xs text-slate-400">Pendaftaran produk ke katalog usaha Anda</p>
            </div>
            <button
              type="button"
              onClick={() => setStockView('katalog')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
              <input
                type="text"
                required
                placeholder="Misal: Kopi Robusta 250g, Beras Pandan Wangi 5kg..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode / SKU</label>
                <input
                  type="text"
                  placeholder="Misal: PRD/00001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  placeholder="Misal: Sembako, Minuman..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-2 outline-none"
                >
                  <option value="Pcs">Pcs</option>
                  <option value="Box">Box</option>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Pack">Pack</option>
                  <option value="Botol">Botol</option>
                  <option value="Karung">Karung</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli Awal (HPP)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={initialCost || ""}
                  onChange={(e) => setInitialCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual Pasar</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={sellPrice || ""}
                  onChange={(e) => setSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kuantitas Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStockView('katalog')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Aturan Harga View */}
      {stockView === 'aturan-harga' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Aturan Harga &amp; Diskon Bertingkat</h3>
                <p className="text-xs text-slate-400">Atur skema harga khusus untuk grosir, reseller, atau kuantitas tertentu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStockView('katalog')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              &larr; Kembali ke Produk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-800 block">Harga Retail Standar</span>
              <p className="text-slate-500 text-[11px]">Harga jual umum yang tampil pada mesin Kasir (POS) dan faktur reguler.</p>
              <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Default Aktif</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-800 block">Harga Grosir (Min. 10 Pcs)</span>
              <p className="text-slate-500 text-[11px]">Otomatis memberikan potongan harga per unit saat pembelian mencapai ambang batas.</p>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Tersedia</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-bold text-slate-800 block">Harga Mitra / Reseller</span>
              <p className="text-slate-500 text-[11px]">Diterapkan otomatis ketika transaksi dihubungkan ke kontak pelanggan bertipe Reseller.</p>
              <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Tersedia</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. HPP Moving Average Explanation View */}
      {stockView === 'hpp' && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h4>Metode Harga Pokok Penjualan (HPP) SAK EMKM: Moving Average</h4>
            </div>
            <button
              type="button"
              onClick={() => setStockView('katalog')}
              className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
            >
              &larr; Kembali ke Katalog
            </button>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed">
            Sistem Akuntansi SAK EMKM menghitung Harga Pokok Penjualan menggunakan <strong>Metode Rata-Rata Bergerak (Weighted Moving Average)</strong> secara otomatis setiap kali Anda mencatat transaksi kulakan/pembelian stok baru.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rumus HPP Rata-Rata</span>
              <span className="font-mono text-xs font-bold text-slate-800 mt-1 block">
                (Nilai Saldo Lama + Pembelian Baru) ÷ Total Unit Fisik
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aset Persediaan Aktif</span>
              <span className="font-mono text-sm font-bold text-emerald-600 mt-1 block">
                {formatIDR(totalInventoryValue)}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Katalog Item Terdaftar</span>
              <span className="font-mono text-sm font-bold text-indigo-600 mt-1 block">
                {stockItems.length} Produk
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. Table Toolbar (matching Kledo Produk1.png) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left tools: Filter & Toggle Per Gudang */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
          </button>

          {/* Toggle Tampilkan stok per gudang */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div 
              onClick={() => setShowPerGudang(prev => !prev)}
              className={`w-9 h-5 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                showPerGudang ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div 
                className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ${
                  showPerGudang ? 'translate-x-4' : ''
                }`}
              />
            </div>
            <span className="text-xs text-slate-600 font-medium">Tampilkan stok per gudang</span>
          </label>
        </div>

        {/* Right tools: Ubah Massal & Cari input */}
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <span className="text-xs text-blue-600 font-semibold">
              {selectedItems.length} terpilih
            </span>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Ubah Massal</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none w-36 sm:w-48 transition"
            />
          </div>
        </div>

      </div>

      {/* 8. Table List (matching Kledo Produk1.png) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Nama</th>
                <th className="py-3 px-3">Kode/SKU</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Satuan</th>
                <th className="py-3 px-3 text-right">Harga Beli</th>
                <th className="py-3 px-3 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">HPP</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Belum ada produk yang cocok dengan pencarian.</p>
                    <p className="text-[11px]">Klik tombol "+ Tambah" di atas untuk mendaftarkan produk baru.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selectedItems.includes(item.id);
                  const isLow = item.stock < 5;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-3 px-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-blue-600 hover:underline cursor-pointer block">
                          {item.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {item.sku}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {item.category || "Other"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatIDR(item.avgPurchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatIDR(item.sellPrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatIDR(item.avgPurchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus produk "${item.name}" dari katalog?`)) {
                              onDeleteStockItem(item.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200 text-[11px] text-slate-800">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-left">
                    Total
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatIDR(filteredItems.reduce((acc, i) => acc + i.avgPurchasePrice, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatIDR(filteredItems.reduce((acc, i) => acc + i.sellPrice, 0))}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {filteredItems.reduce((acc, i) => acc + i.stock, 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatIDR(filteredItems.reduce((acc, i) => acc + (i.stock * i.avgPurchasePrice), 0))}
                  </td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Footer info matching Kledo */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total {filteredItems.length} data</span>
          <span>15 / halaman</span>
        </div>
      </div>

      {/* MODAL CETAK KATALOG & NILAI STOK */}
      <UniversalPrintModal
        isOpen={showStockPrintModal}
        onClose={() => setShowStockPrintModal(false)}
        title={`Katalog & Nilai Persediaan Stok - ${storeConfig?.storeName || 'SAK EMKM'}`}
        filename={`Katalog-Stok-${Date.now()}.pdf`}
        htmlContent={generateStockInventoryPrintHtml(stockItems, storeConfig || ({} as any))}
      />
    </div>
  );
};
