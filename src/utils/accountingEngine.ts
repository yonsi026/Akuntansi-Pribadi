import { 
  Transaction, 
  StockItem, 
  JournalEntry, 
  LedgerItem, 
  FinancialStats,
  Account 
} from "../types";
import { CHART_OF_ACCOUNTS, getAccountName } from "../data/chartOfAccounts";

// Standard formatting function for Indonesian Rupiah
export const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Generates double-entry Journal Entries for a list of transactions.
 * Every transaction creates at least two journal entries (Debit & Credit).
 * Stock sales create four entries (2 for the sale revenue, 2 for the HPP cost matching).
 */
export function generateJournal(transactions: Transaction[]): JournalEntry[] {
  const journal: JournalEntry[] = [];

  transactions.forEach((tx) => {
    // Determine details
    const txId = tx.id;
    const date = tx.date;
    const desc = tx.description;
    const totalAmount = tx.amount;
    const ref = tx.invoiceNumber || `JV-${txId.slice(0, 4).toUpperCase()}`;

    // Direct entry calculations
    let baseAmount = totalAmount;
    let taxAmount = 0;

    if (tx.ppnEnabled) {
      // PPN is 11% (default indonesian VAT) included in the price
      baseAmount = totalAmount / 1.11;
      taxAmount = totalAmount - baseAmount;
    }

    // Resolve Debit & Credit Acc IDs
    const debId = tx.debitAccount || 1001;
    const credId = tx.creditAccount || 4001;

    // Resolve Names
    const debName = tx.customDebitAccountName || getAccountName(debId);
    const credName = tx.customCreditAccountName || getAccountName(credId);

    // Apply PPN adjustments logically
    const isSale = tx.type === "Penjualan" || tx.type === "Penjualan Stok" || tx.type === "Penerimaan";
    const isPurchaseExpense = 
      tx.type === "Pembelian" || 
      tx.type === "Pembelian Stok" || 
      tx.type === "Biaya Operasional" || 
      tx.type === "Pengeluaran" ||
      tx.type === "Gaji Karyawan" ||
      tx.type === "Listrik & Air" ||
      tx.type === "Sewa Toko" ||
      tx.type === "Beli Inventaris" ||
      tx.type === "Internet & Pulsa" ||
      tx.type === "Perlengkapan Toko" ||
      tx.type === "Servis & Perbaikan";

    if (tx.ppnEnabled) {
      if (isSale) {
        // Debit: Main Debit Account with FULL AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: debId,
          accountName: debName,
          debit: totalAmount,
          credit: 0,
          ref
        });
        // Credit: Main Credit Account with BASE AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: credId,
          accountName: credName,
          debit: 0,
          credit: baseAmount,
          ref
        });
        // Credit: PPN Keluaran (2003) with TAX AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: 2003,
          accountName: getAccountName(2003),
          debit: 0,
          credit: taxAmount,
          ref
        });
      } else if (isPurchaseExpense) {
        // Debit: Main Debit Account with BASE AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: debId,
          accountName: debName,
          debit: baseAmount,
          credit: 0,
          ref
        });
        // Debit: PPN Masukan (1004) with TAX AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: 1004,
          accountName: getAccountName(1004),
          debit: taxAmount,
          credit: 0,
          ref
        });
        // Credit: Main Credit Account with FULL AMOUNT
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: credId,
          accountName: credName,
          debit: 0,
          credit: totalAmount,
          ref
        });
      } else {
        // Fallback standard dual entries
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: debId,
          accountName: debName,
          debit: totalAmount,
          credit: 0,
          ref
        });
        journal.push({
          id: txId,
          date,
          description: desc,
          accountId: credId,
          accountName: credName,
          debit: 0,
          credit: totalAmount,
          ref
        });
      }
    } else {
      // Standard dual entry without PPN (or if PPN is disabled)
      journal.push({
        id: txId,
        date,
        description: desc,
        accountId: debId,
        accountName: debName,
        debit: totalAmount,
        credit: 0,
        ref
      });
      journal.push({
        id: txId,
        date,
        description: desc,
        accountId: credId,
        accountName: credName,
        debit: 0,
        credit: totalAmount,
        ref
      });
    }

    // Secondary entry for COGS/HPP matching on sales of Stock (if provided)
    const hpp = tx.hppAmountPosted || 0;
    if ((tx.type === "Penjualan" || tx.type === "Penjualan Stok") && hpp > 0) {
      journal.push({
        id: `${txId}-HPP`,
        date,
        description: `Penyesuaian HPP - ${desc}`,
        accountId: 5001,
        accountName: getAccountName(5001),
        debit: hpp,
        credit: 0,
        ref: `COGS-${txId.slice(0, 4).toUpperCase()}`
      });
      journal.push({
        id: `${txId}-HPP`,
        date,
        description: `Penyesuaian HPP - ${desc}`,
        accountId: 1003,
        accountName: getAccountName(1003),
        debit: 0,
        credit: hpp,
        ref: `COGS-${txId.slice(0, 4).toUpperCase()}`
      });
    }
  });

  // Sort by date then by Debit first
  return journal.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return b.debit - a.debit; // push debits above credits for standard presentation
  });
}

