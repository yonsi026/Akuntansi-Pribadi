import React, { useState, useMemo } from "react";
import { 
  ShoppingCart, 
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
  Eye, 
  EyeOff, 
  Send, 
  Mail, 
  MessageSquare, 
  SlidersHorizontal, 
  Trash2, 
  X, 
  FileText, 
  Download,
  Check,
  Paperclip,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Smile,
  List,
  ListOrdered,
  LayoutDashboard,
  Truck
} from "lucide-react";
import { StockItem, StoreConfig, UserAccount } from "../types";
import { formatIDR } from "./FinanceDashboard";
import { UniversalPrintModal } from "./UniversalPrintModal";
import { printInPageDOM } from "../utils/printHelper";

export interface SalesOrderItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;    // e.g. "SO/00001"
  customerName: string;   // e.g. "POS Customer"
  reference?: string;     // PO / Customer ref
  transactionDate: string;// YYYY-MM-DD
  dueDate: string;        // YYYY-MM-DD
  status: "open" | "dikirim_sebagian" | "selesai" | "dibatalkan";
  downPayment: number;    // DP
  totalAmount: number;    // Total SO
  items: SalesOrderItem[];
  notes?: string;
}

interface OrderManagerProps {
  storeConfig: StoreConfig;
  stockItems?: StockItem[];
  currentUser?: UserAccount | null;
  onNavigateToTab?: (tab: string, sub?: string) => void;
  initialMode?: "list" | "report";
  initialShowCreate?: boolean;
}

const STORAGE_SALES_ORDERS_KEY = "kledo_sales_orders_v1";

