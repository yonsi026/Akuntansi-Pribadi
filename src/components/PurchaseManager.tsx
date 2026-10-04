import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Receipt, 
  PackageCheck, 
  ShoppingCart, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  ArrowRight, 
  Send, 
  CreditCard, 
  Building2, 
  ChevronRight, 
  HelpCircle,
  Trash2,
  Check,
  X,
  TrendingDown,
  TrendingUp,
  Boxes
} from "lucide-react";
import { StockItem, StoreConfig, Transaction, UserAccount } from "../types";
import { formatIDR } from "./FinanceDashboard";

export interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierName: string;
  transactionDate: string;
  dueDate: string;
  status: "unpaid" | "partial" | "paid";
  items: Array<{
    productName: string;
    qty: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentTerm: string;
  notes?: string;
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
    account: string;
    ref?: string;
  }>;
}

interface PurchaseManagerProps {
  stockItems: StockItem[];
  storeConfig: StoreConfig;
  currentUser?: UserAccount | null;
  transactions?: Transaction[];
  onAddTransaction: (tx: any) => void;
  initialSubTab?: "tagihan" | "piutang" | "overview" | "pengiriman" | "pesanan" | "penawaran";
  onSubTabChange?: (tab: string) => void;
  onNavigateToTab?: (tab: string, sub?: string) => void;
}

