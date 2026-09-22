import React, { useState } from "react";
import { 
  Store, 
  MapPin, 
  Percent, 
  Calendar, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  User, 
  BookOpen, 
  HelpCircle 
} from "lucide-react";
import { StoreConfig, DemoProduct } from "../types";

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeType: "Toko Sembako",
  storeName: "Toko Sembako Berkah Ibu Mumun",
  storeCity: "Kota Jakarta",
  reportPeriod: "Bulanan",
  taxRate: 0.005,
  demoProducts: [
    {
      name: "Beras Pandan Wangi 5kg",
      sku: "BRS-PW5",
      unit: "Box",
      avgPurchasePrice: 65000,
      sellPrice: 85000
    },
    {
      name: "Minyak Goreng Kita 1 Liter",
      sku: "MNG-KT1",
      unit: "Pcs",
      avgPurchasePrice: 13500,
      sellPrice: 17000
    },
    {
      name: "Telur Ayam Negeri per Kg",
      sku: "TLR-AY1",
      unit: "Kg",
      avgPurchasePrice: 24000,
      sellPrice: 30000
    }
  ]
};

interface StoreSettingsProps {
  config: StoreConfig;
  onSaveConfig: (newConfig: StoreConfig) => void;
  onLoadCustomDemoData: (customConfig: StoreConfig) => void;
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({
  config,
  onSaveConfig,
  onLoadCustomDemoData
}) => {
  const [storeType, setStoreType] = useState<string>(config?.storeType || DEFAULT_STORE_CONFIG.storeType);
  const [storeName, setStoreName] = useState<string>(config?.storeName || DEFAULT_STORE_CONFIG.storeName);
  const [storeCity, setStoreCity] = useState<string>(config?.storeCity || DEFAULT_STORE_CONFIG.storeCity);
  const [reportPeriod, setReportPeriod] = useState<string>(config?.reportPeriod || DEFAULT_STORE_CONFIG.reportPeriod);
  const [taxRate, setTaxRate] = useState<number>(config?.taxRate !== undefined ? config.taxRate : DEFAULT_STORE_CONFIG.taxRate);
  
  // Local state for demo products customization
  const [demoProducts, setDemoProducts] = useState<DemoProduct[]>(
    config?.demoProducts?.length ? config.demoProducts : DEFAULT_STORE_CONFIG.demoProducts
  );

  const [notif, setNotif] = useState<string>("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: StoreConfig = {
      storeType,
      storeName,
      storeCity,
      reportPeriod,
      taxRate,
      demoProducts
    };
    onSaveConfig(updatedConfig);
    setNotif("Profil Toko & Konfigurasi Berhasil Disimpan!");
    setTimeout(() => setNotif(""), 4000);
  };

  const handleAddProduct = () => {
    const nextProd: DemoProduct = {
      name: "Produk Baru",
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      unit: "Pcs",
      avgPurchasePrice: 10000,
      sellPrice: 15000
    };
    setDemoProducts([...demoProducts, nextProd]);
  };

