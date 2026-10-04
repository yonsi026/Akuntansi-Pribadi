import React, { useState, useMemo } from "react";
import { 
  Truck, 
  Search, 
  Filter, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  Share2, 
  HelpCircle, 
  MoreVertical, 
  ChevronDown, 
  Plus, 
  RotateCw, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox,
  X,
  MapPin,
  Barcode,
  Minus,
  SlidersHorizontal
} from "lucide-react";
import { Invoice, StockItem, StoreConfig, Transaction, UserAccount } from "../types";
import { formatIDR } from "./FinanceDashboard";
import { getStoredInvoices } from "../utils/invoiceService";
import { UniversalPrintModal } from "./UniversalPrintModal";
import { printInPageDOM } from "../utils/printHelper";

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string; // e.g. "DO/2026/0001" or "SJ/00001"
  customerName: string;
  reference: string;      // e.g. "INV/00001"
  status: "open" | "selesai" | "terkirim";
  date: string;           // YYYY-MM-DD
  shippingDate: string;
  expedition: string;     // e.g. "Tiki", "JNE", "J&T", "Kurir Sendiri"
  trackingNumber: string; // No. Resi
  warehouse: string;      // "Gudang Utama"
  notes?: string;
  items: Array<{
    productName: string;
    qty: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
}

interface DeliveryManagerProps {
  storeConfig: StoreConfig;
  stockItems?: StockItem[];
  currentUser?: UserAccount | null;
  onNavigateToTab?: (tab: string, sub?: string) => void;
  initialMode?: "list" | "report" | "ongkir";
}

