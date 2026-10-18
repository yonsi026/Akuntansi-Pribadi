export interface BlueprintStep {
  step: number;
  title: string;
  badge: string;
  description: string;
  prompt: string;
}

export const BLUEPRINT_STEPS: BlueprintStep[] = [
  {
    step: 1,
    title: "Inisialisasi Fondasi, Bagan Akun (COA), & Engine Double-Entry",
    badge: "CORE ENGINE",
    description: "Fondasi sistem akuntansi berbasis SAK EMKM dengan 19 kode akun resmi dan validasi keseimbangan debit-kredit otomatis.",
    prompt: `Buatkan aplikasi akuntansi web berbasis React + TypeScript + Vite + Tailwind CSS untuk UMKM Indonesia bernama "Akuntan AI UMKM" yang mematuhi standar SAK EMKM.

Spesifikasi Fondasi:
1. Chart of Accounts (COA) / Bagan Akun Standar SAK EMKM dengan kode 4 digit:
   - 1001: Kas & Setara Kas (Aset Lancar, Normal: Debit)
   - 1002: Bank BCA / Mandiri Operasional (Aset Lancar, Normal: Debit)
   - 1003: Persediaan Barang Dagang (Aset Lancar, Normal: Debit)
   - 1004: Piutang Usaha (Aset Lancar, Normal: Debit)
   - 1501: Aset Tetap / Peralatan Usaha (Aset Tidak Lancar, Normal: Debit)
   - 1502: Akumulasi Penyusutan Aset Tetap (Kontra Aset, Normal: Kredit)
   - 2001: Hutang Usaha / Supplier (Liabilitas Jangka Pendek, Normal: Kredit)
   - 2002: Hutang Beban & Pajak (Liabilitas, Normal: Kredit)
   - 3001: Modal Pemilik (Ekuitas, Normal: Kredit)
   - 3002: Saldo Laba Ditahan / Periode Berjalan (Ekuitas, Normal: Kredit)
   - 3003: Prive / Penarikan Modal Pemilik (Kontra Ekuitas, Normal: Debit)
   - 4001: Pendapatan Usaha / Penjualan (Pendapatan, Normal: Kredit)
   - 4002: Pendapatan Lain-lain (Pendapatan, Normal: Kredit)
   - 5001: Harga Pokok Penjualan - HPP (Beban Pokok, Normal: Debit)
   - 6001: Beban Gaji & Upah Karyawan (Beban Operasional, Normal: Debit)
   - 6002: Beban Sewa Tempat Usaha (Beban Operasional, Normal: Debit)
   - 6003: Beban Listrik, Air & Internet (Beban Operasional, Normal: Debit)
   - 6004: Beban Promosi & Pemasaran (Beban Operasional, Normal: Debit)
   - 6005: Beban Penyusutan Peralatan (Beban Operasional, Normal: Debit)
   - 6006: Beban Operasional Lainnya (Beban Operasional, Normal: Debit)

2. Core Accounting Engine:
   - Buatkan utility accountingEngine.ts untuk memproses transaksi double-entry (Debit & Kredit harus selalu seimbang: sum(Debit) === sum(Kredit)).
   - Formula otomatis pembuatan Jurnal Umum, Buku Besar (General Ledger), Neraca Saldo (Trial Balance), Laporan Laba Rugi (Income Statement), Laporan Posisi Keuangan / Neraca (Balance Sheet), dan Laporan Arus Kas (Cash Flow) Metode Langsung.`
  },
  {
    step: 2,
    title: "Desain Layout ERP Modern & Sidebar Animasi Framer Motion",
    badge: "UI/UX & NAV",
    description: "Struktur layout multi-level dengan sidebar lipat bersistem pegas, two-tier header, dan sinkronisasi sub-navbar.",
    prompt: `Buatkan layout ERP ala Kledo / SaaS profesional dengan spesifikasi:
1. Sidebar Navigasi Responsif (SidebarNav.tsx):
   - Gunakan Framer Motion (motion.aside) dengan spring physics (stiffness: 300, damping: 30) untuk transisi buka/tutup yang halus dan elegan.
   - Kelompok menu hierarkis:
     * Dashboard (Beranda)
     * Kas & Bank (Buku Kas, Kasir POS, Jurnal, Rekening Bank)
     * Penjualan (Overview, Tagihan/Faktur, Pengiriman/Surat Jalan, Pemesanan, Penawaran)
     * Pembelian (Overview, Tagihan Pembelian, Piutang, Pengiriman, Pesanan PO, Penawaran RFQ)
     * Biaya (Catat Beban Operasional)
     * Produk & Inventori (Katalog Stok, Penyesuaian, Kartu Stok HPP Rata-Rata)
     * Laporan Keuangan (Laba Rugi, Posisi Keuangan, Arus Kas, Neraca Saldo, Buku Besar)
     * Perpajakan (Kalkulator PPh Final 0.5% & PPN 11%)
     * Panduan Akun (Dokumentasi lengkap 19 akun SAK EMKM)
2. Two-Tier Header:
   - Tier 1: Logo toko, nama usaha aktif, badge standar akrual SAK EMKM, dan breadcrumbs dinamis.
   - Tier 2 Toolbar: Kotak pencarian global, tombol "+ Buat Transaksi", tombol drop-down "Dokumen Terakhir" (menyimpan 3 laporan finansial terakhir), tombol Cetak A4, Lisensi, Pengaturan, dan Profil Pengguna.
3. Sub-Navbar Dinamis (NavigationSyncBar.tsx):
   - Tampilkan underline sub-tab navigasi yang tersinkronisasi otomatis saat modul Penjualan, Pembelian, Kasir, atau Stok dipilih.`
  },
  {
    step: 3,
    title: "Laporan Keuangan Standar SAK EMKM & Visualisasi Recharts",
    badge: "FINANCIAL REPORT",
    description: "Laba Rugi, Neraca Seimbang, Arus Kas Metode Langsung, serta visualisasi grafik batang bulanan interaktif.",
    prompt: `Implementasikan modul Laporan Keuangan Lengkap (FinancialStatements.tsx):
1. Laporan Laba Rugi (Income Statement):
   - Pendapatan Usaha (4001) dikurangi HPP (5001) = Laba Kotor.
   - Laba Kotor dikurangi Beban Operasional (6001 - 6006) = Laba Bersih Usaha.
   - Tambahkan komponen grafik batang Recharts (IncomeStatementBarChart.tsx) di atas tabel laporan dengan 3 mode:
     a. Komparasi Bulanan: Grouped Bar Chart membandingkan Pendapatan (Emerald #10b981) vs Total Beban (Rose #f43f5e).
     b. Laba Bersih & Margin: Bar chart laba bersih + garis tren margin %.
     c. Komposisi Beban: Stacked breakdown HPP vs Beban Operasional.
     d. Filter Tahun dan Bulan interaktif dengan tooltip format Rupiah (IDR).
2. Laporan Posisi Keuangan (Neraca / Balance Sheet):
   - Kolom Kiri: Aset Lancar + Aset Tetap (dikurangi Akumulasi Penyusutan).
   - Kolom Kanan: Liabilitas + Ekuitas Pemilik (termasuk Saldo Laba Periode Berjalan).
   - Validasi keseimbangan neraca otomatis: Total Aset === Total Liabilitas + Ekuitas.
3. Laporan Arus Kas (Metode Langsung):
   - Arus kas dari aktivitas operasi, investasi, dan pendanaan.
4. Neraca Saldo & Buku Besar per Akun dengan filter rentang tanggal.`
  },
  {
    step: 4,
    title: "Modul Penjualan & Pembelian dengan Speedometer Gauge Anti-Jump",
    badge: "OVERVIEW & CHARTS",
    description: "Overview Penjualan & Pembelian ala Kledo dengan jarum speedometer anti-lompat menggunakan Framer Motion spring physics.",
    prompt: `Bangun modul Overview Penjualan (SalesOverview.tsx) dan Overview Pembelian (PurchaseOverview.tsx) dengan visualisasi ala Kledo ERP:
1. Header & Filter Periode:
   - Breadcrumbs, tombol Panduan, tombol Print, dan toggle periode filter: "Hari", "Bulan", dan "Tahun".
2. Baris 1 - Kartu Ringkasan Metrik (2x2 Grid) + Speedometer Gauge:
   - Kartu 1: Total Nilai Transaksi (Penjualan / Pembelian), jumlah dokumen, dan persentase pertumbuhan.
   - Kartu 2: Pembayaran Diterima / Dikirim.
   - Kartu 3: Menunggu Pembayaran (Belum Lunas).
   - Kartu 4: Jatuh Tempo.
   - Kartu Speedometer Gauge: RASIO LUNAS (0% - 100%).
     * 4 busur warna: Cyan (0-25%), Kuning (25-50%), Oranye (50-75%), Merah (75-100%).
     * Jarum Tuding SVG presisi tinggi dengan bayangan feDropShadow.
     * Animasi jarum menggunakan Framer Motion:
       <motion.g animate={{ rotate: needleAngle }} transition={{ type: "spring", stiffness: 90, damping: 15 }} style={{ transformOrigin: "100px 95px" }}>
       untuk memastikan jarum TIDAK lompat-lompat atau glitch saat tombol Hari, Bulan, dan Tahun diklik.
3. Baris 2 - Grafik Analitik:
   - Grouped Bar Chart perbandingan Tagihan vs Pesanan.
   - Line Chart tren Pembayaran.
   - Donut Chart breakdown Produk Terlaris/Dibeli (toggle Jenis vs Kategori).
   - Donut Chart breakdown Pelanggan / Vendor Pemasok dengan carousel dots.
4. Baris 3 - Alur Proses Belum Selesai (Chevron Process Flow):
   - 4 kartu panah chevron interaktif (Penawaran -> Pesanan -> Pengiriman -> Tagihan).
   - Dapat diklik untuk membuka sub-tab terkait di modul manager.`
  },
  {
    step: 5,
    title: "Kasir Cepat (Point of Sale), Pajak PPN & Inventori HPP Rata-Rata",
    badge: "OPERATIONAL & TAX",
    description: "Mesin kasir POS dengan cetak struk termal, kalkulator PPh Final 0.5% & PPN 11%, serta inventori Moving Average.",
    prompt: `Tambahkan fitur operasional kasir dan inventori:
1. Kasir POS (PointOfSale.tsx):
   - Grid katalog produk dengan pencarian cepat nama/barcode.
   - Keranjang belanja interaktif dengan input kuantitas, diskon, dan toggle otomatis PPN 11%.
   - Kalkulator uang diterima & nominal kembalian otomatis.
   - Pencetakan struk kasir termal (Thermal 58mm / 80mm).
   - Setiap transaksi POS otomatis membuat jurnal kas (Debit 1001 Kas, Kredit 4001 Penjualan, Kredit 2002 Hutang PPN) dan memotong stok fisik serta menjurnal HPP (Debit 5001 HPP, Kredit 1003 Persediaan).
2. Manajemen Stok & HPP (StockManager.tsx):
   - Metode perhitungan biaya: Moving Average (Rata-rata bergerak).
   - Input restock barang baru otomatis memperbarui harga pokok rata-rata.
   - Notifikasi stok minimum / menipis.
3. Modul Perpajakan (TaxCalculator.tsx):
   - Perhitungan otomatis PPh Final 0.5% PP 55/2022 dari omzet bulanan.
   - Rekap faktur pajak PPN Masukan vs PPN Keluaran.`
  },
  {
    step: 6,
    title: "Asisten Finansial Cerdas Bertenaga Google Gemini AI",
    badge: "AI ADVISORY",
    description: "Integrasi Gemini 2.5 Flash SDK untuk analisis kesehatan finansial UMKM dan rekomendasi taktis akuntansi.",
    prompt: `Integrasikan Asisten AI Akuntansi Cerdas (AiAssistant.tsx):
1. Menggunakan SDK resmi @google/genai TypeScript dengan model gemini-2.5-flash.
2. Endpoint server-side proxy aman di server.ts: POST /api/chat.
3. Sistem prompt asisten bertindak sebagai "Senior Akuntan Publik Bersertifikat SAK EMKM Indonesia":
   - Mampu menganalisis neraca saldo dan rasio likuiditas/solvabilitas toko secara real-time.
   - Menghitung margin laba kotor, margin laba bersih, rasio perputaran persediaan.
   - Memberikan 3 rekomendasi taktis bisnis berbahasa Indonesia yang ramah bagi pelaku UMKM.`
  }
];

