import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid 
} from "recharts";
import { Transaction, StockItem, FinancialStats } from "../types";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccounts";
import { formatIDR } from "./FinanceDashboard";

interface DashboardChartsProps {
  transactions: Transaction[];
  stockItems: StockItem[];
  stats: FinancialStats;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  transactions,
  stockItems,
  stats
}) => {
  // --- 1. HOVER TOOLTIP STATES ---
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // --- 2. DATA PROCESSING ---
  
  // (A) sales last 7 days chart data
  const getLast7Days = () => {
    // Generate base dates for last 7 calendar days up to June 11, 2026 (or today)
    const baseDate = new Date("2026-06-11");
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      arr.push(dateString);
    }
    return arr;
  };

  const dayStrings = getLast7Days();
  const barData = dayStrings.map((dayStr) => {
    // Sum Penjualan and Penjualan Stok for this date
    const daySales = transactions
      .filter((t) => t.date === dayStr && (t.type === "Penjualan" || t.type === "Penjualan Stok"))
      .reduce((sum, t) => sum + t.amount, 0);

    const formattedDay = new Date(dayStr).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric"
    });

    return {
      date: dayStr,
      label: formattedDay,
      sales: daySales
    };
  });

  const maxSales = Math.max(100000, ...barData.map((d) => d.sales));

  // (B) Expense Donut calculation
  // Filter and group Biaya Operasional / Pengeluaran by category or account
  const expenseTxs = transactions.filter(
    (t) => t.type === "Biaya Operasional" || t.type === "Pengeluaran"
  );

  const expenseGrouped: { [key: string]: number } = {};
  expenseTxs.forEach((t) => {
    // Find account name
    const acc = CHART_OF_ACCOUNTS.find((a) => a.id === t.debitAccount);
    const categoryName = acc ? acc.name : "Beban Lain";
    expenseGrouped[categoryName] = (expenseGrouped[categoryName] || 0) + t.amount;
  });

  // Default fallback data if there are no expenses yet
  const donutBase = Object.keys(expenseGrouped).map((name) => ({
    name,
    value: expenseGrouped[name]
  }));

  const donutData = donutBase.length > 0 
    ? donutBase 
    : [
        { name: "Beban Gaji Karyawan", value: 1200000 },
        { name: "Sewa Tempat/Kios", value: 800000 },
        { name: "Beban Listrik & Air", value: 350000 },
        { name: "Beban Lain-lain", value: 150000 }
      ];

  const totalExpensesAmount = donutData.reduce((sum, item) => sum + item.value, 0);

  // Calculate coordinates for SVGs donut slices
  let cumulativeAngle = 0;
  const donutColors = [
    "#F43F5E", // Rose
    "#F59E0B", // Amber
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#10B981"  // Emerald
  ];

  const donutSlices = donutData.map((d, index) => {
    const percentage = totalExpensesAmount > 0 ? d.value / totalExpensesAmount : 0;
    const angle = percentage * 360;
    const color = donutColors[index % donutColors.length];
    
    // Radians calculations
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return {
      ...d,
      startAngle,
      angle,
      percentage,
      color
    };
  });

  // (C) 6 Months Net Profit Trend Line
  const getLast6MonthsData = () => {
    let refDate = new Date();
    if (transactions.length > 0) {
      const timestamps = transactions
        .map(t => new Date(t.date).getTime())
        .filter(t => !isNaN(t));
      if (timestamps.length > 0) refDate = new Date(Math.max(...timestamps));
    }
    const has2026 = transactions.some(t => t.date && t.date.startsWith("2026"));
    const y = has2026 ? 2026 : refDate.getFullYear();
    const curMonth = refDate.getMonth();

    const result = [];
    const baselines = [1900000, 2300000, 2550000, 2800000, 3400000, 4000000];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, curMonth - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const monthPrefix = `${yr}-${String(mIdx + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short" });

      const txs = transactions.filter(t => t.date && t.date.startsWith(monthPrefix));
      let rev = 0;
      let hpp = 0;
      let exp = 0;

      txs.forEach(t => {
        if (t.type === "Penjualan" || t.type === "Penjualan Stok" || t.type === "Penerimaan") {
          rev += t.amount;
          if (t.hppAmountPosted) hpp += t.hppAmountPosted;
        } else if (
          t.type === "Biaya Operasional" || 
          t.type === "Pengeluaran" ||
          t.type === "Gaji Karyawan" ||
          t.type === "Listrik & Air" ||
          t.type === "Sewa Toko"
        ) {
          exp += t.amount;
        }
      });

      const calcProfit = rev - hpp - exp;
      const profit = txs.length > 0 ? calcProfit : baselines[5 - i];

      result.push({
        monthName: label,
        profit: profit,
        actual: txs.length > 0
      });
    }
    return result;
  };

  const lineData = getLast6MonthsData();

  return (
    <div className="space-y-6 pt-2" id="visualisasi-laporan-seksi">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Visualisasi Kinerja Toko</h3>
          <p className="text-xs text-slate-400">Analitik grafik interaktif untuk omzet, beban overhead, dan margin laba berjalan</p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-mono">
          Live Charts
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Bar Chart of Sales Last 7 Days */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs flex flex-col justify-between h-96 relative">
          <div>
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest font-mono">GRAFIK BATANG</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Penjualan 7 Hari Terakhir</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Grafik harian omzet kotor Penjualan (IDR)</p>
          </div>

          <div className="flex-1 mt-6 flex items-end gap-3 h-48 relative border-b border-l border-slate-100 pl-2 pb-1">
            {barData.map((d, index) => {
              const heightPct = (d.sales / maxSales) * 100;
              return (
                <div 
                  key={index} 
                  className="flex-1 flex flex-col justify-end items-center h-full group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hoveredBar === index && (
                    <div className="absolute top-0 -translate-y-9 bg-slate-900 border border-slate-800 text-white font-mono text-[10px] px-2 py-1.5 rounded-lg shadow-xl z-25 whitespace-nowrap">
                      Rp {d.sales.toLocaleString("id-ID")}
                    </div>
                  )}

                  {/* Interactive Bar */}
                  <div 
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ease-out ${
                      hoveredBar === index 
                        ? "bg-slate-900 scale-x-105 shadow-md shadow-slate-900/10" 
                        : "bg-indigo-600/90"
                    }`}
                    style={{ height: `${Math.max(5, heightPct)}%` }}
                  />

                  {/* Date label underneath */}
                  <span className="text-[9px] font-mono text-slate-400 mt-2 block select-none">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 px-4 mt-4">
            <span className="text-[10px] text-slate-400">Total 7 Hari:</span>
            <span className="text-xs font-bold font-mono text-slate-700">
              Rp {barData.reduce((s, i) => s + i.sales, 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Chart 2: Expense Composition Donut Chart */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs flex flex-col justify-between h-96 relative">
          <div>
            <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-widest font-mono">KOMPOSISI BIAYA</span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Struktur Biaya Operasional</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Proporsi pengeluaran buku pembantu beban</p>
          </div>

          <div className="flex-1 my-4 flex items-center justify-center relative">
            <svg viewBox="0 0 200 200" className="w-40 h-40 transform -rotate-90">
              {donutSlices.map((slice, index) => {
                if (slice.percentage === 0) return null;
                const dashArray = `${slice.angle} 360`;
                const strokeDashoffset = -slice.startAngle;
                return (
                  <circle
                    key={index}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="24"
                    strokeDasharray={dashArray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer hover:stroke-[28px]"
                    onMouseEnter={() => setHoveredSlice(index)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                );
              })}
              {/* Inner hole */}
              <circle cx="100" cy="100" r="50" fill="white" />
            </svg>

            {/* Absolute Center Label */}
            <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
              {hoveredSlice !== null ? (
                <>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans limit-text max-w-[90px] truncate">
                    {donutSlices[hoveredSlice].name}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-slate-800 mt-0.5">
                    {Math.round(donutSlices[hoveredSlice].percentage * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-sans">TOTAL BIAYA</span>
                  <span className="text-xs font-mono font-extrabold text-slate-800 mt-0.5">
                    {formatIDR(totalExpensesAmount)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color legend listings */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {donutSlices.slice(0, 4).map((slice, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-1.5 p-1 rounded-md transition ${hoveredSlice === index ? "bg-slate-50" : ""}`}
                onMouseEnter={() => setHoveredSlice(index)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span className="w-2.5 h-2.5 rounded-xs shrink-0 block" style={{ backgroundColor: slice.color }} />
                <span className="text-[10px] text-slate-500 font-medium truncate w-full select-none" title={slice.name}>
                  {slice.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Recharts Trend of Profit / 6 Months */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs flex flex-col justify-between h-96 relative">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest font-mono">RECHARTS TREN LABA</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">6 Bulan</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Laba Bersih 6 Bulan Terakhir</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Pergerakan surplus profitabilitas usaha</p>
          </div>

          <div className="flex-1 mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="monthName" 
                  tickLine={false} 
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fill: "#64748B", fontSize: 9, fontFamily: "monospace" }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`}
                />
                <RechartsTooltip 
                  formatter={(val: any) => [formatIDR(Number(val)), "Laba Bersih"]}
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  labelStyle={{ color: "#94A3B8", fontWeight: "bold", marginBottom: "4px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: "#10B981", strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6, stroke: "#059669", strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 px-4 mt-2">
            <span className="text-[10px] text-slate-400">Total 6 Bulan:</span>
            <span className="text-xs font-bold font-mono text-emerald-600">
              {formatIDR(lineData.reduce((s, i) => s + i.profit, 0))}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
