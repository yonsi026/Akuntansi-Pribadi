import { useState, useEffect } from "react";
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
  KeyRound
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
import { getCurrentUser, logoutUser } from "./utils/authService";
import { getActiveLicense, LicenseData } from "./utils/licenseManager";

const TAB_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Ringkasan Toko", subtitle: "Executive Dashboard & Posisi Finansial SAK EMKM" },
  transaksi: { title: "Jurnal & Transaksi", subtitle: "Pencatatan Mutasi Kas & Entri SAK EMKM" },
  stok: { title: "Stok Barang (HPP)", subtitle: "Manajemen Persediaan & Biaya Pokok Penjualan" },
  laporan: { title: "Laporan Keuangan", subtitle: "Laba Rugi, Neraca, Arus Kas & Ekspor Excel" },
  pajak: { title: "Perpajakan UMKM", subtitle: "Kalkulator PPh Final 0.5% (PP 23) & PPN" },
  dokumen: { title: "Bagan Akun (COA)", subtitle: "Daftar Kode Akun Standar SAK EMKM" },
  asisten: { title: "Tanya Akuntan AI ✨", subtitle: "Asisten Cerdas & Audit Kesehatan Bisnis" },
  pengaturan: { title: "Profil Toko & Cadangan", subtitle: "Informasi Usaha, NPWP & Cloud Sync" },
};