export const OrderManager: React.FC<OrderManagerProps> = ({
  storeConfig,
  stockItems = [],
  currentUser,
  onNavigateToTab,
  initialMode = "list",
  initialShowCreate = false
}) => {
  // Current view mode: 'list' (Pemesanan.png / Pemesanan1.png) or 'report' (Pemesanan per produk2a.png)
  const [viewMode, setViewMode] = useState<"list" | "report">(initialMode);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  React.useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    }
  }, [initialMode]);

  React.useEffect(() => {
    if (initialShowCreate) {
      setShowCreateModal(true);
    }
  }, [initialShowCreate]);

  // Demo initial sales order matching Pemesanan.png exactly:
  // SO/00001 | POS Customer | Referensi - | Tgl. Jatuh Tempo 24/10/2026 | Status: Open | DP: 5.550.000 | Total: 5.550.000
  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_SALES_ORDERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved orders", e);
      }
    }
    return [
      {
        id: "so-001",
        orderNumber: "SO/00001",
        customerName: "POS Customer",
        reference: "",
        transactionDate: "2026-09-24",
        dueDate: "2026-10-24",
        status: "open",
        downPayment: 5550000,
        totalAmount: 5550000,
        items: [
          {
            id: "item-so-1",
            productCode: "POS/00001",
            productName: "Custom Product",
            quantity: 20,
            unit: "Pcs",
            unitPrice: 250000,
            total: 5000000
          },
          {
            id: "item-so-2",
            productCode: "SRV/00001",
            productName: "Biaya Layanan & Ekspedisi",
            quantity: 1,
            unit: "Paket",
            unitPrice: 550000,
            total: 550000
          }
        ],
        notes: "Pesanan pelanggan sales order resmi"
      }
    ];
  });

  const saveOrders = (newOrders: SalesOrder[]) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_SALES_ORDERS_KEY, JSON.stringify(newOrders));
  };

  // --- LIST VIEW STATES (Pemesanan.png & Pemesanan1.png) ---
  const [statusFilter, setStatusFilter] = useState<"semua" | "open" | "dikirim_sebagian" | "selesai" | "lainnya">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange] = useState("01/10/2025 - 01/10/2026");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDpTotal, setShowDpTotal] = useState(false);
  const [showTotalTotal, setShowTotalTotal] = useState(false);

  // Dropdowns in List View
  const [showLaporanDropdown, setShowLaporanDropdown] = useState(false);
  const [showPanduanDropdown, setShowPanduanDropdown] = useState(false);
  const [showPemesananDropdown, setShowPemesananDropdown] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLainnyaStatusMenu, setShowLainnyaStatusMenu] = useState(false);

  // Create Order Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createOrderNumber, setCreateOrderNumber] = useState(`SO/0000${orders.length + 1}`);
  const [createRef, setCreateRef] = useState("");
  const [createTxDate, setCreateTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [createDueDate, setCreateDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [createDp, setCreateDp] = useState<number>(0);
  const [createItems, setCreateItems] = useState<Array<{ productName: string; qty: number; unit: string; unitPrice: number }>>([
    { productName: "Custom Product", qty: 20, unit: "Pcs", unitPrice: 250000 }
  ]);

  // --- REPORT VIEW STATES (Pemesanan per produk2a.png) ---
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportDateRange] = useState("01/09/2026 - 01/10/2026");
  const [reportLastRefreshed, setReportLastRefreshed] = useState("1 Okt 2026, 17:38");
  const [isReportRefreshing, setIsReportRefreshing] = useState(false);
  const [showBagikanDropdown, setShowBagikanDropdown] = useState(false);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);

  // Universal Hardware Print Modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printModalHtml, setPrintModalHtml] = useState("");
  const [printModalTitle, setPrintModalTitle] = useState("");

  // Modal Email (Pemesanan per produk2b.png)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("adv.digital026@gmail.com");
  const [emailFrom] = useState("adv.digital026@gmail.com");
  const [emailSubject, setEmailSubject] = useState(`Laporan Pemesanan Per Produk ${storeConfig.storeName || "PT. BUMI MANIS BERKAH"} 1 September 2026 - 1 Oktober 2026`);
  const [emailBody, setEmailBody] = useState(`Berikut kami attach file Laporan Pemesanan Per Produk ${storeConfig.storeName || "PT. BUMI MANIS BERKAH"} 1 September 2026 - 1 Oktober 2026.\n\nTerima kasih atas kerja samanya.\n\n${storeConfig.storeName || "PT Kledo Berhati Nyaman"}.`);

  // Modal WhatsApp (Pemesanan per produk2c.png)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [waTargetPhone, setWaTargetPhone] = useState("085883444796");
  const [waMessage, setWaMessage] = useState(`Berikut Laporan Pemesanan Per Produk ${storeConfig.storeName || "PT. BUMI MANIS BERKAH"} 1 September 2026 - 1 Oktober 2026\n\nhttps://kledo-live-user.s3.ap-southeast-1.amazonaws.com/report/pdf/1f0931bde94f1c1a3e27cf95f91b9edb1f49524e42b26f96c772f2a3b5da1b4.pdf`);

  // Filtered Orders for List View
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.reference && o.reference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "semua" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Aggregate product sales for Pemesanan per Produk Report (Pemesanan per produk2a.png)
  const productReportData = useMemo(() => {
    const map: Record<string, {
      productName: string;
      productCode: string;
      currentPrice: number;
      qtySold: number;
      totalAmount: number;
      averagePrice: number;
    }> = {};

    orders.forEach(order => {
      order.items.forEach(it => {
        const key = it.productCode || it.productName;
        if (!map[key]) {
          map[key] = {
            productName: it.productName,
            productCode: it.productCode || "POS/00001",
            currentPrice: it.unitPrice || 0,
            qtySold: 0,
            totalAmount: 0,
            averagePrice: 0
          };
        }
        map[key].qtySold += it.quantity;
        map[key].totalAmount += it.total;
      });
    });

    const list = Object.values(map).map(p => ({
      ...p,
      averagePrice: p.qtySold > 0 ? Math.round(p.totalAmount / p.qtySold) : p.currentPrice
    }));

    if (!reportSearchQuery.trim()) return list;

    return list.filter(p => 
      p.productName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(reportSearchQuery.toLowerCase())
    );
  }, [orders, reportSearchQuery]);

  const reportTotalQty = productReportData.reduce((s, p) => s + p.qtySold, 0);
  const reportTotalAmount = productReportData.reduce((s, p) => s + p.totalAmount, 0);
  const reportAvgPrice = reportTotalQty > 0 ? Math.round(reportTotalAmount / reportTotalQty) : 0;

  // --- HARDWARE PRINT TEMPLATE GENERATORS ---
  const generateProductReportPrintHtml = () => {
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
              <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Laporan Penjualan</span>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">PEMESANAN PER PRODUK</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Periode: ${reportDateRange}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155; width: 40px;">No</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Nama Produk</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Kode/SKU</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">Harga Saat Ini</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">Jumlah Terjual</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">Total</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            ${productReportData.map((p, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-weight: 600; color: #0f172a;">${p.productName}</td>
                <td style="padding: 8px; font-family: monospace; color: #475569;">${p.productCode}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatIDR(p.currentPrice)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0284c7;">${p.qtySold}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(p.totalAmount)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; color: #475569;">${formatIDR(p.averagePrice)}</td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="4" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0284c7;">${reportTotalQty}</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(reportTotalAmount)}</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(reportAvgPrice)}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Dibuat Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${currentUser?.name || "Staf Administrasi"}</p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 10px;">Bagian Penjualan</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Disetujui Oleh,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Pimpinan Perusahaan"}</p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 10px;">Direktur / Pemilik Usaha</p>
          </div>
        </div>

        <div style="margin-top: 24px; border-top: 1px dashed #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
          <span>Dicetak otomatis pada: ${new Date().toLocaleString("id-ID")}</span>
          <span>Dokumen Resmi Sistem Pembukuan Toko SAK EMKM</span>
        </div>
      </div>
    `;
  };

  const generateOrderListPrintHtml = () => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");
    const totalDp = filteredOrders.reduce((s, o) => s + o.downPayment, 0);
    const totalAll = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);

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
              <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Sales Order</span>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; margin: 8px 0 0 0; color: #0f172a;">DAFTAR PEMESANAN PENJUALAN</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Periode: ${dateRange}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155; width: 35px;">No</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Nomor SO</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Pelanggan</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Referensi</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Jatuh Tempo</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; color: #334155;">Status</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">DP</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700; color: #334155;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map((ord, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-family: monospace; font-weight: 700; color: #0284c7;">${ord.orderNumber}</td>
                <td style="padding: 8px; font-weight: 600; color: #0f172a;">${ord.customerName}</td>
                <td style="padding: 8px; font-family: monospace; color: #64748b;">${ord.reference || "-"}</td>
                <td style="padding: 8px; font-family: monospace; color: #475569;">${ord.dueDate}</td>
                <td style="padding: 8px; text-transform: uppercase; font-size: 10px; font-weight: 700; color: ${ord.status === 'open' ? '#e11d48' : ord.status === 'selesai' ? '#16a34a' : '#2563eb'};">${ord.status}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700;">${formatIDR(ord.downPayment)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(ord.totalAmount)}</td>
              </tr>
            `).join("")}
            <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
              <td colspan="6" style="padding: 10px 8px; text-align: left; color: #0f172a;">Total (${filteredOrders.length} Pesanan)</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(totalDp)}</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #0f172a;">${formatIDR(totalAll)}</td>
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

  const generateSingleOrderPrintHtml = (ord: SalesOrder) => {
    const companyLogo = storeConfig.storeLogo 
      ? `<img src="${storeConfig.storeLogo}" style="height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 8px;" />` 
      : "";
    const companyName = storeConfig.storeName || "PT. JAGO JAGA JAYA";
    const companyAddress = [storeConfig.storeAddress, storeConfig.storeCity].filter(Boolean).join(", ");
    const remaining = Math.max(0, ord.totalAmount - ord.downPayment);

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
              <span style="font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase;">SALES ORDER</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 900; margin: 8px 0 0 0; color: #1d4ed8; font-family: monospace;">${ord.orderNumber}</h2>
            <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0;">Tanggal: ${ord.transactionDate} | Jatuh Tempo: ${ord.dueDate}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div>
            <span style="color: #64748b; text-transform: uppercase; font-size: 9px; font-weight: 700;">Dipesan Oleh:</span>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${ord.customerName}</div>
            ${ord.reference ? `<div style="color: #64748b; margin-top: 2px;">No. Referensi: <strong>${ord.reference}</strong></div>` : ""}
          </div>
          <div style="text-align: right;">
            <span style="color: #64748b; text-transform: uppercase; font-size: 9px; font-weight: 700;">Status Pesanan:</span>
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${ord.status === 'open' ? '#e11d48' : ord.status === 'selesai' ? '#16a34a' : '#2563eb'}; margin-top: 2px;">${ord.status}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8;">
              <th style="padding: 10px 8px; text-align: left; font-weight: 700; width: 40px;">No</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700;">Kode</th>
              <th style="padding: 10px 8px; text-align: left; font-weight: 700;">Deskripsi Produk</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700;">Harga Satuan</th>
              <th style="padding: 10px 8px; text-align: right; font-weight: 700;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${ord.items.map((it, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-family: monospace; color: #64748b;">${it.productCode || "-"}</td>
                <td style="padding: 8px; font-weight: 600; color: #0f172a;">${it.productName}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${it.quantity} ${it.unit}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace;">${formatIDR(it.unitPrice)}</td>
                <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(it.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 260px; font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b;">
              <span>Uang Muka (DP):</span>
              <span style="font-family: monospace; font-weight: 600;">${formatIDR(ord.downPayment)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; font-weight: 900; color: #1d4ed8; border-top: 1px solid #cbd5e1; padding-top: 6px;">
              <span>Total Nilai SO:</span>
              <span style="font-family: monospace;">${formatIDR(ord.totalAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 6px;">
              <span>Sisa Pembayaran:</span>
              <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${formatIDR(remaining)}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; font-size: 11px;">
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Tanda Terima Pelanggan,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${ord.customerName}</p>
          </div>
          <div style="text-align: center; width: 180px;">
            <p style="margin: 0 0 50px 0; color: #64748b;">Hormat Kami,</p>
            <p style="margin: 0; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 4px;">${storeConfig.storeOwner || "Bagian Penjualan"}</p>
          </div>
        </div>
      </div>
    `;
  };

  // Direct Hardware Print Handlers (Triggers printer dialog directly to printer)
  const handlePrintReport = () => {
    const html = generateProductReportPrintHtml();
    setPrintModalHtml(html);
    setPrintModalTitle(`Laporan Pemesanan per Produk - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`);
    printInPageDOM(html, "Laporan Pemesanan per Produk");
    setShowPrintModal(true);
  };

  const handlePrintOrderList = () => {
    const html = generateOrderListPrintHtml();
    setPrintModalHtml(html);
    setPrintModalTitle(`Daftar Pemesanan Penjualan - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`);
    printInPageDOM(html, "Daftar Pemesanan Penjualan");
    setShowPrintModal(true);
  };

  const handlePrintSingleOrder = (ord: SalesOrder) => {
    const html = generateSingleOrderPrintHtml(ord);
    setPrintModalHtml(html);
    setPrintModalTitle(`Sales Order ${ord.orderNumber} - ${ord.customerName}`);
    printInPageDOM(html, `Sales Order ${ord.orderNumber}`);
    setShowPrintModal(true);
  };

  // Bulk selection in List View
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
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

  // Submit Create Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerName.trim()) {
      alert("Silakan masukkan nama pelanggan!");
      return;
    }

    const formattedItems: SalesOrderItem[] = createItems.map((it, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      productCode: `POS/0000${idx + 1}`,
      productName: it.productName || "Custom Product",
      quantity: Number(it.qty) || 1,
      unit: it.unit || "Pcs",
      unitPrice: Number(it.unitPrice) || 0,
      total: (Number(it.qty) || 1) * (Number(it.unitPrice) || 0)
    }));

    const totalCalculated = formattedItems.reduce((s, it) => s + it.total, 0);

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber: createOrderNumber || `SO/0000${orders.length + 1}`,
      customerName: createCustomerName.trim(),
      reference: createRef.trim(),
      transactionDate: createTxDate,
      dueDate: createDueDate,
      status: "open",
      downPayment: Number(createDp) || 0,
      totalAmount: totalCalculated,
      items: formattedItems
    };

    saveOrders([newOrder, ...orders]);
    setShowCreateModal(false);
    alert(`Sales Order ${newOrder.orderNumber} berhasil dibuat!`);

    // Reset Form
    setCreateCustomerName("");
    setCreateRef("");
    setCreateDp(0);
    setCreateItems([{ productName: "Custom Product", qty: 20, unit: "Pcs", unitPrice: 250000 }]);
  };

  const handleRefreshReport = () => {
    setIsReportRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setReportLastRefreshed(
        `${now.getDate()} ${now.toLocaleString("id-ID", { month: "short" })} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      );
      setIsReportRefreshing(false);
    }, 400);
  };

  return (
    <div className="space-y-6 text-xs text-slate-800" id="order-manager">

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: LIST PEMESANAN (SESUAI Pemesanan.png & Pemesanan1.png) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Header Row: Title & Action Buttons matching Pemesanan.png */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pemesanan</h1>
            </div>

            {/* Top Right Action Buttons matching Pemesanan.png exactly:
                [📊 Laporan ▾] [❓ Panduan ▾] [+ Tambah] [📥 Import ▾] [🖨️ Print] [⋮] */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Laporan Dropdown */}
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

                {/* Dropdown Menu: Pemesanan per Produk */}
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
                      <span>Pemesanan per Produk</span>
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
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2.5 z-30 text-[11px] text-slate-600 space-y-1.5 animate-fade-in">
                    <div className="font-bold text-slate-800">Panduan Sales Order:</div>
                    <p className="text-slate-500">
                      Pemesanan digunakan untuk mencatat pesanan penjualan (*Sales Order*) sebelum barang dikirimkan atau ditagihkan kepada pelanggan.
                    </p>
                  </div>
                )}
              </div>

              {/* + Tambah Blue Button */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>

              {/* Import Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowImportDropdown(!showImportDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Import</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {showImportDropdown && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        alert("Pilih berkas Excel (.xlsx) untuk mengimpor daftar Sales Order");
                        setShowImportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      Import dari Excel
                    </button>
                  </div>
                )}
              </div>

              {/* Print */}
              <button
                type="button"
                onClick={handlePrintOrderList}
                title="Cetak langsung ke printer (Ctrl+P)"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
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
                      + Buat Sales Order Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Seluruh data Sales Order diekspor ke Excel!");
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                    >
                      Ekspor ke Excel
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Filter Bar Matching Pemesanan.png:
              [🌪️ Filter] [📑 Icon view] [📑 Pemesanan ▾]  ---  [🔍 Cari] [29/09/2025 - 29/09/2026 📅] */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex items-center gap-2 flex-wrap">
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

              {/* Pemesanan Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPemesananDropdown(!showPemesananDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pemesanan</span>
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

          {/* Status Tabs Matching Pemesanan.png:
              [ Semua ] [ Open ] [ Dikirim Sebagian ] [ Selesai ] [ Lainnya ▾ ] */}
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
              onClick={() => setStatusFilter("dikirim_sebagian")}
              className={`px-3.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                statusFilter === "dikirim_sebagian"
                  ? "bg-blue-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Dikirim Sebagian
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

            {/* Lainnya Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLainnyaStatusMenu(!showLainnyaStatusMenu)}
                className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <span>Lainnya</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {showLainnyaStatusMenu && (
                <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("lainnya");
                      setShowLainnyaStatusMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    Dibatalkan / Void
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Container Matching Pemesanan.png exactly */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
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
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Tgl. Jatuh Tempo</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">DP</th>
                    <th className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Total</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ord.id)}
                          onChange={() => handleToggleSelect(ord.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="font-mono font-bold text-blue-600 hover:underline cursor-pointer text-left"
                        >
                          {ord.orderNumber}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {ord.customerName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {ord.reference || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {ord.dueDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.status === "open" && (
                          <span className="text-rose-600 font-semibold">
                            Open
                          </span>
                        )}
                        {ord.status === "dikirim_sebagian" && (
                          <span className="text-blue-600 font-semibold">
                            Dikirim Sebagian
                          </span>
                        )}
                        {ord.status === "selesai" && (
                          <span className="text-emerald-600 font-semibold">
                            Selesai
                          </span>
                        )}
                        {ord.status === "dibatalkan" && (
                          <span className="text-slate-400 font-semibold">
                            Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(ord.downPayment)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(ord.totalAmount)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary / Total Row Matching Pemesanan.png exactly */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Total
                    </td>
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4" />
                    
                    {/* DP Column Total with "Lihat Total" toggle */}
                    <td className="py-3.5 px-4 text-right">
                      {showDpTotal ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {formatIDR(filteredOrders.reduce((s, o) => s + o.downPayment, 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowDpTotal(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDpTotal(true)}
                          className="text-blue-600 hover:underline font-semibold flex items-center justify-end gap-1 ml-auto cursor-pointer"
                        >
                          <span>Lihat Total</span>
                          <Eye className="w-3 h-3 text-blue-500" />
                        </button>
                      )}
                    </td>

                    {/* Total Column Total with "Lihat Total" toggle */}
                    <td className="py-3.5 px-4 text-right">
                      {showTotalTotal ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {formatIDR(filteredOrders.reduce((s, o) => s + o.totalAmount, 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTotalTotal(false)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowTotalTotal(true)}
                          className="text-blue-600 hover:underline font-semibold flex items-center justify-end gap-1 ml-auto cursor-pointer"
                        >
                          <span>Lihat Total</span>
                          <Eye className="w-3 h-3 text-blue-500" />
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination & Total Count Footer Matching Pemesanan.png:
                Total 1 data | 30 ▾ */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 text-xs text-slate-500">
              <span>Total {filteredOrders.length} data</span>
              <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-0.5 bg-white text-slate-700">
                <span>30</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: LAPORAN PEMESANAN PER PRODUK (SESUAI Pemesanan per produk2a.png) */}
      {/* ========================================================================= */}
      {viewMode === "report" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Bar with Breadcrumb and [< Kembali] Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <span>Beranda</span>
                <span>&gt;</span>
                <span>Laporan</span>
                <span>&gt;</span>
                <span className="font-semibold text-slate-700">Pemesanan per Produk</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pemesanan per Produk</h1>
            </div>

            {/* Top Right Action Buttons Matching Pemesanan per produk2a.png:
                [< Kembali] [📤 Ekspor] [🔗 Bagikan ▾] [🖨️ Print ▾] */}
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
                onClick={() => alert("Laporan pemesanan per produk berhasil diekspor ke Excel!")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor</span>
              </button>

              {/* Bagikan Dropdown with Kirim Email & Kirim Whatsapp */}
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

                {/* Dropdown Menu matching Pemesanan per produk2a.png:
                    1. Kirim Email
                    2. Kirim Whatsapp */}
                {showBagikanDropdown && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(true);
                        setShowBagikanDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kirim Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWhatsAppModal(true);
                        setShowBagikanDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kirim Whatsapp</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Dropdown with Direct Hardware Printing */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  title="Cetak langsung ke printer (Ctrl+P)"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print</span>
                  <ChevronDown 
                    className="w-3 h-3 text-slate-400 hover:text-slate-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPrintDropdown(!showPrintDropdown);
                    }}
                  />
                </button>

                {showPrintDropdown && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-fade-in text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        handlePrintReport();
                        setShowPrintDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cetak ke Printer (Langsung)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const html = generateProductReportPrintHtml();
                        setPrintModalHtml(html);
                        setPrintModalTitle(`Laporan Pemesanan per Produk - ${storeConfig.storeName || "PT. JAGO JAGA JAYA"}`);
                        setShowPrintModal(true);
                        setShowPrintDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pratinjau Cetak & Simpan PDF</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Filter Bar Matching Pemesanan per produk2a.png:
              [🌪️ Filter] [📑 Icon view] --- [🔍 Cari Produk] [01/09/2026 - 01/10/2026 📅] */}
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
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  placeholder="Cari Produk"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none shadow-2xs"
                />
              </div>

              {/* Date range picker */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 bg-white shadow-2xs shrink-0">
                <span>{reportDateRange}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>
          </div>

          {/* Real-time Alert Info Bar Matching Pemesanan per produk2a.png:
              ⚡ Data per 1 Okt 2026, 17:38 · Baru saja diperbarui  [🔄 Muat ulang] */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2 text-xs text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">⚡</span>
              <span>Data per <strong>{reportLastRefreshed}</strong> · Baru saja diperbarui</span>
            </div>
            <button
              type="button"
              onClick={handleRefreshReport}
              className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold cursor-pointer transition active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReportRefreshing ? "animate-spin" : ""}`} />
              <span>Muat ulang</span>
            </button>
          </div>

          {/* Table Matching Pemesanan per produk2a.png:
              Nama Produk | Kode/SKU | Harga Saat Ini | Jumlah Terjual ⇕ | Total ⇕ | Rata-rata */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kode/SKU</th>
                    <th className="py-3 px-4 text-center">Harga Saat Ini</th>
                    <th className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>Jumlah Terjual</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Total</span>
                        <span className="text-[10px] text-slate-400">⇕</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Rata-rata</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {productReportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold text-blue-600 hover:underline cursor-pointer">
                        {item.productName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.productCode}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {item.currentPrice > 0 ? formatIDR(item.currentPrice) : "0"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {item.qtySold}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(item.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                        {formatIDR(item.averagePrice)}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row Matching Pemesanan per produk2a.png:
                      Total | - | - | 20 | 5.000.000 | 250.000 */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Total
                    </td>
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4" />
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {reportTotalQty}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(reportTotalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(reportAvgPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Matching Screenshot 2a: Total 1 data | 15 / halaman ▾ */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 text-xs text-slate-500">
              <span>Total {productReportData.length} data</span>
              <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-0.5 bg-white text-slate-700">
                <span>15 / halaman</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL KIRIM EMAIL (SESUAI Pemesanan per produk2b.png) */}
      {/* ========================================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-8 text-xs relative">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Kirim Email</h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Field * Kepada */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-rose-500 mr-0.5">*</span> Kepada
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              {/* Field * Dari */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-rose-500 mr-0.5">*</span> Dari
                </label>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
                  <span>{emailFrom}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Premium Feature Banner matching Pemesanan per produk2b.png */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-800">
                  Fitur Kirim Email hanya bisa diakses di paket berbayar
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => alert("Membuka halaman aktivasi paket resmi Kledo")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-xs transition"
                  >
                    Upgrade Sekarang
                  </button>
                </div>
              </div>

              {/* Field * Judul */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-rose-500 mr-0.5">*</span> Judul
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              {/* Pesan with Rich Text Toolbar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  
                  {/* Toolbar matching screenshot */}
                  <div className="bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-1.5 text-slate-600 flex-wrap">
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Bold className="w-3 h-3" /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Italic className="w-3 h-3" /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Underline className="w-3 h-3" /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Strikethrough className="w-3 h-3" /></button>
                    <span className="h-4 w-px bg-slate-300 mx-1" />
                    <span className="text-[11px] font-medium px-1">Normal ▾</span>
                    <span className="h-4 w-px bg-slate-300 mx-1" />
                    <span className="text-[11px] font-medium px-1">Font ▾</span>
                    <span className="h-4 w-px bg-slate-300 mx-1" />
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><List className="w-3 h-3" /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><ListOrdered className="w-3 h-3" /></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded"><Smile className="w-3 h-3" /></button>
                  </div>

                  <textarea
                    rows={5}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-3 text-xs text-slate-800 outline-none resize-none bg-white"
                  />
                </div>
              </div>

              {/* File Tagihan attachment box matching screenshot */}
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px]">File Tagihan</span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-2 text-rose-600">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-semibold text-slate-700">Laporan Pemesa...</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                ✕ Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Simulasi: Email laporan pemesanan terkirim!");
                  setShowEmailModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL KIRIM WHATSAPP (SESUAI Pemesanan per produk2c.png) */}
      {/* ========================================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in text-xs">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Kirim Whatsapp</h3>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Field * Nomor Tujuan matching Pemesanan per produk2c.png */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-rose-500 mr-0.5">*</span> Nomor Tujuan
                </label>
                <input
                  type="text"
                  value={waTargetPhone}
                  onChange={(e) => setWaTargetPhone(e.target.value)}
                  placeholder="085883444796"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-mono font-medium"
                />
              </div>

              {/* Field * Isi Whatsapp matching Pemesanan per produk2c.png */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-rose-500 mr-0.5">*</span> Isi Whatsapp
                </label>
                <textarea
                  rows={6}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 outline-none focus:bg-white resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                ✕ Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const encoded = encodeURIComponent(waMessage);
                  window.open(`https://wa.me/${waTargetPhone.replace(/\D/g, "")}?text=${encoded}`, "_blank");
                  setShowWhatsAppModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL BUAT PEMESANAN BARU (SALES ORDER) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-8 text-xs">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tambah Pemesanan Penjualan (Sales Order)</h3>
                <p className="text-[11px] text-slate-400">Penerbitan surat pesanan resmi sebelum barang diproses atau dikirim</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="text-rose-500">*</span> Pelanggan
                  </label>
                  <input
                    type="text"
                    value={createCustomerName}
                    onChange={(e) => setCreateCustomerName(e.target.value)}
                    placeholder="Contoh: POS Customer / CV Berkah Mandiri"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Pemesanan
                  </label>
                  <input
                    type="text"
                    value={createOrderNumber}
                    onChange={(e) => setCreateOrderNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={createTxDate}
                    onChange={(e) => setCreateTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl. Jatuh Tempo</label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Referensi</label>
                  <input
                    type="text"
                    value={createRef}
                    onChange={(e) => setCreateRef(e.target.value)}
                    placeholder="No. PO Pelanggan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Items Line */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Daftar Produk yang Dipesan</span>
                  <button
                    type="button"
                    onClick={() => setCreateItems([...createItems, { productName: "", qty: 1, unit: "Pcs", unitPrice: 0 }])}
                    className="text-blue-600 hover:underline text-xs font-bold cursor-pointer"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {createItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].productName = e.target.value;
                        setCreateItems(updated);
                      }}
                      placeholder="Nama produk"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                    />
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].qty = Number(e.target.value);
                        setCreateItems(updated);
                      }}
                      placeholder="Qty"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right outline-none"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...createItems];
                        updated[idx].unitPrice = Number(e.target.value);
                        setCreateItems(updated);
                      }}
                      placeholder="Harga"
                      className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right font-mono outline-none"
                    />
                    <div className="w-28 text-right font-mono font-bold text-slate-800">
                      {formatIDR((item.qty || 1) * (item.unitPrice || 0))}
                    </div>
                    {createItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCreateItems(createItems.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* DP & Total Calculation */}
              <div className="flex flex-col sm:flex-row justify-end items-end gap-3 pt-2">
                <div className="w-48 space-y-1 text-right">
                  <label className="block text-xs font-semibold text-slate-600">Uang Muka (DP)</label>
                  <input
                    type="number"
                    value={createDp}
                    onChange={(e) => setCreateDp(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-right outline-none"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 w-56 text-right space-y-1">
                  <div className="text-[11px] text-slate-400">Total Pemesanan:</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {formatIDR(createItems.reduce((s, it) => s + (it.qty * it.unitPrice), 0))}
                  </div>
                </div>
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
                  Simpan Pemesanan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL PEMESANAN (SALES ORDER DETAIL & ACTION) */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-fade-in my-8 text-xs">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Detail Sales Order {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pelanggan: <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              {/* Top Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Nomor SO</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Tgl. Transaksi</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">{selectedOrder.transactionDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Jatuh Tempo</div>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">{selectedOrder.dueDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Status Pesanan</div>
                  <div className="mt-0.5">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        const updated = orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o);
                        saveOrders(updated);
                        setSelectedOrder({ ...selectedOrder, status: newStatus });
                      }}
                      className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="dikirim_sebagian">Dikirim Sebagian</option>
                      <option value="selesai">Selesai</option>
                      <option value="dibatalkan">Dibatalkan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Daftar Produk Pesanan</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3">Produk</th>
                        <th className="py-2.5 px-3 text-right">Kuantitas</th>
                        <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{it.productCode || "-"}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{it.productName}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{it.quantity} {it.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatIDR(it.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-2 border-t border-slate-100">
                <div className="text-slate-500 text-xs">
                  {selectedOrder.notes && (
                    <p><span className="font-semibold text-slate-700">Catatan:</span> {selectedOrder.notes}</p>
                  )}
                  {selectedOrder.reference && (
                    <p><span className="font-semibold text-slate-700">No. Referensi:</span> {selectedOrder.reference}</p>
                  )}
                </div>

                <div className="w-full sm:w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Muka (DP):</span>
                    <span className="font-mono font-semibold">{formatIDR(selectedOrder.downPayment)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                    <span>Total Pemesanan:</span>
                    <span className="font-mono font-black text-blue-700">{formatIDR(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <span>Sisa Tagihan:</span>
                    <span className="font-mono font-semibold">{formatIDR(Math.max(0, selectedOrder.totalAmount - selectedOrder.downPayment))}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus pesanan ${selectedOrder.orderNumber}?`)) {
                    saveOrders(orders.filter(o => o.id !== selectedOrder.id));
                    setSelectedOrder(null);
                  }
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Pesanan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSingleOrder(selectedOrder)}
                  title="Cetak surat pesanan penjualan ke printer"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak SO</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = `Halo ${selectedOrder.customerName}, berikut konfirmasi Sales Order ${selectedOrder.orderNumber} sebesar ${formatIDR(selectedOrder.totalAmount)} dengan DP ${formatIDR(selectedOrder.downPayment)}. Terima kasih!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    onNavigateToTab?.("penjualan", "tagihan");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buat Tagihan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. UNIVERSAL PRINT MODAL (DIRECT HARDWARE PRINT & PDF EXPORT) */}
      {/* ========================================================================= */}
      <UniversalPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={printModalTitle}
        htmlContent={printModalHtml}
      />

    </div>
  );
};
