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
  Settings
} from "lucide-react";
import { Transaction, StockItem, FinancialStats, StoreConfig } from "./types";
import { 
  generateJournal, 
  computeFinancialStats, 
  recalculateInventoryAverage 
} from "./utils/accountingEngine";

// Import modules
import { FinanceDashboard } from "./components/FinanceDashboard";
import { TransactionFormAndJournal } from "./components/TransactionFormAndJournal";
import { StockManager } from "./components/StockManager";
import { FinancialStatements } from "./components/FinancialStatements";
import { TaxCalculator } from "./components/TaxCalculator";
import { AiAssistant } from "./components/AiAssistant";
import { StoreSettings, DEFAULT_STORE_CONFIG } from "./components/StoreSettings";
import { CloudSync } from "./components/CloudSync";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

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

    // Add restock inputs
    demoStock.forEach((item, idx) => {
      const qtyPurchased = idx === 0 ? 50 : (idx === 1 ? 120 : 30);
      const buyPrice = item.avgPurchasePrice;
      const rawCost = qtyPurchased * buyPrice;

      demoTx.push({
        id: `demo-tx-buy-${idx}`,
        date: `${datePrefix}03`,
        description: `Kulakan / Restock ${item.name} sebanyak ${qtyPurchased} ${item.unit}`,
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

      demoTx.push({
        id: `demo-tx-sell-${idx}`,
        date: `${datePrefix}05`,
        description: `Penjualan ${storeType} - ${item.name} sebanyak ${qtySold} ${item.unit}`,
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

    // Add common utility payments
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
        description: `Gaji Bulanan Staf Operasional Toko — ${storeName}`,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="applet-container">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs">
              <Coins className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                AKUNTAN AI <span className="text-[10px] bg-slate-150 border text-slate-600 px-2 py-0.5 rounded-full font-bold">V1.0</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">Pembukuan Pintar <strong>{storeConfig.storeName}</strong> ({storeConfig.storeCity}) — SAK EMKM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span 
              onClick={() => setActiveTab("pengaturan")}
              className="hidden md:inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              <span>Usaha: {storeConfig.storeType} ({storeConfig.storeCity}) ⚙️</span>
            </span>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold">WAKTU AKTIF (UTC)</p>
              <p className="text-xs font-mono font-bold text-slate-700">2026-06-11</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-8">
        
        {/* Navigation Bar Selector */}
        <nav className="flex overflow-x-auto gap-2 bg-white p-2 border border-slate-100 rounded-2xl shadow-xs" id="nav-tabs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "dashboard" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Ringkasan Toko (Dashboard)
          </button>
          
          <button
            onClick={() => setActiveTab("transaksi")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "transaksi" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Jurnal &amp; Mutasi Kas
          </button>
          
          <button
            onClick={() => setActiveTab("stok")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "stok" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stok Barang (HPP)
          </button>

          <button
            onClick={() => setActiveTab("laporan")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "laporan" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Laporan Keuangan
          </button>

          <button
            onClick={() => setActiveTab("pajak")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "pajak" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Percent className="w-4 h-4" />
            Perpajakan UMKM
          </button>

          <button
            onClick={() => setActiveTab("asisten")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "asisten" 
                ? "bg-violet-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-indigo-800 hover:bg-indigo-50/50"
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            Tanya Akuntan AI ✨
          </button>

          <button
            onClick={() => setActiveTab("pengaturan")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "pengaturan" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            Profil Toko Saya
          </button>
        </nav>

        {/* ACTIVE MODULE VIEW SWITCH ROUTING */}
        <section className="transition-all duration-300">
          {activeTab === "dashboard" && (
            <FinanceDashboard
              stats={stats}
              transactions={transactions}
              stockItems={stockItems}
              onLoadDemoData={handleLoadDemoData}
              onNavigateToTab={setActiveTab}
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
            />
          )}

          {activeTab === "stok" && (
            <StockManager
              stockItems={stockItems}
              onAddStockItem={handleAddStockItem}
              onDeleteStockItem={handleDeleteStockItem}
            />
          )}

          {activeTab === "laporan" && (
            <FinancialStatements
              stats={stats}
              transactions={transactions}
              stockItems={stockItems}
              journal={journalEntries}
              storeConfig={storeConfig}
            />
          )}

          {activeTab === "pajak" && (
            <TaxCalculator
              stats={stats}
              storeConfig={storeConfig}
            />
          )}

          {activeTab === "asisten" && (
            <AiAssistant
              stats={stats}
              transactions={transactions}
              stockItems={stockItems}
              storeConfig={storeConfig}
            />
          )}

          {activeTab === "pengaturan" && (
            <div className="space-y-6">
              <StoreSettings
                config={storeConfig}
                onSaveConfig={handleSaveStoreConfig}
                onLoadCustomDemoData={handleLoadCustomDemoData}
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

      {/* Humble footer */}
      <footer className="bg-white border-t border-slate-150 py-6 text-center text-[10px] text-slate-400 select-none pb-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 Akuntan AI UMKM — Solusi Pintar Pembukuan sesuai SAK EMKM Ikatan Akuntan Indonesia.</p>
          <p className="font-mono text-[9px] text-slate-300">
            Platform built-in sandboxed local storage engine. Semua data rahasia keuangan Anda 100% tersimpan aman di peramban (offline-first).
          </p>
        </div>
      </footer>
    </div>
  );
}
