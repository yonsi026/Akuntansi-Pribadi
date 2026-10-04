import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Store, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  RotateCcw, 
  Percent, 
  Tag, 
  X, 
  Barcode, 
  User, 
  Clock, 
  ArrowRight,
  Calculator,
  AlertCircle
} from "lucide-react";
import { StockItem, StoreConfig, Transaction, UserAccount } from "../types";
import { formatIDR } from "./FinanceDashboard";
import { printInPageDOM } from "../utils/printHelper";
import { UniversalPrintModal } from "./UniversalPrintModal";

export interface CartItem {
  id: string;
  stockItemId: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  discountPercent: number;
}

interface PointOfSaleProps {
  storeConfig: StoreConfig;
  stockItems: StockItem[];
  currentUser?: UserAccount | null;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onDeductStock?: (stockItemId: string, qty: number) => void;
  onNavigateToTab?: (tab: string, sub?: string) => void;
}

export const PointOfSale: React.FC<PointOfSaleProps> = ({
  storeConfig,
  stockItems = [],
  currentUser,
  onAddTransaction,
  onDeductStock,
  onNavigateToTab
}) => {
  // POS States
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("Pelanggan Umum (Walk-in)");
  
  // Tax Calculator states for POS
  const [enablePpn, setEnablePpn] = useState<boolean>(true); // Opsional PPN 11%
  const [priceIncludesTax, setPriceIncludesTax] = useState<boolean>(false);
  const [taxRate] = useState<number>(11); // Standard 11%
  const [cartDiscountPercent, setCartDiscountPercent] = useState<number>(0);

  // Checkout Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "qris" | "transfer" | "debit">("tunai");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [completedTx, setCompletedTx] = useState<{
    receiptNumber: string;
    date: string;
    time: string;
    items: CartItem[];
    subtotal: number;
    ppn: number;
    discount: number;
    total: number;
    cash: number;
    change: number;
    method: string;
    customer: string;
  } | null>(null);

  // Print States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalHtml, setPrintModalHtml] = useState("");
  const [printModalTitle, setPrintModalTitle] = useState("");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Available categories derived from stock items
  const categories = useMemo(() => {
    return [
      { id: "all", label: "Semua Produk" },
      { id: "sembako", label: "Sembako" },
      { id: "makanan", label: "Makanan & Minuman" },
      { id: "pakaian", label: "Pakaian / Fashion" },
      { id: "kebutuhan", label: "Kebutuhan Toko" }
    ];
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return stockItems.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedCategory === "all") return matchSearch;
      if (selectedCategory === "sembako") {
        return matchSearch && (p.name.toLowerCase().includes("beras") || p.name.toLowerCase().includes("minyak") || p.name.toLowerCase().includes("gula") || p.name.toLowerCase().includes("telur") || p.name.toLowerCase().includes("tepung"));
      }
      if (selectedCategory === "makanan") {
        return matchSearch && (p.name.toLowerCase().includes("kopi") || p.name.toLowerCase().includes("mie") || p.name.toLowerCase().includes("teh") || p.name.toLowerCase().includes("susu") || p.name.toLowerCase().includes("snack"));
      }
      if (selectedCategory === "pakaian") {
        return matchSearch && (p.name.toLowerCase().includes("baju") || p.name.toLowerCase().includes("kaos") || p.name.toLowerCase().includes("celana") || p.name.toLowerCase().includes("sarung") || p.name.toLowerCase().includes("kain"));
      }
      return matchSearch;
    });
  }, [stockItems, searchQuery, selectedCategory]);

  // Handle Add Product to Cart
  const handleAddToCart = (product: StockItem) => {
    if (product.stock <= 0) {
      alert(`Stok produk "${product.name}" habis!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.stockItemId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit})!`);
          return prev;
        }
        return prev.map(item => 
          item.stockItemId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: `cart-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
            stockItemId: product.id,
            sku: product.sku,
            name: product.name,
            unit: product.unit,
            price: product.sellPrice,
            quantity: 1,
            discountPercent: 0
          }
        ];
      }
    });
  };

  // Handle Barcode Scanner Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;
    const found = stockItems.find(p => 
      p.sku.toLowerCase() === barcodeQuery.trim().toLowerCase() ||
      p.name.toLowerCase().includes(barcodeQuery.trim().toLowerCase())
    );
    if (found) {
      handleAddToCart(found);
      setBarcodeQuery("");
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeQuery}" tidak ditemukan!`);
    }
  };

  // Cart Qty Adjustments
  const handleUpdateQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartId) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return null;
        // Check stock
        const origStock = stockItems.find(s => s.id === item.stockItemId);
        if (origStock && nextQty > origStock.stock) {
          alert(`Maksimal stok tersedia adalah ${origStock.stock} ${item.unit}!`);
          return item;
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Apakah Anda yakin ingin mengosongkan keranjang belanja?")) {
      setCart([]);
      setCartDiscountPercent(0);
    }
  };

  // --- AUTOMATIC TAX CALCULATIONS (PPN 11%) ---
  const calculations = useMemo(() => {
    // 1. Raw total from items after per-item discounts
    let rawItemTotal = 0;
    cart.forEach(item => {
      const discMult = 1 - (item.discountPercent || 0) / 100;
      rawItemTotal += item.price * item.quantity * discMult;
    });

    // 2. Global cart discount
    const cartDiscountAmount = Math.round(rawItemTotal * (cartDiscountPercent / 100));
    const subtotalAfterDiscount = Math.max(0, rawItemTotal - cartDiscountAmount);

    let dpp = subtotalAfterDiscount;
    let ppn = 0;

    if (enablePpn) {
      if (priceIncludesTax) {
        // Inclusive: Total = subtotalAfterDiscount, DPP = Total / 1.11, PPN = Total - DPP
        dpp = Math.round(subtotalAfterDiscount / 1.11);
        ppn = subtotalAfterDiscount - dpp;
      } else {
        // Exclusive: PPN 11% added on top of DPP
        dpp = subtotalAfterDiscount;
        ppn = Math.round(dpp * (taxRate / 100));
      }
    }

    const finalTotal = priceIncludesTax 
      ? subtotalAfterDiscount 
      : (dpp + ppn);

    return {
      rawItemTotal,
      cartDiscountAmount,
      dpp,
      ppn,
      finalTotal,
      itemCount: cart.reduce((s, it) => s + it.quantity, 0)
    };
  }, [cart, cartDiscountPercent, enablePpn, priceIncludesTax, taxRate]);

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong! Silakan pilih produk terlebih dahulu.");
      return;
    }
    setCashReceived(calculations.finalTotal);
    setShowCheckoutModal(true);
  };

  // Complete Payment & Save to Accounting
  const handleCompleteCheckout = () => {
    if (paymentMethod === "tunai" && cashReceived < calculations.finalTotal) {
      alert("Jumlah uang tunai yang diterima kurang dari total belanja!");
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5);
    const receiptNumber = `POS/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-4)}`;

    const change = paymentMethod === "tunai" ? Math.max(0, cashReceived - calculations.finalTotal) : 0;

    // 1. Record completed transaction for receipt
    const txSummary = {
      receiptNumber,
      date: dateStr,
      time: timeStr,
      items: [...cart],
      subtotal: calculations.dpp,
      ppn: calculations.ppn,
      discount: calculations.cartDiscountAmount,
      total: calculations.finalTotal,
      cash: paymentMethod === "tunai" ? cashReceived : calculations.finalTotal,
      change,
      method: paymentMethod.toUpperCase(),
      customer: customerName
    };

    setCompletedTx(txSummary);

    // 2. Post to Double-Entry Accounting
    const accountDebit = paymentMethod === "tunai" ? 1001 : 1002; // 1001 Kas Tunai, 1002 Bank
    const debitName = paymentMethod === "tunai" ? "1001 - Kas Tunai Kasir" : "1002 - Rekening Bank/QRIS";

    onAddTransaction({
      date: dateStr,
      description: `Penjualan Kasir POS #${receiptNumber} - ${customerName} (${cart.map(c => `${c.name} x${c.quantity}`).join(", ")})`,
      amount: calculations.finalTotal,
      type: "Penjualan",
      ppnEnabled: enablePpn,
      ppnAmount: calculations.ppn,
      debitAccount: accountDebit,
      creditAccount: 4001,
      customDebitAccountName: debitName,
      customCreditAccountName: "4001 - Pendapatan Penjualan Toko"
    });

    // 3. Deduct Inventory Stock
    if (onDeductStock) {
      cart.forEach(item => {
        onDeductStock(item.stockItemId, item.quantity);
      });
    }

    // 4. Generate Thermal Receipt HTML
    const thermalHtml = generateThermalReceiptHtml(txSummary);
    setPrintModalHtml(thermalHtml);
    setPrintModalTitle(`Struk Kasir ${receiptNumber}`);

    // Auto-trigger direct hardware print for cashier speed
    printInPageDOM(thermalHtml, `Struk Kasir ${receiptNumber}`);
    setShowPrintModal(true);

    // Reset Cart
    setCart([]);
    setShowCheckoutModal(false);
  };

  // Generate 58mm / 80mm Thermal Receipt Document
  const generateThermalReceiptHtml = (tx: typeof completedTx) => {
    if (!tx) return "";
    const companyName = storeConfig.storeName || "Toko Sembako Berkah Mandiri";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");
    const cashierName = currentUser?.name || "Kasir Utama";

    return `
      <div class="printable-document" style="font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; width: 340px; margin: 0 auto; padding: 16px; color: #000; background: #fff; font-size: 11px; line-height: 1.35;">
        <!-- Kop Toko -->
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 8px;">
          <h2 style="font-size: 15px; font-weight: 900; margin: 0; text-transform: uppercase;">${companyName}</h2>
          ${companyAddress ? `<p style="font-size: 10px; margin: 2px 0 0 0;">${companyAddress}</p>` : ""}
          <p style="font-size: 9px; margin: 2px 0 0 0; color: #444;">SAK EMKM - Sistem Kasir POS Resmi</p>
        </div>

        <!-- Meta Struk -->
        <table style="width: 100%; font-size: 10px; margin-bottom: 8px; border-collapse: collapse;">
          <tr>
            <td style="padding: 1px 0;">No. Struk:</td>
            <td style="text-align: right; font-weight: 700;">${tx.receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;">Waktu:</td>
            <td style="text-align: right;">${tx.date} ${tx.time}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;">Kasir:</td>
            <td style="text-align: right;">${cashierName}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;">Pelanggan:</td>
            <td style="text-align: right;">${tx.customer}</td>
          </tr>
        </table>

        <!-- Garis Pemisah -->
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <!-- Item Penjualan -->
        <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 8px;">
          ${tx.items.map(it => `
            <tr>
              <td colspan="2" style="padding-top: 4px; font-weight: 700;">${it.name}</td>
            </tr>
            <tr style="border-bottom: 1px dotted #ccc;">
              <td style="padding-bottom: 4px; color: #333;">
                ${it.quantity} ${it.unit} x ${formatIDR(it.price)}
                ${it.discountPercent > 0 ? ` (Disc ${it.discountPercent}%)` : ""}
              </td>
              <td style="text-align: right; padding-bottom: 4px; font-weight: 700;">
                ${formatIDR(it.quantity * it.price * (1 - it.discountPercent / 100))}
              </td>
            </tr>
          `).join("")}
        </table>

        <!-- Ringkasan Perhitungan & Pajak PPN 11% -->
        <div style="border-top: 1px dashed #000; padding-top: 6px; margin-bottom: 8px;">
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0;">Subtotal (DPP):</td>
              <td style="text-align: right; font-family: monospace;">${formatIDR(tx.subtotal)}</td>
            </tr>
            ${tx.discount > 0 ? `
              <tr>
                <td style="padding: 2px 0;">Diskon Faktur:</td>
                <td style="text-align: right; font-family: monospace; color: #b91c1c;">-${formatIDR(tx.discount)}</td>
              </tr>
            ` : ""}
            ${tx.ppn > 0 ? `
              <tr>
                <td style="padding: 2px 0; font-weight: 700;">PPN (11%):</td>
                <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatIDR(tx.ppn)}</td>
              </tr>
            ` : ""}
            <tr style="font-size: 12px; font-weight: 900; border-top: 1px solid #000; border-bottom: 1px solid #000;">
              <td style="padding: 6px 0;">TOTAL:</td>
              <td style="text-align: right; font-family: monospace;">${formatIDR(tx.total)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0 2px 0;">Bayar (${tx.method}):</td>
              <td style="text-align: right; font-family: monospace;">${formatIDR(tx.cash)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">Kembalian:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700;">${formatIDR(tx.change)}</td>
            </tr>
          </table>
        </div>

        <!-- Footer Struk -->
        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 9px;">
          <p style="margin: 0; font-weight: 700;">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
          <p style="margin: 2px 0 0 0; color: #555;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 8px; color: #777;">Struk Sah Transaksi Kasir POS</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs text-slate-800" id="point-of-sale-module">
      
      {/* 1. Header Bar Kasir POS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Kasir (POS)</h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Kasir: <strong className="text-slate-800">{currentUser?.name || "Budi Santoso"}</strong> &bull; {storeConfig.storeName || "Toko Sembako Berkah Mandiri"} &bull; Penerimaan masuk ke <span className="font-semibold text-slate-700">Akun Kas 1001</span>
            </p>
          </div>
        </div>

        {/* Quick Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              placeholder="Scan Barcode / Tekan Enter untuk input cepat..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            + Masuk
          </button>
        </form>
      </div>

      {/* 2. Main POS Split View: Left (Catalog) + Right (Cart & Tax Calculator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search & Category Pills */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, SKU, atau kategori..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.stockItemId === product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition cursor-pointer relative overflow-hidden group select-none ${
                    isOutOfStock 
                      ? "border-slate-200 opacity-60 cursor-not-allowed bg-slate-50"
                      : inCart
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs hover:border-blue-600"
                        : "border-slate-200/90 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block mb-1">
                      {product.sku || "PROD"}
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight group-hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                      <span className="font-mono font-extrabold text-blue-600 text-xs">
                        {formatIDR(product.sellPrice)}
                      </span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      product.stock > 10 
                        ? "bg-slate-100 text-slate-600" 
                        : product.stock > 0 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-rose-100 text-rose-800"
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-slate-700 text-xs">Tidak ada produk ditemukan</p>
              <p className="text-[11px]">Coba cari dengan kata kunci lain atau pilih kategori Semua Produk.</p>
            </div>
          )}

        </div>

        {/* Right Side: Cart & Kalkulator Pajak (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col sticky top-20">
          
          {/* Cart Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">Keranjang Kasir</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono">
                {calculations.itemCount} Item
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                title="Kosongkan Keranjang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Customer Input */}
          <div className="px-3.5 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama Pelanggan..."
              className="bg-transparent text-xs text-slate-800 font-semibold outline-none flex-1"
            />
          </div>

          {/* Cart Items List */}
          <div className="p-3 max-h-[340px] overflow-y-auto divide-y divide-slate-100 flex-1">
            {cart.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-xs truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatIDR(item.price)} / {item.unit}
                  </div>
                </div>

                {/* Stepper Quantity */}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, -1)}
                    className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal Item */}
                <div className="text-right font-mono font-bold text-slate-900 text-xs w-20 shrink-0">
                  {formatIDR(item.price * item.quantity)}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Hapus item"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-xs">Keranjang masih kosong</p>
                <p className="text-[10px] text-slate-400">Klik produk di sebelah kiri atau scan barcode untuk menambah.</p>
              </div>
            )}
          </div>

          {/* KALKULATOR PAJAK OTOMATIS (PPN 11% OPSIONAL) */}
          <div className="p-3.5 bg-blue-50/60 border-t border-b border-blue-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={enablePpn}
                  onChange={(e) => setEnablePpn(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Hitung PPN 11% Otomatis</span>
                </span>
              </label>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                enablePpn ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {enablePpn ? "PPN 11% Aktif" : "Non-PPN"}
              </span>
            </div>

            {enablePpn && (
              <div className="flex items-center gap-2 text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => setPriceIncludesTax(false)}
                  className={`flex-1 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    !priceIncludesTax
                      ? "bg-white text-blue-700 shadow-2xs border border-blue-200"
                      : "text-slate-600 hover:bg-blue-100/50"
                  }`}
                >
                  Ditambahkan (+11%)
                </button>
                <button
                  type="button"
                  onClick={() => setPriceIncludesTax(true)}
                  className={`flex-1 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    priceIncludesTax
                      ? "bg-white text-blue-700 shadow-2xs border border-blue-200"
                      : "text-slate-600 hover:bg-blue-100/50"
                  }`}
                >
                  Sudah Termasuk PPN
                </button>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="p-3.5 space-y-1.5 text-xs bg-white">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal (DPP)</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatIDR(calculations.dpp)}
              </span>
            </div>

            {enablePpn && (
              <div className="flex justify-between text-blue-700 font-semibold">
                <span>Pajak Pertambahan Nilai (PPN 11%)</span>
                <span className="font-mono">
                  + {formatIDR(calculations.ppn)}
                </span>
              </div>
            )}

            {/* Total Highlight */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900">
              <span className="font-bold text-sm">Total Belanja:</span>
              <span className="font-mono font-black text-xl text-blue-600">
                {formatIDR(calculations.finalTotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95 ${
                cart.length > 0
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Bayar Sekarang ({formatIDR(calculations.finalTotal)})</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. Modal Checkout / Kasir Bayar */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Pembayaran Kasir POS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Total Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Tagihan Kasir
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 block mt-1">
                  {formatIDR(calculations.finalTotal)}
                </span>
                {enablePpn && (
                  <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                    (Sudah termasuk PPN 11% sebesar {formatIDR(calculations.ppn)})
                  </span>
                )}
              </div>

              {/* Metode Pembayaran Tabs */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Metode Pembayaran</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("tunai")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === "tunai"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Tunai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === "qris"
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>QRIS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === "transfer"
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("debit")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === "debit"
                        ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Kartu EDC</span>
                  </button>
                </div>
              </div>

              {/* Uang Diterima & Kembalian (Khusus Tunai) */}
              {paymentMethod === "tunai" && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={cashReceived || ""}
                      onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                      className="w-full text-base font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCashReceived(calculations.finalTotal)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[50000, 100000, 200000, 500000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashReceived(val)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        {formatIDR(val)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Uang Kembalian:</span>
                    <span className="font-mono font-black text-lg text-emerald-700">
                      {formatIDR(Math.max(0, cashReceived - calculations.finalTotal))}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS / Transfer Notice */}
              {paymentMethod !== "tunai" && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Pembayaran Non-Tunai Langsung Terverifikasi</span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Pelunasan tercatat langsung ke Buku Jurnal dan Rekening Kas/Bank SAK EMKM.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCompleteCheckout}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Selesaikan &amp; Cetak Struk</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Universal Print Modal for Thermal Receipt */}
      <UniversalPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={printModalTitle || "Struk Pembelian Kasir"}
        htmlContent={printModalHtml}
      />

    </div>
  );
};