/**
 * Computes general ledger (Buku Besar) for a specific account.
 */
export function computeLedger(accountId: number, journal: JournalEntry[], normalBalance: 'Debit' | 'Kredit'): LedgerItem[] {
  let runningBalance = 0;
  const ledger: LedgerItem[] = [];

  // Filter journal entries for this account
  const entries = journal.filter((j) => j.accountId === accountId);

  entries.forEach((entry) => {
    if (normalBalance === 'Debit') {
      runningBalance += (entry.debit - entry.credit);
    } else {
      runningBalance += (entry.credit - entry.debit);
    }

    ledger.push({
      date: entry.date,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      balance: runningBalance,
      ref: entry.ref
    });
  });

  return ledger;
}

/**
 * Computes current Trial Balance (Neraca Saldo).
 */
export function computeTrialBalance(journal: JournalEntry[]): Array<{
  accountId: number;
  accountName: string;
  category: string;
  debit: number;
  credit: number;
}> {
  const accountBalances: { [key: number]: number } = {};

  // Initialize all accounts with 0
  CHART_OF_ACCOUNTS.forEach((acc) => {
    accountBalances[acc.id] = 0;
  });

  // Accumulate debit minus credit for Debits, and credit minus debit for Credits
  journal.forEach((entry) => {
    const acc = CHART_OF_ACCOUNTS.find(a => a.id === entry.accountId);
    if (!acc) return;
    
    if (acc.normalBalance === 'Debit') {
      accountBalances[acc.id] = (accountBalances[acc.id] || 0) + (entry.debit - entry.credit);
    } else {
      accountBalances[acc.id] = (accountBalances[acc.id] || 0) + (entry.credit - entry.debit);
    }
  });

  // Turn into Trial balance presentation list with either Debit or Credit balance
  return CHART_OF_ACCOUNTS.map((acc) => {
    const balance = accountBalances[acc.id] || 0;
    return {
      accountId: acc.id,
      accountName: acc.name,
      category: acc.category,
      debit: acc.normalBalance === 'Debit' ? Math.max(0, balance) : Math.max(0, -balance),
      credit: acc.normalBalance === 'Kredit' ? Math.max(0, balance) : Math.max(0, -balance)
    };
  }).filter((item) => item.debit > 0 || item.credit > 0); // only show accounts with active balances
}

/**
 * Computes all Financial Statements and stats.
 */
export function computeFinancialStats(transactions: Transaction[], journal: JournalEntry[]): FinancialStats {
  const trialBalance = computeTrialBalance(journal);

  // 1. REVENUE (Pendapatan)
  const revenueItem = trialBalance.find(t => t.accountId === 4401 || t.accountId === 4001); // 4001 Pendapatan Penjualan
  const revenue = revenueItem ? (revenueItem.credit - revenueItem.debit) : 0;

  // 2. HPP (Harga Pokok Penjualan)
  const hppItem = trialBalance.find(t => t.accountId === 5001);
  const hpp = hppItem ? (hppItem.debit - hppItem.credit) : 0;

  // 3. GROSS PROFIT (Laba Kotor)
  // SAK EMKM: Laba Kotor = Penjualan - HPP
  const grossProfit = revenue - hpp;

  // 4. OPERATING EXPENSES (Beban Operasional 6001 - 6005)
  let expenses = 0;
  trialBalance.forEach((t) => {
    if (t.accountId >= 6000 && t.accountId <= 6999) {
      expenses += (t.debit - t.credit);
    }
  });

  // 5. NET PROFIT (Laba Bersih)
  const netProfit = grossProfit - expenses;

  // 5a. Tax PPh Final UMKM (0.5% of Revenue/Gross turnover)
  const pph = Math.max(0, revenue * 0.005);

  // 6. ASSETS, LIABILITIES, EQUITY for Balance Sheet (Neraca)
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquityRaw = 0;

  trialBalance.forEach((t) => {
    if (t.category === 'Aset') {
      totalAssets += (t.debit - t.credit);
    } else if (t.category === 'Liabilitas') {
      totalLiabilities += (t.credit - t.debit);
    } else if (t.category === 'Ekuitas') {
      // SAK EMKM: Modal + Saldo Laba - Prive
      if (t.accountId === 3002) { // Prive - normally debit
        totalEquityRaw -= (t.debit - t.credit);
      } else { // 3001 Modal or 3003 Saldo Laba
        totalEquityRaw += (t.credit - t.debit);
      }
    }
  });

  // SAK EMKM: Retained earnings dynamically includes the current Net Profit in the Balance Sheet
  const totalEquity = totalEquityRaw + netProfit;

  return {
    revenue,
    expenses,
    hpp,
    grossProfit,
    netProfit,
    pph,
    totalAssets,
    totalLiabilities,
    totalEquity
  };
}

