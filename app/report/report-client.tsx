"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { TrendLineChart, TopProductsBarChart, CategoryDonutChart } from "./svg-charts";
import DetailCell from "@/app/components/detail-cell";

// Helper to convert price/quantity to number safely
function toNum(v: number | string | undefined | null) {
  if (v === undefined || v === null) return 0;
  return typeof v === "number" ? v : Number(v);
}

// Helpers for dates
const YEARS = [2025, 2026, 2027, 2028];
const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

interface DailyOutRecord {
  out_id: number;
  out_date: string;
  total_selling_price: number | string;
  discount_amount: number | string;
  final_amount: number | string;
  total_profit: number | string;
  notes: string | null;
  daily_out_items: {
    item_id: number;
    quantity_out: number;
    line_total: number | string;
    inventory: {
      item_name: string;
      item_type: string;
    } | null;
  }[];
}

interface DailyReturnRecord {
  return_id: number;
  return_date: string;
  total_return_value: number | string;
  notes: string | null;
  daily_return_items: {
    item_id: number;
    quantity_returned: number;
    line_total: number | string;
    inventory: {
      item_name: string;
      item_type: string;
    } | null;
  }[];
}

interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type: string;
  weight_grams: number | string;
  purchase_price: number | string;
  selling_price: number | string;
  units_per_pack: number;
  stock_quantity: number;
}

