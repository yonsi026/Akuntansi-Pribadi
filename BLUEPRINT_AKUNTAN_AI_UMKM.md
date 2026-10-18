# BLUEPRINT ARSITEKTUR & MASTER PROMPT: AKUNTAN AI UMKM
### Sistem Pembukuan & ERP Finansial Terstandarisasi SAK EMKM untuk UMKM Indonesia

---

## 1. PENDAHULUAN & RINGKASAN SISTEM

### 1.1 Tujuan Proyek
Dokumen ini dirancang sebagai **Blue Print Universal (Master Prompt & Architectural Spec)** untuk mereplikasi, membangun ulang, atau mengembangkan sistem akuntansi dan ERP UMKM berbasis web (*single-page application*). Sistem ini mengadopsi standar akuntansi resmi Indonesia (**SAK EMKM - Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah**), dilengkapi regulasi perpajakan (**PPh Final 0.5% PP 55/2022** & **PPN 11% UU HPP**), manajemen rantai pasok (Penjualan, Pembelian, Inventori FIFO/Moving Average), Point of Sale (POS), serta konsultasi finansial cerdas bertenaga **Google Gemini AI**.

### 1.2 Tech Stack Standar
* **Frontend Framework**: React 19 (TypeScript) + Vite
* **Styling**: Tailwind CSS v4 (Clean Modern ERP Palette, Slate/Blue/Emerald)
* **Animasi UI**: Framer Motion (Spring Physics untuk Sidebar Navigasi dan Jarum Speedometer Gauge)
* **Visualisasi Data**: Recharts (Grouped Bar Chart, Line Chart, Donut/Pie Chart)
* **Ikonografi**: Lucide React
* **Ekspor & Cetak**: HTML-to-Canvas / jsPDF, XLSX (SheetJS), Window Print CSS Media Query
* **AI Engine**: Google Gemini API via `@google/genai` TypeScript SDK
* **Penyimpanan Data**: LocalStorage terstruktur dengan schema auto-seeding & JSON Cloud Sync capability

---

## 2. STRUKTUR MASTER PROMPT BERTAHAP (STEP-BY-STEP PROMPT BLUEPRINT)

Berikut adalah urutan prompt modular yang dapat Anda gunakan langsung pada AI Studio atau agen AI lainnya untuk membangun aplikasi ini langkah demi langkah:

### PROMPT 1: Inisialisasi Fondasi, Bagan Akun (COA), & Engine Double-Entry
```text
Buatkan aplikasi akuntansi web berbasis React + TypeScript + Vite + Tailwind CSS untuk UMKM Indonesia bernama "Akuntan AI UMKM" yang mematuhi standar SAK EMKM.

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
   - Formula otomatis pembuatan Jurnal Umum, Buku Besar (General Ledger), Neraca Saldo (Trial Balance), Laporan Laba Rugi (Income Statement), Laporan Posisi Keuangan / Neraca (Balance Sheet), dan Laporan Arus Kas (Cash Flow) Metode Langsung.
```

### PROMPT 2: Desain Layout ERP Modern (Sidebar Lipat & Two-Tier Header)
```text
Buatkan layout ERP ala Kledo / SaaS profesional dengan spesifikasi:
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
   - Tampilkan underline sub-tab navigasi yang tersinkronisasi otomatis saat modul Penjualan, Pembelian, Kasir, atau Stok dipilih.
```

### PROMPT 3: Laporan Keuangan Standar SAK EMKM & Visualisasi Recharts
```text
Implementasikan modul Laporan Keuangan Lengkap (FinancialStatements.tsx):
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
4. Neraca Saldo & Buku Besar per Akun dengan filter rentang tanggal.
```