/**
 * Recalculates all averages in Stock Items based on active transaction history.
 * Generates exact Average Units costs (Moving Average method).
 * Modifies stockItems and returns the list.
 */
export function recalculateInventoryAverage(transactions: Transaction[], rawItems: StockItem[]): StockItem[] {
  // Deep clone items
  const items: StockItem[] = rawItems.map(item => ({
    ...item,
    stock: 0,
    avgPurchasePrice: 0,
    purchaseHistory: []
  }));

  // Sort transactions by date so we process them chronologically
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  sortedTx.forEach((tx) => {
    if (!tx.stockItemId) return;
    const item = items.find(i => i.id === tx.stockItemId);
    if (!item) return;

    const qty = tx.stockQuantity || 0;
    const price = tx.stockPricePerUnit || 0;

    if (tx.type === 'Pembelian Stok' || tx.type === 'Pembelian') {
      const prevStock = item.stock;
      const prevAvgPrice = item.avgPurchasePrice;

      const newStock = prevStock + qty;
      let newAvgPrice = 0;

      if (newStock > 0) {
        newAvgPrice = ((prevStock * prevAvgPrice) + (qty * price)) / newStock;
      }

      item.stock = newStock;
      item.avgPurchasePrice = Math.round(newAvgPrice);
      item.purchaseHistory.push({
        date: tx.date,
        quantity: qty,
        pricePerUnit: price
      });
    } 
    else if (tx.type === 'Penjualan Stok' || tx.type === 'Penjualan') {
      // Sale decreases units, but average unit cost remains the same!
      item.stock = Math.max(0, item.stock - qty);
      // We do not change avgPurchasePrice on sales
    }
  });

  return items;
}

/**
 * Generates an Excel-compatible CSV string with complete financial sheets.
 * Includes General Ledger, Income Statement (Laba Rugi), Balance Sheet (Neraca), and Stocks.
 * Generates with a beautiful UTF-8 BOM so it opens instantly inside Excel with proper columns.
 */
