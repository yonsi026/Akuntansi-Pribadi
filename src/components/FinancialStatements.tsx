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
  LayoutList
} from "lucide-react";
import { FinancialStats, Transaction, StockItem, JournalEntry, StoreConfig } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { computeTrialBalance, generateJournal, computeFinancialStats } from "../utils/accountingEngine";
import { exportToXLSX } from "../utils/xlsxExport";
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
  initialReport?: 'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'ekspor' | 'import';
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

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
  stats,
  transactions,
  stockItems,
  journal,
  storeConfig,
  onImportTransactions,
  initialReport
}) => {
  const [activeReport, setActiveReport] = useState<'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'ekspor' | 'import'>(initialReport || 'labarugi');

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

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
    if (filterMode === 'all') return journal;
    return generateJournal(activeTransactions);
  }, [journal, activeTransactions, filterMode]);

  const activeStats = useMemo(() => {
    if (filterMode === 'all') return stats;
    return computeFinancialStats(activeTransactions, activeJournal);
  }, [stats, activeTransactions, activeJournal, filterMode]);

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
    customEndDate
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
      {/* IN-REPORT PRINT ACTION BAR (HIDDEN ON PRINT) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Printer className="w-4 h-4 text-slate-900 shrink-0" />
          <span><strong>Siap Cetak / Unduh PDF:</strong> Format A4 resmi dengan Kop Surat usaha, tabel akun, dan kolom tanda tangan ({getPeriodLabel()}).</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode(prev => prev === 'print-sheet' ? 'standard' : 'print-sheet')}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition cursor-pointer border text-xs ${
              displayMode === 'print-sheet'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                : 'bg-white hover:bg-indigo-50 text-indigo-900 border-indigo-200 shadow-2xs'
            }`}
            title="Beralih ke tampilan Lembar Cetak Dokumen A4 langsung di halaman"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{displayMode === 'print-sheet' ? 'Tampilan Ringkas' : 'Mode Cetak Dokumen (A4)'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer shadow-xs whitespace-nowrap active:scale-95 text-xs"
            title="Buka Pratinjau Modal Cetak & Unduh PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen Ini</span>
          </button>
        </div>
      </div>

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

      {/* TOP HEADER SELECTOR & CONTROL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 bg-white p-4 rounded-xl shadow-xs no-print">
        {/* Toggle choices */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveReport('labarugi')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'labarugi' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Laporan Laba Rugi
          </button>
          <button
            onClick={() => setActiveReport('neraca')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'neraca' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Laporan Neraca SAK EMKM
          </button>
          <button
            onClick={() => setActiveReport('aruskas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'aruskas' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Arus Kas (Metode Langsung)
          </button>
          <button
            onClick={() => setActiveReport('neracasaldo')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'neracasaldo' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Neraca Saldo (Trial Balance)
          </button>
          <button
            onClick={() => setActiveReport('import')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeReport === 'import' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import Excel (.xlsx)
          </button>
          <button
            onClick={() => setActiveReport('ekspor')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'ekspor' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Ekspor Microsoft Excel
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2 font-semibold">
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
            onClick={() => setActiveReport('import')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            title="Import data dari file Excel yang sudah diekspor sebelumnya"
          >
            <Upload className="w-3.5 h-3.5" />
            Import .XLS
          </button>
          <button
            onClick={handleExcelExport}
            disabled={exportState?.loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg text-xs transition cursor-pointer shadow-xs"
            title="Ekspor laporan aktif ke file Excel (.xlsx)"
          >
            {exportState?.loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportState?.loading ? "Menyiapkan..." : "Ekspor .XLS"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            title="Cetak Laporan ke Printer atau Simpan sebagai Dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF
          </button>
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
