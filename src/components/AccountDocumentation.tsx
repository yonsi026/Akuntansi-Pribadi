import React, { useState } from "react";
import { 
  BookText, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  CheckCircle, 
  Printer, 
  HelpCircle,
  Layers,
  Sparkles,
  Tag,
  ArrowRightLeft,
  Info,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Check,
  FileCheck
} from "lucide-react";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { StoreConfig } from "../types";

interface AccountDetail {
  id: number;
  name: string;
  category: "Aset" | "Liabilitas" | "Ekuitas" | "Pendapatan" | "Beban Pokok" | "Beban Operasional";
  subCategory: string;
  normalBalance: "Debit" | "Kredit";
  reportLocation: "Neraca (Aset)" | "Neraca (Liabilitas)" | "Neraca (Ekuitas)" | "Laporan Laba Rugi (Pendapatan)" | "Laporan Laba Rugi (HPP)" | "Laporan Laba Rugi (Beban Operasional)";
  summary: string;
  description: string;
  debitRule: string;
  creditRule: string;
  exampleTx: string;
  journalDebit: string;
  journalCredit: string;
}

export const ACCOUNT_DOCS: AccountDetail[] = [
  {
    id: 1001,
    name: "Kas & Setara Kas",
    category: "Aset",
    subCategory: "Aset Lancar",
    normalBalance: "Debit",
    reportLocation: "Neraca (Aset)",
    summary: "Uang tunai di kasir fisik toko, saldo rekening giro/tabungan operasional, dan saldo e-wallet/QRIS yang siap digunakan sewaktu-waktu.",
    description: "Akun ini merupakan aset paling likuid milik usaha. Semua transaksi penerimaan uang kas nyata (penjualan tunai, pelunasan utang pelanggan, setoran modal pemilik) atau pengeluaran kas (belanja stok, bayar listrik, bayar gaji) langsung mempengaruhi akun ini.",
    debitRule: "Didebit saat toko MENERIMA uang tunai (saldo kas bertambah).",
    creditRule: "Dikredit saat toko MENGELUARKAN uang tunai (saldo kas berkurang).",
    exampleTx: "Toko menerima pembayaran tunai dari pelanggan sebesar Rp 250.000 atas penjualan barang dagang.",
    journalDebit: "1001 - Kas & Setara Kas (Rp 250.000)",
    journalCredit: "4001 - Pendapatan Penjualan (Rp 250.000)"
  },
  {
    id: 1002,
    name: "Piutang Usaha",
    category: "Aset",
    subCategory: "Aset Lancar",
    normalBalance: "Debit",
    reportLocation: "Neraca (Aset)",
    summary: "Hak tagih atau uang yang belum dibayarkan oleh pelanggan atas barang/jasa yang sudah diserahkan secara kredit (tempo/bon).",
    description: "Digunakan saat toko memberikan fasilitas pembayaran tempo/kredit kepada pelanggan terpercaya atau reseller. Piutang merupakan aset lancar yang akan segera berubah menjadi Kas begitu pelanggan melunasi tagihannya.",
    debitRule: "Didebit saat toko MENJUAL barang secara tempo/bon (piutang bertambah).",
    creditRule: "Dikredit saat pelanggan MELUNASI piutangnya (piutang berkurang karena sudah jadi kas).",
    exampleTx: "Langganan warung membeli sembako senilai Rp 1.000.000 dengan jatuh tempo pembayaran 14 hari.",
    journalDebit: "1002 - Piutang Usaha (Rp 1.000.000)",
    journalCredit: "4001 - Pendapatan Penjualan (Rp 1.000.000)"
  },
  {
    id: 1003,
    name: "Persediaan Barang Dagang",
    category: "Aset",
    subCategory: "Aset Lancar",
    normalBalance: "Debit",
    reportLocation: "Neraca (Aset)",
    summary: "Total nilai perolehan (harga beli modal) barang dagangan yang tersimpan di etalase, rak display, atau gudang dan siap dijual kembali.",
    description: "Akun sentral bagi toko perdagangan ritel/grosir. Setiap pembelian barang dari supplier menambah nilai persediaan ini. Saat barang terjual, nilainya berkurang dan diakui sebagai Harga Pokok Penjualan (HPP).",
    debitRule: "Didebit saat MEMBELI stok barang dagang dari supplier (nilai persediaan bertambah).",
    creditRule: "Dikredit saat barang TERJUAL kepada pembeli (nilai persediaan berkurang, dipindah ke HPP).",
    exampleTx: "Membeli stok 100 pcs barang dagangan @Rp 15.000 dari supplier secara tunai senilai Rp 1.500.000.",
    journalDebit: "1003 - Persediaan Barang Dagang (Rp 1.500.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 1.500.000)"
  },
  {
    id: 1004,
    name: "PPN Masukan (Pajak Pembelian)",
    category: "Aset",
    subCategory: "Aset Lancar (Pajak Dibayar di Muka)",
    normalBalance: "Debit",
    reportLocation: "Neraca (Aset)",
    summary: "Pajak Pertambahan Nilai (PPN 11%/12%) yang dibayarkan toko saat berbelanja persediaan atau aset dari supplier Pengusaha Kena Pajak (PKP).",
    description: "Berfungsi sebagai kredit pajak bagi toko. PPN Masukan ini akan mengurangi jumlah PPN Keluaran yang telah dipungut dari konsumen sebelum disetorkan ke Kas Negara.",
    debitRule: "Didebit saat toko MEMBAYAR PPN atas faktur pembelian barang/jasa dari supplier PKP.",
    creditRule: "Dikredit saat masa pajak berakhir untuk di-offset/dikompensasikan terhadap PPN Keluaran.",
    exampleTx: "Membeli stok dari distributor resmi Rp 2.000.000 ditambah PPN 11% sebesar Rp 220.000 tunai.",
    journalDebit: "1003 - Persediaan (Rp 2.000.000) & 1004 - PPN Masukan (Rp 220.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 2.220.000)"
  },
  {
    id: 1005,
    name: "Aset Tetap - Peralatan Toko",
    category: "Aset",
    subCategory: "Aset Tetap (Tidak Lancar)",
    normalBalance: "Debit",
    reportLocation: "Neraca (Aset)",
    summary: "Barang berwujud dengan masa manfaat lebih dari 1 tahun yang dibeli untuk menunjang operasional toko dan BUKAN untuk dijual kembali.",
    description: "Contohnya: Mesin kasir POS, etalase kaca, rak display minimarket, kulkas pendingin minuman (chiller/showcase), meja kasir, timbangan digital, laptop kasir, dan AC ruangan toko.",
    debitRule: "Didebit saat MEMBELI peralatan baru untuk operasional toko (aset tetap bertambah).",
    creditRule: "Dikredit jika peralatan tersebut DIJUAL bekas, rusak berat, atau dihapusbukukan.",
    exampleTx: "Membeli showcase chiller pendingin minuman baru untuk toko seharga Rp 3.500.000 tunai.",
    journalDebit: "1005 - Aset Tetap - Peralatan Toko (Rp 3.500.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 3.500.000)"
  },
  {
    id: 2001,
    name: "Utang Usaha",
    category: "Liabilitas",
    subCategory: "Liabilitas Jangka Pendek",
    normalBalance: "Kredit",
    reportLocation: "Neraca (Liabilitas)",
    summary: "Kewajiban finansial toko kepada supplier atau distributor atas pembelian stok barang dagang secara tempo (kredit dagang).",
    description: "Kewajiban yang wajib dilunasi dalam tempo singkat (misal 7, 14, 30, atau 60 hari). Mengelola utang usaha dengan tertib menjaga reputasi dan kelancaran pasokan barang dagangan toko.",
    debitRule: "Didebit saat toko MEMBAYAR / MELUNASI utang kepada supplier (utang berkurang).",
    creditRule: "Dikredit saat toko MEMBELI barang dagangan secara tempo/kredit (utang bertambah).",
    exampleTx: "Membeli barang dagangan dari distributor grosir senilai Rp 5.000.000 dengan tempo pembayaran 30 hari.",
    journalDebit: "1003 - Persediaan Barang Dagang (Rp 5.000.000)",
    journalCredit: "2001 - Utang Usaha (Rp 5.000.000)"
  },
  {
    id: 2002,
    name: "Utang Pajak PPh 4(2) Final",
    category: "Liabilitas",
    subCategory: "Liabilitas Jangka Pendek",
    normalBalance: "Kredit",
    reportLocation: "Neraca (Liabilitas)",
    summary: "Kewajiban PPh Final UMKM 0,5% dari omzet bulanan (PP 55/2022) yang sudah dihitung namun belum disetorkan ke Kas Negara.",
    description: "Sesuai regulasi perpajakan Indonesia, UMKM dengan omzet di atas batas PTKP dikenakan PPh Final 0,5%. Akun ini mencatat utang pajak tersebut sampai toko menyetorkannya melalui kode billing sebelum tanggal 15 bulan berikutnya.",
    debitRule: "Didebit saat toko MENYETORKAN uang pajak ke kas negara/bank persepsi via e-Billing.",
    creditRule: "Dikredit saat toko MENGAKUI beban pajak terutang atas omzet penjualan bulan berjalan.",
    exampleTx: "Menyetorkan PPh Final UMKM masa pajak bulan lalu sebesar Rp 120.000 melalui ATM/Internet Banking.",
    journalDebit: "2002 - Utang Pajak PPh 4(2) Final (Rp 120.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 120.000)"
  },
  {
    id: 2003,
    name: "PPN Keluaran (Pajak Penjualan)",
    category: "Liabilitas",
    subCategory: "Liabilitas Jangka Pendek",
    normalBalance: "Kredit",
    reportLocation: "Neraca (Liabilitas)",
    summary: "PPN yang dipungut toko dari konsumen saat melakukan transaksi penjualan barang atau jasa kena pajak.",
    description: "Uang PPN ini bukan merupakan pendapatan toko, melainkan titipan pajak dari konsumen yang wajib disetorkan ke kas negara setelah diperhitungkan (dikurangi) dengan PPN Masukan.",
    debitRule: "Didebit saat akhir masa pajak saat dikompensasikan dengan PPN Masukan atau saat disetor ke kas negara.",
    creditRule: "Dikredit saat toko MEMUNGUT PPN dari konsumen saat transaksi penjualan berlangsung.",
    exampleTx: "Menjual produk seharga Rp 1.000.000 ditambah pungutan PPN 11% sebesar Rp 110.000 secara tunai.",
    journalDebit: "1001 - Kas & Setara Kas (Rp 1.110.000)",
    journalCredit: "4001 - Pendapatan Penjualan (Rp 1.000.000) & 2003 - PPN Keluaran (Rp 110.000)"
  },
  {
    id: 3001,
    name: "Modal Pemilik",
    category: "Ekuitas",
    subCategory: "Modal Saham / Modal Usaha",
    normalBalance: "Kredit",
    reportLocation: "Neraca (Ekuitas)",
    summary: "Total penyertaan uang kas atau aset yang disetorkan oleh pemilik toko ke dalam bisnis untuk memulai atau mengembangkan usaha.",
    description: "Mencerminkan hak residual pemilik atas seluruh aset toko setelah dikurangi seluruh kewajiban utang. Modal bertambah jika pemilik menambah suntikan modal atau jika usaha menghasilkan laba.",
    debitRule: "Didebit jika terjadi pengurangan modal resmi atau likuidasi pembubaran usaha (sangat jarang).",
    creditRule: "Dikredit saat pemilik MENYETORKAN uang kas atau barang sebagai modal usaha.",
    exampleTx: "Pemilik usaha menyetorkan uang tunai sebesar Rp 20.000.000 ke rekening toko sebagai modal awal buka cabang.",
    journalDebit: "1001 - Kas & Setara Kas (Rp 20.000.000)",
    journalCredit: "3001 - Modal Pemilik (Rp 20.000.000)"
  },
  {
    id: 3002,
    name: "Prive Pemilik",
    category: "Ekuitas",
    subCategory: "Akun Kontra Ekuitas",
    normalBalance: "Debit",
    reportLocation: "Neraca (Ekuitas)",
    summary: "Penarikan uang kas atau barang oleh pemilik untuk kepentingan keperluan pribadi, rumah tangga, atau keluarga di luar urusan toko.",
    description: "Merupakan akun pengurang (kontra) dari Modal Pemilik. Penarikan prive bukan merupakan beban operasional toko (tidak boleh mengurangi laba operasional di Laba Rugi), melainkan langsung mengurangi nilai ekuitas di Neraca.",
    debitRule: "Didebit saat pemilik MENGAMBIL uang kas/aset toko untuk keperluan pribadi (prive bertambah).",
    creditRule: "Dikredit pada akhir periode saat dilakukan tutup buku tahunan ke akun Modal Pemilik.",
    exampleTx: "Pemilik mengambil uang kas toko sebesar Rp 1.500.000 untuk membayar uang sekolah anak.",
    journalDebit: "3002 - Prive Pemilik (Rp 1.500.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 1.500.000)"
  },
  {
    id: 3003,
    name: "Saldo Laba (Retained Earnings)",
    category: "Ekuitas",
    subCategory: "Laba Ditahan Akumulatif",
    normalBalance: "Kredit",
    reportLocation: "Neraca (Ekuitas)",
    summary: "Akumulasi keuntungan bersih usaha dari tahun-tahun sebelumnya yang tidak ditarik oleh pemilik, melainkan ditahan untuk memperkuat modal.",
    description: "Setiap akhir tahun buku akuntansi, saldo laba bersih di Laporan Laba Rugi akan dipindahkan ke akun Saldo Laba ini untuk memperbesar modal kerja usaha secara berkelanjutan.",
    debitRule: "Didebit jika usaha mengalami kerugian pada penutupan buku tahunan.",
    creditRule: "Dikredit saat PEMINDAHAN LABA BERSIH tahunan yang berhasil dicetak oleh toko.",
    exampleTx: "Menutup buku tahun berjalan dan membukukan laba bersih tahunan sebesar Rp 35.000.000 ke laba ditahan.",
    journalDebit: "Ikhtisar Laba Rugi (Rp 35.000.000)",
    journalCredit: "3003 - Saldo Laba (Retained Earnings) (Rp 35.000.000)"
  },
  {
    id: 4001,
    name: "Pendapatan Penjualan",
    category: "Pendapatan",
    subCategory: "Pendapatan Utama (Operating Revenue)",
    normalBalance: "Kredit",
    reportLocation: "Laporan Laba Rugi (Pendapatan)",
    summary: "Seluruh omzet penerimaan kotor yang diperoleh toko dari transaksi penjualan produk barang dagangan atau jasa utama kepada pembeli.",
    description: "Menjadi baris paling atas di Laporan Laba Rugi SAK EMKM. Pendapatan ini diakui baik saat pembayaran diterima tunai seketika maupun saat penjualan terjadi secara kredit/tempo (metode akrual).",
    debitRule: "Didebit hanya saat tutup buku akhir periode atau jika terjadi retur penjualan / koreksi faktur.",
    creditRule: "Dikredit setiap kali TERJADI TRANSAKSI PENJUALAN kepada pelanggan (pendapatan bertambah).",
    exampleTx: "Menjual paket sembako senilai Rp 450.000 secara tunai di kasir toko.",
    journalDebit: "1001 - Kas & Setara Kas (Rp 450.000)",
    journalCredit: "4001 - Pendapatan Penjualan (Rp 450.000)"
  },
  {
    id: 5001,
    name: "Harga Pokok Penjualan (HPP)",
    category: "Beban Pokok",
    subCategory: "Beban Langsung (Cost of Goods Sold)",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (HPP)",
    summary: "Biaya modal perolehan (harga beli rata-rata) atas unit barang dagangan yang berhasil terjual kepada konsumen.",
    description: "Fungsi utamanya adalah mempertemukan (matching concept) pendapatan penjualan dengan biaya modal barang tersebut, sehingga menghasilkan Laba Kotor (Gross Profit = Penjualan - HPP). Menggunakan metode persediaan rata-rata tertimbang (Weighted Average).",
    debitRule: "Didebit setiap kali BARANG TERJUAL, sebesar kuantitas terjual dikali harga beli modal rata-rata.",
    creditRule: "Dikredit saat tutup buku tahunan atau retur penjualan yang masuk kembali ke persediaan.",
    exampleTx: "Menjual 10 pcs barang yang harga beli modal rata-ratanya Rp 20.000 per unit (total modal HPP = Rp 200.000).",
    journalDebit: "5001 - Harga Pokok Penjualan (HPP) (Rp 200.000)",
    journalCredit: "1003 - Persediaan Barang Dagang (Rp 200.000)"
  },
  {
    id: 6001,
    name: "Beban Gaji & Upah Karyawan",
    category: "Beban Operasional",
    subCategory: "Beban Personalia",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (Beban Operasional)",
    summary: "Biaya imbalan kerja rutin untuk staf toko, kasir, pramuniaga, kurir, dan karyawan operasional lainnya.",
    description: "Mencakup gaji pokok bulanan, upah harian lepas, uang lembur, tunjangan makan, dan THR hari raya yang diberikan kepada staf yang membantu kelancaran usaha toko.",
    debitRule: "Didebit saat MEMBAYAR atau mengakui kewajiban gaji staf toko (beban gaji bertambah).",
    creditRule: "Dikredit saat penutupan buku tahunan ke Ikhtisar Laba Rugi.",
    exampleTx: "Membayar gaji bulanan 2 orang staf kasir toko sebesar total Rp 3.000.000 tunai.",
    journalDebit: "6001 - Beban Gaji & Upah Karyawan (Rp 3.000.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 3.000.000)"
  },
  {
    id: 6002,
    name: "Beban Sewa Ruko/Tempat",
    category: "Beban Operasional",
    subCategory: "Beban Fasilitas Tempat",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (Beban Operasional)",
    summary: "Pengeluaran sewa tempat usaha toko, ruko, stan pujasera, lapak pasar, atau gudang tempat usaha beroperasi.",
    description: "Beban sewa yang diakui secara proporsional sesuai periode berjalan (bulanan atau tahunan) untuk menyediakan lokasi usaha fisik yang strategis.",
    debitRule: "Didebit saat MEMBAYAR beban sewa tempat usaha untuk periode berjalan.",
    creditRule: "Dikredit saat penutupan buku tahunan ke Ikhtisar Laba Rugi.",
    exampleTx: "Membayar sewa kios toko bulanan sebesar Rp 1.750.000 via transfer bank operasional.",
    journalDebit: "6002 - Beban Sewa Ruko/Tempat (Rp 1.750.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 1.750.000)"
  },
  {
    id: 6003,
    name: "Beban Air, Listrik, & Internet",
    category: "Beban Operasional",
    subCategory: "Beban Utilitas Kantor & Toko",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (Beban Operasional)",
    summary: "Biaya tagihan utilitas harian penunjang toko, meliputi pulsa listrik PLN (token), air bersih PAM/PDAM, koneksi internet Wi-Fi toko, dan pulsa telepon.",
    description: "Pengeluaran rutin wajib setiap bulan agar pendingin lampu toko menyala, sistem komputer kasir terhubung internet, dan fasilitas air toko tetap aktif.",
    debitRule: "Didebit saat MEMBELI token listrik PLN atau membayar tagihan Wi-Fi toko.",
    creditRule: "Dikredit saat penutupan buku tahunan ke Ikhtisar Laba Rugi.",
    exampleTx: "Membayar token listrik PLN Rp 300.000 dan tagihan Wi-Fi Indihome toko Rp 350.000 (total Rp 650.000).",
    journalDebit: "6003 - Beban Air, Listrik, & Internet (Rp 650.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 650.000)"
  },
  {
    id: 6004,
    name: "Beban Pemasaran & Promosi",
    category: "Beban Operasional",
    subCategory: "Beban Pemasaran & Penjualan",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (Beban Operasional)",
    summary: "Biaya yang dikeluarkan untuk mempromosikan toko, menarik pelanggan baru, dan mendongkrak penjualan produk.",
    description: "Contohnya: Cetak spanduk/banner promo toko, cetak brosur/flyer, pasang iklan berbayar (Instagram/Facebook/TikTok Ads), giveaway promosi, dan biaya endorsement mikro.",
    debitRule: "Didebit saat MENGELUARKAN BIAYA untuk materi promosi atau iklan toko.",
    creditRule: "Dikredit saat penutupan buku tahunan ke Ikhtisar Laba Rugi.",
    exampleTx: "Membayar cetak banner spanduk promosi diskon toko senilai Rp 150.000 secara tunai.",
    journalDebit: "6004 - Beban Pemasaran & Promosi (Rp 150.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 150.000)"
  },
  {
    id: 6005,
    name: "Beban Operasional Lain-lain",
    category: "Beban Operasional",
    subCategory: "Beban Operasional Umum & Insidental",
    normalBalance: "Debit",
    reportLocation: "Laporan Laba Rugi (Beban Operasional)",
    summary: "Segala pengeluaran operasional toko berskala kecil atau insidental yang tidak tercakup dalam pos akun 6001 sampai 6004.",
    description: "Contoh praktis: Pembelian kantong kresek/tas belanja plastik, lakban packing, kertas struk thermal, bolpoin/nota kontan, iuran kebersihan & keamanan pasar/lingkungan, serta servis ringan kipas/lampu.",
    debitRule: "Didebit saat MEMBELI perlengkapan kecil atau membayar iuran operasional insidental.",
    creditRule: "Dikredit saat penutupan buku tahunan ke Ikhtisar Laba Rugi.",
    exampleTx: "Membeli 5 rol kantong kresek belanja dan 2 rol lakban packing senilai Rp 85.000 tunai.",
    journalDebit: "6005 - Beban Operasional Lain-lain (Rp 85.000)",
    journalCredit: "1001 - Kas & Setara Kas (Rp 85.000)"
  }
];

