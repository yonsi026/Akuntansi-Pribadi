import { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Boxes, 
  FileSpreadsheet, 
  Percent, 
  BrainCircuit,
  Wallet,
  Coins,
  Settings,
  BookText,
  LogOut,
  Globe,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Menu,
  Search,
  PlusCircle,
  ChevronRight,
  PanelLeft,
  Store,
  X,
  ShieldCheck,
  KeyRound,
  Camera,
  Printer
} from "lucide-react";
import { Transaction, StockItem, FinancialStats, StoreConfig, UserAccount } from "./types";
import { 
  generateJournal, 
  computeFinancialStats, 
  recalculateInventoryAverage 
} from "./utils/accountingEngine";

// Import modules
import { SidebarNav } from "./components/SidebarNav";
import { FinanceDashboard } from "./components/FinanceDashboard";
import { TransactionFormAndJournal } from "./components/TransactionFormAndJournal";
import { StockManager } from "./components/StockManager";
import { FinancialStatements } from "./components/FinancialStatements";
import { TaxCalculator } from "./components/TaxCalculator";
import { AiAssistant } from "./components/AiAssistant";
import { StoreSettings, DEFAULT_STORE_CONFIG, BUSINESS_TYPE_PRESETS } from "./components/StoreSettings";
import { CloudSync } from "./components/CloudSync";
import { AccountDocumentation } from "./components/AccountDocumentation";
import { LandingPage } from "./components/LandingPage";
import { ActivationModal } from "./components/ActivationModal";
import { SalesOverview } from "./components/SalesOverview";
import { InvoiceManager } from "./components/InvoiceManager";
import { PurchaseManager } from "./components/PurchaseManager";
import { DeliveryManager } from "./components/DeliveryManager";
import { OrderManager } from "./components/OrderManager";
import { PointOfSale } from "./components/PointOfSale";
import { NavigationSyncBar } from "./components/NavigationSyncBar";
import { UniversalPrintModal } from "./components/UniversalPrintModal";
import { printInPageDOM } from "./utils/printHelper";
import { getStoredInvoices } from "./utils/invoiceService";
import { getCurrentUser, logoutUser } from "./utils/authService";
import { getActiveLicense, LicenseData } from "./utils/licenseManager";

const TAB_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Ringkasan Toko", subtitle: "Executive Dashboard & Posisi Finansial SAK EMKM" },
  pos: { title: "Kasir (POS)", subtitle: "Mesin Kasir Cepat, Hitung Otomatis PPN 11%, Scan Barcode & Cetak Struk (Modul Kas & Bank)" },
  penjualan: { title: "Overview Penjualan", subtitle: "Ringkasan Eksekutif, Tren & Alur Siklus Penjualan" },
  transaksi: { title: "Kas & Bank / Jurnal", subtitle: "Pencatatan Mutasi Kas & Entri SAK EMKM" },
  stok: { title: "Stok Barang (HPP)", subtitle: "Manajemen Persediaan & Biaya Pokok Penjualan" },
  laporan: { title: "Laporan Keuangan", subtitle: "Laba Rugi, Neraca, Arus Kas & Ekspor Excel" },
  pajak: { title: "Perpajakan UMKM", subtitle: "Kalkulator PPh Final 0.5% (PP 23) & PPN" },
  dokumen: { title: "Bagan Akun (COA)", subtitle: "Daftar Kode Akun Standar SAK EMKM" },
  asisten: { title: "Tanya Akuntan AI ✨", subtitle: "Asisten Cerdas & Audit Kesehatan Bisnis" },
  pengaturan: { title: "Profil Toko & Cadangan", subtitle: "Informasi Usaha, NPWP & Cloud Sync" },
};

