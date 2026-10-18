import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  DollarSign, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  Info,
  CheckCircle2
} from "lucide-react";
import { Transaction } from "../types";
import { generateJournal, computeFinancialStats } from "../utils/accountingEngine";
import { formatIDR } from "./FinanceDashboard";

export interface IncomeStatementBarChartProps {
  transactions: Transaction[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  availableYears?: string[];
  className?: string;
}

export interface MonthlyTrendData {
  monthKey: string;           // "2026-06"
  monthNum: string;           // "06"
  monthName: string;          // "Juni"
  shortMonth: string;         // "Jun"
  fullLabel: string;          // "Juni 2026"
  revenue: number;            // Pendapatan Usaha (Sales Revenue)
  hpp: number;                // Harga Pokok Penjualan (HPP)
  operatingExpenses: number;  // Beban Operasional (6001-6005)
  totalExpense: number;       // hpp + operatingExpenses
  grossProfit: number;        // revenue - hpp
  netProfit: number;          // revenue - totalExpense
  netMargin: number;          // % margin
  expenseRatio: number;       // totalExpense / revenue * 100
  txCount: number;            // Total transaksi di bulan tsb
  hasData: boolean;           // Ada transaksi di bulan ini
}

// Shorthand IDR formatting for chart Y-axis (e.g. Rp 10 Jt, Rp 500 Rb)
function formatShorthandIDR(val: number): string {
  if (val === 0) return "Rp 0";
  const absVal = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (absVal >= 1_000_000_000) {
    const formatted = (absVal / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1
    });
    return `${sign}Rp ${formatted} M`;
  }
  if (absVal >= 1_000_000) {
    const formatted = (absVal / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1
    });
    return `${sign}Rp ${formatted} Jt`;
  }
  if (absVal >= 1_000) {
    const formatted = (absVal / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 0
    });
    return `${sign}Rp ${formatted} Rb`;
  }
  return `${sign}Rp ${absVal}`;
}

const MONTH_DEFINITIONS = [
  { num: "01", name: "Januari", short: "Jan" },
  { num: "02", name: "Februari", short: "Feb" },
  { num: "03", name: "Maret", short: "Mar" },
  { num: "04", name: "April", short: "Apr" },
  { num: "05", name: "Mei", short: "Mei" },
  { num: "06", name: "Juni", short: "Jun" },
  { num: "07", name: "Juli", short: "Jul" },
  { num: "08", name: "Agustus", short: "Agu" },
  { num: "09", name: "September", short: "Sep" },
  { num: "10", name: "Oktober", short: "Okt" },
  { num: "11", name: "November", short: "Nov" },
  { num: "12", name: "Desember", short: "Des" }
];

