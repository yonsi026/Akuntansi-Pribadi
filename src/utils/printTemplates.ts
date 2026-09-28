import { Invoice, StoreConfig, JournalEntry, Transaction } from "../types";
import { formatIDR } from "../components/FinanceDashboard";

/**
 * Standard CSS reset and print styling for all official documents
 */
const BASE_PRINT_CSS = `
  @page {
    size: A4 portrait;
    margin: 10mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.4;
    color: #0f172a;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }
  .font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .border-b-double {
    border-bottom: 3px double #0f172a;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  thead {
    display: table-header-group;
  }
  th {
    background-color: #f8fafc;
    color: #1e293b;
    font-weight: 700;
    text-align: left;
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    font-size: 9.5pt;
  }
  td {
    border: 1px solid #e2e8f0;
    padding: 6px 8px;
    font-size: 9.5pt;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: bold; }
  .font-black { font-weight: 900; }
  .text-emerald { color: #059669; }
  .text-rose { color: #e11d48; }
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 8.5pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .badge-paid { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-unpaid { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
  .badge-partial { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
`;

/**
 * Generates printable HTML for an official Sales Invoice (Faktur Penjualan)
 */
export function generateInvoicePrintHtml(invoice: Invoice, storeConfig: StoreConfig): string {
  const isPaid = invoice.status === "paid";
  const badgeClass = isPaid ? "badge-paid" : invoice.status === "partial" ? "badge-partial" : "badge-unpaid";
  const badgeText = isPaid ? "LUNAS" : invoice.status === "partial" ? "SEBAGIAN" : "BELUM LUNAS";

  const rowsHtml = invoice.items.map((it, idx) => `
    <tr>
      <td class="text-center font-mono" style="width: 32px;">${idx + 1}</td>
      <td>
        <span class="font-bold">${it.productName}</span>
        ${it.productCode ? `<span class="font-mono text-slate-500" style="font-size: 8.5pt; margin-left: 4px;">(${it.productCode})</span>` : ""}
        ${it.description ? `<div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">${it.description}</div>` : ""}
      </td>
      <td class="text-center font-bold font-mono">${it.quantity} ${it.unit}</td>
      <td class="text-right font-mono">${it.unitPrice.toLocaleString("id-ID")}</td>
      <td class="text-center font-mono">${it.discountPercent || 0}%</td>
      <td class="text-center font-mono" style="font-size: 8.5pt;">${it.taxType}</td>
      <td class="text-right font-mono font-bold">${it.amount.toLocaleString("id-ID")}</td>
    </tr>
  `).join("");

  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 10px;">
      <!-- KOP PERUSAHAAN & HEADER FAKTUR -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 16pt; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase;">
            ${storeConfig.storeName || "Toko Usaha Mandiri"}
          </h1>
          <p style="font-size: 9.5pt; color: #475569; margin: 2px 0;">
            ${storeConfig.storeType || "Usaha Perdagangan"} &bull; ${storeConfig.storeCity || "Indonesia"}
          </p>
          ${storeConfig.storeAddress ? `<p style="font-size: 9pt; color: #64748b; margin: 0;">${storeConfig.storeAddress}</p>` : ""}
          ${storeConfig.storeNpwp ? `<p style="font-size: 8.5pt; font-family: monospace; color: #64748b; margin: 2px 0 0 0;">NPWP: ${storeConfig.storeNpwp}</p>` : ""}
        </div>
        
        <div style="text-align: right;">
          <h2 style="font-size: 15pt; font-weight: 900; margin: 0; color: #1e3a8a; letter-spacing: 0.5px;">FAKTUR PENJUALAN</h2>
          <p class="font-mono font-bold" style="font-size: 12pt; margin: 3px 0; color: #0f172a;">${invoice.invoiceNumber}</p>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
      </div>

      <!-- INFORMASI PELANGGAN & DETAIL TRANSAKSI -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 9.5pt;">
        <div>
          <strong style="color: #64748b; text-transform: uppercase; font-size: 8.5pt;">Ditagihkan Kepada:</strong>
          <p style="font-size: 11pt; font-weight: bold; margin: 3px 0 2px 0; color: #0f172a;">${invoice.customerName}</p>
          ${invoice.customerAddress ? `<p style="margin: 0; color: #475569;">${invoice.customerAddress}</p>` : ""}
          ${invoice.customerPhone ? `<p class="font-mono" style="margin: 2px 0 0 0; color: #64748b;">Telp/WA: ${invoice.customerPhone}</p>` : ""}
        </div>

        <div style="text-align: right; line-height: 1.5;">
          <div><span style="color: #64748b;">Tanggal Faktur:</span> <strong class="font-mono">${invoice.transactionDate.split("-").reverse().join("/")}</strong></div>
          <div><span style="color: #64748b;">Jatuh Tempo:</span> <strong class="font-mono">${invoice.dueDate.split("-").reverse().join("/")}</strong></div>
          <div><span style="color: #64748b;">Ekspedisi:</span> <strong>${invoice.expedition || "-"}</strong></div>
          ${invoice.trackingNumber ? `<div><span style="color: #64748b;">No. Resi:</span> <strong class="font-mono">${invoice.trackingNumber}</strong></div>` : ""}
          <div><span style="color: #64748b;">Gudang:</span> <span>${invoice.warehouse || "Gudang Utama"}</span></div>
        </div>
      </div>

      <!-- TABEL PRODUK -->
      <table style="margin-bottom: 16px;">
        <thead>
          <tr>
            <th class="text-center" style="width: 32px;">No</th>
            <th>Item Produk &amp; Deskripsi</th>
            <th class="text-center" style="width: 80px;">Qty</th>
            <th class="text-right" style="width: 100px;">Harga Satuan</th>
            <th class="text-center" style="width: 60px;">Diskon</th>
            <th class="text-center" style="width: 60px;">Pajak</th>
            <th class="text-right" style="width: 110px;">Subtotal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- SUMMARY TOTALS -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 20px;">
        <div style="flex: 1; font-size: 8.5pt; color: #64748b; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px;">
          <strong style="color: #334155; display: block; margin-bottom: 4px;">Ketentuan &amp; Catatan Pembayaran:</strong>
          <p style="margin: 0 0 4px 0;">${invoice.notes || "Terima kasih atas kerja sama dan pembelian Anda."}</p>
          <p style="margin: 0;">${invoice.terms || "Pembayaran harap ditransfer penuh ke rekening resmi usaha kami paling lambat tanggal jatuh tempo."}</p>
        </div>

        <div style="width: 280px; font-size: 9.5pt;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span style="color: #64748b;">Sub Total:</span>
            <span class="font-mono font-bold">${invoice.subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0;">
            <span style="color: #64748b;">PPN (11%):</span>
            <span class="font-mono">${invoice.ppnAmount.toLocaleString("id-ID")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #cbd5e1; margin-top: 4px; font-size: 11pt; font-weight: bold;">
            <span>Total Tagihan:</span>
            <span class="font-mono" style="color: #1e3a8a;">Rp ${invoice.totalAmount.toLocaleString("id-ID")}</span>
          </div>
          ${invoice.paidAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #059669;">
              <span>Sudah Dibayar:</span>
              <span class="font-mono font-bold">- Rp ${invoice.paidAmount.toLocaleString("id-ID")}</span>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #0f172a; margin-top: 4px; font-size: 12pt; font-weight: 900;">
            <span>Sisa Tagihan:</span>
            <span class="font-mono" style="color: ${invoice.remainingAmount === 0 ? "#059669" : "#e11d48"};">
              Rp ${invoice.remainingAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      <!-- TANDA TANGAN -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Penerima / Pelanggan,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${invoice.customerName}</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Hormat Kami,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig.storeName || "Manajemen Toko"}</p>
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
        Dokumen resmi diterbitkan secara elektronik oleh Sistem Akuntansi SAK EMKM. Sah tanpa stempel basah.
      </div>
    </div>
  `;
}

/**
 * Generates printable HTML for Buku Jurnal Umum (General Journal)
 */
export function generateJournalPrintHtml(entries: JournalEntry[], storeConfig: StoreConfig): string {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = entries.map((e, idx) => {
    totalDebit += e.debit;
    totalCredit += e.credit;
    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono">${e.date}</td>
        <td class="font-mono font-bold">${e.ref}</td>
        <td class="font-mono text-center">${e.accountId}</td>
        <td style="${e.credit > 0 ? "padding-left: 24px; color: #475569;" : "font-weight: 600;"}">
          ${e.accountName}
          ${e.description ? `<div style="font-size: 8pt; color: #64748b; font-weight: normal;">${e.description}</div>` : ""}
        </td>
        <td class="text-right font-mono">${e.debit > 0 ? e.debit.toLocaleString("id-ID") : "-"}</td>
        <td class="text-right font-mono">${e.credit > 0 ? e.credit.toLocaleString("id-ID") : "-"}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeConfig.storeName}</h1>
        <h2 style="font-size: 13pt; margin: 4px 0 2px 0; color: #1e3a8a;">BUKU JURNAL UMUM (GENERAL JOURNAL)</h2>
        <p style="font-size: 9pt; color: #64748b; margin: 0;">Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)</p>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 32px;">No</th>
            <th style="width: 90px;">Tanggal</th>
            <th style="width: 90px;">No. Bukti</th>
            <th class="text-center" style="width: 60px;">Akun</th>
            <th>Keterangan / Nama Akun</th>
            <th class="text-right" style="width: 120px;">Debit (Rp)</th>
            <th class="text-right" style="width: 120px;">Kredit (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="5" class="text-right font-bold">TOTAL MUTASI JURNAL:</td>
            <td class="text-right font-mono font-bold">${totalDebit.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold">${totalCredit.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- TANDA TANGAN RESMI BUKU JURNAL -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Dibuat Oleh (Bagian Keuangan / Akuntan),</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">Staf Akuntansi SAK EMKM</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Petugas Pembukuan</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Mengetahui &amp; Menyetujui,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig?.storeName || "Pimpinan Usaha"}</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Pimpinan / Pemilik Usaha</p>
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
        Dokumen Buku Jurnal Umum dicetak secara elektronik sesuai Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM).
      </div>
    </div>
  `;
}

/**
 * Generates printable HTML for Buku Kas & Mutasi
 */
export function generateCashBookPrintHtml(transactions: Transaction[], storeConfig: StoreConfig): string {
  let balance = 0;
  let totalIn = 0;
  let totalOut = 0;

  const rows = transactions.map((t, idx) => {
    const isMasuk = t.type === "Penjualan" || t.type === "Penjualan Stok" || t.type === "Penerimaan" || t.type === "Setor Modal";
    const debit = isMasuk ? t.amount : 0;
    const credit = !isMasuk ? t.amount : 0;
    balance += (debit - credit);
    totalIn += debit;
    totalOut += credit;

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono">${t.date}</td>
        <td class="font-mono">${t.invoiceNumber || `TX-${t.id.slice(0, 5)}`}</td>
        <td>
          <strong>${t.type}</strong> - ${t.description}
        </td>
        <td class="text-right font-mono font-bold text-emerald">${debit > 0 ? debit.toLocaleString("id-ID") : "-"}</td>
        <td class="text-right font-mono font-bold text-rose">${credit > 0 ? credit.toLocaleString("id-ID") : "-"}</td>
        <td class="text-right font-mono font-bold">${balance.toLocaleString("id-ID")}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeConfig.storeName}</h1>
        <h2 style="font-size: 13pt; margin: 4px 0 2px 0; color: #1e3a8a;">BUKU KAS &amp; MUTASI REKENING</h2>
        <p style="font-size: 9pt; color: #64748b; margin: 0;">Laporan Keluar Masuk Arus Kas Usaha Standar SAK EMKM</p>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 32px;">No</th>
            <th style="width: 90px;">Tanggal</th>
            <th style="width: 100px;">No. Referensi</th>
            <th>Keterangan Transaksi</th>
            <th class="text-right" style="width: 110px;">Kas Masuk (Rp)</th>
            <th class="text-right" style="width: 110px;">Kas Keluar (Rp)</th>
            <th class="text-right" style="width: 120px;">Saldo Akhir (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="4" class="text-right">TOTAL ARUS KAS:</td>
            <td class="text-right font-mono font-bold text-emerald">${totalIn.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold text-rose">${totalOut.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold">${balance.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- TANDA TANGAN RESMI BUKU KAS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Dibuat Oleh (Kasir / Petugas Kas),</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">Kasir / Bendahara Toko</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Pengelola Kas Harian</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Mengetahui &amp; Menyetujui,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig?.storeName || "Pimpinan Usaha"}</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Pimpinan / Pemilik Toko</p>
        </div>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
        Dokumen Laporan Buku Kas &amp; Mutasi Rekening dicetak secara elektronik oleh Sistem Akuntansi SAK EMKM.
      </div>
    </div>
  `;
}

/**
 * Generates printable HTML for Buku Besar Pembantu (General Ledger) per Akun
 */
export function generateLedgerPrintHtml(
  accountName: string, 
  accountId: number, 
  items: Array<{ date: string; description: string; debit: number; credit: number; balance: number; ref?: string }>, 
  storeConfig: StoreConfig
): string {
  let totalDebit = 0;
  let totalCredit = 0;

  const rows = items.map((it, idx) => {
    totalDebit += (it.debit || 0);
    totalCredit += (it.credit || 0);
    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono">${it.date}</td>
        <td class="font-mono text-slate-500">${it.ref || `GL-${idx + 1}`}</td>
        <td>${it.description}</td>
        <td class="text-right font-mono font-bold">${it.debit > 0 ? it.debit.toLocaleString("id-ID") : "-"}</td>
        <td class="text-right font-mono font-bold">${it.credit > 0 ? it.credit.toLocaleString("id-ID") : "-"}</td>
        <td class="text-right font-mono font-bold">${it.balance.toLocaleString("id-ID")}</td>
      </tr>
    `;
  }).join("");

  const finalBalance = items.length > 0 ? items[items.length - 1].balance : 0;

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeConfig?.storeName || "PEMBUKUAN SAK EMKM"}</h1>
        <h2 style="font-size: 13pt; margin: 4px 0 2px 0; color: #1e3a8a;">BUKU BESAR PEMBANTU (GENERAL LEDGER)</h2>
        <p style="font-size: 10pt; font-weight: bold; color: #0f172a; margin: 4px 0 0 0;">Akun: ${accountId} - ${accountName}</p>
        <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah</p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 9.5pt; color: #475569;">
        <div>Tanggal Cetak: <strong>${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
        <div>Total Mutasi: <strong>${items.length} Baris</strong></div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 32px;">No</th>
            <th style="width: 90px;">Tanggal</th>
            <th style="width: 90px;">No. Ref</th>
            <th>Keterangan Transaksi</th>
            <th class="text-right" style="width: 120px;">Debit (Rp)</th>
            <th class="text-right" style="width: 120px;">Kredit (Rp)</th>
            <th class="text-right" style="width: 130px;">Saldo Berjalan (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" class="text-center" style="padding: 20px; color: #94a3b8; font-style: italic;">Belum ada mutasi transaksi untuk akun ini.</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="4" class="text-right">TOTAL MUTASI &amp; SALDO AKHIR:</td>
            <td class="text-right font-mono font-bold">${totalDebit.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold">${totalCredit.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold" style="color: #1e3a8a;">${finalBalance.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- TANDA TANGAN RESMI BUKU BESAR -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Petugas Pembukuan (Akuntan),</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">Staf Akuntansi SAK EMKM</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Petugas Keuangan</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Mengetahui &amp; Menyetujui,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig?.storeName || "Pimpinan Usaha"}</p>
          <p style="font-size: 8.5pt; color: #94a3b8; margin: 2px 0 0 0;">Pimpinan / Pemilik Usaha</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates printable HTML for Daftar Tagihan & Faktur Penjualan (Invoices Table)
 */
export function generateInvoicesListPrintHtml(invoices: Invoice[], storeConfig: StoreConfig): string {
  let totalBilled = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  const rows = invoices.map((inv, idx) => {
    totalBilled += inv.totalAmount;
    totalPaid += inv.paidAmount;
    totalRemaining += inv.remainingAmount;

    const statusBadge = inv.status === "paid" 
      ? '<span class="badge badge-paid">LUNAS</span>'
      : inv.status === "partial"
      ? '<span class="badge badge-partial">SEBAGIAN</span>'
      : '<span class="badge badge-unpaid">BELUM DIBAYAR</span>';

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono font-bold" style="color: #1e3a8a;">${inv.invoiceNumber}</td>
        <td><strong>${inv.customerName}</strong></td>
        <td class="font-mono text-center">${inv.transactionDate.split("-").reverse().join("/")}</td>
        <td class="font-mono text-center">${inv.dueDate.split("-").reverse().join("/")}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-right font-mono font-bold" style="color: ${inv.remainingAmount === 0 ? "#059669" : "#e11d48"};">
          ${inv.remainingAmount.toLocaleString("id-ID")}
        </td>
        <td class="text-right font-mono font-bold">${inv.totalAmount.toLocaleString("id-ID")}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="max-width: 950px; margin: 0 auto; padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeConfig?.storeName || "Toko Usaha Mandiri"}</h1>
          <h2 style="font-size: 13pt; margin: 3px 0 2px 0; color: #1e3a8a;">DAFTAR REKAPITULASI TAGIHAN &amp; FAKTUR PENJUALAN</h2>
          <p style="font-size: 9pt; color: #64748b; margin: 0;">Laporan Piutang &amp; Riwayat Tagihan Usaha SAK EMKM</p>
        </div>
        <div style="text-align: right; font-size: 9pt; color: #475569;">
          <div>Tanggal Cetak: <strong>${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
          <div>Total Tagihan: <strong>${invoices.length} Dokumen</strong></div>
        </div>
      </div>

      <!-- KPI Summary -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 8pt; color: #64748b; text-transform: uppercase; font-weight: bold;">Total Nilai Faktur</div>
          <div style="font-size: 12pt; font-weight: 900; font-family: monospace; color: #1e3a8a; margin-top: 2px;">
            Rp ${totalBilled.toLocaleString("id-ID")}
          </div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 8pt; color: #166534; text-transform: uppercase; font-weight: bold;">Penerimaan Kas (Lunas)</div>
          <div style="font-size: 12pt; font-weight: 900; font-family: monospace; color: #15803d; margin-top: 2px;">
            Rp ${totalPaid.toLocaleString("id-ID")}
          </div>
        </div>
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 8pt; color: #9f1239; text-transform: uppercase; font-weight: bold;">Sisa Piutang Usaha</div>
          <div style="font-size: 12pt; font-weight: 900; font-family: monospace; color: #be123c; margin-top: 2px;">
            Rp ${totalRemaining.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 30px;">No</th>
            <th style="width: 110px;">Nomor Faktur</th>
            <th>Pelanggan</th>
            <th class="text-center" style="width: 95px;">Tgl Faktur</th>
            <th class="text-center" style="width: 95px;">Jatuh Tempo</th>
            <th class="text-center" style="width: 90px;">Status</th>
            <th class="text-right" style="width: 125px;">Sisa Tagihan (Rp)</th>
            <th class="text-right" style="width: 125px;">Total (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="6" class="text-right">TOTAL KESELURUHAN:</td>
            <td class="text-right font-mono font-bold" style="color: #be123c;">${totalRemaining.toLocaleString("id-ID")}</td>
            <td class="text-right font-mono font-bold" style="color: #1e3a8a;">${totalBilled.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- TANDA TANGAN -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Disiapkan Oleh Bagian Penjualan,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">Staf Administrasi</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Mengetahui &amp; Menyetujui,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig?.storeName || "Pimpinan Usaha"}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates printable HTML for Stock Inventory list
 */
export function generateStockInventoryPrintHtml(items: any[], storeConfig: StoreConfig): string {
  let totalStockQty = 0;
  let totalAssetValue = 0;

  const rows = items.map((item, idx) => {
    const assetValue = (item.stock || 0) * (item.avgPurchasePrice || 0);
    totalStockQty += (item.stock || 0);
    totalAssetValue += assetValue;

    return `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono text-slate-500">${item.sku || `SKU-${idx + 1}`}</td>
        <td><strong>${item.name}</strong></td>
        <td class="text-center font-mono font-bold">${item.stock || 0} ${item.unit || "Pcs"}</td>
        <td class="text-right font-mono">${(item.avgPurchasePrice || 0).toLocaleString("id-ID")}</td>
        <td class="text-right font-mono">${(item.sellPrice || 0).toLocaleString("id-ID")}</td>
        <td class="text-right font-mono font-bold" style="color: #1e3a8a;">${assetValue.toLocaleString("id-ID")}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 16pt; margin: 0; text-transform: uppercase;">${storeConfig?.storeName || "Toko Usaha Mandiri"}</h1>
        <h2 style="font-size: 13pt; margin: 4px 0 2px 0; color: #1e3a8a;">LAPORAN KATALOG &amp; NILAI PERSEDIAAN BARANG (HPP)</h2>
        <p style="font-size: 9pt; color: #64748b; margin: 0;">Metode Penilaian Persediaan Rata-Rata Tertimbang (Weighted Average) Standar SAK EMKM</p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 9.5pt; color: #475569;">
        <div>Tanggal Posisi: <strong>${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></div>
        <div>Total Varian Barang: <strong>${items.length} Item</strong></div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 32px;">No</th>
            <th style="width: 90px;">Kode SKU</th>
            <th>Nama Barang &amp; Spesifikasi</th>
            <th class="text-center" style="width: 80px;">Kuantitas</th>
            <th class="text-right" style="width: 110px;">HPP Pokok (Rp)</th>
            <th class="text-right" style="width: 110px;">Harga Jual (Rp)</th>
            <th class="text-right" style="width: 130px;">Nilai Aset Stok (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="3" class="text-right">TOTAL NILAI PERSEDIAAN:</td>
            <td class="text-center font-mono font-bold">${totalStockQty.toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
            <td class="text-right font-mono font-bold" style="color: #1e3a8a;">Rp ${totalAssetValue.toLocaleString("id-ID")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- TANDA TANGAN -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 9.5pt;">
        <div>
          <p style="color: #64748b; margin: 0;">Penanggung Jawab Gudang,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">Kepala Logistik</p>
        </div>
        <div>
          <p style="color: #64748b; margin: 0;">Mengetahui &amp; Menyetujui,</p>
          <div style="height: 60px;"></div>
          <p style="font-weight: bold; margin: 0; text-decoration: underline;">${storeConfig?.storeName || "Pimpinan Usaha"}</p>
        </div>
      </div>
    </div>
  `;
}
