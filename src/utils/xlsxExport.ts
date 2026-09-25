import * as XLSX from "xlsx";
import { Transaction, StockItem, JournalEntry, FinancialStats, StoreConfig } from "../types";
import { CHART_OF_ACCOUNTS, getAccountName } from "../data/chartOfAccounts";
import { computeTrialBalance, computeLedger } from "./accountingEngine";

export interface ExportResult {
  success: boolean;
  fileName: string;
  sheetCount: number;
  blobUrl?: string;
  error?: string;
}

/**
 * Sanitizes and guarantees that an Excel sheet name:
 * 1. Contains no forbidden characters: : \ / ? * [ ]
 * 2. Does not exceed 31 characters (strict Excel / SheetJS limit)
 * 3. Is unique across the workbook (case-insensitive)
 */
function createSheetNameSanitizer() {
  const usedNames = new Set<string>();

  return function getSafeName(rawName: string): string {
    // Replace forbidden characters : \ / ? * [ ] with -
    let clean = (rawName || "Sheet")
      .replace(/[:\\/?*[\]]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length > 31) {
      clean = clean.slice(0, 31).trim();
    }
    if (!clean) clean = "Sheet";

    let finalName = clean;
    let counter = 1;

    while (usedNames.has(finalName.toLowerCase())) {
      const suffix = `_${counter}`;
      const maxBaseLen = 31 - suffix.length;
      finalName = `${clean.slice(0, maxBaseLen)}${suffix}`;
      counter++;
    }

    usedNames.add(finalName.toLowerCase());
    return finalName;
  };
}

/**
 * Safely downloads a SheetJS workbook in any browser or sandboxed iframe.
 */
function triggerBrowserDownload(wb: XLSX.WorkBook, fileName: string): { blobUrl: string } {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const blobUrl = window.URL.createObjectURL(blob);

  // Attempt automatic download via DOM anchor
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  document.body.appendChild(a);
  a.click();

  // Clean up anchor tag after delay
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    } catch {
      // ignore
    }
  }, 1000);

  return { blobUrl };
}

/**
 * Main Excel Export function. Generates a multi-sheet workbook conforming to SAK EMKM:
 * - Tab 0: Master Daftar Transaksi (for re-importing without data overwrite)
 * - Tab 1: Jurnal Umum Double-Entry
 * - Tab 2+: Buku Besar per Akun (with sanitized sheet names without slashes)
 * - Tab 3: Neraca Saldo (Trial Balance)
 * - Tab 4: Laporan Laba Rugi
 * - Tab 5: Laporan Neraca (Aktiva vs Pasiva)
 * - Tab 6: Inventaris Stok Barang & HPP
 */