### PROMPT 4: Modul Penjualan & Pembelian (Sales & Purchases Overview dengan Speedometer Gauge)
```text
Bangun modul Overview Penjualan (SalesOverview.tsx) dan Overview Pembelian (PurchaseOverview.tsx) dengan visualisasi ala Kledo ERP:
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
     * Animasi jarum menggunakan Framer Motion `<motion.g animate={{ rotate: needleAngle }} transition={{ type: "spring", stiffness: 90, damping: 15 }} style={{ transformOrigin: "100px 95px" }}>` untuk memastikan jarum TIDAK lompat-lompat atau glitch saat tombol Hari, Bulan, dan Tahun diklik.
3. Baris 2 - Grafik Analitik:
   - Grouped Bar Chart perbandingan Tagihan vs Pesanan.
   - Line Chart tren Pembayaran.
   - Donut Chart breakdown Produk Terlaris/Dibeli (toggle Jenis vs Kategori).
   - Donut Chart breakdown Pelanggan / Vendor Pemasok dengan carousel dots.
4. Baris 3 - Alur Proses Belum Selesai (Chevron Process Flow):
   - 4 kartu panah chevron interaktif (Penawaran -> Pesanan -> Pengiriman -> Tagihan).
   - Dapat diklik untuk membuka sub-tab terkait di modul manager.
```

### PROMPT 5: Kasir Cepat (Point of Sale), Pajak PPN & Inventori HPP Rata-Rata
```text
Tambahkan fitur operasional kasir dan inventori:
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
   - Rekap faktur pajak PPN Masukan vs PPN Keluaran.
```

### PROMPT 6: Asisten AI Akuntansi Finansial (Gemini API)
```text
Integrasikan Asisten AI Akuntansi Cerdas (AiAssistant.tsx):
1. Menggunakan SDK resmi @google/genai TypeScript dengan model gemini-2.5-flash.
2. Endpoint server-side proxy aman di server.ts: POST /api/chat.
3. Sistem prompt asisten bertindak sebagai "Senior Akuntan Publik Bersertifikat SAK EMKM Indonesia":
   - Mampu menganalisis neraca saldo dan rasio likuiditas/solvabilitas toko secara real-time.
   - Menghitung margin laba kotor, margin laba bersih, rasio perputaran persediaan.
   - Memberikan 3 rekomendasi taktis bisnis berbahasa Indonesia yang ramah bagi pelaku UMKM.
```

---

## 3. SPESIFIKASI MODEL DATA (SCHEMA TYPESCRIPT)

Simpan definisi tipe ini pada `/src/types.ts`:

```typescript
export interface Transaction {
  id: string;
  date: string; // Format YYYY-MM-DD
  type: 
    | "Penjualan" 
    | "Penjualan Kredit" 
    | "Penjualan Stok" 
    | "Pembelian" 
    | "Pembelian Stok" 
    | "Pembelian Barang Dagang"
    | "Pelunasan Hutang Usaha"
    | "Pelunasan Piutang"
    | "Beban Operasional" 
    | "Prive" 
    | "Setoran Modal" 
    | "Penyusutan Aset";
  description: string;
  amount: number;
  debitAccount: number;   // Contoh: 1001
  creditAccount: number;  // Contoh: 4001
  category?: string;
  customerName?: string;
  supplierName?: string;
  ppnEnabled?: boolean;
  ppnAmount?: number;
  invoiceId?: string;
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  unit: string;           // pcs, kg, box, liter
  buyPrice: number;       // Harga beli terakhir
  avgCost: number;        // HPP rata-rata berjalan
  sellPrice: number;      // Harga jual reguler
  barcode?: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;     // BILL/2026/001
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
  paymentTerm: string;    // Net 30, Net 15, COD
  notes?: string;
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
    account: string;
    ref?: string;
  }>;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;  // INV/2026/001
  customerName: string;
  transactionDate: string;
  dueDate: string;
  status: "unpaid" | "partial" | "paid";
  items: Array<{
    productName: string;
    qty: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;      // PPN 11%
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
}

export interface StoreConfig {
  storeName: string;
  storeOwner: string;
  businessType: "retail" | "fnb" | "jasa" | "manufaktur";
  address: string;
  phone: string;
  npwp?: string;
  ppnTariff: number;      // 11%
  enableTax: boolean;
  currency: "IDR";
}
```

---

## 4. FORMULA & ALGORITMA AKUNTANSI SAK EMKM

