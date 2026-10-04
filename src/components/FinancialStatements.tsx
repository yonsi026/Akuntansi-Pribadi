import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  HelpCircle,
  FileCode,
  DollarSign,
  Upload,
  Calendar,
  Filter,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  X,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  LayoutList,
  CreditCard,
  AlertCircle,
  Phone,
  User as UserIcon,
  Search,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  Receipt,
  CheckCheck,
  Scale,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Cell,
  PieChart, 
  Pie
} from "recharts";
import { FinancialStats, Transaction, StockItem, JournalEntry, StoreConfig, Invoice } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { computeTrialBalance, generateJournal, computeFinancialStats } from "../utils/accountingEngine";
import { exportToXLSX } from "../utils/xlsxExport";
import { getStoredInvoices } from "../utils/invoiceService";
import { 
  parseExcelFile, 
  mergeTransactionsWithoutOverwrite, 
  mergeStockItemsSafely, 
  ParsedImportData,
  getTransactionFingerprint
} from "../utils/xlsxImport";
import { formatIDR } from "./FinanceDashboard";
import { UniversalPrintModal } from "./UniversalPrintModal";
import { PrintTemplate, triggerPrintA4, ReportData } from "./PrintTemplate";

interface FinancialStatementsProps {
  stats: FinancialStats;
  transactions: Transaction[];
  stockItems: StockItem[];
  journal: JournalEntry[];
  storeConfig?: StoreConfig;
  onImportTransactions?: (mergedTxs: Transaction[], mergedStocks?: StockItem[]) => void;
  onUpdateTransactions?: (txs: Transaction[]) => void;
  initialReport?: 'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'piutang' | 'ekspor' | 'import';
  onReportChange?: (report: 'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'piutang' | 'ekspor' | 'import') => void;
}

const MONTH_NAMES = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

export function angkaTerbilang(nilai: number): string {
  if (!nilai || nilai <= 0) return "Nol Rupiah";
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  function terbilang(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return `${terbilang(n - 10)} Belas`;
    if (n < 100) return `${terbilang(Math.floor(n / 10))} Puluh ${terbilang(n % 10)}`.trim();
    if (n < 200) return `Seratus ${terbilang(n - 100)}`.trim();
    if (n < 1000) return `${terbilang(Math.floor(n / 100))} Ratus ${terbilang(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${terbilang(n - 1000)}`.trim();
    if (n < 1000000) return `${terbilang(Math.floor(n / 1000))} Ribu ${terbilang(n % 1000)}`.trim();
    if (n < 1000000000) return `${terbilang(Math.floor(n / 1000000))} Juta ${terbilang(n % 1000000)}`.trim();
    if (n < 1000000000000) return `${terbilang(Math.floor(n / 1000000000))} Miliar ${terbilang(n % 1000000000)}`.trim();
    return `${terbilang(Math.floor(n / 1000000000000))} Triliun ${terbilang(n % 1000000000000)}`.trim();
  }

  return `${terbilang(Math.floor(nilai))} Rupiah`;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
  stats,
  transactions,
  stockItems,
  journal,
  storeConfig,
  onImportTransactions,
  onUpdateTransactions,
  initialReport,
  onReportChange
}) => {
  const [activeReport, setActiveReport] = useState<'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'piutang' | 'ekspor' | 'import'>(initialReport || 'labarugi');

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  const changeReport = (report: 'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'piutang' | 'ekspor' | 'import') => {
    setActiveReport(report);
    if (onReportChange) {
      onReportChange(report);
    }
  };

  // Load customer invoices & credit sales states for Daftar Piutang Pelanggan
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [piutangSearch, setPiutangSearch] = useState<string>("");
  const [piutangStatusFilter, setPiutangStatusFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');
  const [piutangAgingFilter, setPiutangAgingFilter] = useState<'all' | 'current' | '1-30' | '31-60' | '>60'>('all');
  const [piutangChartView, setPiutangChartView] = useState<'both' | 'bar' | 'donut'>('both');
  
  // Payment recording states for Pelunasan Piutang
  const [selectedReceivableForPayment, setSelectedReceivableForPayment] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentSourceAccount, setPaymentSourceAccount] = useState<number>(1001);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState<string>("");
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>("");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [settledReceiptData, setSettledReceiptData] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  useEffect(() => {
    const handleFocus = () => {
      setInvoices(getStoredInvoices());
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // --- PERIOD & DATE FILTERING STATES (BULAN, TANGGAL & TAHUN) ---
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, "0");

  const [filterMode, setFilterMode] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Extract all distinct years available in transactions for filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set<string>(transactions.map(t => t.date.slice(0, 4)).filter(Boolean));
    years.add(currentYearStr);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentYearStr]);

  // Derive filtered transactions according to Bulan, Tanggal & Tahun
  const activeTransactions = useMemo(() => {
    if (filterMode === 'month') {
      const prefix = `${selectedYear}-${selectedMonth}`;
      return transactions.filter(t => t.date.startsWith(prefix));
    }
    if (filterMode === 'custom') {
      return transactions.filter(t => {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
        return true;
      });
    }
    return transactions;
  }, [transactions, filterMode, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Derive journal & stats for the active period
  const activeJournal = useMemo(() => {
    return generateJournal(activeTransactions);
  }, [activeTransactions]);

  const activeStats = useMemo(() => {
    return computeFinancialStats(activeTransactions, activeJournal);
  }, [activeTransactions, activeJournal]);

  const trialBalance = useMemo(() => computeTrialBalance(activeJournal), [activeJournal]);
  const totalTbDebit = trialBalance.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalTbCredit = trialBalance.reduce((sum, item) => sum + (item.credit || 0), 0);
  const isTbBalanced = Math.abs(totalTbDebit - totalTbCredit) < 1;

  // --- ARUS KAS CORE CALCULATIONS (DIRECT METHOD) FOR ACTIVE PERIOD ---
  const receiptsFromCustomers = activeTransactions
    .filter(t => t.type === 'Penerimaan' || t.type === 'Penjualan Stok' || t.type === 'Penjualan')
    .reduce((acc, t) => acc + t.amount, 0);

  const paymentsForStock = activeTransactions
    .filter(t => t.type === 'Pembelian Stok' || t.type === 'Pembelian')
    .reduce((acc, t) => acc + t.amount, 0);

  const paymentsForExpenses = activeTransactions
    .filter(t => 
      t.type === 'Pengeluaran' || 
      t.type === 'Biaya Operasional' || 
      t.type === 'Gaji Karyawan' || 
      t.type === 'Listrik & Air' || 
      t.type === 'Sewa Toko' || 
      t.type === 'Internet & Pulsa' || 
      t.type === 'Perlengkapan Toko' || 
      t.type === 'Servis & Perbaikan'
    )
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFromOperations = receiptsFromCustomers - paymentsForStock - paymentsForExpenses;
  const netCashFromInvesting = 0; 

  const capitalInjections = activeTransactions
    .filter(t => t.type === 'Setor Modal')
    .reduce((acc, t) => acc + t.amount, 0);

  const drawingsPaid = activeTransactions
    .filter(t => t.type === 'Tarik Prive')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFromFinancing = capitalInjections - drawingsPaid;
  const netIncreaseDecreaseInCash = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
  const initialCash = 0;
  const finalCash = netIncreaseDecreaseInCash;

  // --- EXCEL IMPORT STATES ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [includeStocks, setIncludeStocks] = useState<boolean>(true);
  const [importNotification, setImportNotification] = useState<{
    message: string;
    addedCount: number;
    skippedCount: number;
    primaryMonth?: string;
  } | null>(null);

  // --- EXCEL EXPORT STATES ---
  const [exportState, setExportState] = useState<{
    loading: boolean;
    success?: boolean;
    fileName?: string;
    sheetCount?: number;
    blobUrl?: string;
    error?: string;
  } | null>(null);

  // Helper description of current filter period for subtitles & print copies
  const getPeriodLabel = () => {
    if (filterMode === 'month') {
      const monthObj = MONTH_NAMES.find(m => m.value === selectedMonth);
      return `Bulan ${monthObj?.label || selectedMonth} ${selectedYear}`;
    }
    if (filterMode === 'custom') {
      const start = customStartDate ? new Date(customStartDate).toLocaleDateString('id-ID') : 'Awal Pembukuan';
      const end = customEndDate ? new Date(customEndDate).toLocaleDateString('id-ID') : 'Hari Ini';
      return `Rentang Tanggal: ${start} s/d ${end}`;
    }
    return `Semua Periode Pembukuan (Akumulasi s/d ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })})`;
  };

  // Display view mode: 'standard' (interactive cards) or 'print-sheet' (dedicated A4 PrintTemplate view directly in-page)
  const [displayMode, setDisplayMode] = useState<'standard' | 'print-sheet'>('standard');
  const [showA4PrintModal, setShowA4PrintModal] = useState<boolean>(false);

  const [printModalData, setPrintModalData] = useState<{
    isOpen: boolean;
    title: string;
    filename: string;
    html: string;
  }>({
    isOpen: false,
    title: "",
    filename: "",
    html: ""
  });

  // --- DAFTAR PIUTANG PELANGGAN & AGING SCHEDULE (SAK EMKM) ---
  const creditSalesReceivables = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Pull credit sales transactions from activeTransactions (or fallback to transactions)
    const txSource = activeTransactions.length > 0 ? activeTransactions : transactions;
    const creditTxs = txSource.filter(t => 
      t.type === 'Penjualan Kredit' || 
      t.isCreditSale || 
      t.debitAccount === 1002 ||
      (t.type === 'Penjualan' && t.remainingAmount !== undefined && t.remainingAmount > 0)
    );

    const fromTransactions = creditTxs.map(t => {
      const total = t.amount;
      const paid = t.paidAmount || 0;
      const remaining = t.remainingAmount !== undefined ? t.remainingAmount : Math.max(0, total - paid);

      let dueDate = t.dueDate;
      if (!dueDate) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          dueDate = d.toISOString().split('T')[0];
        } else {
          dueDate = t.date;
        }
      }

      let customer = t.customerName;
      if (!customer) {
        const match = t.description.match(/(?:—|-|ke|untuk)\s+([A-Za-z0-9\s.]+)/i);
        customer = match ? match[1].trim() : "Pelanggan Kredit";
      }

      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = remaining > 0 && diffDays > 0;

      let agingCategory = "Lunas";
      let agingBucket: 'current' | '1-30' | '31-60' | '>60' = 'current';

      if (remaining > 0) {
        if (diffDays <= 0) {
          agingCategory = "Belum Jatuh Tempo (Lancar)";
          agingBucket = 'current';
        } else if (diffDays <= 30) {
          agingCategory = `Lewat 1-30 Hari (${diffDays} Hari)`;
          agingBucket = '1-30';
        } else if (diffDays <= 60) {
          agingCategory = `Lewat 31-60 Hari (${diffDays} Hari)`;
          agingBucket = '31-60';
        } else {
          agingCategory = `Lewat >60 Hari (${diffDays} Hari)`;
          agingBucket = '>60';
        }
      }

      return {
        id: t.id,
        invoiceNumber: t.invoiceNumber || `FK-${t.id.slice(0, 6).toUpperCase()}`,
        customerName: customer,
        customerPhone: t.customerPhone || "-",
        customerAddress: t.customerAddress || "-",
        transactionDate: t.date,
        dueDate,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        diffDays,
        isOverdue,
        agingCategory,
        agingBucket,
        source: 'transaction' as const,
        status: remaining <= 0 ? ('paid' as const) : (paid > 0 ? ('partial' as const) : ('unpaid' as const)),
        description: t.description,
        originalTxId: t.id,
        paymentHistory: t.paymentHistory || []
      };
    });

    // 2. Also incorporate invoices from localStorage (if not already matched)
    const existingRefNumbers = new Set(fromTransactions.map(x => x.invoiceNumber));
    const fromInvoices = invoices
      .filter(inv => !existingRefNumbers.has(inv.invoiceNumber))
      .map(inv => {
        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = inv.remainingAmount > 0 && diffDays > 0;

        let agingCategory = "Lunas";
        let agingBucket: 'current' | '1-30' | '31-60' | '>60' = 'current';

        if (inv.remainingAmount > 0) {
          if (diffDays <= 0) {
            agingCategory = "Belum Jatuh Tempo (Lancar)";
            agingBucket = 'current';
          } else if (diffDays <= 30) {
            agingCategory = `Lewat 1-30 Hari (${diffDays} Hari)`;
            agingBucket = '1-30';
          } else if (diffDays <= 60) {
            agingCategory = `Lewat 31-60 Hari (${diffDays} Hari)`;
            agingBucket = '31-60';
          } else {
            agingCategory = `Lewat >60 Hari (${diffDays} Hari)`;
            agingBucket = '>60';
          }
        }

        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          customerPhone: inv.customerPhone || "-",
          customerAddress: inv.customerAddress || "-",
          transactionDate: inv.transactionDate,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          diffDays,
          isOverdue,
          agingCategory,
          agingBucket,
          source: 'invoice' as const,
          status: inv.status,
          description: inv.notes || `Faktur Penjualan ${inv.invoiceNumber}`,
          paymentHistory: (inv.payments || []).map(p => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
            receiptNumber: p.paymentNumber,
            accountName: p.accountName,
            note: p.reference
          }))
        };
      });

    const combined = [...fromTransactions, ...fromInvoices];

    // Fallback demo receivables if both transactions and invoices have no credit records
    if (combined.length === 0) {
      const demo1Due = new Date(today.getTime() - 25 * 86400000).toISOString().split('T')[0];
      const demo1Tx = new Date(today.getTime() - 55 * 86400000).toISOString().split('T')[0];
      const demo2Due = new Date(today.getTime() - 48 * 86400000).toISOString().split('T')[0];
      const demo2Tx = new Date(today.getTime() - 78 * 86400000).toISOString().split('T')[0];
      const demo3Due = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];
      const demo3Tx = today.toISOString().split('T')[0];
      const demo4Due = new Date(today.getTime() - 75 * 86400000).toISOString().split('T')[0];
      const demo4Tx = new Date(today.getTime() - 105 * 86400000).toISOString().split('T')[0];

      return [
        {
          id: "demo-rec-1",
          invoiceNumber: "FPK/2026/001",
          customerName: "PT Sumber Rejeki Abadi",
          customerPhone: "0812-8877-6655",
          customerAddress: "Jl. Industri Raya No. 12, Cikarang",
          transactionDate: demo1Tx,
          dueDate: demo1Due,
          totalAmount: 3500000,
          paidAmount: 1000000,
          remainingAmount: 2500000,
          diffDays: 25,
          isOverdue: true,
          agingCategory: "Lewat 1-30 Hari (25 Hari)",
          agingBucket: "1-30" as const,
          source: 'transaction' as const,
          status: 'partial' as const,
          description: "Penjualan Kredit Grosir Termin 30 Hari — PT Sumber Rejeki Abadi",
          paymentHistory: [
            {
              id: "demo-pay-1",
              date: demo1Tx,
              amount: 1000000,
              receiptNumber: "BKM/2026/05/0122",
              accountName: "1001 Kas & Setara Kas",
              note: "Uang muka termin penjualan kredit"
            }
          ]
        },
        {
          id: "demo-rec-2",
          invoiceNumber: "FPK/2026/002",
          customerName: "Koperasi Karyawan Sejahtera",
          customerPhone: "0813-2233-4455",
          customerAddress: "Kawasan Industri MM2100",
          transactionDate: demo2Tx,
          dueDate: demo2Due,
          totalAmount: 1800000,
          paidAmount: 0,
          remainingAmount: 1800000,
          diffDays: 48,
          isOverdue: true,
          agingCategory: "Lewat 31-60 Hari (48 Hari)",
          agingBucket: "31-60" as const,
          source: 'transaction' as const,
          status: 'unpaid' as const,
          description: "Penjualan Kredit Paket Usaha — Koperasi Karyawan Sejahtera",
          paymentHistory: []
        },
        {
          id: "demo-rec-3",
          invoiceNumber: "FPK/2026/003",
          customerName: "Toko Grosir Berkah Barokah",
          customerPhone: "0817-9988-1122",
          customerAddress: "Jl. Surya Kencana No. 88, Bogor",
          transactionDate: demo3Tx,
          dueDate: demo3Due,
          totalAmount: 2750000,
          paidAmount: 750000,
          remainingAmount: 2000000,
          diffDays: -14,
          isOverdue: false,
          agingCategory: "Belum Jatuh Tempo (Lancar)",
          agingBucket: "current" as const,
          source: 'transaction' as const,
          status: 'partial' as const,
          description: "Penjualan Kredit Barang Dagang Tempo 14 Hari — Toko Berkah Barokah",
          paymentHistory: [
            {
              id: "demo-pay-3",
              date: demo3Tx,
              amount: 750000,
              receiptNumber: "BKM/2026/06/0045",
              accountName: "1001 Kas & Setara Kas",
              note: "Pembayaran termin ke-1"
            }
          ]
        },
        {
          id: "demo-rec-4",
          invoiceNumber: "FPK/2026/004",
          customerName: "CV Mitra Sarana Logistik",
          customerPhone: "0821-3344-9900",
          customerAddress: "Jl. Pelabuhan Tanjung Mas No. 45, Semarang",
          transactionDate: demo4Tx,
          dueDate: demo4Due,
          totalAmount: 1200000,
          paidAmount: 0,
          remainingAmount: 1200000,
          diffDays: 75,
          isOverdue: true,
          agingCategory: "Lewat >60 Hari (75 Hari)",
          agingBucket: ">60" as const,
          source: 'transaction' as const,
          status: 'unpaid' as const,
          description: "Penjualan Kredit Bahan Pendukung — CV Mitra Sarana Logistik",
          paymentHistory: []
        }
      ];
    }

    return combined;
  }, [activeTransactions, transactions, invoices]);

  const unpaidReceivables = useMemo(() => {
    return creditSalesReceivables.filter(inv => inv.remainingAmount > 0);
  }, [creditSalesReceivables]);

  const totalOutstandingPiutang = useMemo(() => {
    return unpaidReceivables.reduce((sum, inv) => sum + inv.remainingAmount, 0);
  }, [unpaidReceivables]);

  const totalOverduePiutang = useMemo(() => {
    return unpaidReceivables.filter(inv => inv.isOverdue).reduce((sum, inv) => sum + inv.remainingAmount, 0);
  }, [unpaidReceivables]);

  const totalCurrentPiutang = useMemo(() => {
    return unpaidReceivables.filter(inv => !inv.isOverdue).reduce((sum, inv) => sum + inv.remainingAmount, 0);
  }, [unpaidReceivables]);

  const totalAllInvoiced = useMemo(() => {
    return creditSalesReceivables.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [creditSalesReceivables]);

  const totalAllPaid = useMemo(() => {
    return creditSalesReceivables.reduce((sum, inv) => sum + inv.paidAmount, 0);
  }, [creditSalesReceivables]);

  // --- AGING CHART DATA (RECHARTS) FOR DAFTAR PIUTANG PELANGGAN ---
  const agingChartData = useMemo(() => {
    // 4 Kategori bucket: Belum Jatuh Tempo, 1-30 Hari, 31-60 Hari, dan >60 Hari
    const currentItems = unpaidReceivables.filter(i => !i.isOverdue || i.diffDays <= 0 || i.agingBucket === 'current');
    const late1to30 = unpaidReceivables.filter(i => i.isOverdue && i.diffDays > 0 && i.diffDays <= 30);
    const late31to60 = unpaidReceivables.filter(i => i.isOverdue && i.diffDays > 30 && i.diffDays <= 60);
    const lateOver60 = unpaidReceivables.filter(i => i.isOverdue && i.diffDays > 60);

    const sumCurrent = currentItems.reduce((sum, i) => sum + i.remainingAmount, 0);
    const sum1to30 = late1to30.reduce((sum, i) => sum + i.remainingAmount, 0);
    const sum31to60 = late31to60.reduce((sum, i) => sum + i.remainingAmount, 0);
    const sumOver60 = lateOver60.reduce((sum, i) => sum + i.remainingAmount, 0);

    const grandTotal = (sumCurrent + sum1to30 + sum31to60 + sumOver60) || 1;

    return [
      {
        bucketKey: 'current' as const,
        name: 'Belum Jatuh Tempo',
        shortName: 'Belum Tempo',
        amount: sumCurrent,
        count: currentItems.length,
        percentage: Number(((sumCurrent / grandTotal) * 100).toFixed(1)),
        color: '#2563EB', // Blue-600
        fillColor: '#3B82F6', // Blue-500
        bgClass: 'bg-blue-50 text-blue-900 border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800',
        badge: 'Lancar',
        statusDesc: 'Masih dalam masa tenggang termin kredit',
        recommendation: 'Jadwalkan konfirmasi tagihan H-3 jatuh tempo'
      },
      {
        bucketKey: '1-30' as const,
        name: '1-30 Hari',
        shortName: '1-30 Hari',
        amount: sum1to30,
        count: late1to30.length,
        percentage: Number(((sum1to30 / grandTotal) * 100).toFixed(1)),
        color: '#D97706', // Amber-600
        fillColor: '#F59E0B', // Amber-500
        bgClass: 'bg-amber-50 text-amber-900 border-amber-200',
        badgeColor: 'bg-amber-100 text-amber-800',
        badge: 'Perlu Follow-up',
        statusDesc: 'Lewat tempo 1 s/d 30 hari',
        recommendation: 'Kirim pengingat ramah via WhatsApp / Telepon'
      },
      {
        bucketKey: '31-60' as const,
        name: '31-60 Hari',
        shortName: '31-60 Hari',
        amount: sum31to60,
        count: late31to60.length,
        percentage: Number(((sum31to60 / grandTotal) * 100).toFixed(1)),
        color: '#EA580C', // Orange-600
        fillColor: '#F97316', // Orange-500
        bgClass: 'bg-orange-50 text-orange-900 border-orange-200',
        badgeColor: 'bg-orange-100 text-orange-800',
        badge: 'Perhatian Khusus',
        statusDesc: 'Lewat tempo 31 s/d 60 hari',
        recommendation: 'Kirim surat peringatan 1 & tunda pesanan kredit baru'
      },
      {
        bucketKey: '>60' as const,
        name: '>60 Hari',
        shortName: '>60 Hari',
        amount: sumOver60,
        count: lateOver60.length,
        percentage: Number(((sumOver60 / grandTotal) * 100).toFixed(1)),
        color: '#DC2626', // Red-600
        fillColor: '#EF4444', // Red-500
        bgClass: 'bg-rose-50 text-rose-900 border-rose-200',
        badgeColor: 'bg-rose-100 text-rose-800',
        badge: 'Kritis / Macet',
        statusDesc: 'Lewat tempo >60 hari',
        recommendation: 'Eskalasi penagihan langsung / pembekuan fasilitas kredit'
      }
    ];
  }, [unpaidReceivables]);

  // Payment settlement action handler
  const handleOpenPaymentModal = (item: any) => {
    setSelectedReceivableForPayment(item);
    setPaymentMode('full');
    setPaymentAmountInput(item.remainingAmount);
    setPaymentDateInput(new Date().toISOString().split('T')[0]);
    setPaymentSourceAccount(1001);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    setPaymentReceiptNumber(`BKM/${dateCode}/${randCode}`);
    setPaymentNotesInput(`Pelunasan Penuh Tagihan ${item.invoiceNumber} — ${item.customerName}`);
    setPaymentError(null);
  };

  const handleOpenReceiptFromHistory = (item: any, payRecord?: any) => {
    const payAmount = payRecord ? payRecord.amount : (item.paidAmount || item.totalAmount);
    const date = payRecord ? payRecord.date : (item.transactionDate || new Date().toISOString().split('T')[0]);
    const receiptNo = (payRecord && payRecord.receiptNumber) || `BKM-${item.invoiceNumber.replace(/[^A-Za-z0-9]/g, '')}`;

    setSettledReceiptData({
      receiptNumber: receiptNo,
      date,
      customerName: item.customerName,
      customerPhone: item.customerPhone || "-",
      customerAddress: item.customerAddress || "-",
      invoiceNumber: item.invoiceNumber,
      amount: payAmount,
      terbilang: angkaTerbilang(payAmount),
      notes: (payRecord && payRecord.note) || `Bukti Kas Masuk / Pelunasan Piutang Faktur ${item.invoiceNumber}`,
      originalTotal: item.totalAmount,
      previousPaid: Math.max(0, item.totalAmount - item.remainingAmount - payAmount),
      currentPayment: payAmount,
      newRemaining: item.remainingAmount,
      isFull: item.remainingAmount <= 0,
      paymentMethod: (payRecord && payRecord.accountName) || "1001 Kas & Setara Kas (Tunai/Kasir)"
    });
    setShowReceiptModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedReceivableForPayment) return;
    if (paymentAmountInput <= 0) {
      setPaymentError("Jumlah pembayaran harus lebih besar dari Rp 0!");
      return;
    }
    if (paymentAmountInput > selectedReceivableForPayment.remainingAmount) {
      setPaymentError(`Jumlah pembayaran (Rp ${paymentAmountInput.toLocaleString('id-ID')}) tidak boleh melebihi sisa piutang (Rp ${selectedReceivableForPayment.remainingAmount.toLocaleString('id-ID')})!`);
      return;
    }
    setPaymentError(null);

    const payAmount = paymentAmountInput;
    const isFullSettlement = payAmount >= selectedReceivableForPayment.remainingAmount;
    const receiptNo = paymentReceiptNumber.trim() || `BKM/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`;
    const newRemaining = Math.max(0, selectedReceivableForPayment.remainingAmount - payAmount);
    const newPaidTotal = (selectedReceivableForPayment.paidAmount || 0) + payAmount;
    const resolvedStatus: 'paid' | 'partial' = newRemaining <= 0 ? 'paid' : 'partial';

    // 1. Create double-entry receipt transaction (Debit Kas 1001, Credit Piutang Usaha 1002)
    const newReceiptTx: Transaction = {
      id: `rcp-${Date.now()}`,
      date: paymentDateInput,
      description: paymentNotesInput.trim() || `Pelunasan Piutang ${selectedReceivableForPayment.invoiceNumber} — ${selectedReceivableForPayment.customerName}`,
      amount: payAmount,
      type: 'Penerimaan',
      ppnEnabled: false,
      ppnAmount: 0,
      debitAccount: paymentSourceAccount, // 1001 Kas & Setara Kas
      creditAccount: 1002, // 1002 Piutang Usaha
      invoiceNumber: selectedReceivableForPayment.invoiceNumber,
      customerName: selectedReceivableForPayment.customerName,
      customerPhone: selectedReceivableForPayment.customerPhone,
      customerAddress: selectedReceivableForPayment.customerAddress,
      receiptNumber: receiptNo
    };

    // 2. Update existing transactions
    let updatedTxs = [...transactions];
    const matchTxIndex = updatedTxs.findIndex(t => 
      t.id === selectedReceivableForPayment.originalTxId || 
      t.invoiceNumber === selectedReceivableForPayment.invoiceNumber
    );

    const newPaymentHistoryEntry = {
      id: `pay-${Date.now()}`,
      date: paymentDateInput,
      amount: payAmount,
      receiptNumber: receiptNo,
      accountName: paymentSourceAccount === 1001 ? "1001 Kas & Setara Kas (Tunai/Kasir)" : `Akun ${paymentSourceAccount}`,
      note: paymentNotesInput.trim() || (isFullSettlement ? "Pelunasan Penuh (100%)" : "Pembayaran Parsial / Cicilan")
    };

    if (matchTxIndex >= 0) {
      const target = updatedTxs[matchTxIndex];
      const prevHistory = target.paymentHistory || [];
      updatedTxs[matchTxIndex] = {
        ...target,
        paidAmount: newPaidTotal,
        remainingAmount: newRemaining,
        status: resolvedStatus,
        paymentHistory: [...prevHistory, newPaymentHistoryEntry]
      };
    } else {
      // Materialize base credit sale transaction if from virtual demo
      const baseCreditTx: Transaction = {
        id: selectedReceivableForPayment.originalTxId || `tx-cred-${Date.now()}`,
        date: selectedReceivableForPayment.transactionDate,
        dueDate: selectedReceivableForPayment.dueDate,
        invoiceNumber: selectedReceivableForPayment.invoiceNumber,
        customerName: selectedReceivableForPayment.customerName,
        customerPhone: selectedReceivableForPayment.customerPhone,
        customerAddress: selectedReceivableForPayment.customerAddress,
        description: selectedReceivableForPayment.description || `Penjualan Kredit — ${selectedReceivableForPayment.customerName}`,
        amount: selectedReceivableForPayment.totalAmount,
        paidAmount: newPaidTotal,
        remainingAmount: newRemaining,
        type: 'Penjualan Kredit',
        isCreditSale: true,
        status: resolvedStatus,
        ppnEnabled: false,
        ppnAmount: 0,
        debitAccount: 1002, // Piutang Usaha
        creditAccount: 4001, // Pendapatan Penjualan
        paymentHistory: [newPaymentHistoryEntry]
      };
      updatedTxs.push(baseCreditTx);
    }

    // Add receipt transaction
    updatedTxs.push(newReceiptTx);

    if (onUpdateTransactions) {
      onUpdateTransactions(updatedTxs);
    } else if (onImportTransactions) {
      onImportTransactions(updatedTxs, stockItems);
    } else {
      localStorage.setItem("akuntan_ai_tx_v1", JSON.stringify(updatedTxs));
    }

    // 3. Update invoice in localStorage if applicable
    if (selectedReceivableForPayment.source === 'invoice') {
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === selectedReceivableForPayment.id || inv.invoiceNumber === selectedReceivableForPayment.invoiceNumber) {
          return {
            ...inv,
            paidAmount: newPaidTotal,
            remainingAmount: newRemaining,
            status: resolvedStatus,
            payments: [
              ...(inv.payments || []),
              {
                id: `pay-${Date.now()}`,
                paymentNumber: receiptNo,
                date: paymentDateInput,
                amount: payAmount,
                accountId: paymentSourceAccount,
                accountName: paymentSourceAccount === 1001 ? "1001 Kas & Setara Kas" : `Akun ${paymentSourceAccount}`,
                reference: paymentNotesInput.trim() || (isFullSettlement ? "Pelunasan Penuh" : "Pembayaran Sebagian"),
                createdAt: new Date().toISOString()
              }
            ]
          };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
      localStorage.setItem("akuntan_invoices_v1", JSON.stringify(updatedInvoices));
    }

    // Prepare receipt voucher for instant viewing/printing
    const receiptData = {
      receiptNumber: receiptNo,
      date: paymentDateInput,
      customerName: selectedReceivableForPayment.customerName,
      customerPhone: selectedReceivableForPayment.customerPhone,
      customerAddress: selectedReceivableForPayment.customerAddress,
      invoiceNumber: selectedReceivableForPayment.invoiceNumber,
      amount: payAmount,
      terbilang: angkaTerbilang(payAmount),
      notes: paymentNotesInput.trim() || `Pelunasan ${isFullSettlement ? 'Penuh' : 'Sebagian'} Tagihan Faktur ${selectedReceivableForPayment.invoiceNumber}`,
      originalTotal: selectedReceivableForPayment.totalAmount,
      previousPaid: selectedReceivableForPayment.paidAmount || 0,
      currentPayment: payAmount,
      newRemaining: newRemaining,
      isFull: isFullSettlement,
      paymentMethod: paymentSourceAccount === 1001 ? "Kas & Setara Kas (Tunai/Kasir)" : `Akun Kas Bank (${paymentSourceAccount})`
    };

    setSettledReceiptData(receiptData);
    setPaymentSuccessMessage(
      `Pembayaran ${isFullSettlement ? 'Lunas Penuh (100%)' : 'Parsial / Sebagian'} sebesar Rp ${payAmount.toLocaleString('id-ID')} untuk ${selectedReceivableForPayment.customerName} (${selectedReceivableForPayment.invoiceNumber}) berhasil dibukukan! Kas bertambah dan saldo piutang di Neraca otomatis berkurang.`
    );
    setSelectedReceivableForPayment(null);
  };

  // Generates structured, 100% compliant ReportData for dedicated PrintTemplate component
  const generateA4ReportData = (reportType: string): ReportData => {
    const periodLabel = getPeriodLabel();
    const commonSignatures = {
      preparer: {
        role: "Dibuat Oleh,",
        title: "Petugas Keuangan / Staf Akuntansi",
        name: "Staf Akuntansi SAK EMKM",
        date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      },
      approver: {
        role: "Mengetahui & Disetujui Oleh,",
        title: "Pimpinan / Pemilik Usaha",
        name: storeConfig?.storeName || "Pimpinan Usaha",
        subtitle: storeConfig?.storeCity || "Indonesia"
      }
    };

    if (reportType === 'neraca') {
      const kas = trialBalance.find(t => t.accountId === 1001)?.debit || 0;
      const piutang = trialBalance.find(t => t.accountId === 1002)?.debit || 0;
      const persediaan = trialBalance.find(t => t.accountId === 1003)?.debit || 0;
      const ppnMasukan = trialBalance.find(t => t.accountId === 1004)?.debit || 0;
      const peralatan = trialBalance.find(t => t.accountId === 1005)?.debit || 0;

      const totalAsetLancar = kas + piutang + persediaan + ppnMasukan;
      const totalAsetTetap = peralatan;
      const totalAset = activeStats.totalAssets || (totalAsetLancar + totalAsetTetap);

      const utangUsaha = trialBalance.find(t => t.accountId === 2001)?.credit || 0;
      const utangPph = activeStats.pph || 0;
      const ppnKeluaran = trialBalance.find(t => t.accountId === 2003)?.credit || 0;
      const totalLiabilitas = activeStats.totalLiabilities || (utangUsaha + utangPph + ppnKeluaran);

      const modalDisetor = trialBalance.find(t => t.accountId === 3001)?.credit || 0;
      const prive = trialBalance.find(t => t.accountId === 3002)?.debit || 0;
      const labaBerjalan = activeStats.netProfit || 0;
      const totalEkuitas = activeStats.totalEquity || (modalDisetor - prive + labaBerjalan);

      const balanceSheetRows = [
        { code: "1001", name: "Kas & Setara Kas Toko", group: "Aset Lancar", amount: kas },
        { code: "1002", name: "Piutang Usaha Penjualan", group: "Aset Lancar", amount: piutang },
        { code: "1003", name: "Persediaan Barang Dagang (Stok)", group: "Aset Lancar", amount: persediaan },
        { code: "1004", name: "PPN Masukan (Pajak Pembelian)", group: "Aset Lancar", amount: ppnMasukan },
        { code: "1005", name: "Peralatan Toko & Inventaris", group: "Aset Tetap", amount: peralatan },
        { code: "2001", name: "Utang Usaha / Supplier", group: "Liabilitas", amount: utangUsaha },
        { code: "2002", name: "Utang Pajak PPh Final 0.5%", group: "Liabilitas", amount: utangPph },
        { code: "2003", name: "PPN Keluaran (Pajak Penjualan)", group: "Liabilitas", amount: ppnKeluaran },
        { code: "3001", name: "Modal Pemilik Disetor", group: "Ekuitas", amount: modalDisetor },
        { code: "3002", name: "Penarikan Pribadi Pemilik (Prive)", group: "Ekuitas", amount: -prive },
        { code: "3003", name: "Laba Tahun / Periode Berjalan", group: "Ekuitas", amount: labaBerjalan }
      ];

      return {
        title: "LAPORAN NERACA (POSISI KEUANGAN)",
        subtitle: "Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)",
        period: `Posisi: ${periodLabel}`,
        storeConfig,
        columns: [
          { key: "code", label: "Kode", width: "75px", align: "center" },
          { key: "name", label: "Nama Akun Posisi Keuangan" },
          { key: "group", label: "Kelompok Akun", width: "130px", align: "center" },
          { 
            key: "amount", 
            label: "Nilai Buku (Rp)", 
            width: "150px", 
            align: "right",
            render: (v: number | undefined) => {
              const num = typeof v === 'number' && !isNaN(v) ? v : 0;
              return (
                <span className={`font-mono font-bold ${num < 0 ? "text-rose-600" : "text-slate-900"}`}>
                  {num < 0 ? `(${Math.abs(num).toLocaleString("id-ID")})` : num.toLocaleString("id-ID")}
                </span>
              );
            }
          }
        ],
        rows: balanceSheetRows,
        summaryItems: [
          { label: "Total Aset Lancar", value: totalAsetLancar, color: "blue" },
          { label: "Total Aset Tetap", value: totalAsetTetap, color: "indigo" },
          { label: "Jumlah Aset (Aktiva)", value: totalAset, color: "emerald", highlight: true },
          { label: "Total Liabilitas (Utang)", value: totalLiabilitas, color: "rose" },
          { label: "Total Ekuitas Bersih", value: totalEkuitas, color: "indigo" }
        ],
        grandTotalLabel: "TOTAL LIABILITAS & EKUITAS (SEIMBANG):",
        grandTotalValue: totalLiabilitas + totalEkuitas,
        notes: [
          "Laporan Posisi Keuangan disusun berdasarkan prinsip keseimbangan akuntansi: Aset = Liabilitas + Ekuitas.",
          "Penilaian persediaan menggunakan metode rata-rata tertimbang (Moving Average) sesuai standar SAK EMKM."
        ],
        signatures: commonSignatures
      };
    }

    if (reportType === 'aruskas') {
      const cashFlowRows = [
        { code: "CF-01", name: "Penerimaan Kas dari Pelanggan & Omzet", type: "Aktivitas Operasional", amount: receiptsFromCustomers },
        { code: "CF-02", name: "Pengeluaran Kas untuk Pembelian Stok (Supplier)", type: "Aktivitas Operasional", amount: -paymentsForStock },
        { code: "CF-03", name: "Pengeluaran Kas untuk Beban Operasional & Gaji", type: "Aktivitas Operasional", amount: -paymentsForExpenses },
        { code: "CF-04", name: "Arus Kas Bersih dari Aktivitas Operasional", type: "Subtotal Operasional", amount: netCashFromOperations },
        { code: "CF-05", name: "Pembelian Peralatan / Aset Tetap Usaha", type: "Aktivitas Investasi", amount: -netCashFromInvesting },
        { code: "CF-06", name: "Penyetoran Tambahan Modal oleh Pemilik", type: "Aktivitas Pendanaan", amount: capitalInjections },
        { code: "CF-07", name: "Penarikan Dana Pribadi Pemilik (Prive)", type: "Aktivitas Pendanaan", amount: -drawingsPaid },
        { code: "CF-08", name: "Arus Kas Bersih dari Aktivitas Pendanaan", type: "Subtotal Pendanaan", amount: netCashFromFinancing }
      ];

      return {
        title: "LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)",
        subtitle: "Metode Langsung (Direct Cash Flow Method) SAK EMKM",
        period: `Periode: ${periodLabel}`,
        storeConfig,
        columns: [
          { key: "code", label: "No. Ref", width: "80px", align: "center" },
          { key: "name", label: "Uraian Arus Kas Usaha" },
          { key: "type", label: "Klasifikasi", width: "160px", align: "center" },
          { 
            key: "amount", 
            label: "Arus Kas (Rp)", 
            width: "150px", 
            align: "right",
            render: (v: number | undefined) => {
              const num = typeof v === 'number' && !isNaN(v) ? v : 0;
              return (
                <span className={`font-mono font-bold ${num >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {num < 0 ? `(${Math.abs(num).toLocaleString("id-ID")})` : num.toLocaleString("id-ID")}
                </span>
              );
            }
          }
        ],
        rows: cashFlowRows,
        summaryItems: [
          { label: "Arus Kas Operasional", value: netCashFromOperations, color: "emerald" },
          { label: "Arus Kas Investasi", value: netCashFromInvesting, color: "rose" },
          { label: "Arus Kas Pendanaan", value: netCashFromFinancing, color: "blue" },
          { label: "Kenaikan/Penurunan Kas", value: netIncreaseDecreaseInCash, color: "indigo" },
          { label: "Saldo Kas Akhir", value: finalCash, color: "emerald", highlight: true }
        ],
        grandTotalLabel: "SALDO KAS & SETARA KAS AKHIR PERIODE:",
        grandTotalValue: finalCash,
        notes: [
          "Laporan Arus Kas disusun menggunakan metode langsung (Direct Method) sesuai pedoman SAK EMKM.",
          "Mencerminkan mutasi keluar masuk uang kas riil perusahaan selama periode berjalan."
        ],
        signatures: commonSignatures
      };
    }

    if (reportType === 'neracasaldo') {
      return {
        title: "NERACA SALDO (TRIAL BALANCE)",
        subtitle: "Verifikasi Keseimbangan Saldo Debit & Kredit Seluruh Kode Akun SAK EMKM",
        period: `Posisi: ${periodLabel}`,
        storeConfig,
        columns: [
          { key: "accountId", label: "Kode", width: "75px", align: "center" },
          { key: "accountName", label: "Nama Akun / Bagan Akun" },
          { key: "category", label: "Kategori", width: "120px", align: "center" },
          { 
            key: "debit", 
            label: "Debit (Rp)", 
            width: "130px", 
            align: "right",
            render: (v: number | undefined) => {
              const num = typeof v === 'number' && !isNaN(v) ? v : 0;
              return <span className="font-mono">{num > 0 ? num.toLocaleString("id-ID") : "-"}</span>;
            }
          },
          { 
            key: "credit", 
            label: "Kredit (Rp)", 
            width: "130px", 
            align: "right",
            render: (v: number | undefined) => {
              const num = typeof v === 'number' && !isNaN(v) ? v : 0;
              return <span className="font-mono">{num > 0 ? num.toLocaleString("id-ID") : "-"}</span>;
            }
          }
        ],
        rows: trialBalance,
        summaryItems: [
          { label: "Total Saldo Debit", value: totalTbDebit, color: "blue" },
          { label: "Total Saldo Kredit", value: totalTbCredit, color: "indigo" },
          { label: "Kondisi Neraca Saldo", value: isTbBalanced ? "SEIMBANG (OK)" : "SELISIH", color: isTbBalanced ? "emerald" : "rose", highlight: true }
        ],
        grandTotalLabel: "TOTAL NERACA SALDO SEIMBANG:",
        grandTotalValue: totalTbDebit,
        notes: [
          "Neraca Saldo memastikan total saldo debit dan kredit buku besar seimbang sebelum penutupan buku.",
          isTbBalanced ? "Seluruh mutasi debit dan kredit dalam kondisi seimbang sempurna." : "Terdapat selisih pada mutasi debit dan kredit, silakan tinjau kembali jurnal transaksi."
        ],
        signatures: commonSignatures
      };
    }

    if (reportType === 'piutang') {
      const activeUnpaid = creditSalesReceivables.filter(inv => inv.remainingAmount > 0);
      const rows = (activeUnpaid.length > 0 ? activeUnpaid : creditSalesReceivables).map(inv => ({
        code: inv.invoiceNumber,
        name: inv.customerName,
        phone: inv.customerPhone || "-",
        dueDate: inv.dueDate,
        agingCategory: inv.agingCategory,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.remainingAmount
      }));

      return {
        title: "DAFTAR PIUTANG PELANGGAN (ACCOUNTS RECEIVABLE)",
        subtitle: "Rekapitulasi Saldo Penjualan Kredit Belum Lunas, Jatuh Tempo & Analisis Umur Piutang (Aging SAK EMKM)",
        period: `Posisi: ${periodLabel}`,
        storeConfig,
        columns: [
          { key: "code", label: "No. Bukti / Faktur", width: "105px", align: "center" },
          { 
            key: "name", 
            label: "Pelanggan & Kontak",
            render: (_v: any, row: any) => (
              <div>
                <span className="font-bold text-slate-900">{row.name}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-2">({row.phone})</span>
              </div>
            )
          },
          { key: "dueDate", label: "Jatuh Tempo", width: "105px", align: "center" },
          { 
            key: "agingCategory", 
            label: "Umur Piutang (Aging)", 
            width: "145px", 
            align: "center",
            render: (v: string) => {
              const isLate = v.includes("Lewat");
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isLate ? "bg-rose-100 text-rose-800" : v === "Lunas" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {v}
                </span>
              );
            }
          },
          { 
            key: "totalAmount", 
            label: "Nilai Penjualan (Rp)", 
            width: "125px", 
            align: "right",
            render: (v: number) => <span className="font-mono">{(v || 0).toLocaleString("id-ID")}</span>
          },
          { 
            key: "paidAmount", 
            label: "Terbayar (Rp)", 
            width: "120px", 
            align: "right",
            render: (v: number) => <span className="font-mono text-emerald-700">{(v || 0).toLocaleString("id-ID")}</span>
          },
          { 
            key: "remainingAmount", 
            label: "Sisa Piutang (Rp)", 
            width: "135px", 
            align: "right",
            render: (v: number) => (
              <span className={`font-mono font-bold ${v > 0 ? "text-rose-700" : "text-slate-400"}`}>
                {(v || 0).toLocaleString("id-ID")}
              </span>
            )
          }
        ],
        rows,
        summaryItems: [
          { label: "Total Transaksi Penjualan Kredit", value: `${creditSalesReceivables.length} Transaksi`, color: "blue" },
          { label: "Total Penjualan Kredit", value: totalAllInvoiced, color: "indigo" },
          { label: "Penerimaan Pelunasan Kas", value: totalAllPaid, color: "emerald" },
          { label: "Piutang Belum Jatuh Tempo (Lancar)", value: totalCurrentPiutang, color: "blue" },
          { label: "Piutang Lewat Jatuh Tempo (Aging)", value: totalOverduePiutang, color: "rose" },
          { label: "Total Sisa Piutang Belum Lunas", value: totalOutstandingPiutang, color: "rose", highlight: true }
        ],
        grandTotalLabel: "TOTAL SISA PIUTANG PELANGGAN BELUM LUNAS (SAK EMKM):",
        grandTotalValue: totalOutstandingPiutang,
        notes: [
          "Daftar Piutang Pelanggan menyajikan saldo tagihan dari transaksi penjualan kredit yang belum dilunasi oleh pelanggan.",
          "Analisis Umur Piutang (Aging) dihitung otomatis berdasarkan tanggal jatuh tempo yang tertera pada bukti transaksi/faktur.",
          "Sesuai ketentuan Bab 8 SAK EMKM, piutang diakui sebesar jumlah bruto tagihan dan diuji ketertagihannya secara berkala."
        ],
        signatures: commonSignatures
      };
    }

    // Default: Laba Rugi
    const operatingExpenses = CHART_OF_ACCOUNTS.filter(a => a.id >= 6000 && a.id <= 6999).map((acc) => {
      const balanceItem = trialBalance.find(t => t.accountId === acc.id);
      const amountVal = balanceItem ? (balanceItem.debit - balanceItem.credit) : 0;
      return {
        code: String(acc.id),
        name: acc.name,
        type: "Beban Operasional",
        amount: Math.max(0, amountVal)
      };
    }).filter(it => it.amount > 0);

    const incomeRows = [
      { code: "4001", name: "Pendapatan Penjualan Bersih", type: "Pendapatan Usaha", amount: activeStats.revenue || 0 },
      { code: "5001", name: "Harga Pokok Penjualan (HPP)", type: "Beban Pokok", amount: activeStats.hpp || 0 },
      ...operatingExpenses
    ];

    return {
      title: "LAPORAN LABA RUGI (INCOME STATEMENT)",
      subtitle: "Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)",
      period: `Periode: ${periodLabel}`,
      storeConfig,
      columns: [
        { key: "code", label: "Kode", width: "75px", align: "center" },
        { key: "name", label: "Uraian Akun Pendapatan & Beban" },
        { key: "type", label: "Klasifikasi", width: "140px", align: "center" },
        { 
          key: "amount", 
          label: "Jumlah (Rp)", 
          width: "150px", 
          align: "right",
          render: (v: number | undefined) => {
            const num = typeof v === 'number' && !isNaN(v) ? v : 0;
            return <span className="font-mono font-bold text-slate-900">{num.toLocaleString("id-ID")}</span>;
          }
        }
      ],
      rows: incomeRows,
      summaryItems: [
        { label: "Total Pendapatan", value: activeStats.revenue || 0, color: "blue" },
        { label: "Beban Pokok (HPP)", value: activeStats.hpp || 0, color: "rose" },
        { label: "Laba Kotor", value: activeStats.grossProfit || 0, color: "indigo" },
        { label: "Beban Operasional", value: activeStats.expenses || 0, color: "rose" },
        { label: "Laba Bersih Usaha", value: activeStats.netProfit || 0, color: (activeStats.netProfit || 0) >= 0 ? "emerald" : "rose", highlight: true }
      ],
      grandTotalLabel: "LABA (RUGI) BERSIH TAHUN BERJALAN:",
      grandTotalValue: activeStats.netProfit || 0,
      notes: [
        "Laporan Laba Rugi disusun berdasarkan metode akrual penuh sesuai ketentuan SAK EMKM.",
        `Estimasi PPh Final UMKM 0,5% (${formatIDR(activeStats.pph || 0)}) disesuaikan dengan ketentuan UU HPP.`
      ],
      signatures: commonSignatures
    };
  };

  // Memoized guaranteed-valid ReportData for currently active report
  const activeReportData = useMemo(() => {
    return generateA4ReportData(activeReport);
  }, [
    activeReport, 
    activeStats, 
    trialBalance, 
    receiptsFromCustomers, 
    paymentsForStock, 
    paymentsForExpenses, 
    netCashFromOperations, 
    capitalInjections, 
    drawingsPaid, 
    netCashFromFinancing, 
    netIncreaseDecreaseInCash, 
    finalCash, 
    storeConfig, 
    filterMode, 
    selectedYear, 
    selectedMonth, 
    customStartDate, 
    customEndDate,
    invoices,
    creditSalesReceivables,
    totalOutstandingPiutang,
    totalOverduePiutang,
    totalAllInvoiced,
    totalAllPaid
  ]);

  // Triggers dedicated PrintTemplate in modal preview mode
  const handlePrint = () => {
    setShowA4PrintModal(true);
  };

  const handleExcelExport = () => {
    setExportState({ loading: true });

    // Allow UI to render loading spinner
    setTimeout(() => {
      try {
        const result = exportToXLSX(
          activeTransactions,
          stockItems,
          activeJournal,
          activeStats,
          storeConfig,
          getPeriodLabel()
        );

        if (result.success) {
          setExportState({
            loading: false,
            success: true,
            fileName: result.fileName,
            sheetCount: result.sheetCount,
            blobUrl: result.blobUrl
          });
        } else {
          setExportState({
            loading: false,
            success: false,
            error: result.error || "Gagal mengekspor file Excel."
          });
        }
      } catch (err: any) {
        console.error("Gagal ekspor Excel:", err);
        setExportState({
          loading: false,
          success: false,
          error: err?.message || "Terjadi kesalahan sistem saat menyusun file Excel."
        });
      }
    }, 80);
  };

  // Handle file selection and parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseExcelFile(buffer, transactions);
        
        if (!result.success) {
          setParseError(result.message);
          setIsParsing(false);
          return;
        }

        setParsedData(result);
        setIsParsing(false);
      } catch (err: any) {
        setParseError(`Terjadi kesalahan saat memproses file: ${err?.message || "Format tidak didukung"}`);
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError("Gagal membaca file dari perangkat Anda.");
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Execute import & merge into active application state
  const handleExecuteImport = () => {
    if (!parsedData || parsedData.transactions.length === 0) {
      setParseError("Tidak ada data transaksi yang valid dalam file yang dipilih untuk diimpor.");
      return;
    }

    // 1. Merge transactions with deduplication protection (tidak tertimpa dengan data baru)
    const { merged: mergedTxs, addedCount, skippedCount } = mergeTransactionsWithoutOverwrite(
      transactions,
      parsedData.transactions,
      skipDuplicates
    );

    // 2. Merge stocks safely if requested
    let finalStocks = stockItems;
    if (includeStocks && parsedData.stocks.length > 0) {
      finalStocks = mergeStockItemsSafely(stockItems, parsedData.stocks);
    }

    // 3. Dispatch to parent App.tsx state & localStorage
    if (onImportTransactions) {
      onImportTransactions(mergedTxs, finalStocks);
    }

    // Determine primary month imported to suggest filtering
    const monthKeys = Object.keys(parsedData.monthYearBreakdown);
    const primaryMonth = monthKeys.length > 0 ? monthKeys[0] : undefined;

    setImportNotification({
      message: `Berhasil mengimpor ${addedCount} transaksi baru! ${skippedCount > 0 ? `${skippedCount} transaksi yang sudah ada otomatis dilindungi/dilewati agar tidak tertimpa atau tercatat ganda.` : 'Data telah tersinkronisasi sempurna.'}`,
      addedCount,
      skippedCount,
      primaryMonth
    });

    // Reset file input & parsed data
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Auto navigate to Laba Rugi report
    setActiveReport('labarugi');
  };

  const ReportHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <>
      {/* OFFICIAL KOP SURAT HEADER */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-sans">
              {storeConfig?.storeName || "LAPORAN KEUANGAN UMKM"}
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
            {title}
          </h2>
          <p className="text-xs text-slate-600 font-mono font-semibold">
            {subtitle}
          </p>
        </div>
      </div>
    </>
  );

  const ReportSignature = () => (
    <div className="grid grid-cols-2 gap-8 sm:gap-16 mt-10 pt-8 border-t-2 border-slate-300 print:mt-8 print:pt-6">
      <div className="text-center space-y-12">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Dibuat Oleh,</p>
          <p className="text-[11px] text-slate-500 font-mono">Petugas Keuangan / Staf Akuntansi</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 underline font-sans">Staf Akuntansi SAK EMKM</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Tgl: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="text-center space-y-12">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Mengetahui &amp; Disetujui Oleh,</p>
          <p className="text-[11px] text-slate-500 font-mono">Pimpinan / Pemilik Usaha</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 underline font-sans">
            {storeConfig?.storeName ? `Pimpinan ${storeConfig.storeName}` : "Pimpinan Usaha"}
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{storeConfig?.storeCity || "Indonesia"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" id="laporan-keuangan">
      {/* SUCCESS IMPORT BANNER */}
      {importNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs transition-all animate-fadeIn no-print">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                Sinkronisasi Impor Excel Berhasil!
              </p>
              <p className="text-emerald-800 leading-relaxed mt-0.5">
                {importNotification.message}
              </p>
              {importNotification.primaryMonth && (
                <p className="text-emerald-900 font-semibold mt-1">
                  💡 Seluruh laporan laba rugi, neraca, arus kas, dan neraca saldo telah diperbarui otomatis.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {importNotification.primaryMonth && (
              <button
                type="button"
                onClick={() => {
                  const [y, m] = (importNotification.primaryMonth || "").split("-");
                  if (y && m) {
                    setFilterMode('month');
                    setSelectedYear(y);
                    setSelectedMonth(m);
                  }
                  setImportNotification(null);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Lihat Bulan Terimpor</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EXPORT STATUS BANNERS */}
      {exportState?.loading && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3 text-xs text-teal-900 shadow-xs animate-pulse no-print">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
          <span>Sedang menyusun data akuntansi dan menyiapkan file Excel (.xlsx) untuk <strong>{getPeriodLabel()}</strong>...</span>
        </div>
      )}

      {exportState?.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn no-print">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                File Excel Berhasil Diunduh!
              </p>
              <p className="text-emerald-800 leading-relaxed mt-0.5">
                File <strong>{exportState.fileName}</strong> ({exportState.sheetCount} tab laporan lengkap SAK EMKM) telah diproses dan diunduh ke komputer/perangkat Anda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {exportState.blobUrl && (
              <a
                href={exportState.blobUrl}
                download={exportState.fileName}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] transition shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Manual</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setExportState(null)}
              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {exportState?.success === false && exportState.error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs shadow-xs animate-fadeIn no-print">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950 text-sm">Gagal Mengunduh File Excel</p>
              <p className="text-rose-800 leading-relaxed mt-0.5">{exportState.error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExcelExport}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => setExportState(null)}
              className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP PERIOD FILTER BAR (SESUAIKAN DENGAN BULAN, TANGGAL & TAHUN) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs no-print space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900">Periode Laporan Keuangan (Bulan, Tanggal &amp; Tahun)</span>
              <p className="text-[11px] text-slate-500">Sesuaikan tampilan laba rugi, neraca, arus kas &amp; neraca saldo per periode</p>
            </div>
          </div>

          {/* Filter Mode Selector Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Periode
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'month' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pilih Bulan &amp; Tahun
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'custom' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rentang Tanggal
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on selected filter mode */}
        {filterMode === 'month' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Bulan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
              >
                {MONTH_NAMES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-[11px] font-medium text-slate-500 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-md">
                {activeTransactions.length} transaksi ditemukan
              </span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset ke Semua
              </button>
            </div>
          </div>
        )}

        {filterMode === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Dari Tanggal:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Sampai Tanggal:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div className="ml-auto text-[11px] font-medium text-slate-500 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-md">
                {activeTransactions.length} transaksi ditemukan
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setFilterMode('all');
                }}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {filterMode === 'all' && (
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Menampilkan total <strong>{activeTransactions.length} transaksi</strong> dari seluruh riwayat pembukuan toko.</span>
            <span className="font-mono text-slate-400">Status: Akumulasi Penuh</span>
          </div>
        )}
      </div>

      {/* TOP HEADER & CONTROL ACTIONS (LAYAR BERSIH - NAVIGASI DI BILAH KIRI) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 bg-white p-4 rounded-xl shadow-xs no-print">
        {/* Active Report Title & Compliance Badge (Ikon Dihilangkan Sesuai Permintaan) */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {activeReport === 'labarugi' && "Laporan Laba Rugi"}
              {activeReport === 'neraca' && "Laporan Posisi Keuangan (Neraca)"}
              {activeReport === 'aruskas' && "Laporan Arus Kas (Metode Langsung)"}
              {activeReport === 'neracasaldo' && "Neraca Saldo (Trial Balance)"}
              {activeReport === 'piutang' && "Daftar Piutang Pelanggan & Aging"}
              {activeReport === 'import' && "Import Data Transaksi Excel (.xlsx)"}
              {activeReport === 'ekspor' && "Unduh Workbook Keuangan Excel (.xlsx)"}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SAK EMKM
            </span>
            {activeReport === 'piutang' && unpaidReceivables.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {unpaidReceivables.length} Tagihan Belum Lunas
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Posisi Periode: <span className="font-semibold text-slate-700">{getPeriodLabel()}</span> • Ganti laporan melalui menu di sebelah kiri
          </p>
        </div>

        {/* Action Buttons for Active Report */}
        <div className="flex flex-wrap items-center gap-2 font-semibold shrink-0">
          {/* Mode Cetak Dokumen (A4) / Tampilan Ringkas Toggle */}
          {activeReport !== 'import' && activeReport !== 'ekspor' && (
            <button
              type="button"
              onClick={() => setDisplayMode(prev => prev === 'print-sheet' ? 'standard' : 'print-sheet')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs ${
                displayMode === 'print-sheet'
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200'
              }`}
              title="Beralih antara Tampilan Ringkas dan Mode Cetak Dokumen Format A4 SAK EMKM"
            >
              {displayMode === 'print-sheet' ? (
                <>
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Tampilan Ringkas</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mode Cetak Dokumen (A4)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleExcelExport}
            disabled={exportState?.loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            title="Ekspor seluruh laporan aktif ke file Excel (.xlsx)"
          >
            {exportState?.loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportState?.loading ? "Menyiapkan..." : "Ekspor .XLS"}</span>
          </button>

          {activeReport !== 'import' && activeReport !== 'ekspor' && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              title="Cetak Laporan ke Printer atau Simpan sebagai Dokumen PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak PDF
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: IMPORT EXCEL VIEW */}
      {activeReport === 'import' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Import Data Pembukuan dari Excel (.xlsx / .xls / .csv)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ambil kembali data dari file Excel yang telah diekspor sebelumnya. Sistem akan membaca riwayat transaksi secara otomatis, memetakan double-entry, menyesuaikan <strong>Bulan, Tanggal, dan Tahun</strong>, serta <strong>tidak menimpa data yang sudah ada</strong> agar mutasi buku tetap terjaga aman.
            </p>
          </div>

          {/* File Upload Area */}
          <div className="max-w-2xl mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 p-8 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-3 transition group"
            >
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800">
                  {isParsing ? "Sedang menganalisis file Excel..." : "Klik untuk Memilih File Excel atau Seret ke Sini"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format didukung: <strong>.xlsx, .xls, .csv</strong> (Hasil ekspor sistem atau spreadsheet transaksi)
                </p>
              </div>
              <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold group-hover:bg-emerald-700 transition shadow-2xs">
                Pilih File Excel
              </span>
            </label>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="max-w-2xl mx-auto p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Gagal Membaca File Excel</p>
                <p className="text-rose-700 text-[11px] mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {/* Parsed Result & Deduplication Preview */}
          {parsedData && (
            <div className="max-w-3xl mx-auto space-y-6 pt-4 border-t border-slate-100 animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Transaksi Baru</p>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">
                    +{parsedData.newCount}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Siap ditambahkan</p>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Data Sudah Ada</p>
                  <p className="text-xl font-extrabold text-amber-900 mt-1">
                    {parsedData.duplicatesCount}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Dilewati (tidak tertimpa)</p>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Total Nilai Baru</p>
                  <p className="text-sm font-bold text-indigo-900 mt-1 font-mono">
                    {formatIDR(parsedData.totalNewAmount)}
                  </p>
                  <p className="text-[10px] text-indigo-700 mt-0.5">Nominal mutasi baru</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Sumber Sheet</p>
                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={parsedData.sourceSheet}>
                    {parsedData.sourceSheet || "Tab Transaksi"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{parsedData.stocks.length} item stok</p>
                </div>
              </div>

              {/* Month & Year Breakdown (Sesuaikan dengan Bulan, Tanggal dan Tahun) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sebaran Transaksi Berdasarkan Bulan &amp; Tahun:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(parsedData.monthYearBreakdown).map(([myKey, count]) => {
                    const [year, month] = myKey.split("-");
                    const mObj = MONTH_NAMES.find(m => m.value === month);
                    return (
                      <span
                        key={myKey}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5"
                      >
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>{mObj?.label || month} {year}:</span>
                        <strong className="text-slate-900 font-mono">+{count} tx</strong>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-slate-800 mb-1">Pengaturan Penggabungan Data (Smart Merge):</p>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Lewati transaksi yang sudah ada</strong> (Mencegah pencatatan dobel dan memastikan data lama tidak tertimpa) — <em>Sangat Direkomendasikan</em>
                  </span>
                </label>

                {parsedData.stocks.length > 0 && (
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeStocks}
                      onChange={(e) => setIncludeStocks(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>
                      Tambahkan <strong>{parsedData.stocks.length} produk katalog stok baru</strong> yang ada di file Excel bila belum terdaftar di toko
                    </span>
                  </label>
                )}
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Pratinjau Data Transaksi (10 Transaksi Pertama dari Total {parsedData.transactions.length})
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Diurutkan kronologis tanggal
                  </span>
                </div>
                
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Jenis</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-right">Jumlah (Rp)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.transactions.slice(0, 10).map((tx, idx) => {
                        const fp = getTransactionFingerprint(tx);
                        const isDup = transactions.some(t => getTransactionFingerprint(t) === fp || t.id === tx.id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-2 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-2 px-3 text-slate-700 whitespace-nowrap font-medium">
                              {tx.type}
                            </td>
                            <td className="py-2 px-3 text-slate-900 truncate max-w-xs" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                              {tx.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              {isDup ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                                  Sudah Ada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                  ✨ Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal / Ganti File
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi &amp; Simpan ke Laporan Keuangan ({skipDuplicates ? parsedData.newCount : parsedData.transactions.length} Transaksi)</span>
                </button>
              </div>
            </div>
          )}

          {/* Technical Info Footnote */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Otomatisasi &amp; Penyesuaian Kalender:</span>
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500">
                Data yang diimpor akan langsung dihitung ulang ke dalam <strong>Jurnal Umum</strong>, <strong>Buku Besar</strong>, <strong>Neraca Saldo</strong>, <strong>Laporan Laba Rugi</strong>, dan <strong>Neraca SAK EMKM</strong> secara instan tanpa perlu input manual satu per satu.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Keamanan Data &amp; Tanpa Timpa:</span>
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500">
                Sistem mendeteksi sidik transaksi unik berdasarkan tanggal, nominal, akun debit/kredit, dan keterangan. Transaksi yang sudah pernah ada tidak akan digandakan, dan transaksi lama Anda tetap utuh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WHEN TRANSACTIONS EMPTY & NOT IN IMPORT TAB */}
      {transactions.length === 0 && activeReport !== 'import' ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs text-center text-slate-400 space-y-4">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">Laporan Finansial Masih Kosong</h4>
          <p className="text-xs max-w-md mx-auto leading-relaxed text-slate-500">
            Belum ada transaksi pada database pembukuan toko Anda. Anda dapat <strong>mengimpor file Excel</strong> yang pernah diekspor sebelumnya, atau memuat Data Demo di Dashboard.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setActiveReport('import')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import File Excel Sekarang
            </button>
          </div>
        </div>
      ) : activeReport !== 'import' && (
        <div className="print:p-0">
          {/* MODE CETAK DOKUMEN (A4 PRESISI SAK EMKM) IN-PAGE PREVIEW */}
          {displayMode === 'print-sheet' && activeReport !== 'ekspor' && activeReportData ? (
            <div className="space-y-4">
              <div className="no-print bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-indigo-950">
                  <span className="p-2 bg-indigo-600 text-white rounded-xl">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-bold text-sm">Mode Cetak Dokumen Aktif (Layout Presisi A4 SAK EMKM)</p>
                    <p className="text-indigo-800 text-[11px]">
                      Menampilkan tata letak A4 resmi lengkap dengan Kop Surat usaha, tabel akun bergaris standar akuntansi, catatan kepatuhan, dan kolom tanda tangan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('standard')}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>Kembali ke Tampilan Ringkas</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Pratinjau / Unduh PDF</span>
                  </button>
                </div>
              </div>

              <PrintTemplate
                mode="embedded"
                data={activeReportData}
                onPrint={triggerPrintA4}
              />
            </div>
          ) : (
            <>
              {/* LABA RUGI SHEET VIEW */}
              {activeReport === 'labarugi' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area">
              <ReportHeader
                title="LAPORAN LABA RUGI (INCOME STATEMENT)"
                subtitle={`Periode: ${getPeriodLabel()} • Standar Akrual SAK EMKM`}
              />

              <div className="space-y-4">
                {/* 1. Pendapatan */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>1. PENDAPATAN USAHA</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Pendapatan Penjualan (4001)</span>
                    <span className="font-mono text-slate-800 font-semibold">{activeStats.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                    <span>TOTAL PENDAPATAN</span>
                    <span className="font-mono">{activeStats.revenue.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 2. Harga Pokok Penjualan */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Harga Pokok Penjualan Produk / Jasa (5001)</span>
                    <span className="font-mono text-slate-800 font-semibold">{activeStats.hpp.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                    <span>TOTAL BEBAN POKOK (HPP)</span>
                    <span className="font-mono">{activeStats.hpp.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 2a. Laba Kotor */}
                <div className="flex justify-between text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-100 p-3 rounded-lg uppercase">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="font-mono">{activeStats.grossProfit.toLocaleString('id-ID')}</span>
                </div>

                {/* 3. Beban Operasional */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>3. BEBAN OPERASIONAL KANTOR / TOKO</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  
                  {/* Map through all operating expenses (6001 - 6005) */}
                  {CHART_OF_ACCOUNTS.filter(a => a.id >= 6000 && a.id <= 6999).map((acc) => {
                    const balanceItem = trialBalance.find(t => t.accountId === acc.id);
                    const amountVal = balanceItem ? (balanceItem.debit - balanceItem.credit) : 0;
                    return (
                      <div key={acc.id} className="flex justify-between text-xs text-slate-650 pl-4">
                        <span>{acc.name} ({acc.id})</span>
                        <span className="font-mono text-slate-755">{amountVal > 0 ? amountVal.toLocaleString('id-ID') : "-"}</span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                    <span>TOTAL BEBAN OPERASIONAL</span>
                    <span className="font-mono">{activeStats.expenses.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 4. NET PROFIT */}
                <div className={`flex justify-between text-sm font-extrabold p-3.5 rounded-lg uppercase border ${
                  activeStats.netProfit >= 0 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
                    : 'bg-rose-50 text-rose-950 border-rose-200'
                }`}>
                  <span>LABA BERSIH SEBELUM PAJAK (NET INCOME)</span>
                  <span className="font-mono">{activeStats.netProfit.toLocaleString('id-ID')}</span>
                </div>

                {/* TAX DISCLOSURE FOOTNOTE compliance */}
                <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Kepatuhan SAK EMKM Indonesia
                  </p>
                  <p>
                    Laporan ini disusun dengan metode akrual sesuai panduan SAK EMKM. PPh Final UMKM estimasi 0,5% dari omzet neto ({formatIDR(activeStats.pph)}) harus disetor ke KPP setiap bulan selambat-lambatnya tanggal 15 apabila omzet setahun pengusaha melebihi PTKP UMKM (Rp 500 Juta).
                  </p>
                </div>

                {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
                <ReportSignature />
              </div>
            </div>
          )}

          {/* BALANCE SHEET (NERACA) VIEW */}
          {activeReport === 'neraca' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area">
              <ReportHeader
                title="LAPORAN NERACA (STATEMENT OF FINANCIAL POSITION)"
                subtitle={`Posisi: ${getPeriodLabel()} • Standar Kepatuhan SAK EMKM`}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {/* AKTIVA (ASSETS) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">SISI AKTIVA (ASET)</h3>
                  
                  {/* Aset Lancar */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Aset Lancar</span>
                    
                    {/* Kas 1001 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Kas &amp; Setara Kas (1001)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 1001)?.debit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Piutang 1002 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Piutang Usaha (1002)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 1002)?.debit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Persediaan 1003 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Persediaan Barang Dagang (1003)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 1003)?.debit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* PPN Masukan 1004 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>PPN Masukan (Pajak Masukan) (1004)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 1004)?.debit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Aset Tetap */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Aset Tetap</span>
                    
                    {/* Peralatan 1005 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Peralatan Toko &amp; Inventaris (1005)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 1005)?.debit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Total Assets */}
                  <div className="flex justify-between text-xs font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>JUMLAH ASET (AKTIVA)</span>
                    <span className="font-mono font-extrabold">{activeStats.totalAssets.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* PASIVA (LIABILITIES & EQUITY) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">SISI PASIVA (KEWAJIBAN &amp; MODAL)</h3>
                  
                  {/* Kewajiban / Liabilitas */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Liabilitas (Utang)</span>
                    
                    {/* Utang Usaha 2001 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Utang Usaha / Supplier (2001)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 2001)?.credit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* PPh Payable 2002 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Utang Pajak PPh 4(2) Final (2002)</span>
                      <span className="font-mono font-medium">
                        {activeStats.pph.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* PPN Keluaran 2003 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>PPN Keluaran (Pajak Penjualan) (2003)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 2003)?.credit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Ekuitas / Modal */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Ekuitas (Modal SAK EMKM)</span>
                    
                    {/* Modal 3001 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Modal Pemilik Disetor (3001)</span>
                      <span className="font-mono font-medium">
                        {(trialBalance.find(t => t.accountId === 3001)?.credit || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Prive 3002 */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2">
                      <span>Prive / Penarikan Pribadi (3002)</span>
                      <span className="font-mono text-rose-600">
                        -{((trialBalance.find(t => t.accountId === 3002)?.debit || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Profit of current period */}
                    <div className="flex justify-between text-xs text-slate-650 pl-2 font-medium">
                      <span>Laba Masa/Tahun Berjalan</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {activeStats.netProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Total Equity and Liabilities */}
                  <div className="flex justify-between text-xs font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>JUMLAH UTANG &amp; MODAL</span>
                    <span className="font-mono font-extrabold">{(activeStats.totalLiabilities + activeStats.totalEquity).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Equating disclaimer */}
              <div className="border border-indigo-100 bg-indigo-50/50 p-4 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-indigo-700 animate-pulse" />
                  Status Keseimbangan Neraca Toko
                </span>
                <span className="font-mono font-bold text-indigo-900">
                  {Math.abs(activeStats.totalAssets - (activeStats.totalLiabilities + activeStats.totalEquity)) < 1 ? "SEIMBANG (DEBIT = KREDIT)" : "TIDAK SEIMBANG"}
                </span>
              </div>

              {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
              <ReportSignature />
            </div>
          )}

          {/* CASH FLOW DIRECT METHOD VIEW */}
          {activeReport === 'aruskas' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area">
              <ReportHeader
                title="LAPORAN ARUS KAS (STATEMENT OF CASH FLOWS)"
                subtitle={`Periode: ${getPeriodLabel()} • Menggunakan Metode Langsung (Direct Cash Flow Method)`}
              />

              <div className="space-y-4">
                {/* 1. Operating */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>A. ARUS KAS DARI AKTIVITAS OPERASIONAL</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Penerimaan Kas dari Pelanggan & Omzet</span>
                    <span className="font-mono text-emerald-600 font-bold">+{receiptsFromCustomers.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Pengeluaran Kas untuk Pembelian Stok (Supplier)</span>
                    <span className="font-mono text-rose-600">-{paymentsForStock.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Pengeluaran Kas untuk Beban Operasional & Gaji</span>
                    <span className="font-mono text-rose-600">-{paymentsForExpenses.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg pl-4">
                    <span>ARUS KAS BERSIH DARI OPERASIONAL</span>
                    <span className="font-mono">{netCashFromOperations.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 2. Investing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>B. ARUS KAS DARI AKTIVITAS INVESTASI</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Pembelian Peralatan / Aset Tetap Toko</span>
                    <span className="font-mono text-slate-600">0</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg pl-4">
                    <span>ARUS KAS BERSIH DARI INVESTASI</span>
                    <span className="font-mono">0</span>
                  </div>
                </div>

                {/* 3. Financing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>C. ARUS KAS DARI AKTIVITAS PENDANAAN</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Penyetoran Modal dari Pemilik</span>
                    <span className="font-mono text-emerald-600">+{capitalInjections.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Penarikan Prive Pemilik</span>
                    <span className="font-mono text-rose-600">-{drawingsPaid.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg pl-4">
                    <span>ARUS KAS BERSIH DARI PENDANAAN</span>
                    <span className="font-mono">{netCashFromFinancing.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Summary Cash reconciliations */}
                <div className="border-t border-dashed border-slate-300 pt-4 space-y-2 bg-slate-900 text-white p-5 rounded-2xl">
                  <div className="flex justify-between text-xs">
                    <span>Kenaikan Bersih Kas Berjalan</span>
                    <span className="font-mono font-bold">Rp {netIncreaseDecreaseInCash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs select-none border-b border-slate-800 pb-2">
                    <span>Saldo Kas Awal</span>
                    <span className="font-mono">Rp {initialCash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1">
                    <span>SALDO KAS &amp; SETARA KAS AKHIR</span>
                    <span className="font-mono">Rp {finalCash.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
                <ReportSignature />
              </div>
            </div>
          )}

          {/* NERACA SALDO (TRIAL BALANCE) VIEW */}
          {activeReport === 'neracasaldo' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area">
              <ReportHeader
                title="NERACA SALDO (TRIAL BALANCE)"
                subtitle={`Posisi: ${getPeriodLabel()} • Verifikasi Keseimbangan Debit & Kredit SAK EMKM`}
              />

              {/* Trial Balance Balance Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                isTbBalanced 
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
                  : 'bg-rose-50 text-rose-950 border-rose-200'
              }`}>
                <span className="font-bold flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 ${isTbBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
                  Status Keseimbangan Buku (Double-Entry Equality)
                </span>
                <span className="font-mono font-bold uppercase tracking-wider">
                  {isTbBalanced ? "SEIMBANG (DEBIT = KREDIT)" : "TIDAK SEIMBANG"}
                </span>
              </div>

              {/* Trial Balance Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-24">Kode Akun</th>
                      <th className="py-3 px-4">Nama Akun</th>
                      <th className="py-3 px-4 w-32">Kategori</th>
                      <th className="py-3 px-4 text-right w-36">Saldo Debit (Rp)</th>
                      <th className="py-3 px-4 text-right w-36">Saldo Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialBalance.map((item) => (
                      <tr key={item.accountId} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{item.accountId}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{item.accountName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{item.category}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-800">
                          {item.debit > 0 ? item.debit.toLocaleString('id-ID') : "-"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-800">
                          {item.credit > 0 ? item.credit.toLocaleString('id-ID') : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                        TOTAL NERACA SALDO
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {totalTbDebit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        {totalTbCredit.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footnote notes */}
              <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
                <p className="font-bold text-slate-700">Catatan Neraca Saldo (Trial Balance):</p>
                <p>
                  Neraca Saldo mencatat posisi saldo debit dan saldo kredit seluruh akun buku besar per tanggal pelaporan untuk memastikan bahwa prinsip persamaan akuntansi (Debit = Kredit) terpenuhi secara sempurna sebelum laporan keuangan ditutup.
                </p>
              </div>

              {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
              <ReportSignature />
            </div>
          )}

          {/* DAFTAR PIUTANG PELANGGAN (ACCOUNTS RECEIVABLE) VIEW */}
          {activeReport === 'piutang' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area" id="piutang-report-view">
              <ReportHeader
                title="DAFTAR PIUTANG PELANGGAN (ACCOUNTS RECEIVABLE)"
                subtitle={`Posisi Per: ${getPeriodLabel()} • Rekapitulasi Penjualan Kredit Belum Lunas & Analisis Umur Piutang (Aging SAK EMKM)`}
              />

              {/* Payment Success Notification */}
              {paymentSuccessMessage && (
                <div className="no-print p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 animate-fadeIn shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>Pelunasan Piutang Berhasil Dibukukan!</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 font-extrabold uppercase">
                          Kas Bertambah • Piutang Berkurang
                        </span>
                      </div>
                      <p className="text-emerald-800 mt-1 leading-relaxed">{paymentSuccessMessage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {settledReceiptData && (
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Cetak Bukti Kas Masuk (BKM)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveReport('neraca')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      Cek Neraca
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSuccessMessage(null)}
                      className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 1. TOP METRIC CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Sisa Piutang Belum Lunas</span>
                    <CreditCard className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-black font-mono text-rose-950 mt-1">
                    Rp {totalOutstandingPiutang.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-rose-700 mt-0.5">{unpaidReceivables.length} transaksi belum lunas</p>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Belum Jatuh Tempo (Lancar)</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-black font-mono text-blue-950 mt-1">
                    Rp {totalCurrentPiutang.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Masih dalam masa tenggang termin</p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Lewat Jatuh Tempo (Aging Overdue)</span>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-1">
                    Rp {totalOverduePiutang.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5">{unpaidReceivables.filter(i => i.isOverdue).length} tagihan perlu penagihan</p>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Penjualan Kredit</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-black font-mono text-emerald-950 mt-1">
                    Rp {totalAllInvoiced.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Kas Masuk: Rp {totalAllPaid.toLocaleString("id-ID")}</p>
                </div>
              </div>

              {/* 2. VISUALISASI CHART DISTRIBUSI UMUR PIUTANG (RECHARTS SAK EMKM) */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                {/* Header & View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Distribusi Umur Piutang Pelanggan (Aging Schedule)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visualisasi proporsi nominal dan risiko kolektibilitas per kelompok jatuh tempo (SAK EMKM)
                    </p>
                  </div>

                  {/* Chart View Switcher */}
                  <div className="no-print flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPiutangChartView('both')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        piutangChartView === 'both'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Tampilkan grafik batang dan donat berdampingan"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Kedua Grafik</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPiutangChartView('bar')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        piutangChartView === 'bar'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Tampilkan grafik batang (Nominal Rp)"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Bilah (Rp)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPiutangChartView('donut')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        piutangChartView === 'donut'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      title="Tampilkan grafik donat (Persentase %)"
                    >
                      <PieChartIcon className="w-3 h-3" />
                      <span>Donat (%)</span>
                    </button>
                  </div>
                </div>

                {/* Recharts Visual Canvas */}
                {totalOutstandingPiutang > 0 ? (
                  <div className={`grid gap-4 ${piutangChartView === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                    {/* Bar Chart (Nominal Distribusi) */}
                    {(piutangChartView === 'both' || piutangChartView === 'bar') && (
                      <div className={`bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between ${
                        piutangChartView === 'both' ? 'lg:col-span-7' : 'w-full'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Nominal Sisa Piutang per Bucket Umur
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Klik bilah untuk filter tabel
                          </span>
                        </div>

                        <div className="w-full h-56 min-h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={agingChartData}
                              margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
                              onClick={(state: any) => {
                                if (state && state.activePayload && state.activePayload.length) {
                                  const clickedKey = state.activePayload[0].payload.bucketKey;
                                  setPiutangAgingFilter(clickedKey);
                                }
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={{ stroke: "#E2E8F0" }}
                                tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={{ stroke: "#E2E8F0" }}
                                tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }}
                                tickFormatter={(val) => {
                                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                                  return `${val}`;
                                }}
                              />
                              <RechartsTooltip
                                content={({ active, payload }: any) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5 min-w-[220px] z-50">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                          <div className="flex items-center gap-1.5 font-bold">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                            <span>{data.name}</span>
                                          </div>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-300">
                                            {data.badge}
                                          </span>
                                        </div>
                                        <div className="space-y-1 pt-0.5">
                                          <div className="flex justify-between items-center text-slate-300 text-[11px]">
                                            <span>Sisa Piutang:</span>
                                            <span className="font-mono font-bold text-white text-xs">
                                              Rp {(data.amount || 0).toLocaleString("id-ID")}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-slate-300 text-[11px]">
                                            <span>Jumlah Tagihan:</span>
                                            <span className="font-bold text-slate-100">{data.count} Transaksi</span>
                                          </div>
                                          <div className="flex justify-between items-center text-slate-300 text-[11px]">
                                            <span>Porsi Distribusi:</span>
                                            <span className="font-bold text-emerald-400">{data.percentage}%</span>
                                          </div>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
                                          💡 {data.recommendation}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="amount"
                                radius={[6, 6, 0, 0]}
                                cursor="pointer"
                                animationDuration={700}
                              >
                                {agingChartData.map((entry, index) => (
                                  <Cell
                                    key={`bar-cell-${index}`}
                                    fill={entry.color}
                                    opacity={piutangAgingFilter === 'all' || piutangAgingFilter === entry.bucketKey ? 1 : 0.35}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Donut Chart (Komposisi Persentase) */}
                    {(piutangChartView === 'both' || piutangChartView === 'donut') && (
                      <div className={`bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between ${
                        piutangChartView === 'both' ? 'lg:col-span-5' : 'w-full'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Proporsi Umur Piutang (%)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Total: Rp {totalOutstandingPiutang.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
                          <div className="w-40 h-48 relative flex items-center justify-center shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <RechartsTooltip
                                  content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs">
                                          <div className="font-bold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                            <span>{data.name}</span>
                                          </div>
                                          <div className="text-[11px] text-slate-300 mt-1">
                                            Rp {(data.amount || 0).toLocaleString("id-ID")} ({data.percentage}%)
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Pie
                                  data={agingChartData}
                                  dataKey="amount"
                                  nameKey="name"
                                  innerRadius={46}
                                  outerRadius={74}
                                  paddingAngle={3}
                                  cursor="pointer"
                                  onClick={(entry: any) => {
                                    if (entry && entry.bucketKey) {
                                      setPiutangAgingFilter(entry.bucketKey);
                                    }
                                  }}
                                >
                                  {agingChartData.map((entry, index) => (
                                    <Cell
                                      key={`pie-cell-${index}`}
                                      fill={entry.color}
                                      opacity={piutangAgingFilter === 'all' || piutangAgingFilter === entry.bucketKey ? 1 : 0.35}
                                    />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Total Piutang</span>
                              <span className="text-xs font-mono font-black text-slate-800">
                                {totalOutstandingPiutang >= 1000000
                                  ? `${(totalOutstandingPiutang / 1000000).toFixed(1)}jt`
                                  : `Rp ${(totalOutstandingPiutang / 1000).toFixed(0)}k`}
                              </span>
                            </div>
                          </div>

                          {/* Legend breakdown list */}
                          <div className="space-y-1.5 w-full text-xs">
                            {agingChartData.map((item) => (
                              <button
                                key={item.bucketKey}
                                type="button"
                                onClick={() => setPiutangAgingFilter(piutangAgingFilter === item.bucketKey ? 'all' : item.bucketKey)}
                                className={`w-full flex items-center justify-between p-1.5 rounded-lg transition text-left cursor-pointer ${
                                  piutangAgingFilter === item.bucketKey ? 'bg-slate-100 font-bold ring-1 ring-slate-300' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                                  <span className="text-[11px] text-slate-700 truncate">{item.name}</span>
                                </div>
                                <div className="text-right shrink-0 font-mono text-[11px]">
                                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                                  <span className="text-slate-400 text-[10px] ml-1">({item.count})</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">Seluruh Piutang Pelanggan Lunas!</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Tidak ada tagihan penjualan kredit yang tertunggak. Arus kas piutang berada pada tingkat likuiditas 100%.
                    </p>
                  </div>
                )}

                {/* 4 KATEGORI BUCKET AGING SCHEDULE CARDS (INTERACTIVE FILTER) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {agingChartData.map((bucket) => {
                    const isSelected = piutangAgingFilter === bucket.bucketKey;
                    return (
                      <div
                        key={bucket.bucketKey}
                        onClick={() => setPiutangAgingFilter(isSelected ? 'all' : bucket.bucketKey)}
                        className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none relative group hover:shadow-xs ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bucket.color }} />
                            <span>{bucket.name}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bucket.badgeColor}`}>
                            {bucket.badge}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="font-mono font-black text-base text-slate-900">
                            Rp {bucket.amount.toLocaleString("id-ID")}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>{bucket.count} tagihan / faktur</span>
                            <span className="font-bold text-slate-700 font-mono">{bucket.percentage}% porsi</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 truncate">{bucket.statusDesc}</span>
                          <span className={`font-semibold shrink-0 ml-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {isSelected ? '✓ Aktif' : 'Pilih'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. FILTER BAR (HIDDEN ON PRINT) */}
              <div className="no-print space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-600 mr-1">Status:</span>
                    <button
                      onClick={() => setPiutangStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        piutangStatusFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Semua ({creditSalesReceivables.length})
                    </button>
                    <button
                      onClick={() => setPiutangStatusFilter('unpaid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        piutangStatusFilter === 'unpaid'
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Belum Lunas ({unpaidReceivables.length})
                    </button>
                    <button
                      onClick={() => setPiutangStatusFilter('overdue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        piutangStatusFilter === 'overdue'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Lewat Tempo ({unpaidReceivables.filter(i => i.isOverdue).length})
                    </button>
                    <button
                      onClick={() => setPiutangStatusFilter('paid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        piutangStatusFilter === 'paid'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      Lunas ({creditSalesReceivables.filter(i => i.remainingAmount === 0).length})
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari pelanggan / no faktur / bukti..."
                      value={piutangSearch}
                      onChange={(e) => setPiutangSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-64 bg-white"
                    />
                    {piutangSearch && (
                      <button
                        onClick={() => setPiutangSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Aging Bucket Pills Filter */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    Umur Piutang (Aging):
                  </span>
                  <button
                    onClick={() => setPiutangAgingFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      piutangAgingFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Semua Umur
                  </button>
                  <button
                    onClick={() => setPiutangAgingFilter('current')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      piutangAgingFilter === 'current'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    Belum Jatuh Tempo (Lancar)
                  </button>
                  <button
                    onClick={() => setPiutangAgingFilter('1-30')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      piutangAgingFilter === '1-30'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Lewat 1 - 30 Hari
                  </button>
                  <button
                    onClick={() => setPiutangAgingFilter('31-60')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      piutangAgingFilter === '31-60'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                    }`}
                  >
                    Lewat 31 - 60 Hari
                  </button>
                  <button
                    onClick={() => setPiutangAgingFilter('>60')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      piutangAgingFilter === '>60'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Lewat &gt; 60 Hari
                  </button>
                </div>
              </div>

              {/* 4. MAIN RECEIVABLES TABLE */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-3.5 w-28">No. Bukti / Faktur</th>
                      <th className="py-3 px-3.5">Pelanggan &amp; Kontak</th>
                      <th className="py-3 px-3.5 w-24">Tgl Transaksi</th>
                      <th className="py-3 px-3.5 w-24">Jatuh Tempo</th>
                      <th className="py-3 px-3.5 text-center w-36">Status &amp; Umur (Aging)</th>
                      <th className="py-3 px-3.5 text-right w-28">Nilai Penjualan</th>
                      <th className="py-3 px-3.5 text-right w-24">Terbayar</th>
                      <th className="py-3 px-3.5 text-right w-32">Sisa Piutang</th>
                      <th className="py-3 px-3.5 text-center w-28 no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {creditSalesReceivables
                      .filter(inv => {
                        if (piutangStatusFilter === 'unpaid') return inv.remainingAmount > 0;
                        if (piutangStatusFilter === 'overdue') return inv.isOverdue;
                        if (piutangStatusFilter === 'paid') return inv.remainingAmount === 0;
                        return true;
                      })
                      .filter(inv => {
                        if (piutangAgingFilter === 'all') return true;
                        return inv.agingBucket === piutangAgingFilter;
                      })
                      .filter(inv => {
                        if (!piutangSearch.trim()) return true;
                        const q = piutangSearch.toLowerCase();
                        return (
                          inv.invoiceNumber.toLowerCase().includes(q) ||
                          inv.customerName.toLowerCase().includes(q) ||
                          (inv.customerPhone && inv.customerPhone.includes(q)) ||
                          (inv.description && inv.description.toLowerCase().includes(q))
                        );
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{inv.invoiceNumber}</span>
                              <span className="text-[9px] px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {inv.source === 'transaction' ? 'Jurnal' : 'Faktur'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-800">{inv.customerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              {inv.customerPhone && inv.customerPhone !== "-" && <span>{inv.customerPhone}</span>}
                              {inv.customerAddress && inv.customerAddress !== "-" && <span>• {inv.customerAddress}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-600 text-[11px]">
                            {inv.transactionDate}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-600 text-[11px]">
                            {inv.dueDate}
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {inv.remainingAmount === 0 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                Lunas
                              </span>
                            ) : inv.isOverdue ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Lewat {inv.diffDays} Hari
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Tempo {Math.abs(inv.diffDays)} Hari
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-medium text-slate-800">
                            Rp {inv.totalAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-medium text-emerald-700">
                            Rp {inv.paidAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                            <span className={inv.remainingAmount > 0 ? "text-rose-700 font-black" : "text-slate-400"}>
                              Rp {inv.remainingAmount.toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center no-print">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {inv.remainingAmount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(inv)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Catat Pelunasan</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  Lunas 100%
                                </span>
                              )}

                              {inv.paidAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceiptFromHistory(inv)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-slate-200 hover:border-emerald-300 shadow-2xs"
                                  title="Lihat & Cetak Bukti Kas Masuk (Kuitansi BKM)"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                        TOTAL SISA PIUTANG PELANGGAN:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        Rp {totalAllInvoiced.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-emerald-400">
                        Rp {totalAllPaid.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-emerald-300 font-black">
                        Rp {totalOutstandingPiutang.toLocaleString("id-ID")}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 5. FOOTNOTE & COMPLIANCE NOTES */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                <p className="font-bold text-slate-800 uppercase tracking-wide">
                  Ketentuan Pelaporan Piutang SAK EMKM:
                </p>
                <p>
                  1. Piutang usaha diakui saat barang dagang diserahkan atau jasa diberikan kepada pelanggan berdasarkan transaksi penjualan kredit (Akun 1002 - Piutang Usaha) atau faktur penjualan yang sah.
                </p>
                <p>
                  2. Umur Piutang (Aging Schedule) dikelompokkan berdasarkan tanggal jatuh tempo: Belum Jatuh Tempo (Lancar), Lewat 1-30 Hari, Lewat 31-60 Hari, dan Lewat &gt;60 Hari untuk memudahkan manajemen penagihan arus kas.
                </p>
                <p>
                  3. Sesuai Bab 8 SAK EMKM (Instrumen Keuangan), piutang dinilai sebesar jumlah tagihan bruto dikurangi pembayaran kas yang telah diterima dari pelanggan.
                </p>
              </div>

              {/* OFFICIAL SIGNATURE BLOCK FOR PRINT */}
              <ReportSignature />

              {/* MODAL PELUNASAN PIUTANG (PARSIAL & LUNAS PENUH) */}
              {selectedReceivableForPayment && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn no-print overflow-y-auto">
                  <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 p-5 sm:p-6 space-y-4 my-8 animate-scaleUp">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">Pelunasan Piutang Pelanggan</h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            No. Bukti: <span className="font-bold text-slate-700">{selectedReceivableForPayment.invoiceNumber}</span> • {selectedReceivableForPayment.customerName}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReceivableForPayment(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Receivable Summary Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Pelanggan</span>
                          <span className="font-bold text-slate-900 text-xs">{selectedReceivableForPayment.customerName}</span>
                          {selectedReceivableForPayment.customerPhone && selectedReceivableForPayment.customerPhone !== "-" && (
                            <span className="text-[10px] text-slate-500 block font-mono">{selectedReceivableForPayment.customerPhone}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Tgl Transaksi / Tempo</span>
                          <span className="font-mono text-slate-700 text-xs">
                            {selectedReceivableForPayment.transactionDate} ➔ {selectedReceivableForPayment.dueDate}
                          </span>
                          <div className="mt-0.5">
                            {selectedReceivableForPayment.isOverdue ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Lewat {selectedReceivableForPayment.diffDays} Hari
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                Belum Tempo ({Math.abs(selectedReceivableForPayment.diffDays)} hari)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Nilai Faktur</span>
                          <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                            Rp {selectedReceivableForPayment.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Sudah Terbayar</span>
                          <span className="font-mono font-bold text-emerald-700 text-xs mt-0.5 block">
                            Rp {(selectedReceivableForPayment.paidAmount || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-2 bg-rose-50/80 rounded-lg border border-rose-200">
                          <span className="text-[10px] text-rose-700 block font-bold uppercase">Sisa Tagihan</span>
                          <span className="font-mono font-black text-rose-700 text-xs mt-0.5 block">
                            Rp {selectedReceivableForPayment.remainingAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mode Pelunasan: Penuh vs Parsial */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Pilihan Jenis Pembayaran</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('full');
                            setPaymentAmountInput(selectedReceivableForPayment.remainingAmount);
                            setPaymentNotesInput(`Pelunasan Penuh Tagihan ${selectedReceivableForPayment.invoiceNumber} — ${selectedReceivableForPayment.customerName}`);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMode === 'full'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Lunas Penuh (100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('partial');
                            if (paymentAmountInput === selectedReceivableForPayment.remainingAmount) {
                              setPaymentAmountInput(Math.round(selectedReceivableForPayment.remainingAmount * 0.5));
                            }
                            setPaymentNotesInput(`Pembayaran Parsial Tagihan ${selectedReceivableForPayment.invoiceNumber} — ${selectedReceivableForPayment.customerName}`);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMode === 'partial'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>Pembayaran Parsial (Cicilan)</span>
                        </button>
                      </div>

                      {/* Quick Percentage Buttons for Partial Mode */}
                      {paymentMode === 'partial' && (
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-semibold mr-1">Shortcut Cicilan:</span>
                          {[
                            { label: "25%", ratio: 0.25 },
                            { label: "50%", ratio: 0.50 },
                            { label: "75%", ratio: 0.75 },
                            { label: "100%", ratio: 1.0 }
                          ].map((pct) => {
                            const val = Math.round(selectedReceivableForPayment.remainingAmount * pct.ratio);
                            return (
                              <button
                                key={pct.label}
                                type="button"
                                onClick={() => {
                                  setPaymentAmountInput(val);
                                  if (pct.ratio === 1.0) setPaymentMode('full');
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono transition cursor-pointer"
                              >
                                {pct.label} (Rp {(val / 1000).toLocaleString('id-ID')}k)
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Error Banner */}
                    {paymentError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    {/* Payment Inputs Form */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 flex items-center gap-1">
                            <span>Jumlah Kas Masuk Diterima (Rp)</span>
                            <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] font-mono text-emerald-700 font-bold">
                            Maks: Rp {selectedReceivableForPayment.remainingAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={paymentAmountInput || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setPaymentAmountInput(val);
                            if (val >= selectedReceivableForPayment.remainingAmount) {
                              setPaymentMode('full');
                            } else {
                              setPaymentMode('partial');
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-base focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                          placeholder="Masukkan nominal pelunasan..."
                        />
                        {paymentAmountInput > 0 && (
                          <p className="text-[10px] text-slate-500 italic mt-1 truncate">
                            Terbilang: <span className="font-semibold text-slate-700">{angkaTerbilang(paymentAmountInput)}</span>
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tanggal Terima Kas</label>
                          <input
                            type="date"
                            value={paymentDateInput}
                            onChange={(e) => setPaymentDateInput(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Masuk Rekening / Kas</label>
                          <select
                            value={paymentSourceAccount}
                            onChange={(e) => setPaymentSourceAccount(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                          >
                            <option value="1001">1001 - Kas &amp; Setara Kas (Tunai/Kasir)</option>
                            <option value="1001">1001 - Kas Bank BCA (Transfer)</option>
                            <option value="1001">1001 - Kas Bank Mandiri / QRIS</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">No. Bukti Kas Masuk (BKM)</label>
                          <input
                            type="text"
                            value={paymentReceiptNumber}
                            onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                            placeholder="Contoh: BKM/2026/06/001"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Keterangan / Memo Pembayaran</label>
                          <input
                            type="text"
                            value={paymentNotesInput}
                            onChange={(e) => setPaymentNotesInput(e.target.value)}
                            placeholder="Keterangan transaksi pelunasan..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Simulasi Dampak Akuntansi & Neraca (Live Accounting Simulation) */}
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-indigo-950 font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Simulasi Mutasi Neraca &amp; Jurnal Otomatis (SAK EMKM)
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                            Auto Double-Entry
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Sisa Piutang Akhir</span>
                            <span className="font-mono font-bold text-xs mt-0.5 block text-slate-800">
                              Rp {Math.max(0, selectedReceivableForPayment.remainingAmount - paymentAmountInput).toLocaleString('id-ID')}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 inline-block ${
                              paymentAmountInput >= selectedReceivableForPayment.remainingAmount
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {paymentAmountInput >= selectedReceivableForPayment.remainingAmount ? 'LUNAS (100%)' : 'PARSIAL'}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Kas (1001) di Neraca</span>
                            <span className="font-mono font-bold text-xs mt-0.5 block text-emerald-700">
                              + Rp {(paymentAmountInput || 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold mt-1 block">Bertambah (Debit)</span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Piutang (1002) di Neraca</span>
                            <span className="font-mono font-bold text-xs mt-0.5 block text-rose-700">
                              - Rp {(paymentAmountInput || 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-rose-600 font-semibold mt-1 block">Berkurang (Kredit)</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-indigo-800 leading-tight pt-1">
                          📌 Transaksi ini mendebit akun 1001 (Kas) dan mengkredit akun 1002 (Piutang Usaha). Saldo posisi keuangan (Neraca) tetap seimbang sempurna.
                        </p>
                      </div>

                      {/* Riwayat Pembayaran Sebelumnya (jika ada) */}
                      {selectedReceivableForPayment.paymentHistory && selectedReceivableForPayment.paymentHistory.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                            Riwayat Pembayaran Sebelumnya ({selectedReceivableForPayment.paymentHistory.length} kali)
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {selectedReceivableForPayment.paymentHistory.map((rec: any, idx: number) => (
                              <div key={rec.id || idx} className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-slate-500">{rec.date}</span>
                                  <span className="text-slate-700 font-medium truncate max-w-[180px]">{rec.note || rec.receiptNumber}</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-700">
                                  Rp {(rec.amount || 0).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dialog Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedReceivableForPayment(null)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Pelunasan Kas</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL BUKTI KAS MASUK (KUITANSI RESMI SAK EMKM) */}
              {showReceiptModal && settledReceiptData && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn no-print overflow-y-auto">
                  <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 my-8 animate-scaleUp">
                    {/* Modal Bar Actions */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Bukti Kas Masuk (Kuitansi Resmi)</h3>
                          <p className="text-[11px] text-slate-500">Standar Akuntansi Keuangan SAK EMKM</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Kuitansi Paper Preview Frame */}
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white space-y-4 text-xs font-sans shadow-inner">
                      {/* Store Header */}
                      <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
                        <div>
                          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                            {storeConfig?.storeName || "Toko Sembako Akuntan AI"}
                          </h2>
                          <p className="text-[11px] text-slate-600">
                            {storeConfig?.storeAddress || "Jl. Niaga Raya No. 45"}, {storeConfig?.storeCity || "Indonesia"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            NPWP: {storeConfig?.storeNpwp || "00.000.000.0-000.000"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                            BUKTI KAS MASUK
                          </span>
                          <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                            {settledReceiptData.receiptNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Tgl: {settledReceiptData.date}
                          </div>
                        </div>
                      </div>

                      {/* Receipt Fields */}
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-12 gap-2">
                          <span className="col-span-4 text-slate-500 font-medium">Telah Terima Dari:</span>
                          <span className="col-span-8 font-bold text-slate-900 border-b border-slate-200 pb-0.5">
                            {settledReceiptData.customerName}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <span className="col-span-4 text-slate-500 font-medium">Uang Sejumlah:</span>
                          <div className="col-span-8 border-b border-slate-200 pb-0.5">
                            <span className="font-mono font-black text-emerald-800 text-sm">
                              Rp {settledReceiptData.amount.toLocaleString('id-ID')}
                            </span>
                            <span className="block text-[11px] font-serif italic text-slate-700 mt-0.5">
                              #{settledReceiptData.terbilang}#
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <span className="col-span-4 text-slate-500 font-medium">Untuk Pembayaran:</span>
                          <span className="col-span-8 text-slate-800 border-b border-slate-200 pb-0.5">
                            {settledReceiptData.notes}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <span className="col-span-4 text-slate-500 font-medium">Faktur / No. Bukti:</span>
                          <span className="col-span-8 font-mono font-semibold text-slate-800 border-b border-slate-200 pb-0.5">
                            {settledReceiptData.invoiceNumber}
                          </span>
                        </div>
                      </div>

                      {/* Status & Sisa Piutang Table */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Faktur</span>
                          <span className="font-mono font-bold text-slate-800">
                            Rp {settledReceiptData.originalTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Pembayaran Ini</span>
                          <span className="font-mono font-bold text-emerald-700">
                            Rp {settledReceiptData.currentPayment.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Sisa Piutang</span>
                          <span className="font-mono font-bold text-rose-700">
                            Rp {settledReceiptData.newRemaining.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Penyetor / Pelanggan,</span>
                          <div className="h-12 flex items-end justify-center">
                            <span className="font-bold text-slate-800 underline decoration-slate-400">
                              ( {settledReceiptData.customerName} )
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Diterima Kasir / Keuangan,</span>
                          <div className="h-12 flex items-end justify-center">
                            <span className="font-bold text-slate-800 underline decoration-slate-400">
                              ( Staf Akuntansi Toko )
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReceiptModal(false);
                          setActiveReport('neraca');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                      >
                        ➔ Lihat Saldo di Neraca
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReceiptModal(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                          Tutup
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Kuitansi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* EXCEL EXPORT TAB */}
      {activeReport === 'ekspor' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-3 py-6">
                <FileCode className="w-16 h-16 text-teal-600 mx-auto" />
                <h2 className="text-lg font-bold text-slate-800">Ekspor Laporan ke Microsoft Excel (.xlsx)</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unduh seluruh database pembukuan Anda—termasuk Sheet Master Daftar Transaksi, Jurnal Umum double-entry, Neraca EMKM, Laporan Laba Rugi, Buku Besar, dan Katalog Stok—dalam 1 file terstruktur rapi.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleExcelExport}
                    disabled={exportState?.loading}
                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition shadow-xs text-xs cursor-pointer"
                  >
                    {exportState?.loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyiapkan File Excel...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Unduh File Excel ({getPeriodLabel()})</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveReport('import')}
                    className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-5 py-3 rounded-xl transition border border-emerald-200 text-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Buka Tab Import Excel
                  </button>
                </div>

                {exportState?.success && exportState.blobUrl && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">File Excel Siap Diunduh ({exportState.sheetCount} Tab SAK EMKM)</p>
                        <p className="text-[11px] text-emerald-700 font-mono">{exportState.fileName}</p>
                      </div>
                    </div>
                    <a
                      href={exportState.blobUrl}
                      download={exportState.fileName}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Klik di Sini untuk Unduh Langsung</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-xs text-slate-600">
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800">Kemudahan Interoperabilitas:</h4>
                  <p className="leading-relaxed text-[11px]">
                    File yang diekspor dari aplikasi ini memiliki sheet <strong>Daftar Transaksi</strong> dan <strong>Jurnal Umum</strong> yang dapat langsung di-import kembali kapan saja melalui menu <strong>Import Excel</strong> tanpa resiko data tertimpa atau terhapus.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800">Kompatibilitas Penyimpanan:</h4>
                  <p className="leading-relaxed text-[11px]">
                    File hasil ekspor ini kompatibel dengan <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong>, <strong>WPS Office</strong>, dan <strong>LibreOffice Calc</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL CETAK STANDAR SAK EMKM & UNDUH PDF */}
      <UniversalPrintModal
        isOpen={printModalData.isOpen}
        onClose={() => setPrintModalData(prev => ({ ...prev, isOpen: false }))}
        title={printModalData.title}
        filename={printModalData.filename}
        htmlContent={printModalData.html}
      />

      {/* DEDICATED A4 PRINTTEMPLATE COMPONENT (KOP USAHA, TABEL RAPI & TANDA TANGAN) */}
      {showA4PrintModal && activeReportData && (
        <PrintTemplate
          mode="modal"
          isOpen={showA4PrintModal}
          onClose={() => setShowA4PrintModal(false)}
          data={activeReportData}
        />
      )}
    </div>
  );
};
