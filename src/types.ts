export type AccountCategory = 
  | 'Aset' 
  | 'Liabilitas' 
  | 'Ekuitas' 
  | 'Pendapatan' 
  | 'Beban Pokok' 
  | 'Beban Operasional';

export type NormalBalance = 'Debit' | 'Kredit';

export interface Account {
  id: number; // e.g. 1001
  name: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
}

export type TransactionType =
  | 'Penjualan'          // Penjualan Stok / Barang Dagang
  | 'Pembelian'          // Pembelian Stok / Barang Dagang
  | 'Biaya Operasional'  // Beban Usaha umum
  | 'Gaji Karyawan'      // Gaji & Upah Staf/Karyawan
  | 'Listrik & Air'      // Listrik PLN, Air PDAM, Gas Usaha
  | 'Sewa Toko'          // Sewa Ruko / Tempat Usaha
  | 'Beli Inventaris'    // Aset Tetap: Furniture, Rak, Etalase, AC, Mesin Kasir
  | 'Internet & Pulsa'   // Wifi, Paket Data, Telepon Toko
  | 'Perlengkapan Toko'  // Kantong belanja, kresek, nota, thermal roll, lakban
  | 'Servis & Perbaikan' // Servis AC, perbaikan etalase, pemeliharaan toko
  | 'Penerimaan'         // Capital setoran or miscellaneous income
  | 'Pembayaran Hutang'  // Paying off A/P liability
  | 'Lainnya'            // Custom debits/credits transaction
  | 'Setor Modal'        // Owner investments cash
  | 'Tarik Prive'        // Owner withdraws cash for personal use
  | 'Pembelian Stok'     // Backward compatibility support
  | 'Penjualan Stok'     // Backward compatibility support
  | 'Pengeluaran';       // Backward compatibility support

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // total amount (including PPN if applicable)
  type: TransactionType;
  
  // Bukti transaksi / Nomor faktur (pilihan)
  invoiceNumber?: string;

  // Metadata detail operasional & aset (opsional)
  operationalCategory?: string; // 'Gaji' | 'Listrik' | 'Sewa' | 'Inventaris' | 'Internet' | 'Perlengkapan' | 'Servis'
  employeeName?: string;
  utilityType?: string;
  assetType?: string;
  rentalPeriod?: string;

  // Stock details (optional, only for stock transactions)
  stockItemId?: string;
  stockQuantity?: number;
  stockPricePerUnit?: number;
  
  // Tax calculations
  ppnEnabled: boolean; // PPN 11% applied
  ppnAmount: number;   // 11% of base price
  
  // Double-entry Accounts posted (standard or custom manual ones)
  debitAccount: number;
  creditAccount: number;
  customDebitAccountName?: string;
  customCreditAccountName?: string;
  
  // For stock sales, there is a secondary journal entry to post HPP:
  // Debit: HPP (5001), Credit: Persediaan (1003)
  hppAmountPosted?: number;
}

export interface PurchaseRecord {
  date: string;
  quantity: number;
  pricePerUnit: number;
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string; // e.g., Pcs, Box, Kg, Liter
  stock: number;
  avgPurchasePrice: number; // Moving average purchase cost for HPP calculation
  sellPrice: number;
  purchaseHistory: PurchaseRecord[];
}

export interface JournalEntry {
  id: string; // matches transaction ID or transactionID-HPP
  date: string;
  description: string;
  accountId: number;
  accountName: string;
  debit: number;
  credit: number;
  ref: string; // e.g. "TXN-001", "HPP-001"
}

export interface LedgerItem {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  ref: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FinancialStats {
  revenue: number;      // Total Pendapatan Penjualan
  expenses: number;     // Total Beban Operasional (Beban Gaji + Beban Sewa + Beban Listrik + Beban Lain)
  hpp: number;          // Total Harga Pokok Penjualan (HPP)
  grossProfit: number;  // Pendapatan - HPP
  netProfit: number;    // Gross Profit - Beban Operasional
  pph: number;          // PPh Final UMKM (0.5% of Revenue)
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface DemoProduct {
  name: string;
  sku: string;
  unit: string;
  avgPurchasePrice: number;
  sellPrice: number;
}

export interface StoreConfig {
  storeType: string;         // e.g. "Toko Sembako", "Toko Fashion", "Apotek", "Toko Elektronik"
  storeName: string;         // e.g. "Toko Sembako Berkah"
  storeCity: string;         // e.g. "Jakarta"
  storeAddress?: string;      // e.g. "Jl. Merdeka No. 45"
  storeNpwp?: string;         // e.g. "01.234.567.8-901.000"
  reportPeriod: string;      // e.g. "Bulanan"
  taxRate: number;           // e.g. 0.005
  demoProducts: DemoProduct[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  storeName: string;
  storeType: string;
  storeCity: string;
  storeAddress?: string;
  storeNpwp?: string;
  role: 'owner' | 'accountant' | 'staff';
  createdAt: string;
  lastLoginAt?: string;
  isDemo?: boolean; // Flag if user is accessing in preview/demo mode
}

