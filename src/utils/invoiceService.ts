import { Invoice, InvoiceItem, InvoicePayment, Transaction, StockItem, StoreConfig } from "../types";

export const LOCAL_STORAGE_INVOICES_KEY = "akuntan_invoices_v1";

export const DEFAULT_DEMO_INVOICE: Invoice = {
  id: "inv-demo-001",
  invoiceNumber: "INV/00001",
  status: "paid",
  customerName: "POS Customer",
  customerAddress: "Merak, Banten",
  customerPhone: "081234567890",
  customerEmail: "customer@pos.id",
  transactionDate: "2026-09-24",
  dueDate: "2026-10-24",
  productionPlanStatus: "-",
  productionPlanNumber: "-",
  warehouse: "Unassigned",
  shippingDate: "2026-09-24",
  expedition: "Tiki",
  trackingNumber: "45679995555",
  items: [
    {
      id: "item-001",
      productCode: "PCS/00001",
      productName: "Custom Product",
      description: "Baju koko",
      quantity: 5,
      unit: "Pcs",
      discountPercent: 0,
      unitPrice: 250000,
      taxType: "PPN",
      amount: 1250000
    }
  ],
  subtotal: 1250000,
  ppnAmount: 137500,
  shippingCost: 0,
  totalAmount: 1387500,
  paidAmount: 1387500,
  remainingAmount: 0,
  payments: [
    {
      id: "pay-001",
      paymentNumber: "IP/00001",
      date: "2026-09-24",
      amount: 1387500,
      accountId: 1001,
      accountName: "1-10001 Kas & Setara Kas",
      reference: "Pelunasan Kasir POS",
      tag: "Penjualan Toko",
      createdAt: "2026-09-24T08:45:00.000Z"
    }
  ],
  logs: [
    {
      id: "log-1",
      timestamp: "24 Sep 2026 08:38",
      author: "Budi Santoso",
      action: "Faktur penjualan diterbitkan"
    },
    {
      id: "log-2",
      timestamp: "24 Sep 2026 08:40",
      author: "Budi Santoso",
      action: "Informasi pengiriman Tiki No. Resi 45679995555 diperbarui"
    },
    {
      id: "log-3",
      timestamp: "24 Sep 2026 08:45",
      author: "Budi Santoso",
      action: "Terima pembayaran IP/00001 sebesar Rp 1.387.500 via Kas"
    }
  ],
  notes: "Terima kasih atas pembelian Anda.",
  terms: "Jatuh tempo pembayaran dalam 30 hari kalender sejak faktur diterbitkan.",
  createdAt: "2026-09-24T08:38:00.000Z",
  updatedAt: "2026-09-24T08:45:00.000Z"
};

export const SECOND_DEMO_INVOICE: Invoice = {
  id: "inv-demo-002",
  invoiceNumber: "INV/00002",
  status: "unpaid",
  customerName: "Toko Grosir Barokah",
  customerAddress: "Cilegon, Banten",
  customerPhone: "081987654321",
  customerEmail: "barokah@grosir.id",
  transactionDate: "2026-09-25",
  dueDate: "2026-10-25",
  productionPlanStatus: "-",
  productionPlanNumber: "-",
  warehouse: "Gudang Utama",
  shippingDate: "2026-09-25",
  expedition: "JNE",
  trackingNumber: "88902123456",
  items: [
    {
      id: "item-002",
      productCode: "BRG-001",
      productName: "Beras Ramos Premium 5kg",
      description: "Beras poles super pulen",
      quantity: 20,
      unit: "Karung",
      discountPercent: 0,
      unitPrice: 72000,
      taxType: "NON",
      amount: 1440000
    },
    {
      id: "item-003",
      productCode: "MGO-002",
      productName: "Minyak Goreng Sawit 2L",
      description: "Minyak goreng kemasan pouch",
      quantity: 10,
      unit: "Pouch",
      discountPercent: 0,
      unitPrice: 34000,
      taxType: "PPN",
      amount: 340000
    }
  ],
  subtotal: 1780000,
  ppnAmount: 37400,
  shippingCost: 0,
  totalAmount: 1817400,
  paidAmount: 0,
  remainingAmount: 1817400,
  payments: [],
  logs: [
    {
      id: "log-201",
      timestamp: "25 Sep 2026 10:15",
      author: "Budi Santoso",
      action: "Faktur penjualan diterbitkan"
    }
  ],
  notes: "Pengiriman via JNE Cargo",
  terms: "Jatuh tempo 30 hari.",
  createdAt: "2026-09-25T10:15:00.000Z",
  updatedAt: "2026-09-25T10:15:00.000Z"
};

/**
 * Loads invoices from localStorage, seeding with demo invoices if empty.
 */
export function getStoredInvoices(): Invoice[] {
  const data = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
  if (!data) {
    const initial = [DEFAULT_DEMO_INVOICE, SECOND_DEMO_INVOICE];
    saveStoredInvoices(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_DEMO_INVOICE, SECOND_DEMO_INVOICE];
  } catch (e) {
    console.error("Error reading invoices from localStorage", e);
    return [DEFAULT_DEMO_INVOICE, SECOND_DEMO_INVOICE];
  }
}

/**
 * Persists invoices to localStorage.
 */
export function saveStoredInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error("Error saving invoices to localStorage", e);
  }
}

/**
 * Generates next sequential invoice number like INV/00002.
 */
export function generateNextInvoiceNumber(existingInvoices: Invoice[]): string {
  let highest = 0;
  existingInvoices.forEach(inv => {
    const match = inv.invoiceNumber.match(/INV\/(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  });
  const nextNum = highest + 1;
  return `INV/${String(nextNum).padStart(5, '0')}`;
}

/**
 * Generates next sequential payment receipt number like IP/00001.
 */
export function generateNextPaymentNumber(existingInvoices: Invoice[]): string {
  let totalPayments = 0;
  existingInvoices.forEach(inv => {
    totalPayments += (inv.payments || []).length;
  });
  return `IP/${String(totalPayments + 1).padStart(5, '0')}`;
}