  const handleRemoveProduct = (index: number) => {
    if (demoProducts.length <= 1) {
      alert("Minimal harus memiliki 1 produk contoh untuk demo!");
      return;
    }
    setDemoProducts(demoProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof DemoProduct, value: any) => {
    const updated = [...demoProducts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setDemoProducts(updated);
  };

  const triggerResetDefault = () => {
    if (confirm("Reset seluruh profil ke Toko Sembako Berkah Bu Mumun default?")) {
      setStoreType(DEFAULT_STORE_CONFIG.storeType);
      setStoreName(DEFAULT_STORE_CONFIG.storeName);
      setStoreCity(DEFAULT_STORE_CONFIG.storeCity);
      setReportPeriod(DEFAULT_STORE_CONFIG.reportPeriod);
      setTaxRate(DEFAULT_STORE_CONFIG.taxRate);
      setDemoProducts(DEFAULT_STORE_CONFIG.demoProducts);
      onSaveConfig(DEFAULT_STORE_CONFIG);
      setNotif("Reset ke default berhasil!");
      setTimeout(() => setNotif(""), 4000);
    }
  };

  const handleRegenDemo = () => {
    const updatedConfig: StoreConfig = {
      storeType,
      storeName,
      storeCity,
      reportPeriod,
      taxRate,
      demoProducts
    };
    if (confirm(`Apakah Anda yakin ingin memuat Ulang Data Pembukuan berdasarkan Profil ${storeName} ini? \n\nTindakan ini akan mengosongkan jurnal lama dan menggantinya dengan data historis baru sesuai produk dan profil Anda.`)) {
      onSaveConfig(updatedConfig);
      onLoadCustomDemoData(updatedConfig);
    }
  };

  return (
    <div className="space-y-6" id="store-profile-view">
      
      {/* Page Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-500" />
          Kustomisasi Profil Toko Saya (Context Setup)
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Sesuaikan profil ini dengan nama usaha, lokasi, produk kelolaan Anda, dan setelan pajak agar seluruh laporan keuangan digital dan kecerdasan Akuntan AI beradaptasi otomatis.
        </p>
      </div>

      {notif && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-bold flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {notif}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Store Profile Identity & Taxes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              IDENTITAS USAHA & PAJAK
            </span>

            {/* Shop Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko / Usaha</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: Toko Fashion Trendy"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-slate-500 bg-white"
              />
            </div>

            {/* Shop Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Toko</label>
              <select
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold"
              >
                <option value="Toko Sembako">Toko Sembako / Kelontong</option>
                <option value="Toko Fashion">Toko Fashion &amp; Pakaian</option>
                <option value="Apotek">Apotek &amp; Toko Obat</option>
                <option value="Toko Elektronik">Toko Elektronik &amp; Gadget</option>
                <option value="Warung Kuliner">Warung Bakso / Cafe / Kuliner</option>
                <option value="Lainnya">Lainnya (Penyedia Jasa &amp; Dagang)</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Kota Domisili UMKM
              </label>
              <input
                type="text"
                required
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                placeholder="Contoh: Semarang"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-slate-500 bg-white"
              />
            </div>

            {/* Report Period */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Periode Tutup Buku Laporan
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold"
              >
                <option value="Bulanan">Bulanan (Tutup Buku Setiap Akhir Bulan)</option>
                <option value="Triwulanan">Triwulanan (Per Tiga Bulan)</option>
                <option value="Tahunan">Tahunan (Konsolidasi Per Tahun)</option>
              </select>
            </div>

            {/* Taxes settings */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-600" />
                Tarif Perpajakan UMKM
              </label>
              <select
                value={taxRate.toString()}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-emerald-800"
              >
                <option value="0.005">PPh Final PP 55 / Alur 0.5% dari Omzet Bruto</option>
                <option value="0.0">Bebas Pajak (Omzet Di Bawah Rp 500 Juta Setahun)</option>
                <option value="0.01">UMKM Mandiri / Tarif Khusus 1.0%</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                * Sesuai ketentuan PP 55 Tahun 2022, PPh Final untuk UMKM adalah 0.5% dari omzet penjualan kotor dagang/jasa.
              </p>
            </div>

            {/* Form actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Simpan Profil Toko
              </button>
              <button
                type="button"
                onClick={triggerResetDefault}
                className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
              >
                Reset ke Default Bu Mumun
              </button>
            </div>
          </div>

          {/* SAK EMKM Cheat Sheet */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-3">
            <span className="text-[9px] bg-slate-800 text-slate-300 font-bold tracking-wider px-2 py-0.5 rounded-full uppercase inline-block">
              INFO SAK EMKM KAS &amp; BANK
            </span>
            <p className="text-xs leading-relaxed text-slate-300">
              Sistem ini memfasilitasi otomatisasi penuh. Ketika Anda mencatat transaksi dagang, sistem menyusun entri jurnal berpasangan di belakang layar:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4 leading-relaxed">
              <li><strong>Kas Toko / BCA</strong> otomatis terdebit atau terkredit sesuai dengan rute pemasukan atau pengeluaran.</li>
              <li>Akun kewajiban seperti <strong>Utang Usaha (2001)</strong> didebit-kredit sesuai pembukuan termin tempo supplier.</li>
              <li>Sisa persediaan Anda disusutkan (kredit) dan diposting ke <strong>Beban Pokok Penjualan HPP (5001)</strong> seketika.</li>
            </ul>
          </div>
        </div>

        {/* Right Columns: Demo Products Customization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">PRODUK CONTOH DATA DEMO (INTEGRASI INVENTARIS)</span>
                <p className="text-slate-400 text-xs mt-0.5">Custom katalog barang di bawah sebagai acuan saat tombol "Regenerasi Data Demo" diklik.</p>
              </div>
              <button
                type="button"
                onClick={handleAddProduct}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Produk
              </button>
            </div>

            {/* List input table fields for each product */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {demoProducts.map((prod, index) => (
                <div key={index} className="border border-slate-100 hover:border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row items-stretch gap-4 relative">
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="absolute -top-2 -right-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 p-1.5 rounded-full transition cursor-pointer"
                    title="Hapus Produk Contoh"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 w-full">
                    
                    {/* Name */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Barang Contoh</label>
                      <input
                        type="text"
                        required
                        value={prod.name}
                        onChange={(e) => handleProductChange(index, "name", e.target.value)}
                        placeholder="Nama Produk"
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                      />
                    </div>

                    {/* SKU */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Kode SKU</label>
                      <input
                        type="text"
                        required
                        value={prod.sku}
                        onChange={(e) => handleProductChange(index, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Satuan</label>
                      <select
                        value={prod.unit}
                        onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1 outline-none bg-white"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Kg">Kg</option>
                        <option value="Box">Box</option>
                        <option value="Liter">Liter</option>
                        <option value="Botol">Botol</option>
                        <option value="Unit">Unit</option>
                        <option value="Pasang">Pasang</option>
                      </select>
                    </div>

                    {/* Purchase Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Harga Beli (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={prod.avgPurchasePrice}
                        onChange={(e) => handleProductChange(index, "avgPurchasePrice", Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white text-right"
                      />
                    </div>

                    {/* Sell Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Harga Jual (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={prod.sellPrice}
                        onChange={(e) => handleProductChange(index, "sellPrice", Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-slate-400 bg-white text-right"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Quick Demo Re-generator Box */}
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-center gap-4 justify-between mt-6">
              <div className="space-y-1 flex-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center justify-center sm:justify-start gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  REGENERASI HISTORI DEMO BERDASARKAN PROFIL INI
                </span>
                <p className="text-indigo-900 font-semibold text-xs leading-relaxed max-w-xl">
                  Klik tombol di samping untuk mengosongkan seluruh pembukuan lokal dan mensimulasikan seketika 12 transaksi historis baru menggunakan nama toko "{storeName}" di kota {storeCity} serta produk-produk custom Anda di atas (lengkap dengan kalkulasi HPP Rata-rata dan PPN).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegenDemo}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/20 whitespace-nowrap shrink-0 w-full sm:w-auto text-center"
              >
                Regenerasi Data Demo !
              </button>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
};