### 4.1 Pemetaan Jurnal Berpasangan (Double-Entry Matrix)

| Jenis Transaksi | Akun Didebit (+) | Akun Dikredit (-) | Keterangan |
|---|---|---|---|
| Penjualan Tunai Kasir | 1001 Kas & Setara Kas | 4001 Pendapatan Usaha | Kas bertambah, pendapatan diakui |
| Penjualan Tunai + PPN 11% | 1001 Kas (111%) | 4001 Penjualan (100%) & 2002 Hutang PPN (11%) | Pencatatan kewajiban pajak titipan |
| HPP Penjualan Barang | 5001 Beban Pokok (HPP) | 1003 Persediaan Barang | HPP diakui saat barang diserahkan |
| Penjualan Kredit (Piutang) | 1004 Piutang Usaha | 4001 Pendapatan Usaha | Tagihan diterbitkan ke pelanggan |
| Pelunasan Piutang | 1001 Kas | 1004 Piutang Usaha | Uang diterima, piutang berkurang |
| Beli Stok Tunai | 1003 Persediaan Barang | 1001 Kas | Kas keluar untuk beli barang |
| Beli Stok Kredit (Tagihan) | 1003 Persediaan Barang | 2001 Hutang Usaha | Stok masuk, timbul tagihan supplier |
| Pelunasan Hutang Supplier | 2001 Hutang Usaha | 1001 Kas / 1002 Bank | Hutang lunas, kas/bank berkurang |
| Bayar Beban Operasional | 6001 - 6006 Beban | 1001 Kas | Beban operasional diakui langsung |
| Setoran Modal Pemilik | 1001 Kas | 3001 Modal Pemilik | Ekuitas awal/tambahan usaha |
| Prive Pemilik | 3003 Prive Pemilik | 1001 Kas | Penarikan dana pribadi pemilik |

### 4.2 Formula Perhitungan HPP Rata-Rata Bergerak (Moving Average Cost)
Ketika terjadi pembelian stok baru:
$$\text{HPP Baru} = \frac{(\text{Qty Lama} \times \text{HPP Rata-rata Lama}) + (\text{Qty Beli Baru} \times \text{Harga Beli Baru})}{\text{Qty Lama} + \text{Qty Beli Baru}}$$

### 4.3 Keseimbangan Neraca SAK EMKM
$$\text{Total Aset} = \text{Aset Lancar} + (\text{Aset Tetap} - \text{Akumulasi Penyusutan})$$
$$\text{Total Liabilitas} = \text{Hutang Usaha} + \text{Hutang Pajak/Beban}$$
$$\text{Total Ekuitas} = \text{Modal Pemilik} + \text{Laba Ditahan} + \text{Laba Bersih Periode Berjalan} - \text{Prive}$$
$$\text{Validasi}: \mathbf{\text{Total Aset} \equiv \text{Total Liabilitas} + \text{Total Ekuitas}}$$

---

## 5. PANDUAN IMPLEMENTASI KOMPONEN KRITIKAL

### 5.1 Implementasi Speedometer Gauge Tanpa Bug "Lompat-Lompat"
Bug jarum tuding melompat (*erratic jumping needle*) yang sering terjadi pada SVG/CSS rotation disebabkan oleh:
1. Nilai rasio pelunasan menghasilkan `NaN` saat total transaksi adalah 0.
2. Perbedaan interpretasi koordinat `transform-origin` antara CSS engine browser dan atribut SVG.
3. Konflik transisi CSS saat data berpindah cepat antar tab "Hari", "Bulan", dan "Tahun".

