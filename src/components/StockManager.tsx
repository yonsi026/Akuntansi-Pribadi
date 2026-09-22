import React, { useState } from "react";
import { 
  Plus, 
  Tag, 
  Boxes, 
  TrendingUp, 
  AlertTriangle,
  ShoppingBag,
  Trash2
} from "lucide-react";
import { StockItem } from "../types";
import { formatIDR } from "./FinanceDashboard";

interface StockManagerProps {
  stockItems: StockItem[];
  onAddStockItem: (item: Omit<StockItem, "id" | "purchaseHistory"> & { initialCost?: number }) => void;
  onDeleteStockItem: (id: string) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  stockItems,
  onAddStockItem,
  onDeleteStockItem
}) => {
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [unit, setUnit] = useState<string>("Pcs");
  const [initialStock, setInitialStock] = useState<number>(0);
  const [initialCost, setInitialCost] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);

  // Validation States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Mandatory text validation
    if (!name.trim()) {
      setErrorMsg("Nama produk tidak boleh kosong!");
      return;
    }

    // 2. No negative number validation
    if (initialStock < 0) {
      setErrorMsg("Stok awal tidak boleh negatif!");
      return;
    }
    if (initialCost < 0) {
      setErrorMsg("Harga beli awal (HPP) tidak boleh negatif!");
      return;
    }
    if (sellPrice < 0) {
      setErrorMsg("Harga jual pasar tidak boleh negatif!");
      return;
    }

    const calculatedSku = sku.trim() || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    onAddStockItem({
      name: name.trim(),
      sku: calculatedSku,
      unit,
      stock: initialStock,
      avgPurchasePrice: initialCost,
      sellPrice,
      initialCost: initialStock > 0 ? initialCost : 0
    });

    // Reset Form
    setName("");
    setSku("");
    setInitialStock(0);
    setInitialCost(0);
    setSellPrice(0);
    setSuccessMsg("Produk baru berhasil didaftarkan!");
    
    // Auto clear success in 5 seconds
    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  const totalInventoryAssetVal = stockItems.reduce((acc, item) => acc + (item.stock * item.avgPurchasePrice), 0);
  const totalItemCategories = stockItems.length;

  // Find items requiring restock (stock < 5)
  const lowStockItems = stockItems.filter(item => item.stock < 5);

  return (
    <div className="space-y-6" id="stock-manager">
      {/* Top micro summary stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total asset valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nilai Total Aset Persediaan</span>
            <span className="text-xl font-bold font-mono text-slate-800 block mt-1">{formatIDR(totalInventoryAssetVal)}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Akun Aset Lancar (1003)</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Total categories */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jumlah Macam Produk</span>
            <span className="text-xl font-bold font-mono text-slate-800 block mt-1">{totalItemCategories} Jenis</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Katalog aktif toko Anda</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Low inventory alert */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Kritis Stok (Menipis)</span>
            <span className={`text-xl font-bold font-mono block mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {lowStockItems.length} Produk
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Konsentrasi stok di bawah 5 unit</span>
          </div>
          <div className={`p-3 rounded-xl ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Daftarkan Produk Baru</h3>
            <p className="text-xs text-slate-400 mb-1">Tambahkan produk katalog untuk kalkulasi HPP dan penjualan stok retail</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {/* Validation Messages */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SKU and Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nama Produk</label>
              <input
                type="text"
                required
                placeholder="Misal: Indomie Goreng Spesial, Minyak Kita 1L, dll"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-slate-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kode SKU (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: IND-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-slate-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Satuan Produk</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-slate-500 outline-none"
                >
                  <option value="Pcs">Pcs (Keping/Buah)</option>
                  <option value="Box">Box (Kotak/Kardus)</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Liter">Liter</option>
                  <option value="Pack">Pack (Bungkus)</option>
                  <option value="Botol">Botol</option>
                  <option value="Karung">Karung</option>
                </select>
              </div>
            </div>

            {/* Price setup */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Harga Beli Awal (Rupiah)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="HPP awal"
                  value={initialCost || ""}
                  onChange={(e) => setInitialCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Harga Jual Pasar (Rupiah)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Retail Price"
                  value={sellPrice || ""}
                  onChange={(e) => setSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            {/* Initial Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Stok Awal Fisik</label>
              <input
                type="number"
                min="0"
                required
                placeholder="Misal: 50"
                value={initialStock}
                onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-mono"
              />
              {initialStock > 0 && initialCost > 0 && (
                <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                  Membentuk saldo awal persediaan Rp {(initialStock * initialCost).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Daftarkan Ke Toko
            </button>
          </form>
        </div>

        {/* Stock list table Grid */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Katalog Stok &amp; Nilai HPP SAK EMKM</h3>
            <p className="text-xs text-slate-400">Harga Beli Rata-Rata dihitung secara presisi menggunakan metode Saldo Berjalan (Moving Average)</p>
          </div>

          {stockItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Katalog produk masih kering.</p>
              <p className="text-[11px]">Tambahkan produk perdana Anda di formulir pendaftaran sisi kiri.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">SKU / Nama</th>
                    <th className="px-4 py-3 text-center">Unit Stok</th>
                    <th className="px-4 py-3 text-right">Harga Beli (HPP)</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                    <th className="px-4 py-3 text-center">Margin Kotor</th>
                    <th className="px-4 py-3 text-right">Total Nilai</th>
                    <th className="px-4 py-3 text-center rounded-r-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stockItems.map((item) => {
                    const totalValue = item.stock * item.avgPurchasePrice;
                    // Gross margin percentage
                    const margin = item.sellPrice > 0 
                      ? Math.round(((item.sellPrice - item.avgPurchasePrice) / item.sellPrice) * 100) 
                      : 0;

                    const isLow = item.stock < 5;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        {/* Name/SKU */}
                        <td className="px-4 py-3.5">
                          <span className="block font-bold text-slate-800">{item.name}</span>
                          <span className="block text-[10px] font-mono text-slate-400">{item.sku}</span>
                        </td>
                        
                        {/* Stock count */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isLow 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100 font-mono' 
                              : 'bg-slate-100 text-slate-800 font-mono'
                          }`}>
                            {item.stock} {item.unit}
                          </span>
                          {isLow && (
                            <span className="block text-[9px] text-amber-600 font-bold mt-1">Stok Menipis!</span>
                          )}
                        </td>

                        {/* Avg Purchase Cost HPP */}
                        <td className="px-4 py-3.5 text-right font-mono text-slate-750 font-semibold">
                          {formatIDR(item.avgPurchasePrice)}
                        </td>

                        {/* Retail sell price */}
                        <td className="px-4 py-3.5 text-right font-mono text-slate-850 font-semibold">
                          {formatIDR(item.sellPrice)}
                        </td>

                        {/* Margin indicator */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            margin >= 30 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : margin >= 15 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            {margin}%
                          </span>
                        </td>

                        {/* Total active value */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 bg-slate-50/20">
                          {formatIDR(totalValue)}
                        </td>

                        {/* Delete trigger */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus produk "${item.name}" dari katalog?`)) {
                                onDeleteStockItem(item.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
