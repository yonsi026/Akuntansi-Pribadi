import * as XLSX from "xlsx";
import { Transaction, TransactionType, StockItem } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";

export interface ParsedImportData {
  success: boolean;
  message: string;
  sourceSheet: string;
  transactions: Transaction[];
  stocks: StockItem[];
  duplicatesCount: number;
  newCount: number;
  monthYearBreakdown: { [key: string]: number }; // e.g. { "2026-09": 10, "2026-08": 5 }
  totalNewAmount: number;
}

/**
 * Normalizes any Excel date input (serial number, ISO string, Indonesian string, slash format)
 * into a standardized YYYY-MM-DD string.
 */
export function normalizeExcelDate(value: any): string {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  // 1. Handle Excel numeric serial dates (e.g. 45192)
  if (typeof value === "number") {
    // Excel base date is Dec 30 1899 due to 1900 leap year bug
    const dateObj = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  // 2. Handle JS Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(value).trim();

  // 3. Handle standard ISO "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 4. Handle "DD/MM/YYYY" or "DD-MM-YYYY" or "D/M/YYYY"
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 5. Handle "YYYY/MM/DD" or "YYYY.MM.DD"
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 6. Handle Indonesian written dates (e.g. "24 September 2026", "5 Jan 2026")
  const idMonths: { [key: string]: string } = {
    januari: "01", jan: "01",
    februari: "02", feb: "02",
    maret: "03", mar: "03",
    april: "04", apr: "04",
    mei: "05", may: "05",
    juni: "06", jun: "06",
    juli: "07", jul: "07",
    agustus: "08", ags: "08", agu: "08",
    september: "09", sep: "09",
    oktober: "10", okt: "10",
    november: "11", nov: "11",
    desember: "12", des: "12"
  };

  const indonesianMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (indonesianMatch) {
    const day = indonesianMatch[1].padStart(2, "0");
    const monthName = indonesianMatch[2].toLowerCase();
    const year = indonesianMatch[3];
    const month = idMonths[monthName];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // 7. Fallback parsing with standard Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Safe fallback to today
  return new Date().toISOString().split("T")[0];
}

/**
 * Creates a unique deterministic fingerprint for a transaction to prevent duplicate insertion
 * while protecting existing data from being overwritten.
 */
export function getTransactionFingerprint(tx: Partial<Transaction>): string {
  const date = tx.date || "";
  const desc = (tx.description || "").trim().toLowerCase();
  const amt = Math.round(Number(tx.amount || 0));
  const deb = tx.debitAccount || 0;
  const cred = tx.creditAccount || 0;
  return `${date}|${desc}|${amt}|${deb}|${cred}`;
}

/**
 * Parses numeric value safely from Excel cell (handling strings with Rp, dots, commas).
 */
export function parseNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/[^\d,\.\-]/g, "")
    .replace(/\.(?=\d{3}(,|$))/g, "") // remove thousand separators like in 100.000,00
    .replace(/,/g, "."); // change decimal comma to dot
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Deduce TransactionType from accounts and description
 */
function inferTransactionType(debit: number, credit: number, desc: string): TransactionType {
  const lower = desc.toLowerCase();
  if (debit === 1001 && credit === 4001) return "Penjualan";
  if (debit === 1003 && (credit === 1001 || credit === 2001)) return "Pembelian";
  if (debit === 6001 || lower.includes("gaji") || lower.includes("upah")) return "Gaji Karyawan";
  if (debit === 6002 || lower.includes("sewa")) return "Sewa Toko";
  if (debit === 6003 || lower.includes("listrik") || lower.includes("air") || lower.includes("pln") || lower.includes("pdam")) return "Listrik & Air";
  if (debit === 1005 || lower.includes("inventaris") || lower.includes("rak") || lower.includes("etalase")) return "Beli Inventaris";
  if (debit === 6004 || lower.includes("perlengkapan") || lower.includes("nota") || lower.includes("kresek")) return "Perlengkapan Toko";
  if (debit === 6005 || lower.includes("internet") || lower.includes("wifi") || lower.includes("pulsa")) return "Internet & Pulsa";
  if (debit === 6006 || lower.includes("servis") || lower.includes("perbaikan") || lower.includes("maintenance")) return "Servis & Perbaikan";
  if (debit === 1001 && credit === 3001) return "Setor Modal";
  if (debit === 3002 && credit === 1001) return "Tarik Prive";
  if (debit === 2001 && credit === 1001) return "Pembayaran Hutang";
  if (debit >= 6000 && debit <= 6999) return "Biaya Operasional";
  if (credit === 4001) return "Penjualan";
  if (debit === 1003) return "Pembelian";
  return "Lainnya";
}

/**
 * Main parser function: accepts an ArrayBuffer (from FileReader) and extracts
 * transactions and stocks, then cross-checks against existing transactions to avoid duplicates.
 */
export function parseExcelFile(
  buffer: ArrayBuffer,
  existingTransactions: Transaction[]
): ParsedImportData {
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        message: "File Excel kosong atau tidak memiliki worksheet yang valid.",
        sourceSheet: "",
        transactions: [],
        stocks: [],
        duplicatesCount: 0,
        newCount: 0,
        monthYearBreakdown: {},
        totalNewAmount: 0
      };
    }

    const existingFingerprints = new Set(existingTransactions.map(getTransactionFingerprint));
    const existingIds = new Set(existingTransactions.map(t => t.id));

    let extractedTransactions: Transaction[] = [];
    let extractedStocks: StockItem[] = [];
    let chosenSheetName = "";

    // 1. PRIORITY A: Sheet "Daftar Transaksi" or "Transaksi"
    const txSheetName = wb.SheetNames.find(name => 
      /^(daftar\s*transaksi|transaksi|transactions|riwayat\s*transaksi)$/i.test(name.trim())
    );

    // 2. PRIORITY B: Sheet "Jurnal Umum"
    const journalSheetName = wb.SheetNames.find(name => 
      /^(jurnal\s*umum|jurnal|general\s*journal)$/i.test(name.trim())
    );

    // 3. PRIORITY C: Sheet "Stok Barang"
    const stockSheetName = wb.SheetNames.find(name => 
      /^(stok\s*barang|stok|persediaan|inventory)$/i.test(name.trim())
    );

    // Parse Stock sheet if available
    if (stockSheetName) {
      const stockSheet = wb.Sheets[stockSheetName];
      const stockRows: any[][] = XLSX.utils.sheet_to_json(stockSheet, { header: 1 });
      
      // Find header row for stock
      let stockHeaderIdx = -1;
      for (let i = 0; i < Math.min(stockRows.length, 10); i++) {
        const rowStr = (stockRows[i] || []).join(" ").toLowerCase();
        if (rowStr.includes("sku") || rowStr.includes("nama persediaan") || rowStr.includes("stok")) {
          stockHeaderIdx = i;
          break;
        }
      }

      if (stockHeaderIdx !== -1) {
        const headers = stockRows[stockHeaderIdx].map(h => String(h || "").trim().toLowerCase());
        const skuCol = headers.findIndex(h => h.includes("sku"));
        const nameCol = headers.findIndex(h => h.includes("nama"));
        const unitCol = headers.findIndex(h => h.includes("satuan") || h.includes("unit"));
        const stockCol = headers.findIndex(h => h.includes("stok"));
        const avgBuyCol = headers.findIndex(h => h.includes("beli") || h.includes("hpp"));
        const sellCol = headers.findIndex(h => h.includes("jual"));

        for (let r = stockHeaderIdx + 1; r < stockRows.length; r++) {
          const row = stockRows[r];
          if (!row || row.length === 0) continue;
          const firstVal = String(row[0] || "").trim().toUpperCase();
          if (firstVal === "TOTAL" || firstVal === "") continue;

          const name = String(row[nameCol !== -1 ? nameCol : 1] || "").trim();
          if (!name) continue;

          const sku = String(row[skuCol !== -1 ? skuCol : 0] || `SKU-${r}`).trim();
          const unit = String(row[unitCol !== -1 ? unitCol : 2] || "Pcs").trim();
          const stock = parseNumber(row[stockCol !== -1 ? stockCol : 3]);
          const avgPrice = parseNumber(row[avgBuyCol !== -1 ? avgBuyCol : 4]);
          const sellPrice = parseNumber(row[sellCol !== -1 ? sellCol : 5]);

          extractedStocks.push({
            id: `stk-imp-${Date.now()}-${r}`,
            name,
            sku,
            unit: unit || "Pcs",
            stock: stock || 0,
            avgPurchasePrice: avgPrice || 0,
            sellPrice: sellPrice || avgPrice,
            purchaseHistory: stock > 0 ? [{
              date: new Date().toISOString().split("T")[0],
              quantity: stock,
              pricePerUnit: avgPrice
            }] : []
          });
        }
      }
    }

    // Now extract transactions:
    if (txSheetName) {
      // Parse from "Daftar Transaksi"
      chosenSheetName = txSheetName;
      const sheet = wb.Sheets[txSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = (rows[i] || []).join(" ").toLowerCase();
        if (rowStr.includes("tanggal") && (rowStr.includes("keterangan") || rowStr.includes("jumlah") || rowStr.includes("akun"))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx !== -1) {
        const headers = rows[headerIdx].map(h => String(h || "").trim().toLowerCase());
        const colId = headers.findIndex(h => h.includes("id transaksi") || h === "id");
        const colDate = headers.findIndex(h => h.includes("tanggal") || h.includes("date"));
        const colInvoice = headers.findIndex(h => h.includes("invoice") || h.includes("bukti") || h.includes("ref"));
        const colType = headers.findIndex(h => h.includes("jenis") || h.includes("tipe") || h.includes("type"));
        const colDesc = headers.findIndex(h => h.includes("keterangan") || h.includes("deskripsi") || h.includes("description"));
        const colAmount = headers.findIndex(h => h.includes("jumlah") || h.includes("total") || h.includes("amount"));
        const colDebitAcc = headers.findIndex(h => h.includes("akun debit") || h.includes("kode debit"));
        const colCreditAcc = headers.findIndex(h => h.includes("akun kredit") || h.includes("kode kredit"));
        const colPpn = headers.findIndex(h => h.includes("ppn aktif") || h === "ppn");
        const colPpnAmt = headers.findIndex(h => h.includes("nilai ppn") || h.includes("ppn (rp)"));
        const colStockId = headers.findIndex(h => h.includes("id stok") || h.includes("item stok"));
        const colStockQty = headers.findIndex(h => h.includes("kuantitas") || h.includes("qty"));
        const colStockPrice = headers.findIndex(h => h.includes("harga satuan"));
        const colHpp = headers.findIndex(h => h.includes("hpp"));

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          
          const rawDate = row[colDate !== -1 ? colDate : 1];
          const rawDesc = row[colDesc !== -1 ? colDesc : 4];
          const rawAmount = row[colAmount !== -1 ? colAmount : 5];

          if (!rawDate && !rawDesc && !rawAmount) continue;
          const desc = String(rawDesc || "").trim();
          if (desc.toLowerCase().startsWith("total")) continue;

          const date = normalizeExcelDate(rawDate);
          const amount = parseNumber(rawAmount);
          if (amount <= 0 && !desc) continue;

          const rawId = colId !== -1 && row[colId] ? String(row[colId]).trim() : `tx-imp-${Date.now()}-${r}`;
          const invoice = colInvoice !== -1 && row[colInvoice] ? String(row[colInvoice]).trim() : undefined;
          const rawType = colType !== -1 && row[colType] ? String(row[colType]).trim() : "";
          const debitAccount = colDebitAcc !== -1 && row[colDebitAcc] ? parseNumber(row[colDebitAcc]) : 1001;
          const creditAccount = colCreditAcc !== -1 && row[colCreditAcc] ? parseNumber(row[colCreditAcc]) : 4001;
          const ppnEnabled = colPpn !== -1 ? Boolean(row[colPpn] === true || String(row[colPpn]).toLowerCase() === "true" || String(row[colPpn]).toLowerCase() === "ya") : false;
          const ppnAmount = colPpnAmt !== -1 ? parseNumber(row[colPpnAmt]) : 0;
          const stockItemId = colStockId !== -1 && row[colStockId] ? String(row[colStockId]).trim() : undefined;
          const stockQuantity = colStockQty !== -1 ? parseNumber(row[colStockQty]) : undefined;
          const stockPricePerUnit = colStockPrice !== -1 ? parseNumber(row[colStockPrice]) : undefined;
          const hppAmountPosted = colHpp !== -1 ? parseNumber(row[colHpp]) : undefined;

          const type = (rawType as TransactionType) || inferTransactionType(debitAccount, creditAccount, desc);

          extractedTransactions.push({
            id: rawId,
            date,
            description: desc || "Transaksi Impor",
            amount,
            type,
            invoiceNumber: invoice,
            debitAccount: debitAccount || 1001,
            creditAccount: creditAccount || 4001,
            ppnEnabled,
            ppnAmount,
            stockItemId,
            stockQuantity,
            stockPricePerUnit,
            hppAmountPosted
          });
        }
      }
    } else if (journalSheetName) {
      // Parse from "Jurnal Umum"
      chosenSheetName = journalSheetName;
      const sheet = wb.Sheets[journalSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Find Jurnal header: ["Tanggal", "No. Bukti / Ref", "Kode Akun", "Nama Akun", "Debit (Rp)", "Kredit (Rp)", "Keterangan"]
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = (rows[i] || []).join(" ").toLowerCase();
        if (rowStr.includes("tanggal") && (rowStr.includes("kode akun") || rowStr.includes("debit"))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx !== -1) {
        const headers = rows[headerIdx].map(h => String(h || "").trim().toLowerCase());
        const colDate = headers.findIndex(h => h.includes("tanggal"));
        const colRef = headers.findIndex(h => h.includes("ref") || h.includes("bukti"));
        const colAccId = headers.findIndex(h => h.includes("kode akun") || h.includes("akun"));
        const colDebit = headers.findIndex(h => h.includes("debit"));
        const colCredit = headers.findIndex(h => h.includes("kredit"));
        const colDesc = headers.findIndex(h => h.includes("keterangan") || h.includes("deskripsi"));

        // Group rows by ref or (date + desc)
        interface JournalRowItem {
          date: string;
          ref: string;
          accountId: number;
          debit: number;
          credit: number;
          desc: string;
        }

        const journalRows: JournalRowItem[] = [];
        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const rawDate = row[colDate !== -1 ? colDate : 0];
          const rawRef = String(row[colRef !== -1 ? colRef : 1] || "").trim();
          const accId = parseNumber(row[colAccId !== -1 ? colAccId : 2]);
          const debit = parseNumber(row[colDebit !== -1 ? colDebit : 4]);
          const credit = parseNumber(row[colCredit !== -1 ? colCredit : 5]);
          const desc = String(row[colDesc !== -1 ? colDesc : 6] || "").trim();

          if (!rawDate && !desc && debit === 0 && credit === 0) continue;
          if (desc.toLowerCase().startsWith("total") || String(rawDate).toLowerCase().startsWith("total")) continue;

          journalRows.push({
            date: normalizeExcelDate(rawDate),
            ref: rawRef,
            accountId: accId,
            debit,
            credit,
            desc
          });
        }

        // Group journal entries into cohesive transactions
        const groups: { [groupKey: string]: JournalRowItem[] } = {};
        journalRows.forEach((jr, idx) => {
          // If ref is like "HPP-001", it matches "TXN-001" or same date+desc
          const key = jr.ref ? jr.ref.replace(/^HPP-/, "TXN-") : `${jr.date}|${jr.desc}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(jr);
        });

        let txnCounter = 1;
        Object.entries(groups).forEach(([key, items]) => {
          // Separate HPP entries (5001 & 1003) from main entries
          const mainItems = items.filter(it => it.accountId !== 5001 && !(it.accountId === 1003 && it.credit > 0 && items.some(x => x.accountId === 5001)));
          const hppItems = items.filter(it => it.accountId === 5001);

          const targetItems = mainItems.length > 0 ? mainItems : items;
          const debitRows = targetItems.filter(it => it.debit > 0);
          const creditRows = targetItems.filter(it => it.credit > 0);

          const date = targetItems[0]?.date || new Date().toISOString().split("T")[0];
          const desc = targetItems.find(it => it.desc)?.desc || "Transaksi Impor Jurnal";
          const ref = targetItems.find(it => it.ref)?.ref || `REF-${txnCounter}`;
          
          const totalDebit = debitRows.reduce((sum, r) => sum + r.debit, 0);
          const totalCredit = creditRows.reduce((sum, r) => sum + r.credit, 0);
          const amount = Math.max(totalDebit, totalCredit);

          const debAcc = debitRows[0]?.accountId || 1001;
          const credAcc = creditRows[0]?.accountId || 4001;
          const hppAmt = hppItems.reduce((sum, r) => sum + r.debit, 0);

          extractedTransactions.push({
            id: `tx-jrn-${Date.now()}-${txnCounter++}`,
            date,
            description: desc,
            amount,
            type: inferTransactionType(debAcc, credAcc, desc),
            invoiceNumber: ref,
            debitAccount: debAcc,
            creditAccount: credAcc,
            ppnEnabled: false,
            ppnAmount: 0,
            hppAmountPosted: hppAmt > 0 ? hppAmt : undefined
          });
        });
      }
    } else {
      // Fallback: take the first sheet and look for basic tabular data
      chosenSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[chosenSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = (rows[i] || []).join(" ").toLowerCase();
        if (rowStr.includes("tanggal") || rowStr.includes("date") || rowStr.includes("keterangan")) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx !== -1) {
        const headers = rows[headerIdx].map(h => String(h || "").trim().toLowerCase());
        const colDate = headers.findIndex(h => h.includes("tanggal") || h.includes("date"));
        const colDesc = headers.findIndex(h => h.includes("keterangan") || h.includes("deskripsi") || h.includes("uraian"));
        const colAmount = headers.findIndex(h => h.includes("jumlah") || h.includes("total") || h.includes("nominal") || h.includes("debit"));

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const rawDate = row[colDate !== -1 ? colDate : 0];
          const rawDesc = row[colDesc !== -1 ? colDesc : 1];
          const rawAmount = row[colAmount !== -1 ? colAmount : 2];

          if (!rawDate && !rawDesc && !rawAmount) continue;
          const desc = String(rawDesc || "").trim();
          if (desc.toLowerCase().startsWith("total")) continue;

          const date = normalizeExcelDate(rawDate);
          const amount = parseNumber(rawAmount);
          if (amount <= 0) continue;

          extractedTransactions.push({
            id: `tx-raw-${Date.now()}-${r}`,
            date,
            description: desc || "Transaksi Excel",
            amount,
            type: inferTransactionType(1001, 4001, desc),
            debitAccount: 1001,
            creditAccount: 4001,
            ppnEnabled: false,
            ppnAmount: 0
          });
        }
      }
    }

    // Sort chronologically by date (Year -> Month -> Day)
    extractedTransactions.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate duplicates vs new transactions based on fingerprint & ID
    let duplicatesCount = 0;
    let newCount = 0;
    let totalNewAmount = 0;
    const monthYearBreakdown: { [key: string]: number } = {};

    extractedTransactions.forEach(tx => {
      const fp = getTransactionFingerprint(tx);
      const isDup = existingFingerprints.has(fp) || existingIds.has(tx.id);
      
      if (isDup) {
        duplicatesCount++;
      } else {
        newCount++;
        totalNewAmount += tx.amount;
        
        // Month key "YYYY-MM"
        const monthKey = tx.date.slice(0, 7);
        monthYearBreakdown[monthKey] = (monthYearBreakdown[monthKey] || 0) + 1;
      }
    });

    return {
      success: extractedTransactions.length > 0,
      message: extractedTransactions.length > 0
        ? `Berhasil membaca ${extractedTransactions.length} transaksi dari sheet "${chosenSheetName}".`
        : "Tidak ditemukan baris transaksi yang valid dalam file Excel tersebut.",
      sourceSheet: chosenSheetName,
      transactions: extractedTransactions,
      stocks: extractedStocks,
      duplicatesCount,
      newCount,
      monthYearBreakdown,
      totalNewAmount
    };

  } catch (err: any) {
    console.error("Error parsing Excel:", err);
    return {
      success: false,
      message: `Gagal membaca file Excel: ${err?.message || "Format tidak valid"}`,
      sourceSheet: "",
      transactions: [],
      stocks: [],
      duplicatesCount: 0,
      newCount: 0,
      monthYearBreakdown: {},
      totalNewAmount: 0
    };
  }
}

/**
 * Merges imported transactions into existing transactions without overwriting existing data.
 * Filters out duplicates cleanly based on fingerprint and date.
 */
export function mergeTransactionsWithoutOverwrite(
  existing: Transaction[],
  incoming: Transaction[],
  skipDuplicates: boolean = true
): {
  merged: Transaction[];
  addedCount: number;
  skippedCount: number;
} {
  const existingFingerprints = new Set(existing.map(getTransactionFingerprint));
  const existingIds = new Set(existing.map(t => t.id));

  const toAdd: Transaction[] = [];
  let skippedCount = 0;

  incoming.forEach((item, index) => {
    const fp = getTransactionFingerprint(item);
    const isDup = existingFingerprints.has(fp) || existingIds.has(item.id);

    if (isDup && skipDuplicates) {
      skippedCount++;
      return;
    }

    // Ensure pristine unique ID to avoid DOM key conflicts
    const uniqueTx: Transaction = {
      ...item,
      id: existingIds.has(item.id) || !item.id ? `tx-imp-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}` : item.id
    };

    toAdd.push(uniqueTx);
    existingFingerprints.add(fp);
    existingIds.add(uniqueTx.id);
  });

  // Combine and sort chronologically by date (YYYY-MM-DD)
  const merged = [...existing, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));

  return {
    merged,
    addedCount: toAdd.length,
    skippedCount
  };
}

/**
 * Merges stock items without overwriting existing catalog items
 */
export function mergeStockItemsSafely(
  existing: StockItem[],
  incoming: StockItem[]
): StockItem[] {
  const existingNames = new Set(existing.map(s => s.name.trim().toLowerCase()));
  const existingSkus = new Set(existing.map(s => s.sku.trim().toLowerCase()));

  const newStocks = incoming.filter(item => {
    const nameMatch = existingNames.has(item.name.trim().toLowerCase());
    const skuMatch = item.sku && existingSkus.has(item.sku.trim().toLowerCase());
    return !nameMatch && !skuMatch;
  });

  return [...existing, ...newStocks];
}
