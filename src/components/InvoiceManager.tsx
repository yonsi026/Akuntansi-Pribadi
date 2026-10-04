import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Send, 
  MoreVertical, 
  MapPin, 
  Truck, 
  Calendar, 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  FileText, 
  CreditCard, 
  DollarSign, 
  Download, 
  Eye, 
  EyeOff,
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  MessageCircle, 
  Paperclip,
  Store,
  FileSpreadsheet,
  HelpCircle,
  BarChart2,
  Upload,
  Edit3,
  ListFilter,
  ArrowUpDown,
  ChevronRight,
  X,
  ArrowRight,
  Calculator,
  Percent
} from "lucide-react";
import { 
  Invoice, 
  InvoiceItem, 
  InvoicePayment, 
  StockItem, 
  StoreConfig, 
  Transaction, 
  UserAccount 
} from "../types";
import { formatIDR } from "./FinanceDashboard";
import { 
  getStoredInvoices, 
  saveStoredInvoices, 
  generateNextInvoiceNumber, 
  generateNextPaymentNumber 
} from "../utils/invoiceService";
import { executePrintContent } from "../utils/printHelper";
import { generateInvoicePrintHtml, generateInvoicesListPrintHtml } from "../utils/printTemplates";
import { UniversalPrintModal } from "./UniversalPrintModal";

