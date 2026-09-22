import * as XLSX from "xlsx";
import { Transaction, StockItem, JournalEntry, FinancialStats, StoreConfig } from "../types";
import { CHART_OF_ACCOUNTS, getAccountName } from "../data/chartOfAccounts";
import { computeTrialBalance, computeLedger } from "./accountingEngine";

/**
 * Formats a number cleanly as Indonesian Rupiah if requested,
 * but for Excel export we write raw numbers so the user can sum them,
 * and we let Excel handle the display width.
 */
export function exportToXLSX(
  transactions: Transaction[],
  stockItems: StockItem[],
  journal: JournalEntry[],
  stats: FinancialStats,
  storeConfig?: StoreConfig
) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Dynamic store name
  const dynamicName = storeConfig?.storeName || "Toko Sembako Akuntan AI";
  const dynamicCity = storeConfig?.storeCity || "Jakarta";
  const dynamicType = storeConfig?.storeType || "SAK EMKM";

  // 1. --- SHEET 1: JURNAL UMUM ---
  const jurnalHeaders = [
    [`LAPORAN JURNAL UMUM DOUBLE-ENTRY — ${dynamicType.toUpperCase()}`],
    [`${dynamicName} (${dynamicCity}) - Kepatuhan SAK EMKM`],
    [`Tanggal Ekspor: ${new Date().toLocaleDateString("id-ID")}`],
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
  
  // Set column widths
  wsJurnal["!cols"] = [
    { wch: 12 }, // Tanggal
    { wch: 12 }, // Ref
    { wch: 10 }, // Kode Akun
    { wch: 28 }, // Nama Akun
    { wch: 16 }, // Debit
    { wch: 16 }, // Kredit
    { wch: 35 }  // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, wsJurnal, "Jurnal Umum");

  // 2. --- SHEET 2: BUKU BESAR (PER AKUN DI TAB BERBEDA) ---
  // We'll create a tab for each account category or each account with activity to satisfy "per akun di tab berbeda"
  const trialBalance = computeTrialBalance(journal);
  const activeAccountIds = trialBalance.map((item) => item.accountId);

  activeAccountIds.forEach((accountId) => {
    const acc = CHART_OF_ACCOUNTS.find((a) => a.id === accountId);
    if (!acc) return;

    // Get ledger items for this account
    const ledgerItems = computeLedger(accountId, journal, acc.normalBalance);
    
    // Tab name format: limit to 31 chars max (SheetJS limitation)
    const rawTabName = `${accountId} - ${acc.name}`;
    const cleanTabName = rawTabName.length > 30 ? rawTabName.slice(0, 30) : rawTabName;

    const ledgerHeaders = [
      [`BUKU BESAR - ${acc.name.toUpperCase()} (${accountId})`],
      [`Kategori: ${acc.category} | Saldo Normal: ${acc.normalBalance}`],
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

    // Add a total summary row
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

    XLSX.utils.book_append_sheet(wb, wsLedger, cleanTabName);
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
    [`Hingga Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
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

  XLSX.utils.book_append_sheet(wb, wsNeracaSaldo, "Neraca Saldo");

  // 4. --- SHEET 4: LAPORAN LABA RUGI ---
  const labaRugiData = [
    ["LAPORAN LABA RUGI OPERASIONAL"],
    [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
    [`Hingga Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
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
    ["3. BEBAN OPERASIONAL"],
  ];

  // Fill in active operating expenses dynamically
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
    ["ESTIMASI PPh FINAL 0.5% (OMZET BRUTO)", "Undang-Undang PPh UMKM PP 23", "", "", stats.pph],
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

  XLSX.utils.book_append_sheet(wb, wsLabaRugi, "Laba Rugi");

  // 5. --- SHEET 5: NERACA (BALANCE SHEET) ---
  // Aset Lancar vs Liabilitas
  const asset1001 = trialBalance.find(t => t.accountId === 1001)?.debit || 0;
  const asset1002 = trialBalance.find(t => t.accountId === 1002)?.debit || 0;
  const asset1003 = trialBalance.find(t => t.accountId === 1003)?.debit || 0;
  const asset1004 = trialBalance.find(t => t.accountId === 1004)?.debit || 0;
  const asset固定 = trialBalance.find(t => t.accountId === 1005)?.debit || 0;

  const liab2001 = trialBalance.find(t => t.accountId === 2001)?.credit || 0;
  const liab2002 = stats.pph; // dynamic tax account from stats
  const liab2003 = trialBalance.find(t => t.accountId === 2003)?.credit || 0;

  const eq3001 = trialBalance.find(t => t.accountId === 3001)?.credit || 0;
  const eq3002 = trialBalance.find(t => t.accountId === 3002)?.debit || 0;

  const neracaData = [
    ["LAPORAN NERACA KEUANGAN (BALANCE SHEET)"],
    [`${dynamicName} (${dynamicCity}) - ${dynamicType}`],
    [`Posisi Per Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
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
    ["  - Peralatan Toko & Inventaris (1005)", asset固定, "", "  - Modal Disetor Pemilik (3001)", eq3001],
    ["", "", "", "  - Tarik Prive Pemilik (3002)", -eq3002],
    ["", "", "", "  - Laba Bersih Periode Berjalan", stats.netProfit],
    ["TOTAL ASET TETAP", asset固定, "", "TOTAL EKUITAS", stats.totalEquity],
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

  XLSX.utils.book_append_sheet(wb, wsNeraca, "Neraca");

  // 6. --- SHEET 6: STOK BARANG ---
  const stockHeaders = [
    ["LAPORAN INTEGRASI MANAJEMEN PERSSEDIAAN STOK & HPP"],
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

  XLSX.utils.book_append_sheet(wb, wsStock, "Stok Barang");

  // Write file
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Laporan_Pembukuan_UMKM_AkuntanAI_${dateStr}.xlsx`);
}