export function generateExcelData(
  transactions: Transaction[],
  stockItems: StockItem[],
  journal: JournalEntry[],
  stats: FinancialStats
): string {
  let csv = "\uFEFF"; // UTF-8 BOM

  // --- SHEET 1: RINGKASAN & STATISTIK ---
  csv += "=== LAPORAN RINGKASAN KEUANGAN UMKM (SAK EMKM) ===\r\n";
  csv += `Tanggal Ekspor,${new Date().toLocaleDateString('id-ID')}\r\n`;
  csv += `Mata Uang,IDR\r\n\r\n`;

  csv += "Metrik Keuangan,Jumlah (Rupiah)\r\n";
  csv += `Total Pendapatan Pajak (Omzet),Rp ${stats.revenue.toLocaleString('id-ID')}\r\n`;
  csv += `Harga Pokok Penjualan (HPP),Rp ${stats.hpp.toLocaleString('id-ID')}\r\n`;
  csv += `Laba Kotor,Rp ${stats.grossProfit.toLocaleString('id-ID')}\r\n`;
  csv += `Total Beban Operasional,Rp ${stats.expenses.toLocaleString('id-ID')}\r\n`;
  csv += `Laba Bersih Bersih,Rp ${stats.netProfit.toLocaleString('id-ID')}\r\n`;
  csv += `Pajak PPh Final UMKM (0.5%),Rp ${stats.pph.toLocaleString('id-ID')}\r\n`;
  csv += `Total Aset,Rp ${stats.totalAssets.toLocaleString('id-ID')}\r\n`;
  csv += `Total Liabilitas,Rp ${stats.totalLiabilities.toLocaleString('id-ID')}\r\n`;
  csv += `Total Ekuitas,Rp ${stats.totalEquity.toLocaleString('id-ID')}\r\n\r\n`;

  // --- SHEET 2: LAPORAN LABA RUGI ---
  csv += "=== LAPORAN LABA RUGI ===\r\n";
  csv += "Akun,Debit,Kredit,Subtotal\r\n";
  csv += `Pendapatan Penjualan,,Rp ${stats.revenue.toLocaleString('id-ID')},Rp ${stats.revenue.toLocaleString('id-ID')}\r\n`;
  csv += `Harga Pokok Penjualan (HPP),Rp ${stats.hpp.toLocaleString('id-ID')},,-Rp ${stats.hpp.toLocaleString('id-ID')}\r\n`;
  csv += `LABA KOTOR,,,Rp ${stats.grossProfit.toLocaleString('id-ID')}\r\n`;
  
  // Expenses breakdown
  csv += "Beban Operasional:\r\n";
  const trialBalance = computeTrialBalance(journal);
  trialBalance.forEach((t) => {
    if (t.accountId >= 6000 && t.accountId <= 6999) {
      csv += `  - ${t.accountName},Rp ${t.debit.toLocaleString('id-ID')},,,Rp ${(-t.debit).toLocaleString('id-ID')}\r\n`;
    }
  });
  csv += `TOTAL BEBAN,,Rp ${stats.expenses.toLocaleString('id-ID')},,-Rp ${stats.expenses.toLocaleString('id-ID')}\r\n`;
  csv += `LABA BERSIH SEBELUM PAJAK,,,Rp ${stats.netProfit.toLocaleString('id-ID')}\r\n`;
  csv += `Estimasi PPh Pasal 4(2) Final 0.5% (UMKM),,,Rp ${stats.pph.toLocaleString('id-ID')}\r\n\r\n`;

  // --- SHEET 3: NERACA ---
  csv += "=== LAPORAN NERACA ===\r\n";
  csv += "SISI AKTIVA (ASET),Nilai,,SISI PASIVA (KEWAJIBAN & MODAL),Nilai\r\n";
  
  const assetsList = trialBalance.filter(t => t.category === "Aset");
  const liabilitiesList = trialBalance.filter(t => t.category === "Liabilitas");
  const equityList = trialBalance.filter(t => t.category === "Ekuitas");

  const maxLength = Math.max(assetsList.length, liabilitiesList.length + equityList.length + 2);

  for (let i = 0; i < maxLength; i++) {
    let assetPart = ",";
    let pasivaPart = ",";

    // Asset side
    if (i < assetsList.length) {
      const a = assetsList[i];
      const balance = a.debit - a.credit;
      assetPart = `${a.accountName},Rp ${balance.toLocaleString('id-ID')}`;
    } else if (i === assetsList.length) {
      assetPart = `TOTAL ASET,Rp ${stats.totalAssets.toLocaleString('id-ID')}`;
    }

    // Liabilities & Equity side
    if (i < liabilitiesList.length) {
      const l = liabilitiesList[i];
      const balance = l.credit - l.debit;
      pasivaPart = `${l.accountName},Rp ${balance.toLocaleString('id-ID')}`;
    } else {
      const eqIndex = i - liabilitiesList.length;
      if (eqIndex < equityList.length) {
        const e = equityList[eqIndex];
        const balance = e.accountId === 3002 ? -(e.debit - e.credit) : (e.credit - e.debit);
        pasivaPart = `${e.accountName},Rp ${balance.toLocaleString('id-ID')}`;
      } else if (eqIndex === equityList.length) {
        pasivaPart = `Laba Bersih Berjalan,Rp ${stats.netProfit.toLocaleString('id-ID')}`;
      } else if (eqIndex === equityList.length + 1) {
        pasivaPart = `TOTAL LIABILITAS & EKUITAS,Rp ${stats.totalEquity.toLocaleString('id-ID')}`;
      }
    }

    csv += `${assetPart},,${pasivaPart}\r\n`;
  }
  csv += "\r\n";

  // --- SHEET 4: JURNAL UMUM ---
  csv += "=== DATA JURNAL UMUM (DOUBLE-ENTRY) ===\r\n";
  csv += "Tanggal,Ref,Uraian,Akun,Debit (Rp),Kredit (Rp)\r\n";
  journal.forEach((j) => {
    csv += `"${j.date}","${j.ref}","${j.description}",${j.accountId} - ${j.accountName},${j.debit},${j.credit}\r\n`;
  });
  csv += "\r\n";

  // --- SHEET 5: DAFTAR STOK BARANG ---
  csv += "=== MANAJEMEN STOK & HPP INDONESIA ===\r\n";
  csv += "SKU,Nama Produk,Unit,Stok Aktif,Harga Beli Rata-Rata (HPP),Harga Jual Pasar,Total Nilai Aset Stok (Rp)\r\n";
  stockItems.forEach((s) => {
    csv += `"${s.sku}","${s.name}","${s.unit}",${s.stock},${s.avgPurchasePrice},${s.sellPrice},${s.stock * s.avgPurchasePrice}\r\n`;
  });

  return csv;
}

/**
 * Downloads a string as a CSV file in browser environment.
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