export const getPageDetails = (tab: string, subFilter?: string): { title: string; subtitle: string; parentTitle?: string } => {
  if (tab === "pos") {
    return { 
      title: "Kasir (POS)", 
      subtitle: "Mesin Kasir Cepat, Hitung Otomatis PPN 11%, Scan Barcode & Cetak Struk Belanja"
    };
  }
  if (tab === "penjualan") {
    if (subFilter === "tagihan") {
      return { title: "Tagihan", subtitle: "Kelola Tagihan Penjualan, Faktur & Penagihan Pelanggan", parentTitle: "Penjualan" };
    }
    if (subFilter === "tambah-tagihan" || subFilter === "form-tagihan") {
      return { title: "Tambah Tagihan", subtitle: "Formulir Faktur Penjualan Baru & Penagihan Resmi Pelanggan", parentTitle: "Penjualan" };
    }
    if (subFilter === "pengiriman") {
      return { title: "Pengiriman", subtitle: "Surat Jalan, Ekspedisi & No. Resi Pengiriman Pelanggan", parentTitle: "Penjualan" };
    }
    if (subFilter === "pemesanan") {
      return { title: "Pemesanan Penjualan", subtitle: "Sales Order (SO) & Daftar Pesanan Pelanggan", parentTitle: "Penjualan" };
    }
    if (subFilter === "tambah-pemesanan") {
      return { title: "Tambah Pemesanan", subtitle: "Formulir Surat Pesanan Penjualan Baru (Sales Order)", parentTitle: "Penjualan" };
    }
    if (subFilter === "pemesanan-per-produk") {
      return { title: "Pemesanan per Produk", subtitle: "Laporan Rekapitulasi Pemesanan Produk, Kuantitas & Rata-rata Harga", parentTitle: "Penjualan" };
    }
    if (subFilter === "penawaran") {
      return { title: "Penawaran Penjualan", subtitle: "Sales Quotation (SQ) & Penawaran Harga Pelanggan", parentTitle: "Penjualan" };
    }
    return { title: "Overview Penjualan", subtitle: "Ringkasan Eksekutif, Tren & Alur Siklus Penjualan", parentTitle: "Penjualan" };
  }
  if (tab === "tagihan") {
    return { title: "Tagihan", subtitle: "Kelola Tagihan Penjualan, Faktur & Penagihan Pelanggan", parentTitle: "Penjualan" };
  }
  if (tab === "pembelian") {
    if (subFilter === "tagihan") {
      return { title: "Tagihan Pembelian", subtitle: "Faktur Pembelian Stok, Tagihan Supplier & Pembayaran", parentTitle: "Pembelian" };
    }
    if (subFilter === "piutang") {
      return { title: "Piutang", subtitle: "Daftar Piutang Pelanggan & Jadwal Penagihan (Sub Navbar Tagihan Pembelian)", parentTitle: "Pembelian" };
    }
    if (subFilter === "pengiriman") {
      return { title: "Pengiriman Pembelian", subtitle: "Penerimaan Fisik Barang dari Pemasok / Ekspedisi", parentTitle: "Pembelian" };
    }
    if (subFilter === "pesanan") {
      return { title: "Pesanan Pembelian", subtitle: "Purchase Order (PO) & Pengadaan Barang Dagang", parentTitle: "Pembelian" };
    }
    if (subFilter === "penawaran") {
      return { title: "Penawaran Pembelian", subtitle: "Permintaan Penawaran Harga Pemasok (RFQ)", parentTitle: "Pembelian" };
    }
    return { title: "Overview Pembelian", subtitle: "Ringkasan Pengadaan Barang & Pembelian Usaha", parentTitle: "Pembelian" };
  }
  if (tab === "transaksi") {
    if (subFilter === "invoice") {
      return { title: "Tagihan", subtitle: "Daftar tagihan penjualan, detil faktur INV, ekspedisi & penerimaan pembayaran kas", parentTitle: "Penjualan" };
    }
    if (subFilter === "jurnal") {
      return { title: "Buku Jurnal Umum", subtitle: "Daftar Entri Jurnal Double-Entry Berpasangan Standar SAK EMKM", parentTitle: "Kas & Bank" };
    }
    if (subFilter === "mutasi") {
      return { title: "Buku Kas & Mutasi", subtitle: "Riwayat Arus Kas Masuk & Kas Keluar Lengkap", parentTitle: "Kas & Bank" };
    }
    if (subFilter === "bukubesar") {
      return { title: "Buku Besar per Akun", subtitle: "Buku Besar Pembantu & Mutasi Saldo Kode Akun SAK EMKM", parentTitle: "Kas & Bank" };
    }
    return { title: "Catat Transaksi Baru", subtitle: "Input Transaksi Kas, Penjualan & Beban Operasional", parentTitle: "Kas & Bank" };
  }
  if (tab === "stok") {
    if (subFilter === "tambah") {
      return { title: "Tambah Produk Baru", subtitle: "Pendaftaran Item Barang Dagang & Penetapan HPP Awal", parentTitle: "Stok Barang (HPP)" };
    }
    if (subFilter === "hpp") {
      return { title: "Rekalkulasi HPP Rata-Rata", subtitle: "Perhitungan Moving Average Harga Pokok Penjualan SAK EMKM", parentTitle: "Stok Barang (HPP)" };
    }
    return { title: "Katalog & Saldo Stok Barang", subtitle: "Daftar Produk, SKU, Harga Jual & Kuantitas Persediaan", parentTitle: "Stok Barang (HPP)" };
  }
  if (tab === "laporan") {
    if (subFilter === "neraca") {
      return { title: "Laporan Posisi Keuangan (Neraca)", subtitle: "Aset Lancar, Aset Tetap, Liabilitas & Ekuitas Pemilik", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "aruskas") {
      return { title: "Laporan Arus Kas", subtitle: "Aktivitas Operasional, Investasi & Pendanaan Toko", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "neracasaldo") {
      return { title: "Neraca Saldo (Trial Balance)", subtitle: "Verifikasi Keseimbangan Saldo Debit & Kredit Seluruh Kode Akun", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "piutang") {
      return { title: "Daftar Piutang Pelanggan", subtitle: "Rekap Saldo Tagihan Pelanggan, Jatuh Tempo & Umur Piutang (Aging SAK EMKM)", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "pengiriman") {
      return { title: "Pengiriman Penjualan", subtitle: "Laporan Rincian Pengiriman Barang, Kuantitas & Peringkat Pelanggan", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "ongkir") {
      return { title: "Ongkos Kirim per Ekspedisi", subtitle: "Laporan Biaya & Statistik Pengiriman per Ekspedisi", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "pemesanan" || subFilter === "pemesanan-per-produk") {
      return { title: "Pemesanan per Produk", subtitle: "Laporan Rekapitulasi Pemesanan Produk, Kuantitas & Rata-rata Harga", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "ekspor") {
      return { title: "Unduh File Excel (.xlsx)", subtitle: "Ekspor Seluruh Laporan Keuangan ke Microsoft Excel", parentTitle: "Laporan Keuangan" };
    }
    if (subFilter === "import") {
      return { title: "Import Data Excel (.xlsx)", subtitle: "Unggah & Sinkronkan Data Transaksi dari Berkas Excel", parentTitle: "Laporan Keuangan" };
    }
    return { title: "Laporan Laba Rugi", subtitle: "Pendapatan, HPP, Beban Usaha & Perhitungan Laba Bersih", parentTitle: "Laporan Keuangan" };
  }
  if (tab === "pajak") {
    if (subFilter === "ppn") {
      return { title: "Kalkulator PPN 11%", subtitle: "Simulasi Perhitungan PPN Faktur Penjualan & Pembelian", parentTitle: "Perpajakan UMKM" };
    }
    return { title: "Simulasi PPh Final 0.5% (PP 23)", subtitle: "Pajak Penghasilan UMKM & Plafon Rp 500 Juta Bebas Pajak (UU HPP)", parentTitle: "Perpajakan UMKM" };
  }
  if (tab === "dokumen") {
    if (subFilter === "pedoman") {
      return { title: "Pedoman Standar SAK EMKM", subtitle: "Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah", parentTitle: "Bagan Akun (COA)" };
    }
    return { title: "Daftar Kode Akun (COA)", subtitle: "Bagan Akun Standar SAK EMKM 1001-6008 & Aturan Debit/Kredit", parentTitle: "Bagan Akun (COA)" };
  }
  if (tab === "asisten") {
    if (subFilter === "audit") {
      return { title: "Audit & Diagnosa Kesehatan Usaha", subtitle: "Evaluasi Rasio Margin, Likuiditas & Beban Usaha AI", parentTitle: "Asisten AI" };
    }
    return { title: "Tanya Akuntan AI ✨", subtitle: "Konsultasi Interaktif Solusi Pembukuan & Aturan Pajak", parentTitle: "Asisten AI" };
  }
  if (tab === "pengaturan") {
    if (subFilter === "sync") {
      return { title: "Cadangkan & Cloud Sync", subtitle: "Ekspor & Impor Database Pembukuan Lokal JSON", parentTitle: "Profil & Pengaturan" };
    }
    return { title: "Profil & Informasi Usaha", subtitle: "Nama Usaha, Kota, Alamat, NPWP & Bidang Usaha", parentTitle: "Profil & Pengaturan" };
  }
  return { title: "Ringkasan Toko", subtitle: "Executive Dashboard & Posisi Finansial SAK EMKM" };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeSubFilter, setActiveSubFilter] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [landingInitialMode, setLandingInitialMode] = useState<"login" | "register" | "demo">("login");
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  // Hardware License & Anti-Piracy States
  const [activeLicense, setActiveLicense] = useState<LicenseData | null>(null);
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const headerLogoInputRef = useRef<HTMLInputElement | null>(null);

  // Navbar Print States
  const [navbarPrintModalOpen, setNavbarPrintModalOpen] = useState(false);
  const [navbarPrintHtml, setNavbarPrintHtml] = useState("");
  const [navbarPrintTitle, setNavbarPrintTitle] = useState("");

  // Local storage state keys
  const LOCAL_STORAGE_TX_KEY = "akuntan_ai_transactions_v1";
  const LOCAL_STORAGE_STOCK_KEY = "akuntan_ai_stocks_v1";
  const LOCAL_STORAGE_CONFIG_KEY = "akuntan_ai_store_config_v1";

  // Persistent States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);

  // 1. Initial State Loading from LocalStorage on mount
  useEffect(() => {
    // Check Hardware Machine License first
    const lic = getActiveLicense();
    setActiveLicense(lic);
    if (!lic) {
      // If machine is not yet activated, open Activation Modal
      setShowActivationModal(true);
    }

    // Check active user session
    const activeSession = getCurrentUser();
    if (activeSession) {
      setCurrentUser(activeSession);
      setShowLandingPage(false);
    } else {
      setShowLandingPage(true);
    }

    const loadedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
    const loadedStock = localStorage.getItem(LOCAL_STORAGE_STOCK_KEY);
    const loadedConfig = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);

    if (loadedTx) {
      try {
        setTransactions(JSON.parse(loadedTx));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    if (loadedStock) {
      try {
        setStockItems(JSON.parse(loadedStock));
      } catch (e) {
        console.error("Failed to parse stocks", e);
      }
    }
    if (loadedConfig) {
      try {
        setStoreConfig(JSON.parse(loadedConfig));
      } catch (e) {
        console.error("Failed to parse store config", e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: UserAccount, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    setShowLandingPage(false);

    if (user.isDemo) {
      // Demo mode: ensure sample data is populated so the user can test everything
      if (transactions.length === 0) {
        handleLoadCustomDemoData(storeConfig);
      }
      setWelcomeBanner("Mode Akun Demo Aktif: Anda dapat menjelajahi seluruh fitur, riwayat transaksi, stok barang, dan laporan keuangan SAK EMKM secara leluasa.");
    } else if (isNewRegistration) {
      // Brand new user registration: Update store configuration with newly registered data and start fresh
      const preset = BUSINESS_TYPE_PRESETS[user.storeType];
      const updatedConfig: StoreConfig = {
        ...storeConfig,
        storeName: user.storeName,
        storeType: user.storeType || storeConfig.storeType,
        storeCity: user.storeCity || storeConfig.storeCity,
        storeAddress: user.storeAddress || storeConfig.storeAddress,
        storeNpwp: user.storeNpwp || storeConfig.storeNpwp,
        demoProducts: preset ? preset.products : storeConfig.demoProducts
      };
      handleSaveStoreConfig(updatedConfig);
      
      // If the registered business type has preset products/materials/services, seed the initial catalog
      const initialStocks: StockItem[] = preset ? preset.products.map((p, idx) => ({
        id: `stk-${Date.now()}-${idx}`,
        name: p.name,
        sku: p.sku || `SKU-${idx}`,
        unit: p.unit || "Pcs",
        stock: user.storeType.includes("Konsultan") ? 0 : 25,
        avgPurchasePrice: p.avgPurchasePrice,
        sellPrice: p.sellPrice,
        purchaseHistory: []
      })) : [];

      saveState([], initialStocks);
      setActiveTab("dashboard");
      setWelcomeBanner(`Selamat datang, ${user.name}! Usaha "${user.storeName}" (${user.storeType} — ${user.storeCity}) berhasil didaftarkan. Halaman utama Akuntansi AI siap digunakan untuk pembukuan riil Anda.`);
    } else {
      // Existing user login
      if (user.storeName && user.storeName !== storeConfig.storeName) {
        const updatedConfig: StoreConfig = {
          ...storeConfig,
          storeName: user.storeName,
          storeType: user.storeType || storeConfig.storeType,
          storeCity: user.storeCity || storeConfig.storeCity,
          storeAddress: user.storeAddress || storeConfig.storeAddress,
          storeNpwp: user.storeNpwp || storeConfig.storeNpwp
        };
        handleSaveStoreConfig(updatedConfig);
      }
      setWelcomeBanner(`Selamat datang kembali, ${user.name}! Data pembukuan "${storeConfig.storeName}" siap dikelola.`);
    }
  };

  const handleLogout = (targetMode: "login" | "register" | "demo" = "login") => {
    logoutUser();
    setCurrentUser(null);
    setLandingInitialMode(targetMode);
    setShowLandingPage(true);
    setWelcomeBanner(null);
  };

  const handleSaveStoreConfig = (newConfig: StoreConfig) => {
    setStoreConfig(newConfig);
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
  };

  const handleUpdateStoreLogo = (newLogoUrl: string) => {
    const updatedConfig: StoreConfig = {
      ...storeConfig,
      storeLogo: newLogoUrl
    };
    handleSaveStoreConfig(updatedConfig);
    setWelcomeBanner("Logo perusahaan berhasil diperbarui!");
  };

  const handleDeductStock = (stockItemId: string, qty: number) => {
    const updatedStocks = stockItems.map(item => {
      if (item.id === stockItemId) {
        return {
          ...item,
          stock: Math.max(0, item.stock - qty)
        };
      }
      return item;
    });
    saveState(transactions, updatedStocks);
  };

  const handleSyncImport = (pulledTxs: Transaction[], pulledStocks: StockItem[], pulledConfig: StoreConfig) => {
    setTransactions(pulledTxs);
    setStockItems(pulledStocks);
    setStoreConfig(pulledConfig);
    
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(pulledTxs));
    localStorage.setItem(LOCAL_STORAGE_STOCK_KEY, JSON.stringify(pulledStocks));
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(pulledConfig));
  };

  // 2. Synchronize to Local Storage and recalculate stock balances
  const saveState = (updatedTx: Transaction[], updatedStock: StockItem[]) => {
    const freshStockBalances = recalculateInventoryAverage(updatedTx, updatedStock);
    
    setTransactions(updatedTx);
    setStockItems(freshStockBalances);
    
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(updatedTx));
    localStorage.setItem(LOCAL_STORAGE_STOCK_KEY, JSON.stringify(freshStockBalances));
  };

  // State manipulation Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const txToAdd: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    const nextTx = [...transactions, txToAdd];
    saveState(nextTx, stockItems);
  };

  const handleDeleteTransaction = (id: string) => {
    const nextTx = transactions.filter(t => t.id !== id);
    saveState(nextTx, stockItems);
  };

  const handleAddStockItem = (newItem: Omit<StockItem, "id" | "purchaseHistory"> & { initialCost?: number }) => {
    const stockId = `stk-${Date.now()}`;
    const initialPurchaseRecord = newItem.initialCost && newItem.stock > 0 ? [{
      date: new Date().toISOString().split('T')[0],
      quantity: newItem.stock,
      pricePerUnit: newItem.initialCost
    }] : [];

    const itemToAdd: StockItem = {
      id: stockId,
      name: newItem.name,
      sku: newItem.sku,
      unit: newItem.unit,
      stock: newItem.stock,
      avgPurchasePrice: newItem.avgPurchasePrice,
      sellPrice: newItem.sellPrice,
      purchaseHistory: initialPurchaseRecord
    };

    const nextStock = [...stockItems, itemToAdd];
    
    // If they specified initial stock, generate a simulated transaction for capital setup or initial inventory!
    let nextTx = [...transactions];
    if (newItem.stock > 0 && newItem.initialCost) {
      const initialPurchaseTx: Transaction = {
        id: `tx-init-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Stok Awal - ${newItem.name}`,
        amount: newItem.stock * newItem.initialCost,
        type: 'Pembelian Stok',
        stockItemId: stockId,
        stockQuantity: newItem.stock,
        stockPricePerUnit: newItem.initialCost,
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1003, // Persediaan
        creditAccount: 1001 // Kas
      };
      
      // Also generate matching Sector Modal so cash balance doesn't start negative!
      const initialCapitalTx: Transaction = {
        id: `tx-cap-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Setoran Investasi Persediaan - ${newItem.name}`,
        amount: newItem.stock * newItem.initialCost,
        type: 'Setor Modal',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1001,
        creditAccount: 3001
      };

      nextTx = [...nextTx, initialCapitalTx, initialPurchaseTx];
    }

    saveState(nextTx, nextStock);
  };

  const handleDeleteStockItem = (id: string) => {
    const nextStock = stockItems.filter(item => item.id !== id);
    // Also remove transactions referencing this item to avoid breakages
    const nextTx = transactions.filter(t => t.stockItemId !== id);
    saveState(nextTx, nextStock);
  };

  const handleImportExcelData = (mergedTxs: Transaction[], mergedStocks?: StockItem[]) => {
    const updatedStocks = mergedStocks && mergedStocks.length > 0 ? mergedStocks : stockItems;
    saveState(mergedTxs, updatedStocks);
  };

  const handleClearTransactions = () => {
    setTransactions([]);
    setStockItems([]);
    localStorage.removeItem(LOCAL_STORAGE_TX_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STOCK_KEY);
  };

  // 3. Load dynamic, profile-aware Custom Demo Data
  const handleLoadCustomDemoData = (customConfig: StoreConfig) => {
    const { storeName, storeCity, demoProducts, storeType } = customConfig;
    
    // Convert custom products parameters to standard StockItems
    const demoStock: StockItem[] = demoProducts.map((p, idx) => ({
      id: `stk-${Date.now()}-${idx}`,
      name: p.name,
      sku: p.sku || `SKU-P${idx}`,
      unit: p.unit || "Pcs",
      stock: idx === 0 ? 45 : (idx === 1 ? 100 : 20), // default realistic balance 
      avgPurchasePrice: p.avgPurchasePrice || 10000,
      sellPrice: p.sellPrice || 15000,
      purchaseHistory: []
    }));

    const datePrefix = "2026-06-";
    const initialCaptial = 15000000;

    // Build compliant double-entry transactions mapped to active store context!
    const demoTx: Transaction[] = [
      {
        id: "demo-tx-1",
        date: `${datePrefix}01`,
        description: `Penyetoran Modal Awal Pemilik ${storeName} ${storeCity}`,
        amount: initialCaptial,
        type: 'Setor Modal',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1001, // Kas
        creditAccount: 3001 // Modal Pemilik
      },
      {
        id: "demo-tx-2",
        date: `${datePrefix}02`,
        description: `Beban Pembayaran Sewa Tempat/Ruko ${storeName}`,
        amount: 2000000,
        type: 'Biaya Operasional',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 6002, // Beban Sewa
        creditAccount: 1001 // Kas
      }
    ];

    const isConsultant = storeType.includes("Konsultan") || storeType.includes("Desain");
    const isContractor = storeType.includes("Kontraktor") || storeType.includes("Konstruksi") || storeType.includes("Supplier");

    // Add restock / cost inputs
    demoStock.forEach((item, idx) => {
      const qtyPurchased = idx === 0 ? 50 : (idx === 1 ? 120 : 30);
      const buyPrice = item.avgPurchasePrice;
      const rawCost = qtyPurchased * buyPrice;

      const buyDesc = isConsultant 
        ? `Alokasi Biaya Produksi & Lisensi Software — ${item.name}`
        : isContractor 
          ? `Pembelian Material Konstruksi dari Pabrik/Distributor — ${item.name} (${qtyPurchased} ${item.unit})`
          : `Kulakan / Restock ${item.name} sebanyak ${qtyPurchased} ${item.unit}`;

      demoTx.push({
        id: `demo-tx-buy-${idx}`,
        date: `${datePrefix}03`,
        description: buyDesc,
        amount: rawCost,
        type: 'Pembelian',
        stockItemId: item.id,
        stockQuantity: qtyPurchased,
        stockPricePerUnit: buyPrice,
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1003, // Persediaan
        creditAccount: 1001  // Kas
      });
    });

    // Add sales events 
    demoStock.forEach((item, idx) => {
      const qtySold = idx === 0 ? 5 : (idx === 1 ? 20 : 10);
      const sellingPrice = item.sellPrice;
      const salesTotal = qtySold * sellingPrice;
      const costOfSale = qtySold * item.avgPurchasePrice;

      const sellDesc = isConsultant
        ? `Penagihan Termin Jasa Konsultasi / Desain — ${item.name} (${qtySold} ${item.unit})`
        : isContractor
          ? `Pengiriman & Penjualan Material Proyek Lapangan — ${item.name} (${qtySold} ${item.unit})`
          : `Penjualan ${storeType} — ${item.name} sebanyak ${qtySold} ${item.unit}`;

      demoTx.push({
        id: `demo-tx-sell-${idx}`,
        date: `${datePrefix}05`,
        description: sellDesc,
        amount: salesTotal,
        type: 'Penjualan',
        stockItemId: item.id,
        stockQuantity: qtySold,
        stockPricePerUnit: sellingPrice,
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1001, // Kas
        creditAccount: 4001, // Pendapatan
        hppAmountPosted: costOfSale
      });
    });

    // Add Credit Sales (Penjualan Kredit) to populate Daftar Piutang Pelanggan & Aging
    const todayObj = new Date();
    const curYear = todayObj.getFullYear();
    const curMonth = String(todayObj.getMonth() + 1).padStart(2, "0");
    const curDay = String(todayObj.getDate()).padStart(2, "0");
    const todayDateStr = `${curYear}-${curMonth}-${curDay}`;

    // Overdue 25 days (Aging bucket: Lewat 1-30 Hari)
    const overdueDate1 = new Date(todayObj.getTime() - (25 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const txnDate1 = new Date(todayObj.getTime() - (55 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // Overdue 48 days (Aging bucket: Lewat 31-60 Hari)
    const overdueDate2 = new Date(todayObj.getTime() - (48 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const txnDate2 = new Date(todayObj.getTime() - (78 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // Current / In-term (Due in 14 days, Belum Jatuh Tempo)
    const currentDueDate = new Date(todayObj.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    demoTx.push(
      {
        id: "demo-kredit-001",
        date: txnDate1,
        dueDate: overdueDate1,
        invoiceNumber: "FPK/2026/001",
        customerName: "PT Sumber Rejeki Abadi",
        customerPhone: "0812-8877-6655",
        customerAddress: "Jl. Industri Raya No. 12, Cikarang",
        description: `Penjualan Kredit Grosir Termin 30 Hari — PT Sumber Rejeki Abadi`,
        amount: 3500000,
        paidAmount: 1000000,
        remainingAmount: 2500000,
        type: 'Penjualan Kredit',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1002, // Piutang Usaha
        creditAccount: 4001, // Pendapatan Penjualan
        isCreditSale: true,
        status: 'partial'
      },
      {
        id: "demo-kredit-002",
        date: txnDate2,
        dueDate: overdueDate2,
        invoiceNumber: "FPK/2026/002",
        customerName: "Koperasi Karyawan Sejahtera",
        customerPhone: "0813-2233-4455",
        customerAddress: "Kawasan Industri MM2100",
        description: `Penjualan Kredit Paket Usaha — Koperasi Karyawan Sejahtera`,
        amount: 1800000,
        paidAmount: 0,
        remainingAmount: 1800000,
        type: 'Penjualan Kredit',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1002, // Piutang Usaha
        creditAccount: 4001,
        isCreditSale: true,
        status: 'unpaid'
      },
      {
        id: "demo-kredit-003",
        date: todayDateStr,
        dueDate: currentDueDate,
        invoiceNumber: "FPK/2026/003",
        customerName: "Toko Grosir Berkah Barokah",
        customerPhone: "0817-9988-1122",
        customerAddress: "Jl. Surya Kencana No. 88, Bogor",
        description: `Penjualan Kredit Barang Dagang Tempo 14 Hari — Toko Berkah Barokah`,
        amount: 2750000,
        paidAmount: 750000,
        remainingAmount: 2000000,
        type: 'Penjualan Kredit',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1002, // Piutang Usaha
        creditAccount: 4001,
        isCreditSale: true,
        status: 'partial'
      }
    );

    // Add common utility & payroll payments
    const salDesc = isConsultant
      ? `Honor Drafter, Desainer & Tenaga Ahli Studio — ${storeName}`
      : isContractor
        ? `Upah Mandor, Tenaga Tukang & Staf Logistik Proyek — ${storeName}`
        : `Gaji Bulanan Staf Operasional Toko — ${storeName}`;

    demoTx.push(
      {
        id: "demo-tx-util",
        date: `${datePrefix}09`,
        description: `Pembayaran Tagihan Air, Listrik, & Wi-Fi Operasional ${storeName}`,
        amount: 450000,
        type: 'Biaya Operasional',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 6003, // Beban utilitas
        creditAccount: 1001
      },
      {
        id: "demo-tx-sal",
        date: `${datePrefix}10`,
        description: salDesc,
        amount: 1200000,
        type: 'Biaya Operasional',
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 6001, // Beban Gaji
        creditAccount: 1001
      }
    );

    saveState(demoTx, demoStock);
  };

  const handleLoadDemoData = () => {
    handleLoadCustomDemoData(storeConfig);
    setWelcomeBanner(`Data Demo ${storeConfig.storeName} (${storeConfig.storeCity}) berhasil dimuat berdasarkan profil toko pilihan Anda!`);
  };

  // Compile calculations derived from actual transaction history
  const journalEntries = generateJournal(transactions);
  const stats = computeFinancialStats(transactions, journalEntries);

  // Strict Authentication Gate:
  // User cannot touch or tamper with the main accounting workspace before logging in or entering demo mode
  if (showLandingPage || !currentUser) {
    return (
      <>
        <LandingPage 
          onLoginSuccess={handleLoginSuccess} 
          initialAuthMode={landingInitialMode}
          onOpenActivationModal={() => setShowActivationModal(true)}
          isActivated={!!activeLicense}
        />
        <ActivationModal
          isOpen={showActivationModal}
          onClose={() => setShowActivationModal(false)}
          onActivationSuccess={(lic) => {
            setActiveLicense(lic);
            setShowActivationModal(false);
            setWelcomeBanner(`Perangkat berhasil diaktivasi! Lisensi ${lic.licenseType === 'lifetime' ? 'Seumur Hidup' : lic.licenseType === 'annual' ? 'Tahunan' : 'Trial'} aktif untuk ${lic.ownerName}.`);
          }}
          allowDismiss={true}
        />
      </>
    );
  }

  const pageInfo = getPageDetails(activeTab, activeSubFilter);
  const lowStockCount = stockItems.filter(item => item.stock < 10).length;
  const isNeracaBalanced = Math.abs(stats.totalAssets - (stats.totalLiabilities + stats.totalEquity)) < 1;

  // Active Navbar Print Handler: directly prints current page document to printer
  const handleNavbarPrint = () => {
    let html = "";
    let title = "";
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "Toko Sembako Berkah Mandiri";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    if (activeTab === "penjualan" && activeSubFilter === "pengiriman") {
      // 1. Pengiriman: Cetak Surat Jalan & Daftar Pengiriman
      title = `Daftar Pengiriman Barang & Surat Jalan - ${companyName}`;
      let deliveriesList: any[] = [];
      try {
        const raw = localStorage.getItem("kledo_deliveries_v1");
        if (raw) deliveriesList = JSON.parse(raw);
      } catch (e) {}
      if (!deliveriesList || deliveriesList.length === 0) {
        deliveriesList = [
          {
            deliveryNumber: "SJ/2026/0001",
            customerName: "POS Customer",
            reference: "INV/00001",
            status: "terkirim",
            date: "2026-09-24",
            shippingDate: "2026-09-24",
            expedition: "Tiki",
            trackingNumber: "45679995555",
            warehouse: "Gudang Utama",
            items: [{ productName: "Custom Product (Baju Koko)", qty: 5, unit: "Pcs", unitPrice: 250000, total: 1250000 }]
          }
        ];
      }

      html = `
        <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              ${companyLogo}
              <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a;">${companyName}</h1>
              ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
              <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px;">
                <span style="font-size: 12px; font-weight: 900; color: #1d4ed8; text-transform: uppercase;">SURAT JALAN &amp; LOGISTIK</span>
              </div>
              <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">DAFTAR SURAT JALAN PENGIRIMAN</h2>
              <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Dicetak Tanggal: ${today}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 8px; text-align: left; width: 35px;">No</th>
                <th style="padding: 10px 8px; text-align: left;">Nomor SJ</th>
                <th style="padding: 10px 8px; text-align: left;">Pelanggan</th>
                <th style="padding: 10px 8px; text-align: left;">Ref Invoice</th>
                <th style="padding: 10px 8px; text-align: left;">Ekspedisi &amp; Resi</th>
                <th style="padding: 10px 8px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${deliveriesList.map((d: any, i: number) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; color: #64748b;">${i + 1}</td>
                  <td style="padding: 8px; font-weight: 700; font-family: monospace; color: #0284c7;">${d.deliveryNumber}</td>
                  <td style="padding: 8px; font-weight: 600; color: #0f172a;">${d.customerName}</td>
                  <td style="padding: 8px; font-family: monospace; color: #64748b;">${d.reference || "-"}</td>
                  <td style="padding: 8px; color: #334155;">
                    <strong>${d.expedition || "Kurir"}</strong>
                    ${d.trackingNumber ? `<br/><span style="font-size: 10px; font-family: monospace; color: #64748b;">Resi: ${d.trackingNumber}</span>` : ""}
                  </td>
                  <td style="padding: 8px; text-align: center;">
                    <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; background: ${d.status === 'terkirim' ? '#ecfdf5' : '#eff6ff'}; color: ${d.status === 'terkirim' ? '#047857' : '#1d4ed8'};">
                      ${d.status}
                    </span>
                  </td>
                </tr>
              `).join("")}
              <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; font-weight: 800;">
                <td colspan="4" style="padding: 10px 8px;">Total Pengiriman:</td>
                <td colspan="2" style="padding: 10px 8px; text-align: right; color: #0284c7; font-family: monospace;">${deliveriesList.length} Dokumen Surat Jalan</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
            </div>
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === "penjualan" && (activeSubFilter === "pemesanan" || activeSubFilter === "pemesanan-per-produk" || activeSubFilter === "tambah-pemesanan")) {
      // 2. Pemesanan / Sales Order
      title = `Daftar Pemesanan Penjualan (Sales Order) - ${companyName}`;
      let ordersList: any[] = [];
      try {
        const raw = localStorage.getItem("kledo_sales_orders_v1");
        if (raw) ordersList = JSON.parse(raw);
      } catch (e) {}
      if (!ordersList || ordersList.length === 0) {
        ordersList = [
          {
            orderNumber: "SO/2026/0001",
            customerName: "PT Sentosa Abadi",
            reference: "PO-SENTOSA-09",
            transactionDate: "2026-09-29",
            dueDate: "2026-10-15",
            status: "open",
            downPayment: 1500000,
            totalAmount: 5000000
          }
        ];
      }

      html = `
        <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              ${companyLogo}
              <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a;">${companyName}</h1>
              ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
              <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px;">
                <span style="font-size: 12px; font-weight: 900; color: #1d4ed8; text-transform: uppercase;">SALES ORDER</span>
              </div>
              <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">DAFTAR PEMESANAN PENJUALAN</h2>
              <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Dicetak Tanggal: ${today}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 8px; text-align: left; width: 35px;">No</th>
                <th style="padding: 10px 8px; text-align: left;">Nomor SO</th>
                <th style="padding: 10px 8px; text-align: left;">Pelanggan</th>
                <th style="padding: 10px 8px; text-align: left;">Jatuh Tempo</th>
                <th style="padding: 10px 8px; text-align: center;">Status</th>
                <th style="padding: 10px 8px; text-align: right;">Total Nilai</th>
              </tr>
            </thead>
            <tbody>
              ${ordersList.map((o: any, i: number) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; color: #64748b;">${i + 1}</td>
                  <td style="padding: 8px; font-weight: 700; font-family: monospace; color: #0284c7;">${o.orderNumber}</td>
                  <td style="padding: 8px; font-weight: 600; color: #0f172a;">${o.customerName}</td>
                  <td style="padding: 8px; font-family: monospace; color: #64748b;">${o.dueDate}</td>
                  <td style="padding: 8px; text-align: center; text-transform: uppercase; font-weight: 700; color: ${o.status === 'open' ? '#e11d48' : '#16a34a'};">${o.status}</td>
                  <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700;">Rp ${(o.totalAmount || 0).toLocaleString("id-ID")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
            </div>
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === "pos") {
      title = `Laporan Kasir POS & Rekap Produk Toko - ${companyName}`;
      html = `
        <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 850px; margin: 0 auto; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              ${companyLogo}
              <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a;">${companyName}</h1>
              ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
              <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Sistem Mesin Kasir Cepat Point of Sale (POS) SAK EMKM</p>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 12px; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase;">KASIR POS AKTIF</span>
              </div>
              <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;">REKAP KATALOG KASIR &amp; STOK</h2>
              <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Dicetak: ${today}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; font-size: 11px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <span style="color: #64748b; display: block;">Operator Kasir:</span>
              <strong style="color: #0f172a; font-size: 12px;">${currentUser?.name || "Kasir Utama"}</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <span style="color: #64748b; display: block;">Kalkulator Pajak:</span>
              <strong style="color: #047857; font-size: 12px;">PPN 11% (UU HPP No. 7)</strong>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
              <span style="color: #64748b; display: block;">Total Item Terdaftar:</span>
              <strong style="color: #2563eb; font-size: 12px;">${stockItems.length} Produk Siap Jual</strong>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 8px; text-align: left; width: 35px;">No</th>
                <th style="padding: 10px 8px; text-align: left;">Kode SKU</th>
                <th style="padding: 10px 8px; text-align: left;">Nama Produk Kasir</th>
                <th style="padding: 10px 8px; text-align: center;">Satuan</th>
                <th style="padding: 10px 8px; text-align: right;">Harga Jual</th>
                <th style="padding: 10px 8px; text-align: center;">Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              ${stockItems.slice(0, 30).map((stk, i) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; color: #64748b;">${i + 1}</td>
                  <td style="padding: 8px; font-weight: 700; font-family: monospace; color: #2563eb;">${stk.sku}</td>
                  <td style="padding: 8px; font-weight: 600; color: #0f172a;">${stk.name}</td>
                  <td style="padding: 8px; text-align: center; color: #64748b;">${stk.unit}</td>
                  <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700;">Rp ${stk.sellPrice.toLocaleString("id-ID")}</td>
                  <td style="padding: 8px; text-align: center; font-weight: 700; color: ${stk.stock <= 5 ? '#e11d48' : '#0f172a'};">${stk.stock}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Operator Kasir,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Kasir Toko"}</p>
            </div>
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Penanggung Jawab,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
            </div>
          </div>
        </div>
      `;
    } else {
      // 3. Ringkasan Laporan Finansial & Halaman Aktif SAK EMKM
      const pageDetails = getPageDetails(activeTab, activeSubFilter);
      title = `${pageDetails.title} - ${companyName}`;
      html = `
        <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              ${companyLogo}
              <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a;">${companyName}</h1>
              ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
              <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
            </div>
            <div style="text-align: right;">
              <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px;">
                <span style="font-size: 12px; font-weight: 900; color: #1d4ed8; text-transform: uppercase;">${pageDetails.title}</span>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">Periode: Tahun Buku 2026 &bull; ${today}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Pendapatan</div>
              <div style="font-size: 16px; font-weight: 800; color: #16a34a; margin-top: 4px; font-family: monospace;">Rp ${stats.revenue.toLocaleString("id-ID")}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Beban &amp; Biaya</div>
              <div style="font-size: 16px; font-weight: 800; color: #dc2626; margin-top: 4px; font-family: monospace;">Rp ${stats.expenses.toLocaleString("id-ID")}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Laba Bersih Usaha</div>
              <div style="font-size: 16px; font-weight: 800; color: #2563eb; margin-top: 4px; font-family: monospace;">Rp ${stats.netProfit.toLocaleString("id-ID")}</div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">Indikator Kepatuhan Neraca &amp; Arus Kas:</h3>
            <div style="display: flex; gap: 20px; font-size: 11px;">
              <div>Status Neraca: <strong style="color: ${isNeracaBalanced ? '#16a34a' : '#d97706'};">${isNeracaBalanced ? 'Seimbang (Aktiva = Pasiva)' : 'Aktif'}</strong></div>
              <div>Total Aset: <strong style="font-family: monospace;">Rp ${stats.totalAssets.toLocaleString("id-ID")}</strong></div>
              <div>Total Ekuitas: <strong style="font-family: monospace;">Rp ${stats.totalEquity.toLocaleString("id-ID")}</strong></div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
                <th style="padding: 8px; text-align: left;">Tanggal</th>
                <th style="padding: 8px; text-align: left;">Keterangan / Transaksi</th>
                <th style="padding: 8px; text-align: left;">Jenis</th>
                <th style="padding: 8px; text-align: right;">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.slice(0, 10).map((tx) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-family: monospace;">${tx.date}</td>
                  <td style="padding: 8px; font-weight: 600;">${tx.description}</td>
                  <td style="padding: 8px; color: #64748b;">${tx.type}</td>
                  <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700;">Rp ${tx.amount.toLocaleString("id-ID")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
            </div>
            <div style="text-align: center; width: 180px;">
              <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
              <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
            </div>
          </div>
        </div>
      `;
    }

    setNavbarPrintHtml(html);
    setNavbarPrintTitle(title);
    printInPageDOM(html, title);
    setNavbarPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative" id="applet-container">
      
      {/* 1. Sticky Demo Mode Notice Banner */}
      {currentUser?.isDemo && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-700 text-white px-4 md:px-8 py-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs z-30 sticky top-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-black/20 rounded-md shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </span>
            <div>
              <p className="font-extrabold tracking-wide flex items-center gap-1.5 leading-tight">
                <span>Mode Akun Demo — Tinjauan & Uji Coba Fitur Pembukuan SAK EMKM</span>
              </p>
              <p className="text-[11px] text-amber-100/90 leading-tight">
                Anda mencoba simulasi toko <strong>{storeConfig.storeName}</strong> ({storeConfig.storeType} · {storeConfig.storeCity}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleLogout("register")}
              className="px-3 py-1 bg-white text-slate-950 hover:bg-amber-50 rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
            >
              ✨ Buat Toko Baru
            </button>
            <button
              onClick={() => handleLogout("login")}
              className="px-2.5 py-1 bg-black/25 hover:bg-black/35 text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-white/20"
            >
              Keluar Demo
            </button>
          </div>
        </div>
      )}

      {/* 2. Welcome notification banner */}
      {welcomeBanner && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 md:px-8 py-2 text-xs text-indigo-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{welcomeBanner}</span>
          </div>
          <button 
            onClick={() => setWelcomeBanner(null)}
            className="text-indigo-400 hover:text-indigo-800 font-bold text-xs p-1 cursor-pointer"
            title="Tutup pemberitahuan"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Modern Cloud Accounting Layout: Left Sidebar + Right Workspace */}
      <div className="flex min-h-screen">
        
        {/* Left Sidebar Navigation (Kledo / Modern SaaS Style with Prominent Search) */}
        <SidebarNav
          activeTab={activeTab}
          activeSubFilter={activeSubFilter}
          onSelectTab={(tabId, subFilter) => {
            setActiveTab(tabId);
            setActiveSubFilter(subFilter);
          }}
          storeConfig={storeConfig}
          currentUser={currentUser}
          onLogout={() => handleLogout("login")}
          onOpenLanding={() => {
            setLandingInitialMode(currentUser?.isDemo ? "demo" : "login");
            setShowLandingPage(true);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          transactionCount={transactions.length}
          stockCount={stockItems.length}
          lowStockCount={lowStockCount}
          isBalanced={isNeracaBalanced}
          searchQuery={navbarSearchQuery}
          onSearchChange={setNavbarSearchQuery}
          onOpenActivationModal={() => setShowActivationModal(true)}
          isActivated={!!activeLicense}
          onUpdateLogo={handleUpdateStoreLogo}
        />

        {/* Right Main Application Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-68"
        }`}>
          
          {/* Top Application Header Bar - Single Unified Navbar */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 min-w-0">
              
              {/* Left Group: Mobile Toggle, Store Brand, Breadcrumbs */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Buka Menu Navigasi"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Informasi Toko Sembako Berkah Mandiri Badge */}
                <div 
                  onClick={() => {
                    setActiveTab("pengaturan");
                    setActiveSubFilter("profil");
                  }}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer shrink-0"
                  title="Klik untuk membuka informasi toko & profil usaha"
                >
                  {/* Dynamic Logo Box with quick upload option */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      headerLogoInputRef.current?.click();
                    }}
                    title="Klik untuk mengganti logo perusahaan"
                    className="relative group w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-xs cursor-pointer border border-slate-200 bg-indigo-600 text-white flex items-center justify-center"
                  >
                    {storeConfig.storeLogo ? (
                      <img 
                        src={storeConfig.storeLogo} 
                        alt="Logo Usaha" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Store className="w-4 h-4 text-white" />
                    )}
                    {/* Hover overlay with Camera icon */}
                    <div className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px]">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
                    <input
                      ref={headerLogoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 3 * 1024 * 1024) {
                          alert("Ukuran berkas logo maksimal 3 MB!");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          if (dataUrl) handleUpdateStoreLogo(dataUrl);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-bold text-slate-900 truncate max-w-[130px] md:max-w-[170px]">
                        {storeConfig.storeName || "Toko Sembako Berkah Mandiri"}
                      </h2>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                        SAK EMKM
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {storeConfig.storeType} &bull; {storeConfig.storeCity}
                    </p>
                  </div>
                </div>

                {/* Breadcrumbs Navigation */}
                <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 min-w-0 pl-2 border-l border-slate-200">
                  {pageInfo.parentTitle && (
                    <>
                      <span 
                        className="hover:text-slate-600 transition cursor-pointer truncate max-w-[110px]"
                        onClick={() => {
                          if (pageInfo.parentTitle === "Kas & Bank") {
                            setActiveTab("transaksi");
                            setActiveSubFilter("mutasi");
                          } else if (pageInfo.parentTitle === "Penjualan") {
                            setActiveTab("penjualan");
                            setActiveSubFilter("overview");
                          } else if (pageInfo.parentTitle === "Pembelian") {
                            setActiveTab("pembelian");
                            setActiveSubFilter("overview");
                          } else {
                            setActiveTab(activeTab);
                            setActiveSubFilter(undefined);
                          }
                        }}
                      >
                        {pageInfo.parentTitle}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    </>
                  )}
                  <span className="text-slate-800 font-bold truncate max-w-[160px]">
                    {pageInfo.title}
                  </span>
                </div>
              </div>

              {/* Center / Search Input */}
              <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative" id="header-search-container">
                <div className="relative w-full flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={navbarSearchQuery}
                    onChange={(e) => setNavbarSearchQuery(e.target.value)}
                    placeholder="Cari menu, fitur, laporan, jurnal... (Ctrl+K)"
                    className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs pl-8 pr-12 py-1.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                  {navbarSearchQuery ? (
                    <button
                      onClick={() => setNavbarSearchQuery("")}
                      className="absolute right-2.5 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden lg:inline-block absolute right-2 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs pointer-events-none">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

              {/* Right Action Group: Buat Transaksi, NAVBAR PRINT (ACTIVE!), Lisensi, Profil, Keluar */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                
                {/* 1. Buat Transaksi */}
                <button
                  onClick={() => {
                    setActiveTab("transaksi");
                    setActiveSubFilter("input");
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-95 shrink-0"
                  title="Catat transaksi penjualan, pembelian, atau beban"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Buat Transaksi</span>
                  <span className="sm:hidden">+ Transaksi</span>
                </button>

                {/* 2. NAVBAR PRINT (AKTIF & LANGSUNG BISA DICETAK KE PRINTER) */}
                <button
                  type="button"
                  onClick={handleNavbarPrint}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-95 shrink-0"
                  title="Cetak Dokumen / Halaman Aktif Langsung ke Printer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Print</span>
                </button>

                {/* 3. Status Lisensi Hardware */}
                <button
                  onClick={() => setShowActivationModal(true)}
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer shadow-2xs shrink-0 ${
                    activeLicense 
                      ? activeLicense.licenseType === "trial" 
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100" 
                        : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 animate-pulse"
                  }`}
                  title="Status Lisensi Komputer"
                >
                  <KeyRound className={`w-3.5 h-3.5 ${activeLicense ? (activeLicense.licenseType === "trial" ? "text-amber-600" : "text-emerald-600") : "text-rose-600"}`} />
                  <span className="hidden md:inline">
                    {activeLicense 
                      ? `Lisensi: ${activeLicense.licenseType === "lifetime" ? "Aktif" : activeLicense.licenseType === "annual" ? "Tahunan" : "Trial"}`
                      : "🔑 Aktivasi"}
                  </span>
                </button>

                {/* 4. Profil dan Pengaturan Usaha */}
                <button
                  onClick={() => {
                    setActiveTab("pengaturan");
                    setActiveSubFilter("profil");
                  }}
                  className={`hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                    activeTab === "pengaturan"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                  }`}
                  title="Profil dan Pengaturan Usaha"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengaturan</span>
                </button>

                {/* 5. User Profile Icon */}
                <div 
                  onClick={() => {
                    setActiveTab("pengaturan");
                    setActiveSubFilter("profil");
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 transition cursor-pointer shrink-0"
                  title={`Profil: ${currentUser?.name || "Budi Santoso"}`}
                >
                  <div className="w-5 h-5 rounded-lg bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-[10px] shadow-2xs">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden xl:inline text-[11px] font-bold text-slate-800 leading-tight">
                    {currentUser?.name || "Budi"}
                  </span>
                </div>

                {/* 6. Keluar */}
                <button
                  onClick={() => handleLogout("login")}
                  className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer shrink-0"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-semibold">Keluar</span>
                </button>

              </div>
            </div>
          </header>

          {/* Main Workspace Body Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 md:space-y-6">
            
            {/* INTERCONNECTED & SYNCHRONIZED MODULE NAVBAR (KAS & BANK, PENJUALAN, PEMBELIAN, STOK) */}
            <NavigationSyncBar
              activeTab={activeTab}
              activeSubFilter={activeSubFilter}
              onNavigate={(tab, sub) => {
                setActiveTab(tab);
                setActiveSubFilter(sub);
              }}
              stockCount={stockItems.length}
            />

            {/* ROUTING VIEW MODULES */}
            <section className="transition-all duration-300">
              {activeTab === "dashboard" && (
                <FinanceDashboard
                  stats={stats}
                  transactions={transactions}
                  stockItems={stockItems}
                  onLoadDemoData={handleLoadDemoData}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                  storeConfig={storeConfig}
                />
              )}

              {/* Point of Sale (Kasir POS) */}
              {activeTab === "pos" && (
                <PointOfSale
                  storeConfig={storeConfig}
                  stockItems={stockItems}
                  currentUser={currentUser}
                  onAddTransaction={handleAddTransaction}
                  onDeductStock={handleDeductStock}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Penjualan > Tagihan (List) OR Tambah Tagihan (Create Form) OR activeTab === "tagihan" */}
              {(activeTab === "tagihan" || (activeTab === "penjualan" && (activeSubFilter === "tagihan" || activeSubFilter === "tambah-tagihan" || activeSubFilter === "form-tagihan"))) && (
                <InvoiceManager
                  stockItems={stockItems}
                  storeConfig={storeConfig}
                  currentUser={currentUser}
                  onAddTransaction={handleAddTransaction}
                  onDeductStock={handleDeductStock}
                  initialViewMode={activeSubFilter === "tambah-tagihan" || activeSubFilter === "form-tagihan" ? "create" : "list"}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Penjualan > Pengiriman (Surat Jalan, Ekspedisi & Laporan Pengiriman) */}
              {activeTab === "penjualan" && activeSubFilter === "pengiriman" && (
                <DeliveryManager
                  storeConfig={storeConfig}
                  stockItems={stockItems}
                  currentUser={currentUser}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Penjualan > Pemesanan (Sales Order, Tambah Pemesanan & Pemesanan per Produk) */}
              {activeTab === "penjualan" && (activeSubFilter === "pemesanan" || activeSubFilter === "tambah-pemesanan" || activeSubFilter === "pemesanan-per-produk") && (
                <OrderManager
                  storeConfig={storeConfig}
                  stockItems={stockItems}
                  currentUser={currentUser}
                  initialMode={activeSubFilter === "pemesanan-per-produk" ? "report" : "list"}
                  initialShowCreate={activeSubFilter === "tambah-pemesanan"}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Penjualan > Overview (Default) */}
              {activeTab === "penjualan" && 
                activeSubFilter !== "tagihan" && 
                activeSubFilter !== "tambah-tagihan" && 
                activeSubFilter !== "form-tagihan" && 
                activeSubFilter !== "pengiriman" && 
                activeSubFilter !== "pemesanan" && 
                activeSubFilter !== "tambah-pemesanan" && 
                activeSubFilter !== "pemesanan-per-produk" && (
                <SalesOverview
                  transactions={transactions}
                  stockItems={stockItems}
                  storeConfig={storeConfig}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Pembelian > Tagihan Pembelian & Piutang (Sub Navbar) */}
              {activeTab === "pembelian" && (
                <PurchaseManager
                  stockItems={stockItems}
                  storeConfig={storeConfig}
                  currentUser={currentUser}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  initialSubTab={activeSubFilter as any || "tagihan"}
                  onSubTabChange={(newSubTab) => setActiveSubFilter(newSubTab)}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {activeTab === "transaksi" && (
                <TransactionFormAndJournal
                  transactions={transactions}
                  stockItems={stockItems}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onClearTransactions={handleClearTransactions}
                  storeConfig={storeConfig}
                  initialSubTab={activeSubFilter as any}
                  onSubTabChange={(newSubTab) => setActiveSubFilter(newSubTab)}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {activeTab === "stok" && (
                <StockManager
                  stockItems={stockItems}
                  onAddStockItem={handleAddStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                  initialView={activeSubFilter}
                  storeConfig={storeConfig}
                />
              )}

              {/* Laporan > Pengiriman Penjualan OR Ongkos Kirim per Ekspedisi */}
              {activeTab === "laporan" && (activeSubFilter === "pengiriman" || activeSubFilter === "ongkir") && (
                <DeliveryManager
                  storeConfig={storeConfig}
                  stockItems={stockItems}
                  currentUser={currentUser}
                  initialMode={activeSubFilter === "ongkir" ? "ongkir" : "report"}
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {/* Laporan > Pemesanan per Produk */}
              {activeTab === "laporan" && (activeSubFilter === "pemesanan" || activeSubFilter === "pemesanan-per-produk") && (
                <OrderManager
                  storeConfig={storeConfig}
                  stockItems={stockItems}
                  currentUser={currentUser}
                  initialMode="report"
                  onNavigateToTab={(tab, sub) => {
                    setActiveTab(tab);
                    if (sub) setActiveSubFilter(sub);
                  }}
                />
              )}

              {activeTab === "laporan" && activeSubFilter !== "pengiriman" && activeSubFilter !== "ongkir" && activeSubFilter !== "pemesanan" && activeSubFilter !== "pemesanan-per-produk" && (
                <FinancialStatements
                  stats={stats}
                  transactions={transactions}
                  stockItems={stockItems}
                  journal={journalEntries}
                  storeConfig={storeConfig}
                  onImportTransactions={handleImportExcelData}
                  onUpdateTransactions={(newTxs) => saveState(newTxs, stockItems)}
                  initialReport={activeSubFilter as any}
                  onReportChange={(newReport) => setActiveSubFilter(newReport)}
                />
              )}

              {activeTab === "pajak" && (
                <TaxCalculator
                  stats={stats}
                  storeConfig={storeConfig}
                  initialMode={activeSubFilter as any}
                />
              )}

              {activeTab === "dokumen" && (
                <AccountDocumentation 
                  storeConfig={storeConfig} 
                  initialTab={activeSubFilter as any}
                />
              )}

              {activeTab === "asisten" && (
                <AiAssistant
                  stats={stats}
                  transactions={transactions}
                  stockItems={stockItems}
                  storeConfig={storeConfig}
                  initialMode={activeSubFilter}
                />
              )}

              {activeTab === "pengaturan" && (
                <div className="space-y-6">
                  <StoreSettings
                    config={storeConfig}
                    onSaveConfig={handleSaveStoreConfig}
                    onLoadCustomDemoData={handleLoadCustomDemoData}
                    onOpenActivationModal={() => setShowActivationModal(true)}
                  />
                  <CloudSync
                    transactions={transactions}
                    stockItems={stockItems}
                    storeConfig={storeConfig}
                    onSyncImport={handleSyncImport}
                  />
                </div>
              )}
            </section>

          </main>

          {/* Humble SAK EMKM footer */}
          <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-[10px] text-slate-400 select-none mt-auto">
            <div className="max-w-7xl mx-auto px-4 space-y-1">
              <p className="font-medium text-slate-500">
                © 2026 Akuntan AI UMKM — Sistem Akuntansi Pintar SAK EMKM Ikatan Akuntan Indonesia (IAI).
              </p>
              <p className="font-mono text-[9px] text-slate-400">
                Arsitektur Offline-First: Seluruh data pembukuan, transaksi, dan stok tersimpan terenkripsi di penyimpanan lokal browser Anda.
              </p>
            </div>
          </footer>

        </div>

      </div>

      {/* Hardware Activation & Anti-Piracy License Modal */}
      <ActivationModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        onActivationSuccess={(lic) => {
          setActiveLicense(lic);
          setShowActivationModal(false);
          setWelcomeBanner(`Perangkat berhasil diaktivasi! Lisensi ${lic.licenseType === 'lifetime' ? 'Seumur Hidup' : lic.licenseType === 'annual' ? 'Tahunan' : 'Trial'} aktif untuk ${lic.ownerName}.`);
        }}
        allowDismiss={true}
      />

      {/* Universal Print Modal for Navbar Print Button */}
      <UniversalPrintModal
        isOpen={navbarPrintModalOpen}
        onClose={() => setNavbarPrintModalOpen(false)}
        title={navbarPrintTitle || "Cetak Dokumen SAK EMKM"}
        htmlContent={navbarPrintHtml}
      />

    </div>
  );
}