export const IncomeStatementBarChart: React.FC<IncomeStatementBarChartProps> = ({
  transactions,
  selectedYear: propSelectedYear,
  onYearChange,
  availableYears: propAvailableYears,
  className = ""
}) => {
  // Current active year for analysis
  const defaultYear = useMemo(() => {
    if (propSelectedYear) return propSelectedYear;
    if (transactions.length > 0) {
      const txYears = transactions
        .map(t => t.date?.slice(0, 4))
        .filter(Boolean);
      if (txYears.length > 0) return txYears.sort().reverse()[0];
    }
    return new Date().getFullYear().toString();
  }, [propSelectedYear, transactions]);

  const [activeYear, setActiveYear] = useState<string>(defaultYear);

  // Sync state if prop changes
  React.useEffect(() => {
    if (propSelectedYear && propSelectedYear !== activeYear) {
      setActiveYear(propSelectedYear);
    }
  }, [propSelectedYear]);

  // Chart view modes:
  // - "comparison": Grouped bars (Pendapatan vs Total Beban)
  // - "profit": Net Profit bars (Laba Bersih per Bulan)
  // - "composition": Stacked breakdown (Pendapatan vs [HPP + Beban Operasional])
  const [viewMode, setViewMode] = useState<"comparison" | "profit" | "composition">("comparison");

  // Show all 12 months or only active months with transactions
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  // Derive years list
  const yearsList = useMemo(() => {
    if (propAvailableYears && propAvailableYears.length > 0) {
      return propAvailableYears;
    }
    const years = new Set<string>(
      transactions.map(t => t.date?.slice(0, 4)).filter(Boolean)
    );
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [propAvailableYears, transactions]);

  // Compute 12-month data with double-entry precision
  const monthlyData = useMemo<MonthlyTrendData[]>(() => {
    const rawMonths = MONTH_DEFINITIONS.map(mDef => {
      const monthKey = `${activeYear}-${mDef.num}`;
      const monthTransactions = transactions.filter(
        t => t.date && t.date.startsWith(monthKey)
      );

      // Generate journal and stats for this specific month
      const monthJournal = generateJournal(monthTransactions);
      const monthStats = computeFinancialStats(monthTransactions, monthJournal);

      const revenue = monthStats.revenue || 0;
      const hpp = monthStats.hpp || 0;
      const operatingExpenses = monthStats.expenses || 0;
      const totalExpense = hpp + operatingExpenses;
      const grossProfit = revenue - hpp;
      const netProfit = revenue - totalExpense;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const expenseRatio = revenue > 0 ? (totalExpense / revenue) * 100 : 0;

      return {
        monthKey,
        monthNum: mDef.num,
        monthName: mDef.name,
        shortMonth: mDef.short,
        fullLabel: `${mDef.name} ${activeYear}`,
        revenue,
        hpp,
        operatingExpenses,
        totalExpense,
        grossProfit,
        netProfit,
        netMargin,
        expenseRatio,
        txCount: monthTransactions.length,
        hasData: monthTransactions.length > 0
      };
    });

    if (filterActiveOnly) {
      const activeOnly = rawMonths.filter(m => m.hasData);
      return activeOnly.length > 0 ? activeOnly : rawMonths;
    }

    return rawMonths;
  }, [transactions, activeYear, filterActiveOnly]);

  // Annual Totals & Summary Metrics
  const annualSummary = useMemo(() => {
    const totalRevenue = monthlyData.reduce((acc, m) => acc + m.revenue, 0);
    const totalHpp = monthlyData.reduce((acc, m) => acc + m.hpp, 0);
    const totalExpenses = monthlyData.reduce((acc, m) => acc + m.totalExpense, 0);
    const totalNetProfit = totalRevenue - totalExpenses;
    const avgMonthlyRevenue = Math.round(totalRevenue / 12);
    const avgMonthlyExpense = Math.round(totalExpenses / 12);
    const overallMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const overallExpenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

    // Highest revenue month
    const bestMonth = [...monthlyData].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      totalRevenue,
      totalHpp,
      totalExpenses,
      totalNetProfit,
      avgMonthlyRevenue,
      avgMonthlyExpense,
      overallMargin,
      overallExpenseRatio,
      bestMonth
    };
  }, [monthlyData]);

  const handleYearSelect = (newYear: string) => {
    setActiveYear(newYear);
    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  // Custom Interactive Tooltip
  const CustomBarChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyTrendData = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-2xl border border-slate-700/80 text-xs min-w-[240px] pointer-events-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {data.fullLabel}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {data.txCount} Transaksi
            </span>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-1.5 font-sans">
            {/* Pendapatan */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Pendapatan (Omzet):</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">
                {formatIDR(data.revenue)}
              </span>
            </div>

            {/* Total Beban */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                <span>Total Beban & Biaya:</span>
              </div>
              <span className="font-mono font-bold text-rose-400">
                {formatIDR(data.totalExpense)}
              </span>
            </div>

            {/* Sub-breakdown: HPP & Beban Ops */}
            <div className="pl-3.5 py-1 text-[11px] text-slate-400 space-y-0.5 border-l border-slate-800">
              <div className="flex items-center justify-between">
                <span>• HPP (Pokok):</span>
                <span className="font-mono text-amber-300">{formatIDR(data.hpp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Beban Operasional:</span>
                <span className="font-mono text-slate-300">{formatIDR(data.operatingExpenses)}</span>
              </div>
            </div>

            {/* Laba Bersih Divider */}
            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-3">
              <span className="font-bold text-slate-200 flex items-center gap-1">
                {data.netProfit >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
                Laba Bersih:
              </span>
              <div className="text-right">
                <span className={`font-mono font-extrabold ${data.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatIDR(data.netProfit)}
                </span>
                {data.revenue > 0 && (
                  <span className="block text-[10px] text-slate-400 font-mono">
                    Margin: {data.netMargin.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4 print:hidden ${className}`}>
      
      {/* 1. HEADER SECTION: Title, Metadata & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Tren Pendapatan vs Beban Bulanan
              </h3>
              {/* Clean unboxed metadata with subtle typographic separators */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <span>Tahun Buku {activeYear}</span>
                <span aria-hidden="true" className="text-slate-300">&bull;</span>
                <span>Visualisasi Komparasi SAK EMKM</span>
                <span aria-hidden="true" className="text-slate-300">&bull;</span>
                <span>Akumulasi Bulanan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Controls Bar: Segmented view buttons and Year selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode segmented buttons */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("comparison")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "comparison"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Komparasi langsung Pendapatan (Omzet) vs Total Beban per bulan"
            >
              Komparasi
            </button>
            <button
              type="button"
              onClick={() => setViewMode("profit")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "profit"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Grafik Laba / Rugi Bersih bulanan"
            >
              Laba Bersih
            </button>
            <button
              type="button"
              onClick={() => setViewMode("composition")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === "composition"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Komposisi Beban Pokok (HPP) vs Beban Operasional"
            >
              Komposisi Beban
            </button>
          </div>

          {/* Year selector dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeYear}
              onChange={(e) => handleYearSelect(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {yearsList.map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter toggle: 12 Bulan vs Bulan Ada Transaksi */}
          <button
            type="button"
            onClick={() => setFilterActiveOnly(prev => !prev)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              filterActiveOnly
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title="Sembunyikan bulan tanpa transaksi"
          >
            {filterActiveOnly ? "Bulan Aktif Saja" : "Semua 12 Bulan"}
          </button>
        </div>
      </div>

      {/* 2. KEY METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {/* Metric 1: Total Pendapatan */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Total Pendapatan ({activeYear})</p>
          <p className="text-sm md:text-base font-extrabold text-slate-900 font-mono mt-0.5">
            {formatIDR(annualSummary.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Rata-rata: {formatIDR(annualSummary.avgMonthlyRevenue)}/bln</span>
          </div>
        </div>

        {/* Metric 2: Total Beban & Biaya */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Total Beban &amp; Biaya</p>
          <p className="text-sm md:text-base font-extrabold text-rose-700 font-mono mt-0.5">
            {formatIDR(annualSummary.totalExpenses)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
            <span>Rata-rata: {formatIDR(annualSummary.avgMonthlyExpense)}/bln</span>
          </div>
        </div>

        {/* Metric 3: Laba Bersih Akumulasi */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Laba Bersih Akumulasi</p>
          <p className={`text-sm md:text-base font-extrabold font-mono mt-0.5 ${
            annualSummary.totalNetProfit >= 0 ? "text-emerald-700" : "text-rose-700"
          }`}>
            {formatIDR(annualSummary.totalNetProfit)}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-medium mt-1">
            {annualSummary.totalNetProfit >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Net Margin {annualSummary.overallMargin.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-700 font-semibold flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />
                Defisit Margin
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Rasio Efisiensi Beban */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Rasio Beban thd Omzet</p>
          <p className="text-sm md:text-base font-extrabold text-slate-900 font-mono mt-0.5">
            {annualSummary.overallExpenseRatio.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
            <span>HPP: {formatIDR(annualSummary.totalHpp)}</span>
          </div>
        </div>
      </div>

      {/* 3. RECHARTS BAR CHART CONTAINER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "comparison" ? (
              /* Grouped Bar Chart: Pendapatan vs Total Beban */
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                barGap={4}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortMonth"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShorthandIDR}
                  width={68}
                />
                <RechartsTooltip content={<CustomBarChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
                />
                <Bar
                  dataKey="revenue"
                  name="Pendapatan (Revenue)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="totalExpense"
                  name="Total Beban (Expenses)"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            ) : viewMode === "profit" ? (
              /* Net Profit Bar Chart with color conditioning */
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortMonth"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShorthandIDR}
                  width={68}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
                <RechartsTooltip content={<CustomBarChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
                />
                <Bar
                  dataKey="netProfit"
                  name="Laba Bersih Bulanan"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                >
                  {monthlyData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.netProfit >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              /* Stacked Expense Composition Chart (HPP + Operating Expenses vs Revenue) */
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortMonth"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShorthandIDR}
                  width={68}
                />
                <RechartsTooltip content={<CustomBarChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
                />
                <Bar
                  dataKey="revenue"
                  name="Pendapatan"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="hpp"
                  name="Beban Pokok (HPP)"
                  stackId="expenses"
                  fill="#f59e0b"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="operatingExpenses"
                  name="Beban Operasional"
                  stackId="expenses"
                  fill="#e11d48"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Explanations & Insight Caption */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>Pendapatan: Akun 4001 (Omzet Penjualan)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              <span>Total Beban: Akun 5001 (HPP) + 6001-6005 (Beban Ops)</span>
            </span>
          </div>

          <span className="text-slate-400 font-mono text-[10px]">
            {annualSummary.bestMonth && annualSummary.bestMonth.revenue > 0 ? (
              <span>Puncak Omzet: {annualSummary.bestMonth.monthName} ({formatIDR(annualSummary.bestMonth.revenue)})</span>
            ) : (
              <span>Basis data transaksi SAK EMKM</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