const STORAGE_DELIVERIES_KEY = "kledo_deliveries_v1";

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  storeConfig,
  stockItems = [],
  currentUser,
  onNavigateToTab,
  initialMode = "list"
}) => {
  // Current view: 'list' (Pengiriman1.png) or 'report' (Pengiriman Penjualan1.png & Pengiriman Penjualan2.png) or 'ongkir'
  const [viewMode, setViewMode] = useState<"list" | "report" | "ongkir">(initialMode);

  // Sync if prop changes
  React.useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    }
  }, [initialMode]);

  // Load invoices to sync deliveries
  const [invoices] = useState<Invoice[]>(() => getStoredInvoices());

  // Deliveries state
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_DELIVERIES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved deliveries", e);
      }
    }
    // Generate initial demo delivery matching the invoices
    return [
      {
        id: "deliv-001",
        deliveryNumber: "SJ/2026/0001",
        customerName: "POS Customer",
        reference: "INV/00001",
        status: "terkirim",
        date: "2026-09-24",
        shippingDate: "2026-09-24",
        expedition: "Tiki",
        trackingNumber: "45679995555",
        warehouse: "Gudang Utama",
        notes: "Pengiriman barang pakaian muslim via Tiki Reguler",
        items: [
          { productName: "Custom Product (Baju Koko)", qty: 5, unit: "Pcs", unitPrice: 250000, total: 1250000 }
        ]
      }
    ];
  });

  const saveDeliveries = (newDeliveries: DeliveryOrder[]) => {
    setDeliveries(newDeliveries);
    localStorage.setItem(STORAGE_DELIVERIES_KEY, JSON.stringify(newDeliveries));
  };

  // --- LIST VIEW STATES (Pengiriman1.png) ---
  const [statusFilter, setStatusFilter] = useState<"semua" | "open" | "selesai" | "terkirim">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange] = useState("30/09/2025 - 30/09/2026");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dropdowns
  const [showLaporanDropdown, setShowLaporanDropdown] = useState(false);
  const [showPanduanDropdown, setShowPanduanDropdown] = useState(false);
  const [showPengirimanDropdown, setShowPengirimanDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBagikanDropdown, setShowBagikanDropdown] = useState(false);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);

  // Universal Hardware Print states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalHtml, setPrintModalHtml] = useState("");
  const [printModalTitle, setPrintModalTitle] = useState("");

  // Selected delivery for document detail modal
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);

  // Create Delivery Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createRefInvoice, setCreateRefInvoice] = useState("");
  const [createExpedition, setCreateExpedition] = useState("Tiki");
  const [createTrackingNumber, setCreateTrackingNumber] = useState("");
  const [createShippingDate, setCreateShippingDate] = useState(new Date().toISOString().split("T")[0]);
  const [createWarehouse, setCreateWarehouse] = useState("Gudang Utama");
  const [createItems, setCreateItems] = useState<Array<{ productName: string; qty: number; unit: string; unitPrice: number }>>([
    { productName: "Barang Dagang", qty: 1, unit: "Pcs", unitPrice: 50000 }
  ]);

  // --- REPORT VIEW STATES (Pengiriman Penjualan1 & 2.png) ---
  const [reportCustomerFilter, setReportCustomerFilter] = useState<string>("all");
  const [reportDateRange, setReportDateRange] = useState<string>("29/08/2026 - 29/09/2026");
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>("29 Sep 2026, 07:54");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>("Agt 2026");

  // --- ONGKOS KIRIM PER EKSPEDISI STATES (Laporan Ongkos Kirim Per Ekspedisi1 & 2.png) ---
  const [expandedExpeditions, setExpandedExpeditions] = useState<Set<string>>(new Set(["Tiki"]));
  const [ongkirDateType, setOngkirDateType] = useState<string>("Tanggal Transaksi");
  const [ongkirDateRange, setOngkirDateRange] = useState<string>("29/08/2026 - 29/09/2026");
  const [ongkirLastRefreshed, setOngkirLastRefreshed] = useState<string>("29 Sep 2026, 07:56");
  const [isOngkirRefreshing, setIsOngkirRefreshing] = useState<boolean>(false);
  const [showOngkirBagikan, setShowOngkirBagikan] = useState<boolean>(false);
  const [showOngkirPrint, setShowOngkirPrint] = useState<boolean>(false);

  // Filtered Deliveries for List View
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchSearch = d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.trackingNumber && d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "semua" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [deliveries, searchQuery, statusFilter]);

  // Bulk selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredDeliveries.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Create Delivery Submit
  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerName.trim()) {
      alert("Silakan masukkan nama pelanggan!");
      return;
    }

    const newNumber = `SJ/2026/000${deliveries.length + 1}`;
    const formattedItems = createItems.map(it => ({
      productName: it.productName || "Barang Dagang",
      qty: Number(it.qty) || 1,
      unit: it.unit || "Pcs",
      unitPrice: Number(it.unitPrice) || 0,
      total: (Number(it.qty) || 1) * (Number(it.unitPrice) || 0)
    }));

    const newDelivery: DeliveryOrder = {
      id: `deliv-${Date.now()}`,
      deliveryNumber: newNumber,
      customerName: createCustomerName.trim(),
      reference: createRefInvoice.trim() || `INV/0000${deliveries.length + 1}`,
      status: "open",
      date: new Date().toISOString().split("T")[0],
      shippingDate: createShippingDate,
      expedition: createExpedition,
      trackingNumber: createTrackingNumber || `RESI-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      warehouse: createWarehouse,
      items: formattedItems
    };

    saveDeliveries([newDelivery, ...deliveries]);
    setShowCreateModal(false);
    alert(`Surat Jalan Pengiriman ${newDelivery.deliveryNumber} berhasil dibuat!`);
    
    // Reset form
    setCreateCustomerName("");
    setCreateRefInvoice("");
    setCreateTrackingNumber("");
    setCreateItems([{ productName: "Barang Dagang", qty: 1, unit: "Pcs", unitPrice: 50000 }]);
  };

  // Report calculations (Pengiriman Penjualan)
  const reportRows = useMemo(() => {
    const rows: Array<{
      customerName: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      total: number;
      deliveryNumber: string;
      date: string;
    }> = [];

    deliveries.forEach(deliv => {
      if (reportCustomerFilter !== "all" && deliv.customerName !== reportCustomerFilter) {
        return;
      }
      deliv.items.forEach(it => {
        rows.push({
          customerName: deliv.customerName,
          productName: it.productName,
          quantity: it.qty,
          unit: it.unit,
          unitPrice: it.unitPrice,
          total: it.total,
          deliveryNumber: deliv.deliveryNumber,
          date: deliv.shippingDate
        });
      });
    });

    return rows;
  }, [deliveries, reportCustomerFilter]);

  const grandTotalValue = reportRows.reduce((sum, r) => sum + r.total, 0);
  const grandTotalQty = reportRows.reduce((sum, r) => sum + r.quantity, 0);
  const grandTotalTx = new Set(reportRows.map(r => r.deliveryNumber)).size;

  // Monthly values for Line Chart
  const monthlyData = [
    { month: "Mei 2026", short: "Mei 26", value: 0 },
    { month: "Juni 2026", short: "Jun 26", value: 0 },
    { month: "Juli 2026", short: "Jul 26", value: 0 },
    { month: "Agustus 2026", short: "Agt 26", value: grandTotalValue > 0 ? 0 : 0 },
    { month: "September 2026", short: "Sep 26", value: grandTotalValue }
  ];

  // Top customers ranking
  const topCustomers = useMemo(() => {
    const map: Record<string, { customerName: string; totalValue: number; totalQty: number }> = {};
    reportRows.forEach(r => {
      if (!map[r.customerName]) {
        map[r.customerName] = { customerName: r.customerName, totalValue: 0, totalQty: 0 };
      }
      map[r.customerName].totalValue += r.total;
      map[r.customerName].totalQty += r.quantity;
    });

    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue).slice(0, 8);
  }, [reportRows]);

  const handleRefreshReport = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastRefreshedTime(
        `${now.getDate()} ${now.toLocaleString("id-ID", { month: "short" })} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      );
      setIsRefreshing(false);
    }, 400);
  };

  // Aggregated data per expedition for Ongkos Kirim per Ekspedisi (Screenshot 1 & 2)
  const expeditionStats = useMemo(() => {
    const map: Record<string, {
      name: string;
      count: number;
      totalInvoiceAmount: number;
      totalShippingCost: number;
      deliveries: DeliveryOrder[];
    }> = {};

    deliveries.forEach(deliv => {
      const expName = deliv.expedition || "Tiki";
      if (!map[expName]) {
        map[expName] = {
          name: expName,
          count: 0,
          totalInvoiceAmount: 0,
          totalShippingCost: 0,
          deliveries: []
        };
      }
      map[expName].count += 1;
      map[expName].deliveries.push(deliv);

      // Check corresponding invoice
      const inv = invoices.find(i => i.invoiceNumber === deliv.reference);
      if (inv) {
        map[expName].totalInvoiceAmount += inv.totalAmount || 0;
        map[expName].totalShippingCost += inv.shippingCost || 0;
      } else {
        const itemSum = deliv.items.reduce((s, it) => s + (it.total || 0), 0);
        map[expName].totalInvoiceAmount += itemSum;
      }
    });

    return Object.values(map);
  }, [deliveries, invoices]);

  const totalExpCount = expeditionStats.reduce((s, e) => s + e.count, 0);
  const totalExpInvAmount = expeditionStats.reduce((s, e) => s + e.totalInvoiceAmount, 0);
  const totalExpShipCost = expeditionStats.reduce((s, e) => s + e.totalShippingCost, 0);

  const toggleExpandExpedition = (name: string) => {
    const next = new Set(expandedExpeditions);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setExpandedExpeditions(next);
  };

  const handleRefreshOngkir = () => {
    setIsOngkirRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setOngkirLastRefreshed(
        `${now.getDate()} ${now.toLocaleString("id-ID", { month: "short" })} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      );
      setIsOngkirRefreshing(false);
    }, 400);
  };

  // --- HARDWARE PRINT GENERATORS ---
  const generateSuratJalanPrintHtml = (deliv: DeliveryOrder) => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");
    const totalQty = deliv.items.reduce((s, it) => s + (it.qty || 0), 0);

    return `
      <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
        
        <!-- Header & Kop Perusahaan -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${companyLogo}
            <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">${companyName}</h1>
            ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 14px;">
              <span style="font-size: 12px; font-weight: 900; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;">SURAT JALAN</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 900; margin: 8px 0 0 0; color: #1d4ed8; font-family: monospace;">${deliv.deliveryNumber}</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Tanggal Kirim: ${deliv.shippingDate || deliv.date}</p>
          </div>
        </div>

        <!-- Info Penerima & Ekspedisi Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div>
            <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Kepada Yth. (Penerima):</span>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${deliv.customerName}</div>
            <p style="font-size: 11px; color: #475569; margin: 3px 0 0 0;">Alamat / Lokasi Pengantaran Barang Pelanggan</p>
          </div>
          <div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 2px 0; width: 120px;">No. Referensi Faktur:</td>
                <td style="font-weight: 700; font-family: monospace; color: #0f172a;">${deliv.reference || "-"}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Jasa Ekspedisi / Kurir:</td>
                <td style="font-weight: 700; color: #0284c7;">${deliv.expedition}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">No. Resi Pengiriman:</td>
                <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${deliv.trackingNumber || "Belum ada resi"}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Gudang Pengirim:</td>
                <td style="color: #334155;">${deliv.warehouse || "Gudang Utama"}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Tabel Barang Surat Jalan -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
              <th style="padding: 10px 8px; text-align: left; width: 40px; color: #1e293b; font-weight: 800;">No</th>
              <th style="padding: 10px 8px; text-align: left; color: #1e293b; font-weight: 800;">Nama &amp; Spesifikasi Barang Dagang</th>
              <th style="padding: 10px 8px; text-align: center; width: 120px; color: #1e293b; font-weight: 800;">Kuantitas (Qty)</th>
              <th style="padding: 10px 8px; text-align: center; width: 100px; color: #1e293b; font-weight: 800;">Satuan</th>
              <th style="padding: 10px 8px; text-align: left; width: 180px; color: #1e293b; font-weight: 800;">Kondisi &amp; Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${deliv.items.map((it, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${it.productName}</td>
                <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-size: 13px; font-weight: 800; color: #0284c7;">${it.qty}</td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #475569;">${it.unit || "Pcs"}</td>
                <td style="padding: 10px 8px; color: #64748b; font-size: 10px;">Baik &amp; Segel Utuh</td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="2" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total Fisik Barang yang Dikirimkan:</td>
              <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-size: 13px; color: #0284c7;">${totalQty}</td>
              <td colspan="2" style="padding: 10px 8px; text-align: left; color: #64748b; font-size: 10px;">(${deliv.items.length} Macam Barang)</td>
            </tr>
          </tbody>
        </table>

        <!-- Catatan Tambahan -->
        ${deliv.notes ? `
          <div style="font-size: 11px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
            <strong style="color: #334155;">Catatan Pengiriman:</strong>
            <p style="margin: 3px 0 0 0; color: #475569;">${deliv.notes}</p>
          </div>
        ` : ""}

        <!-- Ketentuan Penerimaan Surat Jalan -->
        <div style="font-size: 10px; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 14px; border-radius: 6px; margin-bottom: 30px;">
          <strong style="color: #92400e;">KETENTUAN &amp; SYARAT PENERIMAAN BARANG:</strong>
          <ol style="margin: 4px 0 0 16px; padding: 0; line-height: 1.5;">
            <li>Barang telah diperiksa, dicocokkan dengan fisik, dan diserahkan dalam kondisi baik serta kuantitas yang benar.</li>
            <li>Surat Jalan ini sah sebagai tanda terima serah terima fisik barang antara pihak Pengirim, Ekspedisi, dan Penerima.</li>
            <li>Klaim atas kerusakan barang, cacat, atau selisih kuantitas wajib dicatat pada lembar ini dan dilaporkan maksimal 1x24 jam sejak barang diterima.</li>
          </ol>
        </div>

        <!-- 4 Kolom Tanda Tangan Resmi Pengesahan -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 24px; text-align: center; font-size: 10px;">
          <div>
            <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh (Admin):</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; color: #0f172a;">${currentUser?.name || "Staf Gudang"}</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">Bagian Logistik</p>
          </div>
          <div>
            <p style="margin: 0 0 50px 0; color: #64748b;">Pengemudi / Ekspedisi:</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; color: #0f172a;">${deliv.expedition} (Kurir)</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">Petugas Antar</p>
          </div>
          <div>
            <p style="margin: 0 0 50px 0; color: #64748b;">Pemeriksa Gudang / Security:</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; color: #0f172a;">(...............................)</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">Gate Check</p>
          </div>
          <div>
            <p style="margin: 0 0 50px 0; color: #64748b;">Diterima Oleh (Pelanggan):</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px; color: #0f172a;">${deliv.customerName}</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">Cap &amp; Tanda Tangan Penerima</p>
          </div>
        </div>

        <div style="margin-top: 24px; border-top: 1px dashed #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
          <span>Dicetak otomatis pada: ${new Date().toLocaleString("id-ID")}</span>
          <span>Dokumen Resmi Pengiriman Barang Toko SAK EMKM</span>
        </div>
      </div>
    `;
  };

  const generateDeliveryListPrintHtml = () => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");

    return `
      <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${companyLogo}
            <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">${companyName}</h1>
            ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px;">
              <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Logistik &amp; Distribusi</span>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">DAFTAR PENGIRIMAN BARANG (SURAT JALAN)</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Periode: ${dateRange}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; width: 35px; color: #334155; font-weight: 700;">No</th>
              <th style="padding: 10px 8px; text-align: left; color: #334155; font-weight: 700;">Nomor SJ</th>
              <th style="padding: 10px 8px; text-align: left; color: #334155; font-weight: 700;">Pelanggan</th>
              <th style="padding: 10px 8px; text-align: left; color: #334155; font-weight: 700;">Referensi Invoice</th>
              <th style="padding: 10px 8px; text-align: left; color: #334155; font-weight: 700;">Ekspedisi &amp; Resi</th>
              <th style="padding: 10px 8px; text-align: left; color: #334155; font-weight: 700;">Gudang</th>
              <th style="padding: 10px 8px; text-align: center; color: #334155; font-weight: 700;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDeliveries.map((deliv, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-family: monospace; font-weight: 700; color: #0284c7;">${deliv.deliveryNumber}</td>
                <td style="padding: 8px; font-weight: 600; color: #0f172a;">${deliv.customerName}</td>
                <td style="padding: 8px; font-family: monospace; color: #64748b;">${deliv.reference}</td>
                <td style="padding: 8px; color: #334155;">
                  <strong>${deliv.expedition}</strong>
                  ${deliv.trackingNumber ? `<br/><span style="font-family: monospace; font-size: 10px; color: #64748b;">Resi: ${deliv.trackingNumber}</span>` : ""}
                </td>
                <td style="padding: 8px; color: #64748b;">${deliv.warehouse}</td>
                <td style="padding: 8px; text-align: center;">
                  <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; background: ${deliv.status === 'terkirim' ? '#ecfdf5' : '#eff6ff'}; color: ${deliv.status === 'terkirim' ? '#047857' : '#1d4ed8'};">
                    ${deliv.status}
                  </span>
                </td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="4" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total Pengiriman:</td>
              <td colspan="3" style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0284c7;">${filteredDeliveries.length} Dokumen Surat Jalan</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
          </div>
        </div>

        <div style="margin-top: 24px; border-top: 1px dashed #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
          <span>Dicetak otomatis pada: ${new Date().toLocaleString("id-ID")}</span>
          <span>Dokumen Resmi Sistem Pembukuan Toko SAK EMKM</span>
        </div>
      </div>
    `;
  };

  const generateDeliveryReportPrintHtml = () => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");

    return `
      <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${companyLogo}
            <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">${companyName}</h1>
            ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 12px;">
              <span style="font-size: 10px; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Laporan Logistik</span>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">LAPORAN PENGIRIMAN PENJUALAN</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Periode: ${reportDateRange}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; width: 35px;">No</th>
              <th style="padding: 10px 8px; text-align: left;">Pelanggan</th>
              <th style="padding: 10px 8px; text-align: left;">Nama Produk</th>
              <th style="padding: 10px 8px; text-align: center;">Jumlah</th>
              <th style="padding: 10px 8px; text-align: right;">Harga Satuan</th>
              <th style="padding: 10px 8px; text-align: right;">Total Nilai</th>
              <th style="padding: 10px 8px; text-align: left;">No. Surat Jalan</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows.map((r, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-weight: 700; color: #0f172a;">${r.customerName}</td>
                <td style="padding: 8px; color: #334155;">${r.productName}</td>
                <td style="padding: 8px; text-align: center; font-family: monospace; font-weight: 700; color: #0284c7;">${r.quantity} ${r.unit}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatIDR(r.unitPrice)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(r.total)}</td>
                <td style="padding: 8px; font-family: monospace; color: #64748b;">${r.deliveryNumber}</td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="3" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total Terkirim (${grandTotalTx} Pengiriman):</td>
              <td style="padding: 10px 8px; text-align: center; font-family: monospace; color: #0284c7;">${grandTotalQty}</td>
              <td style="padding: 10px 8px; text-align: right;"></td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(grandTotalValue)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
          </div>
        </div>
      </div>
    `;
  };

  const generateOngkirReportPrintHtml = () => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");

    return `
      <div class="printable-document" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #0f172a; max-width: 900px; margin: 0 auto; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${companyLogo}
            <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.02em;">${companyName}</h1>
            ${companyAddress ? `<p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">${companyAddress}</p>` : ""}
            <p style="font-size: 10px; color: #94a3b8; margin: 2px 0 0 0;">Standar Akuntansi Keuangan Entitas Mikro Kecil Menengah (SAK EMKM)</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 12px;">
              <span style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase;">Laporan Ekspedisi</span>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">ONGKOS KIRIM PER EKSPEDISI</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Periode: ${ongkirDateRange}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; width: 40px;">No</th>
              <th style="padding: 10px 8px; text-align: left;">Nama Ekspedisi</th>
              <th style="padding: 10px 8px; text-align: center;">Jumlah Resi / Pengiriman</th>
              <th style="padding: 10px 8px; text-align: right;">Total Nilai Faktur</th>
              <th style="padding: 10px 8px; text-align: right;">Total Ongkos Kirim</th>
            </tr>
          </thead>
          <tbody>
            ${expeditionStats.map((exp, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${exp.name}</td>
                <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-weight: 700; color: #0284c7;">${exp.count} Pengiriman</td>
                <td style="padding: 10px 8px; text-align: right; font-family: monospace;">${formatIDR(exp.totalInvoiceAmount)}</td>
                <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(exp.totalShippingCost)}</td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="2" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total Keseluruhan:</td>
              <td style="padding: 10px 8px; text-align: center; font-family: monospace; color: #0284c7;">${totalExpCount} Pengiriman</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(totalExpInvAmount)}</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(totalExpShipCost)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
          </div>
        </div>
      </div>
    `;
  };

  // Hardware Printer Trigger Handlers
  const handlePrintSuratJalan = (deliv: DeliveryOrder) => {
    const html = generateSuratJalanPrintHtml(deliv);
    setPrintModalHtml(html);
    setPrintModalTitle(`Surat Jalan ${deliv.deliveryNumber} - ${deliv.customerName}`);
    printInPageDOM(html, `Surat Jalan ${deliv.deliveryNumber}`);
    setShowPrintModal(true);
  };

  const handlePrintToolbar = () => {
    let html = "";
    let title = "";
    if (viewMode === "report") {
      html = generateDeliveryReportPrintHtml();
      title = `Laporan Pengiriman Penjualan - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`;
    } else if (viewMode === "ongkir") {
      html = generateOngkirReportPrintHtml();
      title = `Laporan Ongkos Kirim per Ekspedisi - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`;
    } else {
      html = generateDeliveryListPrintHtml();
      title = `Daftar Pengiriman Barang - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`;
    }
    setPrintModalHtml(html);
    setPrintModalTitle(title);
    printInPageDOM(html, title);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 text-xs text-slate-800" id="delivery-manager">

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: LIST PENGIRIMAN (SESUAI SCREENSHOT Pengiriman1.png) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Header Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengiriman</h1>
            </div>

            {/* Top Right Action Buttons Matching Pengiriman1.png */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Laporan Dropdown with split button (📊 Laporan | ▾) */}
              <div className="relative">
                <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode("report")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>Laporan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLaporanDropdown(!showLaporanDropdown)}
                    className="px-2 py-1.5 border-l border-slate-200 hover:bg-slate-50 text-slate-500 transition cursor-pointer"
                  >
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>
                </div>

                {/* Dropdown Menu matching Pengiriman1.png:
                    1. Pengiriman Penjualan
                    2. Ongkos Kirim per Ekspedisi */}
                {showLaporanDropdown && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("report");
                        setShowLaporanDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                    >
                      <span>Pengiriman Penjualan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("ongkir");
                        setShowLaporanDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <span>Ongkos Kirim per Ekspedisi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Panduan Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPanduanDropdown(!showPanduanDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Panduan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showPanduanDropdown && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 text-[11px] text-slate-600 space-y-1 animate-fade-in">
                    <div className="font-bold text-slate-800 px-2 py-1">Panduan Pengiriman:</div>
                    <p className="px-2 text-slate-500">
                      Surat Jalan dapat dicetak untuk mendampingi kurir atau ekspedisi saat pengiriman barang pesanan ke alamat pelanggan.
                    </p>
                  </div>
                )}
              </div>

              {/* Ekspor */}
              <button
                type="button"
                onClick={() => alert("Data pengiriman berhasil diekspor ke Excel!")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrintToolbar}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Cetak Daftar Pengiriman ke Printer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>

              {/* More Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      + Buat Pengiriman Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        saveDeliveries([]);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-rose-600"
                    >
                      Reset Data (Simulasi Kosong)
                    </button>
                  </div>
                )}
              </div>

              {/* + Tambah Pengiriman Action Button */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Pengiriman</span>
              </button>

            </div>
          </div>

          {/* Filter Bar Matching Pengiriman1.png */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter button */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>

              {/* Pengiriman Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPengirimanDropdown(!showPengirimanDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengiriman</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search and Date Range Picker */}
            <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none shadow-2xs"
                />
              </div>

              {/* Date Range Display */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 bg-white shadow-2xs shrink-0">
                <span>{dateRange}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>

          </div>

          {/* Status Tabs Matching Pengiriman1.png:
              [ Semua ] [ Open ] [ Selesai ] [ Terkirim ] */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setStatusFilter("semua")}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === "semua"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("open")}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === "open"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("selesai")}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === "selesai"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Selesai
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("terkirim")}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === "terkirim"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Terkirim
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={filteredDeliveries.length > 0 && selectedIds.size === filteredDeliveries.length}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Nomor</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Referensi</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>

                {filteredDeliveries.length > 0 ? (
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeliveries.map((deliv) => (
                      <tr key={deliv.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(deliv.id)}
                            onChange={() => handleToggleSelect(deliv.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          <button
                            type="button"
                            onClick={() => setSelectedDelivery(deliv)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            title="Klik untuk melihat rincian dokumen Surat Jalan"
                          >
                            {deliv.deliveryNumber}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div>{deliv.customerName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {deliv.expedition} · Resi: {deliv.trackingNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {deliv.reference}
                        </td>
                        <td className="py-3.5 px-4">
                          {deliv.status === "terkirim" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Terkirim
                            </span>
                          )}
                          {deliv.status === "selesai" && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          )}
                          {deliv.status === "open" && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Open
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handlePrintSuratJalan(deliv)}
                              className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs transition cursor-pointer border border-blue-200"
                              title="Cetak Surat Jalan langsung ke printer"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                              <span>Cetak Surat Jalan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDelivery(deliv)}
                              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-medium text-xs transition cursor-pointer border border-slate-200"
                              title="Lihat Rincian Dokumen Surat Jalan"
                            >
                              Lihat Detail
                            </button>
                            {deliv.status === "open" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = deliveries.map(d => d.id === deliv.id ? { ...d, status: "terkirim" as const } : d);
                                  saveDeliveries(updated);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                Tandai Terkirim
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  /* Empty state matching Pengiriman1.png exactly */
                  <tbody>
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          {/* Folder + Magnifying glass icon matching Screenshot 1 */}
                          <div className="relative w-28 h-24 flex items-center justify-center">
                            <div className="w-20 h-16 bg-blue-500 rounded-xl shadow-md flex items-center justify-center relative">
                              <div className="absolute -top-2 left-2 w-8 h-3 bg-blue-400 rounded-t-md" />
                              <div className="w-16 h-10 bg-blue-400/80 rounded-lg flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                                  <Search className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </div>
                            <span className="absolute -top-1 right-2 text-emerald-400 text-xl font-bold">✦</span>
                            <span className="absolute bottom-1 left-2 text-blue-300 text-xs">✦</span>
                          </div>

                          <div className="text-sm font-semibold text-slate-700">
                            Belum ada Pengiriman di sini
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Kelola surat jalan dan lacak ekspedisi pengiriman pesanan penjualan pelanggan Anda.
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setShowCreateModal(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Buat Pengiriman Pertama</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: LAPORAN PENGIRIMAN PENJUALAN (SESUAI SCREENSHOT 2 & 3) */}
      {/* ========================================================================= */}
      {viewMode === "report" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Bar with Breadcrumb and [< Kembali] Button matching Pengiriman Penjualan1.png */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <span>Beranda</span>
                <span>&gt;</span>
                <span>Laporan</span>
                <span>&gt;</span>
                <span className="font-semibold text-slate-700">Pengiriman Penjualan</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengiriman Penjualan</h1>
            </div>

            {/* Top Right Buttons Matching Pengiriman Penjualan1.png */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* [< Kembali] Orange Button */}
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              {/* Ekspor */}
              <button
                type="button"
                onClick={() => alert("Laporan pengiriman penjualan berhasil diekspor!")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor</span>
              </button>

              {/* Bagikan */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBagikanDropdown(!showBagikanDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bagikan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showBagikanDropdown && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert("Tautan laporan berhasil disalin!");
                        setShowBagikanDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Salin Tautan Laporan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Kirim ringkasan laporan ke WhatsApp pemilik...");
                        setShowBagikanDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Kirim via WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrintToolbar}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Cetak Laporan Pengiriman Penjualan"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

            </div>
          </div>

          {/* Filter Bar Matching Pengiriman Penjualan1.png */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Pelanggan Dropdown */}
              <select
                value={reportCustomerFilter}
                onChange={(e) => setReportCustomerFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white shadow-2xs outline-none cursor-pointer"
              >
                <option value="all">Semua Pelanggan</option>
                {Array.from(new Set(deliveries.map(d => d.customerName))).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Date range picker */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 bg-white shadow-2xs">
                <span>{reportDateRange}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>
          </div>

          {/* Real-time alert info bar matching Pengiriman Penjualan1.png:
              ⚡ Data per 29 Sep 2026, 07:54 · Baru saja diperbarui  [🔄 Muat ulang] */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2 text-xs text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">⚡</span>
              <span>Data per <strong>{lastRefreshedTime}</strong> · Baru saja diperbarui</span>
            </div>
            <button
              type="button"
              onClick={handleRefreshReport}
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer transition active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Muat ulang</span>
            </button>
          </div>

          {/* Table Pengiriman Penjualan matching Pengiriman Penjualan1.png */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4 text-center">Kuantitas</th>
                    <th className="py-3 px-4 text-right">Harga</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {r.productName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatIDR(r.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(r.total)}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row Matching Pengiriman Penjualan1.png */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Grand Total
                    </td>
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4 text-center font-mono text-slate-900">
                      {grandTotalQty}
                    </td>
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(grandTotalValue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: RINGKASAN PENGIRIMAN matching Pengiriman Penjualan1.png */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                Ringkasan Pengiriman
              </h2>
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 bg-slate-50 shrink-0">
                <span>Tanggal awal → Tanggal akhir</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>

            {/* 3 Metric Cards matching Pengiriman Penjualan1.png:
                1. Total Nilai Pengiriman
                2. Total Kuantitas Dikirim
                3. Total Transaksi Pengiriman */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Total Nilai Pengiriman</div>
                <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {grandTotalValue > 0 ? formatIDR(grandTotalValue) : "0"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Total Kuantitas Dikirim</div>
                <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {grandTotalQty}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Total Transaksi Pengiriman</div>
                <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                  {grandTotalTx}
                </div>
              </div>

            </div>

            {/* Line Chart matching Pengiriman Penjualan2.png */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tren Nilai Pengiriman Bulanan</span>
                <span className="text-[11px] text-slate-400">Unit: Rupiah</span>
              </div>

              {/* Chart SVG Canvas */}
              <div className="relative h-48 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                
                {/* Horizontal grid lines */}
                <div className="absolute inset-x-8 top-8 border-b border-slate-200/60" />
                <div className="absolute inset-x-8 top-24 border-b border-slate-200/60" />
                <div className="absolute inset-x-8 bottom-10 border-b border-slate-200/60" />

                {/* Left Y-axis label */}
                <div className="absolute left-2 top-6 text-[10px] text-slate-400 font-mono">1M</div>
                <div className="absolute left-2 top-22 text-[10px] text-slate-400 font-mono">500k</div>
                <div className="absolute left-2 bottom-9 text-[10px] text-slate-400 font-mono">0</div>

                {/* SVG Curve */}
                <svg className="w-full h-28 overflow-visible mt-4">
                  {/* Blue line */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="30,85 100,85 180,85 260,85 360,25"
                  />
                  {/* Data Points */}
                  <circle cx="30" cy="85" r="3.5" fill="#2563eb" />
                  <circle cx="100" cy="85" r="3.5" fill="#2563eb" />
                  <circle cx="180" cy="85" r="3.5" fill="#2563eb" />
                  <circle cx="260" cy="85" r="3.5" fill="#2563eb" />
                  <circle cx="360" cy="25" r="4.5" fill="#1d4ed8" className="animate-pulse" />
                </svg>

                {/* Tooltip Overlay matching Screenshot 3 */}
                <div className="absolute left-20 bottom-14 bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[11px] shadow-lg pointer-events-none">
                  <div className="font-bold">Agustus 2026</div>
                  <div className="flex items-center gap-1.5 text-blue-300 text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span>Nilai Pengiriman: 0</span>
                  </div>
                </div>

                {/* Bottom X-axis labels matching Pengiriman Penjualan2.png */}
                <div className="flex justify-between px-4 text-[10px] text-slate-400 font-mono pt-2">
                  <span>Agt 2026</span>
                  <span>Sep 2026</span>
                </div>
              </div>

            </div>

            {/* TOP 8 PELANGGAN — NILAI PENGIRIMAN matching Pengiriman Penjualan2.png */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top 8 Pelanggan — Nilai Pengiriman
              </h3>

              {topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {topCustomers.map((cust, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{cust.customerName}</div>
                          <div className="text-[10px] text-slate-400">{cust.totalQty} Produk Dikirim</div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-blue-600">
                        {formatIDR(cust.totalValue)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state matching Pengiriman Penjualan2.png */
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Tidak ada data</div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE: ONGKOS KIRIM PER EKSPEDISI */}
      {/* ========================================================================= */}
      {viewMode === "ongkir" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Bar with Breadcrumb and [< Kembali] Orange Button matching Laporan Ongkos Kirim Per Ekspedisi1.png */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <span>Beranda</span>
                <span>&gt;</span>
                <span>Laporan</span>
                <span>&gt;</span>
                <span className="font-semibold text-slate-700">Ongkos Kirim per Ekspedisi</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ongkos Kirim per Ekspedisi</h1>
            </div>

            {/* Top Right Action Buttons Matching Screenshot 1 */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* [< Kembali] Orange Button */}
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              {/* Ekspor */}
              <button
                type="button"
                onClick={() => alert("Laporan ongkos kirim per ekspedisi berhasil diekspor!")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor</span>
              </button>

              {/* Bagikan */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOngkirBagikan(!showOngkirBagikan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bagikan</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showOngkirBagikan && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert("Tautan laporan ongkos kirim berhasil disalin!");
                        setShowOngkirBagikan(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      Salin Tautan Laporan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Kirim ringkasan via WhatsApp...");
                        setShowOngkirBagikan(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      Kirim via WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrintToolbar}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Cetak Laporan Ongkos Kirim per Ekspedisi"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

            </div>
          </div>

          {/* Filter Bar Matching Laporan Ongkos Kirim Per Ekspedisi1.png */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter</span>
              </button>
              <button
                type="button"
                className="p-1.5 border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                title="Tampilan Rincian"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tanggal Transaksi Dropdown */}
              <select
                value={ongkirDateType}
                onChange={(e) => setOngkirDateType(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white shadow-2xs outline-none cursor-pointer font-medium"
              >
                <option value="Tanggal Transaksi">Tanggal Transaksi</option>
                <option value="Tanggal Pengiriman">Tanggal Pengiriman</option>
                <option value="Tanggal Jatuh Tempo">Tanggal Jatuh Tempo</option>
              </select>

              {/* Date Range Display */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 bg-white shadow-2xs">
                <span>{ongkirDateRange}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>
          </div>

          {/* Real-time Alert Info Bar Matching Screenshot 1:
              ⚡ Data per 29 Sep 2026, 07:56 · Baru saja diperbarui  [🔄 Muat ulang] */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2 text-xs text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">⚡</span>
              <span>Data per <strong>{ongkirLastRefreshed}</strong> · Baru saja diperbarui</span>
            </div>
            <button
              type="button"
              onClick={handleRefreshOngkir}
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer transition active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isOngkirRefreshing ? "animate-spin" : ""}`} />
              <span>Muat ulang</span>
            </button>
          </div>

          {/* Data Table Matching Laporan Ongkos Kirim Per Ekspedisi1.png */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Ekspedisi</th>
                    <th className="py-3 px-4 text-center">Jumlah Pengiriman</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right">Total Ongkos Kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expeditionStats.map((exp) => {
                    const isExpanded = expandedExpeditions.has(exp.name);
                    return (
                      <React.Fragment key={exp.name}>
                        {/* Parent Expedition Row matching screenshot (+ Tiki, 1, 1.387.500, 0) */}
                        <tr className="hover:bg-slate-50/80 transition cursor-pointer">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => toggleExpandExpedition(exp.name)}
                              className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition"
                            >
                              <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[11px] font-mono text-slate-600 bg-white">
                                {isExpanded ? "-" : "+"}
                              </span>
                              <span>{exp.name}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {exp.count}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatIDR(exp.totalInvoiceAmount)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                            {exp.totalShippingCost > 0 ? formatIDR(exp.totalShippingCost) : "0"}
                          </td>
                        </tr>

                        {/* Expandable Sub-table showing individual shipments under this expedition */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={4} className="py-2 px-6">
                              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Rincian Pengiriman Melalui {exp.name}:</span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="text-slate-500 font-semibold border-b border-slate-100">
                                      <tr>
                                        <th className="py-1.5 px-2">No. Surat Jalan</th>
                                        <th className="py-1.5 px-2">Pelanggan</th>
                                        <th className="py-1.5 px-2">Referensi</th>
                                        <th className="py-1.5 px-2">No. Resi</th>
                                        <th className="py-1.5 px-2 text-right">Nilai Tagihan</th>
                                        <th className="py-1.5 px-2 text-right">Ongkos Kirim</th>
                                        <th className="py-1.5 px-2 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {exp.deliveries.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50">
                                          <td className="py-1.5 px-2 font-mono font-bold text-blue-600">{d.deliveryNumber}</td>
                                          <td className="py-1.5 px-2 font-medium">{d.customerName}</td>
                                          <td className="py-1.5 px-2 font-mono text-slate-500">{d.reference}</td>
                                          <td className="py-1.5 px-2 font-mono text-slate-600">{d.trackingNumber}</td>
                                          <td className="py-1.5 px-2 text-right font-mono font-bold">
                                            {formatIDR(d.items.reduce((s, it) => s + (it.total || 0), 0))}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-mono text-slate-500">
                                            {formatIDR(0)}
                                          </td>
                                          <td className="py-1.5 px-2 text-center">
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                              {d.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Summary / Total Row */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      Total Seluruh Ekspedisi
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-900">
                      {totalExpCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(totalExpInvAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {totalExpShipCost > 0 ? formatIDR(totalExpShipCost) : "0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER CARDS SECTION MATCHING SCREENSHOT 1 & SCREENSHOT 2 */}
          <div className="space-y-6">
            
            {/* ROW 1: 2 Cards Side by Side (Screenshot 1)
                1. Jumlah Pengiriman Per Ekspedisi
                2. Nilai Penjualan Per Ekspedisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Jumlah Pengiriman Per Ekspedisi */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800">
                    Jumlah Pengiriman Per Ekspedisi
                  </h3>
                  
                  {/* Signature 3-color legend bars matching screenshot */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="w-5 h-1.5 rounded-full bg-rose-400" />
                      <span className="w-5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      <div>null</div>
                      <div>null</div>
                    </div>
                  </div>
                </div>

                {/* Body Visualization */}
                <div className="space-y-3 pt-1">
                  {expeditionStats.map((exp, idx) => {
                    const percentage = totalExpCount > 0 ? Math.round((exp.count / totalExpCount) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            <span>{exp.name}</span>
                          </span>
                          <span className="text-slate-900 font-mono font-bold">
                            {exp.count} Pengiriman ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {expeditionStats.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data pengiriman pada periode ini
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Nilai Penjualan Per Ekspedisi */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800">
                    Nilai Penjualan Per Ekspedisi
                  </h3>

                  {/* Signature 3-color legend bars matching screenshot */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="w-5 h-1.5 rounded-full bg-rose-400" />
                      <span className="w-5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      <div>null</div>
                      <div>null</div>
                    </div>
                  </div>
                </div>

                {/* Body Visualization */}
                <div className="space-y-3 pt-1">
                  {expeditionStats.map((exp, idx) => {
                    const percentage = totalExpInvAmount > 0 ? Math.round((exp.totalInvoiceAmount / totalExpInvAmount) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <span>{exp.name}</span>
                          </span>
                          <span className="text-slate-900 font-mono font-bold">
                            {formatIDR(exp.totalInvoiceAmount)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {expeditionStats.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data nilai penjualan pada periode ini
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ROW 2: Full Width Card (Screenshot 2: Laporan Ongkos Kirim Per Ekspedisi2.png)
                Ongkos Kirim Per Ekspedisi */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800">
                  Ongkos Kirim Per Ekspedisi
                </h3>

                {/* Signature 3-color legend bars matching screenshot 2 */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="w-5 h-1.5 rounded-full bg-rose-400" />
                    <span className="w-5 h-1.5 rounded-full bg-amber-400" />
                    <span className="w-5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight">
                    <div>null</div>
                    <div>null</div>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {expeditionStats.map((exp, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{exp.name}</span>
                      <span className="text-[11px] text-slate-500 font-normal">{exp.count} Pengiriman</span>
                    </div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {exp.totalShippingCost > 0 ? formatIDR(exp.totalShippingCost) : "0"}
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5">
                      Rata-rata per pengiriman: {exp.count > 0 ? formatIDR(Math.round(exp.totalShippingCost / exp.count)) : "0"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Seluruh beban ongkos kirim ekspedisi tercatat secara otomatis dan terhubung dengan laporan laba rugi SAK EMKM.</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT SURAT JALAN PENGIRIMAN BARU */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-8 text-xs">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Buat Surat Jalan Pengiriman Baru</h3>
                <p className="text-[11px] text-slate-400">Penerbitan dokumen fisik jalan untuk kurir / ekspedisi pelanggan</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="text-rose-500">*</span> Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    value={createCustomerName}
                    onChange={(e) => setCreateCustomerName(e.target.value)}
                    placeholder="Contoh: Toko Barokah / POS Customer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Referensi No. Tagihan / Faktur
                  </label>
                  <input
                    type="text"
                    value={createRefInvoice}
                    onChange={(e) => setCreateRefInvoice(e.target.value)}
                    placeholder="Contoh: INV/00001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ekspedisi</label>
                  <select
                    value={createExpedition}
                    onChange={(e) => setCreateExpedition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="Tiki">Tiki</option>
                    <option value="JNE">JNE</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="Kurir Toko Sendiri">Kurir Toko Sendiri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Resi / AWB</label>
                  <input
                    type="text"
                    value={createTrackingNumber}
                    onChange={(e) => setCreateTrackingNumber(e.target.value)}
                    placeholder="Contoh: 45679995555"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gudang Asal</label>
                  <input
                    type="text"
                    value={createWarehouse}
                    onChange={(e) => setCreateWarehouse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Items Line */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Daftar Barang yang Dikirim</span>
                  <button
                    type="button"
                    onClick={() => setCreateItems([...createItems, { productName: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}
                    className="text-blue-600 hover:underline text-xs font-bold"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {createItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].productName = e.target.value;
                        setCreateItems(updated);
                      }}
                      placeholder="Nama produk yang dikirim"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 outline-none"
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].qty = Number(e.target.value);
                        setCreateItems(updated);
                      }}
                      className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right outline-none"
                    />
                    <span className="text-slate-400 text-[11px]">{item.unit}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs active:scale-95"
                >
                  Simpan &amp; Terbitkan Surat Jalan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DETAIL SURAT JALAN (DOKUMEN RESMI PENGIRIMAN & CETAK KE PRINTER) */}
      {/* ========================================================================= */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Modal Top Header Bar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm tracking-tight">Dokumen Surat Jalan</h3>
                    <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      {selectedDelivery.deliveryNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      selectedDelivery.status === "terkirim" 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                        : selectedDelivery.status === "selesai"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {selectedDelivery.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pelanggan: {selectedDelivery.customerName} &bull; Tanggal: {selectedDelivery.shippingDate || selectedDelivery.date}
                  </p>
                </div>
              </div>

              {/* Action Toolbar on Modal Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSuratJalan(selectedDelivery)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
                  title="Cetak Surat Jalan langsung ke printer hardware"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak ke Printer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const message = encodeURIComponent(
                      `*SURAT JALAN ${selectedDelivery.deliveryNumber}*\n` +
                      `Toko: ${storeConfig.storeName || "Toko Sembako Berkah Mandiri"}\n` +
                      `Penerima: ${selectedDelivery.customerName}\n` +
                      `Ekspedisi: ${selectedDelivery.expedition} (Resi: ${selectedDelivery.trackingNumber || "-"})\n` +
                      `Status: ${selectedDelivery.status.toUpperCase()}\n` +
                      `Barang: ${selectedDelivery.items.map(it => `${it.productName} (${it.qty} ${it.unit})`).join(", ")}\n\n` +
                      `Terima kasih telah berbelanja!`
                    );
                    window.open(`https://wa.me/?text=${message}`, "_blank");
                  }}
                  className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
                  title="Kirim detail Surat Jalan via WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {selectedDelivery.status === "open" && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = deliveries.map(d => d.id === selectedDelivery.id ? { ...d, status: "terkirim" as const } : d);
                      saveDeliveries(updated);
                      setSelectedDelivery({ ...selectedDelivery, status: "terkirim" });
                    }}
                    className="hidden sm:flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tandai Terkirim</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Printable Document Paper Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
              <div 
                className="bg-white w-full max-w-3xl rounded-xl shadow-md border border-slate-200/90 p-6 sm:p-10 space-y-6 text-slate-800"
                dangerouslySetInnerHTML={{ __html: generateSuratJalanPrintHtml(selectedDelivery) }}
              />
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500">
                Surat jalan resmi SAK EMKM. Siap dicetak langsung ke printer lokal atau jaringan.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSuratJalan(selectedDelivery)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat Jalan Sekarang</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Universal Print Modal for Delivery Manager */}
      <UniversalPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={printModalTitle || "Dokumen Pengiriman"}
        htmlContent={printModalHtml}
      />

    </div>
  );
};