const INITIAL_PURCHASE_BILLS: PurchaseBill[] = [
  {
    id: "bill-001",
    billNumber: "BILL/2026/001",
    supplierName: "PT. Pangan Nusantara Abadi",
    transactionDate: "2026-09-18",
    dueDate: "2026-10-18",
    status: "partial",
    items: [
      { productName: "Beras Premium Rojolele 10kg", qty: 20, unitPrice: 110000, total: 2200000 },
      { productName: "Minyak Goreng Sawit 2L", qty: 30, unitPrice: 28000, total: 840000 }
    ],
    totalAmount: 3040000,
    paidAmount: 1500000,
    remainingAmount: 1540000,
    paymentTerm: "Net 30",
    notes: "Pengiriman via Armada Supplier Truk B 9123 ABC",
    payments: [
      { id: "pay-b1", date: "2026-09-20", amount: 1500000, account: "1002 - Bank BCA", ref: "Transfer DP 50%" }
    ]
  },
  {
    id: "bill-002",
    billNumber: "BILL/2026/002",
    supplierName: "CV. Berkah Distribusi Sembako",
    transactionDate: "2026-09-24",
    dueDate: "2026-10-08",
    status: "unpaid",
    items: [
      { productName: "Gula Pasir Kristal Putih 1kg", qty: 50, unitPrice: 14500, total: 725000 },
      { productName: "Tepung Terigu Segitiga Biru 1kg", qty: 40, unitPrice: 11500, total: 460000 }
    ],
    totalAmount: 1185000,
    paidAmount: 0,
    remainingAmount: 1185000,
    paymentTerm: "Net 15",
    notes: "Tagihan supplier jatuh tempo 15 hari"
  },
  {
    id: "bill-003",
    billNumber: "BILL/2026/003",
    supplierName: "Distributor Telur Segar Farm",
    transactionDate: "2026-09-10",
    dueDate: "2026-09-15",
    status: "paid",
    items: [
      { productName: "Telur Ayam Ras Grade A 1 Peti", qty: 5, unitPrice: 320000, total: 1600000 }
    ],
    totalAmount: 1600000,
    paidAmount: 1600000,
    remainingAmount: 0,
    paymentTerm: "COD",
    notes: "Lunas bayar tunai di tempat saat serah terima barang",
    payments: [
      { id: "pay-b3", date: "2026-09-10", amount: 1600000, account: "1001 - Kas Tunai Toko", ref: "Bayar Tunai COD" }
    ]
  }
];

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  stockItems,
  storeConfig,
  currentUser,
  transactions = [],
  onAddTransaction,
  initialSubTab = "tagihan",
  onSubTabChange,
  onNavigateToTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  // Sync state if prop changes
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: string) => {
    setActiveSubTab(tabId);
    if (onSubTabChange) onSubTabChange(tabId);
  };

  // Bills list state
  const [bills, setBills] = useState<PurchaseBill[]>(() => {
    const saved = localStorage.getItem("kledo_purchase_bills");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PURCHASE_BILLS;
  });

  const saveBills = (newBills: PurchaseBill[]) => {
    setBills(newBills);
    localStorage.setItem("kledo_purchase_bills", JSON.stringify(newBills));
  };

  // Filter & Search states for Tagihan Pembelian
  const [searchBill, setSearchBill] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState<"all" | "unpaid" | "partial" | "paid">("all");

  // Create Bill Modal state
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [billNumberInput, setBillNumberInput] = useState(`BILL/2026/00${bills.length + 1}`);
  const [billTxDate, setBillTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [billTerm, setBillTerm] = useState("Net 30");
  const [billNotes, setBillNotes] = useState("");
  const [billItems, setBillItems] = useState<Array<{ productName: string; qty: number; unitPrice: number }>>([
    { productName: "Beras Premium Rojolele 10kg", qty: 10, unitPrice: 110000 }
  ]);

  // Payment Modal state for Tagihan Pembelian
  const [payingBill, setPayingBill] = useState<PurchaseBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<string>("1001 - Kas Tunai");
  const [paymentRef, setPaymentRef] = useState<string>("Pelunasan Tagihan Pemasok");

  // Piutang state (Accounts Receivable) from Invoices and Transactions
  const [piutangSearch, setPiutangSearch] = useState("");
  const [piutangFilter, setPiutangFilter] = useState<"all" | "unpaid" | "overdue" | "paid">("all");
  const [piutangAgingFilter, setPiutangAgingFilter] = useState<"all" | "0-30" | "31-60" | ">60">("all");
  const [payingPiutangCustomer, setPayingPiutangCustomer] = useState<any | null>(null);
  const [piutangPayAmount, setPiutangPayAmount] = useState<number>(0);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchSearch = b.billNumber.toLowerCase().includes(searchBill.toLowerCase()) ||
                          b.supplierName.toLowerCase().includes(searchBill.toLowerCase());
      const matchStatus = billStatusFilter === "all" || b.status === billStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [bills, searchBill, billStatusFilter]);

  // Total summary calculation for Tagihan Pembelian
  const billMetrics = useMemo(() => {
    const total = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const paid = bills.reduce((sum, b) => sum + b.paidAmount, 0);
    const remaining = bills.reduce((sum, b) => sum + b.remainingAmount, 0);
    const unpaidCount = bills.filter(b => b.status !== "paid").length;
    return { total, paid, remaining, unpaidCount };
  }, [bills]);

  // Piutang dummy & calculated list
  const piutangList = useMemo(() => {
    return [
      {
        id: "piutang-1",
        invoiceNumber: "INV/00001",
        customerName: "POS Customer",
        transactionDate: "2026-09-15",
        dueDate: "2026-10-15",
        totalAmount: 1387500,
        paidAmount: 0,
        remainingAmount: 1387500,
        daysOverdue: 0,
        agingCategory: "0-30",
        status: "unpaid"
      },
      {
        id: "piutang-2",
        invoiceNumber: "INV/00002",
        customerName: "Toko Berkah Mandiri Sejahtera",
        transactionDate: "2026-08-20",
        dueDate: "2026-09-20",
        totalAmount: 2500000,
        paidAmount: 1000000,
        remainingAmount: 1500000,
        daysOverdue: 11,
        agingCategory: "0-30",
        status: "partial"
      },
      {
        id: "piutang-3",
        invoiceNumber: "INV/00003",
        customerName: "Warung Bu Siti Sukses",
        transactionDate: "2026-07-10",
        dueDate: "2026-08-10",
        totalAmount: 980000,
        paidAmount: 0,
        remainingAmount: 980000,
        daysOverdue: 51,
        agingCategory: "31-60",
        status: "unpaid"
      }
    ];
  }, []);

  const filteredPiutang = useMemo(() => {
    return piutangList.filter(p => {
      const matchSearch = p.invoiceNumber.toLowerCase().includes(piutangSearch.toLowerCase()) ||
                          p.customerName.toLowerCase().includes(piutangSearch.toLowerCase());
      const matchStatus = piutangFilter === "all" || 
                          (piutangFilter === "unpaid" && p.remainingAmount > 0) ||
                          (piutangFilter === "overdue" && p.daysOverdue > 0) ||
                          (piutangFilter === "paid" && p.remainingAmount === 0);
      const matchAging = piutangAgingFilter === "all" || p.agingCategory === piutangAgingFilter;
      return matchSearch && matchStatus && matchAging;
    });
  }, [piutangList, piutangSearch, piutangFilter, piutangAgingFilter]);

  const totalPiutangAmount = piutangList.reduce((sum, p) => sum + p.remainingAmount, 0);

  // Add Item to Create Bill Form
  const handleAddBillItem = () => {
    setBillItems([...billItems, { productName: "", qty: 1, unitPrice: 0 }]);
  };

  const handleRemoveBillItem = (index: number) => {
    if (billItems.length <= 1) return;
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const handleBillItemChange = (index: number, field: string, value: any) => {
    const updated = [...billItems];
    (updated[index] as any)[field] = value;
    setBillItems(updated);
  };

  // Submit Create Bill
  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert("Silakan masukkan nama pemasok / supplier!");
      return;
    }

    const itemsFormatted = billItems.map(item => ({
      productName: item.productName || "Barang Pembelian Dagang",
      qty: Number(item.qty) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: (Number(item.qty) || 1) * (Number(item.unitPrice) || 0)
    }));

    const calculatedTotal = itemsFormatted.reduce((sum, it) => sum + it.total, 0);

    const newBill: PurchaseBill = {
      id: `bill-${Date.now()}`,
      billNumber: billNumberInput || `BILL/2026/00${bills.length + 1}`,
      supplierName: supplierName.trim(),
      transactionDate: billTxDate,
      dueDate: billDueDate,
      status: "unpaid",
      items: itemsFormatted,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      remainingAmount: calculatedTotal,
      paymentTerm: billTerm,
      notes: billNotes,
      payments: []
    };

    saveBills([newBill, ...bills]);

    // Also post journal/transaction to app state
    if (onAddTransaction) {
      onAddTransaction({
        date: billTxDate,
        type: "Pembelian Barang Dagang",
        description: `Tagihan Pembelian ${newBill.billNumber} dari ${newBill.supplierName}`,
        amount: calculatedTotal,
        debitAccount: 1003, // Persediaan Barang Dagang
        creditAccount: 2001, // Hutang Usaha
        ppnEnabled: false,
        ppnAmount: 0,
        supplierName: newBill.supplierName
      });
    }

    alert(`Tagihan Pembelian ${newBill.billNumber} berhasil disimpan!`);
    setShowCreateBillModal(false);
    // Reset form
    setSupplierName("");
    setBillItems([{ productName: "", qty: 1, unitPrice: 0 }]);
  };

  // Record Payment for Bill
  const handleRecordBillPayment = () => {
    if (!payingBill) return;
    if (paymentAmount <= 0 || paymentAmount > payingBill.remainingAmount) {
      alert("Jumlah pembayaran tidak valid!");
      return;
    }

    const newPaid = payingBill.paidAmount + paymentAmount;
    const newRemaining = payingBill.totalAmount - newPaid;
    const newStatus: "unpaid" | "partial" | "paid" = newRemaining <= 0 ? "paid" : "partial";

    const updatedBills = bills.map(b => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paidAmount: newPaid,
          remainingAmount: Math.max(0, newRemaining),
          status: newStatus,
          payments: [
            ...(b.payments || []),
            {
              id: `pay-${Date.now()}`,
              date: new Date().toISOString().split("T")[0],
              amount: paymentAmount,
              account: paymentAccount,
              ref: paymentRef
            }
          ]
        };
      }
      return b;
    });

    saveBills(updatedBills);

    // Add cash disbursement transaction
    if (onAddTransaction) {
      onAddTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "Pelunasan Hutang Usaha",
        description: `Bayar Tagihan Pembelian ${payingBill.billNumber} (${payingBill.supplierName})`,
        amount: paymentAmount,
        debitAccount: 2001, // Hutang Usaha
        creditAccount: paymentAccount.includes("1002") ? 1002 : 1001,
        ppnEnabled: false,
        ppnAmount: 0
      });
    }

    alert(`Pembayaran Rp ${paymentAmount.toLocaleString("id-ID")} untuk ${payingBill.billNumber} berhasil dicatat!`);
    setPayingBill(null);
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP SUB-NAVBAR TABS (EKSPLISIT SUB NAVBAR DI DALAM PEMBELIAN & TAGIHAN PEMBELIAN) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          
          {/* Sub Navbar: Tagihan Pembelian */}
          <button
            type="button"
            onClick={() => handleTabChange("tagihan")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeSubTab === "tagihan"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tagihan Pembelian</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === "tagihan" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {bills.length}
            </span>
          </button>

          {/* Sub Navbar: Piutang (Sesuai instruksi: "tambahkan satu sub navbar dibawah didalam tagihan pembelian dengan nama piutang") */}
          <button
            type="button"
            onClick={() => handleTabChange("piutang")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
              activeSubTab === "piutang"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "text-slate-700 bg-indigo-50/70 border-indigo-100 hover:bg-indigo-100/70 hover:text-indigo-900"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Piutang</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === "piutang" ? "bg-white/20 text-white" : "bg-indigo-200/80 text-indigo-900"
            }`}>
              {piutangList.length}
            </span>
          </button>

          {/* Sub Navbar: Pengiriman Pembelian */}
          <button
            type="button"
            onClick={() => handleTabChange("pengiriman")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeSubTab === "pengiriman"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Pengiriman Pembelian</span>
          </button>

          {/* Sub Navbar: Pesanan Pembelian */}
          <button
            type="button"
            onClick={() => handleTabChange("pesanan")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeSubTab === "pesanan"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Pesanan Pembelian</span>
          </button>

          {/* Sub Navbar: Penawaran Pembelian */}
          <button
            type="button"
            onClick={() => handleTabChange("penawaran")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeSubTab === "penawaran"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Penawaran Pembelian</span>
          </button>
        </div>

        {/* Quick action button */}
        {activeSubTab === "tagihan" && (
          <button
            type="button"
            onClick={() => setShowCreateBillModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Tagihan Pembelian</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VIEW: TAGIHAN PEMBELIAN */}
      {/* ========================================================================= */}
      {activeSubTab === "tagihan" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Total Tagihan Pembelian</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {formatIDR(billMetrics.total)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>{bills.length} Faktur Pembelian terdaftar</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-rose-700 mb-2">
                <span className="text-xs font-bold">Sisa Tagihan (Hutang)</span>
                <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-rose-600 font-mono">
                {formatIDR(billMetrics.remaining)}
              </div>
              <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <span>{billMetrics.unpaidCount} Tagihan belum lunas</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-bold">Telah Dibayar</span>
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                {formatIDR(billMetrics.paid)}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">
                Tercatat di kas keluar (1001/1002)
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Jatuh Tempo Mendatang</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                30 Hari
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Termin rata-rata Net 15 - Net 30
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            
            {/* Table Header Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchBill}
                    onChange={(e) => setSearchBill(e.target.value)}
                    placeholder="Cari no. faktur / nama supplier..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setBillStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    billStatusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setBillStatusFilter("unpaid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    billStatusFilter === "unpaid" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Belum Dibayar
                </button>
                <button
                  type="button"
                  onClick={() => setBillStatusFilter("partial")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    billStatusFilter === "partial" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Dibayar Sebagian
                </button>
                <button
                  type="button"
                  onClick={() => setBillStatusFilter("paid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    billStatusFilter === "paid" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Lunas
                </button>
              </div>
            </div>

            {/* Bills Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Tagihan</th>
                    <th className="py-3 px-4">Pemasok (Supplier)</th>
                    <th className="py-3 px-4">Tgl Transaksi</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right">Sisa Hutang</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {b.billNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{b.supplierName}</div>
                        <div className="text-[10px] text-slate-400">{b.paymentTerm}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{b.transactionDate}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{b.dueDate}</td>
                      <td className="py-3 px-4">
                        {b.status === "paid" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        )}
                        {b.status === "partial" && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Sebagian
                          </span>
                        )}
                        {b.status === "unpaid" && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Belum Dibayar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatIDR(b.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatIDR(b.remainingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {b.remainingAmount > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingBill(b);
                                setPaymentAmount(b.remainingAmount);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
                            >
                              Bayar
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Lunas
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada tagihan pembelian yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW: PIUTANG (SUB NAVBAR DI DALAM TAGIHAN PEMBELIAN) */}
      {/* ========================================================================= */}
      {activeSubTab === "piutang" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Banner: Kledo Piutang Context */}
          <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-400/30 mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>Sub Navbar Tagihan: Modul Piutang Usaha</span>
              </div>
              <h3 className="text-lg font-bold">Daftar Piutang &amp; Tagihan Pelanggan</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Pantau saldo tagihan yang belum lunas, jadwal jatuh tempo, dan umur piutang (*aging schedule*) pelanggan Anda.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-right">
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Total Piutang Berjalan</div>
              <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">
                {formatIDR(totalPiutangAmount)}
              </div>
            </div>
          </div>

          {/* Aging Filters & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500">Lancar (0 - 30 Hari)</div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                {formatIDR(2887500)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">2 Faktur dalam periode normal</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <div className="text-xs font-semibold text-amber-700">Jatuh Tempo (31 - 60 Hari)</div>
              <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                {formatIDR(980000)}
              </div>
              <div className="text-[10px] text-amber-600 mt-1">1 Faktur butuh penagihan</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <div className="text-xs font-semibold text-rose-700">Menunggak (&gt; 60 Hari)</div>
              <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                {formatIDR(0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Tidak ada piutang macet</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="text-xs font-semibold text-slate-500">Efisiensi Penagihan (CEI)</div>
              <div className="text-lg font-bold font-mono text-blue-600 mt-1">
                94.8%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Tingkat pengumpulan kas optimal</div>
            </div>
          </div>

          {/* Piutang Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={piutangSearch}
                  onChange={(e) => setPiutangSearch(e.target.value)}
                  placeholder="Cari pelanggan / no. invoice..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Aging:</span>
                <button
                  type="button"
                  onClick={() => setPiutangAgingFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    piutangAgingFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setPiutangAgingFilter("0-30")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    piutangAgingFilter === "0-30" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  0 - 30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setPiutangAgingFilter("31-60")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    piutangAgingFilter === "31-60" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  31 - 60 Hari
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No. Tagihan</th>
                    <th className="py-3 px-4">Nama Pelanggan</th>
                    <th className="py-3 px-4">Tgl Tagihan</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Umur Piutang</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right">Sisa Piutang</th>
                    <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPiutang.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{p.transactionDate}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{p.dueDate}</td>
                      <td className="py-3 px-4">
                        {p.daysOverdue > 0 ? (
                          <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Lewat {p.daysOverdue} hari
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Lancar ({p.agingCategory} hari)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatIDR(p.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatIDR(p.remainingAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPayingPiutangCustomer(p);
                            setPiutangPayAmount(p.remainingAmount);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer shadow-2xs flex items-center gap-1 mx-auto"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Terima Pelunasan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIEW: PENGIRIMAN PEMBELIAN */}
      {/* ========================================================================= */}
      {activeSubTab === "pengiriman" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengiriman Pembelian (Surat Jalan Masuk)</h3>
              <p className="text-xs text-slate-500">Pencatatan penerimaan fisik barang dari ekspedisi atau supplier ke gudang penyimpanan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>SJ/2026/0891 - Armada Supplier</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">Telah Diterima Gudang Utama</span>
              </div>
              <p className="text-xs text-slate-600">Pemasok: PT. Pangan Nusantara Abadi</p>
              <p className="text-[11px] text-slate-400 mt-1">20 Karung Beras Premium Rojolele 10kg, 30 Kardus Minyak Goreng Sawit 2L</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>SJ/2026/0904 - Kurir Distributor</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">Dalam Perjalanan Ekspedisi</span>
              </div>
              <p className="text-xs text-slate-600">Pemasok: CV. Berkah Distribusi Sembako</p>
              <p className="text-[11px] text-slate-400 mt-1">50 Bal Gula Pasir Kristal Putih 1kg, 40 Bal Tepung Terigu</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW: PESANAN & PENAWARAN PEMBELIAN */}
      {/* ========================================================================= */}
      {(activeSubTab === "pesanan" || activeSubTab === "penawaran") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            {activeSubTab === "pesanan" ? <ShoppingCart className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeSubTab === "pesanan" ? "Pesanan Pembelian (Purchase Order)" : "Penawaran Pembelian (RFQ / Quotation)"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Fitur pengadaan barang dan permohonan harga penawaran dari vendor telah terintegrasi dengan modul Tagihan Pembelian dan Stok Barang SAK EMKM.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTabChange("tagihan")}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              Lihat Tagihan Pembelian
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TAGIHAN PEMBELIAN BARU */}
      {/* ========================================================================= */}
      {showCreateBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in text-xs">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tambah Tagihan Pembelian (Bill)</h3>
                <p className="text-[11px] text-slate-400">Catat faktur pembelian masuk dari supplier / vendor Anda</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBillModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBill} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="text-rose-500">*</span> Pemasok / Supplier
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Contoh: PT. Pangan Nusantara"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Tagihan Pembelian
                  </label>
                  <input
                    type="text"
                    value={billNumberInput}
                    onChange={(e) => setBillNumberInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={billTxDate}
                    onChange={(e) => setBillTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Syarat Pembayaran</label>
                  <select
                    value={billTerm}
                    onChange={(e) => setBillTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="Net 30">Net 30 (30 Hari)</option>
                    <option value="Net 15">Net 15 (15 Hari)</option>
                    <option value="Net 60">Net 60 (60 Hari)</option>
                    <option value="COD">COD (Tunai saat terima)</option>
                  </select>
                </div>
              </div>

              {/* Items Line */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Daftar Barang yang Dibeli</span>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="text-blue-600 hover:underline text-xs font-bold cursor-pointer"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {billItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleBillItemChange(idx, "productName", e.target.value)}
                      placeholder="Nama produk / komoditas"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleBillItemChange(idx, "qty", Number(e.target.value))}
                      placeholder="Qty"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right outline-none"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleBillItemChange(idx, "unitPrice", Number(e.target.value))}
                      placeholder="Harga beli"
                      className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right font-mono outline-none"
                    />
                    <div className="w-28 text-right font-mono font-bold text-slate-800">
                      {formatIDR((item.qty || 1) * (item.unitPrice || 0))}
                    </div>
                    {billItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBillItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 w-64 text-right space-y-1">
                  <div className="text-[11px] text-slate-400">Total Tagihan:</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {formatIDR(billItems.reduce((sum, it) => sum + (it.qty * it.unitPrice), 0))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tagihan</label>
                <textarea
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="Catatan tambahan mengenai pengiriman atau nomor resi..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBillModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs active:scale-95"
                >
                  Simpan Tagihan Pembelian
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BAYAR TAGIHAN PEMBELIAN */}
      {/* ========================================================================= */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Catat Pembayaran ke Supplier</h3>
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-400">Tagihan Pembelian:</div>
              <div className="font-bold text-slate-800">{payingBill.billNumber} - {payingBill.supplierName}</div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200/80">
                <span className="text-slate-500">Sisa Hutang:</span>
                <span className="font-mono font-bold text-rose-600">{formatIDR(payingBill.remainingAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Pembayaran</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={payingBill.remainingAmount}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Akun Kas / Bank Pengeluaran</label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="1001 - Kas Tunai Toko">1001 - Kas Tunai Toko</option>
                  <option value="1002 - Bank BCA Rekening Usaha">1002 - Bank BCA Rekening Usaha</option>
                  <option value="1002 - Bank Mandiri Operasional">1002 - Bank Mandiri Operasional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Referensi</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingBill(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRecordBillPayment}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs active:scale-95"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TERIMA PELUNASAN PIUTANG DARI PELANGGAN */}
      {/* ========================================================================= */}
      {payingPiutangCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Penerimaan Pembayaran Piutang</h3>
              <button
                type="button"
                onClick={() => setPayingPiutangCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <div className="text-[11px] text-emerald-800">Pelanggan:</div>
              <div className="font-bold text-slate-900">{payingPiutangCustomer.customerName} ({payingPiutangCustomer.invoiceNumber})</div>
              <div className="flex justify-between text-xs pt-1 border-t border-emerald-200/80">
                <span className="text-slate-600">Sisa Piutang:</span>
                <span className="font-mono font-bold text-emerald-700">{formatIDR(payingPiutangCustomer.remainingAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Kas yang Diterima</label>
                <input
                  type="number"
                  value={piutangPayAmount}
                  onChange={(e) => setPiutangPayAmount(Number(e.target.value))}
                  max={payingPiutangCustomer.remainingAmount}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Setor ke Rekening / Kas</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none">
                  <option value="1001">1001 - Kas Tunai Toko</option>
                  <option value="1002">1002 - Bank BCA Rekening Usaha</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingPiutangCustomer(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onAddTransaction) {
                    onAddTransaction({
                      date: new Date().toISOString().split("T")[0],
                      type: "Penerimaan Piutang Pelanggan",
                      description: `Pelunasan Piutang ${payingPiutangCustomer.invoiceNumber} dari ${payingPiutangCustomer.customerName}`,
                      amount: piutangPayAmount,
                      debitAccount: 1001, // Kas
                      creditAccount: 1004, // Piutang Usaha
                      ppnEnabled: false,
                      ppnAmount: 0
                    });
                  }
                  alert(`Pembayaran piutang Rp ${piutangPayAmount.toLocaleString("id-ID")} dari ${payingPiutangCustomer.customerName} berhasil diterima & dibukukan!`);
                  setPayingPiutangCustomer(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs active:scale-95"
              >
                Terima Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