export default function ReportClient() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-indexed

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aggregated data states
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalGrossSales, setTotalGrossSales] = useState(0);
  const [totalCogs, setTotalCogs] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [returnsCount, setReturnsCount] = useState(0);
  
  // Stock metrics
  const [stockValuationPurchase, setStockValuationPurchase] = useState(0);
  const [stockValuationSelling, setStockValuationSelling] = useState(0);
  const [stockTotalItems, setStockTotalItems] = useState(0);

  // Charts data
  const [trendData, setTrendData] = useState<{ day: number; sales: number; profit: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number }[]>([]);
  const [categoryStock, setCategoryStock] = useState<{ category: string; value: number }[]>([]);

  // Daily records list for auditing
  const [auditRecords, setAuditRecords] = useState<{
    date: string;
    sales: number;
    profit: number;
    returns: number;
    discount: number;
    notes: string[];
  }[]>([]);

  useEffect(() => {
    let isActive = true;

    async function fetchReportData() {
      setLoading(true);
      setError(null);

      try {
        const startDay = "01";
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const monthStr = String(selectedMonth).padStart(2, "0");
        const startDate = `${selectedYear}-${monthStr}-${startDay}`;
        const endDate = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

        // 1. Fetch Daily Outs
        const { data: outs, error: outsErr } = await supabase
          .from("daily_out")
          .select(`
            out_id,
            out_date,
            total_selling_price,
            discount_amount,
            final_amount,
            total_profit,
            notes,
            daily_out_items (
              item_id,
              quantity_out,
              line_total,
              inventory (
                item_name,
                item_type
              )
            )
          `)
          .gte("out_date", startDate)
          .lte("out_date", endDate)
          .order("out_date", { ascending: true });

        if (outsErr) throw outsErr;

        // 2. Fetch Daily Returns
        const { data: returns, error: returnsErr } = await supabase
          .from("daily_return")
          .select(`
            return_id,
            return_date,
            total_return_value,
            notes,
            daily_return_items (
              item_id,
              quantity_returned,
              line_total,
              inventory (
                item_name,
                item_type
              )
            )
          `)
          .gte("return_date", startDate)
          .lte("return_date", endDate)
          .order("return_date", { ascending: true });

        if (returnsErr) throw returnsErr;

        // 3. Fetch current inventory valuation
        const { data: inventory, error: invErr } = await supabase
          .from("inventory")
          .select("item_id, item_name, item_type, weight_grams, purchase_price, selling_price, units_per_pack, stock_quantity");

        if (invErr) throw invErr;

        if (!isActive) return;

        // ──────── PROCESSING DATA ────────
        
        const safeOuts = (outs ?? []) as unknown as DailyOutRecord[];
        const safeReturns = (returns ?? []) as unknown as DailyReturnRecord[];
        const safeInventory = (inventory ?? []) as unknown as InventoryItem[];

        // A. Summary Cards Calculations
        const salesSum = safeOuts.reduce((sum, r) => sum + toNum(r.final_amount), 0);
        const profitSum = safeOuts.reduce((sum, r) => sum + toNum(r.total_profit), 0);
        const returnsSum = safeReturns.reduce((sum, r) => sum + toNum(r.total_return_value), 0);
        const discountSum = safeOuts.reduce((sum, r) => sum + toNum(r.discount_amount), 0);
        const grossSalesSum = safeOuts.reduce((sum, r) => sum + toNum(r.total_selling_price), 0);
        const cogsSum = safeOuts.reduce((sum, r) => sum + (toNum(r.final_amount) - toNum(r.total_profit)), 0);

        setTotalSales(salesSum);
        setTotalProfit(profitSum);
        setTotalReturns(returnsSum);
        setTotalDiscount(discountSum);
        setTotalGrossSales(grossSalesSum);
        setTotalCogs(cogsSum);
        setSalesCount(safeOuts.length);
        setReturnsCount(safeReturns.length);

        // B. Stock Valuation Calculations
        const stockPurchaseVal = safeInventory.reduce((sum, item) => sum + (toNum(item.stock_quantity) * toNum(item.purchase_price)), 0);
        const stockSellingVal = safeInventory.reduce((sum, item) => sum + (toNum(item.stock_quantity) * toNum(item.selling_price)), 0);
        
        setStockValuationPurchase(stockPurchaseVal);
        setStockValuationSelling(stockSellingVal);
        setStockTotalItems(safeInventory.length);

        // C. Daily Trend Array (1 to lastDay)
        const dailyTrendMap: Record<number, { sales: number; profit: number }> = {};
        for (let d = 1; d <= lastDay; d++) {
          dailyTrendMap[d] = { sales: 0, profit: 0 };
        }

        safeOuts.forEach((r) => {
          const day = new Date(r.out_date).getDate();
          if (dailyTrendMap[day]) {
            dailyTrendMap[day].sales += toNum(r.final_amount);
            dailyTrendMap[day].profit += toNum(r.total_profit);
          }
        });

        const trendArray = Object.keys(dailyTrendMap).map((d) => ({
          day: Number(d),
          sales: dailyTrendMap[Number(d)].sales,
          profit: dailyTrendMap[Number(d)].profit,
        }));
        setTrendData(trendArray);

        // D. Top Products Sold (Aggregate from out items)
        const productQtyMap: Record<string, number> = {};
        safeOuts.forEach((r) => {
          r.daily_out_items.forEach((item) => {
            if (item.inventory) {
              const name = item.inventory.item_name;
              productQtyMap[name] = (productQtyMap[name] || 0) + toNum(item.quantity_out);
            }
          });
        });

        const sortedProducts = Object.keys(productQtyMap)
          .map((name) => ({ name, quantity: productQtyMap[name] }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        setTopProducts(sortedProducts);

        // E. Category Stock Distribution (Grouped by Product Name)
        const catValMap: Record<string, number> = {};
        safeInventory.forEach((item) => {
          const cat = item.item_name;
          const val = toNum(item.stock_quantity) * toNum(item.purchase_price);
          catValMap[cat] = (catValMap[cat] || 0) + val;
        });

        const sortedCats = Object.keys(catValMap)
          .map((category) => ({
            category,
            value: catValMap[category],
          }))
          .sort((a, b) => b.value - a.value);

        let finalStockArray = sortedCats;
        if (sortedCats.length > 8) {
          const top7 = sortedCats.slice(0, 7);
          const othersVal = sortedCats.slice(7).reduce((sum, item) => sum + item.value, 0);
          finalStockArray = [...top7, { category: "Others", value: othersVal }];
        }
        setCategoryStock(finalStockArray);

        // F. Audit Table: Group daily records
        const auditMap: Record<string, { date: string; sales: number; profit: number; returns: number; discount: number; notes: string[] }> = {};
        
        safeOuts.forEach((r) => {
          const date = r.out_date;
          if (!auditMap[date]) {
            auditMap[date] = { date, sales: 0, profit: 0, returns: 0, discount: 0, notes: [] };
          }
          auditMap[date].sales += toNum(r.final_amount);
          auditMap[date].profit += toNum(r.total_profit);
          auditMap[date].discount += toNum(r.discount_amount);
          if (r.notes) auditMap[date].notes.push(r.notes);
        });

        safeReturns.forEach((r) => {
          const date = r.return_date;
          if (!auditMap[date]) {
            auditMap[date] = { date, sales: 0, profit: 0, returns: 0, discount: 0, notes: [] };
          }
          auditMap[date].returns += toNum(r.total_return_value);
          if (r.notes) auditMap[date].notes.push(`Return: ${r.notes}`);
        });

        const auditArray = Object.values(auditMap).sort((a, b) => b.date.localeCompare(a.date));
        setAuditRecords(auditArray);

        setLoading(false);
      } catch (err: any) {
        console.error("Error generating report:", err);
        if (isActive) {
          setError(err.message || "An unexpected error occurred while loading data.");
          setLoading(false);
        }
      }
    }

    fetchReportData();
    return () => {
      isActive = false;
    };
  }, [selectedYear, selectedMonth]);

  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--dms-primary)]/30 border-t-[var(--dms-primary)]" />
          <p className="text-sm text-[var(--dms-text-muted)]">Generating monthly report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--dms-danger-muted)] bg-[var(--dms-danger-muted)]/10 p-5 text-center">
        <svg className="mx-auto h-8 w-8 text-[var(--dms-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="mt-3 text-sm font-semibold text-[var(--dms-danger)]">{error}</p>
        <button
          onClick={() => {
            // Trigger state change to reload
            setSelectedMonth((m) => m);
          }}
          className="mt-4 rounded-xl bg-[var(--dms-danger)] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Print Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface)] p-3 sm:p-4 print:hidden">
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-3 py-2.5 text-sm font-medium text-[var(--dms-text)] outline-none transition focus:border-[var(--dms-primary)]/50"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-3 py-2.5 text-sm font-medium text-[var(--dms-text)] outline-none transition focus:border-[var(--dms-primary)]/50"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Print button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-hover-bg)] px-4 text-sm font-semibold text-[var(--dms-text-secondary)] transition hover:bg-[var(--dms-hover-bg-strong)] hover:text-[var(--dms-text)] active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Sales Card */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 shadow-sm transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Monthly Sales</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-primary-muted)] text-[var(--dms-primary)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-[var(--dms-text)]">
            Rs. {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--dms-text-muted)]">
            From {salesCount} shipments
          </p>
        </div>

        {/* Net Profit Card */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 shadow-sm transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Net Profit</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-primary-muted)] text-[var(--dms-primary)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-[var(--dms-primary)]">
            Rs. {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--dms-text-muted)]">
            Margin: <span className="font-semibold text-[var(--dms-text-secondary)]">{profitMargin.toFixed(1)}%</span>
          </p>
        </div>

        {/* Returns Card */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 shadow-sm transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Returned Value</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-danger-muted)] text-[var(--dms-danger)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-[var(--dms-warning)]">
            Rs. {totalReturns.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--dms-text-muted)]">
            Rate: <span className="font-semibold text-[var(--dms-text-secondary)]">{returnRate.toFixed(1)}%</span> of Sales
          </p>
        </div>

        {/* Total Discounts Card */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 shadow-sm transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Discounts</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-danger-muted)] text-[var(--dms-danger)] font-semibold">
              <span className="text-xs">Rs.</span>
            </div>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-[var(--dms-danger)]">
            Rs. {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--dms-text-muted)]">
            Offered to retail shops
          </p>
        </div>

        {/* Stock Valuation Card */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 shadow-sm transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Stock Asset Cost</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-primary-muted)] text-[var(--dms-primary)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-[var(--dms-text)]">
            Rs. {stockValuationPurchase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--dms-text-muted)]">
            Revenue: <span className="font-semibold text-[var(--dms-text-secondary)]">Rs. {stockValuationSelling.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales & Profit line chart - spans 2 columns on large screens */}
        <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface)] p-4 lg:col-span-2 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dms-input-border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--dms-text)]">Sales & Profit Trend</h2>
              <p className="text-xs text-[var(--dms-text-muted)]">Daily accumulation of sales and profit over the month.</p>
            </div>
            {/* Chart Legend indicators */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-[var(--dms-text-secondary)] font-medium">
                <span className="inline-block h-3 w-3 rounded bg-[var(--dms-primary)]" />
                Sales
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--dms-text-secondary)] font-medium">
                <span className="inline-block h-3 w-3 rounded bg-[var(--dms-warning)]" />
                Profit
              </span>
            </div>
          </div>
          
          <TrendLineChart data={trendData} />
        </div>

        {/* Stock Value by Product (Pie Chart) */}
        <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface)] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--dms-text)] border-b border-[var(--dms-input-border)] pb-3">Stock Value by Product</h2>
            <p className="text-xs text-[var(--dms-text-muted)] mt-1.5 mb-4">Stock asset distribution by product name.</p>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <CategoryDonutChart data={categoryStock} />
          </div>
        </div>

        {/* Top Selling Products chart - spans full width on mobile, 2 columns on large screens */}
        <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface)] p-4 lg:col-span-3 shadow-sm">
          <h2 className="text-base font-bold text-[var(--dms-text)] border-b border-[var(--dms-input-border)] pb-3">Top 5 Selling Products</h2>
          <p className="text-xs text-[var(--dms-text-muted)] mt-1.5 mb-4">Products with the highest sales quantities during this month.</p>
          
          <TopProductsBarChart data={topProducts} />
        </div>
      </div>

      {/* Monthly Financial Summary Card */}
      <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface)] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[var(--dms-text)] border-b border-[var(--dms-input-border)] pb-3">Monthly Financial Summary</h2>
        <p className="text-xs text-[var(--dms-text-muted)] mt-1.5 mb-4">A complete breakdown of revenues, costs, discounts, and margins.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detailed Financial Ledger */}
          <div className="space-y-3 rounded-xl bg-[var(--dms-hover-bg)]/20 p-4 border border-[var(--dms-card-border)]/50">
            <div className="flex justify-between text-sm py-1 border-b border-[var(--dms-input-border)]/30">
              <span className="text-[var(--dms-text-secondary)]">Gross Sales Revenue</span>
              <span className="font-mono font-medium text-[var(--dms-text)]">Rs. {totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-[var(--dms-input-border)]/30">
              <span className="text-[var(--dms-text-secondary)]">Total Discounts Allowed</span>
              <span className="font-mono font-medium text-[var(--dms-danger)]">- Rs. {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm py-1 font-semibold border-b border-[var(--dms-input-border)]/60">
              <span className="text-[var(--dms-text)]">Net Sales Revenue</span>
              <span className="font-mono text-[var(--dms-primary)]">Rs. {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-[var(--dms-input-border)]/30">
              <span className="text-[var(--dms-text-secondary)]">Cost of Goods Sold (COGS)</span>
              <span className="font-mono font-medium text-[var(--dms-text)]">Rs. {totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm py-1 font-bold text-[var(--dms-primary)] pt-2">
              <span>Net Profit</span>
              <span className="font-mono">Rs. {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Key Ratios and Performance Indicators */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[var(--dms-hover-bg)]/40 p-3 border border-[var(--dms-card-border)]/30">
                <p className="text-[10px] uppercase font-semibold text-[var(--dms-text-muted)]">Profit Margin</p>
                <p className="text-xl font-mono font-bold text-[var(--dms-primary)] mt-1">{profitMargin.toFixed(2)}%</p>
                <p className="text-[9px] text-[var(--dms-text-muted)] mt-1">Ratio of net profit to net sales</p>
              </div>
              <div className="rounded-lg bg-[var(--dms-hover-bg)]/40 p-3 border border-[var(--dms-card-border)]/30">
                <p className="text-[10px] uppercase font-semibold text-[var(--dms-text-muted)]">Discount Rate</p>
                <p className="text-xl font-mono font-bold text-[var(--dms-danger)] mt-1">
                  {totalGrossSales > 0 ? ((totalDiscount / totalGrossSales) * 100).toFixed(2) : "0.00"}%
                </p>
                <p className="text-[9px] text-[var(--dms-text-muted)] mt-1">Discount portion of gross sales</p>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--dms-hover-bg)]/40 p-3 border border-[var(--dms-card-border)]/30">
              <p className="text-[10px] uppercase font-semibold text-[var(--dms-text-muted)]">Monthly Summary Notes</p>
              <p className="text-xs text-[var(--dms-text-secondary)] mt-1 leading-relaxed">
                During this period, the system processed <span className="font-semibold text-[var(--dms-text)]">{salesCount}</span> sales deliveries. 
                Discounts totaling <span className="font-mono font-semibold text-[var(--dms-danger)]">Rs. {totalDiscount.toFixed(0)}</span> were offered. 
                Returns costed <span className="font-mono font-semibold text-[var(--dms-warning)]">Rs. {totalReturns.toFixed(0)}</span>, which represents a return rate of <span className="font-semibold text-[var(--dms-text)]">{returnRate.toFixed(2)}%</span> against total sales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit & Transaction Log Table */}
      <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface)] p-4 shadow-sm">
        <h2 className="text-base font-bold text-[var(--dms-text)] border-b border-[var(--dms-input-border)] pb-3">Daily Summary Log</h2>
        <p className="text-xs text-[var(--dms-text-muted)] mt-1.5 mb-4">Daily breakdown of transactions, returns, and profits for auditing.</p>

        {auditRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--dms-text-muted)]">
            No transaction history recorded in {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--dms-input-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--dms-input-border)] bg-[var(--dms-hover-bg)] font-semibold text-[var(--dms-text-secondary)]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Sales Revenue</th>
                  <th className="px-4 py-3 text-right">Discounts</th>
                  <th className="px-4 py-3 text-right">Net Profit</th>
                  <th className="px-4 py-3 text-right">Returns</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--dms-input-border)]/40">
                {auditRecords.map((r, idx) => {
                  const dateObj = new Date(r.date);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={idx} className="transition-colors hover:bg-[var(--dms-hover-bg)]/30">
                      <td className="px-4 py-3 font-medium text-[var(--dms-text)] whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--dms-text-secondary)]">
                        Rs. {r.sales.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--dms-danger)]">
                        {r.discount > 0 ? `Rs. ${r.discount.toFixed(2)}` : "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        r.profit > 0 
                          ? "text-[var(--dms-primary)]" 
                          : r.profit === 0 
                            ? "text-[var(--dms-text-muted)]" 
                            : "text-[var(--dms-danger)]"
                      }`}>
                        Rs. {r.profit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--dms-warning)]">
                        {r.returns > 0 ? `Rs. ${r.returns.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--dms-text-muted)] max-w-xs truncate">
                        {r.notes.length > 0 ? r.notes.join(" | ") : "—"}
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
  );
}