export const getPageDetails = (tab: string, subFilter?: string): { title: string; subtitle: string; parentTitle?: string } => {
  if (tab === "transaksi") {
    if (subFilter === "invoice") {
      return { title: "Tagihan", subtitle: "Daftar tagihan penjualan, detil faktur INV, ekspedisi & penerimaan pembayaran kas", parentTitle: "Penjualan" };
    }
    if (subFilter === "jurnal") {
      return { title: "Buku Jurnal Umum", subtitle: "Daftar Entri Jurnal Double-Entry Berpasangan Standar SAK EMKM", parentTitle: "Jurnal & Transaksi" };
    }
    if (subFilter === "mutasi") {
      return { title: "Buku Kas & Mutasi", subtitle: "Riwayat Arus Kas Masuk & Kas Keluar Lengkap", parentTitle: "Jurnal & Transaksi" };
    }
    if (subFilter === "bukubesar") {
      return { title: "Buku Besar per Akun", subtitle: "Buku Besar Pembantu & Mutasi Saldo Kode Akun SAK EMKM", parentTitle: "Jurnal & Transaksi" };
    }
    return { title: "Catat Transaksi Baru", subtitle: "Input Transaksi Kas, Penjualan & Beban Operasional", parentTitle: "Jurnal & Transaksi" };
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
    if (subFilter === "ekspor") {
      return { title: "Unduh File Excel (.xlsx)", subtitle: "Ekspor Seluruh Laporan Keuangan ke Microsoft Excel", parentTitle: "Laporan Keuangan" };
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
    alert(`Data Demo ${storeConfig.storeName} (${storeConfig.storeCity}) berhasil dimuat berdasarkan profil toko pilihan Anda!`);
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
        />

        {/* Right Main Application Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-68"
        }`}>
          
          {/* Top Application Header Bar */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 md:px-8 py-3 shadow-2xs space-y-3">
            
            {/* ROW 1: Informasi Toko Sembako Berkah Mandiri & Status Usaha */}
            <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-slate-100">
              
              {/* Left: Mobile Toggle + Store Identity & Breadcrumbs */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                  className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer shrink-0"
                  title="Klik untuk membuka informasi toko & profil usaha"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xs font-bold text-slate-900 truncate">
                        {storeConfig.storeName || "Toko Sembako Berkah Mandiri"}
                      </h2>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                        SAK EMKM
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {storeConfig.storeType} &bull; {storeConfig.storeCity}
                    </p>
                  </div>
                </div>

                {/* Breadcrumbs Navigation */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 min-w-0 pl-2 border-l border-slate-200">
                  {pageInfo.parentTitle && (
                    <>
                      <span 
                        className="hover:text-slate-600 transition cursor-pointer truncate max-w-[130px]"
                        onClick={() => {
                          setActiveTab(activeTab);
                          setActiveSubFilter(undefined);
                        }}
                      >
                        {pageInfo.parentTitle}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    </>
                  )}
                  <span className="text-slate-800 font-bold truncate max-w-[180px]">
                    {pageInfo.title}
                  </span>
                </div>
              </div>

              {/* Right: Kepatuhan Standar & Indikator Neraca */}
              <div className="hidden md:flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Neraca {isNeracaBalanced ? "Seimbang" : "Aktif"}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Tahun Buku 2026
                </span>
              </div>

            </div>

            {/* ROW 2 (DIBAWAH INFORMASI TOKO): Mode Pencarian, Buat Transaksi, Lisensi Hardware, Profil dan Pengaturan Usaha, Lihat Landing Page */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Mode Pencarian */}
              <div className="flex-1 min-w-[220px] max-w-md relative" id="header-search-container">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={navbarSearchQuery}
                    onChange={(e) => setNavbarSearchQuery(e.target.value)}
                    placeholder="Cari menu, fitur, laporan, jurnal... (Ctrl+K)"
                    className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs pl-9 pr-14 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                  {navbarSearchQuery ? (
                    <button
                      onClick={() => setNavbarSearchQuery("")}
                      className="absolute right-3 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

              {/* Action Toolbar Group */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                
                {/* 1. Buat Transaksi */}
                <button
                  onClick={() => {
                    setActiveTab("transaksi");
                    setActiveSubFilter("input");
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-95"
                  title="Catat transaksi penjualan, pembelian, atau beban"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Buat Transaksi</span>
                </button>

                {/* 2. Status Lisensi Hardware Anti-Pembajakan */}
                <button
                  onClick={() => setShowActivationModal(true)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer shadow-2xs ${
                    activeLicense 
                      ? activeLicense.licenseType === "trial" 
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100" 
                        : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 animate-pulse"
                  }`}
                  title="Status Aktivasi & Serial Hardware Mesin Komputer"
                >
                  <KeyRound className={`w-3.5 h-3.5 ${activeLicense ? (activeLicense.licenseType === "trial" ? "text-amber-600" : "text-emerald-600") : "text-rose-600"}`} />
                  <span className="hidden sm:inline">
                    {activeLicense 
                      ? `Lisensi: ${activeLicense.licenseType === "lifetime" ? "Seumur Hidup" : activeLicense.licenseType === "annual" ? "Tahunan" : "Trial 30 Hari"}`
                      : "🔑 Aktivasi Hardware"}
                  </span>
                  <span className="sm:hidden">Lisensi</span>
                </button>

                {/* 3. Profil dan Pengaturan Usaha */}
                <button
                  onClick={() => {
                    setActiveTab("pengaturan");
                    setActiveSubFilter("profil");
                  }}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer ${
                    activeTab === "pengaturan"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                  }`}
                  title="Profil dan Pengaturan Usaha"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Profil &amp; Pengaturan Usaha</span>
                  <span className="sm:hidden">Pengaturan</span>
                </button>

                {/* 4. Lihat Landing Page & Brosur Fitur */}
                <button
                  onClick={() => {
                    setLandingInitialMode(currentUser?.isDemo ? "demo" : "login");
                    setShowLandingPage(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer shadow-2xs"
                  title="Lihat Landing Page & Brosur Fitur"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Lihat Landing Page &amp; Brosur Fitur</span>
                  <span className="md:hidden">Landing Page</span>
                </button>

                {/* 5. Profil User Account */}
                <div 
                  onClick={() => {
                    setActiveTab("pengaturan");
                    setActiveSubFilter("profil");
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 transition cursor-pointer"
                  title={`Profil Pengguna: ${currentUser?.name || "Budi Santoso"}`}
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-[11px] shadow-2xs">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-[11px] font-bold text-slate-800 leading-tight">
                      {currentUser?.name || "Budi Santoso"}
                    </span>
                    <span className="block text-[9px] text-slate-400 leading-none">
                      Profil
                    </span>
                  </div>
                </div>

                {/* 5. Keluar dari akun */}
                <button
                  onClick={() => handleLogout("login")}
                  className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-semibold">Keluar</span>
                </button>

              </div>

            </div>

          </header>

          {/* Main Workspace Body Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            
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

              {activeTab === "laporan" && (
                <FinancialStatements
                  stats={stats}
                  transactions={transactions}
                  stockItems={stockItems}
                  journal={journalEntries}
                  storeConfig={storeConfig}
                  onImportTransactions={handleImportExcelData}
                  initialReport={activeSubFilter as any}
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

    </div>
  );
}
