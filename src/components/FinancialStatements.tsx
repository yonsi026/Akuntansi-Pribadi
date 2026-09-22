import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  HelpCircle,
  FileCode,
  DollarSign
} from "lucide-react";
import { FinancialStats, Transaction, StockItem, JournalEntry, StoreConfig } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { computeTrialBalance } from "../utils/accountingEngine";
import { exportToXLSX } from "../utils/xlsxExport";
import { formatIDR } from "./FinanceDashboard";

interface FinancialStatementsProps {
  stats: FinancialStats;
  transactions: Transaction[];
  stockItems: StockItem[];
  journal: JournalEntry[];
  storeConfig?: StoreConfig;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
  stats,
  transactions,
  stockItems,
  journal,
  storeConfig
}) => {
  const [activeReport, setActiveReport] = useState<'labarugi' | 'neraca' | 'aruskas' | 'neracasaldo' | 'ekspor'>('labarugi');

  const trialBalance = computeTrialBalance(journal);
  const totalTbDebit = trialBalance.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalTbCredit = trialBalance.reduce((sum, item) => sum + (item.credit || 0), 0);
  const isTbBalanced = Math.abs(totalTbDebit - totalTbCredit) < 1;

  // --- ARUS KAS CORE CALCULATIONS (DIRECT METHOD) ---
  // Operating Receipts
  const receiptsFromCustomers = transactions
    .filter(t => t.type === 'Penerimaan' || t.type === 'Penjualan Stok')
    .reduce((acc, t) => acc + t.amount, 0);

  // Operating Payments for Stock Purchases
  const paymentsForStock = transactions
    .filter(t => t.type === 'Pembelian Stok')
    .reduce((acc, t) => acc + t.amount, 0);

  // Operating Payments for general expenses
  const paymentsForExpenses = transactions
    .filter(t => t.type === 'Pengeluaran')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFromOperations = receiptsFromCustomers - paymentsForStock - paymentsForExpenses;

  // Investing activities (e.g. equipment purchases - let's assume we can detect equipment or direct assets)
  // For simplicity, we track general equipment cash flow or list 0
  const netCashFromInvesting = 0; 

  // Financing activities (Equity capital injections or prive withdrawals)
  const capitalInjections = transactions
    .filter(t => t.type === 'Setor Modal')
    .reduce((acc, t) => acc + t.amount, 0);

  const drawingsPaid = transactions
    .filter(t => t.type === 'Tarik Prive')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashFromFinancing = capitalInjections - drawingsPaid;

  const netIncreaseDecreaseInCash = netCashFromOperations + netCashFromInvesting + netCashFromFinancing;
  const initialCash = 0; // Assume start of book is 0
  const finalCash = netIncreaseDecreaseInCash;

  // Print friendly wrapper
  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    try {
      exportToXLSX(transactions, stockItems, journal, stats, storeConfig);
      alert("Berhasil mengekspor! File Excel (.xlsx) dengan 6 tab laporan (Jurnal, Buku Besar, Neraca Saldo, Laba Rugi, Neraca, Stok) telah terunduh ke komputer Anda.");
    } catch (err: any) {
      console.error("Gagal ekspor Excel:", err);
      alert("Gagal mengekspor file Excel: " + err.message);
    }
  };

  const ReportHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <>
      {/* IN-REPORT PRINT ACTION BAR (HIDDEN ON PRINT) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Printer className="w-4 h-4 text-slate-900 shrink-0" />
          <span><strong>Siap Cetak / Unduh PDF:</strong> Format A4 resmi dengan Kop Surat usaha, tabel akun, dan kolom tanda tangan.</span>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak Dokumen Ini
        </button>
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
          <p className="text-xs text-slate-500 font-mono">
            {subtitle}
          </p>
        </div>
      </div>
    </>
  );

  const ReportSignature = () => (
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
          <p className="text-[10px] text-slate-450 font-mono">Petugas Keuangan / Akuntan</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 underline font-sans">Bagian Akuntansi</p>
          <p className="text-[9px] text-slate-400 font-mono">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" id="laporan-keuangan">
      {/* Top Header Selector & Control Actions */}
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
            onClick={() => setActiveReport('ekspor')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeReport === 'ekspor' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Ekspor Microsoft Excel
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 font-semibold">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            title="Cetak Laporan ke Printer atau Simpan sebagai Dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF
          </button>
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor .XLS
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs text-center text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold">Laporan Finansial Siap Dibuat</h4>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Namun pembukuan transaksi Anda saat ini masih kosong. Silakan muat **Data Demo** di dashboard atau input transaksi perdana Anda agar laporan terhitung otomatis.
          </p>
        </div>
      ) : (
        <div className="print:p-0">
          {/* LABA RUGI SHEET VIEW */}
          {activeReport === 'labarugi' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6 printable-area">
              <ReportHeader
                title="LAPORAN LABA RUGI (INCOME STATEMENT)"
                subtitle={`Periode: ${storeConfig?.reportPeriod || "Bulanan"} • Selesai Pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} • Standar Akrual SAK EMKM`}
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
                    <span className="font-mono text-slate-800 font-semibold">{stats.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                    <span>TOTAL PENDAPATAN</span>
                    <span className="font-mono">{stats.revenue.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 2. Harga Pokok Penjualan */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-150">
                    <span>2. HARGA POKOK PENJUALAN (HPP)</span>
                    <span className="font-mono">Rp</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-650 pl-4">
                    <span>Harga Pokok Penjualan Produk (5001)</span>
                    <span className="font-mono text-slate-800 font-semibold">{stats.hpp.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">
                    <span>TOTAL BEBAN POKOK (HPP)</span>
                    <span className="font-mono">{stats.hpp.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 2a. Laba Kotor */}
                <div className="flex justify-between text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-100 p-3 rounded-lg uppercase">
                  <span>LABA KOTOR (GROSS PROFIT)</span>
                  <span className="font-mono">{stats.grossProfit.toLocaleString('id-ID')}</span>
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
                    <span className="font-mono">{stats.expenses.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* 4. NET PROFIT */}
                <div className={`flex justify-between text-sm font-extrabold p-3.5 rounded-lg uppercase border ${
                  stats.netProfit >= 0 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
                    : 'bg-rose-50 text-rose-950 border-rose-200'
                }`}>
                  <span>LABA BERSIH SEBELUM PAJAK (NET INCOME)</span>
                  <span className="font-mono">{stats.netProfit.toLocaleString('id-ID')}</span>
                </div>

                {/* TAX DISCLOSURE FOOTNOTE compliance */}
                <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1 text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Kepatuhan SAK EMKM Indonesia
                  </p>
                  <p>
                    Laporan ini disusun dengan metode akrual sesuai panduan SAK EMKM. PPh Final UMKM estimasi 0,5% dari omzet neto ({formatIDR(stats.pph)}) harus disetor ke KPP setiap bulan selambat-lambatnya tanggal 15 apabila omzet setahun pengusaha melebihi PTKP UMKM (Rp 500 Juta).
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
                subtitle={`Posisi Per Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} • Standar Kepatuhan SAK EMKM`}
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
                    <span className="font-mono font-extrabold">{stats.totalAssets.toLocaleString('id-ID')}</span>
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
                        {stats.pph.toLocaleString('id-ID')}
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
                        {stats.netProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Total Equity and Liabilities */}
                  <div className="flex justify-between text-xs font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>JUMLAH UTANG &amp; MODAL</span>
                    <span className="font-mono font-extrabold">{(stats.totalLiabilities + stats.totalEquity).toLocaleString('id-ID')}</span>
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
                  {Math.abs(stats.totalAssets - (stats.totalLiabilities + stats.totalEquity)) < 1 ? "SEIMBANG (DEBIT = KREDIT)" : "TIDAK SEIMBANG"}
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
                subtitle={`Periode: ${storeConfig?.reportPeriod || "Bulanan"} • Menggunakan Metode Langsung (Direct Cash Flow Method)`}
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
                    <span>SALDO KAS & SETARA KAS AKHIR</span>
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
                subtitle={`Posisi Per Tanggal: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} • Verifikasi Keseimbangan Debit & Kredit SAK EMKM`}
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

          {/* EXCEL INSTRUCTION TAB */}
          {activeReport === 'ekspor' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-3 py-6">
                <FileCode className="w-16 h-16 text-teal-600 mx-auto" />
                <h2 className="text-lg font-bold text-slate-800">Ekspor Laporan ke Microsoft Excel (.xlsx)</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unduh seluruh database pembukuan Anda—termasuk Ringkasan Eksekutif, Jurnal Umum double-entry, Neraca EMKM, Laporan Laba Rugi, Buku Besar, dan Katalog Stok—dalam 1 file bersahabat yang terstruktur rapi.
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleExcelExport}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-xs text-xs"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Excel (.CSV SAK-EMKM)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6 text-xs text-slate-600">
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800">Petunjuk Import Ke Excel Indonesia:</h4>
                  <p className="leading-relaxed text-[11px]">
                    1. File diunduh dalam format UTF-8 CSV dengan BOM.<br/>
                    2. Excel Indonesia secara default mengenali pemisah kolom (koma / titik-koma) berdasarkan pengaturan sistem operasi Anda.<br/>
                    3. Buka Excel, pilih menu <strong>Data &gt; From Text/CSV</strong> jika format desimal dirasa belum pas.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800">Kompatibilitas Penyimpanan:</h4>
                  <p className="leading-relaxed text-[11px]">
                    File hasil ekspor ini juga kompatibel dengan <strong>Google Sheets</strong>, <strong>WPS Office</strong>, dan <strong>LibreOffice Calc</strong> untuk analisis pembukuan mandiri yang lebih bebas.
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