export function exportToXLSX(
  transactions: Transaction[],
  stockItems: StockItem[],
  journal: JournalEntry[],
  stats: FinancialStats,
  storeConfig?: StoreConfig,
  periodLabel?: string
): ExportResult {
  try {
    const sanitizeSheetName = createSheetNameSanitizer();
    const wb = XLSX.utils.book_new();

    // Store profile info
    const dynamicName = storeConfig?.storeName || "Toko Sembako Akuntan AI";
    const dynamicCity = storeConfig?.storeCity || "Indonesia";
    const dynamicType = storeConfig?.storeType || "SAK EMKM";
    const dynamicPeriod = periodLabel || `Periode: ${storeConfig?.reportPeriod || "Bulanan"}`;

    // 0. --- SHEET 0: DAFTAR TRANSAKSI LENGKAP (MASTER DATA UNTUK RE-IMPORT) ---
    const txHeaders = [
      [`LAPORAN DAFTAR TRANSAKSI KEUANGAN LENGKAP — ${dynamicType.toUpperCase()}`],
      [`${dynamicName} (${dynamicCity}) - Kepatuhan SAK EMKM`],
      [`${dynamicPeriod} | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")} | Total: ${transactions.length} Transaksi`],
      [],
      [
        "ID Transaksi",
        "Tanggal",
        "No. Invoice",
        "Jenis Transaksi",
        "Keterangan",
        "Total Jumlah (Rp)",
        "Kode Akun Debit",
        "Nama Akun Debit",
        "Kode Akun Kredit",
        "Nama Akun Kredit",
        "PPN Aktif",
        "Nilai PPN (Rp)",
        "ID Item Stok",
        "Kuantitas Stok",
        "Harga Satuan (Rp)",
        "HPP Terposting (Rp)"
      ]
    ];

    const txRows = transactions.map((t) => [
      t.id,
      t.date,
      t.invoiceNumber || "",
      t.type,
      t.description,
      t.amount,
      t.debitAccount,
      t.customDebitAccountName || getAccountName(t.debitAccount),
      t.creditAccount,
      t.customCreditAccountName || getAccountName(t.creditAccount),
      t.ppnEnabled ? "Ya" : "Tidak",
      t.ppnAmount || 0,
      t.stockItemId || "",
      t.stockQuantity || "",
      t.stockPricePerUnit || "",
      t.hppAmountPosted || ""
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet([...txHeaders, ...txRows]);
    wsTx["!cols"] = [
      { wch: 18 }, // ID Transaksi
      { wch: 12 }, // Tanggal
      { wch: 14 }, // Invoice
      { wch: 18 }, // Jenis
      { wch: 35 }, // Keterangan
      { wch: 16 }, // Jumlah
      { wch: 12 }, // Kode Debit
      { wch: 22 }, // Nama Debit
      { wch: 12 }, // Kode Kredit
      { wch: 22 }, // Nama Kredit
      { wch: 10 }, // PPN Aktif
      { wch: 14 }, // Nilai PPN
      { wch: 14 }, // ID Stok
      { wch: 12 }, // Qty
      { wch: 14 }, // Harga Satuan
      { wch: 16 }  // HPP Terposting
    ];

    XLSX.utils.book_append_sheet(wb, wsTx, sanitizeSheetName("Daftar Transaksi"));

    // 1. --- SHEET 1: JURNAL UMUM ---
    const jurnalHeaders = [
      [`LAPORAN JURNAL UMUM DOUBLE-ENTRY — ${dynamicType.toUpperCase()}`],
      [`${dynamicName} (${dynamicCity}) - Kepatuhan SAK EMKM`],
      [`${dynamicPeriod} | Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["Tanggal", "No. Bukti / Ref", "Kode Akun", "Nama Akun", "Debit (Rp)", "Kredit (Rp)", "Keterangan"]
    ];

    const jurnalRows = journal.map((j) => [
      j.date,
      j.ref,
      j.accountId,
      j.accountName,
      j.debit || 0,
      j.credit || 0,
      j.description
    ]);

    const wsJurnal = XLSX.utils.aoa_to_sheet([...jurnalHeaders, ...jurnalRows]);
    wsJurnal["!cols"] = [
      { wch: 12 }, // Tanggal
      { wch: 12 }, // Ref
      { wch: 10 }, // Kode Akun
      { wch: 28 }, // Nama Akun
      { wch: 16 }, // Debit
      { wch: 16 }, // Kredit
      { wch: 35 }  // Keterangan
    ];

    XLSX.utils.book_append_sheet(wb, wsJurnal, sanitizeSheetName("Jurnal Umum"));

    // 2. --- SHEET 2: BUKU BESAR (PER AKUN DENGAN NAMA TAB YANG AMAN & BERSIH) ---
    const trialBalance = computeTrialBalance(journal);
    const activeAccountIds = trialBalance.map((item) => item.accountId);

    activeAccountIds.forEach((accountId) => {
      const acc = CHART_OF_ACCOUNTS.find((a) => a.id === accountId);
      if (!acc) return;

      const ledgerItems = computeLedger(accountId, journal, acc.normalBalance);
      
      // Sanitized tab name guaranteed to have NO slashes or forbidden chars
      const safeTabName = sanitizeSheetName(`${accountId} - ${acc.name}`);

      const ledgerHeaders = [
        [`BUKU BESAR - ${acc.name.toUpperCase()} (${accountId})`],
        [`Kategori: ${acc.category} | Saldo Normal: ${acc.normalBalance} | ${dynamicPeriod}`],
        [],
        ["Tanggal", "Ref / Bukti", "Keterangan", "Debit (Rp)", "Kredit (Rp)", "Saldo Akhir (Rp)"]
      ];

      const ledgerRows = ledgerItems.map((item) => [
        item.date,
        item.ref,
        item.description,
        item.debit || 0,
        item.credit || 0,
        item.balance || 0
      ]);

      const totalDebit = ledgerItems.reduce((sum, item) => sum + (item.debit || 0), 0);
      const totalCredit = ledgerItems.reduce((sum, item) => sum + (item.credit || 0), 0);
      const finalBalance = ledgerItems.length > 0 ? ledgerItems[ledgerItems.length - 1].balance : 0;

      const summaryRow = [
        "TOTAL",
        "",
        "Akumulasi Total Berjalan",
        totalDebit,
        totalCredit,
        finalBalance
      ];

      const wsLedger = XLSX.utils.aoa_to_sheet([...ledgerHeaders, ...ledgerRows, [], summaryRow]);
      wsLedger["!cols"] = [
        { wch: 12 }, // Tanggal
        { wch: 12 }, // Ref
        { wch: 30 }, // Keterangan
        { wch: 16 }, // Debit
        { wch: 16 }, // Kredit
        { wch: 18 }  // Saldo
      ];

      XLSX.utils.book_append_sheet(wb, wsLedger, safeTabName);
    });

    // 3. --- SHEET 3: NERACA SALDO ---
    const trialBalanceRows = trialBalance.map((tb) => [
      tb.accountId,
      tb.accountName,
      tb.debit || 0,
      tb.credit || 0
    ]);

    const totalSldDebit = trialBalance.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalSldCredit = trialBalance.reduce((sum, item) => sum + (item.credit || 0), 0);
    const isBalanced = Math.abs(totalSldDebit - totalSldCredit) < 1;

    const neracaSaldoHeaders = [
      ["NERACA SALDO (TRIAL BALANCE)"],
      [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
      [`${dynamicPeriod} | Hingga Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["Kode Akun", "Nama Akun", "Total Debit (Rp)", "Total Kredit (Rp)"]
    ];

    const valueSummary = [
      "TOTAL SALDO",
      isBalanced ? "SEIMBANG ✅" : "TIDAK SEIMBANG ❌",
      totalSldDebit,
      totalSldCredit
    ];

    const wsNeracaSaldo = XLSX.utils.aoa_to_sheet([
      ...neracaSaldoHeaders,
      ...trialBalanceRows,
      [],
      valueSummary
    ]);

    wsNeracaSaldo["!cols"] = [
      { wch: 12 }, // Kode Akun
      { wch: 30 }, // Nama Akun
      { wch: 18 }, // Total Debit
      { wch: 18 }  // Total Kredit
    ];

    XLSX.utils.book_append_sheet(wb, wsNeracaSaldo, sanitizeSheetName("Neraca Saldo"));

    // 4. --- SHEET 4: LAPORAN LABA RUGI ---
    const labaRugiData: any[][] = [
      ["LAPORAN LABA RUGI OPERASIONAL"],
      [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
      [`${dynamicPeriod} | Hingga Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["Kategori Akun", "Keterangan", "Debit (Rp)", "Kredit (Rp)", "Subtotal (Rp)"],
      ["1. PENDAPATAN", "Pendapatan Penjualan (4001)", 0, stats.revenue, stats.revenue],
      ["TOTAL PENDAPATAN", "", "", "", stats.revenue],
      [],
      ["2. BEBAN POKOK", "Harga Pokok Penjualan HPP (5001)", stats.hpp, 0, -stats.hpp],
      ["TOTAL BEBAN POKOK (HPP)", "", "", "", stats.hpp],
      [],
      ["LABA KOTOR (GROSS PROFIT)", "", "", "", stats.grossProfit],
      [],
      ["3. BEBAN OPERASIONAL"]
    ];

    CHART_OF_ACCOUNTS.filter((acc) => acc.id >= 6000 && acc.id <= 6999).forEach((acc) => {
      const tbItem = trialBalance.find((t) => t.accountId === acc.id);
      const amt = tbItem ? tbItem.debit - tbItem.credit : 0;
      if (amt > 0) {
        labaRugiData.push([
          "Beban Operasional",
          `${acc.name} (${acc.id})`,
          amt,
          0,
          -amt
        ]);
      }
    });

    labaRugiData.push(
      ["TOTAL BEBAN OPERASIONAL", "", stats.expenses, "", -stats.expenses],
      [],
      ["LABA BERSIH SEBELUM PAJAK", "", "", "", stats.netProfit],
      ["ESTIMASI PPh FINAL 0.5% (OMZET BRUTO)", "Peraturan Pajak UMKM PP 23", "", "", stats.pph],
      ["ESTIMASI LABA SETELAH PAJAK", "", "", "", stats.netProfit - stats.pph]
    );

    const wsLabaRugi = XLSX.utils.aoa_to_sheet(labaRugiData);
    wsLabaRugi["!cols"] = [
      { wch: 24 }, // Kategori Akun
      { wch: 35 }, // Keterangan
      { wch: 15 }, // Debit
      { wch: 15 }, // Kredit
      { wch: 18 }  // Subtotal
    ];

    XLSX.utils.book_append_sheet(wb, wsLabaRugi, sanitizeSheetName("Laba Rugi"));

    // 5. --- SHEET 5: NERACA (BALANCE SHEET) ---
    const asset1001 = trialBalance.find(t => t.accountId === 1001)?.debit || 0;
    const asset1002 = trialBalance.find(t => t.accountId === 1002)?.debit || 0;
    const asset1003 = trialBalance.find(t => t.accountId === 1003)?.debit || 0;
    const asset1004 = trialBalance.find(t => t.accountId === 1004)?.debit || 0;
    const assetTetap = trialBalance.find(t => t.accountId === 1005)?.debit || 0;

    const liab2001 = trialBalance.find(t => t.accountId === 2001)?.credit || 0;
    const liab2002 = stats.pph || 0;
    const liab2003 = trialBalance.find(t => t.accountId === 2003)?.credit || 0;

    const eq3001 = trialBalance.find(t => t.accountId === 3001)?.credit || 0;
    const eq3002 = trialBalance.find(t => t.accountId === 3002)?.debit || 0;

    const neracaData = [
      ["LAPORAN NERACA KEUANGAN (BALANCE SHEET)"],
      [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
      [`${dynamicPeriod} | Posisi Per Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["SISI AKTIVA (ASET)", "Jumlah (Rp)", "", "SISI PASIVA (KEWAJIBAN & EKUITAS)", "Jumlah (Rp)"],
      ["ASET LANCAR", "", "", "LIABILITAS (UTANG)", ""],
      ["  - Kas di Tangan & Bank (1001)", asset1001, "", "  - Utang Usaha ke Supplier (2001)", liab2001],
      ["  - Piutang Dagang (1002)", asset1002, "", "  - Utang Pajak PPh 4(2) UMKM (2002)", liab2002],
      ["  - Persediaan Barang Dagang (1003)", asset1003, "", "  - PPN Keluaran Terutang (2003)", liab2003],
      ["  - PPN Masukan Dibayar Dimuka (1004)", asset1004, "", "TOTAL LIABILITAS", liab2001 + liab2002 + liab2003],
      ["TOTAL ASET LANCAR", asset1001 + asset1002 + asset1003 + asset1004, "", "", ""],
      [],
      ["ASET TETAP", "", "", "EKUITAS (MODAL PEMILIK)", ""],
      ["  - Peralatan Toko & Inventaris (1005)", assetTetap, "", "  - Modal Disetor Pemilik (3001)", eq3001],
      ["", "", "", "  - Tarik Prive Pemilik (3002)", -eq3002],
      ["", "", "", "  - Laba Bersih Periode Berjalan", stats.netProfit],
      ["TOTAL ASET TETAP", assetTetap, "", "TOTAL EKUITAS", stats.totalEquity],
      [],
      ["TOTAL AKTIVA (ASET)", stats.totalAssets, "", "TOTAL PASIVA (UTANG + MODAL)", stats.totalLiabilities + stats.totalEquity]
    ];

    const wsNeraca = XLSX.utils.aoa_to_sheet(neracaData);
    wsNeraca["!cols"] = [
      { wch: 35 }, // Sisi Aktiva
      { wch: 18 }, // Jumlah
      { wch: 5 },  // spacer
      { wch: 35 }, // Sisi Pasiva
      { wch: 18 }  // Jumlah
    ];

    XLSX.utils.book_append_sheet(wb, wsNeraca, sanitizeSheetName("Neraca"));

    // 6. --- SHEET 6: STOK BARANG ---
    const stockHeaders = [
      ["LAPORAN INTEGRASI MANAJEMEN PERSEDIAAN STOK & HPP"],
      [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
      [`Hingga Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["SKU", "Nama Persediaan Produk", "Satuan Unit", "Stok Aktif", "Rata-Rata Harga Beli (HPP) (Rp)", "Harga Jual Pasar (Rp)", "Total Nilai Persediaan (Rp)"]
    ];

    const stockRows = stockItems.map((s) => [
      s.sku,
      s.name,
      s.unit,
      s.stock,
      s.avgPurchasePrice,
      s.sellPrice,
      s.stock * s.avgPurchasePrice
    ]);

    const totalStockItemCount = stockItems.reduce((sum, s) => sum + s.stock, 0);
    const totalStockValuation = stockItems.reduce((sum, s) => sum + s.stock * s.avgPurchasePrice, 0);

    const stockSummaryRow = [
      "TOTAL",
      "Akumulasi Seluruh Stok",
      "",
      totalStockItemCount,
      "",
      "",
      totalStockValuation
    ];

    const wsStock = XLSX.utils.aoa_to_sheet([...stockHeaders, ...stockRows, [], stockSummaryRow]);
    wsStock["!cols"] = [
      { wch: 12 }, // SKU
      { wch: 28 }, // Nama
      { wch: 12 }, // Unit
      { wch: 12 }, // Stok Aktif
      { wch: 22 }, // HPP Rata-Rata
      { wch: 18 }, // Harga Jual
      { wch: 22 }  // Total Nilai
    ];

    XLSX.utils.book_append_sheet(wb, wsStock, sanitizeSheetName("Stok Barang"));

    // Formulate safe and descriptive filename
    const dateStr = new Date().toISOString().split("T")[0];
    const safeStorePrefix = (storeConfig?.storeName || "UMKM")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 15);
    const fileName = `Laporan_${safeStorePrefix}_${dateStr}.xlsx`;

    // Trigger download
    const { blobUrl } = triggerBrowserDownload(wb, fileName);

    return {
      success: true,
      fileName,
      sheetCount: wb.SheetNames.length,
      blobUrl
    };
  } catch (err: any) {
    console.error("Error in exportToXLSX:", err);
    return {
      success: false,
      fileName: "",
      sheetCount: 0,
      error: err?.message || "Terjadi kesalahan saat memproses ekspor Excel."
    };
  }
}