interface InvoiceManagerProps {
  stockItems: StockItem[];
  storeConfig: StoreConfig;
  currentUser?: UserAccount | null;
  onAddTransaction: (txData: any) => void;
  onDeductStock?: (stockItemId: string, qty: number) => void;
  onNavigateToTab?: (tab: string, sub?: string) => void;
  initialViewMode?: "list" | "detail" | "create";
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  stockItems,
  storeConfig,
  currentUser,
  onAddTransaction,
  onDeductStock,
  onNavigateToTab,
  initialViewMode = "list"
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("inv-demo-001");
  // Default to list view or specified initialViewMode (e.g. 'create' when clicking Tambah Tagihan from navbar)
  const [viewMode, setViewMode] = useState<"list" | "detail" | "create">(initialViewMode);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);
  
  // Filter for list view: 'all' | 'unpaid' | 'partial' | 'paid'
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRangeDisplay, setDateRangeDisplay] = useState<string>("25/09/2025 - 25/09/2026");

  // Selection checkboxes for bulk edit
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Show/Hide Total toggles (Matches image.png "Lihat Total")
  const [showTotalSisa, setShowTotalSisa] = useState<boolean>(false);
  const [showTotalAll, setShowTotalAll] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<string>("invoiceNumber");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Dropdown states for top buttons
  const [showLaporanDropdown, setShowLaporanDropdown] = useState(false);
  const [showPanduanDropdown, setShowPanduanDropdown] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showMoreListMenu, setShowMoreListMenu] = useState(false);
  const [showTagihanTypeMenu, setShowTagihanTypeMenu] = useState(false);
  const [showLainnyaTabMenu, setShowLainnyaTabMenu] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Payment form states (inside Invoice Detail)
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNumber, setPayNumber] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payAccount, setPayAccount] = useState<number>(1001); // 1001 Kas, 1002 Bank
  const [payRef, setPayRef] = useState<string>("");
  const [payTag, setPayTag] = useState<string>("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Detail view dropdown states
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showA4PrintModal, setShowA4PrintModal] = useState(false);
  const [customPrintData, setCustomPrintData] = useState<{ title: string; filename: string; html: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);

  // New Invoice form states
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>("");
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>("");
  const [newTxDate, setNewTxDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newDueDate, setNewDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [newWarehouse, setNewWarehouse] = useState<string>("Gudang Utama");
  const [newShippingDate, setNewShippingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newExpedition, setNewExpedition] = useState<string>("Tiki");
  const [newTrackingNumber, setNewTrackingNumber] = useState<string>("");
  const [newInvoiceNumber, setNewInvoiceNumber] = useState<string>("INV/00001");
  const [newTermin, setNewTermin] = useState<string>("Net 30");
  const [newReference, setNewReference] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");
  const [showSalesPerson, setShowSalesPerson] = useState<boolean>(false);
  const [newSalesPerson, setNewSalesPerson] = useState<string>(currentUser?.name || "yonsi");
  const [showShippingInfo, setShowShippingInfo] = useState<boolean>(false);
  const [autoAddRow, setAutoAddRow] = useState<boolean>(false);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(false);
  
  // Kalkulator Pajak Otomatis (PPN 11%) States
  const [enableAutoTaxCalc, setEnableAutoTaxCalc] = useState<boolean>(true); // Opsional hitung PPN 11%
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false); // False = Ditambahkan ke total (Exclude), True = Termasuk di dalam harga (Include)
  const [taxRate, setTaxRate] = useState<number>(11); // Standar 11% UU HPP No. 7 / PMK
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [taxSimulasiNominal, setTaxSimulasiNominal] = useState<number>(10000000);
  const [taxSimulasiInclusive, setTaxSimulasiInclusive] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [pesanNote, setPesanNote] = useState<string>("Terima kasih atas kerja sama dan pembelian Anda.");
  const [showPesanAccordion, setShowPesanAccordion] = useState<boolean>(true);
  const [showAttachmentAccordion, setShowAttachmentAccordion] = useState<boolean>(false);
  const [submitIntent, setSubmitIntent] = useState<"save" | "send">("save");
  const [showKirimModal, setShowKirimModal] = useState<boolean>(false);
  const [kirimMethod, setKirimMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [kirimPhone, setKirimPhone] = useState<string>("085883444796");
  const [newItems, setNewItems] = useState<Array<{
    stockItemId: string;
    productCode: string;
    productName: string;
    description: string;
    quantity: number;
    unit: string;
    discountPercent: number;
    unitPrice: number;
    taxType: "PPN" | "NON";
  }>>([
    {
      stockItemId: "",
      productCode: "PCS/00001",
      productName: "Baju Koko Modern",
      description: "Baju koko katun premium lengan panjang",
      quantity: 5,
      unit: "Pcs",
      discountPercent: 0,
      unitPrice: 250000,
      taxType: "PPN"
    }
  ]);

  // Sync state with localStorage
  useEffect(() => {
    saveStoredInvoices(invoices);
  }, [invoices]);

  const activeInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];
  }, [invoices, selectedInvoiceId]);

  // Initialize payment form fields when activeInvoice changes
  useEffect(() => {
    if (activeInvoice) {
      setPayAmount(activeInvoice.remainingAmount);
      setPayNumber(generateNextPaymentNumber(invoices));
      setPayDate(new Date().toISOString().split("T")[0]);
      setPayRef("");
      setPayTag("");
      setPaymentSuccessMsg(null);
    }
  }, [selectedInvoiceId, activeInvoice?.remainingAmount, invoices]);

  // Handle Payment Submission
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || payAmount <= 0) return;

    const actualPayAmount = Math.min(payAmount, activeInvoice.remainingAmount);
    const newRemaining = Math.max(0, activeInvoice.remainingAmount - actualPayAmount);
    const newPaidAmount = activeInvoice.paidAmount + actualPayAmount;
    const newStatus = newRemaining === 0 ? "paid" : "partial";

    const accountName = payAccount === 1001 ? "1-10001 Kas & Setara Kas" : "1-10002 Bank BCA / Rekening Operasional";

    const paymentRecord: InvoicePayment = {
      id: `pay-${Date.now()}`,
      paymentNumber: payNumber || `IP/${String(Date.now()).slice(-5)}`,
      date: payDate,
      amount: actualPayAmount,
      accountId: payAccount,
      accountName,
      reference: payRef || "Pembayaran Faktur",
      tag: payTag,
      createdAt: new Date().toISOString()
    };

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      author: currentUser?.name || "Budi Santoso",
      action: `Terima pembayaran ${paymentRecord.paymentNumber} sebesar ${formatIDR(actualPayAmount)} via ${accountName}`
    };

    // Update invoices array
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return {
          ...inv,
          status: newStatus as any,
          paidAmount: newPaidAmount,
          remainingAmount: newRemaining,
          payments: [...(inv.payments || []), paymentRecord],
          logs: [newLog, ...(inv.logs || [])],
          updatedAt: new Date().toISOString()
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);

    // Post to Double-Entry Accounting
    onAddTransaction({
      date: payDate,
      description: `Penerimaan Pembayaran Faktur ${activeInvoice.invoiceNumber} - ${activeInvoice.customerName}`,
      amount: actualPayAmount,
      type: "Penjualan",
      invoiceNumber: activeInvoice.invoiceNumber,
      ppnEnabled: activeInvoice.ppnAmount > 0,
      debitAccount: payAccount,
      creditAccount: 4001,
      customDebitAccountName: accountName,
      customCreditAccountName: "4001 - Pendapatan Penjualan Toko"
    });

    setPaymentSuccessMsg(`Pembayaran ${paymentRecord.paymentNumber} sebesar ${formatIDR(actualPayAmount)} berhasil dicatat ke Kas dan Jurnal SAK EMKM!`);
    setTimeout(() => setPaymentSuccessMsg(null), 6000);
  };

  // Calculation logic for Automatic Tax Calculator (PPN 11%)
  const rawItemsSubtotal = useMemo(() => {
    return newItems.reduce((acc, it) => {
      const disc = 1 - (it.discountPercent || 0) / 100;
      return acc + (it.quantity * it.unitPrice * disc);
    }, 0);
  }, [newItems]);

  const taxableDpp = useMemo(() => {
    if (!enableAutoTaxCalc) return 0;
    return newItems.reduce((acc, it) => {
      if (it.taxType === "PPN") {
        const disc = 1 - (it.discountPercent || 0) / 100;
        return acc + (it.quantity * it.unitPrice * disc);
      }
      return acc;
    }, 0);
  }, [newItems, enableAutoTaxCalc]);

  const calculatedTax = useMemo(() => {
    if (!enableAutoTaxCalc) return 0;
    if (taxInclusive || pricesIncludeTax) {
      // Harga sudah termasuk pajak: PPN = DPP - (DPP / 1.11)
      return Math.round(taxableDpp - (taxableDpp / (1 + taxRate / 100)));
    } else {
      // Harga belum termasuk pajak: PPN 11% ditambahkan ke total faktur
      return Math.round(taxableDpp * (taxRate / 100));
    }
  }, [taxableDpp, enableAutoTaxCalc, taxInclusive, pricesIncludeTax, taxRate]);

  const calculatedSubtotal = useMemo(() => {
    if (enableAutoTaxCalc && (taxInclusive || pricesIncludeTax)) {
      return Math.round(rawItemsSubtotal - calculatedTax);
    }
    return Math.round(rawItemsSubtotal);
  }, [rawItemsSubtotal, calculatedTax, enableAutoTaxCalc, taxInclusive, pricesIncludeTax]);

  const calculatedTotal = useMemo(() => {
    if (!enableAutoTaxCalc) return Math.round(rawItemsSubtotal);
    if (taxInclusive || pricesIncludeTax) {
      return Math.round(rawItemsSubtotal);
    }
    return Math.round(rawItemsSubtotal + calculatedTax);
  }, [rawItemsSubtotal, calculatedTax, enableAutoTaxCalc, taxInclusive, pricesIncludeTax]);

  // Tax Action Helpers
  const handleApplyPpnAll = () => {
    const updated = newItems.map(item => ({ ...item, taxType: "PPN" as const }));
    setNewItems(updated);
    setEnableAutoTaxCalc(true);
  };

  const handleRemovePpnAll = () => {
    const updated = newItems.map(item => ({ ...item, taxType: "NON" as const }));
    setNewItems(updated);
    setEnableAutoTaxCalc(false);
  };

  const handleToggleAutoTax = () => {
    if (!enableAutoTaxCalc) {
      handleApplyPpnAll();
    } else {
      handleRemovePpnAll();
    }
  };

  // Recalculate or toggle PPN 11% on existing active invoice in detail view
  const handleToggleInvoiceDetailTax = () => {
    if (!activeInvoice) return;
    const currentPpn = activeInvoice.ppnAmount || 0;
    const isCurrentlyTaxed = currentPpn > 0;

    let newSubtotal = activeInvoice.subtotal;
    let newPpn = 0;
    let newTotal = 0;

    if (isCurrentlyTaxed) {
      // Remove PPN
      newPpn = 0;
      newTotal = newSubtotal;
    } else {
      // Add PPN 11%
      newPpn = Math.round(newSubtotal * 0.11);
      newTotal = newSubtotal + newPpn;
    }

    const paid = activeInvoice.paidAmount || 0;
    const newRemaining = Math.max(0, newTotal - paid);
    const newStatus = newRemaining === 0 ? "paid" : paid > 0 ? "partial" : "unpaid";

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      author: currentUser?.name || "Staf Administrasi",
      action: isCurrentlyTaxed
        ? `Kalkulator Pajak: PPN dinonaktifkan (Total faktur disesuaikan menjadi ${formatIDR(newTotal)})`
        : `Kalkulator Pajak Otomatis: PPN 11% (${formatIDR(newPpn)}) berhasil dihitung & ditambahkan ke total faktur (Total menjadi ${formatIDR(newTotal)})`
    };

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return {
          ...inv,
          subtotal: newSubtotal,
          ppnAmount: newPpn,
          totalAmount: newTotal,
          remainingAmount: newRemaining,
          status: newStatus as any,
          logs: [newLog, ...(inv.logs || [])],
          updatedAt: new Date().toISOString()
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
  };

  // Handle Create Invoice Submission
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) {
      alert("Harap masukkan nama pelanggan!");
      return;
    }

    const nextInvNumber = generateNextInvoiceNumber(invoices);
    
    const formattedItems: InvoiceItem[] = newItems.map((item, idx) => {
      const discountMult = 1 - (item.discountPercent || 0) / 100;
      const baseRowAmount = item.quantity * item.unitPrice * discountMult;
      return {
        id: `item-${Date.now()}-${idx}`,
        stockItemId: item.stockItemId,
        productCode: item.productCode || `PRD-${idx + 1}`,
        productName: item.productName || "Barang Dagang",
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "Pcs",
        discountPercent: item.discountPercent || 0,
        unitPrice: item.unitPrice,
        taxType: item.taxType,
        amount: baseRowAmount
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextInvNumber,
      status: "unpaid",
      customerName: newCustomerName,
      customerAddress: newCustomerAddress || "Indonesia",
      customerPhone: newCustomerPhone,
      transactionDate: newTxDate,
      dueDate: newDueDate,
      productionPlanStatus: "-",
      productionPlanNumber: "-",
      warehouse: newWarehouse,
      shippingDate: newShippingDate,
      expedition: newExpedition,
      trackingNumber: newTrackingNumber || `RESI-${Date.now().toString().slice(-6)}`,
      items: formattedItems,
      subtotal: calculatedSubtotal,
      ppnAmount: calculatedTax,
      shippingCost: 0,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      remainingAmount: calculatedTotal,
      payments: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          author: currentUser?.name || "Budi Santoso",
          action: `Faktur penjualan ${nextInvNumber} diterbitkan untuk ${newCustomerName} ${calculatedTax > 0 ? `(PPN 11%: ${formatIDR(calculatedTax)})` : '(Bebas PPN)'}`
        }
      ],
      notes: "Terima kasih atas kerja sama dan pembelian Anda.",
      terms: "Pembayaran wajib ditransfer penuh paling lambat tanggal jatuh tempo yang tertera.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onDeductStock) {
      formattedItems.forEach(it => {
        if (it.stockItemId) {
          onDeductStock(it.stockItemId, it.quantity);
        }
      });
    }

    setInvoices([newInvoice, ...invoices]);
    setSelectedInvoiceId(newInvoice.id);
    if (submitIntent === "send") {
      setKirimPhone(newCustomerPhone || "085883444796");
      setShowKirimModal(true);
      setViewMode("detail");
    } else {
      setViewMode("list");
    }
  };

  // WhatsApp Billing message helper
  const handleSendWhatsAppBill = () => {
    if (!activeInvoice) return;
    const phone = activeInvoice.customerPhone ? activeInvoice.customerPhone.replace(/[^0-9]/g, "") : "";
    const formattedPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;

    const message = `Halo ${activeInvoice.customerName}, berikut detil tagihan resmi dari ${storeConfig.storeName}:
Nomor Tagihan: ${activeInvoice.invoiceNumber}
Tanggal: ${activeInvoice.transactionDate}
Jatuh Tempo: ${activeInvoice.dueDate}
Total Tagihan: ${formatIDR(activeInvoice.totalAmount)}
Sisa Tagihan: ${formatIDR(activeInvoice.remainingAmount)}
Ekspedisi: ${activeInvoice.expedition} (Resi: ${activeInvoice.trackingNumber || "-"})

Silakan lakukan pembayaran ke rekening Kas/Bank kami. Terima kasih atas kerja samanya!`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Delete invoice
  const handleDeleteInvoice = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus faktur tagihan ini?")) {
      const remaining = invoices.filter(inv => inv.id !== id);
      setInvoices(remaining);
      if (remaining.length > 0) {
        setSelectedInvoiceId(remaining[0].id);
      } else {
        setViewMode("list");
      }
    }
  };

  // Checkbox toggle
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
    }
  };

  // Bulk action: Mark selected as Paid
  const handleBulkMarkPaid = () => {
    if (selectedIds.size === 0) {
      alert("Pilih minimal satu tagihan untuk diubah!");
      return;
    }
    const updated = invoices.map(inv => {
      if (selectedIds.has(inv.id) && inv.status !== "paid") {
        return {
          ...inv,
          status: "paid" as const,
          paidAmount: inv.totalAmount,
          remainingAmount: 0,
          payments: [
            ...(inv.payments || []),
            {
              id: `pay-bulk-${Date.now()}-${inv.id}`,
              paymentNumber: `IP/${String(Date.now()).slice(-5)}`,
              date: new Date().toISOString().split("T")[0],
              amount: inv.remainingAmount,
              accountId: 1001,
              accountName: "1-10001 Kas & Setara Kas",
              reference: "Pelunasan Ubah Massal",
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return inv;
    });
    setInvoices(updated);
    setSelectedIds(new Set());
    alert(`Berhasil mengubah ${selectedIds.size} tagihan menjadi LUNAS!`);
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & sorted invoices for list view
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        if (statusFilter !== "all" && inv.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
          const matchCust = inv.customerName.toLowerCase().includes(q);
          const matchResi = inv.trackingNumber ? inv.trackingNumber.toLowerCase().includes(q) : false;
          const matchRef = inv.payments?.[0]?.reference ? inv.payments[0].reference.toLowerCase().includes(q) : false;
          if (!matchNum && !matchCust && !matchResi && !matchRef) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof Invoice];
        let valB: any = b[sortField as keyof Invoice];

        if (typeof valA === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [invoices, statusFilter, searchQuery, sortField, sortAsc]);

  // Aggregate sums
  const totalSisaAll = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
  }, [filteredInvoices]);

  const totalAmountAll = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [filteredInvoices]);

  return (
    <div className="space-y-4" id="invoice-system-panel">
      
      {/* ========================================================================= */}
      {/* 1. VIEW MODE: LIST TAGIHAN (MATCHES SCREENSHOT image.png EXACTLY) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 space-y-4 animate-fade-in">
          
          {/* TOP BAR: Tagihan Title & Action Buttons (image.png Header) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
              Tagihan
            </h1>

            {/* Right Top Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Laporan Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLaporanDropdown(!showLaporanDropdown);
                    setShowPanduanDropdown(false);
                    setShowImportDropdown(false);
                    setShowMoreListMenu(false);
                  }}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Laporan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showLaporanDropdown && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      onClick={() => {
                        if (onNavigateToTab) {
                          onNavigateToTab("laporan", "labarugi");
                        } else {
                          window.location.hash = "#/laporan";
                        }
                        setShowLaporanDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Laporan Laba Rugi SAK EMKM</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onNavigateToTab) {
                          onNavigateToTab("laporan", "piutang");
                        } else {
                          window.location.hash = "#/laporan";
                        }
                        setShowLaporanDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Laporan Piutang Pelanggan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Panduan Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPanduanDropdown(!showPanduanDropdown);
                    setShowLaporanDropdown(false);
                    setShowImportDropdown(false);
                    setShowMoreListMenu(false);
                  }}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Panduan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showPanduanDropdown && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2.5 animate-in fade-in zoom-in-95 text-xs space-y-1.5">
                    <p className="font-bold text-slate-800">Panduan Penggunaan Tagihan</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      1. Klik <strong>+ Tambah</strong> untuk membuat faktur baru.<br />
                      2. Klik nomor tagihan (cth: <strong>INV/00001</strong>) untuk membuka rincian &amp; pembayaran.<br />
                      3. Pembayaran otomatis tercatat ke Buku Kas &amp; Jurnal SAK EMKM.
                    </p>
                  </div>
                )}
              </div>

              {/* + Tambah Button (Blue Primary - Matches image.png) */}
              <div className="relative">
                <button
                  onClick={() => setViewMode("create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                  <ChevronDown className="w-3 h-3 text-white/80" />
                </button>
              </div>

              {/* Import Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowImportDropdown(!showImportDropdown);
                    setShowLaporanDropdown(false);
                    setShowPanduanDropdown(false);
                    setShowMoreListMenu(false);
                  }}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showImportDropdown && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      onClick={() => {
                        alert("Fitur import CSV / Excel (.xlsx) tagihan siap digunakan.");
                        setShowImportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Import dari Excel (.xlsx)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <button
                onClick={() => {
                  if (activeInvoice && viewMode === "detail") {
                    setCustomPrintData({
                      title: `Faktur Penjualan ${activeInvoice.invoiceNumber}`,
                      filename: `Faktur-${activeInvoice.invoiceNumber.replace('/', '-')}.pdf`,
                      html: generateInvoicePrintHtml(activeInvoice, storeConfig)
                    });
                  } else {
                    setCustomPrintData({
                      title: "Daftar Rekapitulasi Tagihan & Faktur Penjualan",
                      filename: `Daftar-Tagihan-${new Date().toISOString().split("T")[0]}.pdf`,
                      html: generateInvoicesListPrintHtml(filteredInvoices, storeConfig)
                    });
                  }
                  setShowA4PrintModal(true);
                }}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                title="Cetak Dokumen (Hardware Printer / File PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>

              {/* More Vertical (...) */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreListMenu(!showMoreListMenu)}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 p-1.5 rounded-lg text-xs transition cursor-pointer shadow-2xs"
                >
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </button>
                {showMoreListMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      onClick={() => {
                        setCustomPrintData({
                          title: "Daftar Rekapitulasi Tagihan & Faktur Penjualan",
                          filename: `Daftar-Tagihan-${new Date().toISOString().split("T")[0]}.pdf`,
                          html: generateInvoicesListPrintHtml(filteredInvoices, storeConfig)
                        });
                        setShowA4PrintModal(true);
                        setShowMoreListMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-2 font-medium"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Cetak / Ekspor ke PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("akuntan_invoices_v1");
                        window.location.reload();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer font-medium"
                    >
                      Reset Data Tagihan
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* SECOND TOOLBAR ROW: Filter, Tagihan type dropdown, Search, Date Range (Matches image.png) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            
            {/* Left toolbar items */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  showFilterDrawer ? "border-blue-600 text-blue-600 ring-1 ring-blue-600" : ""
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowTagihanTypeMenu(!showTagihanTypeMenu)}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tagihan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showTagihanTypeMenu && (
                  <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95 text-xs">
                    <button
                      onClick={() => setShowTagihanTypeMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-blue-600 font-bold bg-blue-50/60 rounded-md"
                    >
                      Semua Tagihan
                    </button>
                    <button
                      onClick={() => setShowTagihanTypeMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md"
                    >
                      Faktur Standar
                    </button>
                    <button
                      onClick={() => setShowTagihanTypeMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md"
                    >
                      Nota Sederhana
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right toolbar items: Search Input & Date Range Box */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end flex-wrap sm:flex-nowrap">
              
              {/* Search Box (Matches image.png: Q Cari with focus outline) */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              {/* Date Range Box (Matches image.png: 25/09/2025 - 25/09/2026 with calendar icon) */}
              <div className="flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs text-slate-700 whitespace-nowrap shadow-2xs w-full sm:w-auto justify-between">
                <span className="font-mono text-slate-700">{dateRangeDisplay}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>

            </div>

          </div>

          {/* THIRD ROW: Status Tabs (Semua, Belum Dibayar, Dibayar Sebagian, Lunas, Lainnya) & Ubah Massal */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-100">
            
            {/* Status Tabs (Matches image.png) */}
            <div className="inline-flex border border-slate-200 rounded-lg p-0.5 bg-white shadow-2xs self-start overflow-x-auto max-w-full">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === "all" 
                    ? "border border-blue-600 text-blue-600 font-bold bg-blue-50/30" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter("unpaid")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === "unpaid" 
                    ? "border border-blue-600 text-blue-600 font-bold bg-blue-50/30" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Belum Dibayar
              </button>
              <button
                onClick={() => setStatusFilter("partial")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === "partial" 
                    ? "border border-blue-600 text-blue-600 font-bold bg-blue-50/30" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dibayar Sebagian
              </button>
              <button
                onClick={() => setStatusFilter("paid")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  statusFilter === "paid" 
                    ? "border border-blue-600 text-blue-600 font-bold bg-blue-50/30" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lunas
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowLainnyaTabMenu(!showLainnyaTabMenu)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lainnya</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showLainnyaTabMenu && (
                  <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-30 p-1 text-xs">
                    <button
                      onClick={() => setShowLainnyaTabMenu(false)}
                      className="w-full text-left px-2 py-1.5 text-slate-700 hover:bg-slate-100 rounded"
                    >
                      Dibatalkan
                    </button>
                    <button
                      onClick={() => setShowLainnyaTabMenu(false)}
                      className="w-full text-left px-2 py-1.5 text-slate-700 hover:bg-slate-100 rounded"
                    >
                      Lewat Jatuh Tempo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ubah Massal Button (Matches image.png with Pencil icon) */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkMarkPaid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lunaskan ({selectedIds.size})</span>
                </button>
              )}

              <button
                onClick={handleBulkMarkPaid}
                className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Ubah Massal</span>
              </button>
            </div>

          </div>

          {/* MAIN TABLE (EXACTLY MATCHING image.png COLUMNS & LAYOUT) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/70 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {/* Select All Checkbox */}
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    {/* Nomor */}
                    <th 
                      onClick={() => handleSort("invoiceNumber")}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nomor</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Pelanggan */}
                    <th 
                      onClick={() => handleSort("customerName")}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Pelanggan</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Referensi */}
                    <th className="py-3 px-3.5 select-none">
                      <div className="flex items-center gap-1">
                        <span>Referensi</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Tgl. Jatuh Tempo */}
                    <th 
                      onClick={() => handleSort("dueDate")}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Tgl. Jatuh Tempo</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Status */}
                    <th 
                      onClick={() => handleSort("status")}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Sisa Tagihan (Right aligned) */}
                    <th 
                      onClick={() => handleSort("remainingAmount")}
                      className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Sisa Tagihan</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    {/* Total (Right aligned) */}
                    <th 
                      onClick={() => handleSort("totalAmount")}
                      className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100/60 select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-slate-50/70 transition"
                    >
                      {/* Checkbox column */}
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => handleToggleSelect(inv.id)}
                          className="rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Nomor: Clickable blue link to open Detil Tagihan */}
                      <td className="py-3.5 px-3.5 font-medium">
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            setViewMode("detail");
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left cursor-pointer transition"
                          title="Klik untuk membuka Detil Tagihan"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3.5 px-3.5 text-slate-800 font-medium">
                        {inv.customerName}
                      </td>

                      {/* Referensi */}
                      <td className="py-3.5 px-3.5 text-slate-500">
                        {inv.payments?.[0]?.reference || "-"}
                      </td>

                      {/* Tgl. Jatuh Tempo (DD/MM/YYYY) */}
                      <td className="py-3.5 px-3.5 text-slate-700 font-mono">
                        {inv.dueDate ? inv.dueDate.split("-").reverse().join("/") : "-"}
                      </td>

                      {/* Status: Green Lunas, Red Belum Dibayar, Orange Dibayar Sebagian */}
                      <td className="py-3.5 px-3.5">
                        {inv.status === "paid" ? (
                          <span className="text-emerald-600 font-medium">Lunas</span>
                        ) : inv.status === "partial" ? (
                          <span className="text-amber-600 font-medium">Dibayar Sebagian</span>
                        ) : (
                          <span className="text-rose-600 font-medium">Belum Dibayar</span>
                        )}
                      </td>

                      {/* Sisa Tagihan */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-medium text-slate-800">
                        {inv.remainingAmount === 0 ? "0" : inv.remainingAmount.toLocaleString("id-ID")}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-medium text-slate-900">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{inv.totalAmount.toLocaleString("id-ID")}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceId(inv.id);
                              setCustomPrintData({
                                title: `Faktur Penjualan ${inv.invoiceNumber}`,
                                filename: `Faktur-${inv.invoiceNumber.replace('/', '-')}.pdf`,
                                html: generateInvoicePrintHtml(inv, storeConfig)
                              });
                              setShowA4PrintModal(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title={`Cetak Faktur ${inv.invoiceNumber} (Print / PDF)`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* BOTTOM SUMMARY ROW (Matches image.png: Total, Lihat Total eye icon) */}
                  <tr className="bg-white border-t border-slate-200 font-bold text-xs">
                    <td className="py-3.5 px-3.5"></td>
                    <td className="py-3.5 px-3.5 text-slate-900 font-bold">Total</td>
                    <td className="py-3.5 px-3.5" colSpan={4}></td>
                    
                    {/* Sisa Tagihan Total Column */}
                    <td className="py-3.5 px-3.5 text-right">
                      {showTotalSisa ? (
                        <button
                          onClick={() => setShowTotalSisa(false)}
                          className="font-mono text-slate-900 font-bold flex items-center justify-end gap-1 ml-auto cursor-pointer"
                        >
                          <span>{totalSisaAll.toLocaleString("id-ID")}</span>
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTotalSisa(true)}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end gap-1 text-[11px] font-medium ml-auto cursor-pointer transition"
                        >
                          <span>Lihat Total</span>
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                    </td>

                    {/* Total Amount Total Column */}
                    <td className="py-3.5 px-3.5 text-right">
                      {showTotalAll ? (
                        <button
                          onClick={() => setShowTotalAll(false)}
                          className="font-mono text-slate-900 font-bold flex items-center justify-end gap-1 ml-auto cursor-pointer"
                        >
                          <span>{totalAmountAll.toLocaleString("id-ID")}</span>
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowTotalAll(true)}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end gap-1 text-[11px] font-medium ml-auto cursor-pointer transition"
                        >
                          <span>Lihat Total</span>
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM PAGINATION ROW (Matches image.png: Total 1 data, 15 / halaman v) */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
            <div>
              Total {filteredInvoices.length} data
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <span>15 / halaman</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DETIL TAGIHAN VIEW (CONNECTED WITH INVOICE - PREVIOUS SCREENSHOT) */}
      {/* ========================================================================= */}
      {viewMode === "detail" && activeInvoice && (
        <div className="space-y-6 animate-fade-in" id="invoice-detail-sheet">
          
          {/* Header Bar: Breadcrumb back to Tagihan List & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
                title="Kembali ke Daftar Tagihan"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tagihan</span>
              </button>

              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 font-sans flex items-center gap-2">
                  <span>Detil Tagihan {activeInvoice.invoiceNumber}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    activeInvoice.status === "paid" 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : activeInvoice.status === "partial"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-rose-100 text-rose-700 border border-rose-300"
                  }`}>
                    {activeInvoice.status === "paid" ? "Lunas" : activeInvoice.status === "partial" ? "Sebagian" : "Belum Dibayar"}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Pengelolaan faktur, detail logistik ekspedisi &amp; pencatatan penerimaan kas
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bagikan Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowShareMenu(!showShareMenu);
                    setShowPrintMenu(false);
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bagikan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/#/invoice/${activeInvoice.invoiceNumber}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedLink ? "Tautan Disalin!" : "Salin Tautan Faktur"}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSendWhatsAppBill();
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg text-left cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kirim ke WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPrintMenu(!showPrintMenu);
                    setShowShareMenu(false);
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setShowA4PrintModal(true);
                        setShowPrintMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pratinjau &amp; Cetak Faktur Standar A4</span>
                    </button>
                    <button
                      onClick={() => {
                        executePrintContent(generateInvoicePrintHtml(activeInvoice, storeConfig), {
                          title: `Faktur Penjualan ${activeInvoice.invoiceNumber}`,
                          filename: `Faktur-${activeInvoice.invoiceNumber.replace('/', '-')}.html`
                        });
                        setShowPrintMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left cursor-pointer font-medium"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cetak Langsung (Hardware / PDF)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Kirim Tagihan (WhatsApp) */}
              <button
                onClick={handleSendWhatsAppBill}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                title="Kirim tagihan via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Kirim Tagihan</span>
              </button>

              {/* More Actions */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMoreMenu(!showMoreMenu);
                    setShowShareMenu(false);
                    setShowPrintMenu(false);
                  }}
                  className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        handleDeleteInvoice(activeInvoice.id);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Tagihan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Invoice Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* INVOICE METADATA SECTION */}
            <div className="p-6 md:p-8 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                
                {/* Left Column: Pelanggan, Tgl Transaksi, Gudang */}
                <div className="space-y-5">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Pelanggan</label>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 text-sm hover:underline cursor-pointer">
                        {activeInvoice.customerName}
                      </span>
                    </div>
                    {activeInvoice.customerAddress && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{activeInvoice.customerAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Tgl. Transaksi</label>
                      <span className="font-semibold text-slate-800 text-xs">
                        {activeInvoice.transactionDate.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Status Rencana Produksi</label>
                      <span className="text-slate-500">{activeInvoice.productionPlanStatus || "-"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Gudang</label>
                    <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                      {activeInvoice.warehouse || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Right Column: Nomor, Tgl Jatuh Tempo, Nomor Rencana */}
                <div className="space-y-5">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Nomor</label>
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      {activeInvoice.invoiceNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Tgl. Jatuh Tempo</label>
                      <span className="font-semibold text-slate-800 text-xs">
                        {activeInvoice.dueDate.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">Nomor Rencana Produksi</label>
                      <span className="text-slate-500">{activeInvoice.productionPlanNumber || "-"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Informasi Pengiriman Card */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Informasi pengiriman</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 font-medium block mb-0.5">Tanggal Pengiriman</label>
                    <span className="font-semibold text-slate-800">
                      {activeInvoice.shippingDate ? activeInvoice.shippingDate.split("-").reverse().join("/") : "-"}
                    </span>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-0.5">Ekspedisi</label>
                    <span className="font-semibold text-slate-800">
                      {activeInvoice.expedition || "-"}
                    </span>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-0.5">No. Resi</label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {activeInvoice.trackingNumber || "-"}
                      </span>
                      {activeInvoice.trackingNumber && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeInvoice.trackingNumber || "");
                            setCopiedResi(true);
                            setTimeout(() => setCopiedResi(false), 2000);
                          }}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Salin No. Resi"
                        >
                          {copiedResi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* PRODUCT LINE ITEMS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4 text-center">Kuantitas</th>
                    <th className="py-3 px-4 text-center">Satuan</th>
                    <th className="py-3 px-4 text-center">Discount</th>
                    <th className="py-3 px-4 text-right">Harga</th>
                    <th className="py-3 px-4 text-center">Pajak</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeInvoice.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-medium text-indigo-600">
                        <span className="font-mono text-[11px] text-slate-500 mr-1.5">{it.productCode}</span>
                        <span>{it.productName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {it.description || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {it.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {it.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {it.discountPercent}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {it.unitPrice.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {it.taxType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {it.amount.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS & SUMMARY SECTION */}
            <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end">
              <div className="w-full max-w-sm space-y-2 text-xs">
                
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Total Kuantitas</span>
                  <span className="font-bold text-slate-800">
                    {activeInvoice.items.reduce((acc, it) => acc + it.quantity, 0)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Sub Total</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeInvoice.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>PPN (11%)</span>
                  <span className="font-mono text-slate-700">
                    {activeInvoice.ppnAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-300">
                  <span>Total</span>
                  <span className="font-mono text-base">
                    {activeInvoice.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                {activeInvoice.paidAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                    <span>Sudah Dibayar</span>
                    <span className="font-mono">
                      - {activeInvoice.paidAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                {/* Sisa Tagihan */}
                <div className="flex justify-between items-center text-slate-900 font-black text-base pt-3 border-t-2 border-slate-900">
                  <span className="tracking-tight">Sisa Tagihan</span>
                  <span className="font-mono text-lg text-rose-600">
                    {activeInvoice.remainingAmount.toLocaleString("id-ID")}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* TERIMA PEMBAYARAN FORM */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Terima pembayaran</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Catat pelunasan kas atau transfer bank langsung ke jurnal pembukuan SAK EMKM
              </p>
            </div>

            {paymentSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* If there are existing payments, show payment history */}
            {activeInvoice.payments && activeInvoice.payments.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                <div className="bg-slate-50 px-4 py-2 font-bold text-xs text-slate-700 border-b border-slate-100">
                  Riwayat Pembayaran Diterima
                </div>
                <div className="divide-y divide-slate-100">
                  {activeInvoice.payments.map((p, pIdx) => (
                    <div key={p.id || pIdx} className="p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-900 mr-2">{p.paymentNumber}</span>
                        <span className="text-slate-500 mr-2">{p.date}</span>
                        <span className="text-indigo-600 font-medium">({p.accountName})</span>
                      </div>
                      <div className="font-mono font-bold text-emerald-600">
                        + {formatIDR(p.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Input Form */}
            {activeInvoice.remainingAmount > 0 ? (
              <form onSubmit={handleAddPayment} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      <span className="text-rose-500 mr-0.5">*</span> Total Dibayar
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={activeInvoice.remainingAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-right font-mono font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Nomor
                    </label>
                    <input
                      type="text"
                      value={payNumber}
                      onChange={(e) => setPayNumber(e.target.value)}
                      placeholder="IP/00001"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      <span className="text-rose-500 mr-0.5">*</span> Tgl. Pembayaran
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      <span className="text-rose-500 mr-0.5">*</span> Dibayar Ke
                    </label>
                    <select
                      value={payAccount}
                      onChange={(e) => setPayAccount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                      required
                    >
                      <option value={1001}>1-10001 Kas &amp; Setara Kas</option>
                      <option value={1002}>1-10002 Bank BCA / Rekening Operasional</option>
                      <option value={1004}>1-10004 Bank Mandiri / Kasir</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Referensi</label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="Contoh: Transfer Bank BCA / QRIS / Tunai Kasir"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Tag</label>
                    <input
                      type="text"
                      value={payTag}
                      onChange={(e) => setPayTag(e.target.value)}
                      placeholder="Pilih tag / Grosir / Retail"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => alert("Lampiran bukti transfer offline siap disimpan.")}
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>&gt; Attachment</span>
                    </button>
                    <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                      + Pemotongan
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2">Total</span>
                    <span className="text-sm font-mono font-black text-slate-900">
                      {payAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Pembayaran</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Faktur ini telah LUNAS sepenuhnya.</span>
                </div>
                <span className="font-mono text-emerald-900 font-black">
                  Total Dibayar: {formatIDR(activeInvoice.totalAmount)}
                </span>
              </div>
            )}
          </div>

          {/* PANTAU LOG PERUBAHAN DATA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800">
              Pantau log perubahan data
            </h4>
            <div className="space-y-2">
              {activeInvoice.logs && activeInvoice.logs.map((log) => (
                <div key={log.id} className="text-[11px] text-slate-500 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-slate-700 font-semibold">{log.action}</span>
                    <span className="text-slate-400 ml-1.5">oleh {log.author} pada {log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FORM TAMBAH TAGIHAN (SEPERTI SCREENSHOT TAGIHAN2, TAGIHAN3, TAGIHAN4) */}
      {/* ========================================================================= */}
      {viewMode === "create" && (
        <form onSubmit={handleCreateInvoice} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 md:p-8 space-y-5 animate-fade-in text-xs">
          
          {/* Header Title & Panduan */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tambah Tagihan</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPanduanDropdown(!showPanduanDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Panduan</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Row 1: Pelanggan & Nomor */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                <span className="text-rose-500 mr-0.5">*</span> Pelanggan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Pilih kontak / ketik nama pelanggan"
                  list="customer-suggestions"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
                <datalist id="customer-suggestions">
                  <option value="POS Customer" />
                  <option value="Toko Sembako Berkah" />
                  <option value="PT. Bumi Manis Berkah" />
                  <option value="CV Cipta Karya" />
                </datalist>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Belum ada alamat yang terdaftar di kontak ini, Anda bisa menambahkan alamat di sini.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setNewCustomerAddress("Jl. Pasar Besar No. 12, Surabaya")} 
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Tambah Alamat Penagihan
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewCustomerAddress("Gudang Pelanggan Blok C-4, Surabaya")} 
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Tambah Alamat Pengiriman
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <span>Nomor</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={newInvoiceNumber}
                onChange={(e) => setNewInvoiceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Dates & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="text-rose-500 mr-0.5">*</span> Tgl. Transaksi
              </label>
              <input
                type="date"
                value={newTxDate}
                onChange={(e) => setNewTxDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tgl. Jatuh Tempo
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Termin
              </label>
              <select
                value={newTermin}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewTermin(val);
                  const d = new Date(newTxDate || new Date());
                  if (val === "Net 30") d.setDate(d.getDate() + 30);
                  else if (val === "Net 15") d.setDate(d.getDate() + 15);
                  else if (val === "Net 60") d.setDate(d.getDate() + 60);
                  else if (val === "COD") d.setDate(d.getDate());
                  setNewDueDate(d.toISOString().split("T")[0]);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 60">Net 60</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Custom">Jatuh Tempo pada Tanggal Tertentu</option>
              </select>
            </div>
          </div>

          {/* Row 3: Reference & Tag */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>Referensi</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="Referensi"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>Tag</span>
                <HelpCircle className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Pilih Tag"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Collapsible Toggles: Sales Person & Shipping Info */}
          <div className="space-y-3 pt-1">
            {/* Sales Person Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowSalesPerson(!showSalesPerson)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{showSalesPerson ? "— Sembunyikan Sales Person" : "+ Tampilkan Sales Person"}</span>
              </button>
              {showSalesPerson && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80 max-w-sm">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sales Person</label>
                  <select
                    value={newSalesPerson}
                    onChange={(e) => setNewSalesPerson(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value={currentUser?.name || "yonsi"}>{currentUser?.name || "yonsi"}</option>
                    <option value="Budi Santoso">Budi Santoso</option>
                    <option value="Siti Aminah">Siti Aminah</option>
                  </select>
                </div>
              )}
            </div>

            {/* Shipping Info Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowShippingInfo(!showShippingInfo)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{showShippingInfo ? "— Sembunyikan Informasi Pengiriman" : "+ Tampilkan Informasi Pengiriman"}</span>
              </button>
              {showShippingInfo && (
                <div className="mt-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Pengiriman</label>
                    <input
                      type="date"
                      value={newShippingDate}
                      onChange={(e) => setNewShippingDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ekspedisi</label>
                    <select
                      value={newExpedition}
                      onChange={(e) => setNewExpedition(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Tiki">Tiki</option>
                      <option value="JNE">JNE</option>
                      <option value="J&T">J&T Express</option>
                      <option value="SiCepat">SiCepat</option>
                      <option value="AnterAja">AnterAja</option>
                      <option value="Kurir Toko">Kurir Toko Pribadi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Resi</label>
                    <input
                      type="text"
                      value={newTrackingNumber}
                      onChange={(e) => setNewTrackingNumber(e.target.value)}
                      placeholder="No. Resi"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barcode scan input & toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode/SKU"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAddRow}
                  onChange={(e) => setAutoAddRow(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Tambah baris otomatis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pricesIncludeTax}
                  onChange={(e) => setPricesIncludeTax(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Harga termasuk pajak</span>
              </label>
            </div>
          </div>

          {/* Table Products */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Produk</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Deskripsi</th>
                    <th className="py-2.5 px-3 w-20 text-center">Kuantitas</th>
                    <th className="py-2.5 px-3 w-24 text-center">Satuan</th>
                    <th className="py-2.5 px-3 w-20 text-center">Discount</th>
                    <th className="py-2.5 px-3 w-28 text-right">Harga</th>
                    <th className="py-2.5 px-3 w-24 text-center">Pajak</th>
                    <th className="py-2.5 px-3 w-28 text-right">Jumlah</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {newItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={item.stockItemId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const found = stockItems.find(s => s.id === selectedId);
                            const updated = [...newItems];
                            if (found) {
                              updated[idx] = {
                                ...updated[idx],
                                stockItemId: found.id,
                                productCode: found.sku,
                                productName: found.name,
                                unit: found.unit || "Pcs",
                                unitPrice: found.sellPrice,
                                description: found.name
                              };
                            } else {
                              updated[idx].productName = "Custom Product";
                            }
                            setNewItems(updated);
                          }}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="">Pilih Produk</option>
                          {stockItems.map(stk => (
                            <option key={stk.id} value={stk.id}>
                              {stk.name} ({formatIDR(stk.sellPrice)})
                            </option>
                          ))}
                          <option value="custom">Custom Product (Lainnya)</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].description = e.target.value;
                            setNewItems(updated);
                          }}
                          placeholder="Deskripsi"
                          className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].quantity = Math.max(1, Number(e.target.value));
                            setNewItems(updated);
                          }}
                          className="w-16 text-center text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-bold outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].unit = e.target.value;
                            setNewItems(updated);
                          }}
                          className="w-20 text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none bg-white cursor-pointer"
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Box">Box</option>
                          <option value="Sak">Sak</option>
                          <option value="Kg">Kg</option>
                          <option value="Batang">Batang</option>
                          <option value="M3">M3</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={item.discountPercent ? `${item.discountPercent}%` : "0%"}
                          onChange={(e) => {
                            const num = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                            const updated = [...newItems];
                            updated[idx].discountPercent = num;
                            setNewItems(updated);
                          }}
                          className="w-16 text-center text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].unitPrice = Number(e.target.value);
                            setNewItems(updated);
                          }}
                          className="w-24 text-right text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-mono outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.taxType}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].taxType = e.target.value as any;
                            setNewItems(updated);
                          }}
                          className="text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none bg-white cursor-pointer"
                        >
                          <option value="NON">--</option>
                          <option value="PPN">PPN (11%)</option>
                        </select>
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800">
                        {((item.quantity * item.unitPrice) * (1 - (item.discountPercent || 0) / 100)).toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (newItems.length > 1) {
                              setNewItems(newItems.filter((_, i) => i !== idx));
                            }
                          }}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition border border-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setNewItems([
                    ...newItems,
                    {
                      stockItemId: "",
                      productCode: `PRD-${Date.now().toString().slice(-4)}`,
                      productName: "Item Baru",
                      description: "",
                      quantity: 1,
                      unit: "Pcs",
                      discountPercent: 0,
                      unitPrice: 0,
                      taxType: "NON"
                    }
                  ]);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer"
              >
                + Tambah baris
              </button>
            </div>
          </div>

          {/* Bottom Split (Pesan & Attachment on left, Totals on right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            {/* Left: Accordion Pesan & Attachment */}
            <div className="md:col-span-7 space-y-3">
              {/* Accordion Pesan */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowPesanAccordion(!showPesanAccordion)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 text-xs font-bold text-slate-700 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPesanAccordion ? "rotate-90" : ""}`} />
                    <span>Pesan</span>
                  </span>
                </button>
                {showPesanAccordion && (
                  <div className="p-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5 text-xs text-slate-500 font-bold">
                      <span className="p-1 hover:bg-slate-100 rounded cursor-pointer">B</span>
                      <span className="p-1 hover:bg-slate-100 rounded cursor-pointer italic">I</span>
                      <span className="p-1 hover:bg-slate-100 rounded cursor-pointer underline">U</span>
                      <span className="p-1 hover:bg-slate-100 rounded cursor-pointer line-through">S</span>
                      <span className="p-1 hover:bg-slate-100 rounded cursor-pointer font-mono">T</span>
                    </div>
                    <textarea
                      value={pesanNote}
                      onChange={(e) => setPesanNote(e.target.value)}
                      placeholder="Tulis pesan untuk pelanggan di sini..."
                      rows={3}
                      className="w-full text-xs text-slate-700 outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Accordion Attachment */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAttachmentAccordion(!showAttachmentAccordion)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 text-xs font-bold text-slate-700 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAttachmentAccordion ? "rotate-90" : ""}`} />
                    <span>Attachment</span>
                  </span>
                </button>
                {showAttachmentAccordion && (
                  <div className="p-4 border-t border-slate-100">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 hover:border-blue-400 transition cursor-pointer">
                      <Paperclip className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                      <p className="text-xs font-medium text-slate-600">Klik atau seret file ke area ini untuk mengunggah</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">File size maksimal 10 MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Totals calculation */}
            <div className="md:col-span-5 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 text-slate-600">
                <span>Sub Total</span>
                <span className="font-mono font-semibold">{calculatedSubtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="text-right">
                <button type="button" className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer">+ Tambahan Diskon</button>
              </div>
              <div className="text-right">
                <button type="button" className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer">+ Biaya pengiriman</button>
              </div>
              <div className="text-right">
                <button type="button" className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer">+ Biaya Transaksi</button>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-b border-slate-200 text-sm font-bold text-slate-800">
                <span>Total</span>
                <span className="font-mono">{calculatedTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="text-right">
                <button type="button" className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer">+ Pemotongan</button>
              </div>
              <div className="text-right">
                <button type="button" className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer">+ Uang muka</button>
              </div>
              <div className="flex items-center justify-between pt-1 font-bold text-slate-900">
                <span>Sisa Tagihan</span>
                <span className="font-mono">{calculatedTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons matching Tagihan4.png */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <div className="relative">
              <button
                type="submit"
                onClick={() => setSubmitIntent("save")}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Simpan</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <button
              type="submit"
              onClick={() => setSubmitIntent("send")}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              Simpan &amp; Kirim
            </button>
          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL KIRIM TAGIHAN (SEPERTI SCREENSHOT TAGIHAN5.PNG) */}
      {/* ========================================================================= */}
      {showKirimModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kirim Tagihan {newInvoiceNumber || activeInvoice?.invoiceNumber || "INV/00001"}
                </h3>
                <p className="text-xs text-slate-400">Pilih metode pengiriman untuk pelanggan Anda</p>
              </div>
              <button
                onClick={() => setShowKirimModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Method Tabs: WhatsApp vs Email */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKirimMethod("whatsapp")}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                    kirimMethod === "whatsapp" 
                      ? "border-blue-600 bg-blue-50/40" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">WhatsApp</div>
                      <div className="text-[10px] text-slate-400">Respon Cepat</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={kirimMethod === "whatsapp"}
                    onChange={() => setKirimMethod("whatsapp")}
                    className="text-blue-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setKirimMethod("email")}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                    kirimMethod === "email" 
                      ? "border-blue-600 bg-blue-50/40" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Email</div>
                      <div className="text-[10px] text-slate-400">Formal &amp; Profesional</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={kirimMethod === "email"}
                    onChange={() => setKirimMethod("email")}
                    className="text-blue-600"
                  />
                </button>
              </div>

              {/* WhatsApp Form & Preview */}
              {kirimMethod === "whatsapp" && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      <span className="text-rose-500 mr-0.5">*</span> Nomor WhatsApp Tujuan
                    </label>
                    <input
                      type="text"
                      value={kirimPhone}
                      onChange={(e) => setKirimPhone(e.target.value)}
                      placeholder="Masukkan nomor telepon"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Nomor ini akan menerima pesan tagihan</p>
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span>Kirim via Nomor Pribadi</span>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-0.5">Tingkatkan kepercayaan pelanggan Anda dengan nomor resmi Anda sendiri.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppBill()}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Kirim WhatsApp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* WhatsApp Message Preview Bubble (Matching Tagihan5.png) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {/* Top chat bar */}
                    <div className="bg-[#075e54] text-white px-3 py-2 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                        K
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs flex items-center gap-1 truncate">
                          <span>{storeConfig.storeName || "Kledo"}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-white" />
                        </div>
                        <div className="text-[9px] text-emerald-100/80 leading-none">Official Business Account</div>
                      </div>
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="bg-[#efeae2] p-4 space-y-2">
                      <div className="bg-white p-3.5 rounded-lg shadow-2xs max-w-md space-y-2 text-slate-800 text-[11px]">
                        <p className="font-bold">Yth. Ibu/Bpk {newCustomerName || "POS Customer"}</p>
                        <p>Berikut adalah Tagihan Penjualan {newInvoiceNumber || "INV/00001"} atas transaksi di {storeConfig.storeName || "PT. BUMI MANIS BERKAH"}:</p>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] space-y-0.5">
                          <p className="font-bold text-slate-800">5 Pcs Custom Product</p>
                          <p className="font-bold text-emerald-700">Total: {formatIDR(calculatedTotal || 1387500)}</p>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Detail transaksi bisa dilihat di sini: <span className="text-blue-600 underline">https://api.kledo.id/v1/inv/{newInvoiceNumber?.replace('/', '-') || 'INV-00001'}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Informasi lebih lanjut bisa menghubungi nomor berikut: <strong>{storeConfig.storePhone || "085883444796"}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-[10px] text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Template pesan WhatsApp ini telah disesuaikan dengan standar profesional kledo.com untuk memastikan keterbacaan yang optimal.</span>
                  </div>
                </div>
              )}

              {/* Email Option */}
              {kirimMethod === "email" && (
                <div className="p-6 bg-slate-50 rounded-xl text-center space-y-2 border border-slate-200">
                  <Send className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="font-bold text-slate-800">Kirim Faktur via Email</p>
                  <p className="text-xs text-slate-500">Faktur berformat PDF A4 resmi akan dikirimkan ke alamat email pelanggan.</p>
                  <input
                    type="email"
                    placeholder="alamat-email-pelanggan@domain.com"
                    className="w-full max-w-sm mx-auto bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Faktur akan dikirim melalui: <strong>{kirimMethod === "whatsapp" ? "WhatsApp" : "Email"}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKirimModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendWhatsAppBill();
                    setShowKirimModal(false);
                    alert("Tagihan berhasil diproses & dikirimkan ke pelanggan!");
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL CETAK FAKTUR & REKAP STANDAR A4 RESMI (UNIVERSAL PRINT MODAL) */}
      {/* ========================================================================= */}
      <UniversalPrintModal
        isOpen={showA4PrintModal && (!!customPrintData || !!activeInvoice)}
        onClose={() => {
          setShowA4PrintModal(false);
          setCustomPrintData(null);
        }}
        title={customPrintData ? customPrintData.title : `Faktur Penjualan ${activeInvoice ? activeInvoice.invoiceNumber : ""}`}
        filename={customPrintData ? customPrintData.filename : `Faktur-${activeInvoice ? activeInvoice.invoiceNumber.replace('/', '-') : 'invoice'}.pdf`}
        htmlContent={customPrintData ? customPrintData.html : (activeInvoice ? generateInvoicePrintHtml(activeInvoice, storeConfig) : "")}
      />

    </div>
  );
};
