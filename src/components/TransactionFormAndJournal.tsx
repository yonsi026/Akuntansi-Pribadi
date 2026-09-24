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
  CheckCircle,
  Briefcase,
  Zap,
  Building2,
  Boxes,
  Wifi,
  ShoppingBag,
  Wrench,
  ShoppingCart,
  Truck,
  Sparkles,
  Info,
  DollarSign,
  Search,
  Filter,
  Layers,
  Calendar,
  User,
  Tag,
  AlertCircle
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

interface PresetAction {
  type: TransactionType;
  label: string;
  badge: string;
  desc: string;
  icon: any;
  borderClass: string;
  bgActive: string;
  badgeClass: string;
}

const PRESET_ACTIONS: PresetAction[] = [
  {
    type: 'Gaji Karyawan',
    label: 'Gaji & Upah Staf',
    badge: 'Akun 6001',
    desc: 'Gaji bulanan, harian, lembur staf',
    icon: Briefcase,
    borderClass: 'border-violet-200 hover:border-violet-400 bg-violet-50/70',
    bgActive: 'bg-violet-600 text-white border-violet-600 shadow-sm ring-2 ring-violet-300',
    badgeClass: 'bg-violet-100 text-violet-800'
  },
  {
    type: 'Listrik & Air',
    label: 'Listrik, Air & Gas',
    badge: 'Akun 6003',
    desc: 'Token PLN, PDAM, tabung gas',
    icon: Zap,
    borderClass: 'border-amber-200 hover:border-amber-400 bg-amber-50/70',
    bgActive: 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800'
  },
  {
    type: 'Sewa Toko',
    label: 'Sewa Ruko / Tempat',
    badge: 'Akun 6002',
    desc: 'Sewa ruko, kios, toko bulanan/tahunan',
    icon: Building2,
    borderClass: 'border-sky-200 hover:border-sky-400 bg-sky-50/70',
    bgActive: 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-300',
    badgeClass: 'bg-sky-100 text-sky-800'
  },
  {
    type: 'Beli Inventaris',
    label: 'Inventaris & Furniture',
    badge: 'Aset Tetap (1005)',
    desc: 'Rak display, etalase, meja kasir, AC, showcase',
    icon: Boxes,
    borderClass: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/70',
    bgActive: 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-800'
  },
  {
    type: 'Internet & Pulsa',
    label: 'Internet & Pulsa',
    badge: 'Akun 6004',
    desc: 'WiFi toko, paket data, telepon',
    icon: Wifi,
    borderClass: 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/70',
    bgActive: 'bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-300',
    badgeClass: 'bg-cyan-100 text-cyan-800'
  },
  {
    type: 'Perlengkapan Toko',
    label: 'Perlengkapan & ATK',
    badge: 'Akun 6005',
    desc: 'Kresek belanja, kertas kasir, lakban',
    icon: ShoppingBag,
    borderClass: 'border-teal-200 hover:border-teal-400 bg-teal-50/70',
    bgActive: 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-300',
    badgeClass: 'bg-teal-100 text-teal-800'
  },
  {
    type: 'Servis & Perbaikan',
    label: 'Servis & Pemeliharaan',
    badge: 'Akun 6007',
    desc: 'Servis AC, listrik toko, perbaikan etalase',
    icon: Wrench,
    borderClass: 'border-orange-200 hover:border-orange-400 bg-orange-50/70',
    bgActive: 'bg-orange-600 text-white border-orange-600 shadow-sm ring-2 ring-orange-300',
    badgeClass: 'bg-orange-100 text-orange-800'
  },
  {
    type: 'Penjualan',
    label: 'Penjualan Retail',
    badge: 'Akun 4001',
    desc: 'Penjualan barang dagang ke konsumen',
    icon: ShoppingCart,
    borderClass: 'border-green-200 hover:border-green-400 bg-green-50/70',
    bgActive: 'bg-green-600 text-white border-green-600 shadow-sm ring-2 ring-green-300',
    badgeClass: 'bg-green-100 text-green-800'
  },
  {
    type: 'Pembelian',
    label: 'Kulakan Stok',
    badge: 'Akun 1003',
    desc: 'Beli persediaan barang dagangan',
    icon: Truck,
    borderClass: 'border-blue-200 hover:border-blue-400 bg-blue-50/70',
    bgActive: 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'Biaya Operasional',
    label: 'Operasional Lainnya',
    badge: 'Akun 6008',
    desc: 'Kebersihan, retribusi, transportasi',
    icon: FileText,
    borderClass: 'border-slate-200 hover:border-slate-400 bg-slate-50',
    bgActive: 'bg-slate-800 text-white border-slate-800 shadow-sm ring-2 ring-slate-300',
    badgeClass: 'bg-slate-200 text-slate-800'
  },
  {
    type: 'Setor Modal',
    label: 'Setoran Modal',
    badge: 'Akun 3001',
    desc: 'Suntikan dana modal kas pemilik',
    icon: Coins,
    borderClass: 'border-purple-200 hover:border-purple-400 bg-purple-50/70',
    bgActive: 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300',
    badgeClass: 'bg-purple-100 text-purple-800'
  },
  {
    type: 'Tarik Prive',
    label: 'Prive Pribadi',
    badge: 'Akun 3002',
    desc: 'Pengambilan uang pribadi pemilik',
    icon: ArrowRightLeft,
    borderClass: 'border-rose-200 hover:border-rose-400 bg-rose-50/70',
    bgActive: 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-300',
    badgeClass: 'bg-rose-100 text-rose-800'
  },
  {
    type: 'Pembayaran Hutang',
    label: 'Bayar Utang Usaha',
    badge: 'Akun 2001',
    desc: 'Pelunasan faktur utang dagang supplier',
    icon: CheckCircle,
    borderClass: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/70',
    bgActive: 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-800'
  },
  {
    type: 'Lainnya',
    label: 'Jurnal Manual / Lainnya',
    badge: 'Kustom',
    desc: 'Entri jurnal debit/kredit bebas',
    icon: PlusCircle,
    borderClass: 'border-slate-200 hover:border-slate-400 bg-slate-50',
    bgActive: 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-300',
    badgeClass: 'bg-slate-200 text-slate-700'
  }
];

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

  // Operational & Fixed Asset Specific Helper States
  // 1. Gaji Karyawan
  const [salaryEmployeeName, setSalaryEmployeeName] = useState<string>("");
  const [salaryType, setSalaryType] = useState<string>("Gaji Pokok Bulanan");
  const [salaryPeriod, setSalaryPeriod] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  });
  const [salaryStaffCount, setSalaryStaffCount] = useState<number>(1);
  const [salaryPaymentSource, setSalaryPaymentSource] = useState<string>("1001"); // 1001 (Kas) or 2004 (Utang Gaji)

  // 2. Listrik, Air & Gas (Utilitas)
  const [utilityCategory, setUtilityCategory] = useState<string>("Token Listrik PLN");
  const [utilityMeterNumber, setUtilityMeterNumber] = useState<string>("");
  const [utilityPeriod, setUtilityPeriod] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  });

  // 3. Sewa Toko / Ruko
  const [rentalDuration, setRentalDuration] = useState<string>("1 Bulan");
  const [rentalUnitName, setRentalUnitName] = useState<string>("");
  const [rentalLandlord, setRentalLandlord] = useState<string>("");

  // 4. Inventaris & Furniture (Aset Tetap 1005)
  const [inventoryCategory, setInventoryCategory] = useState<string>("Rak Gondola Display Toko");
  const [inventorySpecs, setInventorySpecs] = useState<string>("");
  const [inventoryQty, setInventoryQty] = useState<number>(1);
  const [inventoryUsefulLife, setInventoryUsefulLife] = useState<string>("4 Tahun (Fiskal Gol. 1)");

  // 5. Internet & Pulsa
  const [internetProvider, setInternetProvider] = useState<string>("IndiHome Toko");
  const [internetAccNumber, setInternetAccNumber] = useState<string>("");

  // 6. Perlengkapan & ATK Toko
  const [supplyType, setSupplyType] = useState<string>("Kantong Plastik & Kresek Belanja");
  const [supplyNotes, setSupplyNotes] = useState<string>("");

  // 7. Servis & Perbaikan Toko
  const [repairType, setRepairType] = useState<string>("Servis AC Toko & Cuci Filter");
  const [repairVendor, setRepairVendor] = useState<string>("");

  // History search & filter
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>("Semua");
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");

  // Ledger Filter State
  const [filteredAccountId, setFilteredAccountId] = useState<number>(1001); // Default Kas

  // Helper to generate default description based on type and input details
  const updateAutoDescription = (newType: TransactionType) => {
    switch (newType) {
      case "Gaji Karyawan": {
        const staffText = salaryEmployeeName.trim() ? ` (${salaryEmployeeName.trim()})` : (salaryStaffCount > 1 ? ` (${salaryStaffCount} Staf)` : " Staf Toko");
        setDescription(`Pembayaran ${salaryType}${staffText} - Periode ${salaryPeriod}`);
        break;
      }
      case "Listrik & Air": {
        const meterText = utilityMeterNumber.trim() ? ` (ID: ${utilityMeterNumber.trim()})` : "";
        setDescription(`Pembayaran ${utilityCategory}${meterText} - Periode ${utilityPeriod}`);
        break;
      }
      case "Sewa Toko": {
        const rukoText = rentalUnitName.trim() ? ` - ${rentalUnitName.trim()}` : "";
        const ownerText = rentalLandlord.trim() ? ` (Pemilik: ${rentalLandlord.trim()})` : "";
        setDescription(`Pembayaran Sewa Toko/Ruko (Periode ${rentalDuration})${rukoText}${ownerText}`);
        break;
      }
      case "Beli Inventaris": {
        const specText = inventorySpecs.trim() ? ` (${inventorySpecs.trim()})` : "";
        setDescription(`Pembelian Aset Inventaris Toko: ${inventoryQty} Unit ${inventoryCategory}${specText}`);
        break;
      }
      case "Internet & Pulsa": {
        const accText = internetAccNumber.trim() ? ` (No: ${internetAccNumber.trim()})` : "";
        setDescription(`Pembayaran Tagihan Internet & Pulsa Toko ${internetProvider}${accText}`);
        break;
      }
      case "Perlengkapan Toko": {
        const notesText = supplyNotes.trim() ? ` - ${supplyNotes.trim()}` : "";
        setDescription(`Pembelian Perlengkapan Toko: ${supplyType}${notesText}`);
        break;
      }
      case "Servis & Perbaikan": {
        const vendorText = repairVendor.trim() ? ` (Teknisi: ${repairVendor.trim()})` : "";
        setDescription(`Biaya Pemeliharaan Toko: ${repairType}${vendorText}`);
        break;
      }
      case "Penjualan":
      case "Penjualan Stok": {
        const item = stockItems.find(i => i.id === selectedStockItemId);
        if (item) {
          setDescription(`Penjualan ${item.name} sebanyak ${stockQuantity} ${item.unit}`);
        } else {
          setDescription("Penjualan Barang Dagangan Tunai Kasir");
        }
        break;
      }
      case "Pembelian":
      case "Pembelian Stok": {
        const item = stockItems.find(i => i.id === selectedStockItemId);
        if (item) {
          setDescription(`Kulakan Stok ${item.name} sebanyak ${stockQuantity} ${item.unit}`);
        } else {
          setDescription("Pembelian Stok Barang Dagang Toko");
        }
        break;
      }
      case "Biaya Operasional":
      case "Pengeluaran":
        setDescription("Biaya Operasional Rutin Toko");
        break;
      case "Setor Modal":
      case "Penerimaan":
        setDescription("Setoran Tambahan Modal Pemilik Usaha");
        break;
      case "Tarik Prive":
        setDescription("Penarikan Prive Pribadi oleh Pemilik Toko");
        break;
      case "Pembayaran Hutang":
        setDescription("Pembayaran Pelunasan Utang Usaha ke Supplier");
        break;
      default:
        break;
    }
  };

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
    } else if (type === 'Gaji Karyawan') {
      setDebitAccountSelect("6001"); // Beban Gaji & Upah Karyawan
      setCreditAccountSelect(salaryPaymentSource || "1001"); // Kas (1001) or Utang Gaji (2004)
    } else if (type === 'Listrik & Air') {
      setDebitAccountSelect("6003"); // Beban Listrik, Air & Gas
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Sewa Toko') {
      setDebitAccountSelect("6002"); // Beban Sewa Ruko/Tempat
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Beli Inventaris') {
      setDebitAccountSelect("1005"); // Aset Tetap - Peralatan & Inventaris Furniture
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Internet & Pulsa') {
      setDebitAccountSelect("6004"); // Beban Internet, Pulsa & Komunikasi
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Perlengkapan Toko') {
      setDebitAccountSelect("6005"); // Beban Perlengkapan & ATK Toko
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Servis & Perbaikan') {
      setDebitAccountSelect("6007"); // Beban Pemeliharaan & Perbaikan
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Biaya Operasional' || type === 'Pengeluaran') {
      setDebitAccountSelect("6008"); // Beban Operasional Lain-lain
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Setor Modal' || type === 'Penerimaan') {
      setDebitAccountSelect("1001"); // Kas & Setara Kas
      setCreditAccountSelect("3001"); // Modal Pemilik
    } else if (type === 'Tarik Prive') {
      setDebitAccountSelect("3002"); // Prive Pemilik
      setCreditAccountSelect("1001"); // Kas & Setara Kas
    } else if (type === 'Pembayaran Hutang') {
      setDebitAccountSelect("2001"); // Utang Usaha (Debit to reduce liability)
      setCreditAccountSelect("1001"); // Kas (Credit to reduce asset)
    } else if (type === 'Lainnya') {
      setDebitAccountSelect("1001"); // Kas & Setara Kas
      setCreditAccountSelect("6008"); // Beban Operasional Lain-lain
    }
  }, [type, salaryPaymentSource]);

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

    // Attach operational & fixed asset metadata
    if (type === 'Gaji Karyawan') {
      transactionData.operationalCategory = 'Gaji';
      transactionData.employeeName = salaryEmployeeName.trim() || undefined;
    } else if (type === 'Listrik & Air') {
      transactionData.operationalCategory = 'Listrik';
      transactionData.utilityType = utilityCategory;
    } else if (type === 'Sewa Toko') {
      transactionData.operationalCategory = 'Sewa';
      transactionData.rentalPeriod = rentalDuration;
    } else if (type === 'Beli Inventaris') {
      transactionData.operationalCategory = 'Inventaris';
      transactionData.assetType = inventoryCategory;
    } else if (type === 'Internet & Pulsa') {
      transactionData.operationalCategory = 'Internet';
    } else if (type === 'Perlengkapan Toko') {
      transactionData.operationalCategory = 'Perlengkapan';
    } else if (type === 'Servis & Perbaikan') {
      transactionData.operationalCategory = 'Servis';
    }

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
        <div className="space-y-6">
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

            {/* Quick Presets Bar */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Pilih Kategori Transaksi Cepat (Preset SAK EMKM)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Klik untuk mengatur akun otomatis</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {PRESET_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isCurrent = type === action.type;
                  return (
                    <button
                      key={action.type}
                      type="button"
                      onClick={() => {
                        setType(action.type);
                        updateAutoDescription(action.type);
                      }}
                      className={`flex flex-col items-start p-2 rounded-xl border text-left transition cursor-pointer ${
                        isCurrent
                          ? action.bgActive
                          : `${action.borderClass} text-slate-700`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-600'}`} />
                        <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                          isCurrent ? 'bg-white/20 text-white' : action.badgeClass
                        }`}>
                          {action.badge.replace('Akun ', '')}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold leading-tight block truncate w-full">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                    onChange={(e) => {
                      const newType = e.target.value as TransactionType;
                      setType(newType);
                      updateAutoDescription(newType);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none font-medium"
                  >
                    <optgroup label="Operasional & Gaji Toko">
                      <option value="Gaji Karyawan">💼 Gaji &amp; Upah Karyawan (Beban 6001)</option>
                      <option value="Listrik & Air">💡 Listrik, Air &amp; Gas (Beban 6003)</option>
                      <option value="Sewa Toko">🏠 Sewa Tempat / Toko / Ruko (Beban 6002)</option>
                      <option value="Internet & Pulsa">🌐 Internet, WiFi &amp; Pulsa (Beban 6004)</option>
                      <option value="Perlengkapan Toko">🛍️ Perlengkapan &amp; ATK Toko (Beban 6005)</option>
                      <option value="Servis & Perbaikan">🔧 Servis &amp; Perbaikan Toko (Beban 6007)</option>
                      <option value="Biaya Operasional">📁 Biaya Operasional Lainnya (Beban 6008)</option>
                    </optgroup>
                    <optgroup label="Aset & Belanja Modal">
                      <option value="Beli Inventaris">🪑 Inventaris Furniture / Aset Tetap (Akun 1005)</option>
                    </optgroup>
                    <optgroup label="Perdagangan Barang & Stok">
                      <option value="Penjualan">🛒 Penjualan Barang Dagang (Pendapatan 4001)</option>
                      <option value="Pembelian">📦 Kulakan Stok Barang Dagang (Persediaan 1003)</option>
                    </optgroup>
                    <optgroup label="Modal, Ekuitas & Utang">
                      <option value="Setor Modal">💰 Setoran Modal Pemilik (Ekuitas 3001)</option>
                      <option value="Tarik Prive">💵 Penarikan Prive Pribadi (Ekuitas 3002)</option>
                      <option value="Pembayaran Hutang">💳 Pelunasan Utang Usaha (Liabilitas 2001)</option>
                      <option value="Lainnya">⚙️ Lainnya / Jurnal Kustom Manual</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Uraian Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pembayaran Gaji Staf Kasir Juni 2026, Token Listrik Toko PLN, dll"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-slate-500 outline-none"
                />
              </div>

              {/* CONTEXTUAL HELPER PANELS ACCORDING TO USER'S EXPENSE/ASSET TYPE */}
              
              {/* 1. Panel Gaji Karyawan */}
              {type === 'Gaji Karyawan' && (
                <div className="bg-violet-50/80 border border-violet-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-violet-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-violet-600 text-white rounded-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-violet-900">Formulir Beban Gaji &amp; Upah Karyawan</h4>
                        <p className="text-[10px] text-violet-600">Akun: 6001 - Beban Gaji &amp; Upah Karyawan (Laporan Laba Rugi)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono bg-violet-200 text-violet-900 px-2 py-0.5 rounded-full">
                      Beban Usaha SAK EMKM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">Nama Staf / Posisi</label>
                      <input
                        type="text"
                        placeholder="Misal: Siti Rahma (Kasir), Budi (Gudang)"
                        value={salaryEmployeeName}
                        onChange={(e) => {
                          setSalaryEmployeeName(e.target.value);
                          const staffText = e.target.value.trim() ? ` (${e.target.value.trim()})` : " Staf Toko";
                          setDescription(`Pembayaran ${salaryType}${staffText} - Periode ${salaryPeriod}`);
                        }}
                        className="w-full text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">Jenis Kompensasi</label>
                      <select
                        value={salaryType}
                        onChange={(e) => {
                          setSalaryType(e.target.value);
                          const staffText = salaryEmployeeName.trim() ? ` (${salaryEmployeeName.trim()})` : " Staf Toko";
                          setDescription(`Pembayaran ${e.target.value}${staffText} - Periode ${salaryPeriod}`);
                        }}
                        className="w-full text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        <option value="Gaji Pokok Bulanan">Gaji Pokok Bulanan</option>
                        <option value="Upah Harian / Borongan">Upah Harian / Borongan Lepas</option>
                        <option value="Uang Lembur Staf">Uang Lembur / Jam Ekstra</option>
                        <option value="Tunjangan Hari Raya (THR) / Bonus">Tunjangan Hari Raya (THR) / Bonus</option>
                        <option value="Uang Makan & Transport Staf">Uang Makan &amp; Transport Staf</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">Periode Penggajian</label>
                      <input
                        type="text"
                        placeholder="Misal: Juni 2026 atau Minggu ke-2"
                        value={salaryPeriod}
                        onChange={(e) => {
                          setSalaryPeriod(e.target.value);
                          const staffText = salaryEmployeeName.trim() ? ` (${salaryEmployeeName.trim()})` : " Staf Toko";
                          setDescription(`Pembayaran ${salaryType}${staffText} - Periode ${e.target.value}`);
                        }}
                        className="w-full text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">Sumber Pembayaran</label>
                      <select
                        value={salaryPaymentSource}
                        onChange={(e) => {
                          setSalaryPaymentSource(e.target.value);
                          setCreditAccountSelect(e.target.value);
                        }}
                        className="w-full text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                      >
                        <option value="1001">Kas Tunai Toko / Bank (Akun 1001)</option>
                        <option value="2004">Ditangguhkan / Utang Gaji (Akun 2004)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-violet-100/70 p-2.5 rounded-xl text-[11px] text-violet-900 leading-relaxed">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-600" />
                    <span>
                      <strong>Jurnal Otomatis Berpasangan:</strong> Mendebit <strong>6001 - Beban Gaji &amp; Upah Karyawan</strong> dan Mengkredit <strong>{salaryPaymentSource === '1001' ? '1001 - Kas & Setara Kas' : '2004 - Utang Gaji & Beban'}</strong>. Nilai ini langsung terakumulasi dalam Laporan Laba Rugi untuk menghitung laba bersih riil.
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Panel Listrik, Air & Gas (Utilitas) */}
              {type === 'Listrik & Air' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">Formulir Beban Listrik, Air &amp; Gas (Utilitas Toko)</h4>
                        <p className="text-[10px] text-amber-700">Akun: 6003 - Beban Listrik, Air &amp; Gas (Laporan Laba Rugi)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Utilitas Operasional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Jenis Layanan Utilitas</label>
                      <select
                        value={utilityCategory}
                        onChange={(e) => {
                          setUtilityCategory(e.target.value);
                          const meterText = utilityMeterNumber.trim() ? ` (ID: ${utilityMeterNumber.trim()})` : "";
                          setDescription(`Pembayaran ${e.target.value}${meterText} - Periode ${utilityPeriod}`);
                        }}
                        className="w-full text-xs bg-white border border-amber-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Token Listrik PLN Toko (Prabayar)">Token Listrik PLN Toko (Prabayar)</option>
                        <option value="Tagihan Listrik PLN Pascabayar">Tagihan Listrik PLN Pascabayar Toko</option>
                        <option value="Tagihan Air Bersih PDAM">Tagihan Air Bersih PDAM Toko</option>
                        <option value="Tabung Gas LPG Operasional">Tabung Gas LPG Operasional Toko</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">No. Meteran / ID Pelanggan PLN (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: 54109827361"
                        value={utilityMeterNumber}
                        onChange={(e) => {
                          setUtilityMeterNumber(e.target.value);
                          const meterText = e.target.value.trim() ? ` (ID: ${e.target.value.trim()})` : "";
                          setDescription(`Pembayaran ${utilityCategory}${meterText} - Periode ${utilityPeriod}`);
                        }}
                        className="w-full text-xs bg-white border border-amber-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Periode Pemakaian</label>
                      <input
                        type="text"
                        placeholder="Misal: Juni 2026"
                        value={utilityPeriod}
                        onChange={(e) => {
                          setUtilityPeriod(e.target.value);
                          const meterText = utilityMeterNumber.trim() ? ` (ID: ${utilityMeterNumber.trim()})` : "";
                          setDescription(`Pembayaran ${utilityCategory}${meterText} - Periode ${e.target.value}`);
                        }}
                        className="w-full text-xs bg-white border border-amber-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-100/70 p-2.5 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-700" />
                    <span>
                      <strong>Jurnal Otomatis Berpasangan:</strong> Mendebit <strong>6003 - Beban Listrik, Air &amp; Gas</strong> dan Mengkredit <strong>1001 - Kas &amp; Setara Kas</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Panel Sewa Toko / Ruko */}
              {type === 'Sewa Toko' && (
                <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-600 text-white rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-sky-900">Formulir Beban Sewa Tempat / Toko / Ruko</h4>
                        <p className="text-[10px] text-sky-700">Akun: 6002 - Beban Sewa Ruko/Tempat (Laporan Laba Rugi)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full">
                      Fasilitas Usaha
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-sky-900 mb-1">Durasi / Periode Sewa</label>
                      <select
                        value={rentalDuration}
                        onChange={(e) => {
                          setRentalDuration(e.target.value);
                          const rukoText = rentalUnitName.trim() ? ` - ${rentalUnitName.trim()}` : "";
                          const ownerText = rentalLandlord.trim() ? ` (Pemilik: ${rentalLandlord.trim()})` : "";
                          setDescription(`Pembayaran Sewa Toko/Ruko (Periode ${e.target.value})${rukoText}${ownerText}`);
                        }}
                        className="w-full text-xs bg-white border border-sky-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                      >
                        <option value="1 Bulan">1 Bulan (Sewa Bulanan)</option>
                        <option value="3 Bulan">3 Bulan (Triwulan)</option>
                        <option value="6 Bulan">6 Bulan (Semester)</option>
                        <option value="1 Tahun">1 Tahun (Sewa Tahunan)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-900 mb-1">Nama Toko / Lokasi Ruko</label>
                      <input
                        type="text"
                        placeholder="Misal: Ruko Blok A No. 12, Kios Pasar"
                        value={rentalUnitName}
                        onChange={(e) => {
                          setRentalUnitName(e.target.value);
                          const rukoText = e.target.value.trim() ? ` - ${e.target.value.trim()}` : "";
                          const ownerText = rentalLandlord.trim() ? ` (Pemilik: ${rentalLandlord.trim()})` : "";
                          setDescription(`Pembayaran Sewa Toko/Ruko (Periode ${rentalDuration})${rukoText}${ownerText}`);
                        }}
                        className="w-full text-xs bg-white border border-sky-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-900 mb-1">Nama Pemilik Properti (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: Bpk. H. Hendra"
                        value={rentalLandlord}
                        onChange={(e) => {
                          setRentalLandlord(e.target.value);
                          const rukoText = rentalUnitName.trim() ? ` - ${rentalUnitName.trim()}` : "";
                          const ownerText = e.target.value.trim() ? ` (Pemilik: ${e.target.value.trim()})` : "";
                          setDescription(`Pembayaran Sewa Toko/Ruko (Periode ${rentalDuration})${rukoText}${ownerText}`);
                        }}
                        className="w-full text-xs bg-white border border-sky-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-sky-100/70 p-2.5 rounded-xl text-[11px] text-sky-900 leading-relaxed">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-700" />
                    <span>
                      <strong>Jurnal Otomatis Berpasangan:</strong> Mendebit <strong>6002 - Beban Sewa Ruko/Tempat</strong> dan Mengkredit <strong>1001 - Kas &amp; Setara Kas</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Panel Inventaris & Furniture Toko (Aset Tetap 1005) */}
              {type === 'Beli Inventaris' && (
                <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">Formulir Pengadaan Inventaris &amp; Furniture Toko</h4>
                        <p className="text-[10px] text-emerald-800">Akun: 1005 - Aset Tetap - Peralatan &amp; Inventaris Furniture (Neraca)</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                      Belanja Modal / Aset Tetap
                    </span>
                  </div>

                  {/* SAK EMKM Asset Educational Banner */}
                  <div className="bg-emerald-100/80 border border-emerald-300/80 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-emerald-950">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      Standar Akuntansi Keuangan SAK EMKM:
                    </p>
                    <p>
                      Pengeluaran inventaris toko (rak display gondola, etalase kaca, meja kasir, AC pendingin, kulkas showcase minuman) merupakan <strong>ASET TETAP (Neraca)</strong>, bukan biaya langsung pada hari pembelian. Kas berkurang namun nilai total aset usaha Anda tetap utuh karena bertransformasi menjadi harta inventaris produktif berwujud!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Kategori Inventaris Furniture</label>
                      <select
                        value={inventoryCategory}
                        onChange={(e) => {
                          setInventoryCategory(e.target.value);
                          const specText = inventorySpecs.trim() ? ` (${inventorySpecs.trim()})` : "";
                          setDescription(`Pembelian Aset Inventaris Toko: ${inventoryQty} Unit ${e.target.value}${specText}`);
                        }}
                        className="w-full text-xs bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                      >
                        <option value="Rak Gondola Display Toko">Rak Gondola Display Toko (Besi)</option>
                        <option value="Etalase Kaca Toko">Etalase Kaca Toko (Display Produk)</option>
                        <option value="Meja Kasir & Kursi Ergonomis">Meja Kasir Toko &amp; Kursi Kerja</option>
                        <option value="Komputer Kasir POS & Printer Struk">Komputer POS Kasir &amp; Printer Thermal</option>
                        <option value="Kulkas Showcase Pendingin Minuman">Kulkas Showcase Minuman Toko</option>
                        <option value="AC Split Pendingin Toko">AC Split Pendingin Ruang Toko</option>
                        <option value="Timbangan Digital & Scanner Barcode">Timbangan Digital &amp; Scanner Barcode</option>
                        <option value="Lemari / Cash Drawer Uang">Lemari Arsip &amp; Cash Drawer Kasir</option>
                        <option value="Peralatan Toko Lainnya">Inventaris Toko Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Merk / Spesifikasi / Ukuran</label>
                      <input
                        type="text"
                        placeholder="Misal: Besi 4 Susun 120cm, Kaca 8mm 2M"
                        value={inventorySpecs}
                        onChange={(e) => {
                          setInventorySpecs(e.target.value);
                          const specText = e.target.value.trim() ? ` (${e.target.value.trim()})` : "";
                          setDescription(`Pembelian Aset Inventaris Toko: ${inventoryQty} Unit ${inventoryCategory}${specText}`);
                        }}
                        className="w-full text-xs bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Jumlah Unit Barang</label>
                      <input
                        type="number"
                        min="1"
                        value={inventoryQty}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setInventoryQty(val);
                          const specText = inventorySpecs.trim() ? ` (${inventorySpecs.trim()})` : "";
                          setDescription(`Pembelian Aset Inventaris Toko: ${val} Unit ${inventoryCategory}${specText}`);
                        }}
                        className="w-full text-xs bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">Masa Manfaat Ekonomis</label>
                      <select
                        value={inventoryUsefulLife}
                        onChange={(e) => setInventoryUsefulLife(e.target.value)}
                        className="w-full text-xs bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="2 Tahun (Perangkat Kasir/Elektronik)">2 Tahun (Perangkat Kasir / POS)</option>
                        <option value="4 Tahun (Fiskal Gol. 1 - Rak/Etalase/Meja)">4 Tahun (Fiskal Gol. 1 - Rak / Etalase)</option>
                        <option value="8 Tahun (Fiskal Gol. 2 - Showcase/AC Berat)">8 Tahun (Fiskal Gol. 2 - AC / Showcase)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-emerald-100/70 p-2.5 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-700" />
                    <span>
                      <strong>Jurnal Otomatis Berpasangan:</strong> Mendebit <strong>1005 - Aset Tetap - Peralatan &amp; Inventaris Furniture</strong> dan Mengkredit <strong>1001 - Kas &amp; Setara Kas</strong>. Posisi Neraca toko Anda akan langsung menampilkan pertambahan nilai aset inventaris ini!
                    </span>
                  </div>
                </div>
              )}

              {/* 5. Panel Internet & Pulsa */}
              {type === 'Internet & Pulsa' && (
                <div className="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
                    <Wifi className="w-4 h-4 text-cyan-600" />
                    <span>Formulir Beban Internet, WiFi &amp; Komunikasi Toko (Akun 6004)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-900 mb-1">Provider Internet / Pulsa</label>
                      <input
                        type="text"
                        placeholder="Misal: IndiHome Toko, Biznet, Telkomsel Orbit"
                        value={internetProvider}
                        onChange={(e) => {
                          setInternetProvider(e.target.value);
                          const accText = internetAccNumber.trim() ? ` (No: ${internetAccNumber.trim()})` : "";
                          setDescription(`Pembayaran Tagihan Internet & Pulsa Toko ${e.target.value}${accText}`);
                        }}
                        className="w-full text-xs bg-white border border-cyan-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-900 mb-1">No. Pelanggan / ID Tagihan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: 122894750912"
                        value={internetAccNumber}
                        onChange={(e) => {
                          setInternetAccNumber(e.target.value);
                          const accText = e.target.value.trim() ? ` (No: ${e.target.value.trim()})` : "";
                          setDescription(`Pembayaran Tagihan Internet & Pulsa Toko ${internetProvider}${accText}`);
                        }}
                        className="w-full text-xs bg-white border border-cyan-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Panel Perlengkapan & ATK Toko */}
              {type === 'Perlengkapan Toko' && (
                <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    <span>Formulir Beban Perlengkapan &amp; ATK Toko (Akun 6005)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">Jenis Perlengkapan</label>
                      <select
                        value={supplyType}
                        onChange={(e) => {
                          setSupplyType(e.target.value);
                          const notesText = supplyNotes.trim() ? ` - ${supplyNotes.trim()}` : "";
                          setDescription(`Pembelian Perlengkapan Toko: ${e.target.value}${notesText}`);
                        }}
                        className="w-full text-xs bg-white border border-teal-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Kantong Plastik & Kresek Belanja">Kantong Plastik &amp; Kresek Belanja</option>
                        <option value="Kertas Struk Kasir Thermal Roll">Kertas Struk Kasir Thermal Roll</option>
                        <option value="Lakban, Solasi & Karet Toko">Lakban, Solasi &amp; Karet Toko</option>
                        <option value="Buku Nota Kontan & Alat Tulis Kasir">Buku Nota Kontan &amp; Alat Tulis Kasir</option>
                        <option value="Plastik Wrap & Bubble Wrap Packing">Plastik Wrap &amp; Bubble Wrap Packing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-teal-900 mb-1">Catatan Tambahan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: 10 Pak ukuran 24 & 30"
                        value={supplyNotes}
                        onChange={(e) => {
                          setSupplyNotes(e.target.value);
                          const notesText = e.target.value.trim() ? ` - ${e.target.value.trim()}` : "";
                          setDescription(`Pembelian Perlengkapan Toko: ${supplyType}${notesText}`);
                        }}
                        className="w-full text-xs bg-white border border-teal-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Panel Servis & Perbaikan Toko */}
              {type === 'Servis & Perbaikan' && (
                <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-orange-900 font-bold text-xs">
                    <Wrench className="w-4 h-4 text-orange-600" />
                    <span>Formulir Beban Pemeliharaan &amp; Perbaikan Toko (Akun 6007)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-orange-900 mb-1">Jenis Pemeliharaan</label>
                      <select
                        value={repairType}
                        onChange={(e) => {
                          setRepairType(e.target.value);
                          const vendorText = repairVendor.trim() ? ` (Teknisi: ${repairVendor.trim()})` : "";
                          setDescription(`Biaya Pemeliharaan Toko: ${e.target.value}${vendorText}`);
                        }}
                        className="w-full text-xs bg-white border border-orange-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="Servis AC Toko & Cuci Filter">Servis AC Toko &amp; Cuci Filter</option>
                        <option value="Perbaikan Lampu & Kelistrikan Toko">Perbaikan Lampu &amp; Kelistrikan Toko</option>
                        <option value="Perbaikan Pintu & Rolling Door Toko">Perbaikan Pintu &amp; Rolling Door Toko</option>
                        <option value="Pengecatan & Renovasi Kecil Toko">Pengecatan &amp; Renovasi Kecil Toko</option>
                        <option value="Servis Komputer Kasir / Printer">Servis Komputer Kasir / Printer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-orange-900 mb-1">Nama Teknisi / Bengkel (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: Teknisi Mandiri AC (Pak Joko)"
                        value={repairVendor}
                        onChange={(e) => {
                          setRepairVendor(e.target.value);
                          const vendorText = e.target.value.trim() ? ` (Teknisi: ${e.target.value.trim()})` : "";
                          setDescription(`Biaya Pemeliharaan Toko: ${repairType}${vendorText}`);
                        }}
                        className="w-full text-xs bg-white border border-orange-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    {type === 'Pembelian Stok' || type === 'Penjualan Stok' || type === 'Pembelian' || type === 'Penjualan'
                      ? 'Total Uang Terhitung (Otomatis)'
                      : type === 'Gaji Karyawan'
                      ? 'Total Gaji & Upah Staf yang Dibayarkan (IDR)'
                      : type === 'Listrik & Air'
                      ? 'Nominal Tagihan / Token Listrik (IDR)'
                      : type === 'Sewa Toko'
                      ? 'Nilai Pembayaran Sewa Tempat/Ruko (IDR)'
                      : type === 'Beli Inventaris'
                      ? 'Total Pembelian Inventaris Furniture (IDR)'
                      : type === 'Internet & Pulsa'
                      ? 'Nominal Tagihan Internet / Pulsa (IDR)'
                      : type === 'Perlengkapan Toko'
                      ? 'Total Biaya Perlengkapan Toko (IDR)'
                      : type === 'Servis & Perbaikan'
                      ? 'Total Biaya Servis / Pemeliharaan (IDR)'
                      : 'Jumlah Dana / Nilai Transaksi (IDR)'}
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

        {/* RIWAYAT LENGKAP TRANSAKSI BISNIS & OPERASIONAL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5" id="history-transactions-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Riwayat Transaksi &amp; Beban Operasional
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan real-time gaji staf, utilitas listrik/air, sewa toko, aset inventaris, dan penjualan
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi, staf, no meter..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-violet-50/70 border border-violet-100 p-3 rounded-xl">
              <span className="text-[10px] text-violet-700 font-bold uppercase tracking-wider block">Beban Gaji Karyawan</span>
              <span className="text-sm font-bold text-violet-950 font-mono">
                {formatIDR(transactions.filter(t => t.type === 'Gaji Karyawan').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Listrik, Air &amp; Sewa</span>
              <span className="text-sm font-bold text-amber-950 font-mono">
                {formatIDR(transactions.filter(t => t.type === 'Listrik & Air' || t.type === 'Sewa Toko').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Inventaris &amp; Furniture (Aset)</span>
              <span className="text-sm font-bold text-emerald-950 font-mono">
                {formatIDR(transactions.filter(t => t.type === 'Beli Inventaris').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Transaksi Tercatat</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {transactions.length} Transaksi
              </span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'Semua', label: 'Semua Transaksi' },
              { id: 'Gaji & Upah', label: '💼 Gaji Karyawan' },
              { id: 'Listrik & Air', label: '💡 Listrik & Air' },
              { id: 'Sewa Toko', label: '🏠 Sewa Toko' },
              { id: 'Inventaris Furniture', label: '🪑 Inventaris Furniture' },
              { id: 'Internet & Pulsa', label: '🌐 Internet & Pulsa' },
              { id: 'Perlengkapan & Servis', label: '🛍️ Perlengkapan & Servis' },
              { id: 'Penjualan', label: '🛒 Penjualan' },
              { id: 'Kulakan Stok', label: '📦 Kulakan Stok' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHistoryCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  historyCategoryFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Coins className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Belum ada transaksi yang dicatat.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Gunakan formulir di atas atau pilih preset cepat untuk mulai pembukuan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Tanggal / Faktur</th>
                    <th className="py-3 px-3.5">Kategori Transaksi</th>
                    <th className="py-3 px-3.5">Uraian &amp; Detail</th>
                    <th className="py-3 px-3.5 text-right">Nilai (IDR)</th>
                    <th className="py-3 px-3.5">Posting Akun (Debit / Kredit)</th>
                    <th className="py-3 px-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter(tx => {
                      if (historyCategoryFilter === 'Gaji & Upah' && tx.type !== 'Gaji Karyawan') return false;
                      if (historyCategoryFilter === 'Listrik & Air' && tx.type !== 'Listrik & Air') return false;
                      if (historyCategoryFilter === 'Sewa Toko' && tx.type !== 'Sewa Toko') return false;
                      if (historyCategoryFilter === 'Inventaris Furniture' && tx.type !== 'Beli Inventaris') return false;
                      if (historyCategoryFilter === 'Internet & Pulsa' && tx.type !== 'Internet & Pulsa') return false;
                      if (historyCategoryFilter === 'Perlengkapan & Servis' && tx.type !== 'Perlengkapan Toko' && tx.type !== 'Servis & Perbaikan') return false;
                      if (historyCategoryFilter === 'Penjualan' && tx.type !== 'Penjualan' && tx.type !== 'Penjualan Stok') return false;
                      if (historyCategoryFilter === 'Kulakan Stok' && tx.type !== 'Pembelian' && tx.type !== 'Pembelian Stok') return false;

                      if (historySearchQuery.trim()) {
                        const q = historySearchQuery.toLowerCase();
                        const matchDesc = tx.description.toLowerCase().includes(q);
                        const matchInv = (tx.invoiceNumber || '').toLowerCase().includes(q);
                        const matchEmployee = (tx.employeeName || '').toLowerCase().includes(q);
                        const matchAsset = (tx.assetType || '').toLowerCase().includes(q);
                        const matchUtil = (tx.utilityType || '').toLowerCase().includes(q);
                        return matchDesc || matchInv || matchEmployee || matchAsset || matchUtil;
                      }
                      return true;
                    })
                    .map((tx) => {
                      const debitAccInfo = CHART_OF_ACCOUNTS.find(a => a.id === tx.debitAccount);
                      const creditAccInfo = CHART_OF_ACCOUNTS.find(a => a.id === tx.creditAccount);

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                          {/* Tanggal & Faktur */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-mono font-medium text-slate-800 block">{tx.date}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{tx.invoiceNumber || '-'}</span>
                          </td>

                          {/* Kategori Badge */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {tx.type === 'Gaji Karyawan' && (
                              <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200">
                                <Briefcase className="w-3 h-3 text-violet-600" />
                                Gaji Karyawan
                              </span>
                            )}
                            {tx.type === 'Listrik & Air' && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                <Zap className="w-3 h-3 text-amber-600" />
                                Listrik &amp; Utilitas
                              </span>
                            )}
                            {tx.type === 'Sewa Toko' && (
                              <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                                <Building2 className="w-3 h-3 text-sky-600" />
                                Sewa Toko/Ruko
                              </span>
                            )}
                            {tx.type === 'Beli Inventaris' && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                <Boxes className="w-3 h-3 text-emerald-700" />
                                Inventaris (Aset Tetap)
                              </span>
                            )}
                            {tx.type === 'Internet & Pulsa' && (
                              <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                                <Wifi className="w-3 h-3 text-cyan-600" />
                                Internet &amp; Pulsa
                              </span>
                            )}
                            {tx.type === 'Perlengkapan Toko' && (
                              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                                <ShoppingBag className="w-3 h-3 text-teal-600" />
                                Perlengkapan Toko
                              </span>
                            )}
                            {tx.type === 'Servis & Perbaikan' && (
                              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                                <Wrench className="w-3 h-3 text-orange-600" />
                                Servis Toko
                              </span>
                            )}
                            {(tx.type === 'Penjualan' || tx.type === 'Penjualan Stok') && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                <ShoppingCart className="w-3 h-3 text-green-600" />
                                Penjualan
                              </span>
                            )}
                            {(tx.type === 'Pembelian' || tx.type === 'Pembelian Stok') && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                <Truck className="w-3 h-3 text-blue-600" />
                                Kulakan Stok
                              </span>
                            )}
                            {tx.type === 'Setor Modal' && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                                <Coins className="w-3 h-3 text-purple-600" />
                                Modal
                              </span>
                            )}
                            {tx.type === 'Tarik Prive' && (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                <ArrowRightLeft className="w-3 h-3 text-rose-600" />
                                Prive
                              </span>
                            )}
                            {tx.type === 'Pembayaran Hutang' && (
                              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                <CheckCircle className="w-3 h-3 text-indigo-600" />
                                Bayar Utang
                              </span>
                            )}
                            {tx.type === 'Biaya Operasional' && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                <FileText className="w-3 h-3 text-slate-600" />
                                Beban Usaha
                              </span>
                            )}
                            {tx.type === 'Lainnya' && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                <Tag className="w-3 h-3 text-slate-500" />
                                Kustom
                              </span>
                            )}
                          </td>

                          {/* Uraian */}
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-800 block text-xs">{tx.description}</span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {tx.employeeName && (
                                <span className="text-[10px] text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-100 font-medium">
                                  Staf: {tx.employeeName}
                                </span>
                              )}
                              {tx.utilityType && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100 font-medium">
                                  Utilitas: {tx.utilityType}
                                </span>
                              )}
                              {tx.rentalPeriod && (
                                <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100 font-medium">
                                  Sewa: {tx.rentalPeriod}
                                </span>
                              )}
                              {tx.assetType && (
                                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-medium">
                                  Aset: {tx.assetType}
                                </span>
                              )}
                              {tx.ppnEnabled && (
                                <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100 font-mono">
                                  PPN: {formatIDR(tx.ppnAmount || 0)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Nilai */}
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                            {formatIDR(tx.amount)}
                          </td>

                          {/* Posting Akun */}
                          <td className="py-3 px-3.5 text-[11px] whitespace-nowrap">
                            <div className="text-sky-700 font-medium">
                              <span className="font-bold text-[10px] bg-sky-50 px-1 rounded mr-1">D</span>
                              {tx.debitAccount} - {tx.customDebitAccountName || debitAccInfo?.name || 'Debit'}
                            </div>
                            <div className="text-emerald-700 font-medium">
                              <span className="font-bold text-[10px] bg-emerald-50 px-1 rounded mr-1">K</span>
                              {tx.creditAccount} - {tx.customCreditAccountName || creditAccInfo?.name || 'Kredit'}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus transaksi "${tx.description}"? Jurnal otomatis akan dibatalkan.`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              title="Hapus Transaksi"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