export const FULL_BLUEPRINT_MARKDOWN = `# BLUEPRINT ARSITEKTUR & MASTER PROMPT: AKUNTAN AI UMKM
### Sistem Pembukuan & ERP Finansial Terstandarisasi SAK EMKM untuk UMKM Indonesia

---

## 1. PENDAHULUAN & RINGKASAN SISTEM
Dokumen ini dirancang sebagai Blue Print Universal (Master Prompt & Architectural Spec) untuk mereplikasi, membangun ulang, atau mengembangkan sistem akuntansi dan ERP UMKM berbasis web. Sistem ini mematuhi standar akuntansi resmi Indonesia (SAK EMKM - Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah), dilengkapi regulasi perpajakan (PPh Final 0.5% PP 55/2022 & PPN 11% UU HPP), manajemen rantai pasok, Point of Sale (POS), serta konsultasi finansial cerdas bertenaga Google Gemini AI.

---

## 2. MASTER PROMPT BERTAHAP
${BLUEPRINT_STEPS.map(s => `### LANGKAH ${s.step}: ${s.title}\n\`\`\`text\n${s.prompt}\n\`\`\`\n`).join('\n')}

---

## 3. TABEL DOUBLE-ENTRY & FORMULA AKUNTANSI SAK EMKM
- Penjualan Tunai: Debit 1001 Kas, Kredit 4001 Pendapatan
- Penjualan Tunai + PPN 11%: Debit 1001 Kas (111%), Kredit 4001 Penjualan (100%), Kredit 2002 Hutang PPN (11%)
- HPP Barang Terjual: Debit 5001 HPP, Kredit 1003 Persediaan Barang
- Beli Stok Kredit: Debit 1003 Persediaan Barang, Kredit 2001 Hutang Usaha
- Pelunasan Hutang: Debit 2001 Hutang Usaha, Kredit 1001 Kas / 1002 Bank
- Moving Average Cost: HPP Baru = [(Qty Lama x HPP Lama) + (Qty Beli x Harga Beli)] / (Qty Lama + Qty Beli)
- Keseimbangan Neraca: Total Aset === Total Liabilitas + Total Ekuitas
`;

export const FULL_BLUEPRINT_WORD_HTML = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Blueprint & Master Prompt: Akuntan AI UMKM (SAK EMKM)</title>
<style>
  body { font-family: 'Calibri', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40px; }
  h1 { font-size: 22pt; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 24px; font-weight: bold; }
  h2 { font-size: 15pt; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; font-weight: bold; }
  h3 { font-size: 12pt; color: #0f766e; margin-top: 14px; font-weight: bold; }
  .prompt-box { background-color: #f8fafc; border-left: 4px solid #2563eb; border: 1px solid #e2e8f0; padding: 12px 16px; margin: 12px 0 18px 0; font-family: 'Consolas', monospace; font-size: 9.5pt; color: #0f172a; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10pt; }
  th, td { border: 1px solid #94a3b8; padding: 6px 10px; text-align: left; }
  th { background-color: #f1f5f9; font-weight: bold; }
  .formula-box { background-color: #f0fdf4; border: 1px solid #86efac; padding: 10px 14px; border-radius: 6px; margin: 10px 0; font-weight: bold; color: #166534; }
</style>
</head>
<body>
<h1>BLUEPRINT ARSITEKTUR &amp; MASTER PROMPT: AKUNTAN AI UMKM</h1>
<p><strong>Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)</strong></p>
<hr/>
<h2>1. RINGKASAN EKSEKUTIF &amp; TECH STACK</h2>
<p>Tech Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide React, Google Gemini API.</p>
<h2>2. MASTER PROMPT BERTAHAP</h2>
${BLUEPRINT_STEPS.map(s => `<h3>Langkah ${s.step}: ${s.title}</h3><div class="prompt-box">${s.prompt}</div>`).join('')}
<h2>3. PERSAMAAN AKUNTANSI &amp; DOUBLE ENTRY</h2>
<div class="formula-box">Total Aset = Total Liabilitas + Total Ekuitas</div>
<div class="formula-box">Moving Average HPP = [(Qty Lama x HPP Lama) + (Qty Beli x Harga Beli)] / (Qty Lama + Qty Beli)</div>
</body>
</html>`;

export function downloadBlueprint(format: 'md' | 'doc') {
  const filename = format === 'md' ? 'BLUEPRINT_AKUNTAN_AI_UMKM.md' : 'BLUEPRINT_AKUNTAN_AI_UMKM.doc';
  const content = format === 'md' ? FULL_BLUEPRINT_MARKDOWN : FULL_BLUEPRINT_WORD_HTML;
  const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'application/msword;charset=utf-8';

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