export function generateAccountGuideHtml(storeConfig?: StoreConfig): string {
  const storeName = storeConfig?.storeName || "USAHA DAGANG / JASA UMKM";
  const storeType = storeConfig?.storeType || "Perdagangan & Jasa";
  const storeCity = storeConfig?.storeCity || "Indonesia";
  const storeAddress = storeConfig?.storeAddress || "";
  const storeNpwp = storeConfig?.storeNpwp || "";
  const currentDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const accountCardsHtml = ACCOUNT_DOCS.map((acc) => `
    <div class="card-account">
      <div class="card-header">
        <div class="acc-code">
          <span style="color: #4338ca; margin-right: 6px;">${acc.id}</span> &mdash; ${acc.name}
        </div>
        <div>
          <span class="acc-badge" style="background:#e0e7ff; color:#3730a3; margin-right: 4px;">${acc.category}</span>
          <span class="acc-badge" style="background:${acc.normalBalance === 'Debit' ? '#dcfce7; color:#166534;' : '#e0f2fe; color:#075985;'}">Saldo Normal: ${acc.normalBalance}</span>
        </div>
      </div>
      <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 6px;">
        <strong>Sub-Golongan:</strong> ${acc.subCategory} &bull; <strong>Letak Laporan:</strong> ${acc.reportLocation}
      </div>
      <div style="font-size: 9pt; margin-bottom: 6px; line-height: 1.4;">
        <strong>Fungsi:</strong> ${acc.summary}
      </div>
      <div style="font-size: 8.5pt; color: #475569; margin-bottom: 8px; line-height: 1.4;">
        ${acc.description}
      </div>
      <div class="rule-box">
        <div class="rule-debit">
          <strong style="color: #166534;">Kapan Didebit?</strong><br/>
          ${acc.debitRule}
        </div>
        <div class="rule-credit">
          <strong style="color: #075985;">Kapan Dikredit?</strong><br/>
          ${acc.creditRule}
        </div>
      </div>
      <div class="example-box">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 3px;">Contoh Kasus Nyata Transaksi:</div>
        <div style="font-style: italic; color: #475569; margin-bottom: 4px;">&ldquo;${acc.exampleTx}&rdquo;</div>
        <div class="journal-box">
          <div style="color: #166534; font-weight: bold;">(Debit)  ${acc.journalDebit}</div>
          <div style="color: #0369a1; font-weight: bold; padding-left: 20px;">(Kredit) ${acc.journalCredit}</div>
        </div>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buku Panduan Kode Akun SAK EMKM - ${storeName}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 10pt;
      line-height: 1.5;
    }
    .print-control-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-action {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 18px;
      font-size: 9pt;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action:hover {
      background: #4338ca;
    }
    .header-kop {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .kop-title {
      font-size: 16pt;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .kop-meta {
      font-size: 9pt;
      color: #475569;
      margin: 2px 0;
    }
    .badge-doc {
      display: inline-block;
      border: 1.5px solid #0f172a;
      padding: 4px 10px;
      font-size: 8.5pt;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .doc-headline {
      text-align: center;
      margin: 16px 0 24px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    .doc-headline h2 {
      font-size: 13pt;
      font-weight: 800;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-headline p {
      font-size: 8.5pt;
      color: #64748b;
      margin: 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .summary-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f8fafc;
      font-size: 8.5pt;
    }
    .summary-box strong {
      display: block;
      color: #0f172a;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 8.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
    }
    .card-account {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      background: #ffffff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .acc-code {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
    }
    .acc-badge {
      font-size: 7.5pt;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .rule-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 8px 0;
    }
    .rule-debit {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 8pt;
    }
    .rule-credit {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 8pt;
    }
    .example-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      border-radius: 6px;
      margin-top: 8px;
    }
    .journal-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      margin-top: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 8pt;
      border-radius: 4px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      page-break-inside: avoid;
      text-align: center;
      font-size: 8.5pt;
    }
    .sign-line {
      margin-top: 65px;
      border-top: 1px solid #0f172a;
      display: inline-block;
      width: 220px;
      font-weight: bold;
      padding-top: 4px;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
        background: transparent;
      }
    }
  </style>
</head>
<body>
  <div class="print-control-bar no-print">
    <div>
      <div style="font-weight: bold; font-size: 11pt;">Dokumen Siap Cetak / Simpan PDF</div>
      <div style="font-size: 8.5pt; color: #94a3b8;">Format A4 Resmi SAK EMKM &bull; ${storeName}</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-action" onclick="window.print()">
        &#128424; Cetak / Simpan PDF Sekarang
      </button>
      <button class="btn-action" style="background: #334155;" onclick="window.close()">
        Tutup Halaman
      </button>
    </div>
  </div>

  <div class="header-kop">
    <div>
      <h1 class="kop-title">${storeName}</h1>
      <p class="kop-meta">Jenis Usaha: ${storeType} &bull; Wilayah: ${storeCity}</p>
      ${storeAddress ? `<p class="kop-meta">Alamat: ${storeAddress}</p>` : ''}
      ${storeNpwp ? `<p class="kop-meta">NPWP: ${storeNpwp}</p>` : ''}
      <p class="kop-meta" style="color: #64748b; font-size: 8pt;">Pedoman Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)</p>
    </div>
    <div style="text-align: right;">
      <span class="badge-doc">DOKUMEN RESMI</span>
      <p class="kop-meta" style="margin-top: 6px;">Tgl Cetak: ${currentDate}</p>
      <p class="kop-meta" style="font-size: 8pt; color: #64748b;">Ref: EMKM-COA-18</p>
    </div>
  </div>

  <div class="doc-headline">
    <h2>BUKU PANDUAN RESMI KODE AKUN AKUNTANSI (CHART OF ACCOUNTS)</h2>
    <p>Penjelasan Fungsi Akun, Aturan Saldo Normal, Mekanisme Debit/Kredit, dan Contoh Jurnal Berpasangan</p>
  </div>

  <div style="background: #0f172a; color: white; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 8.5pt;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong>RUMUS UTAMA DOUBLE-ENTRY SYSTEM:</strong>
      <span style="font-family: monospace; font-weight: bold; color: #34d399; font-size: 10pt;">ASET = LIABILITAS + EKUITAS</span>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <strong>Kepala 1 - Aset (Harta)</strong>
      Bertambah di Debit (+), Berkurang di Kredit (-). Letak di Neraca (Aktiva).
    </div>
    <div class="summary-box">
      <strong>Kepala 2 - Liabilitas (Utang)</strong>
      Bertambah di Kredit (+), Berkurang di Debit (-). Letak di Neraca (Pasiva).
    </div>
    <div class="summary-box">
      <strong>Kepala 3 - Ekuitas (Modal)</strong>
      Bertambah di Kredit (+), Berkurang di Debit (-). Letak di Neraca (Ekuitas).
    </div>
    <div class="summary-box">
      <strong>Kepala 4 - Pendapatan</strong>
      Bertambah di Kredit (+), Berkurang di Debit (-). Letak di Laba Rugi.
    </div>
    <div class="summary-box">
      <strong>Kepala 5 - Beban Pokok (HPP)</strong>
      Bertambah di Debit (+), Berkurang di Kredit (-). Letak di Laba Rugi.
    </div>
    <div class="summary-box">
      <strong>Kepala 6 - Beban Operasional</strong>
      Bertambah di Debit (+), Berkurang di Kredit (-). Letak di Laba Rugi.
    </div>
  </div>

  <h3 style="font-size: 10pt; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px;">
    TABEL RINGKAS 18 KODE AKUN RESMI SAK EMKM
  </h3>
  <table>
    <thead>
      <tr>
        <th style="width: 50px;">Kode</th>
        <th style="width: 180px;">Nama Akun</th>
        <th style="width: 110px;">Golongan</th>
        <th style="width: 80px;">Saldo Normal</th>
        <th style="width: 140px;">Letak Laporan</th>
        <th>Ringkasan Fungsi</th>
      </tr>
    </thead>
    <tbody>
      ${ACCOUNT_DOCS.map(a => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${a.id}</td>
          <td style="font-weight: 600;">${a.name}</td>
          <td>${a.category}</td>
          <td style="font-weight: bold; color: ${a.normalBalance === 'Debit' ? '#166534' : '#0369a1'};">${a.normalBalance}</td>
          <td>${a.reportLocation}</td>
          <td>${a.summary}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="font-size: 10pt; text-transform: uppercase; margin: 24px 0 12px 0; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px;">
    RINCIAN DETAIL SETIAP AKUN &amp; CONTOH JURNAL TRANSAKSI
  </h3>
  ${accountCardsHtml}

  <div class="signatures">
    <div>
      <p style="font-weight: 600; margin: 0;">Disusun &amp; Dibuat Oleh:</p>
      <p style="color: #64748b; font-size: 7.5pt; margin: 2px 0 0 0;">Petugas Keuangan / Akuntan Toko</p>
      <div class="sign-line">( Petugas Keuangan )</div>
    </div>
    <div>
      <p style="font-weight: 600; margin: 0;">Disetujui &amp; Disahkan Oleh:</p>
      <p style="color: #64748b; font-size: 7.5pt; margin: 2px 0 0 0;">Pimpinan / Pemilik Usaha</p>
      <div class="sign-line">( Pimpinan ${storeName} )</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn("Print trigger error:", e);
        }
      }, 400);
    };
  </script>
</body>
</html>`;
}

interface AccountDocumentationProps {
  storeConfig?: StoreConfig;
}

export const AccountDocumentation: React.FC<AccountDocumentationProps> = ({ storeConfig }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isPreviewA4, setIsPreviewA4] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const categories = ["Semua", "Aset", "Liabilitas", "Ekuitas", "Pendapatan", "Beban Pokok", "Beban Operasional"];

  const filteredAccounts = ACCOUNT_DOCS.filter((acc) => {
    const matchesCategory = selectedCategory === "Semua" || acc.category === selectedCategory;
    const matchesSearch = 
      acc.id.toString().includes(searchQuery) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrintClick = () => {
    setIsPrinting(true);
    setShowPrintModal(true);
    try {
      window.print();
    } catch (e) {
      console.warn("window.print() terpanggil:", e);
    }
    setTimeout(() => {
      setIsPrinting(false);
    }, 800);
  };

  const handleDownloadHtml = () => {
    try {
      const htmlContent = generateAccountGuideHtml(storeConfig);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeStoreName = (storeConfig?.storeName || "Toko").replace(/[^a-zA-Z0-9]/g, "-");
      link.href = url;
      link.download = `Buku-Panduan-Kode-Akun-SAK-EMKM-${safeStoreName}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Gagal mengunduh dokumen:", err);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const htmlContent = generateAccountGuideHtml(storeConfig);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        handleDownloadHtml();
      }
    } catch (err) {
      console.error("Gagal membuka tab baru:", err);
      handleDownloadHtml();
    }
  };

  return (
    <div className={`space-y-6 ${isPreviewA4 ? 'max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300' : ''}`} id="dokumen-panduan-akun">
      {/* Top Banner & Print Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-widest">
              STANDAR AKUNTANSI KEUANGAN EMKM
            </span>
            <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              18 Kode Akun Resmi
            </span>
            {storeConfig?.storeName && (
              <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200">
                {storeConfig.storeName}
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
            <BookText className="w-5 h-5 text-indigo-600" />
            Dokumen Panduan Kode Akun Akuntansi (Chart of Accounts)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Penjelasan komprehensif mengenai fungsi, aturan debit/kredit, contoh transaksi nyata, dan letak masing-masing kode akun pada Laporan Neraca & Laba Rugi usaha Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handlePrintClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Cetak atau Simpan Buku Panduan Akuntansi sebagai PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak Panduan PDF</span>
          </button>

          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Unduh Dokumen Resmi Siap Cetak A4 (.HTML / PDF)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh File Cetak</span>
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200"
            title="Buka Dokumen di Tab Baru Tanpa Pembatas Iframe"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Tab Baru</span>
          </button>

          <button
            onClick={() => setIsPreviewA4(!isPreviewA4)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isPreviewA4 
                ? "bg-amber-100 text-amber-900 border-amber-300" 
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
            title="Pratinjau Kertas Format A4 di Layar"
          >
            {isPreviewA4 ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isPreviewA4 ? "Tutup Pratinjau A4" : "Pratinjau A4"}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE A4 BANNER */}
      {isPreviewA4 && (
        <div className="no-print bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Pratinjau Format Dokumen Kertas A4 Aktif. Halaman ditampilkan dengan Kop Surat resmi dan lembar pengesahan tanda tangan.</span>
          </div>
          <button
            onClick={() => setIsPreviewA4(false)}
            className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-bold transition"
          >
            Kembali
          </button>
        </div>
      )}

      {/* OFFICIAL INDONESIAN ACCOUNTING LETTERHEAD (KOP SURAT) FOR PRINT & PREVIEW */}
      <div className={`${isPreviewA4 ? 'block' : 'hidden print:block'} border-b-2 border-slate-900 pb-4 mb-6`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900 font-sans">
              {storeConfig?.storeName || "BUKU PANDUAN AKUNTANSI UMKM"}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Jenis Usaha: {storeConfig?.storeType || "Perdagangan & Jasa"} &bull; Wilayah: {storeConfig?.storeCity || "Indonesia"}
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
            BAGAN KODE AKUN RESMI (CHART OF ACCOUNTS - SAK EMKM)
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Pedoman Fungsi Akun, Aturan Saldo Normal, Mekanisme Debit/Kredit &amp; Contoh Jurnal Berpasangan
          </p>
        </div>
      </div>

      {/* Golden Accounting Principles Quick Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Rumus Utama Pembukuan Berpasangan (Double-Entry System)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            ASET = LIABILITAS + EKUITAS
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Setiap transaksi keuangan dicatat pada minimal dua akun yang saling berpasangan dengan nilai <strong>Debit = Kredit</strong>. Berikut adalah tabel ringkas perlakuan saldo masing-masing golongan:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 1</span>
            <span className="font-bold text-slate-100 block">ASET</span>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">+ Debit / - Kredit</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 2</span>
            <span className="font-bold text-slate-100 block">LIABILITAS</span>
            <span className="text-[11px] text-sky-400 font-semibold block mt-1">+ Kredit / - Debit</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 3</span>
            <span className="font-bold text-slate-100 block">EKUITAS</span>
            <span className="text-[11px] text-sky-400 font-semibold block mt-1">+ Kredit / - Debit</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 4</span>
            <span className="font-bold text-slate-100 block">PENDAPATAN</span>
            <span className="text-[11px] text-sky-400 font-semibold block mt-1">+ Kredit / - Debit</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 5</span>
            <span className="font-bold text-slate-100 block">BEBAN POKOK</span>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">+ Debit / - Kredit</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-mono">Kepala 6</span>
            <span className="font-bold text-slate-100 block">OPERASIONAL</span>
            <span className="text-[11px] text-emerald-400 font-semibold block mt-1">+ Debit / - Kredit</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (no-print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama akun..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Account Cards Container */}
      <div className="space-y-4 printable-area">
        {filteredAccounts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 space-y-2">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Tidak ditemukan akun yang cocok dengan kata kunci "{searchQuery}"</p>
            <p className="text-[11px] text-slate-400">Silakan ubah kata kunci pencarian atau pilih kategori "Semua".</p>
          </div>
        ) : (
          filteredAccounts.map((acc) => (
            <div 
              key={acc.id}
              id={`akun-${acc.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:border-slate-300 transition space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-extrabold bg-slate-900 text-white px-3 py-1 rounded-xl shadow-xs">
                    {acc.id}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                      {acc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Golongan: <span className="font-semibold text-slate-600">{acc.category}</span> ({acc.subCategory})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Normal balance badge */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border font-mono ${
                    acc.normalBalance === "Debit"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-sky-50 text-sky-800 border-sky-200"
                  }`}>
                    {acc.normalBalance === "Debit" ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    Saldo Normal: {acc.normalBalance}
                  </span>

                  {/* Report Location Badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    {acc.reportLocation}
                  </span>
                </div>
              </div>

              {/* Summary and Description */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-700 leading-relaxed font-medium">
                  {acc.summary}
                </p>
                <p className="text-slate-500 leading-relaxed text-[11.5px]">
                  {acc.description}
                </p>
              </div>

              {/* Debit & Credit Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-emerald-50/70 border border-emerald-150 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Kapan Didebit?</span>
                  </div>
                  <p className="text-emerald-950 text-[11.5px] leading-relaxed">
                    {acc.debitRule}
                  </p>
                </div>

                <div className="bg-sky-50/70 border border-sky-150 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sky-900">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Kapan Dikredit?</span>
                  </div>
                  <p className="text-sky-950 text-[11.5px] leading-relaxed">
                    {acc.creditRule}
                  </p>
                </div>
              </div>

              {/* Real Case Example & Dual Entry */}
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Contoh Kasus Nyata Transaksi Toko:</span>
                </div>
                <p className="text-slate-600 italic text-[11.5px] leading-relaxed">
                  "{acc.exampleTx}"
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                  <div className="text-emerald-700 font-semibold flex items-center justify-between">
                    <span>(Debit) {acc.journalDebit}</span>
                    <span className="text-[10px] text-slate-400 font-sans">Bertambah / Positif</span>
                  </div>
                  <div className="text-sky-700 font-semibold flex items-center justify-between pl-4">
                    <span>(Kredit) {acc.journalCredit}</span>
                    <span className="text-[10px] text-slate-400 font-sans">Penyeimbang Sisi Lain</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Account Feature Guide */}
      <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Tag className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Fitur Tambahan: "+ Tulis Akun Baru (Manual)"
            </h3>
            <p className="text-[11px] text-slate-400">
              Fleksibilitas penambahan pos akun sesuai kebutuhan spesifik unit usaha Anda
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            Selain 18 bagan akun standar SAK EMKM di atas, formulir transaksi Akuntan AI juga menyediakan opsi <strong>+ Tulis Akun Baru (Manual)</strong>. Opsi ini dirancang untuk:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700 text-[11.5px]">
            <li>
              <strong>Pencatatan Rekening Bank Spesifik</strong>: Misalnya memisahkan antara <em>1001-BCA</em>, <em>1001-BRI</em>, atau <em>1001-Mandiri</em>.
            </li>
            <li>
              <strong>Beban Operasional Tambahan</strong>: Misalnya menambah <em>6006 - Beban Transportasi & Bensin</em>, <em>6007 - Beban Konsumsi Rapat</em>, atau <em>6008 - Beban Perbaikan & Pemeliharaan</em>.
            </li>
            <li>
              <strong>Utang Bank Jangka Panjang</strong>: Misalnya mencatat pinjaman modal usaha KUR BRI dengan pos <em>2004 - Utang Bank Jangka Panjang</em>.
            </li>
          </ul>
          <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-xl text-[11px] text-indigo-950 flex items-start gap-2 mt-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tips Penomoran Akun:</strong> Selalu gunakan angka kepala yang sesuai: <strong>1xxx</strong> untuk Aset, <strong>2xxx</strong> untuk Utang/Kewajiban, <strong>3xxx</strong> untuk Modal, <strong>4xxx</strong> untuk Pendapatan, <strong>5xxx</strong> untuk Harga Pokok Penjualan, dan <strong>6xxx</strong> untuk Beban Operasional.
            </span>
          </div>
        </div>
      </div>

      {/* OFFICIAL SIGNATURE BLOCK FOR PRINT & PREVIEW */}
      <div className={`${isPreviewA4 ? 'block' : 'hidden print:block'} mt-10 pt-6 border-t border-slate-300`}>
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="font-semibold text-slate-700">Dibuat &amp; Disusun Oleh:</p>
            <p className="text-[11px] text-slate-500 mb-16">Bagian Keuangan / Pembukuan Toko</p>
            <div className="border-t border-slate-900 w-44 mx-auto pt-1 font-bold text-slate-800">
              ( Petugas Keuangan )
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Disetujui &amp; Disahkan Oleh:</p>
            <p className="text-[11px] text-slate-500 mb-16">Pemilik / Pimpinan Usaha</p>
            <div className="border-t border-slate-900 w-44 mx-auto pt-1 font-bold text-slate-800">
              ( {storeConfig?.storeName ? `Pimpinan ${storeConfig.storeName}` : "Pimpinan Usaha"} )
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CETAK & UNDUH DOKUMEN PANDUAN */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-sans flex items-center gap-2">
                    Cetak &amp; Simpan Dokumen Panduan PDF
                  </h3>
                  <p className="text-xs text-slate-300">
                    Buku Bagan Akun Resmi SAK EMKM &bull; {storeConfig?.storeName || "Usaha Anda"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5 text-indigo-900">Perintah cetak sistem telah dipanggil:</strong>
                  <span>Jika jendela cetak peramban tidak muncul otomatis (karena pembatasan mode iframe pratinjau browser), silakan gunakan opsi praktis di bawah untuk mencetak atau menyimpan dokumen sebagai file PDF.</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option 1: Direct Download HTML Print-Ready */}
                <div className="border border-slate-200 hover:border-indigo-300 rounded-xl p-4 bg-slate-50/60 hover:bg-indigo-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">1. Unduh Dokumen Siap Cetak (.HTML / PDF)</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Paling Direkomendasikan</span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-snug">
                      Format A4 resmi lengkap dengan Kop Surat &amp; tanda tangan. Saat file dibuka di browser, dialog Simpan sebagai PDF langsung muncul otomatis.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Berhasil Diunduh!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Unduh Dokumen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: Open in New Tab */}
                <div className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">2. Buka di Tab Baru Mandiri</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Bebas Iframe</span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-snug">
                      Membuka dokumen pada tab browser baru tanpa terhalang iframe sehingga dialog print (Ctrl+P / Cmd+P) dapat langsung tampil.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenInNewTab}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Buka Tab Baru</span>
                  </button>
                </div>

                {/* Option 3: Retry Browser Print */}
                <div className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-slate-900">3. Panggil Ulang Dialog Cetak Layar</span>
                    <p className="text-[11.5px] text-slate-500 leading-snug">
                      Mencoba memanggil fungsi pencetakan browser kembali pada layar utama.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        window.print();
                      } catch (e) {
                        console.warn(e);
                      }
                    }}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Cetak Layar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsPreviewA4(!isPreviewA4);
                  setShowPrintModal(false);
                }}
                className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isPreviewA4 ? "Matikan Format A4 di Layar" : "Tampilkan Format A4 di Layar"}</span>
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
