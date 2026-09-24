import { Account } from "../types";

export const CHART_OF_ACCOUNTS: Account[] = [
  // 1000 - ASET (ASSETS)
  { id: 1001, name: "Kas & Setara Kas", category: "Aset", normalBalance: "Debit" },
  { id: 1002, name: "Piutang Usaha", category: "Aset", normalBalance: "Debit" },
  { id: 1003, name: "Persediaan Barang Dagang", category: "Aset", normalBalance: "Debit" },
  { id: 1004, name: "PPN Masukan (Pajak Pembelian)", category: "Aset", normalBalance: "Debit" },
  { id: 1005, name: "Aset Tetap - Peralatan & Inventaris Furniture", category: "Aset", normalBalance: "Debit" },
  
  // 2000 - LIABILITAS (LIABILITIES)
  { id: 2001, name: "Utang Usaha", category: "Liabilitas", normalBalance: "Kredit" },
  { id: 2002, name: "Utang Pajak PPh 4(2) Final", category: "Liabilitas", normalBalance: "Kredit" },
  { id: 2003, name: "PPN Keluaran (Pajak Penjualan)", category: "Liabilitas", normalBalance: "Kredit" },
  { id: 2004, name: "Utang Gaji & Biaya Masih Harus Dibayar", category: "Liabilitas", normalBalance: "Kredit" },
  
  // 3000 - EKUITAS (EQUITY)
  { id: 3001, name: "Modal Pemilik", category: "Ekuitas", normalBalance: "Kredit" },
  { id: 3002, name: "Prive Pemilik", category: "Ekuitas", normalBalance: "Debit" },
  { id: 3003, name: "Saldo Laba (Retained Earnings)", category: "Ekuitas", normalBalance: "Kredit" },
  
  // 4000 - PENDAPATAN (REVENUE)
  { id: 4001, name: "Pendapatan Penjualan", category: "Pendapatan", normalBalance: "Kredit" },
  
  // 5000 - BEBAN POKOK (COST OF GOODS SOLD)
  { id: 5001, name: "Harga Pokok Penjualan (HPP)", category: "Beban Pokok", normalBalance: "Debit" },
  
  // 6000 - BEBAN OPERASIONAL (OPERATIONAL EXPENSES)
  { id: 6001, name: "Beban Gaji & Upah Karyawan", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6002, name: "Beban Sewa Ruko/Tempat", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6003, name: "Beban Listrik, Air & Gas", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6004, name: "Beban Internet, Pulsa & Komunikasi", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6005, name: "Beban Perlengkapan & ATK Toko", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6006, name: "Beban Pemasaran & Promosi", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6007, name: "Beban Pemeliharaan & Perbaikan", category: "Beban Operasional", normalBalance: "Debit" },
  { id: 6008, name: "Beban Operasional Lain-lain", category: "Beban Operasional", normalBalance: "Debit" },
];

export function getAccountName(id: number): string {
  const acc = CHART_OF_ACCOUNTS.find(a => a.id === id);
  return acc ? acc.name : `Akun #${id}`;
}

export function getAccountCategory(id: number): string {
  const acc = CHART_OF_ACCOUNTS.find(a => a.id === id);
  return acc ? acc.category : "Lainnya";
}
