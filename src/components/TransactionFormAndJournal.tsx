import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  HelpCircle, 
  ArrowRightLeft, 
  BookOpen, 
  Coins, 
  ChevronRight,
  Trash2,
  Printer,
  FileText,
  CheckCircle
} from "lucide-react";
import { Transaction, TransactionType, StockItem, JournalEntry, LedgerItem, StoreConfig } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { generateJournal, computeLedger, formatIDR } from "../utils/accountingEngine";

interface TransactionFormAndJournalProps {
  transactions: Transaction[];
  stockItems: StockItem[];
  onAddTransaction: (txn: Omit<Transaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
  onClearTransactions: () => void;
  storeConfig?: StoreConfig;
}

export const TransactionFormAndJournal: React.FC<TransactionFormAndJournalProps> = ({
  transactions,
  stockItems,
  onAddTransaction,
  onDeleteTransaction,
  onClearTransactions,
  storeConfig
}) => {
  // Navigation for sub-tab: 'input' | 'jurnal' | 'bukubesar'
  const [subTab, setSubTab] = useState<'input' | 'jurnal' | 'bukubesar'>('input');

  // Form states and validation
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [successHeader, setSuccessHeader] = useState<string | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<TransactionType>("Penjualan");
  const [amount, setAmount] = useState<number>(0);
  const [ppnEnabled, setPpnEnabled] = useState<boolean>(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  // Account dropdown override states
  const [debitAccountSelect, setDebitAccountSelect] = useState<string>("1001");
  const [customDebitCategory, setCustomDebitCategory] = useState<string>("Aset");
  const [customDebitName, setCustomDebitName] = useState<string>("");
  const [creditAccountSelect, setCreditAccountSelect] = useState<string>("4001");
  const [customCreditCategory, setCustomCreditCategory] = useState<string>("Pendapatan");
  const [customCreditName, setCustomCreditName] = useState<string>("Akun Kredit Kustom");

  // Stock specifics
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [stockPricePerUnit, setStockPricePerUnit] = useState<number>(0);

  // Expense specifics
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState<number>(6005); // Beban Lain-lain

  // Ledger Filter State
  const [filteredAccountId, setFilteredAccountId] = useState<number>(1001); // Default Kas

  // Side-effect: auto-calculate amount if stock transaction is active
  useEffect(() => {
    if (type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan') {
      const selectedItem = stockItems.find(item => item.id === selectedStockItemId);
      if (selectedItem) {
        const unitPrice = (type === 'Pembelian Stok' || type === 'Pembelian')
          ? selectedItem.avgPurchasePrice || selectedItem.sellPrice * 0.7 
          : selectedItem.sellPrice;
        
        if (stockPricePerUnit === 0) {
          setStockPricePerUnit(Math.round(unitPrice));
        }
        setAmount(stockQuantity * (stockPricePerUnit || Math.round(unitPrice)));
      }
    }
  }, [selectedStockItemId, stockQuantity, stockPricePerUnit, type, stockItems]);

  // Adjust stock parameters on type change
  useEffect(() => {
    if (type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan') {
      if (stockItems.length > 0 && !selectedStockItemId) {
        setSelectedStockItemId(stockItems[0].id);
      }
    } else {
      setSelectedStockItemId("");
      setStockQuantity(1);
      setStockPricePerUnit(0);
    }
  }, [type, stockItems, selectedStockItemId]);

  // Synchronize dynamic recommended debit/credit accounts based on Transaction Type
  useEffect(() => {
    if (type === 'Penjualan' || type === 'Penjualan Stok') {
      setDebitAccountSelect("1001"); // Kas & Setara Kas
      setCreditAccountSelect("4001"); // Pendapatan Penjualan
    } else if (type === 'Pembelian' || type === 'Pembelian Stok') {
      setDebitAccountSelect("1003"); // Persediaan Barang Dagang
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Biaya Operasional' || type === 'Pengeluaran') {
      setDebitAccountSelect("6005"); // Beban Lain-lain
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Penerimaan') {
      setDebitAccountSelect("1001"); // Kas & Setara Kas
      setCreditAccountSelect("3001"); // Modal Pemilik
    } else if (type === 'Pembayaran Hutang') {
      setDebitAccountSelect("2001"); // Utang Usaha (Debit to reduce liability)
      setCreditAccountSelect("1001"); // Kas (Credit to reduce asset)
    } else if (type === 'Lainnya') {
      setDebitAccountSelect("1001"); // Kas & Setara Kas
      setCreditAccountSelect("6005"); // Beban Lain-lain
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHeader(null);
    setSuccessHeader(null);

    if (!date) {
      setErrorHeader("Tanggal transaksi wajib diisi!");
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (date > todayStr) {
      setErrorHeader("Tanggal transaksi tidak boleh lebih dari hari ini!");
      return;
    }

    if (!description.trim()) {
      setErrorHeader("Masukkan deskripsi transaksi terlebih dahulu!");
      return;
    }
    if (amount < 0) {
      setErrorHeader("Nilai dana transaksi tidak boleh bernilai negatif!");
      return;
    }
    if (amount === 0) {
      setErrorHeader("Jumlah uang harus lebih besar dari Rp 0!");
      return;
    }

    // Determine dual entry debit/credit IDs either from drop or customized options
    let debitAccount = 1001;
    let customDebitAccountName: string | undefined = undefined;

    if (debitAccountSelect !== "custom") {
      debitAccount = parseInt(debitAccountSelect);
    } else {
      if (!customDebitName.trim()) {
        setErrorHeader("Masukkan nama akun debit kustom Anda!");
        return;
      }
      customDebitAccountName = customDebitName.trim();
      if (customDebitCategory === "Aset") debitAccount = 1001;
      else if (customDebitCategory === "Liabilitas") debitAccount = 2001;
      else if (customDebitCategory === "Ekuitas") debitAccount = 3001;
      else if (customDebitCategory === "Pendapatan") debitAccount = 4001;
      else debitAccount = 6005; // Beban
    }

    let creditAccount = 4001;
    let customCreditAccountName: string | undefined = undefined;

    if (creditAccountSelect !== "custom") {
      creditAccount = parseInt(creditAccountSelect);
    } else {
      if (!customCreditName.trim()) {
        setErrorHeader("Masukkan nama akun kredit kustom Anda!");
        return;
      }
      customCreditAccountName = customCreditName.trim();
      if (customCreditCategory === "Aset") creditAccount = 1001;
      else if (customCreditCategory === "Liabilitas") creditAccount = 2001;
      else if (customCreditCategory === "Ekuitas") creditAccount = 3001;
      else if (customCreditCategory === "Pendapatan") creditAccount = 4001;
      else creditAccount = 6005; // Beban
    }

    // Detail inventory validation if relevant
    const isInventoryTx = type === 'Penjualan' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Pembelian Stok';
    if (isInventoryTx) {
      if (!selectedStockItemId) {
        setErrorHeader("Silakan pilih produk stok persediaan!");
        return;
      }
      if (stockQuantity <= 0) {
        setErrorHeader("Jumlah unit barang harus lebih besar dari 0!");
        return;
      }
      if (stockPricePerUnit < 0) {
        setErrorHeader("Harga per unit tidak boleh bernilai negatif!");
        return;
      }
    }

    // Generate automatic Invoice Number if empty
    const finalInvoiceNumber = invoiceNumber.trim() || `SK-${Date.now().toString().slice(-6)}`;

    // Tax processing
    const ppnAmount = ppnEnabled ? Math.round(amount - (amount / 1.11)) : 0;

    // Create payload
    const transactionData: Omit<Transaction, "id"> = {
      date,
      description: description.trim(),
      amount,
      type,
      ppnEnabled,
      ppnAmount,
      debitAccount,
      creditAccount,
      customDebitAccountName,
      customCreditAccountName,
      invoiceNumber: finalInvoiceNumber
    };

    // Attach stock properties if relevant
    if (isInventoryTx && selectedStockItemId) {
      transactionData.stockItemId = selectedStockItemId;
      transactionData.stockQuantity = stockQuantity;
      transactionData.stockPricePerUnit = stockPricePerUnit;
      
      const matchedItem = stockItems.find(i => i.id === selectedStockItemId);
      if ((type === 'Penjualan' || type === 'Penjualan Stok') && matchedItem) {
        // HPP = quantity sold * its average purchase price
        transactionData.hppAmountPosted = stockQuantity * matchedItem.avgPurchasePrice;
      }
    }

    onAddTransaction(transactionData);

    // Reset Form
    setDescription("");
    setAmount(0);
    setStockPricePerUnit(0);
    setPpnEnabled(false);
    setInvoiceNumber("");
    setCustomDebitName("");
    setCustomCreditName("");
    setSuccessHeader("Transaksi berhasil dijurnal secara otomatis!");
    setTimeout(() => setSuccessHeader(null), 5000);
  };

  // Generate lists
  const journalEntries = generateJournal(transactions);
  const totalJournalDebit = journalEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalJournalCredit = journalEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const isJournalBalanced = Math.abs(totalJournalDebit - totalJournalCredit) < 1;
  
  const selectedAccType = CHART_OF_ACCOUNTS.find(a => a.id === filteredAccountId);
  const ledgerEntries = selectedAccType 
    ? computeLedger(filteredAccountId, journalEntries, selectedAccType.normalBalance) 
    : [];
  const ledgerDebitMutasi = ledgerEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const ledgerCreditMutasi = ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0);

  return (
    <div className="space-y-6" id="transaksi-console">
      {/* Sub tabs header selection */}
      <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl no-print">
        <button
          onClick={() => setSubTab('input')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
            subTab === 'input' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Input Transaksi Harian
        </button>
        <button
          onClick={() => setSubTab('jurnal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
            subTab === 'jurnal' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Jurnal Umum (Berpasangan)
        </button>
        <button
          onClick={() => setSubTab('bukubesar')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
            subTab === 'bukubesar' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Buku Besar per Akun
        </button>
      </div>

      {subTab === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="input-view">
          {/* Main Enter Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Catat Transaksi Baru</h3>
                <p className="text-xs text-slate-400">Jurnal akuntansi berpasangan akan dibuat secara otomatis</p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                Double-Entry Engine
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Validation Feedback Messages */}
              {errorHeader && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-rose-600 block animate-ping shrink-0" />
                  <span>{errorHeader}</span>
                </div>
              )}
              {successHeader && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 block shrink-0" />
                  <span>{successHeader}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">No. Bukti / Faktur (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Misal: FT-2026-001 (Otomatis jika kosong)"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Kegiatan</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none"
                  >
                    <option value="Penjualan">Penjualan (Stok / Barang Dagang)</option>
                    <option value="Pembelian">Pembelian (Stok / Barang Dagang)</option>
                    <option value="Biaya Operasional">Biaya Operasional (Beban Usaha)</option>
                    <option value="Penerimaan">Penerimaan Modal / Kas Masuk</option>
                    <option value="Pembayaran Hutang">Pembayaran Utang Usaha</option>
                    <option value="Lainnya">Lainnya (Jurnal Kustom)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Uraian</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penjualan 10 Pcs Indomie Goreng, Pembayaran Gaji Karyawan Toko, dll"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none"
                />
              </div>

              {/* Stock Selector Details if relevant */}
              {(type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan') && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Detail Inventaris Stok</span>
                  
                  {stockItems.length === 0 ? (
                    <p className="text-xs text-rose-600 font-medium">
                      Anda belum memiliki persediaan produk di katalog. Mohon tambahkan produk di tab <strong>Stok Barang</strong> terlebih dahulu.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Item */}
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Barang</label>
                        <select
                          value={selectedStockItemId}
                          onChange={(e) => setSelectedStockItemId(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 outline-none"
                        >
                          {stockItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.stock} {item.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Jumlah (Unit)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 outline-none"
                        />
                      </div>

                      {/* Price Per Unit */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Harga per Unit (IDR)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={stockPricePerUnit}
                          onChange={(e) => setStockPricePerUnit(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Account Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Debit Account Selection */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Akun Debit (Penggunaan Dana)</span>
                      <span className="text-[9px] text-[var(--color-sky-700)] bg-[var(--color-sky-50)] px-2 py-0.5 rounded-full font-bold">Double-Entry</span>
                    </label>
                    <select
                      value={debitAccountSelect}
                      onChange={(e) => setDebitAccountSelect(e.target.value)}
                      className="w-full text-xs border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none"
                    >
                      {CHART_OF_ACCOUNTS.map(acc => (
                        <option key={acc.id} value={acc.id.toString()}>{acc.id} - {acc.name} ({acc.category})</option>
                      ))}
                      <option value="custom">+ Tulis Akun Baru (Manual)</option>
                    </select>
                  </div>
                  
                  {debitAccountSelect === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategori Akun</label>
                        <select
                          value={customDebitCategory}
                          onChange={(e) => setCustomDebitCategory(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2 py-1.5 outline-none"
                        >
                          <option value="Aset">Aset / Harta</option>
                          <option value="Liabilitas">Liabilitas / Utang</option>
                          <option value="Ekuitas">Ekuitas / Modal</option>
                          <option value="Pendapatan">Pendapatan</option>
                          <option value="Beban">Beban Operasional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Akun Baru</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Kas Laci, Piutang Mumun"
                          value={customDebitName}
                          onChange={(e) => setCustomDebitName(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit Account Selection */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Akun Kredit (Sumber Dana)</span>
                      <span className="text-[9px] text-[var(--color-emerald-700)] bg-[var(--color-emerald-50)] px-2 py-0.5 rounded-full font-bold font-sans">Double-Entry</span>
                    </label>
                    <select
                      value={creditAccountSelect}
                      onChange={(e) => setCreditAccountSelect(e.target.value)}
                      className="w-full text-xs border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none"
                    >
                      {CHART_OF_ACCOUNTS.map(acc => (
                        <option key={acc.id} value={acc.id.toString()}>{acc.id} - {acc.name} ({acc.category})</option>
                      ))}
                      <option value="custom">+ Tulis Akun Baru (Manual)</option>
                    </select>
                  </div>
                  
                  {creditAccountSelect === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategori Akun</label>
                        <select
                          value={customCreditCategory}
                          onChange={(e) => setCustomCreditCategory(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2 py-1.5 outline-none"
                        >
                          <option value="Aset">Aset / Harta</option>
                          <option value="Liabilitas">Liabilitas / Utang</option>
                          <option value="Ekuitas">Ekuitas / Modal</option>
                          <option value="Pendapatan">Pendapatan</option>
                          <option value="Beban">Beban Operasional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Akun Baru</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Pinjaman Saudara, Pendapatan Grosir"
                          value={customCreditName}
                          onChange={(e) => setCustomCreditName(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount and Tax PPN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Total amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan' ? 'Total Uang Terhitung (Otomatis)' : 'Jumlah Dana / Nilai Transaksi'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      disabled={type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan'}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none disabled:bg-slate-50 font-mono font-bold"
                    />
                  </div>
                  {(type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan') && (
                    <p className="text-[10px] text-slate-400 mt-1">Dihitung otomatis: Unit x Harga</p>
                  )}
                </div>

                {/* PPN Box */}
                <div className="flex items-center gap-2 border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
                  <input
                    type="checkbox"
                    id="ppn-toggle"
                    checked={ppnEnabled}
                    onChange={(e) => setPpnEnabled(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-slate-900 cursor-pointer"
                  />
                  <div className="cursor-pointer">
                    <label htmlFor="ppn-toggle" className="block text-xs font-bold text-slate-700 cursor-pointer">
                      Kenakan Pajak PPN (11%)
                    </label>
                    <span className="block text-[10px] text-slate-400 leading-normal">
                      Mengakomodasi pajak PPN masukan/keluaran dalam jurnal
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-save-transaction"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs cursor-pointer"
              >
                Catat Transaksi &amp; Jurnal Berpasangan
              </button>
            </form>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>Prinsip Double-Entry</span>
              </div>
              <h4 className="text-sm font-bold font-sans">Mengapa Akuntansi Harus Berpasangan?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Setiap transaksi yang Anda masukkan memengaruhi minimal dua akun keuangan sekaligus (Debit dan Kredit).
              </p>
              <div className="space-y-2 pt-2 text-[11px] text-slate-400 font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Pembelian Stok:</span>
                  <span className="text-indigo-300 text-right">Debit Stok (1003)<br/>Kredit Kas (1001)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1 pt-1">
                  <span>Penjualan Retail:</span>
                  <span className="text-indigo-300 text-right">Debit Kas (1001)<br/>Kredit Pendapatan (4001)</span>
                </div>
              </div>
            </div>

            {/* Quick Jurnal & Print shortcut if transactions exist */}
            {transactions.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Jurnal Siap Dicetak</span>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    {transactions.length} Transaksi
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-snug">
                  Jurnal Umum otomatis terakumulasi dalam sistem akuntansi berpasangan (SAK EMKM).
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab('jurnal')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Buka &amp; Cetak Jurnal Umum
                </button>
              </div>
            )}

            {/* Clear database action */}
            {transactions.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center">
                <p className="text-xs text-rose-700 text-center mb-3">
                  Ingin menghapus semua riwayat transaksi untuk memulai pembukuan baru dari awal?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if(confirm("Apakah Anda yakin ingin menghapus seluruh pembukuan transaksi saat ini? Data yang terhapus tidak bisa dikembalikan.")) {
                      onClearTransactions();
                      alert("Pembukuan dibersihkan.");
                    }
                  }}
                  className="flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-lg text-xs w-full transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Seluruh Pembukuan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'jurnal' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4 printable-area" id="jurnal-view">
          {/* SCREEN HEADER & PRINT ACTION CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 no-print">
            <div>
              <h3 className="text-base font-bold text-slate-800">Jurnal Umum (General Journal)</h3>
              <p className="text-xs text-slate-400">Arsip jurnal kronologis lengkap berdasar standar akuntansi SAK EMKM</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={journalEntries.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                title="Cetak atau Simpan sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Jurnal (Print / PDF)
              </button>
              <div className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-2 rounded-xl">
                Total: {journalEntries.length} Baris
              </div>
            </div>
          </div>

          {/* OFFICIAL INDONESIAN ACCOUNTING LETTERHEAD (KOP SURAT) FOR PRINT */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-sans">
                  {storeConfig?.storeName || "PEMBUKUAN TRANSAKSI UMKM"}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Jenis Usaha: {storeConfig?.storeType || "Perdagangan & Jasa"} • Wilayah: {storeConfig?.storeCity || "Indonesia"}
                </p>
                {storeConfig?.storeAddress && (
                  <p className="text-[11px] text-slate-500 font-sans">
                    Alamat: {storeConfig.storeAddress}
                  </p>
                )}
                {storeConfig?.storeNpwp && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    NPWP: {storeConfig.storeNpwp}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                  DOKUMEN RESMI
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Tgl Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-300 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                JURNAL UMUM TRANSAKSI (GENERAL JOURNAL)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Periode: {storeConfig?.reportPeriod || "Semua Periode"} • Metode: Akuntansi Berpasangan (Double-Entry) • Mata Uang: Rupiah (IDR)
              </p>
            </div>
          </div>

          {journalEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Belum ada entri jurnal terdokumentasi.</p>
              <p className="text-[11px]">Masukkan beberapa transaksi bisnis untuk mengenerasikan jurnal umum otomatis.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-l-lg">Tanggal</th>
                    <th scope="col" className="px-4 py-3">Bukti Ref</th>
                    <th scope="col" className="px-4 py-3">Keterangan Akun / Deskripsi</th>
                    <th scope="col" className="px-4 py-3 text-right">Debit (Rp)</th>
                    <th scope="col" className="px-4 py-3 text-right rounded-r-lg">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {journalEntries.map((entry, index) => {
                    const isCredit = entry.credit > 0;
                    return (
                      <tr key={`${entry.id}-${index}`} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {!isCredit ? entry.date : ""}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-500">
                          {entry.ref}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`${isCredit ? 'pl-8 font-normal text-slate-500' : 'font-semibold text-slate-800'}`}>
                            {entry.accountId} - {entry.accountName}
                          </div>
                          {!isCredit && (
                            <div className="text-[10px] text-slate-400 pl-4 mt-0.5 font-normal">
                              {entry.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] font-semibold text-slate-700">
                          {entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] font-semibold text-slate-700">
                          {entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-[11px] text-slate-700">
                      TOTAL MUTASI JURNAL:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-900 font-bold">
                      Rp {totalJournalDebit.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-900 font-bold">
                      Rp {totalJournalCredit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td colSpan={5} className="px-4 py-2.5 text-center text-[10px] font-mono">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
                        isJournalBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        STATUS: {isJournalBalanced ? "SEIMBANG / BALANCED (TOTAL DEBIT = TOTAL KREDIT)" : "TIDAK SEIMBANG"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
          {journalEntries.length > 0 && (
            <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">
              <div className="text-center space-y-16">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 font-sans">Disetujui Oleh,</p>
                  <p className="text-[10px] text-slate-400 font-mono">Pimpinan / Pemilik Usaha</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 underline font-sans">
                    {storeConfig?.storeName ? `Pimpinan ${storeConfig.storeName}` : "(................................................)"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">Kota {storeConfig?.storeCity || "Indonesia"}</p>
                </div>
              </div>
              <div className="text-center space-y-16 col-start-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 font-sans">Dibuat Oleh,</p>
                  <p className="text-[10px] text-slate-450 font-mono">Petugas Pembukuan / Akuntan</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 underline font-sans">Bagian Akuntansi</p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'bukubesar' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4 printable-area" id="ledger-view">
          {/* SCREEN HEADER & PRINT ACTION CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 no-print">
            <div>
              <h3 className="text-base font-bold text-slate-800">Buku Besar Pembantu (General Ledger)</h3>
              <p className="text-xs text-slate-400">Lacak mutasi debit/kredit dan pergerakan saldo berjalan setiap akun induk</p>
            </div>
            
            {/* Account filter and print button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={ledgerEntries.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                title="Cetak Buku Besar atau Simpan sebagai PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Buku Besar (Print / PDF)
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 shrink-0">Filter:</span>
                <select
                  value={filteredAccountId}
                  onChange={(e) => setFilteredAccountId(parseInt(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-slate-500 outline-none max-w-sm"
                >
                  {CHART_OF_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.id} - {acc.name} ({acc.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* OFFICIAL INDONESIAN ACCOUNTING LETTERHEAD (KOP SURAT) FOR PRINT */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-sans">
                  {storeConfig?.storeName || "PEMBUKUAN TRANSAKSI UMKM"}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Jenis Usaha: {storeConfig?.storeType || "Perdagangan & Jasa"} • Wilayah: {storeConfig?.storeCity || "Indonesia"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                  DOKUMEN RESMI
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Tgl Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-300 text-center">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                BUKU BESAR PEMBANTU (GENERAL LEDGER)
              </h2>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                KODE &amp; NAMA AKUN: {selectedAccType?.id} - {selectedAccType?.name} ({selectedAccType?.category} • Saldo Normal: {selectedAccType?.normalBalance})
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
            <div className="flex-1">
              <span className="text-slate-400 block mb-0.5">Klasifikasi Akun</span>
              <span className="font-bold text-slate-800">{selectedAccType?.category}</span>
            </div>
            <div className="flex-1">
              <span className="text-slate-400 block mb-0.5">Saldo Normal Akun</span>
              <span className="font-bold text-indigo-700">{selectedAccType?.normalBalance}</span>
            </div>
            <div className="flex-1">
              <span className="text-slate-400 block mb-0.5">Saldo Berjalan Saat Ini</span>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {ledgerEntries.length > 0 
                  ? formatIDR(ledgerEntries[ledgerEntries.length - 1].balance) 
                  : "Rp 0"}
              </span>
            </div>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-medium">Belum ada riwayat mutasi jurnal untuk akun ini.</p>
              <p className="text-[11px] mt-1">Transaksikan pos ini untuk memicu catatan buku besar akun.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 rounded-l-lg">Tanggal</th>
                    <th scope="col" className="px-4 py-2.5">Keterangan Transaksi</th>
                    <th scope="col" className="px-4 py-2.5">Ref</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Debit (Rp)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Kredit (Rp)</th>
                    <th scope="col" className="px-4 py-2.5 text-right rounded-r-lg">Saldo (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {item.date}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500 font-medium">
                        {item.ref}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] text-emerald-600 font-semibold">
                        {item.debit > 0 ? item.debit.toLocaleString('id-ID') : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] text-rose-600 font-semibold">
                        {item.credit > 0 ? item.credit.toLocaleString('id-ID') : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] font-bold text-slate-900 bg-slate-50/40">
                        {item.balance.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-[11px] text-slate-700">
                      TOTAL MUTASI AKUN:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-900 font-bold">
                      Rp {ledgerDebitMutasi.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-900 font-bold">
                      Rp {ledgerCreditMutasi.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-indigo-700 font-bold bg-indigo-50/50">
                      {ledgerEntries.length > 0 ? formatIDR(ledgerEntries[ledgerEntries.length - 1].balance) : "Rp 0"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
          {ledgerEntries.length > 0 && (
            <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-200">
              <div className="text-center space-y-16">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 font-sans">Disetujui Oleh,</p>
                  <p className="text-[10px] text-slate-400 font-mono">Pimpinan / Pemilik Usaha</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 underline font-sans">
                    {storeConfig?.storeName ? `Pimpinan ${storeConfig.storeName}` : "(................................................)"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">Kota {storeConfig?.storeCity || "Indonesia"}</p>
                </div>
              </div>
              <div className="text-center space-y-16 col-start-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 font-sans">Dibuat Oleh,</p>
                  <p className="text-[10px] text-slate-450 font-mono">Petugas Pembukuan / Akuntan</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 underline font-sans">Bagian Akuntansi</p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