**Solusi Standar Blueprint**:
```tsx
import { motion } from "framer-motion";

// 1. Guard against NaN & clamp ratio strictly between 0 - 100
const rasioLunas = useMemo(() => {
  if (metrics.sales <= 0) return 0;
  const ratio = Math.round((metrics.paid / metrics.sales) * 100);
  return Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 100) : 0;
}, [metrics.sales, metrics.paid]);

// 2. Map ratio 0% -> -90deg, 50% -> 0deg, 100% -> +90deg
const targetNeedleAngle = useMemo(() => {
  const clamped = Math.min(Math.max(rasioLunas, 0), 100);
  return -90 + (clamped / 100) * 180;
}, [rasioLunas]);

// 3. Render inside SVG with Framer Motion Spring Physics
<svg viewBox="0 0 200 115" className="w-52 h-28 overflow-visible">
  <defs>
    <filter id="needle-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.28" />
    </filter>
  </defs>

  {/* 4 Colored Arcs: Cyan, Yellow, Orange, Coral */}
  <path d="M 28 95 A 72 72 0 0 1 49 44" fill="none" stroke="#38bdf8" strokeWidth="16" strokeLinecap="round" />
  <path d="M 49 44 A 72 72 0 0 1 100 23" fill="none" stroke="#facc15" strokeWidth="16" />
  <path d="M 100 23 A 72 72 0 0 1 151 44" fill="none" stroke="#fb923c" strokeWidth="16" />
  <path d="M 151 44 A 72 72 0 0 1 172 95" fill="none" stroke="#f87171" strokeWidth="16" strokeLinecap="round" />

  {/* Framer Motion Needle Group - Eliminates Any Jumps */}
  <motion.g 
    animate={{ rotate: targetNeedleAngle }}
    transition={{ type: "spring", stiffness: 90, damping: 15, mass: 0.6 }}
    style={{ transformOrigin: "100px 95px" }}
    filter="url(#needle-shadow)"
  >
    <polygon points="100,32 97.4,95 98.4,103 100,104" fill="#0f172a" />
    <polygon points="100,32 102.6,95 101.6,103 100,104" fill="#334155" />
    <polygon points="100,32 98.8,44 101.2,44" fill="#ef4444" />
  </motion.g>

  {/* Pivot Cap */}
  <circle cx="100" cy="95" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
  <circle cx="100" cy="95" r="4" fill="#475569" />
  <circle cx="100" cy="95" r="1.5" fill="#ffffff" />
</svg>
```

### 5.2 Alur Sinkronisasi Tab & Sub-Tab Multi-Level
Agar navbar atas, sidebar kiri, dan breadcrumbs selalu selaras:
1. `activeTab`: Menentukan domain utama (`dashboard`, `pos`, `penjualan`, `pembelian`, `stok`, `laporan`, `pajak`).
2. `activeSubFilter`: Menentukan sub-halaman aktif (`overview`, `tagihan`, `piutang`, `pengiriman`, `pesanan`, `penawaran`, `labarugi`, `neraca`, dsb.).
3. Saat pengguna mengklik domain utama di sidebar atau link breadcrumb tanpa sub-filter, aplikasi otomatis mengarahkan ke sub-filter default (contoh: `penjualan` -> `overview`, `pembelian` -> `overview`).

---

## 6. CARA MENGGUNAKAN BLUEPRINT INI UNTUK PROYEK MASA DEPAN

1. **Pembuatan Proyek Baru**: Jalankan template React Vite TypeScript:
   ```bash
   npm create vite@latest my-accounting-app -- --template react-ts
   cd my-accounting-app
   npm install lucide-react recharts framer-motion xlsx jspdf html2canvas @google/genai
   npm install -D tailwindcss @tailwindcss/vite
   ```
2. **Kirimkan Master Prompt**: Kirimkan isi dari **PROMPT 1** hingga **PROMPT 6** secara berurutan ke AI Studio / Coding Agent.
3. **Uji Validasi Finansial**:
   - Masukkan transaksi penjualan tunai: pastikan Kas dan Pendapatan bertambah, Laba Rugi bertambah.
   - Beli stok barang: pastikan Persediaan bertambah dan Kas/Hutang tercatat.
   - Periksa Neraca: pastikan Total Aset selalu sama persis dengan Total Liabilitas + Ekuitas.
   - Uji Cetak: pastikan tampilan cetak A4 dan struk kasir rapi tanpa terpotong.

---
*Dokumen ini dibuat otomatis sebagai panduan arsitektur baku sistem Akuntan AI UMKM (SAK EMKM).*
